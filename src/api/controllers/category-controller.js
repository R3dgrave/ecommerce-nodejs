const sendResponse = require('../../utils/response.handler');
const { NotFoundError } = require('../../utils/errors');

const CategoryController = (categoryService) => {
  const createCategory = async (req, res, next) => {
    try {
      const result = await categoryService.createCategory(req.body);
      return sendResponse(res, 201, result, "Categoría creada exitosamente");
    } catch (error) {
      next(error);
    }
  };

  const getAllCategories = async (req, res, next) => {
    try {
      const result = await categoryService.getAllCategories(req.query);
      return sendResponse(res, 200, result);
    } catch (error) {
      next(error);
    }
  };

  const getCategoryById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await categoryService.getCategoryById(id);

      if (!result) {
        throw new NotFoundError("Categoría no encontrada.");
      }
      return sendResponse(res, 200, result);
    } catch (error) {
      next(error);
    }
  };

  const updateCategory = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updated = await categoryService.updateCategory(id, req.body);
      return sendResponse(res, 200, updated, "Categoría actualizada exitosamente");
    } catch (error) {
      next(error);
    }
  };

  const deleteCategory = async (req, res, next) => {
    try {
      await categoryService.deleteCategory(req.params.id);
      return sendResponse(res, 200, null, "Categoría eliminada correctamente");
    } catch (error) {
      next(error);
    }
  };

  return {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
  };
};

module.exports = CategoryController;