const request = require("supertest");
const sinon = require("sinon");
const mongoose = require('mongoose');

const { createApp } = require("../../src/app");
const CategoryService = require("../../src/services/category-service");

const mockCategoryService = sinon.createStubInstance(CategoryService);
const mockTokenProvider = { verify: sinon.stub().returns({ id: 'auth-user', isAdmin: true }) };

const mockContainer = {
  categoryService: mockCategoryService,
  brandService: {},
  authService: {},
  tokenProvider: mockTokenProvider,
  config: { jwtSecret: 'test-secret' }
};

const app = createApp(mockContainer);

const MOCK_ADMIN_TOKEN = 'Bearer VALID_ADMIN_TOKEN';

const mockId = new mongoose.Types.ObjectId().toString();
const newCategoryData = { name: "Electronics" };
const mockSavedCategory = { id: mockId, name: newCategoryData.name };

describe("E2E Category Routes", () => {
  beforeEach(() => {
    sinon.resetHistory();
    mockCategoryService.createCategory.resetHistory();
    mockCategoryService.getCategoryById.resetHistory();
    mockCategoryService.updateCategory.resetHistory();
    mockCategoryService.deleteCategory.resetHistory();
  });

  describe("POST /category", () => {
    it("debería retornar 201 y la categoría creada si es exitoso", async () => {
      mockCategoryService.createCategory.resolves(mockSavedCategory);

      const response = await request(app)
        .post("/category")
        .set('Authorization', MOCK_ADMIN_TOKEN)
        .send(newCategoryData);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.result).toEqual(mockSavedCategory);
    });

    it("debería retornar 400 si falta el nombre (validación de Express-Validator)", async () => {
      const response = await request(app)
        .post("/category")
        .send({});

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].msg).toBe('El nombre de la categoría es requerido.');
    });

    it("debería retornar 409 si el servicio detecta duplicado", async () => {
      const conflictError = new Error('Ya existe una categoría con este nombre.');
      conflictError.status = 409;
      mockCategoryService.createCategory.rejects(conflictError);

      const response = await request(app)
        .post("/category")
        .set('Authorization', MOCK_ADMIN_TOKEN)
        .send(newCategoryData);

      expect(response.statusCode).toBe(409);
      expect(response.body.error).toBe(conflictError.message);
    });
  });

  describe("GET /category", () => {
    it("debería retornar 200 y la lista de categorías con datos de paginación", async () => {
      const mockPaginationResult = {
        data: [mockSavedCategory],
        totalCount: 10,
        totalPages: 1,
        currentPage: 1,
        limit: 10
      };

      mockCategoryService.getAllCategories.resolves(mockPaginationResult);

      const response = await request(app)
        .get("/category?page=1&limit=5&name=comp")
        .set('Authorization', MOCK_ADMIN_TOKEN);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result).toEqual(mockPaginationResult);

      expect(mockCategoryService.getAllCategories.calledOnce).toBe(true);
      expect(mockCategoryService.getAllCategories.getCall(0).args[0]).toEqual({ page: '1', limit: '5', name: 'comp' });
    });

    it("debería retornar 500 si hay un error en el servicio de listado", async () => {
      mockCategoryService.getAllCategories.rejects(new Error("Database connection failed"));

      const response = await request(app)
        .get("/category")
        .set('Authorization', MOCK_ADMIN_TOKEN);

      expect(response.statusCode).toBe(500);
    });
  });

  describe("GET /category/:id", () => {
    it("debería retornar 200 y la categoría si es encontrada", async () => {
      mockCategoryService.getCategoryById.resolves(mockSavedCategory);

      const response = await request(app)
        .get(`/category/${mockId}`)
        .set('Authorization', MOCK_ADMIN_TOKEN);

      expect(response.statusCode).toBe(200);
      expect(response.body.result).toEqual(mockSavedCategory);
    });

    it("debería retornar 404 si la categoría no existe", async () => {
      mockCategoryService.getCategoryById.resolves(null);

      const response = await request(app)
        .get(`/category/${mockId}`)
        .set('Authorization', MOCK_ADMIN_TOKEN);

      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe('Categoría no encontrada.');
    });
  });

  describe("DELETE /category/:id", () => {
    it("debería retornar 200 si la eliminación es exitosa", async () => {
      mockCategoryService.deleteCategory.resolves();

      const response = await request(app)
        .delete(`/category/${mockId}`)
        .set('Authorization', MOCK_ADMIN_TOKEN);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Eliminado');
    });

    it("debería retornar 409 si existen dependencias", async () => {
      const conflictError = new Error('No se puede eliminar la categoría. 5 marca(s) dependen de ella.');
      conflictError.status = 409;
      mockCategoryService.deleteCategory.rejects(conflictError);

      const response = await request(app)
        .delete(`/category/${mockId}`)
        .set('Authorization', MOCK_ADMIN_TOKEN);

      expect(response.statusCode).toBe(409);
      expect(response.body.error).toContain('dependen de ella');
    });
  });

  describe("PUT /category/:id", () => {
    const updateData = { name: "New Name" };

    it("debería retornar 200 si la actualización es exitosa", async () => {
      mockCategoryService.updateCategory.resolves(true);

      const response = await request(app)
        .put(`/category/${mockId}`)
        .set('Authorization', MOCK_ADMIN_TOKEN)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Actualización de categoría exitosa");

      expect(mockCategoryService.updateCategory.calledOnceWith(mockId, updateData)).toBe(true);
    });

    it("debería retornar 400 si el nombre es inválido (validación)", async () => {
      const response = await request(app)
        .put(`/category/${mockId}`)
        .set('Authorization', MOCK_ADMIN_TOKEN)
        .send({ name: '' });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].msg).toBe('El nombre de la categoría es requerido.');
    });

    it("debería retornar 409 si el nuevo nombre ya existe (conflicto)", async () => {
      const conflictError = new Error('Ya existe otra categoría con ese nombre.');
      conflictError.status = 409;

      mockCategoryService.updateCategory.rejects(conflictError);

      const response = await request(app)
        .put(`/category/${mockId}`)
        .set('Authorization', MOCK_ADMIN_TOKEN)
        .send(updateData);

      expect(response.statusCode).toBe(409);
      expect(response.body.error).toBe(conflictError.message);
    });
  });
});