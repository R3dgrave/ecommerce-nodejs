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

const validateCreateBrand = [
  body("name")
    .exists()
    .withMessage("El nombre de la marca es requerido.")
    .isString()
    .withMessage("El nombre debe ser texto.")
    .trim()
    .notEmpty()
    .withMessage("El nombre no puede estar vacío."),

  body("categoryId")
    .exists()
    .withMessage("El ID de la categoría es requerido.")
    .isMongoId()
    .withMessage("El ID de la categoría no tiene un formato válido."),

  handleValidationErrors,
];

const validateUpdateBrand = [
  ...validateId.slice(0, -1),

  body("name")
    .optional()
    .isString()
    .withMessage("El nombre debe ser texto.")
    .trim()
    .notEmpty()
    .withMessage("El nombre no puede estar vacío."),

  body("categoryId")
    .optional()
    .isMongoId()
    .withMessage("El ID de la categoría no tiene un formato válido."),

  (req, res, next) => {
    const bodyKeys = Object.keys(req.body);
    if (bodyKeys.length === 0) {
      return res.status(400).json({
        success: false,
        error:
          "El cuerpo de la solicitud no puede estar vacío para actualizar.",
      });
    }
    next();
  },

  handleValidationErrors,
];

module.exports = {
  validateId,
  validateCreateBrand,
  validateUpdateBrand,
};
