const request = require("supertest");
const mongoose = require("mongoose");
const {
  app,
  closeDatabase,
} = require("./setup.e2e");

const Product = require('../../src/models/product');
const Category = require('../../src/models/category');
const Brand = require('../../src/models/brand');
const User = require('../../src/models/user');

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
  await Product.deleteMany({});
  await Brand.deleteMany({ name: MOCK_BRAND_NAME });
  await Category.deleteMany({ name: MOCK_CATEGORY_NAME });
  await User.deleteMany({ email: MOCK_ADMIN_USER.email });

  await request(app).post('/auth/register').send(MOCK_ADMIN_USER);
  const user = await User.findOne({ email: MOCK_ADMIN_USER.email });

  user.isAdmin = true;
  await user.save();

  const loginRes = await request(app).post("/auth/login").send({
    email: MOCK_ADMIN_USER.email,
    password: MOCK_ADMIN_USER.password,
  });

  adminToken = loginRes.body.data.token;

  const categoryRes = await request(app)
    .post("/category")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: MOCK_CATEGORY_NAME });

  existingCategoryId = categoryRes.body.result._id || categoryRes.body.result.id;
  expect(categoryRes.statusCode).toBe(201);

  // Crear Marca
  const brandRes = await request(app)
    .post("/brand")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: MOCK_BRAND_NAME, categoryId: existingCategoryId });

  existingBrandId = brandRes.body.result._id || brandRes.body.result.id;;
  expect(brandRes.statusCode).toBe(201);
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await ProductModel.deleteMany({});
    await BrandModel.deleteMany({ name: MOCK_BRAND_NAME });
    await CategoryModel.deleteMany({ name: MOCK_CATEGORY_NAME });
    await userRepository.deleteByEmail(MOCK_ADMIN_USER.email);
  }
  await closeDatabase();
});

// --- Tests Principales ---
describe("E2E: /product routes", () => {
  const productData = {
    name: MOCK_PRODUCT_NAME,
    price: 499.99,
    stock: 50,
    shortDescription: 'Un resumen de la consola de juegos de nueva generación.',
    description: "Next-gen gaming console.",
    categoryId: null,
    brandId: null,
  };

  // --- POST /product (Creación) ---
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
      expect(res.body.success).toBe(true);
      expect(res.body.result.name).toBe(MOCK_PRODUCT_NAME);
      expect(res.body.result.price).toBe(productData.price);
      expect(res.body.result.categoryId).toBe(existingCategoryId);

      newProductId = res.body.result._id;
    });

    it("debería fallar con 409 si el nombre del producto ya existe", async () => {
      const res = await request(app)
        .post("/product")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(productData);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toMatch(/Ya existe un producto con este nombre/);
    });

    it("debería fallar con 400 si falta el precio (Validación)", async () => {
      const invalidData = {
        ...productData,
        price: undefined,
        name: "Invalid Product Test",
      };

      const res = await request(app)
        .post("/product")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(invalidData);

      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe("El precio es requerido.");
    });

    it("debería fallar con 404 si la categoría no existe (Lógica de Servicio)", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const invalidData = {
        ...productData,
        categoryId: nonExistentId,
        name: "Invalid Cat Test",
      };

      const res = await request(app)
        .post("/product")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(invalidData);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toMatch(/La CategoryId .* proporcionada no existe/);
    });
  });

  // --- GET /product (Listado y Paginación) ---
  describe("GET /product (Público)", () => {
    it("debería obtener la lista de productos paginada (Status 200) con población", async () => {
      const res = await request(app).get("/product?page=1&limit=10");

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const { data, totalCount } = res.body.result;

      expect(totalCount).toBeGreaterThanOrEqual(1);
      expect(data.length).toBeGreaterThan(0);

      const firstProduct = data.find((p) => p._id === newProductId);
      expect(firstProduct.categoryId).toBeDefined();
      expect(firstProduct.categoryId.name).toBe(MOCK_CATEGORY_NAME);
      expect(firstProduct.brandId.name).toBe(MOCK_BRAND_NAME);
    });

    it("debería filtrar por brandId exitosamente", async () => {
      const res = await request(app).get(
        `/product?brandId=${existingBrandId}&limit=1`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const { totalCount } = res.body.result;
      expect(totalCount).toBeGreaterThanOrEqual(1);
      expect(res.body.result.data[0].brandId._id).toBe(existingBrandId);
    });

    it("debería retornar 400 si el filtro brandId es inválido (Validación)", async () => {
      const res = await request(app).get("/product?brandId=invalid-format");

      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe(
        "El filtro brandId debe ser un ID de MongoDB válido."
      );
    });
  });

  // --- GET /product/:id (Detalle) ---
  describe("GET /product/:id (Público)", () => {
    it("debería obtener el producto por ID con población (Status 200)", async () => {
      expect(newProductId).toBeDefined();

      const res = await request(app).get(`/product/${newProductId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.result._id).toBe(newProductId);

      expect(res.body.result.categoryId.name).toBe(MOCK_CATEGORY_NAME);
      expect(res.body.result.brandId.name).toBe(MOCK_BRAND_NAME);
    });

    it("debería fallar con 404 si el producto no existe", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app).get(`/product/${nonExistentId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Producto con ID .* no encontrado/);
    });
  });

  // --- PUT /product/:id (Actualización) ---
  describe("PUT /product/:id (Admin)", () => {
    it("debería actualizar el nombre y precio exitosamente (Status 200)", async () => {
      const updateData = { name: "PlayStation 5 Slim", price: 449.99 };

      const res = await request(app)
        .put(`/product/${newProductId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verificación
      const checkRes = await request(app).get(`/product/${newProductId}`);
      expect(checkRes.body.result.name).toBe(updateData.name);
      expect(checkRes.body.result.price).toBe(updateData.price);
    });

    it("debería fallar con 400 si el body está vacío (Middleware requireNonEmptyBody)", async () => {
      const res = await request(app)
        .put(`/product/${newProductId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe(
        "El cuerpo de la solicitud no puede estar vacío para actualizar."
      );
    });

    it("debería fallar con 404 si el ID no existe (Lógica de Servicio)", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/product/${nonExistentId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ stock: 1 });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Documento no encontrado para actualizar.");
    });
  });

  // --- DELETE /product/:id (Eliminación) ---
  describe("DELETE /product/:id (Admin)", () => {
    it("debería eliminar el producto exitosamente (Status 200)", async () => {
      expect(newProductId).toBeDefined();

      const res = await request(app)
        .delete(`/product/${newProductId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Producto eliminado exitosamente.");

      const checkRes = await request(app).get(`/product/${newProductId}`);
      expect(checkRes.statusCode).toBe(404);
    });

    it("debería fallar con 404 si se intenta eliminar un producto que no existe", async () => {
      const res = await request(app)
        .delete(`/product/${newProductId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(
        /Producto con ID .* no encontrado./
      );
    });
  });
});
