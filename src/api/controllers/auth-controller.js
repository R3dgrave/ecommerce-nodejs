const sendResponse = require('../../utils/response.handler');
const { UnauthorizedError, NotFoundError } = require('../../utils/errors');

const AuthController = (authService) => {

  const register = async (req, res, next) => {
    try {
      const user = await authService.registerUser(req.body);
      return sendResponse(res, 201, user, "Usuario registrado exitosamente.");
    } catch (error) {
      next(error);
    }
  };

  const login = async (req, res, next) => {
    try {
      const result = await authService.loginUser(req.body);

      if (!result) {
        throw new UnauthorizedError("Email o contraseña incorrectos");
      }

      return sendResponse(res, 200, {
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  const getUserById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await authService.getUserById(id);

      if (!user) {
        throw new NotFoundError("Usuario no encontrado.");
      }

      return sendResponse(res, 200, user);
    } catch (error) {
      next(error);
    }
  };

  const updateUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updatedUser = await authService.updateUser(id, req.body);

      return sendResponse(res, 200, updatedUser, "Usuario actualizado correctamente.");
    } catch (error) {
      next(error);
    }
  };

  const deleteUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      await authService.deleteUser(id);

      return sendResponse(res, 200, null, "Usuario eliminado exitosamente.");
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