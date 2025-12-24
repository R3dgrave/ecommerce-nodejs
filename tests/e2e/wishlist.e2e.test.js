const request = require("supertest");
const { app, cleanDatabase, ProductModel, CategoryModel, BrandModel } = require("./setup.e2e");

describe("Wishlist E2E", () => {
  let userToken;
  let productId;

  beforeAll(async () => {
    await cleanDatabase();

    await request(app).post("/auth/register").send({
      name: "Wish User",
      email: "wish@test.com",
      password: "password123",
      phone: "123456789"
    })

    const loginRes = await request(app).post("/auth/login").send({
      email: "wish@test.com",
      password: "password123",
    });

    userToken = loginRes.body.data.token;

    const cat = await CategoryModel.create({ name: "General" });
    const brand = await BrandModel.create({ name: "Brand", categoryId: cat.id });
    const product = await ProductModel.create({
      name: "Product Test",
      price: 100,
      stock: 10,
      categoryId: cat.id,
      brandId: brand.id,
      images: ["test.jpg"],
      description: "desc",
      shortDescription: "short"
    });
    productId = product.id.toString();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe("Flujo de Wishlist", () => {
    it("POST /wishlist/add - debería añadir un producto", async () => {
      const res = await request(app)
        .post("/wishlist/add")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ productId });

      expect(res.status).toBe(200);
      expect(res.body.data.products[0].id).toBe(productId);
    });

    it("POST /wishlist/add - no debería duplicar el producto ($addToSet)", async () => {
      await request(app)
        .post("/wishlist/add")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ productId });

      const res = await request(app)
        .get("/wishlist")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.body.data.products).toHaveLength(1);
    });

    it("DELETE /wishlist/:productId - debería eliminar el producto", async () => {
      const res = await request(app)
        .delete(`/wishlist/${productId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(0);
    });

    it("DELETE /wishlist/:productId - debería fallar con ID inválido", async () => {
      const res = await request(app)
        .delete("/wishlist/123-invalid")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(400);
    });
  });
});