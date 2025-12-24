const { body } = require("express-validator");
const {
  handleValidationErrors,
  createIdValidationRule,
} = require("../../middlewares/validation-utils");

const validateAddItem = [
  body("productId")
    .exists().withMessage("El ID del producto es requerido.")
    .isMongoId().withMessage("ID de producto no válido."),

  body("quantity")
    .optional()
    .isInt({ min: 1 }).withMessage("La cantidad debe ser un número entero mayor a 0."),

  handleValidationErrors,
];

const validateRemoveItem = [
  ...createIdValidationRule("productId"),
  handleValidationErrors,
];

module.exports = {
  validateAddItem,
  validateRemoveItem,
};