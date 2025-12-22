const { BaseRepository } = require('./base-repository');
const PaymentModel = require('../models/payment');

class PaymentRepository extends BaseRepository {
  constructor(Payment = PaymentModel) {
    super(Payment);
  }

  /**
   * Buscamos por el ID de Stripe específicamente. 
   */
  async findByIntentId(intentId) {
    const results = await this.findBy({ stripePaymentIntentId: intentId });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Actualizar estado por ID de Stripe.
   */
  async updateStatusByIntentId(intentId, status, extraData = {}) {
    const payment = await this.Model.findOne({ stripePaymentIntentId: intentId });
    if (!payment) {
      const error = new Error("Registro de pago no encontrado.");
      error.status = 404;
      throw error;
    }

    return await this.update(payment._id, { status, ...extraData });
  }
}

module.exports = PaymentRepository;