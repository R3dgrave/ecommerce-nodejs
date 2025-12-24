const { body } = require("express-validator");
const {
  handleValidationErrors,
  validateId,
  requireNonEmptyBody,
} = require("../../middlewares/validation-utils");

const validateRegister = [
  body("name")
    .exists().withMessage("El nombre es requerido.")
    .isString().withMessage("El nombre debe ser texto.")
    .trim()
    .isLength({ min: 2 }).withMessage("El nombre debe tener al menos 2 caracteres."),

  body("email")
    .exists().withMessage("El correo electrónico es requerido.")
    .isEmail().withMessage("Formato de correo electrónico inválido.")
    .normalizeEmail(),

  body("password")
    .exists().withMessage("La contraseña es requerida.")
    .isString().withMessage("La contraseña debe ser texto.")
    .isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres."),

  body("phone")
    .optional()
    .isString().withMessage("El teléfono debe ser texto.")
    .trim()
    .matches(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/)
    .withMessage("Formato de teléfono inválido."),

  handleValidationErrors,
];

const validateLogin = [
  body("email")
    .exists().withMessage("El correo electrónico es requerido.")
    .isEmail().withMessage("Formato de correo electrónico inválido.")
    .normalizeEmail(),

  body("password")
    .exists().withMessage("La contraseña es requerida.")
    .isString().withMessage("La contraseña debe ser texto."),

  handleValidationErrors,
];

const validateUpdateUser = [
  validateId,
  requireNonEmptyBody,

  body("name")
    .optional()
    .isString().trim()
    .isLength({ min: 2 }).withMessage("El nombre debe tener al menos 2 caracteres."),

  body("email")
    .optional()
    .isEmail().withMessage("Formato de correo electrónico inválido.")
    .normalizeEmail(),

  body("password")
    .optional()
    .isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres."),

  body("phone")
    .optional()
    .trim()
    .matches(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/)
    .withMessage("Formato de teléfono inválido."),

  body("shippingAddresses")
    .optional()
    .isArray().withMessage("shippingAddresses debe ser un arreglo."),

  body("shippingAddresses.*.street")
    .if(body("shippingAddresses").exists())
    .notEmpty().withMessage("La calle es requerida en la dirección."),

  body("shippingAddresses.*.city")
    .if(body("shippingAddresses").exists())
    .notEmpty().withMessage("La ciudad es requerida."),

  body("shippingAddresses.*.zipCode")
    .if(body("shippingAddresses").exists())
    .notEmpty().withMessage("El código postal es requerido."),

  body("shippingAddresses.*.isDefault")
    .optional()
    .isBoolean().withMessage("isDefault debe ser un valor booleano."),

  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateUser,
  validateUserId: validateId,
};