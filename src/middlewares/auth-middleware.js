module.exports = function (tokenProvider) {
  const verifyToken = function (req, res, next) {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error:
          "Acceso denegado. Formato de token inválido (se espera 'Bearer <token>').",
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decode = tokenProvider.verify(token);
      req.user = decode;
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: "Token inválido o expirado.",
      });
    }
  };

  const isAdmin = function (req, res, next) {
    if (req.user && req.user.isAdmin) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        error: "Acceso prohibido. Requiere privilegios de Administrador.",
      });
    }
  };

  return { verifyToken, isAdmin };
};
