const express = require("express");
const {
  validateRegister,
  validateLogin,
} = require("../validators/auth-validator");

module.exports = function (authService) {
  const router = express.Router();

  router.post("/register", validateRegister, async (req, res, next) => {
    const { name, email, password } = req.body;

    try {
      const user = await authService.registerUser({ name, email, password });
      res.status(201).json({
        success: true,
        data: user,
        message: "Usuario registrado exitosamente.",
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/login", validateLogin, async (req, res, next) => {
    const { email, password } = req.body;

    try {
      const result = await authService.loginUser({ email, password });

      if (result) {
        res.status(200).json({
          success: true,
          data: {
            token: result.token,
            user: result.user,
          },
        });
      } else {
        res
          .status(401)
          .json({ success: false, error: "Correo o contraseña incorrectos." });
      }
    } catch (error) {
      next(error);
    }
  });

  return router;
};
