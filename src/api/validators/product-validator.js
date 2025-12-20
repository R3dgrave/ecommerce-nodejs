// src/api/validators/product-validator.js

const { body, query } = require("express-validator");
const {
  handleValidationErrors,
  validateId,
  createIdValidationRule,
  requireNonEmptyBody,
  createOptionalNameValidationRule,
} = require("../../middlewares/validation-utils");

// Regla de validación reutilizable para IDs de MongoDB en el body
const validateMongoIdBody = (fieldName, message) =>
  body(fieldName)
    .exists()
    .withMessage(message)
    .isMongoId()
    .withMessage(`${fieldName} debe ser un ID de MongoDB válido.`);

// Regla de validación reutilizable para IDs opcionales en el body (para actualizar)
const validateOptionalMongoIdBody = (fieldName) =>
  body(fieldName)
    .optional()
    .isMongoId()
    .withMessage(`${fieldName} debe ser un ID de MongoDB válido.`);

// --- Validación para Creación de Producto (POST /product) ---
const validateCreateProduct = [
  body("name")
    .exists()
    .withMessage("El nombre del producto es requerido.")
    .isString()
    .withMessage("El nombre debe ser texto.")
    .trim()
    .notEmpty()
    .withMessage("El nombre del producto es requerido."),

  body("shortDescription")
    .trim()
    .notEmpty()
    .withMessage("La descripción corta es requerida.")
    .isLength({ max: 200 })
    .withMessage("La descripción corta no puede exceder los 200 caracteres."),

  body("description")
    .exists()
    .notEmpty()
    .isString()
    .withMessage("La descripción debe ser texto."),

  body("price")
    .exists()
    .withMessage("El precio es requerido.")
    .isFloat({ gt: 0 })
    .withMessage("El precio debe ser un número positivo."),

  validateMongoIdBody("categoryId", "El ID de la categoría es requerido."),
  validateMongoIdBody("brandId", "El ID de la marca es requerido."),

  body("stock")
    .exists()
    .isInt({ min: 0 })
    .withMessage("El stock debe ser un número entero positivo o cero."),

  handleValidationErrors,
];

// --- Validación para Actualización de Producto (PUT /product/:id) ---
const validateUpdateProduct = [
  validateId,
  requireNonEmptyBody,
  createOptionalNameValidationRule("producto"),

  body("shortDescription")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("La descripción corta no puede exceder los 200 caracteres."),

  body("description")
    .optional()
    .isString()
    .withMessage("La descripción debe ser texto."),

  body("price")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("El precio debe ser un número positivo."),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("El stock debe ser un número entero positivo o cero."),

  validateOptionalMongoIdBody("categoryId"),
  validateOptionalMongoIdBody("brandId"),

  handleValidationErrors,
];

// --- Validación para Paginación de Productos (GET /product) ---
const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número entero mayor o igual a 1."),

  query("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El límite debe ser un número entero mayor o igual a 1."),

  query("name")
    .optional()
    .isString()
    .withMessage("El nombre de búsqueda debe ser texto."),

  query("categoryId")
    .optional()
    .isMongoId()
    .withMessage("El filtro categoryId debe ser un ID de MongoDB válido."),

  query("brandId")
    .optional()
    .isMongoId()
    .withMessage("El filtro brandId debe ser un ID de MongoDB válido."),

  handleValidationErrors,
];

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateGetProductById: validateId,
  validateDeleteProduct: validateId,
  validatePagination,
};
