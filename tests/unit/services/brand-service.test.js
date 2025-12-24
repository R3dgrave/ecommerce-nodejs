const sinon = require("sinon");
const BrandService = require("../../../src/services/brand-service");
const { NotFoundError, ConflictError, BusinessLogicError } = require("../../../src/utils/errors");

describe("BrandService", () => {
  let brandService;
  let mockBrandRepository;
  let mockCategoryRepository;
  let mockProductRepository;

  const MOCK_BRAND_ID = "brand123";
  const MOCK_CATEGORY_ID = "cat456";
  const MOCK_BRAND_DATA = { name: "Nike", categoryId: MOCK_CATEGORY_ID };
  const MOCK_SAVED_BRAND = { ...MOCK_BRAND_DATA, id: MOCK_BRAND_ID };
  const MOCK_CATEGORY_EXISTING = { id: MOCK_CATEGORY_ID, name: 'Sports' };

  beforeEach(() => {
    sinon.restore();

    mockBrandRepository = {
      findWithPagination: sinon.stub(),
      findById: sinon.stub(),
      findByCategoryId: sinon.stub(),
      save: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub(),
    };

    mockCategoryRepository = {
      findById: sinon.stub(),
    };

    mockProductRepository = {
      countByBrandId: sinon.stub(),
    };

    brandService = new BrandService(
      mockBrandRepository,
      mockCategoryRepository,
      mockProductRepository
    );

    mockCategoryRepository.findById.resolves(MOCK_CATEGORY_EXISTING);
    mockBrandRepository.save.resolves(MOCK_SAVED_BRAND);
    mockBrandRepository.findById.resolves(MOCK_SAVED_BRAND);
    mockProductRepository.countByBrandId.resolves(0);
    mockBrandRepository.update.resolves(MOCK_SAVED_BRAND);
    mockBrandRepository.delete.resolves(MOCK_SAVED_BRAND);
  });

  describe("createBrand", () => {
    it("debería llamar a save después de verificar la categoría", async () => {
      const result = await brandService.createBrand(MOCK_BRAND_DATA);

      expect(mockCategoryRepository.findById.calledWith(MOCK_CATEGORY_ID)).toBe(true);
      expect(mockBrandRepository.save.calledOnce).toBe(true);
      expect(result.id).toBe(MOCK_BRAND_ID);
    });

    it("debería lanzar BusinessLogicError si categoryId no está presente", async () => {
      await expect(brandService.createBrand({ name: 'Test' }))
        .rejects.toThrow(BusinessLogicError);
    });

    it("debería lanzar NotFoundError si la categoría no existe", async () => {
      mockCategoryRepository.findById.resolves(null);

      await expect(brandService.createBrand(MOCK_BRAND_DATA))
        .rejects.toThrow(NotFoundError);
    });

    it("debería lanzar ConflictError si el repositorio devuelve status 409", async () => {
      const repoError = new Error("Duplicate");
      repoError.status = 409;
      mockBrandRepository.save.rejects(repoError);

      await expect(brandService.createBrand(MOCK_BRAND_DATA))
        .rejects.toThrow(ConflictError);
    });
  });

  describe("updateBrand", () => {
    it("debería verificar la categoría si se proporciona en los datos de actualización", async () => {
      const updateData = { name: 'NewName', categoryId: MOCK_CATEGORY_ID };
      await brandService.updateBrand(MOCK_BRAND_ID, updateData);

      expect(mockCategoryRepository.findById.calledOnce).toBe(true);
      expect(mockBrandRepository.update.calledWith(MOCK_BRAND_ID, updateData)).toBe(true);
    });

    it("debería lanzar NotFoundError si el repositorio lanza status 404", async () => {
      const repoError = new Error("Not found");
      repoError.status = 404;
      mockBrandRepository.update.rejects(repoError);

      await expect(brandService.updateBrand(MOCK_BRAND_ID, { name: 'Test' }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteBrand", () => {
    it("debería lanzar ConflictError si hay productos asociados", async () => {
      mockProductRepository.countByBrandId.resolves(5);

      await expect(brandService.deleteBrand(MOCK_BRAND_ID))
        .rejects.toThrow(ConflictError);
      
      expect(mockBrandRepository.delete.called).toBe(false);
    });

    it("debería eliminar la marca si no tiene productos", async () => {
      await brandService.deleteBrand(MOCK_BRAND_ID);
      expect(mockBrandRepository.delete.calledOnce).toBe(true);
    });
  });

  describe("getBrandsByCategory", () => {
    it("debería verificar la existencia de la categoría antes de buscar", async () => {
      mockBrandRepository.findByCategoryId.resolves([]);
      
      await brandService.getBrandsByCategory(MOCK_CATEGORY_ID);

      expect(mockCategoryRepository.findById.calledWith(MOCK_CATEGORY_ID)).toBe(true);
      expect(mockBrandRepository.findByCategoryId.calledOnce).toBe(true);
    });
  });
});