const { body } = require("express-validator");
const {
  handleValidationErrors,
  validateId: genericValidateId,
  createNameValidationRule,
  createOptionalNameValidationRule,
  requireNonEmptyBody,
  createIdValidationRule
} = require("../../middlewares/validation-utils");

const brandNameRule = createNameValidationRule("marca");
const optionalBrandNameRule = createOptionalNameValidationRule("marca");

const validateCreateBrand = [
  brandNameRule,
  body("categoryId")
    .exists()
    .withMessage("El ID de la categoría es requerido.")
    .isMongoId()
    .withMessage("El ID de la categoría no tiene un formato válido."),
  handleValidationErrors,
];

const validateUpdateBrand = [
  // validateId se agrega en la ruta
  optionalBrandNameRule,

  body("categoryId")
    .optional()
    .isMongoId()
    .withMessage("El ID de la categoría no tiene un formato válido."),

  requireNonEmptyBody,
  handleValidationErrors,
];

const validateCategoryIdParam = [
  ...createIdValidationRule("categoryId"),
  handleValidationErrors,
];

module.exports = {
  validateId: [...genericValidateId, handleValidationErrors],
  validateCategoryIdParam,
  validateCreateBrand,
  validateUpdateBrand,
};