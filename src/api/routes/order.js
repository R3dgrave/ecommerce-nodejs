const express = require("express");
const orderControllerFactory = require("../controllers/order-controller");
const { validateCreateOrder, validateGetOrderById } = require("../../api/validators/order-validator");

/**
 * Factory para el router de Órdenes
 * @param {OrderService} orderService 
 * @param {Function} verifyToken 
 */
module.exports = function (orderService, verifyToken) {
  const router = express.Router();

  const orderController = new orderControllerFactory(orderService);

  router.use(verifyToken);

  router.post("/", validateCreateOrder, orderController.create);
  router.get("/", orderController.getMyOrders);
  router.get("/:id", validateGetOrderById, orderController.getById);

  return router;
};