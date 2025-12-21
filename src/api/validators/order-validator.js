// src/validators/order-validator.js
const { body } = require("express-validator");
const { handleValidationErrors, validateId } = require("../../middlewares/validation-utils");

const validateCreateOrder = [
  body("shippingAddress").exists().withMessage("La dirección de envío es requerida."),
  body("shippingAddress.address").notEmpty().withMessage("La calle es requerida."),
  body("shippingAddress.city").notEmpty().withMessage("La ciudad es requerida."),
  body("shippingAddress.country").notEmpty().withMessage("El país es requerido."),
  handleValidationErrors,
];

const validateGetOrderById = [
  ...validateId,
  handleValidationErrors,
];

module.exports = {
  validateCreateOrder,
  validateGetOrderById
};