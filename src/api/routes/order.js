const express = require("express");
const orderControllerFactory = require("../controllers/order-controller");
const { validateCreateOrder, validateGetOrderById } = require("../../api/validators/order-validator");

module.exports = function (orderService, verifyToken) {
  const router = express.Router();

  const orderController = new orderControllerFactory(orderService);

  router.use(verifyToken);

  router.post("/", validateCreateOrder, orderController.create);
  router.get("/", orderController.getMyOrders);
  router.get("/:id", validateGetOrderById, orderController.getById);
  router.patch("/:id/cancel", validateGetOrderById, orderController.cancel);

  return router;
};