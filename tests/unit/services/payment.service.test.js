const PaymentService = require("../../../src/services/payment-service");
const sinon = require("sinon");

describe("PaymentService", () => {
  let paymentService;
  let paymentRepoMock;
  let orderRepoMock;
  let productRepoMock;
  let stripeMock;

  beforeEach(() => {
    paymentRepoMock = {
      save: sinon.stub(),
      findByIntentId: sinon.stub(),
      updateStatusByIntentId: sinon.stub(),
      findBy: sinon.stub(),
    };
    orderRepoMock = {
      findById: sinon.stub(),
      update: sinon.stub(),
    };
    productRepoMock = {
      findById: sinon.stub(),
      update: sinon.stub(),
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

  afterEach(() => {
    sinon.restore();
  });

  describe("createIntent", () => {
    it("debería crear un PaymentIntent y guardar el registro localmente", async () => {
      const mockOrder = {
        _id: "order123",
        totalAmount: 100,
        status: "pending",
      };
      const mockStripeIntent = {
        id: "pi_123",
        client_secret: "secret_123",
      };

      orderRepoMock.findById.resolves(mockOrder);
      stripeMock.paymentIntents.create.resolves(mockStripeIntent);
      paymentRepoMock.save.resolves(true);

      const result = await paymentService.createIntent("order123", "user123");

      expect(result).toHaveProperty("clientSecret", "secret_123");
      expect(stripeMock.paymentIntents.create.calledOnce).toBe(true);
    });
  });

  describe("handleWebhook", () => {
    it("debería procesar payment_intent.succeeded actualizando orden y stock", async () => {
      const mockEvent = {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_123",
            metadata: { orderId: "order123" },
          },
        },
      };

      const mockOrder = {
        _id: "order123",
        items: [{ productId: "prod1", quantity: 2 }],
      };

      stripeMock.webhooks.constructEvent.returns(mockEvent);
      orderRepoMock.findById.resolves(mockOrder);
      paymentRepoMock.updateStatusByIntentId.resolves(true);
      orderRepoMock.update.resolves(true);
      productRepoMock.updateStock.resolves(true);

      await paymentService.handleWebhook("sig_123", "raw_body_123");

      expect(
        paymentRepoMock.updateStatusByIntentId.calledWith("pi_123", "succeeded")
      ).toBe(true);

      expect(productRepoMock.updateStock.calledWith("prod1", -2)).toBe(true);
    });
  });

  describe("processRefund", () => {
    it("debería ejecutar el reembolso en Stripe y devolver el stock", async () => {
      const mockPayment = {
        stripePaymentIntentId: "pi_123",
        orderId: "order123",
        status: "succeeded",
      };
      const mockOrder = {
        _id: "order123",
        items: [{ productId: "prod1", quantity: 1 }],
      };

      paymentRepoMock.findBy.resolves([mockPayment]);
      orderRepoMock.findById.resolves(mockOrder);
      stripeMock.refunds.create.resolves({ id: "re_123" });
      productRepoMock.updateStock.resolves(true);

      const result = await paymentService.processRefund(
        "order123",
        "requested_by_customer"
      );

      expect(result).toHaveProperty("id", "re_123");
      expect(stripeMock.refunds.create.calledOnce).toBe(true);
      // Verificamos que se devolvió el stock (valor positivo)
      expect(productRepoMock.updateStock.calledWith("prod1", 1)).toBe(true);
    });
  });
});
