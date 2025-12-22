const ProductController = (productService) => {
  /**
   * @route POST /product
   * Crea un nuevo producto (Admin only).
   */
  const createProduct = async (req, res, next) => {
    try {
      const productData = req.body;
      const newProduct = await productService.createProduct(productData);

      res.status(201).json({
        success: true,
        message: "Producto creado exitosamente.",
        result: newProduct,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route GET /product
   * Obtiene una lista paginada de productos con filtros y población.
   */
  const getAllProducts = async (req, res, next) => {
    try {
      const queryParams = req.query;

      const populateOptions = { populateBrand: true, populateCategory: true };

      const result = await productService.getAllProducts(
        queryParams,
        populateOptions
      );

      res.status(200).json({
        success: true,
        message: "Productos obtenidos exitosamente.",
        result: result, // Contiene data, totalCount, totalPages, etc.
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route GET /product/:id
   * Obtiene un producto por ID con población completa.
   */
  const getProductById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const populateOptions = { populateBrand: true, populateCategory: true };

      const product = await productService.getProductById(id, populateOptions);

      if (!product) {
        return res
          .status(404)
          .json({ success: false, error: "Producto no encontrado." });
      }

      res.status(200).json({
        success: true,
        message: "Producto obtenido exitosamente.",
        result: product,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route PUT /product/:id
   * Actualiza un producto existente (Admin only).
   */
  const updateProduct = async (req, res, next) => {
    try {
      const { id } = req.params;
      const productData = req.body;

      await productService.updateProduct(id, productData);

      res.status(200).json({
        success: true,
        message: `Producto con ID ${id} actualizado.`,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route DELETE /product/:id
   * Elimina un producto (Admin only).
   */
  const deleteProduct = async (req, res, next) => {
    try {
      const { id } = req.params;

      await productService.deleteProduct(id);

      res.status(200).json({
        success: true,
        message: "Producto eliminado exitosamente.",
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
  };
};

module.exports = ProductController;
