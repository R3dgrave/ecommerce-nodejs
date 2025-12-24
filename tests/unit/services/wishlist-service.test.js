const sinon = require("sinon");
const WishlistService = require("../../../src/services/wishlist-service");
const { NotFoundError } = require("../../../src/utils/errors");

describe("WishlistService", () => {
  let service;
  let wishlistRepoMock;
  let productRepoMock;

  beforeEach(() => {
    wishlistRepoMock = {
      findByUserId: sinon.stub(),
      save: sinon.stub(),
      updateByUserId: sinon.stub()
    };
    productRepoMock = { findById: sinon.stub() };
    service = new WishlistService(wishlistRepoMock, productRepoMock);
  });

  describe("addProduct", () => {
    it("debería lanzar NotFoundError si el producto no existe", async () => {
      productRepoMock.findById.resolves(null);

      await expect(service.addProduct("user123", "prod123"))
        .rejects.toThrow(NotFoundError);
    });

    it("debería llamar a updateByUserId con $addToSet", async () => {
      productRepoMock.findById.resolves({ id: "prod123" });
      wishlistRepoMock.updateByUserId.resolves({ id: "wish123" });

      await service.addProduct("user123", "prod123");

      expect(wishlistRepoMock.updateByUserId.calledWith("user123", {
        $addToSet: { products: "prod123" }
      })).toBe(true);
    });
  });
});