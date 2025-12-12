const { body, param, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const validateId = [
  param("id")
    .exists()
    .withMessage("El ID es requerido en la URL.")
    .isMongoId()
    .withMessage("El ID proporcionado no tiene un formato válido."),

  handleValidationErrors,
];

const validateCreateCategory = [
  body("name")
    .exists()
    .withMessage("El nombre de la categoría es requerido.")
    .isString()
    .withMessage("El nombre debe ser texto.")
    .trim()
    .notEmpty()
    .withMessage("El nombre no puede estar vacío."),

  handleValidationErrors,
];

const validateUpdateCategory = [
  body("name")
    .optional()
    .isString()
    .withMessage("El nombre debe ser texto.")
    .trim()
    .notEmpty()
    .withMessage("El nombre no puede estar vacío."),
  (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: "El cuerpo de la solicitud no puede estar vacío.",
      });
    }
    next();
  },

  handleValidationErrors,
];

module.exports = {
  validateCreateCategory,
  validateUpdateCategory,
  validateId,
};
