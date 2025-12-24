const sinon = require("sinon");
const ProductRepository = require("../../../src/repositories/product-repository");
const mongoose = require("mongoose");

describe("ProductRepository", () => {
  let productRepository;
  let MockProductModel;
  const MOCK_ID = new mongoose.Types.ObjectId();

  const createMockDoc = (data) => ({
    _id: MOCK_ID,
    ...data,
    toObject: sinon.stub().returns({ _id: MOCK_ID, ...data })
  });

  beforeEach(() => {
    sinon.restore();
    MockProductModel = {
      find: sinon.stub(),
      findById: sinon.stub(),
      countDocuments: sinon.stub().resolves(10),
      findByIdAndUpdate: sinon.stub()
    };
    productRepository = new ProductRepository(MockProductModel);
  });

  describe("findById", () => {
    it("debería aplicar populate y devolver el producto con id", async () => {
      const mockDoc = createMockDoc({ name: "Laptop" });
      const queryChain = {
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves(mockDoc)
      };
      MockProductModel.findById.returns(queryChain);

      const result = await productRepository.findById(MOCK_ID.toString(), { populateBrand: true });

      expect(queryChain.populate.calledWith("brandId", "name categoryId")).toBe(true);
      expect(result.id).toBe(MOCK_ID.toString());
      expect(result).not.toHaveProperty("_id");
    });
  });

  describe("findWithPagination", () => {
    it("debería retornar la estructura paginada con objetos transformados", async () => {
      const mockDocs = [createMockDoc({ name: "P1" }), createMockDoc({ name: "P2" })];
      const queryChain = {
        skip: sinon.stub().returnsThis(),
        limit: sinon.stub().returnsThis(),
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves(mockDocs)
      };
      MockProductModel.find.returns(queryChain);

      const result = await productRepository.findWithPagination({}, { page: 1, limit: 2 });

      expect(result.data[0].id).toBe(MOCK_ID.toString());
      expect(result.totalCount).toBe(10);
      expect(result.currentPage).toBe(1);
    });
  });

  describe("updateStock", () => {
    it("debería usar $inc y retornar el producto con id", async () => {
      const updatedDoc = createMockDoc({ name: "Laptop", stock: 15 });
      MockProductModel.findByIdAndUpdate.returns({ exec: sinon.stub().resolves(updatedDoc) });

      const result = await productRepository.updateStock(MOCK_ID.toString(), 5);

      expect(MockProductModel.findByIdAndUpdate.calledWith(
        MOCK_ID.toString(),
        { $inc: { stock: 5 } },
        { new: true }
      )).toBe(true);
      expect(result.id).toBe(MOCK_ID.toString());
    });
  });
});