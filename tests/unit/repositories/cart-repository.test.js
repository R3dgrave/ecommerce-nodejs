const sinon = require("sinon");
const CartRepository = require("../../../src/repositories/cart-repository");
const mongoose = require('mongoose');

let MockCartModel

describe("CartRepository", () => {
  let cartRepository;

  beforeEach(() => {

    MockCartModel = {
      findOne: sinon.stub(),
      findOneAndUpdate: sinon.stub(),
      create: sinon.stub()
    };

    cartRepository = new CartRepository(MockCartModel);
  });

  describe("findByUserId", () => {
    it("debería buscar un carrito por userId y poblar los productos", async () => {
      const mockQuery = {
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves({})
      };
      MockCartModel.findOne.returns(mockQuery);

      await cartRepository.findByUserId("123");

      expect(MockCartModel.findOne.calledOnce).toBe(true);
    });
  });
});