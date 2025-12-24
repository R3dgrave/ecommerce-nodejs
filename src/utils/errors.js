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

class ConflictError extends CustomError {
  constructor(message = "El recurso ya existe.") {
    super(message, 409);
  }
}

class BusinessLogicError extends CustomError {
  constructor(message = "Error en la lógica de negocio.") {
    super(message, 400);
  }
}

class ForbiddenError extends CustomError {
  constructor(message = "No tienes permisos para realizar esta acción.") {
    super(message, 403);
  }
}

module.exports = {
  CustomError,
  NotFoundError,
  UnauthorizedError,
  BusinessLogicError,
  ConflictError,
  ForbiddenError,
};
