/**
 * Factory function para crear el CategoryController.
 * @param {CategoryService} categoryService - Instancia del servicio de categorías.
 * @returns {object} Un objeto con las funciones del controlador.
 */
const CategoryController = (categoryService) => {
  /**
   * @route POST /category
   * Crea una nueva categoría.
   */
  const createCategory = async (req, res, next) => {
    try {
      const { name } = req.body;
      const result = await categoryService.createCategory({ name });
      res.status(201).json({ success: true, result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route GET /category
   * Obtiene una lista paginada de categorías.
   */
  const getAllCategories = async (req, res, next) => {
    try {
      const result = await categoryService.getAllCategories(req.query);
      res.status(200).json({ success: true, result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route GET /category/:id
   * Obtiene una categoría por ID.
   */
  const getCategoryById = async (req, res, next) => {
    try {
      const id = req.params.id;
      const result = await categoryService.getCategoryById(id);

      if (!result) {
        return res
          .status(404)
          .json({ success: false, error: "Categoría no encontrada." });
      }
      res.status(200).json({ success: true, result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route PUT /category/:id
   * Actualiza una categoría.
   */
  const updateCategory = async (req, res, next) => {
    try {
      const model = req.body;
      const id = req.params.id;

      await categoryService.updateCategory(id, model);
      res.status(200).json({
        success: true,
        message: "Categoría actualizada exitosamente",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route DELETE /category/:id
   * Elimina una categoría.
   */
  const deleteCategory = async (req, res, next) => {
    try {
      const id = req.params.id;
      await categoryService.deleteCategory(id);
      res
        .status(200)
        .json({ success: true, message: "Categoría eliminada correctamente" });
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
