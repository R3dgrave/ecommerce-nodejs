const { body } = require("express-validator");
const { handleValidationErrors } = require("../../middlewares/validation-utils");

const validateMongoIdBody = (fieldName, message) =>
  body(fieldName)
    .exists()
    .withMessage(message)
    .isMongoId()
    .withMessage(`${fieldName} debe ser un ID de MongoDB válido.`);

const validateCreateIntent = [
  validateMongoIdBody("orderId", "El ID de la orden es requerido para pagar."),
  handleValidationErrors,
];

const validateRefund = [
  validateMongoIdBody("orderId", "El ID de la orden es requerido para el reembolso."),
  body("reason")
    .optional()
    .isIn(['duplicate', 'fraudulent', 'requested_by_customer', 'abandoned'])
    .withMessage("El motivo del reembolso no es válido."),
  handleValidationErrors,
];

module.exports = {
  validateCreateIntent,
  validateRefund,
};