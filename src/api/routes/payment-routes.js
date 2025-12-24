const express = require("express");
const {
  validateCreateIntent,
  validateRefund
} = require("../validators/payment-validator");

module.exports = function (paymentService, verifyToken, isAdmin) {
  const router = express.Router();

  const paymentControllerFactory = require('../controllers/payment-controller');
  const paymentController = paymentControllerFactory(paymentService);

  router.get('/config', verifyToken, paymentController.getConfig);

  router.post('/create-intent', [
    verifyToken,
    validateCreateIntent
  ], paymentController.createIntent);

  router.post('/refund', [
    verifyToken,
    isAdmin,
    validateRefund
  ], paymentController.refund);

  //IMPORTANTE: No lleva validadores de express ni middlewares de auth ya que stripe necesita enviar el body en crudo (raw) y sin interferencias.
  router.post('/webhook', paymentController.webhook);

  return router;
};