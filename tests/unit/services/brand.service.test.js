const sinon = require("sinon");
const BrandService = require("../../../src/services/brand-service");
const { ConflictError } = require("../../../src/repositories/base-repository");
const mongoose = require("mongoose");

const MOCK_BRAND_ID = new mongoose.Types.ObjectId().toString();
const MOCK_CATEGORY_ID = new mongoose.Types.ObjectId().toString();
const MOCK_BRAND_DATA = { name: "Nike", categoryId: MOCK_CATEGORY_ID };
const MOCK_SAVED_BRAND = { ...MOCK_BRAND_DATA, id: MOCK_BRAND_ID };
const MOCK_CATEGORY_EXISTING = { id: MOCK_CATEGORY_ID, name: 'Sports' };

const mockBrandRepository = {
  findWithPagination: sinon.stub(),
  findById: sinon.stub(),
  findByCategoryId: sinon.stub(),
  save: sinon.stub(),
  update: sinon.stub(),
  delete: sinon.stub(),
};

const mockCategoryRepository = {
  findById: sinon.stub(),
};

const mockProductRepository = {
  countByBrandId: sinon.stub(),
};
const brandService = new BrandService(
  mockBrandRepository,
  mockCategoryRepository,
  mockProductRepository
);

describe("BrandService", () => {
  beforeEach(() => {
    sinon.resetHistory();

    mockCategoryRepository.findById.resolves(MOCK_CATEGORY_EXISTING);
    mockBrandRepository.save.resolves(MOCK_SAVED_BRAND);
    mockBrandRepository.findById.resolves(MOCK_SAVED_BRAND);
    mockProductRepository.countByBrandId.resolves(0);
    mockBrandRepository.update.resolves({ matchedCount: 1, modifiedCount: 1 });
    mockBrandRepository.delete.resolves(MOCK_SAVED_BRAND);
  });

  describe("createBrand", () => {
    it("debería llamar a save después de verificar la categoría", async () => {
      const result = await brandService.createBrand(MOCK_BRAND_DATA);

      expect(mockCategoryRepository.findById.calledOnce).toBe(true);
      expect(mockBrandRepository.save.calledOnce).toBe(true);
      expect(result).toEqual(MOCK_SAVED_BRAND);
    });

    it("debería lanzar 400 si categoryId no está presente", async () => {
      await expect(brandService.createBrand({ name: 'Test' }))
        .rejects.toHaveProperty('status', 400);
      expect(mockCategoryRepository.findById.called).toBe(false);
      expect(mockBrandRepository.save.called).toBe(false);
    });

    it("debería lanzar 404 si la categoría no existe", async () => {
      mockCategoryRepository.findById.resolves(null);

      await expect(brandService.createBrand(MOCK_BRAND_DATA))
        .rejects.toHaveProperty('status', 404);

      expect(mockCategoryRepository.findById.calledOnce).toBe(true);
      expect(mockBrandRepository.save.called).toBe(false);
    });

    it("debería lanzar 409 si la marca ya existe (ConflictError)", async () => {
      const conflictError = new ConflictError("El recurso ya existe.");
      mockBrandRepository.save.rejects(conflictError);

      await expect(brandService.createBrand(MOCK_BRAND_DATA))
        .rejects.toHaveProperty('status', 409);
    });
  });

  describe("updateBrand", () => {
    const updateData = { name: 'NewBrandName' };

    it("debería llamar a update si no se proporciona categoryId", async () => {
      await brandService.updateBrand(MOCK_BRAND_ID, updateData);
      expect(mockCategoryRepository.findById.called).toBe(false);
      expect(mockBrandRepository.update.calledOnce).toBe(true);
    });

    it("debería verificar la categoría y llamar a update si se proporciona categoryId", async () => {
      const updateDataWithCategory = { name: 'NewName', categoryId: MOCK_CATEGORY_ID };
      await brandService.updateBrand(MOCK_BRAND_ID, updateDataWithCategory);

      expect(mockCategoryRepository.findById.calledOnce).toBe(true);
      expect(mockBrandRepository.update.calledOnce).toBe(true);
    });

    it("debería lanzar 404 si la nueva categoría no existe", async () => {
      const updateDataWithCategory = { name: 'NewName', categoryId: 'nonexistent' };
      mockCategoryRepository.findById.resolves(null);

      await expect(brandService.updateBrand(MOCK_BRAND_ID, updateDataWithCategory))
        .rejects.toHaveProperty('status', 404);

      expect(mockBrandRepository.update.called).toBe(false);
    });

    it("debería lanzar 409 si otra marca ya tiene ese nombre (ConflictError)", async () => {
      const conflictError = new ConflictError("El recurso ya existe.");
      mockBrandRepository.update.rejects(conflictError);

      await expect(brandService.updateBrand(MOCK_BRAND_ID, updateData))
        .rejects.toHaveProperty('status', 409);
    });

    it("debería propagar un error no 409/404", async () => {
      const dbError = new Error("DB Failed");
      mockBrandRepository.update.rejects(dbError);
      await expect(brandService.updateBrand(MOCK_BRAND_ID, updateData))
        .rejects.toThrow(dbError);
    });
  });

  describe("deleteBrand", () => {
    it("debería llamar a delete si no hay productos asociados", async () => {
      await brandService.deleteBrand(MOCK_BRAND_ID);

      expect(mockBrandRepository.findById.calledOnce).toBe(true);
      expect(mockProductRepository.countByBrandId.calledOnce).toBe(true);
      expect(mockBrandRepository.delete.calledOnce).toBe(true);
    });

    it("debería lanzar 404 si la marca no existe", async () => {
      mockBrandRepository.findById.resolves(null);

      await expect(brandService.deleteBrand(MOCK_BRAND_ID))
        .rejects.toHaveProperty('status', 404);

      expect(mockProductRepository.countByBrandId.called).toBe(false);
      expect(mockBrandRepository.delete.called).toBe(false);
    });

    it("debería lanzar 409 si hay productos asociados", async () => {
      mockProductRepository.countByBrandId.resolves(3);

      await expect(brandService.deleteBrand(MOCK_BRAND_ID))
        .rejects.toHaveProperty('status', 409);

      expect(mockBrandRepository.delete.called).toBe(false);
    });
  });

  describe("getBrandsByCategory", () => {
    it("debería llamar a findByCategoryId del repositorio", async () => {
      mockBrandRepository.findByCategoryId.resolves([{ name: 'Test' }]);
      const result = await brandService.getBrandsByCategory(MOCK_CATEGORY_ID);

      expect(mockBrandRepository.findByCategoryId.calledOnce).toBe(true);
      expect(result).toEqual([{ name: 'Test' }]);
    });
  });
});