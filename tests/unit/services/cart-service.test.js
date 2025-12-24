const sinon = require("sinon");
const CartService = require("../../../src/services/cart-service");
const { NotFoundError, BusinessLogicError } = require("../../../src/utils/errors");

describe("CartService", () => {
  let cartService, mockCartRepo, mockProductRepo;

  const MOCK_USER_ID = "user123";
  const MOCK_PRODUCT_ID = "prod123";
  const MOCK_PRODUCT = { id: MOCK_PRODUCT_ID, stock: 10, price: 100, name: "Test Product" };

  beforeEach(() => {
    sinon.restore();
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

  describe("getCartByUserId", () => {
    it("debería retornar el carrito si existe", async () => {
      const mockCart = { userId: MOCK_USER_ID, items: [] };
      mockCartRepo.findByUserId.resolves(mockCart);

      const result = await cartService.getCartByUserId(MOCK_USER_ID);

      expect(result).toEqual(mockCart);
      expect(mockCartRepo.save.called).toBe(false);
    });

    it("debería crear y retornar un nuevo carrito si no existe", async () => {
      mockCartRepo.findByUserId.resolves(null);
      mockCartRepo.save.resolves({ userId: MOCK_USER_ID, items: [], totalAmount: 0 });

      const result = await cartService.getCartByUserId(MOCK_USER_ID);

      expect(mockCartRepo.save.calledOnce).toBe(true);
      expect(result.userId).toBe(MOCK_USER_ID);
    });
  });

  describe("addItemToCart", () => {
    it("debería lanzar NotFoundError si el producto no existe", async () => {
      mockProductRepo.findById.resolves(null);

      await expect(cartService.addItemToCart(MOCK_USER_ID, MOCK_PRODUCT_ID))
        .rejects.toThrow(NotFoundError);
    });

    it("debería lanzar BusinessLogicError si el stock inicial es insuficiente", async () => {
      mockProductRepo.findById.resolves({ ...MOCK_PRODUCT, stock: 2 });

      await expect(cartService.addItemToCart(MOCK_USER_ID, MOCK_PRODUCT_ID, 5))
        .rejects.toThrow(BusinessLogicError);
    });

    it("debería añadir un producto nuevo al carrito exitosamente", async () => {
      mockProductRepo.findById.resolves(MOCK_PRODUCT);
      mockCartRepo.findByUserId.resolves({ userId: MOCK_USER_ID, items: [] });
      mockCartRepo.updateByUserId.resolves({ success: true });

      await cartService.addItemToCart(MOCK_USER_ID, MOCK_PRODUCT_ID, 2);

      const updateCall = mockCartRepo.updateByUserId.firstCall.args[1];
      expect(updateCall.items).toHaveLength(1);
      expect(updateCall.items[0].productId).toBe(MOCK_PRODUCT_ID);
      expect(updateCall.items[0].quantity).toBe(2);
    });

    it("debería incrementar la cantidad si el producto ya está en el carrito", async () => {
      mockProductRepo.findById.resolves(MOCK_PRODUCT);
      const existingCart = {
        userId: MOCK_USER_ID,
        items: [{ productId: MOCK_PRODUCT_ID, quantity: 1, price: 100 }]
      };
      mockCartRepo.findByUserId.resolves(existingCart);

      await cartService.addItemToCart(MOCK_USER_ID, MOCK_PRODUCT_ID, 2);

      const updateCall = mockCartRepo.updateByUserId.firstCall.args[1];
      expect(updateCall.items[0].quantity).toBe(3);
    });

    it("debería lanzar BusinessLogicError si la suma total excede el stock", async () => {
      mockProductRepo.findById.resolves({ ...MOCK_PRODUCT, stock: 5 });
      const existingCart = {
        userId: MOCK_USER_ID,
        items: [{ productId: MOCK_PRODUCT_ID, quantity: 4, price: 100 }]
      };
      mockCartRepo.findByUserId.resolves(existingCart);

      await expect(cartService.addItemToCart(MOCK_USER_ID, MOCK_PRODUCT_ID, 2))
        .rejects.toThrow(BusinessLogicError);
    });
  });

  describe("removeItem", () => {
    it("debería filtrar el producto y actualizar el carrito", async () => {
      const cart = {
        userId: MOCK_USER_ID,
        items: [
          { productId: "prod1", quantity: 1 },
          { productId: "prod2", quantity: 1 }
        ]
      };
      mockCartRepo.findByUserId.resolves(cart);

      await cartService.removeItem(MOCK_USER_ID, "prod1");

      const updateCall = mockCartRepo.updateByUserId.firstCall.args[1];
      expect(updateCall.items).toHaveLength(1);
      expect(updateCall.items[0].productId).toBe("prod2");
    });

    it("debería lanzar NotFoundError si no existe el carrito al intentar remover", async () => {
      mockCartRepo.findByUserId.resolves(null);

      await expect(cartService.removeItem(MOCK_USER_ID, "any"))
        .rejects.toThrow(NotFoundError);
    });
  });
});