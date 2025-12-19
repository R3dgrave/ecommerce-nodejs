const mongoose = require('mongoose');
const request = require("supertest");
const { app, closeDatabase, cleanDatabase } = require("./setup.e2e");
const Product = require('../../src/models/product');
const Category = require('../../src/models/category');
const Brand = require('../../src/models/brand');
const Cart = require('../../src/models/cart');
const User = require('../../src/models/user');

describe("E2E: Cart Flow", () => {
  let userToken, productId;

  beforeAll(async () => {
    await cleanDatabase();

    const category = await Category.create({ name: "Test Category Cart" });
    const brand = await Brand.create({
      name: "Test Brand Cart",
      categoryId: category._id
    });

    await request(app).post('/auth/register').send({
      name: "Customer",
      email: "customer@test.com",
      password: "password123"
    });

    const loginRes = await request(app).post('/auth/login').send({
      email: "customer@test.com",
      password: "password123"
    });
    userToken = loginRes.body.data.token;

    // 4. Crear un producto vinculado a la marca/categoría real
    const product = await Product.create({
      name: "Cart Test Item",
      price: 50,
      stock: 5,
      shortDescription: "Short desc",
      description: "Long desc",
      categoryId: category._id,
      brandId: brand._id
    });
    productId = product._id;
  });

  afterAll(async () => {
    await Cart.deleteMany({});
    await closeDatabase();
  });

  // Test 1: Stock insuficiente
  it("POST /cart/add - Debería fallar por stock insuficiente (status 400)", async () => {
    const res = await request(app)
      .post("/cart/add")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 10 });

    expect(res.statusCode).toBe(400);
  });

  // Test 2: Añadir con éxito
  it("POST /cart/add - Debería añadir producto exitosamente", async () => {
    const payload = JSON.parse(Buffer.from(userToken.split('.')[1], 'base64').toString());
    const userId = payload.id;
    await Cart.deleteMany({ userId });

    const res = await request(app)
      .post("/cart/add")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 2 });

    expect(res.statusCode).toBe(200);
    expect(res.body.result.items.length).toBe(1);
    expect(res.body.result.items[0].quantity).toBe(2);
  });

  // Test 3: Get Cart con Populate
  it("GET /cart - Debería obtener el carrito del usuario", async () => {
    const res = await request(app)
      .get("/cart")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.result.items[0].productId.name).toBe("Cart Test Item");
  });
});