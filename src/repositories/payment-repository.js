const { BaseRepository } = require('./base-repository');
const { NotFoundError } = require("../utils/errors")
const PaymentModel = require('../models/payment-model');

class PaymentRepository extends BaseRepository {
  constructor(Payment = PaymentModel) {
    super(Payment);
  }

  async findByIntentId(intentId) {
    const results = await this.findBy({ stripePaymentIntentId: intentId });
    return results.length > 0 ? results[0] : null;
  }

  async updateStatusByIntentId(intentId, status, extraData = {}) {
    const payment = await this.Model.findOne({ stripePaymentIntentId: intentId });
    if (!payment) throw new NotFoundError("Registro de pago no encontrado.");
    return await this.update(payment._id, { status, ...extraData });
  }
}

module.exports = PaymentRepository;