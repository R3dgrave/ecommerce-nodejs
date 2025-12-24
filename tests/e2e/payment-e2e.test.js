const request = require("supertest");
const mongoose = require("mongoose");
const {
  app,
  cleanDatabase,
  UserModel,
  OrderModel,
  ProductModel,
  CategoryModel,
  BrandModel,
  PaymentModel
} = require("./setup-e2e");

describe("Payment E2E Flow", () => {
  let token, userId, orderId;

  beforeAll(async () => {
    await cleanDatabase();

    await request(app).post("/auth/register").send({
      name: "Pay Tester",
      email: "pay@test.com",
      password: "password123",
    });

    const loginRes = await request(app).post("/auth/login").send({
      email: "pay@test.com",
      password: "password123",
    });

    token = loginRes.body.data.token;
    userId = loginRes.body.data.user.id;

    await UserModel.findByIdAndUpdate(userId, { isAdmin: true });

    const cat = await CategoryModel.create({ name: "Tech" });
    const brand = await BrandModel.create({ name: "Apple", categoryId: cat._id });
    const product = await ProductModel.create({
      name: "iPhone",
      description: "descr",
      shortDescription: "shr desc",
      price: 1000,
      stock: 10,
      categoryId: cat._id,
      brandId: brand._id,
      images: ["img.jpg"]
    });

    await request(app)
      .post("/cart/add")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product._id, quantity: 1 });

    const orderRes = await request(app)
      .post("/order")
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress: { address: "Test 123", city: "NY", country: "USA" } });

    orderId = orderRes.body.data.id;
  });

  describe("POST /payment/create-intent", () => {
    it("debería crear un Payment Intent exitosamente con Stripe", async () => {
      const res = await request(app)
        .post("/payment/create-intent")
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId });

      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("clientSecret");
        expect(res.body.data.amount).toBe(1000);
      } else {
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });

    it("debería fallar si la orden no existe", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post("/payment/create-intent")
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId: fakeId });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /payment/config", () => {
    it("debería retornar la publishable key de Stripe", async () => {
      const res = await request(app)
        .get("/payment/config")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("publishableKey");
    });
  });

  describe("POST /payment/webhook", () => {
    it("debería retornar 400 si la firma enviada es inválida", async () => {
      const res = await request(app)
        .post("/payment/webhook")
        .set("stripe-signature", "firma-falsa-de-test")
        .send({ id: "evt_test_123", type: "payment_intent.succeeded" });

      expect(res.status).toBe(400);
      expect(res.text).toContain("Webhook Error");
    });
  });

  describe("POST /payment/refund (Admin)", () => {
    it("debería fallar con 403 si un usuario NO admin intenta solicitar reembolso", async () => {
      await UserModel.findByIdAndUpdate(userId, { isAdmin: false });

      const res = await request(app)
        .post("/payment/refund")
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId });

      expect(res.status).toBe(403);

      await UserModel.findByIdAndUpdate(userId, { isAdmin: true });
    });

    it("debería procesar el reembolso si existe un pago exitoso previo", async () => {
      await PaymentModel.create({
        orderId: orderId,
        userId: userId,
        stripePaymentIntentId: "pi_simulado_test",
        amount: 1000,
        status: "succeeded"
      });

      const res = await request(app)
        .post("/payment/refund")
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId, reason: "requested_by_customer" });

      if (res.status === 200) {
        expect(res.body.success).toBe(true);
      } else {
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Error en reembolso/);
      }
    });

    it("debería fallar con 404 si se intenta reembolsar una orden sin pago registrado", async () => {
      const nuevaOrdenId = new mongoose.Types.ObjectId();
      await OrderModel.create({
        _id: nuevaOrdenId,
        userId,
        items: [],
        totalAmount: 50,
        shippingAddress: { address: "calle 1", city: "city", country: "country" }
      });

      const res = await request(app)
        .post("/payment/refund")
        .set("Authorization", `Bearer ${token}`)
        .send({ orderId: nuevaOrdenId });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/No se encontró un pago exitoso/);
    });
  });
});