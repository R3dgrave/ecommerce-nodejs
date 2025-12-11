// routes/auth.js
const express = require("express");

module.exports = function (authService) {
  const router = express.Router();

  router.post("/register", async (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Por favor, ingrese todos los datos requeridos",
      });
    }

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

  router.post("/login", async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Por favor, ingrese correo y contraseña.",
      });
    }

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
