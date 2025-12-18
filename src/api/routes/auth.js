const express = require("express");
const AuthControllerFactory = require("../controllers/auth-controller");
const {
  validateRegister,
  validateLogin,
} = require("../validators/auth-validator");

/**
 * Función factory para crear el router de Autenticación.
 * @param {AuthService} authService - Instancia del servicio de Autenticación.
 * @returns {express.Router} El router configurado.
 */
module.exports = function (authService) {
  const router = express.Router();
  const authController = AuthControllerFactory(authService);

  // POST /auth/register
  router.post(
    "/register",
    validateRegister,
    authController.register
  );

  // POST /auth/login
  router.post(
    "/login",
    validateLogin,
    authController.login
  );

  return router;
};