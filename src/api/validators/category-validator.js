const { query } = require("express-validator");
const {
  handleValidationErrors,
  validateId,
  createNameValidationRule,
  requireNonEmptyBody,
  createOptionalNameValidationRule,
} = require("../../middlewares/validation-utils");

const categoryNameRule = createNameValidationRule("categoría");
const optionalCategoryNameRule = createOptionalNameValidationRule("categoría");


const validateCreateCategory = [
  categoryNameRule,
  handleValidationErrors,
];

const validateUpdateCategory = [
  optionalCategoryNameRule,
  requireNonEmptyBody,
  handleValidationErrors,
];

const validatePagination = [
  query('page').optional().isInt({ gt: 0 }).withMessage('La página debe ser un número entero positivo.'),
  query('limit').optional().isInt({ gt: 0, max: 100 }).withMessage('El límite debe ser un entero positivo y no exceder 100.'),
  query('name').optional().isString().trim().escape().withMessage('El filtro de nombre debe ser una cadena de texto.'),
];

module.exports = {
  validateCreateCategory,
  validateUpdateCategory,
  validateId: [...validateId, handleValidationErrors],
  validatePagination,
};