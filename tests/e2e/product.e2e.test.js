const request = require("supertest");
const mongoose = require("mongoose");
const { app, closeDatabase, cleanDatabase } = require("./setup.e2e");

const User = require("../../src/models/user");

let adminToken;
let existingCategoryId;
let existingBrandId;
let newProductId;

const MOCK_CATEGORY_NAME = "electronics product test";
const MOCK_BRAND_NAME = "sony product test";
const MOCK_PRODUCT_NAME = "playStation 5 e2e";

const MOCK_ADMIN_USER = {
  email: "admin-product-e2e@test.com",
  password: "securepassword456",
  name: "Admin Product",
  isAdmin: true,
};

beforeAll(async () => {
  await cleanDatabase();

  await request(app).post("/auth/register").send(MOCK_ADMIN_USER);
  const user = await User.findOne({ email: MOCK_ADMIN_USER.email });
  user.isAdmin = true;
  await user.save();

  const loginRes = await request(app).post("/auth/login").send({
    email: MOCK_ADMIN_USER.email,
    password: MOCK_ADMIN_USER.password,
  });

  adminToken = loginRes.body.data.token;

  const catRes = await request(app)
    .post("/category")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: MOCK_CATEGORY_NAME });

  const catData = catRes.body.data
  existingCategoryId = catData.id;

  const brandRes = await request(app)
    .post("/brand")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: MOCK_BRAND_NAME, categoryId: existingCategoryId });

  const brandData = brandRes.body.data
  if (!brandData) {
    throw new Error(`Fallo setup Producto: ${JSON.stringify(brandRes.body)}`);
  }
  existingBrandId = brandData.id;
});

afterAll(async () => {
  await closeDatabase();
});

describe("E2E: /product routes", () => {
  const productData = {
    name: MOCK_PRODUCT_NAME,
    price: 499.99,
    stock: 50,
    shortDescription: "Un resumen de la consola de juegos de nueva generación.",
    description: "Next-gen gaming console.",
    categoryId: null,
    brandId: null,
  };

  describe("POST /product (Admin)", () => {
    beforeEach(() => {
      productData.categoryId = existingCategoryId;
      productData.brandId = existingBrandId;
    });

    it("debería crear un producto exitosamente (Status 201)", async () => {
      const res = await request(app)
        .post("/product")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(productData);

      expect(res.statusCode).toBe(201);
      const resData = res.body.data
      expect(resData.name).toBe(MOCK_PRODUCT_NAME);
      
      newProductId = resData.id;
    });

    it("debería fallar con 409 si el nombre ya existe", async () => {
      const res = await request(app)
        .post("/product")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(productData);

      expect(res.statusCode).toBe(409);
    });

    it("debería fallar con 404 si la categoría no existe", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post("/product")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...productData, categoryId: fakeId, name: "Other name" });

      expect(res.statusCode).toBe(404);
    });
  });

  describe("GET /product (Público)", () => {
    it("debería obtener la lista paginada y poblada", async () => {
      const res = await request(app).get("/product?page=1&limit=10");
      expect(res.statusCode).toBe(200);

      const resData = res.body.data
      expect(resData.totalCount).toBeGreaterThanOrEqual(1);
      
      const product = resData.data[0];

      expect(product.categoryId.name).toBe(MOCK_CATEGORY_NAME);
      expect(product.brandId.name).toBe(MOCK_BRAND_NAME);
    });

    it("debería filtrar por brandId", async () => {
      const res = await request(app).get(`/product?brandId=${existingBrandId}`);
      expect(res.statusCode).toBe(200);
      
      const resData = res.body.data
      expect(resData.data[0].brandId.id.toString()).toBe(existingBrandId.toString());
    });
  });

  describe("GET /product/:id", () => {
    it("debería obtener detalle por ID", async () => {
      const res = await request(app).get(`/product/${newProductId}`);
      expect(res.statusCode).toBe(200);
      
      const resData = res.body.data
      expect(resData.name).toBe(MOCK_PRODUCT_NAME);
    });
  });

  describe("PUT /product/:id", () => {
    it("debería actualizar nombre y precio", async () => {
      const update = { name: "PS5 Slim Version", price: 399 };
      const res = await request(app)
        .put(`/product/${newProductId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(update);

      expect(res.statusCode).toBe(200);
      const resData = res.body.data
      expect(resData.name).toBe(update.name);
    });

    it("debería fallar si el body está vacío", async () => {
      const res = await request(app)
        .put(`/product/${newProductId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});
      
      expect(res.statusCode).toBe(400);
    });
  });

  describe("DELETE /product/:id", () => {
    it("debería eliminar el producto", async () => {
      const res = await request(app)
        .delete(`/product/${newProductId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);

      const check = await request(app).get(`/product/${newProductId}`);
      expect(check.statusCode).toBe(404);
    });
  });
});