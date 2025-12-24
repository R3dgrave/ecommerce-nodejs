const request = require("supertest");
const { app, closeDatabase, cleanDatabase, ProductModel, CategoryModel, BrandModel } = require("./setup.e2e");

describe("E2E: Cart Flow", () => {
  let userToken, productId;

  beforeAll(async () => {
    await cleanDatabase();

    const category = await CategoryModel.create({ name: "Test Category Cart" });
    const brand = await BrandModel.create({
      name: "Test Brand Cart",
      categoryId: category._id
    });

    const userData = {
      name: "Customer",
      email: "customer@test.com",
      password: "password123"
    };
    await request(app).post('/auth/register').send(userData);

    const loginRes = await request(app).post('/auth/login').send({
      email: userData.email,
      password: userData.password
    });
    userToken = loginRes.body.data.token;

    const product = await ProductModel.create({
      name: "Cart Test Item",
      price: 50,
      stock: 5,
      shortDescription: "Short desc",
      description: "Long desc",
      categoryId: category._id,
      brandId: brand._id
    });
    productId = product._id.toString();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe("POST /cart/add", () => {
    it("debería fallar por stock insuficiente usando BusinessLogicError (400)", async () => {
      const res = await request(app)
        .post("/cart/add")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ productId, quantity: 10 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/stock insuficiente/i);
    });

    it("debería añadir producto exitosamente al carrito", async () => {
      await request(app)
        .delete("/cart/clear")
        .set("Authorization", `Bearer ${userToken}`);

      const res = await request(app)
        .post("/cart/add")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ productId, quantity: 2 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].quantity).toBe(2);

      expect(res.body.data.items[0].productId.id).toBe(productId);
      expect(res.body.data.items[0].productId.name).toBe("Cart Test Item");
    });
  });

  describe("GET /cart", () => {
    it("debería obtener el carrito con los productos populados", async () => {
      const res = await request(app)
        .get("/cart")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      const firstItem = res.body.data.items[0];

      expect(firstItem.productId).toHaveProperty('name', "Cart Test Item");
      expect(firstItem.productId.id).toBe(productId);
    });
  });

  describe("DELETE /cart/remove/:productId", () => {
    it("debería eliminar un item específico del carrito", async () => {
      const res = await request(app)
        .delete(`/cart/remove/${productId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.items.length).toBe(0);
    });
  });
});