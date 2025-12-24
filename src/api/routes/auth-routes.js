const express = require("express");
const AuthControllerFactory = require("../controllers/auth-controller");
const {
  validateRegister,
  validateLogin,
  validateUpdateUser,
  validateUserId
} = require("../validators/auth-validator");

module.exports = function (authService, verifyToken) {
  const router = express.Router();
  const authController = AuthControllerFactory(authService);

  router.post("/register", validateRegister, authController.register);
  router.post("/login", validateLogin, authController.login);

  router.get("/user/:id", verifyToken, validateUserId, authController.getUserById);
  router.put("/user/:id", verifyToken, validateUpdateUser, authController.updateUser);
  router.delete("/user/:id", verifyToken, validateUserId, authController.deleteUser);

  return router;
};
