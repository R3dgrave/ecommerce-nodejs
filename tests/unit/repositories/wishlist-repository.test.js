const sinon = require("sinon");
const WishlistRepository = require("../../../src/repositories/wishlist-repository");
const mongoose = require("mongoose");

describe("WishlistRepository", () => {
  let repository;
  let ModelMock;
  const MOCK_USER_ID = new mongoose.Types.ObjectId();

  beforeEach(() => {
    ModelMock = {
      findOne: sinon.stub(),
      findOneAndUpdate: sinon.stub()
    };
    repository = new WishlistRepository(ModelMock);
  });

  describe("findByUserId", () => {
    it("debería ejecutar populate si se solicita en las opciones", async () => {
      const mockQuery = {
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves({ userId: MOCK_USER_ID, products: [], toObject: () => ({}) })
      };
      ModelMock.findOne.returns(mockQuery);

      await repository.findByUserId(MOCK_USER_ID, { populate: true });

      expect(mockQuery.populate.calledWith('products')).toBe(true);
    });
  });

  describe("updateByUserId", () => {
    it("debería usar findOneAndUpdate con upsert: true", async () => {
      const mockQuery = {
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves({ toObject: () => ({}) })
      };
      ModelMock.findOneAndUpdate.returns(mockQuery);

      await repository.updateByUserId(MOCK_USER_ID, { $push: { products: 'id' } });

      const args = ModelMock.findOneAndUpdate.getCall(0).args;
      expect(args[2].upsert).toBe(true);
    });
  });
});