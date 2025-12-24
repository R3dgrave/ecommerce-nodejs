const { body } = require("express-validator");
const {
  handleValidationErrors,
  requireNonEmptyBody,
  createIdValidationRule,
} = require("../../middlewares/validation-utils");

const validateUpdateProfile = [
  requireNonEmptyBody,
  body("name").optional().isString().trim().notEmpty(),
  body("phone").optional().isString().trim(),
  body("email").optional().isEmail().withMessage("Email inválido"),
  handleValidationErrors
];

const validateAddress = [
  body("street").exists().notEmpty(),
  body("city").exists().notEmpty(),
  body("zipCode").exists().notEmpty(),
  handleValidationErrors
];

const validateAddressId = [
  ...createIdValidationRule("addressId"), 
  handleValidationErrors
];

module.exports = {
  validateUpdateProfile,
  validateAddress,
  validateAddressId
};