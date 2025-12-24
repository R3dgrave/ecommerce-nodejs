const sendResponse = require('../../utils/response.handler');
const { NotFoundError } = require('../../utils/errors');

const CustomerController = (customerService) => {
  const getProfile = async (req, res, next) => {
    try {
      const profile = await customerService.getProfile(req.user.id);
      if (!profile) {
        throw new NotFoundError("Perfil no encontrado.");
      }
      return sendResponse(res, 200, profile);
    } catch (error) {
      next(error);
    }
  };

  const updateProfile = async (req, res, next) => {
    try {
      const updatedProfile = await customerService.updateProfile(req.user.id, req.body);
      return sendResponse(res, 200, updatedProfile, "Perfil actualizado exitosamente.");
    } catch (error) {
      next(error);
    }
  };

  return {
    getProfile,
    updateProfile
  };
};

module.exports = CustomerController;