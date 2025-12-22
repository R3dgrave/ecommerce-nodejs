const Stripe = require("stripe");
const { NotFoundError, BusinessLogicError } = require("../utils/errors");

class PaymentService {
  /**
   * @param {Object} paymentRepository - Repositorio de pagos
   * @param {Object} orderRepository - Repositorio de órdenes
   * @param {Object} productRepository - Repositorio de productos
   * @param {Object} [stripeClient] - Cliente de Stripe opcional (para testing)
   */
  constructor(
    paymentRepository,
    orderRepository,
    productRepository,
    stripeClient = null
  ) {
    this.paymentRepository = paymentRepository;
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;

    this.stripe =
      stripeClient ||
      new Stripe(
        process.env.STRIPE_SECRET_KEY || "sk_test_4eC39HqLyjWDarjtT1zdp7dc"
      );
  }

  async createIntent(orderId, userId) {
    const order = await this.orderRepository.findById(orderId);
    if (!order)
      throw new NotFoundError(`La orden con ID ${orderId} no existe.`);

    try {
      // Usamos this.stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(order.totalAmount * 100),
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
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
      throw new BusinessLogicError(`Error con Stripe: ${error.message}`, 400);
    }
  }

  async handleWebhook(signature, rawBody) {
    let event;
    try {
      // Usamos this.stripe
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Error de firma:", err.message);
      throw new BusinessLogicError(`Firma inválida`, 400);
    }

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;

      if (!intent.metadata || !intent.metadata.orderId) {
        return { received: true, warning: "Sin metadata" };
      }

      try {
        const order = await this.orderRepository.findById(
          intent.metadata.orderId
        );
        if (!order)
          throw new Error(
            "Orden no encontrada en el sistema durante el webhook."
          );

        const operations = [
          this.paymentRepository.updateStatusByIntentId(intent.id, "succeeded"),
          this.orderRepository.update(intent.metadata.orderId, {
            status: "paid",
            $push: {
              statusHistory: {
                status: "paid",
                comment:
                  "Pago confirmado vía Stripe Webhook. Stock actualizado.",
              },
            },
          }),
        ];

        if (order.items && order.items.length > 0) {
          order.items.forEach((item) => {
            operations.push(
              this.productRepository.updateStock(item.productId, -item.quantity)
            );
          });
        }

        await Promise.all(operations);
      } catch (dbError) {
        console.error("Error DB Webhook:", dbError);
        throw new BusinessLogicError(
          "Error al procesar la actualización del pago y stock.",
          400
        );
      }
    }

    return { received: true };
  }

  async processRefund(orderId, reason) {
    const [payments, order] = await Promise.all([
      this.paymentRepository.findBy({ orderId, status: "succeeded" }),
      this.orderRepository.findById(orderId),
    ]);

    const payment = payments[0];
    if (!payment)
      throw new NotFoundError(
        "No se encontró un pago exitoso para esta orden."
      );
    if (!order) throw new NotFoundError("Orden no encontrada.", 404);

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        reason: reason || "requested_by_customer",
      });

      const operations = [
        this.paymentRepository.updateStatusByIntentId(
          payment.stripePaymentIntentId,
          "refunded",
          { refundId: refund.id }
        ),
        this.orderRepository.update(orderId, {
          status: "cancelled",
          $push: {
            statusHistory: {
              status: "cancelled",
              comment: `Reembolso procesado. Razón: ${reason || "Solicitado por cliente"
                }`,
            },
          },
        }),
      ];

      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          operations.push(
            this.productRepository.updateStock(item.productId, item.quantity)
          );
        });
      }

      await Promise.all(operations);
      return refund;
    } catch (error) {
      throw new BusinessLogicError(
        `No se pudo completar la devolución: ${error.message}`,
        400
      );
    }
  }
}

module.exports = PaymentService;
