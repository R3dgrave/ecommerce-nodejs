const sinon = require("sinon");
const OrderRepository = require("../../../src/repositories/order-repository");

describe("OrderRepository", () => {
  let orderRepository;
  let OrderModelMock;

  beforeEach(() => {
    sinon.restore();

    OrderModelMock = {
      find: sinon.stub(),
      findById: sinon.stub(),
      aggregate: sinon.stub(),
      countDocuments: sinon.stub(),
      updateOne: sinon.stub()
    };

    orderRepository = new OrderRepository(OrderModelMock);
  });

  describe("findByUserId", () => {
    it("debería llamar a findWithPagination con el filtro de userId", async () => {
      const userId = "user123";
      const mockOrders = [{ _id: "order1", totalAmount: 100 }];
      
      // Mockeamos la cadena de Mongoose para findWithPagination
      const findStub = {
        skip: sinon.stub().returnsThis(),
        limit: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves(mockOrders)
      };

      OrderModelMock.find.returns(findStub);
      OrderModelMock.countDocuments.resolves(1);

      const result = await orderRepository.findByUserId(userId, { page: 1, limit: 10 });

      expect(OrderModelMock.find.calledWith({ userId })).toBe(true);
      expect(result.data).toEqual(mockOrders);
      expect(result.totalCount).toBe(1);
    });
  });

  describe("getIncomeStats", () => {
    it("debería ejecutar el pipeline de agregación correctamente", async () => {
      const mockStats = [{ _id: null, totalSales: 5000, count: 5 }];
      OrderModelMock.aggregate.resolves(mockStats);

      const result = await orderRepository.getIncomeStats();

      expect(OrderModelMock.aggregate.calledOnce).toBe(true);
      const pipeline = OrderModelMock.aggregate.firstCall.args[0];
      
      // Verificamos que el primer paso sea filtrar las no canceladas
      expect(pipeline[0].$match.status.$ne).toBe('cancelled');
      expect(result).toEqual(mockStats);
    });
  });

  describe("updateStatus", () => {
    it("debería actualizar solo el campo status", async () => {
      const orderId = "order123";
      const newStatus = "paid";
      
      const updateMock = {
        exec: sinon.stub().resolves({ _id: orderId, status: newStatus })
      };
      OrderModelMock.updateOne.returns(updateMock);

      await orderRepository.updateStatus(orderId, newStatus);

      expect(OrderModelMock.updateOne.calledWith(
        { _id: orderId }, 
        { status: newStatus }
      )).toBe(true);
    });
  });
});