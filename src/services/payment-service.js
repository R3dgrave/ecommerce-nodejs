const Stripe = require("stripe");
const { NotFoundError, BusinessLogicError } = require("../utils/errors");

class PaymentService {
  constructor(paymentRepository, orderRepository, productRepository, stripeClient = null) {
    this.paymentRepository = paymentRepository;
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
    this.stripe = stripeClient || new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  async createIntent(orderId, userId) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundError(`La orden con ID ${orderId} no existe.`);

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(order.totalAmount * 100),
        currency: "usd",
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
        metadata: { orderId: orderId.toString(), userId: userId.toString() },
      });

      await this.paymentRepository.save({
        orderId,
        userId,
        stripePaymentIntentId: paymentIntent.id,
        amount: order.totalAmount,
      });

      return {
        clientSecret: paymentIntent.client_secret,
        amount: order.totalAmount,
        currency: "usd",
      };
    } catch (error) {
      throw new BusinessLogicError(`Error con Stripe: ${error.message}`);
    }
  }

  async handleWebhook(signature, rawBody) {
    let event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      throw new BusinessLogicError(`Firma de Webhook inválida`, 400);
    }

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      const orderId = intent.metadata?.orderId;
      if (!orderId) return { received: true, warning: "Sin metadata" };

      const order = await this.orderRepository.findById(orderId);
      if (!order) throw new NotFoundError("Orden no encontrada durante el webhook.");

      const operations = [
        this.paymentRepository.updateStatusByIntentId(intent.id, "succeeded"),
        this.orderRepository.update(orderId, {
          status: "paid",
          $push: { statusHistory: { status: "paid", comment: "Pago confirmado vía Stripe." } }
        })
      ];

      await Promise.all(operations);
    }
    return { received: true };
  }

  async processRefund(orderId, reason) {
    const [payments, order] = await Promise.all([
      this.paymentRepository.findByIntentId ?
        this.paymentRepository.findBy({ orderId, status: "succeeded" }) : 
        this.paymentRepository.findBy({ orderId, status: "succeeded" }),
      this.orderRepository.findById(orderId),
    ]);

    const payment = payments[0];
    if (!payment) throw new NotFoundError("No se encontró un pago exitoso.");
    if (!order) throw new NotFoundError("Orden no encontrada.");

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        reason: reason || "requested_by_customer",
      });

      await Promise.all([
        this.paymentRepository.updateStatusByIntentId(payment.stripePaymentIntentId, "refunded", { refundId: refund.id }),
        this.orderRepository.update(orderId, { status: "cancelled" }),
        ...order.items.map(item => this.productRepository.updateStock(item.productId, item.quantity))
      ]);

      return refund;
    } catch (error) {
      throw new BusinessLogicError(`Error en reembolso: ${error.message}`);
    }
  }
}

module.exports = PaymentService;