const request = require("supertest");
const { app, cleanDatabase } = require("./setup.e2e");
const User = require("../../src/models/user");
const Order = require("../../src/models/order");
const Cart = require("../../src/models/cart");
const Product = require("../../src/models/product");

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
    // 1. Limpieza inicial
    await cleanDatabase();

    // 2. Crear usuario y elevar a Admin para poder crear infraestructura
    await request(app).post("/auth/register").send(MOCK_ADMIN_USER);
    const user = await User.findOne({ email: MOCK_ADMIN_USER.email });
    user.isAdmin = true;
    await user.save();

    // 3. Login
    const loginRes = await request(app).post("/auth/login").send({
      email: MOCK_ADMIN_USER.email,
      password: MOCK_ADMIN_USER.password,
    });

    token = loginRes.body.data.token;
    userId = loginRes.body.data.user.id;

    // 4. Crear Categoría
    const catRes = await request(app)
      .post("/category")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Gaming" });

    // Extraemos el ID considerando que tu controlador de Categoría devuelve 'result'
    const categoryId = catRes.body.result?._id;

    // 5. Crear Marca (Corregido: usamos 'categoryId' según tu controlador)
    const brandRes = await request(app)
      .post("/brand")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Razer",
        categoryId: categoryId,
      });

    const brandId = brandRes.body.result?._id;

    // 6. Crear Producto
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
        // Añadimos campo images por si tu esquema lo requiere como obligatorio
        images: ["https://placehold.co/600x400"],
      });

    // Guardamos el producto para usarlo en los tests
    product = prodRes.body.result;

    if (!product) {
      throw new Error(
        "ERROR SETUP: No se pudo crear el producto. " +
          JSON.stringify(prodRes.body)
      );
    }
  });

  describe("POST /order", () => {
    it("debería completar el checkout exitosamente (Flujo completo)", async () => {
      // A. Agregar 3 unidades al carrito
      const cartRes = await request(app)
        .post("/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({
          productId: product._id,
          quantity: 3,
        });

      expect(cartRes.status).toBe(200);

      const shippingAddress = {
        address: "Calle Principal 456",
        city: "Santiago",
        country: "Chile",
      };

      // B. Ejecutar la creación de la orden
      const res = await request(app)
        .post("/order")
        .set("Authorization", `Bearer ${token}`)
        .send({ shippingAddress });

      // Verificaciones de la respuesta
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // El controlador de Order devuelve los datos en 'data'
      expect(res.body.data.totalAmount).toBe(240); // 80 * 3
      expect(res.body.data.status).toBe("pending");

      // C. Verificación de persistencia: El carrito debe estar vacío
      const cart = await Cart.findOne({ userId });
      expect(cart.items).toHaveLength(0);

      // D. Verificación de persistencia: El stock debe haber bajado (15 - 3 = 12)
      const updatedProduct = await Product.findById(product._id);
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
      // Como el test anterior creó una orden exitosa, el conteo debe ser 1
      expect(res.body.data.totalCount).toBe(1);
      expect(res.body.data.data[0].userId.toString()).toBe(userId);
    });
  });

  describe("GET /order/:id", () => {
    it("debería obtener el detalle de una orden específica", async () => {
      // Recuperamos la orden de la base de datos
      const orders = await Order.find({ userId });
      const orderId = orders[0]._id;

      const res = await request(app)
        .get(`/order/${orderId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(orderId.toString());
      expect(res.body.data.items[0].name).toBe("Razer Mouse");
    });

    it("debería devolver 404 si la orden no existe", async () => {
      const fakeId = new (require("mongoose").Types.ObjectId)();
      const res = await request(app)
        .get(`/order/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
