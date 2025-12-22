const { body } = require("express-validator");
const {
  handleValidationErrors,
  createIdValidationRule,
} = require("../../middlewares/validation-utils");

/**
 * Validación para añadir producto al carrito (POST /cart/add)
 */
const validateAddItem = [
  body("productId")
    .exists().withMessage("El ID del producto es requerido.")
    .isMongoId().withMessage("ID de producto no válido."),
  
  body("quantity")
    .optional()
    .isInt({ min: 1 }).withMessage("La cantidad debe ser un número entero mayor a 0."),
  
  handleValidationErrors,
];

/**
 * Validación para eliminar producto por ID de parámetro (DELETE /cart/remove/:productId)
 */
const validateRemoveItem = [
  ...createIdValidationRule("productId"),
  handleValidationErrors,
];

module.exports = {
  validateAddItem,
  validateRemoveItem,
};