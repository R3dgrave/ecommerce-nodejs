const sinon = require("sinon");
const ProductService = require("../../../src/services/product-service");
const { NotFoundError, ConflictError } = require("../../../src/utils/errors");

describe("ProductService", () => {
  let productService;
  let mockProductRepo, mockCategoryRepo, mockBrandRepo;

  const MOCK_ID = "prod123";
  const MOCK_CAT_ID = "cat123";
  const MOCK_BRAND_ID = "brand123";

  const MOCK_PRODUCT_DATA = {
    name: "Laptop Gamer",
    categoryId: MOCK_CAT_ID,
    brandId: MOCK_BRAND_ID,
    price: 1500,
    stock: 10
  };

  beforeEach(() => {
    sinon.restore();

    mockProductRepo = {
      findWithPagination: sinon.stub(),
      findById: sinon.stub(),
      findBy: sinon.stub(),
      save: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub()
    };

    mockCategoryRepo = { findById: sinon.stub() };
    mockBrandRepo = { findById: sinon.stub() };

    productService = new ProductService(
      mockProductRepo,
      mockCategoryRepo,
      mockBrandRepo
    );
  });

  describe("createProduct", () => {
    it("debería crear el producto si la categoría y marca existen", async () => {
      mockCategoryRepo.findById.resolves({ id: MOCK_CAT_ID });
      mockBrandRepo.findById.resolves({ id: MOCK_BRAND_ID });
      mockProductRepo.save.resolves({ id: MOCK_ID, ...MOCK_PRODUCT_DATA });

      const result = await productService.createProduct(MOCK_PRODUCT_DATA);

      expect(result.id).toBe(MOCK_ID);
      expect(mockProductRepo.save.calledOnce).toBe(true);
    });

    it("debería lanzar NotFoundError si la categoría no existe", async () => {
      mockCategoryRepo.findById.resolves(null);

      await expect(productService.createProduct(MOCK_PRODUCT_DATA))
        .rejects.toThrow(NotFoundError);
      
      expect(mockProductRepo.save.called).toBe(false);
    });

    it("debería lanzar ConflictError si el repositorio devuelve status 409", async () => {
      mockCategoryRepo.findById.resolves({ id: MOCK_CAT_ID });
      mockBrandRepo.findById.resolves({ id: MOCK_BRAND_ID });
      
      const repoError = new Error("Conflict");
      repoError.status = 409;
      mockProductRepo.save.rejects(repoError);

      await expect(productService.createProduct(MOCK_PRODUCT_DATA))
        .rejects.toThrow(ConflictError);
    });
  });

  describe("getAllProducts", () => {
    it("debería construir el filtro de búsqueda correctamente (regex para nombre)", async () => {
      mockProductRepo.findWithPagination.resolves({ data: [], totalCount: 0 });

      const query = { name: "asus", categoryId: MOCK_CAT_ID };
      await productService.getAllProducts(query);

      const filterUsed = mockProductRepo.findWithPagination.firstCall.args[0];
      
      expect(filterUsed.name).toBeDefined();
      expect(filterUsed.name.$regex).toBeInstanceOf(RegExp);
      expect(filterUsed.categoryId).toBe(MOCK_CAT_ID);
    });
  });

  describe("updateProduct", () => {
    it("debería verificar dependencias antes de actualizar", async () => {
      mockCategoryRepo.findById.resolves({ id: MOCK_CAT_ID });
      mockBrandRepo.findById.resolves({ id: MOCK_BRAND_ID });
      mockProductRepo.update.resolves({ id: MOCK_ID });

      await productService.updateProduct(MOCK_ID, MOCK_PRODUCT_DATA);

      expect(mockCategoryRepo.findById.calledWith(MOCK_CAT_ID)).toBe(true);
      expect(mockProductRepo.update.calledOnce).toBe(true);
    });

    it("debería lanzar NotFoundError si el producto a actualizar no existe", async () => {
      mockCategoryRepo.findById.resolves({ id: MOCK_CAT_ID });
      mockBrandRepo.findById.resolves({ id: MOCK_BRAND_ID });
      
      const repoError = new Error("Not Found");
      repoError.status = 404;
      mockProductRepo.update.rejects(repoError);

      await expect(productService.updateProduct(MOCK_ID, MOCK_PRODUCT_DATA))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteProduct", () => {
    it("debería retornar el producto eliminado", async () => {
      mockProductRepo.delete.resolves({ id: MOCK_ID, name: "Deleted" });

      const result = await productService.deleteProduct(MOCK_ID);

      expect(result.id).toBe(MOCK_ID);
    });

    it("debería lanzar NotFoundError si no se encontró el producto para borrar", async () => {
      mockProductRepo.delete.resolves(null);

      await expect(productService.deleteProduct("non-existent"))
        .rejects.toThrow(NotFoundError);
    });
  });
});