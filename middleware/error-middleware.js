//middleware/error-middleware.js
const { CustomError } = require("../utils/errors");

function errorHandler(err, req, res, next) {
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.statusCode,
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "Error de validación de datos.",
      details: err.message,
    });
  }

  if (err.code === 11000) {
    return res
      .status(409)
      .json({ success: false, error: "El recurso ya existe" });
  }

  console.error("Error no manejado:", err.stack);
  return res.status(500).json({
    success: false,
    error: "Ocurrió un error inesperado en el servidor.",
  });
}

module.exports = errorHandler;
