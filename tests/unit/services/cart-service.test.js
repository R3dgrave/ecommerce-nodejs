const sinon = require("sinon");
const CartService = require("../../../src/services/cart-service");

describe("CartService", () => {
  let cartService, mockCartRepo, mockProductRepo;

  beforeEach(() => {
    mockCartRepo = {
      findByUserId: sinon.stub(),
      updateByUserId: sinon.stub(),
      save: sinon.stub()
    };
    mockProductRepo = {
      findById: sinon.stub()
    };
    cartService = new CartService(mockCartRepo, mockProductRepo);
  });

  it("debería lanzar error si el producto no tiene stock suficiente", async () => {
    const userId = "user123";
    const productId = "prod123";

    // Mock de producto con solo 2 unidades
    mockProductRepo.findById.resolves({ _id: productId, stock: 2, price: 100 });
    mockCartRepo.findByUserId.resolves({ userId, items: [] });

    // Intentamos añadir 5 unidades
    await expect(cartService.addItemToCart(userId, productId, 5)).rejects.toThrow(/Stock insuficiente/);
    expect(mockCartRepo.updateByUserId.called).toBe(false);
  });

  it("debería añadir el producto si hay stock disponible", async () => {
    const userId = "user123";
    const productId = "prod123";

    mockProductRepo.findById.resolves({ _id: productId, stock: 10, price: 100 });
    mockCartRepo.findByUserId.resolves({ userId, items: [] });
    mockCartRepo.updateByUserId.resolves({ userId, items: [{ productId, quantity: 2 }] });

    await cartService.addItemToCart(userId, productId, 2);

    expect(mockCartRepo.updateByUserId.calledOnce).toBe(true);
    expect(mockCartRepo.updateByUserId.calledWith(userId, sinon.match({ items: sinon.match.any }))).toBe(true);
  });
});