const { body } = require("express-validator");
// Importar handleValidationErrors
const { handleValidationErrors } = require("../../middlewares/validation-utils");


const validateRegister = [
  body("name")
    .exists()
    .withMessage("El nombre es requerido.")
    .isString()
    .withMessage("El nombre debe ser texto.")
    .trim()
    .isLength({ min: 2 })
    .withMessage("El nombre debe tener al menos 2 caracteres."),

  body("email")
    .exists()
    .withMessage("El correo electrónico es requerido.")
    .isEmail()
    .withMessage("Formato de correo electrónico inválido.")
    .normalizeEmail(),

  body("password")
    .exists()
    .withMessage("La contraseña es requerida.")
    .isString()
    .withMessage("La contraseña debe ser texto.")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres."),

  handleValidationErrors,
];

const validateLogin = [
  body("email")
    .exists()
    .withMessage("El correo electrónico es requerido.")
    .isEmail()
    .withMessage("Formato de correo electrónico inválido.")
    .normalizeEmail(),

  body("password")
    .exists()
    .withMessage("La contraseña es requerida.")
    .isString()
    .withMessage("La contraseña debe ser texto."),

  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
};