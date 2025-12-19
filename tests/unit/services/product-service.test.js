const sinon = require("sinon");
const ProductService = require("../../../src/services/product-service");
const { ConflictError } = require("../../../src/repositories/base-repository");
const mongoose = require("mongoose");

const MOCK_PRODUCT_ID = new mongoose.Types.ObjectId().toString();
const MOCK_CATEGORY_ID = new mongoose.Types.ObjectId().toString();
const MOCK_BRAND_ID = new mongoose.Types.ObjectId().toString();

const MOCK_PRODUCT_DATA = {
  name: "Widget Pro",
  categoryId: MOCK_CATEGORY_ID,
  brandId: MOCK_BRAND_ID,
  price: 100,
  stock: 50,
};
const MOCK_SAVED_PRODUCT = { ...MOCK_PRODUCT_DATA, _id: MOCK_PRODUCT_ID };
const MOCK_CATEGORY_EXISTING = { id: MOCK_CATEGORY_ID, name: 'Gadgets' };
const MOCK_BRAND_EXISTING = { id: MOCK_BRAND_ID, name: 'Acme' };

const mockProductRepository = {
  findWithPagination: sinon.stub(),
  findById: sinon.stub(),
  findBy: sinon.stub(),
  save: sinon.stub(),
  update: sinon.stub(),
  delete: sinon.stub(),
};

const mockCategoryRepository = {
  findById: sinon.stub(),
};

const mockBrandRepository = {
  findById: sinon.stub(),
};

const productService = new ProductService(
  mockProductRepository,
  mockCategoryRepository,
  mockBrandRepository
);

describe("ProductService", () => {
  beforeEach(() => {
    sinon.resetHistory();

    mockCategoryRepository.findById.resolves(MOCK_CATEGORY_EXISTING);
    mockBrandRepository.findById.resolves(MOCK_BRAND_EXISTING);

    mockProductRepository.save.resolves(MOCK_SAVED_PRODUCT);
    mockProductRepository.findById.resolves(MOCK_SAVED_PRODUCT);
    mockProductRepository.update.resolves({ matchedCount: 1, modifiedCount: 1 });
    mockProductRepository.delete.resolves(MOCK_SAVED_PRODUCT);

    // Configuración por defecto para paginación
    mockProductRepository.findWithPagination.resolves({
      data: [MOCK_SAVED_PRODUCT],
      totalCount: 1,
      totalPages: 1,
      currentPage: 1
    });
  });

  // --- Pruebas de Creación (Validación de Dependencias) ---
  describe("createProduct", () => {
    it("debería llamar a save después de verificar Category y Brand", async () => {
      const result = await productService.createProduct(MOCK_PRODUCT_DATA);

      expect(mockCategoryRepository.findById.calledOnce).toBe(true);
      expect(mockBrandRepository.findById.calledOnce).toBe(true);
      expect(mockProductRepository.save.calledOnce).toBe(true);
      expect(result).toEqual(MOCK_SAVED_PRODUCT);
    });

    it("debería lanzar 404 si la categoría no existe", async () => {
      mockCategoryRepository.findById.resolves(null);

      await expect(productService.createProduct(MOCK_PRODUCT_DATA))
        .rejects.toHaveProperty('status', 404);
      expect(mockBrandRepository.findById.called).toBe(false);
      expect(mockProductRepository.save.called).toBe(false);
    });

    it("debería lanzar 404 si la marca no existe", async () => {
      mockBrandRepository.findById.resolves(null);

      await expect(productService.createProduct(MOCK_PRODUCT_DATA))
        .rejects.toHaveProperty('status', 404);
      expect(mockCategoryRepository.findById.calledOnce).toBe(true);
      expect(mockProductRepository.save.called).toBe(false);
    });

    it("debería lanzar 409 si el producto ya existe (ConflictError)", async () => {
      const conflictError = new ConflictError("El recurso ya existe.");
      mockProductRepository.save.rejects(conflictError);

      await expect(productService.createProduct(MOCK_PRODUCT_DATA))
        .rejects.toHaveProperty('status', 409);
    });
  });

  // --- Pruebas de Consulta ---

  describe("getProductById", () => {
    it("debería llamar a findById sin opciones de población por defecto", async () => {
      await productService.getProductById(MOCK_PRODUCT_ID);
      expect(mockProductRepository.findById.calledOnce).toBe(true);
      expect(mockProductRepository.findById.calledWith(MOCK_PRODUCT_ID, {})).toBe(true);
    });

    it("debería llamar a findById con opciones de población específicas", async () => {
      const opts = { populateBrand: true };
      await productService.getProductById(MOCK_PRODUCT_ID, opts);
      expect(mockProductRepository.findById.calledWith(MOCK_PRODUCT_ID, opts)).toBe(true);
    });

    it("debería lanzar 404 si el producto no existe", async () => {
      mockProductRepository.findById.resolves(null);
      await expect(productService.getProductById(MOCK_PRODUCT_ID))
        .rejects.toHaveProperty('status', 404);
    });
  });

  describe("getProductsByIds", () => {
    it("debería llamar a findBy con el filtro $in y opciones de población", async () => {
      const ids = [MOCK_PRODUCT_ID, new mongoose.Types.ObjectId().toString()];
      const opts = { populateCategory: true };

      await productService.getProductsByIds(ids, opts);

      expect(mockProductRepository.findBy.calledOnce).toBe(true);
      expect(mockProductRepository.findBy.calledWith({ _id: { $in: ids } }, opts)).toBe(true);
    });
  });

  describe("getAllProducts (Paginación y Filtros)", () => {
    const queryParams = {
      page: 2,
      limit: 5,
      name: 'Widget',
      categoryId: MOCK_CATEGORY_ID,
      brandId: MOCK_BRAND_ID
    };
    const populateOpts = { populateBrand: true };

    it("debería llamar a findWithPagination con filtros y opciones correctas", async () => {
      await productService.getAllProducts(queryParams, populateOpts);

      const expectedFilter = {
        name: { $regex: new RegExp('Widget', 'i') },
        categoryId: MOCK_CATEGORY_ID,
        brandId: MOCK_BRAND_ID
      };
      const expectedOptions = { page: 2, limit: 5 };

      expect(mockProductRepository.findWithPagination.calledOnce).toBe(true);

      expect(mockProductRepository.findWithPagination.calledWith(
        expectedFilter,
        expectedOptions,
        populateOpts
      )).toBe(true);
    });

    it("debería usar valores por defecto si no se proporcionan filtros", async () => {
      const defaultPopulate = {};
      await productService.getAllProducts({}, defaultPopulate);

      const expectedFilter = {};
      const expectedOptions = { page: 1, limit: 10 };

      expect(mockProductRepository.findWithPagination.calledWith(
        expectedFilter,
        expectedOptions,
        defaultPopulate
      )).toBe(true);
    });
  });
});