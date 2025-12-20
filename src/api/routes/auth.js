const express = require("express");
const AuthControllerFactory = require("../controllers/auth-controller");
const {
  validateRegister,
  validateLogin,
} = require("../validators/auth-validator");

module.exports = function (authService) {
  const router = express.Router();
  const authController = AuthControllerFactory(authService);

  router.post("/register", validateRegister, authController.register);
  router.post("/login", validateLogin, authController.login);

  return router;
};
