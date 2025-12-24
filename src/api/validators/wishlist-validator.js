const { body } = require("express-validator");
const {
  handleValidationErrors,
  createIdValidationRule
} = require("../../middlewares/validation-utils");

const validateAddToWishlist = [
  body("productId")
    .exists()
    .withMessage("El ID del producto es requerido.")
    .isMongoId()
    .withMessage("El ID del producto no tiene un formato válido."),
  handleValidationErrors
];

const validateWishlistProductId = [
  ...createIdValidationRule("productId"),
  handleValidationErrors
];

module.exports = {
  validateAddToWishlist,
  validateWishlistProductId
};