const sinon = require("sinon");
const OrderService = require("../../../src/services/order-service");
const { BusinessLogicError, NotFoundError, CustomError } = require("../../../src/utils/errors");

describe("OrderService", () => {
  let orderService;
  let mockOrderRepo, mockCartRepo, mockProductRepo;

  const userId = "user123";
  const mockCart = {
    userId,
    items: [
      {
        productId: { id: "prod1", name: "Laptop", price: 1000, stock: 10 },
        quantity: 2,
      },
    ],
    totalAmount: 2000,
  };

  beforeEach(() => {
    sinon.restore();

    mockOrderRepo = {
      save: sinon.stub(),
      findById: sinon.stub(),
      findByUserId: sinon.stub(),
    };
    mockCartRepo = {
      findByUserId: sinon.stub(),
      updateByUserId: sinon.stub(),
    };
    mockProductRepo = {
      updateStock: sinon.stub(),
    };

    orderService = new OrderService(
      mockOrderRepo,
      mockCartRepo,
      mockProductRepo
    );
  });

  describe("createOrder", () => {
    const shippingData = { address: "Calle Falsa 123", city: "Springfield" };

    it("debería crear una orden exitosamente y actualizar stock/carrito", async () => {
      mockCartRepo.findByUserId.resolves(mockCart);
      mockOrderRepo.save.resolves({ _id: "order999", ...shippingData });
      mockProductRepo.updateStock.resolves(true);
      mockCartRepo.updateByUserId.resolves(true);

      const result = await orderService.createOrder(userId, shippingData);

      expect(result).toBeDefined();

      expect(mockOrderRepo.save.calledOnce).toBe(true);
      const orderSaved = mockOrderRepo.save.firstCall.args[0];
      expect(orderSaved.items[0].price).toBe(1000);
      expect(orderSaved.totalAmount).toBe(2000);

      expect(mockProductRepo.updateStock.calledOnce).toBe(true);
      expect(mockProductRepo.updateStock.firstCall.args).toEqual(["prod1", -2]);

      expect(
        mockCartRepo.updateByUserId.calledWith(userId, {
          items: [],
          totalAmount: 0,
        })
      ).toBe(true);
    });

    it("debería lanzar BusinessLogicError si el carrito está vacío", async () => {
      mockCartRepo.findByUserId.resolves({ items: [] });

      await expect(orderService.createOrder(userId, shippingData))
        .rejects.toThrow(BusinessLogicError);
    });
  });

  describe("getOrderDetails", () => {
    it("debería retornar la orden si pertenece al usuario", async () => {
      const order = { userId: "user123" };
      mockOrderRepo.findById.resolves(order);

      const result = await orderService.getOrderDetails("order1", "user123");
      expect(result).toEqual(order);
    });

    it("debería lanzar 403 si la orden pertenece a otro usuario", async () => {
      const order = { userId: "otro_user" };
      mockOrderRepo.findById.resolves(order);

      try {
        await orderService.getOrderDetails("order1", "user123");
        fail("Debería haber lanzado un error");
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
        expect(error.statusCode).toBe(403);
        expect(error.message).toBe("No tienes permiso para ver esta orden");
      }
    });
  });
});
