const PaymentController = (paymentService) => {
  const createIntent = async (req, res) => {
    try {
      const result = await paymentService.createIntent(
        req.body.orderId,
        req.user.id
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).json({ success: false, error: error.message });
    }
  };

  const webhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    try {
      await paymentService.handleWebhook(sig, req.rawBody);
      res.status(200).json({ success: true });
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).send(`Webhook Error: ${error.message}`);
    }
  };

  const refund = async (req, res) => {
    try {
      const result = await paymentService.processRefund(
        req.body.orderId,
        req.body.reason
      );
      res
        .status(200)
        .json({ success: true, message: "Refund processed", data: result });
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).json({ success: false, error: error.message });
    }
  };

  const getConfig = async (req, res) => {
    res.status(200).json({
      success: true,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  };

  return { createIntent, getConfig, webhook, refund };
};

module.exports = PaymentController;
