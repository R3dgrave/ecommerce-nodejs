const { body, param, validationResult } = require("express-validator");

/**
 * Middleware para manejar y responder con errores de validación de Express-Validator.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * Función que crea una regla de validación común para IDs en los parámetros de la URL.
 * @param {string} paramName - El nombre del parámetro en la URL (ej. 'id', 'categoryId').
 */
const createIdValidationRule = (paramName) => {
  return [
    param(paramName)
      .exists()
      .withMessage("El ID es requerido en la URL.")
      .isMongoId()
      .withMessage("El ID proporcionado no tiene un formato válido."),
  ];
};

const validateId = createIdValidationRule("id");

/**
 * Función que crea una regla de validación común para el campo 'name'.
 * @param {string} fieldName - El nombre del campo (ej. 'marca', 'categoría').
 */
const createNameValidationRule = (fieldName) => {
  return body("name")
    .exists()
    .withMessage(`El nombre de la ${fieldName} es requerido.`)
    .isString()
    .withMessage("El nombre debe ser texto.")
    .trim()
    .notEmpty()
    .withMessage(`El nombre de la ${fieldName} es requerido.`);
};

/**
 * Función que crea una regla de validación común para campos de nombre opcionales (actualización).
 * @param {string} fieldName - El nombre del campo (ej. 'marca', 'categoría').
 */
const createOptionalNameValidationRule = (fieldName) => {
  return body("name")
    .optional()
    .isString()
    .withMessage("El nombre debe ser texto.")
    .trim()
    .notEmpty()
    .withMessage(`El nombre de la ${fieldName} es requerido.`);
};

/**
 * Middleware para asegurar que el cuerpo de una solicitud PUT/PATCH no esté vacío.
 */
const requireNonEmptyBody = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      error: "El cuerpo de la solicitud no puede estar vacío para actualizar.",
    });
  }
  next();
};

module.exports = {
  handleValidationErrors,
  validateId,
  createIdValidationRule,
  createNameValidationRule,
  createOptionalNameValidationRule,
  requireNonEmptyBody
};