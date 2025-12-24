const request = require("supertest");
const mongoose = require('mongoose');
const { app, closeDatabase, cleanDatabase, CategoryModel, UserModel } = require("./setup.e2e");

describe("E2E Category Routes (Real DB)", () => {
  let adminToken;
  let createdCategoryId;

  const MOCK_ADMIN = {
    name: "Admin Category Test",
    email: "admin-cat-e2e@test.com",
    password: "securepassword123",
  };

  beforeAll(async () => {
    await cleanDatabase();

    await request(app).post('/auth/register').send(MOCK_ADMIN);

    await UserModel.findOneAndUpdate({ email: MOCK_ADMIN.email }, { isAdmin: true });

    const loginRes = await request(app).post('/auth/login').send({
      email: MOCK_ADMIN.email,
      password: MOCK_ADMIN.password,
    });

    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe("POST /category", () => {
    it("debería crear una categoría exitosamente (Status 201)", async () => {
      const response = await request(app)
        .post("/category")
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: "electronics" });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("electronics");

      createdCategoryId = response.body.data.id;
      expect(createdCategoryId).toBeDefined();
    });

    it("debería retornar 400 si falta el nombre (Validación Joi/Validator)", async () => {
      const response = await request(app)
        .post("/category")
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("debería retornar 409 si el nombre ya existe (Conflict)", async () => {
      const response = await request(app)
        .post("/category")
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: "electronics" });

      expect(response.statusCode).toBe(409);
      expect(response.body.message).toMatch(/existe/i);
    });
  });

  describe("GET /category", () => {
    it("debería retornar la lista de categorías paginada", async () => {
      const response = await request(app)
        .get("/category?page=1&limit=10")
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.totalCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /category/:id", () => {
    it("debería retornar 200 y la categoría si existe", async () => {
      const response = await request(app)
        .get(`/category/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.name).toBe("electronics");
      expect(response.body.data.id).toBe(createdCategoryId);
    });

    it("debería retornar 404 si la categoría no existe", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/category/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /category/:id", () => {
    it("debería actualizar el nombre exitosamente", async () => {
      const response = await request(app)
        .put(`/category/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: "computing" });

      expect(response.statusCode).toBe(200);
      expect(response.body.data.name).toBe("computing");

      const updatedCat = await CategoryModel.findById(createdCategoryId);
      expect(updatedCat.name).toBe("computing");
    });
  });

  describe("DELETE /category/:id", () => {
    it("debería eliminar la categoría exitosamente", async () => {
      const response = await request(app)
        .delete(`/category/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toContain('correctamente');

      const checkInDb = await CategoryModel.findById(createdCategoryId);
      expect(checkInDb).toBeNull();
    });
  });
});