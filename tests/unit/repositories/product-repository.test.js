const sinon = require("sinon");
const ProductRepository = require("../../../src/repositories/product-repository");
const mongoose = require("mongoose");

const MockProductModel = {
  find: sinon.stub(),
  findById: sinon.stub(),
  countDocuments: sinon.stub(),
};

const MOCK_PRODUCT_ID = new mongoose.Types.ObjectId().toString();
const MOCK_CATEGORY_ID = new mongoose.Types.ObjectId().toString();
const MOCK_BRAND_ID = new mongoose.Types.ObjectId().toString();
const MOCK_PRODUCT_DATA = {
  name: "Laptop X",
  categoryId: MOCK_CATEGORY_ID,
  brandId: MOCK_BRAND_ID,
};
const MOCK_PLAIN_PRODUCT = { ...MOCK_PRODUCT_DATA, _id: MOCK_PRODUCT_ID };
const MOCK_MONGOOSE_DOC = {
  toObject: () => MOCK_PLAIN_PRODUCT,
};
const MOCK_MONGOOSE_DOCS = [MOCK_MONGOOSE_DOC];

describe("ProductRepository", () => {
  let productRepository;
  let baseRepositoryStubs = {};
  let queryStubs = {};

  beforeEach(() => {
    sinon.restore();
    productRepository = new ProductRepository(MockProductModel);

    queryStubs.exec = sinon.stub().resolves(MOCK_MONGOOSE_DOCS);
    queryStubs.execSingle = sinon.stub().resolves(MOCK_MONGOOSE_DOC);

    queryStubs.populate = sinon.stub().returns(queryStubs);
    queryStubs.skip = sinon.stub().returns(queryStubs);
    queryStubs.limit = sinon.stub().returns(queryStubs);

    MockProductModel.find.returns(queryStubs);
    MockProductModel.findById.returns(queryStubs);

    MockProductModel.countDocuments.resolves(10);

    baseRepositoryStubs._toPlainObject = sinon
      .stub(productRepository, "_toPlainObject")
      .returns(MOCK_PLAIN_PRODUCT);
    baseRepositoryStubs._toPlainObjectArray = sinon
      .stub(productRepository, "_toPlainObjectArray")
      .returns([MOCK_PLAIN_PRODUCT]);
  });

  // --- Pruebas de Población Privada ---
  describe("_applyPopulate", () => {
    it("debería poblar brandId y categoryId cuando se solicitan", () => {
      const mockQuery = { populate: sinon.stub().returnsThis() };
      const options = { populateBrand: true, populateCategory: true };

      productRepository._applyPopulate(mockQuery, options);

      expect(mockQuery.populate.calledTwice).toBe(true);
      expect(mockQuery.populate.calledWith("brandId", "name categoryId")).toBe(
        true
      );
      expect(mockQuery.populate.calledWith("categoryId", "name")).toBe(true);
    });

    it("no debería poblar nada si las opciones son falsas", () => {
      const mockQuery = { populate: sinon.stub().returnsThis() };
      const options = { populateBrand: false, populateCategory: false };

      productRepository._applyPopulate(mockQuery, options);
      expect(mockQuery.populate.called).toBe(false);
    });
  });

  // --- Pruebas de Sobreescritura de findById ---
  describe("findById", () => {
    it("debería llamar a findById de Mongoose", async () => {
      await productRepository.findById(MOCK_PRODUCT_ID);
      expect(MockProductModel.findById.calledOnce).toBe(true);
      expect(MockProductModel.findById.calledWith(MOCK_PRODUCT_ID)).toBe(true);
    });

    it("debería usar execSingle y devolver el resultado", async () => {
      const findByIdQueryStubs = {
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves(MOCK_MONGOOSE_DOC),
      };
      MockProductModel.findById.returns(findByIdQueryStubs);

      const result = await productRepository.findById(MOCK_PRODUCT_ID);
      expect(result).toEqual(MOCK_PLAIN_PRODUCT);
      expect(baseRepositoryStubs._toPlainObject.calledOnce).toBe(true);
    });

    it("debería poblar brandId si populateBrand es true", async () => {
      const populateStub = sinon.stub().returns({
        exec: queryStubs.execSingle,
        populate: sinon.stub().returnsThis(),
      });
      MockProductModel.findById.returns({
        exec: queryStubs.execSingle,
        populate: populateStub,
      });

      await productRepository.findById(MOCK_PRODUCT_ID, {
        populateBrand: true,
      });

      expect(populateStub.calledOnce).toBe(true);
      expect(populateStub.calledWith("brandId", "name categoryId")).toBe(true);
    });
  });

  // --- Pruebas de Sobreescritura de findWithPagination ---
  describe("findWithPagination", () => {
    it("debería aplicar la población a la consulta de documentos", async () => {
      MockProductModel.find.returns(queryStubs);

      await productRepository.findWithPagination(
        {},
        { page: 1, limit: 10, populate: "categoryId" }
      );

      expect(queryStubs.skip.calledOnce).toBe(true);
      expect(queryStubs.limit.calledOnce).toBe(true);
      expect(queryStubs.populate.calledOnce).toBe(true);
      expect(MockProductModel.countDocuments.calledOnce).toBe(true);
      expect(queryStubs.exec.calledOnce).toBe(true);
    });

    it("debería devolver el formato de paginación correcto", async () => {
      const result = await productRepository.findWithPagination(
        {},
        { page: 1, limit: 10 }
      );

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("totalCount", 10);
      expect(result.data).toEqual([MOCK_PLAIN_PRODUCT]);
      expect(result.totalPages).toBe(1);
    });
  });

  // --- Pruebas de Métodos de Filtrado Específicos ---
  describe("findByCategoryId", () => {
    it("debería llamar a findBy con el filtro de categoryId", async () => {
      const findByStub = sinon.stub(productRepository, "findBy").resolves([]);
      const options = { populateBrand: true };

      await productRepository.findByCategoryId(MOCK_CATEGORY_ID, options);

      expect(findByStub.calledOnce).toBe(true);
      expect(
        findByStub.calledWith({ categoryId: MOCK_CATEGORY_ID }, options)
      ).toBe(true);
    });
  });

  describe("countByBrandId", () => {
    beforeEach(() => {
      MockProductModel.countDocuments.resetHistory();
      MockProductModel.countDocuments.resolves(5);
    });

    it("debería llamar a countDocuments con el filtro de brandId", async () => {
      await productRepository.countByBrandId(MOCK_BRAND_ID);

      expect(MockProductModel.countDocuments.calledOnce).toBe(true);
      expect(
        MockProductModel.countDocuments.calledWith({ brandId: MOCK_BRAND_ID })
      ).toBe(true);

      const result = await productRepository.countByBrandId(MOCK_BRAND_ID);
      expect(result).toBe(5);
    });
  });

  describe("updateStock", () => {
    it("debería llamar a findByIdAndUpdate con el operador $inc", async () => {
      const mockUpdatedProduct = { ...MOCK_PLAIN_PRODUCT, stock: 10 };
      MockProductModel.findByIdAndUpdate = sinon.stub().returns({
        exec: sinon.stub().resolves(mockUpdatedProduct),
      });
      MockProductModel.findByIdAndUpdate.resolves(mockUpdatedProduct);

      const productId = MOCK_PRODUCT_ID;
      const quantity = -5;

      const result = await productRepository.updateStock(productId, quantity);

      expect(MockProductModel.findByIdAndUpdate.calledOnce).toBe(true);
      expect(
        MockProductModel.findByIdAndUpdate.calledWith(
          productId,
          { $inc: { stock: quantity } },
          { new: true }
        )
      ).toBe(true);
      expect(result).toEqual(mockUpdatedProduct);
    });
  });
});
