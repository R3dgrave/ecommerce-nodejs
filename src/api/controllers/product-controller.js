const sendResponse = require('../../utils/response.handler');
const { NotFoundError } = require('../../utils/errors');

const ProductController = (productService) => {
  const createProduct = async (req, res, next) => {
    try {
      const newProduct = await productService.createProduct(req.body);
      return sendResponse(res, 201, newProduct, "Producto creado exitosamente.");
    } catch (error) {
      next(error);
    }
  };

  const getAllProducts = async (req, res, next) => {
    try {
      const result = await productService.getAllProducts(req.query, {
        populateBrand: true,
        populateCategory: true
      });
      return sendResponse(res, 200, result, "Productos obtenidos exitosamente.");
    } catch (error) {
      next(error);
    }
  };

  const getProductById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id, {
        populateBrand: true,
        populateCategory: true
      });

      if (!product) throw new NotFoundError("Producto no encontrado.");

      return sendResponse(res, 200, product, "Producto obtenido exitosamente.");
    } catch (error) {
      next(error);
    }
  };

  const updateProduct = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updatedProduct = await productService.updateProduct(id, req.body);
      return sendResponse(res, 200, updatedProduct, `Producto actualizado correctamente.`);
    } catch (error) {
      next(error);
    }
  };

  const deleteProduct = async (req, res, next) => {
    try {
      const { id } = req.params;
      await productService.deleteProduct(id);
      return sendResponse(res, 200, null, "Producto eliminado exitosamente.");
    } catch (error) {
      next(error);
    }
  };

  return { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct };
};

module.exports = ProductController;