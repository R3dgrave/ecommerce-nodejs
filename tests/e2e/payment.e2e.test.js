const request = require("supertest");
const mongoose = require("mongoose");
const sinon = require("sinon");
const { app, closeDatabase, cleanDatabase } = require("./setup.e2e");
const User = require("../../src/models/user");

const ProductRepository = require("../../src/repositories/product-repository");
const BrandRepository = require("../../src/repositories/brand-repository");
const CategoryRepository = require("../../src/repositories/category-repository");
const productRepo = new ProductRepository();

let userToken;
let adminToken;
let existingCategoryId;
let existingBrandId;
let existingOrderId;

const MOCK_USER = {
  email: "customer-pay@test.com",
  password: "password123",
  name: "Customer User",
};

const MOCK_ADMIN = {
  email: "admin-pay@test.com",
  password: "password123",
  name: "Admin User",
  isAdmin: true,
};

beforeAll(async () => {
  await cleanDatabase();

  await request(app).post("/auth/register").send(MOCK_USER);
  await request(app).post("/auth/register").send(MOCK_ADMIN);
  const user = await User.findOne({ email: MOCK_ADMIN.email });
  user.isAdmin = true;
  await user.save();

  const loginUser = await request(app)
    .post("/auth/login")
    .send({ email: MOCK_USER.email, password: MOCK_USER.password });
  userToken = loginUser.body.data.token;

  const loginAdmin = await request(app)
    .post("/auth/login")
    .send({ email: MOCK_ADMIN.email, password: MOCK_ADMIN.password });
  adminToken = loginAdmin.body.data.token;

  const catRes = await request(app)
    .post("/category")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "electronics product test" });

  existingCategoryId = catRes.body.result._id || catRes.body.result.id;

  const brandRes = await request(app)
    .post("/brand")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "sony product test", categoryId: existingCategoryId });

  if (!brandRes.body.result) {
    throw new Error(
      `Fallo setup Producto: No se pudo crear la marca. Error: ${JSON.stringify(
        brandRes.body
      )}`
    );
  }

  existingBrandId = brandRes.body.result._id || brandRes.body.result.id;

  const product = await productRepo.save({
    name: "Producto Test",
    shortDescription: "Short desc",
    description: "Long desc",
    price: 100,
    stock: 10,
    categoryId: existingBrandId,
    brandId: existingCategoryId,
  });

  await request(app)
    .post("/cart/add")
    .set("Authorization", `Bearer ${userToken}`)
    .send({
      productId: product._id,
      quantity: 1,
    });

  const orderRes = await request(app)
    .post("/order")
    .set("Authorization", `Bearer ${userToken}`)
    .send({
      shippingAddress: {
        address: "Calle Falsa 123",
        city: "Springfield",
        country: "USA",
      },
    });

  if (orderRes.status !== 201) {
    console.error("Error detallado:", orderRes.body);
  }

  existingOrderId = orderRes.body.data._id;
});

afterAll(async () => {
  await closeDatabase();
});

describe("E2E: /payment routes", () => {
  describe("POST /payment/create-intent", () => {
    it("debería crear un PaymentIntent exitosamente (Status 200)", async () => {
      const res = await request(app)
        .post("/payment/create-intent")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ orderId: existingOrderId });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("clientSecret");
      expect(res.body.data.amount).toBeGreaterThan(0);
    });

    it("debería fallar con 404 si la orden no existe", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post("/payment/create-intent")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ orderId: fakeId });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toMatch(/no existe/);
    });
  });

  describe("POST /payment/webhook (Simulación)", () => {
    it("debería retornar 400 si la firma de Stripe es inválida", async () => {
      const consoleSpy = sinon.stub(console, "error");
      const res = await request(app)
        .post("/payment/webhook")
        .set("stripe-signature", "firma-falsa")
        .send({ id: "evt_test" });

      expect(res.statusCode).toBe(400);
      expect(res.text).toContain("Webhook Error");
      expect(consoleSpy.calledOnce).toBe(true);
      consoleSpy.restore();
    });
  });

  describe("POST /payment/refund (Admin)", () => {
    it("debería fallar con 401 si un usuario no admin intenta reembolsar", async () => {
      const res = await request(app)
        .post("/payment/refund")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ orderId: existingOrderId });

      expect(res.statusCode).toBe(403);
    });

    it("debería fallar con 404 si no hay un pago exitoso previo para reembolsar", async () => {
      const res = await request(app)
        .post("/payment/refund")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ orderId: existingOrderId, reason: "requested_by_customer" });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toMatch(/No se encontró un pago exitoso/);
    });
  });
});
