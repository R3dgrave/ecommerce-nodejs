const request = require("supertest");
const {
  app,
  cleanDatabase,
  UserModel,
  CartModel,
  ProductModel,
} = require("./setup.e2e");

describe("Order E2E Flow", () => {
  let token;
  let userId;
  let product;

  const MOCK_ADMIN_USER = {
    name: "Order Tester",
    email: "tester@order.com",
    password: "password123",
  };

  beforeAll(async () => {
    await cleanDatabase();

    await request(app).post("/auth/register").send(MOCK_ADMIN_USER);
    const user = await UserModel.findOne({ email: MOCK_ADMIN_USER.email });
    user.isAdmin = true;
    await user.save();

    const loginRes = await request(app).post("/auth/login").send({
      email: MOCK_ADMIN_USER.email,
      password: MOCK_ADMIN_USER.password,
    });

    token = loginRes.body.data.token;
    userId = loginRes.body.data.user.id;

    const catRes = await request(app)
      .post("/category")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Gaming" });

    const categoryId = catRes.body.data?.id;

    const brandRes = await request(app)
      .post("/brand")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Razer",
        categoryId: categoryId,
      });

    const brandId = brandRes.body.data?.id;

    const prodRes = await request(app)
      .post("/product")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Razer Mouse",
        shortDescription: "Descripcion corta del producto",
        description: "High precision gaming mouse",
        price: 80,
        stock: 15,
        categoryId: categoryId,
        brandId: brandId,
        images: ["https://placehold.co/600x400"],
      });

    product = prodRes.body.data;

    if (!product) {
      throw new Error(
        "ERROR SETUP: No se pudo crear el producto. " +
          JSON.stringify(prodRes.body)
      );
    }
  });

  describe("POST /order", () => {
    it("debería completar el checkout exitosamente (Flujo completo)", async () => {
      const cartRes = await request(app)
        .post("/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({
          productId: product.id || product._id,
          quantity: 3,
        });

      expect(cartRes.status).toBe(200);

      const shippingAddress = {
        address: "Calle Principal 456",
        city: "Santiago",
        country: "Chile",
      };

      const res = await request(app)
        .post("/order")
        .set("Authorization", `Bearer ${token}`)
        .send({ shippingAddress });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      expect(res.body.data.totalAmount).toBe(240);
      expect(res.body.data.status).toBe("pending");

      const cart = await CartModel.findOne({ userId });
      expect(cart.items).toHaveLength(0);

      const updatedProduct = await ProductModel.findById(
        product.id || product._id
      );
      expect(updatedProduct.stock).toBe(12);
    });

    it("debería fallar si el carrito está vacío", async () => {
      const res = await request(app)
        .post("/order")
        .set("Authorization", `Bearer ${token}`)
        .send({
          shippingAddress: {
            address: "Test",
            city: "Test",
            country: "Test",
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.message || res.body.error).toMatch(/vacío/i);
    });
  });

  describe("GET /order", () => {
    it("debería listar las órdenes del usuario logueado", async () => {
      const res = await request(app)
        .get("/order")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data).toBeInstanceOf(Array);
      expect(res.body.data.totalCount).toBe(1);
      expect(res.body.data.data[0].userId.toString()).toBe(userId);
    });
  });

  describe("GET /order/:id", () => {
    it("debería obtener el detalle con los nombres de productos", async () => {
      const ordersRes = await request(app)
        .get("/order")
        .set("Authorization", `Bearer ${token}`);

      const orderId =
        ordersRes.body.data.data[0].id || ordersRes.body.data.data[0]._id;

      const res = await request(app)
        .get(`/order/${orderId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items[0]).toHaveProperty("name", "Razer Mouse");
    });

    it("debería devolver 404 si la orden no existe", async () => {
      const fakeId = new (require("mongoose").Types.ObjectId)();
      const res = await request(app)
        .get(`/order/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /order/:id/cancel", () => {
    it("debería cancelar una orden pendiente y devolver el stock", async () => {
      const orders = await request(app)
        .get("/order")
        .set("Authorization", `Bearer ${token}`);
      const orderId = orders.body.data.data[0].id;

      const res = await request(app)
        .patch(`/order/${orderId}/cancel`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("cancelled");

      const updatedProduct = await ProductModel.findById(product.id);
      expect(updatedProduct.stock).toBe(15);
    });
  });
});
