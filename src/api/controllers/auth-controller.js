/**
 * Factory function para crear el AuthController.
 * @param {AuthService} authService - Instancia del servicio de autenticación.
 * @returns {object} Un objeto con las funciones del controlador.
 */
const AuthController = (authService) => {

  /**
   * @route POST /auth/register
   * Registra un nuevo usuario.
   */
  const register = async (req, res, next) => {
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
  };

  /**
   * @route POST /auth/login
   * Autentica a un usuario y devuelve un token.
   */
  const login = async (req, res, next) => {
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
  };

  return {
    register,
    login,
  };
};

module.exports = AuthController;