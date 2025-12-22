const sinon = require("sinon");
const mongoose = require("mongoose");
const PaymentRepository = require("../../../src/repositories/payment-repository");

const MockPaymentModel = {
  findOne: sinon.stub(),
  find: sinon.stub(),
  findByIdAndUpdate: sinon.stub(),
};

const MOCK_PAYMENT_ID = new mongoose.Types.ObjectId().toString();
const MOCK_STRIPE_ID = "pi_test_12345";
const MOCK_PAYMENT_DATA = {
  _id: MOCK_PAYMENT_ID,
  stripePaymentIntentId: MOCK_STRIPE_ID,
  status: "pending",
  amount: 100,
};

describe("PaymentRepository", () => {
  let paymentRepository;

  beforeEach(() => {
    sinon.restore();
    paymentRepository = new PaymentRepository(MockPaymentModel);

    sinon.stub(paymentRepository, "findBy").resolves([MOCK_PAYMENT_DATA]);
    sinon
      .stub(paymentRepository, "update")
      .resolves({ ...MOCK_PAYMENT_DATA, status: "succeeded" });
  });

  describe("findByIntentId", () => {
    it("debería retornar el pago si existe el stripePaymentIntentId", async () => {
      const result = await paymentRepository.findByIntentId(MOCK_STRIPE_ID);

      expect(paymentRepository.findBy.calledOnce).toBe(true);
      expect(
        paymentRepository.findBy.calledWith({
          stripePaymentIntentId: MOCK_STRIPE_ID,
        })
      ).toBe(true);
      expect(result).toEqual(MOCK_PAYMENT_DATA);
    });

    it("debería retornar null si no se encuentra el pago", async () => {
      paymentRepository.findBy.resolves([]);

      const result = await paymentRepository.findByIntentId("id_inexistente");

      expect(result).toBeNull();
    });
  });

  describe("updateStatusByIntentId", () => {
    it("debería actualizar el estado exitosamente si el pago existe", async () => {
      // Mock de findOne para encontrar el documento
      MockPaymentModel.findOne.resolves(MOCK_PAYMENT_DATA);

      const result = await paymentRepository.updateStatusByIntentId(
        MOCK_STRIPE_ID,
        "succeeded"
      );

      expect(
        MockPaymentModel.findOne.calledWith({
          stripePaymentIntentId: MOCK_STRIPE_ID,
        })
      ).toBe(true);
      expect(
        paymentRepository.update.calledWith(MOCK_PAYMENT_ID, {
          status: "succeeded",
        })
      ).toBe(true);
      expect(result.status).toBe("succeeded");
    });

    it("debería lanzar un error 404 si el stripePaymentIntentId no existe", async () => {
      MockPaymentModel.findOne.resolves(null);

      try {
        await paymentRepository.updateStatusByIntentId("pi_falso", "succeeded");
        fail("Debería haber lanzado un error");
      } catch (error) {
        expect(error.message).toBe("Registro de pago no encontrado.");
        expect(error.status).toBe(404);
      }
    });

    it("debería incluir datos extra en la actualización si se proporcionan", async () => {
      MockPaymentModel.findOne.resolves(MOCK_PAYMENT_DATA);
      const extra = { refundId: "re_123" };

      await paymentRepository.updateStatusByIntentId(
        MOCK_STRIPE_ID,
        "refunded",
        extra
      );

      expect(
        paymentRepository.update.calledWith(MOCK_PAYMENT_ID, {
          status: "refunded",
          refundId: "re_123",
        })
      ).toBe(true);
    });
  });
});
