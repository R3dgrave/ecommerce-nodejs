const sinon = require("sinon");
const CartRepository = require("../../../src/repositories/cart-repository");
const mongoose = require('mongoose');

let MockCartModel

describe("CartRepository", () => {
  let cartRepository;

  beforeEach(() => {

    MockCartModel = {
      findOne: sinon.stub(),
    };

    cartRepository = new CartRepository(MockCartModel);
  });

  describe("findByUserId", () => {
    it("debería buscar un carrito por userId y poblar los productos", async () => {
      const mockCartFromDb = {
        _id: new mongoose.Types.ObjectId(),
        userId: "user123",
        items: [],
        toObject: sinon.stub().returns({ _id: "507f1f0876201", userId: "user123", items: [] })
      };

      const mockQuery = {
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves(mockCartFromDb)
      };

      MockCartModel.findOne.returns(mockQuery);

      const result = await cartRepository.findByUserId("user123");

      expect(result.id).toBeDefined();
      expect(result._id).toBeUndefined();
      expect(MockCartModel.findOne.calledWith({ userId: "user123" })).toBe(true);
    });
  });
});