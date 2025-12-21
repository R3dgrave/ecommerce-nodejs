const sinon = require("sinon");
const OrderService = require("../../../src/services/order-service");
const { CustomError } = require("../../../src/utils/errors");

describe("OrderService", () => {
  let orderService;
  let mockOrderRepo, mockCartRepo, mockProductRepo;

  const userId = "user123";
  const mockCart = {
    userId,
    items: [
      {
        productId: { _id: "prod1", name: "Laptop", price: 1000, stock: 10 },
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
      update: sinon.stub(),
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
      // Configuración de stubs
      mockCartRepo.findByUserId.resolves(mockCart);
      mockOrderRepo.save.resolves({ _id: "order999", ...shippingData });
      mockProductRepo.update.resolves(true);
      mockCartRepo.updateByUserId.resolves(true);

      const result = await orderService.createOrder(userId, shippingData);

      // Verificaciones
      expect(result).toBeDefined();

      // 1. ¿Guardó la orden con los precios congelados?
      expect(mockOrderRepo.save.calledOnce).toBe(true);
      const orderSaved = mockOrderRepo.save.firstCall.args[0];
      expect(orderSaved.items[0].price).toBe(1000);
      expect(orderSaved.totalAmount).toBe(2000);

      // 2. ¿Descontó el stock correctamente usando $inc negativo?
      expect(mockProductRepo.update.calledOnce).toBe(true);
      expect(mockProductRepo.update.firstCall.args[1]).toEqual({
        $inc: { stock: -2 },
      });

      // 3. ¿Vació el carrito?
      expect(
        mockCartRepo.updateByUserId.calledWith(userId, {
          items: [],
          totalAmount: 0,
        })
      ).toBe(true);
    });

    it("debería lanzar error si el carrito está vacío", async () => {
      mockCartRepo.findByUserId.resolves({ items: [] });

      await expect(
        orderService.createOrder(userId, shippingData)
      ).rejects.toThrow("El carrito está vacío");
    });

    it("debería lanzar error si no hay stock suficiente", async () => {
      const cartInsufficientStock = {
        items: [
          {
            productId: { _id: "prod1", name: "Laptop", stock: 1 },
            quantity: 5,
          },
        ],
      };
      mockCartRepo.findByUserId.resolves(cartInsufficientStock);

      await expect(
        orderService.createOrder(userId, shippingData)
      ).rejects.toThrow(/Stock insuficiente/);

      expect(mockOrderRepo.save.called).toBe(false);
    });
  });

  describe("getOrderDetails", () => {
    it("debería retornar la orden si pertenece al usuario", async () => {
      const order = { _id: "order1", userId: "user123" };
      mockOrderRepo.findById.resolves(order);

      const result = await orderService.getOrderDetails("order1", "user123");
      expect(result).toEqual(order);
    });

    it("debería lanzar 403 si la orden pertenece a otro usuario", async () => {
      const order = { _id: "order1", userId: "otro_user" };
      mockOrderRepo.findById.resolves(order);

      await expect(orderService.getOrderDetails("order1", "user123"))
        .rejects.toMatchObject({
          status: 403,
          message: "No tienes permiso para ver esta orden"
        });
    });
  });
});
