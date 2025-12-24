const sendResponse = require('../../utils/response.handler');

const PaymentController = (paymentService) => {
  const createIntent = async (req, res, next) => {
    try {
      const result = await paymentService.createIntent(
        req.body.orderId,
        req.user.id
      );
      return sendResponse(res, 200, result);
    } catch (error) {
      next(error);
    }
  };

  const webhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    try {
      await paymentService.handleWebhook(sig, req.rawBody);
      return sendResponse(res, 200, null, "Webhook recibido");
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).send(`Webhook Error: ${error.message}`);
    }
  };

  const refund = async (req, res, next) => {
    try {
      const result = await paymentService.processRefund(
        req.body.orderId,
        req.body.reason
      );
      return sendResponse(res, 200, result, "Reembolso procesado");
    } catch (error) {
      next(error);
    }
  };

  const getConfig = async (req, res) => {
    return sendResponse(res, 200, {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  };

  return { createIntent, getConfig, webhook, refund };
};

module.exports = PaymentController;