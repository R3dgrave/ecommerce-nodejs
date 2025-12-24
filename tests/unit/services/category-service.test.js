const sinon = require('sinon');
const CategoryService = require('../../../src/services/category-service');
const { NotFoundError, ConflictError, BusinessLogicError } = require('../../../src/utils/errors');

describe('CategoryService', () => {
  let categoryService;
  let mockCategoryRepository;
  let mockBrandRepository;
  let mockProductRepository;

  const MOCK_ID = 'cat123';
  const MOCK_CATEGORY_DATA = { name: 'Computers' };
  const MOCK_SAVED_CATEGORY = { id: MOCK_ID, name: 'Computers' };

  beforeEach(() => {
    sinon.restore();

    mockCategoryRepository = {
      findWithPagination: sinon.stub(),
      findById: sinon.stub(),
      save: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub(),
    };

    mockBrandRepository = {
      countByCategoryId: sinon.stub(),
    };

    mockProductRepository = {
      countByCategoryId: sinon.stub(),
    };

    categoryService = new CategoryService(
      mockCategoryRepository,
      mockBrandRepository,
      mockProductRepository
    );
  });

  describe('createCategory', () => {
    it('debería guardar la categoría, aplicar trim y retornar los datos', async () => {
      mockCategoryRepository.save.resolves(MOCK_SAVED_CATEGORY);

      const result = await categoryService.createCategory({ name: '  Computers  ' });

      expect(mockCategoryRepository.save.calledWith({ name: 'Computers' })).toBe(true);
      expect(result).toEqual(MOCK_SAVED_CATEGORY);
    });

    it('debería lanzar BusinessLogicError si el nombre está vacío o solo tiene espacios', async () => {
      await expect(categoryService.createCategory({ name: '   ' }))
        .rejects.toThrow(BusinessLogicError);
    });

    it('debería lanzar ConflictError si el repositorio devuelve status 409', async () => {
      const repoError = new Error('Duplicate');
      repoError.status = 409;
      mockCategoryRepository.save.rejects(repoError);

      await expect(categoryService.createCategory(MOCK_CATEGORY_DATA))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('updateCategory', () => {
    it('debería lanzar NotFoundError si el repositorio devuelve status 404', async () => {
      const repoError = new Error('Not Found');
      repoError.status = 404;
      mockCategoryRepository.update.rejects(repoError);

      await expect(categoryService.updateCategory(MOCK_ID, { name: 'New Name' }))
        .rejects.toThrow(NotFoundError);
    });

    it('debería lanzar BusinessLogicError si se intenta actualizar a un nombre que solo contiene espacios', async () => {
      await expect(categoryService.updateCategory(MOCK_ID, { name: '   ' }))
        .rejects.toThrow(BusinessLogicError);
    });
  });

  describe('deleteCategory', () => {
    it('debería lanzar ConflictError si tiene marcas asociadas', async () => {
      mockCategoryRepository.findById.resolves(MOCK_SAVED_CATEGORY);
      mockBrandRepository.countByCategoryId.resolves(3);

      await expect(categoryService.deleteCategory(MOCK_ID))
        .rejects.toThrow(ConflictError);

      expect(mockCategoryRepository.delete.called).toBe(false);
    });

    it('debería lanzar ConflictError si tiene productos asociados', async () => {
      mockCategoryRepository.findById.resolves(MOCK_SAVED_CATEGORY);
      mockBrandRepository.countByCategoryId.resolves(0);
      mockProductRepository.countByCategoryId.resolves(10);

      await expect(categoryService.deleteCategory(MOCK_ID))
        .rejects.toThrow(ConflictError);
    });

    it('debería eliminar la categoría si no tiene dependencias', async () => {
      mockCategoryRepository.findById.resolves(MOCK_SAVED_CATEGORY);
      mockBrandRepository.countByCategoryId.resolves(0);
      mockProductRepository.countByCategoryId.resolves(0);
      mockCategoryRepository.delete.resolves(true);

      const result = await categoryService.deleteCategory(MOCK_ID);

      expect(mockCategoryRepository.delete.calledWith(MOCK_ID)).toBe(true);
      expect(result).toBe(true);
    });

    it('debería lanzar NotFoundError si la categoría no existe antes de intentar borrar', async () => {
      mockCategoryRepository.findById.resolves(null);

      await expect(categoryService.deleteCategory('invalid'))
        .rejects.toThrow(NotFoundError);
    });
  });
});