const sinon = require("sinon");
const mongoose = require("mongoose");
const PaymentRepository = require("../../../src/repositories/payment-repository");

describe("PaymentRepository", () => {
  let paymentRepository;
  let MockPaymentModel;
  const MOCK_ID = new mongoose.Types.ObjectId();
  const MOCK_STRIPE_ID = "pi_test_12345";

  const mockPaymentDoc = {
    _id: MOCK_ID,
    stripePaymentIntentId: MOCK_STRIPE_ID,
    status: "pending",
    toObject: sinon.stub().returns({ _id: MOCK_ID, stripePaymentIntentId: MOCK_STRIPE_ID, status: "pending", __v: 0 })
  };

  beforeEach(() => {
    sinon.restore();
    MockPaymentModel = {
      find: sinon.stub().returns({ exec: sinon.stub().resolves([mockPaymentDoc]) }),
      findOne: sinon.stub(),
      findByIdAndUpdate: sinon.stub(),
    };
    paymentRepository = new PaymentRepository(MockPaymentModel);
  });

  describe("findByIntentId", () => {
    it("debería retornar el pago con 'id' string y sin '_id'", async () => {
      const result = await paymentRepository.findByIntentId(MOCK_STRIPE_ID);

      expect(result.id).toBe(MOCK_ID.toString());
      expect(result).not.toHaveProperty("_id");
      expect(result.stripePaymentIntentId).toBe(MOCK_STRIPE_ID);
    });

    it("debería retornar null si findBy no devuelve resultados", async () => {
      MockPaymentModel.find.returns({ exec: sinon.stub().resolves([]) });
      const result = await paymentRepository.findByIntentId("invalid");
      expect(result).toBeNull();
    });
  });

  describe("updateStatusByIntentId", () => {
    it("debería encontrar por intentId y actualizar usando el id transformado", async () => {
      MockPaymentModel.findOne.resolves(mockPaymentDoc);
      
      const updatedDoc = { 
        ...mockPaymentDoc, 
        status: "succeeded",
        toObject: () => ({ _id: MOCK_ID, status: "succeeded" })
      };
      
      MockPaymentModel.findByIdAndUpdate.returns({ exec: sinon.stub().resolves(updatedDoc) });

      const result = await paymentRepository.updateStatusByIntentId(MOCK_STRIPE_ID, "succeeded");

      expect(MockPaymentModel.findOne.calledWith({ stripePaymentIntentId: MOCK_STRIPE_ID })).toBe(true);
      expect(result.id).toBe(MOCK_ID.toString());
      expect(result.status).toBe("succeeded");
    });

    it("debería lanzar error 404 si el pago no existe", async () => {
      MockPaymentModel.findOne.resolves(null);
      await expect(paymentRepository.updateStatusByIntentId("pi_fail", "succeeded"))
        .rejects.toThrow("Registro de pago no encontrado.");
    });
  });
});