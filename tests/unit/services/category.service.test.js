const sinon = require('sinon');
const CategoryService = require('../../../src/services/category-service');
const mongoose = require('mongoose');
const { ConflictError } = require('../../../src/repositories/base-repository');

const mockId = new mongoose.Types.ObjectId().toString();
const mockCategoryData = { name: 'Computers' };
const mockSavedCategory = { id: mockId, name: 'computers' };

const mockCategoryRepository = {
  find: sinon.stub(),
  findWithPagination: sinon.stub(),
  findById: sinon.stub(),
  save: sinon.stub(),
  update: sinon.stub(),
  delete: sinon.stub(),
};

const mockBrandRepository = {
  countByCategoryId: sinon.stub(),
};

const mockProductRepository = {
  countByCategoryId: sinon.stub(),
};


describe('CategoryService', () => {
  let categoryService;

  beforeEach(() => {
    sinon.resetHistory();
    categoryService = new CategoryService(
      mockCategoryRepository,
      mockBrandRepository,
      mockProductRepository
    );

    mockCategoryRepository.update.resolves({ matchedCount: 1, modifiedCount: 1 });
  });

  describe('createCategory', () => {
    it('debería guardar la categoría y retornar los datos', async () => {
      mockCategoryRepository.save.resolves(mockSavedCategory);

      const result = await categoryService.createCategory(mockCategoryData);

      expect(mockCategoryRepository.save.calledOnce).toBe(true);
      expect(result).toEqual(mockSavedCategory);
    });

    it('debería lanzar 409 si el nombre ya existe (Error 11000)', async () => {
      const conflictError = new ConflictError('Duplicate key error');
      mockCategoryRepository.save.rejects(conflictError);

      await expect(categoryService.createCategory(mockCategoryData)).rejects.toHaveProperty('status', 409);
    });

    it('debería lanzar 400 si el nombre está vacío', async () => {
      await expect(categoryService.createCategory({ name: ' ' })).rejects.toHaveProperty('status', 400);
    });
  });

  describe('updateCategory', () => {
    const updateData = { name: 'NewName' };
    const mockUpdateResultSuccess = { matchedCount: 1, modifiedCount: 1 };

    it('debería llamar a update y no lanzar error si es exitoso', async () => {
      mockCategoryRepository.update.resolves(mockUpdateResultSuccess);
      await categoryService.updateCategory(mockId, updateData);
      expect(mockCategoryRepository.update.calledOnce).toBe(true);
    });

    it('debería lanzar 404 si la categoría no existe (matchedCount = 0)', async () => {
      const notFoundError = new Error(`Categoría con ID ${mockId} no encontrada.`);
      notFoundError.status = 404;
      mockCategoryRepository.update.rejects(notFoundError);
      await expect(categoryService.updateCategory(mockId, updateData)).rejects.toHaveProperty('status', 404);
      mockCategoryRepository.update.resolves(mockUpdateResultSuccess);
    });

    it('debería lanzar 409 si el nombre ya existe (Error 11000)', async () => {
      const conflictError = new ConflictError('Duplicate key error');
      mockCategoryRepository.update.rejects(conflictError);
      await expect(categoryService.updateCategory(mockId, updateData)).rejects.toHaveProperty('status', 409);
    });

    it('debería lanzar 400 si el nombre está vacío', async () => {
      await expect(categoryService.updateCategory(mockId, { name: ' ' })).rejects.toHaveProperty('status', 400);
    });
  });
});