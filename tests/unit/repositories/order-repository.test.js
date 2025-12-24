const sinon = require("sinon");
const OrderRepository = require("../../../src/repositories/order-repository");
const mongoose = require("mongoose");

describe("OrderRepository", () => {
  let orderRepository;
  let OrderModelMock;

  beforeEach(() => {
    sinon.restore();

    OrderModelMock = {
      find: sinon.stub(),
      findById: sinon.stub(),
      findByIdAndUpdate: sinon.stub(),
      aggregate: sinon.stub(),
      countDocuments: sinon.stub(),
    };

    orderRepository = new OrderRepository(OrderModelMock);
  });

  describe("findByUserId", () => {
    it("debería devolver órdenes con id transformado mediante paginación", async () => {
      const userId = "user123";
      const rawId = new mongoose.Types.ObjectId();
      
      const mockOrdersFromDb = [{ 
        _id: rawId, 
        totalAmount: 100,
        toObject: sinon.stub().returns({ _id: rawId, totalAmount: 100 })
      }];
      
      const findStub = {
        skip: sinon.stub().returnsThis(),
        limit: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves(mockOrdersFromDb)
      };

      OrderModelMock.find.returns(findStub);
      OrderModelMock.countDocuments.resolves(1);

      const result = await orderRepository.findByUserId(userId, { page: 1, limit: 10 });

      expect(OrderModelMock.find.calledWith({ userId })).toBe(true);
      expect(result.data[0].id).toBe(rawId.toString());
      expect(result.data[0]).not.toHaveProperty('_id');
    });
  });

  describe("getIncomeStats", () => {
    it("debería retornar un objeto formateado en lugar del array de Mongo", async () => {
      const mockStats = [{ _id: null, totalSales: 5000, count: 5 }];
      OrderModelMock.aggregate.resolves(mockStats);

      const result = await orderRepository.getIncomeStats();

      expect(OrderModelMock.aggregate.calledOnce).toBe(true);
      expect(result).toEqual({ totalSales: 5000, count: 5 });
    });

    it("debería retornar valores en cero si no hay estadísticas", async () => {
      OrderModelMock.aggregate.resolves([]);
      const result = await orderRepository.getIncomeStats();
      expect(result).toEqual({ totalSales: 0, count: 0 });
    });
  });

  describe("updateStatus", () => {
    it("debería llamar al método update del padre y retornar id", async () => {
      const orderId = new mongoose.Types.ObjectId();
      const newStatus = "paid";
      
      const mockUpdatedDoc = {
        _id: orderId,
        status: newStatus,
        toObject: sinon.stub().returns({ _id: orderId, status: newStatus })
      };

      OrderModelMock.findByIdAndUpdate.returns({
        exec: sinon.stub().resolves(mockUpdatedDoc)
      });

      const result = await orderRepository.updateStatus(orderId.toString(), newStatus);

      expect(result.id).toBe(orderId.toString());
      expect(result.status).toBe(newStatus);
    });
  });
});