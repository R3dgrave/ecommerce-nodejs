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

  const addAddress = async (req, res, next) => {
    try {
      const updatedProfile = await customerService.addAddress(req.user.id, req.body);
      return sendResponse(res, 201, updatedProfile, "Dirección agregada correctamente.");
    } catch (error) {
      next(error);
    }
  };

  const removeAddress = async (req, res, next) => {
    try {
      const { addressId } = req.params;
      const updatedProfile = await customerService.removeAddress(req.user.id, addressId);
      return sendResponse(res, 200, updatedProfile, "Dirección eliminada correctamente.");
    } catch (error) {
      next(error);
    }
  };

  return {
    getProfile,
    updateProfile,
    addAddress,
    removeAddress
  };
};

module.exports = CustomerController;