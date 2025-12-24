const { CustomError } = require("../utils/errors");

/**
 * Middleware global para el manejo de errores.
 * Centraliza todas las respuestas fallidas de la API.
 */
function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let message = "Ocurrió un error inesperado en el servidor.";
  let details = undefined;

  // Errores personalizados (NotFoundError, UnauthorizedError, etc.)
  if (err instanceof CustomError) {
    statusCode = err.statusCode;
    message = err.message;
  } 
  
  // Errores de validación de Mongoose
  else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Error de validación de datos.";
    details = err.message;
  } 
  
  // Error de clave duplicada en MongoDB (Unique Index)
  else if (err.code === 11000) {
    statusCode = 409;
    message = "El recurso ya existe en nuestra base de datos.";
  } 
  
  // Otros errores con status (como librerías externas o JWT)
  else if (err.status && err.status >= 400 && err.status < 600) {
    statusCode = err.status;
    message = err.message;
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error ${statusCode}]: ${err.stack || err.message}`);
  }

  return res.status(statusCode).json({
    success: false,
    message: message,
    code: statusCode,
    data: null,
    ...(details && { details })
  });
}

module.exports = errorHandler;