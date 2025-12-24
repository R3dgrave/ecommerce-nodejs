const sinon = require("sinon");
const PaymentService = require("../../../src/services/payment-service");
const { NotFoundError, BusinessLogicError } = require("../../../src/utils/errors");

describe("PaymentService", () => {
  let paymentService;
  let paymentRepoMock, orderRepoMock, productRepoMock, stripeMock;

  beforeEach(() => {
    sinon.restore();

    paymentRepoMock = {
      save: sinon.stub(),
      findBy: sinon.stub(),
      updateStatusByIntentId: sinon.stub(),
    };
    orderRepoMock = {
      findById: sinon.stub(),
      update: sinon.stub(),
    };
    productRepoMock = {
      updateStock: sinon.stub(),
    };

    stripeMock = {
      paymentIntents: { create: sinon.stub() },
      webhooks: { constructEvent: sinon.stub() },
      refunds: { create: sinon.stub() },
    };

    paymentService = new PaymentService(
      paymentRepoMock,
      orderRepoMock,
      productRepoMock,
      stripeMock
    );
  });

  describe("createIntent", () => {
    it("debería crear un PaymentIntent en Stripe y guardarlo localmente", async () => {
      const mockOrder = { id: "order123", totalAmount: 100 };
      const mockStripeIntent = { id: "pi_123", client_secret: "secret_123" };

      orderRepoMock.findById.resolves(mockOrder);
      stripeMock.paymentIntents.create.resolves(mockStripeIntent);
      paymentRepoMock.save.resolves(true);

      const result = await paymentService.createIntent("order123", "user123");

      expect(result.clientSecret).toBe("secret_123");
      expect(stripeMock.paymentIntents.create.calledOnce).toBe(true);
      expect(stripeMock.paymentIntents.create.firstCall.args[0].amount).toBe(10000);
    });

    it("debería lanzar NotFoundError si la orden no existe", async () => {
      orderRepoMock.findById.resolves(null);
      await expect(paymentService.createIntent("invalid", "user123"))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe("handleWebhook", () => {
    it("debería procesar payment_intent.succeeded actualizando orden y pago", async () => {
      const mockEvent = {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_123",
            metadata: { orderId: "order123" },
          },
        },
      };

      const mockOrder = { id: "order123", items: [] };

      stripeMock.webhooks.constructEvent.returns(mockEvent);
      orderRepoMock.findById.resolves(mockOrder);
      paymentRepoMock.updateStatusByIntentId.resolves(true);
      orderRepoMock.update.resolves(true);

      const result = await paymentService.handleWebhook("sig", "body");

      expect(result.received).toBe(true);
      expect(paymentRepoMock.updateStatusByIntentId.calledWith("pi_123", "succeeded")).toBe(true);
      expect(orderRepoMock.update.calledWith("order123", sinon.match.has("status", "paid"))).toBe(true);
    });
  });

  describe("processRefund", () => {
    it("debería ejecutar reembolso en Stripe y devolver stock al inventario", async () => {
      const mockPayment = { stripePaymentIntentId: "pi_123", orderId: "order123" };
      const mockOrder = {
        id: "order123",
        items: [{ productId: "prod1", quantity: 2 }]
      };

      paymentRepoMock.findBy.resolves([mockPayment]);
      orderRepoMock.findById.resolves(mockOrder);
      stripeMock.refunds.create.resolves({ id: "re_123" });
      productRepoMock.updateStock.resolves(true);
      paymentRepoMock.updateStatusByIntentId.resolves(true);
      orderRepoMock.update.resolves(true);

      const result = await paymentService.processRefund("order123", "requested_by_customer");

      expect(result.id).toBe("re_123");
      expect(productRepoMock.updateStock.calledWith("prod1", 2)).toBe(true);
      expect(orderRepoMock.update.calledWith("order123", { status: "cancelled" })).toBe(true);
    });

    it("debería lanzar BusinessLogicError si Stripe falla", async () => {
      paymentRepoMock.findBy.resolves([{ stripePaymentIntentId: "pi_fail" }]);
      orderRepoMock.findById.resolves({ items: [] });
      stripeMock.refunds.create.rejects(new Error("Stripe Error"));

      await expect(paymentService.processRefund("order123"))
        .rejects.toThrow(BusinessLogicError);
    });
  });
});