const { UnauthorizedError, ForbiddenError } = require("../utils/errors");

const authMiddlewareFactory = (tokenProvider, userRepository) => {
  
  const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new UnauthorizedError("Token no proporcionado o formato inválido."));
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = tokenProvider.verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      next(new UnauthorizedError("Token inválido o expirado."));
    }
  };

  const isAdmin = async (req, res, next) => {
    try {
      const user = await userRepository.findById(req.user.id);

      if (user && user.isAdmin === true) {
        next();
      } else {
        throw new ForbiddenError("Acceso denegado: Se requieren permisos de administrador.");
      }
    } catch (error) {
      next(error);
    }
  };

  return { verifyToken, isAdmin };
};

module.exports = authMiddlewareFactory;