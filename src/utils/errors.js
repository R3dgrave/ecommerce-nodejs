class CustomError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends CustomError {
  constructor(message = "Recurso no encontrado.") {
    super(message, 404);
  }
}

class UnauthorizedError extends CustomError {
  constructor(message = "Acceso denegado, credenciales inválidas.") {
    super(message, 401);
  }
}

class BusinessLogicError extends CustomError {}

module.exports = {
  CustomError,
  NotFoundError,
  UnauthorizedError,
  BusinessLogicError,
};
