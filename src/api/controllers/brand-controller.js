/**
 * Factory function para crear el BrandController.
 * @param {BrandService} brandService - Instancia del servicio de marcas.
 * @returns {object} Un objeto con las funciones del controlador.
 */
const BrandController = (brandService) => {

  /**
   * @route POST /brand
   * Crea una nueva marca.
   */
  const createBrand = async (req, res, next) => {
    try {
      const { name, categoryId } = req.body;
      const result = await brandService.createBrand({ name, categoryId });
      res.status(201).json({ success: true, result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route GET /brand/categories/:categoryId
   * Obtiene marcas por categoría.
   */
  const getBrandsByCategory = async (req, res, next) => {
    try {
      const categoryId = req.params.categoryId;
      const brands = await brandService.getBrandsByCategory(categoryId);
      res.status(200).json({ success: true, brands });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route GET /brand/:id
   * Obtiene una marca por ID.
   */
  const getBrandById = async (req, res, next) => {
    try {
      const id = req.params.id;
      const brand = await brandService.getBrandById(id);

      if (!brand) {
        return res
          .status(404)
          .json({ success: false, error: "Marca no encontrada." });
      }
      res.status(200).json({ success: true, brand });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route GET /brand
   * Obtiene todas las marcas.
   */
  const getAllBrands = async (req, res, next) => {
    try {
      const brands = await brandService.getAllBrands(req.query);
      res.status(200).json({ success: true, brands });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route PUT /brand/:id
   * Actualiza una marca.
   */
  const updateBrand = async (req, res, next) => {
    try {
      const id = req.params.id;
      const model = req.body;
      await brandService.updateBrand(id, model);
      res.status(200).json({ success: true, message: "Marca actualizada" });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route DELETE /brand/:id
   * Elimina una marca.
   */
  const deleteBrand = async (req, res, next) => {
    try {
      const id = req.params.id;
      await brandService.deleteBrand(id);
      res.status(200).json({ success: true, message: "eliminado" });
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