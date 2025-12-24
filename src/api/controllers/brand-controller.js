const sendResponse = require('../../utils/response.handler');
const { NotFoundError } = require('../../utils/errors');

const BrandController = (brandService) => {

  const createBrand = async (req, res, next) => {
    try {
      const result = await brandService.createBrand(req.body);
      return sendResponse(res, 201, result, "Marca creada exitosamente");
    } catch (error) {
      next(error);
    }
  };

  const getBrandsByCategory = async (req, res, next) => {
    try {
      const { categoryId } = req.params;
      const brands = await brandService.getBrandsByCategory(categoryId);
      return sendResponse(res, 200, brands);
    } catch (error) {
      next(error);
    }
  };

  const getBrandById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const brand = await brandService.getBrandById(id);

      if (!brand) {
        throw new NotFoundError("Marca no encontrada.");
      }

      return sendResponse(res, 200, brand);
    } catch (error) {
      next(error);
    }
  };

  const getAllBrands = async (req, res, next) => {
    try {
      const brands = await brandService.getAllBrands(req.query);
      return sendResponse(res, 200, brands);
    } catch (error) {
      next(error);
    }
  };

  const updateBrand = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = await brandService.updateBrand(id, req.body);

      return sendResponse(res, 200, updated, "Marca actualizada exitosamente.");
    } catch (error) {
      next(error);
    }
  };

  const deleteBrand = async (req, res, next) => {
    try {
      const { id } = req.params;
      await brandService.deleteBrand(id);
      return sendResponse(res, 200, null, "Marca eliminada correctamente");
    } catch (error) {
      next(error);
    }
  };

  return {
    createBrand,
    getBrandsByCategory,
    getBrandById,
    getAllBrands,
    updateBrand,
    deleteBrand,
  };
};

module.exports = BrandController;