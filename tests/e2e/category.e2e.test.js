const request = require("supertest");
const mongoose = require('mongoose');
const { app, closeDatabase, cleanDatabase } = require("./setup.e2e");

const User = require('../../src/models/user');
const Category = require('../../src/models/category');

describe("E2E Category Routes (Real DB)", () => {
  let adminToken;
  let createdCategoryId;

  const MOCK_ADMIN = {
    name: "Admin Category Test",
    email: "admin-cat-e2e@test.com",
    password: "securepassword123",
    isAdmin: true,
  };

  beforeAll(async () => {
    await cleanDatabase();

    await request(app).post('/auth/register').send(MOCK_ADMIN);

    await User.findOneAndUpdate({ email: MOCK_ADMIN.email }, { isAdmin: true });

    const loginRes = await request(app).post('/auth/login').send({
      email: MOCK_ADMIN.email,
      password: MOCK_ADMIN.password,
    });

    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  // --- Tests de Creación ---
  describe("POST /category", () => {
    it("debería crear una categoría exitosamente (Status 201)", async () => {
      const response = await request(app)
        .post("/category")
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: "electronics" });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.result.name).toBe("electronics");

      createdCategoryId = response.body.result._id || response.body.result.id;
    });

    it("debería retornar 400 si falta el nombre (Validación)", async () => {
      const response = await request(app)
        .post("/category")
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("debería retornar 409 si el nombre ya existe (Conflicto real en DB)", async () => {
      const response = await request(app)
        .post("/category")
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: "electronics" });

      expect(response.statusCode).toBe(409);
      expect(response.body.error).toContain("existe");
    });
  });

  // --- Tests de Lectura ---
  describe("GET /category", () => {
    it("debería retornar la lista de categorías paginada", async () => {
      const response = await request(app)
        .get("/category?page=1&limit=10")
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.result.data)).toBe(true);
      expect(response.body.result.totalCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /category/:id", () => {
    it("debería retornar 200 y la categoría si existe", async () => {
      const response = await request(app)
        .get(`/category/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.result.name).toBe("electronics");
    });

    it("debería retornar 404 si la categoría no existe", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/category/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
    });
  });

  // --- Tests de Actualización ---
  describe("PUT /category/:id", () => {
    it("debería actualizar el nombre exitosamente", async () => {
      const response = await request(app)
        .put(`/category/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: "computing" });

      expect(response.statusCode).toBe(200);

      // Verificar en la base de datos
      const updatedCat = await Category.findById(createdCategoryId);
      expect(updatedCat.name).toBe("computing");
    });
  });

  // --- Tests de Eliminación ---
  describe("DELETE /category/:id", () => {
    it("debería eliminar la categoría exitosamente", async () => {
      const response = await request(app)
        .delete(`/category/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Eliminado');

      const checkInDb = await Category.findById(createdCategoryId);
      expect(checkInDb).toBeNull();
    });
  });
});