/**
 * Factory function para crear el AuthController.
 * @param {AuthService} authService - Instancia del servicio de autenticación.
 * @returns {object} Un objeto con las funciones del controlador.
 */
const AuthController = (authService) => {
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
          .json({ success: false, error: "Email o contraseña incorrectos" });
      }
    } catch (error) {
      next(error);
    }
  };

  const getUserById = async (req, res, next) => {
    try {
      const user = await authService.getUserById(req.params.id);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  const updateUser = async (req, res, next) => {
    try {
      await authService.updateUser(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: "Usuario actualizado correctamente.",
      });
    } catch (error) {
      next(error);
    }
  };

  const deleteUser = async (req, res, next) => {
    try {
      await authService.deleteUser(req.params.id);
      res.status(200).json({
        success: true,
        message: "Usuario eliminado exitosamente.",
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    register,
    login,
    getUserById,
    updateUser,
    deleteUser,
  };
};

module.exports = AuthController;
