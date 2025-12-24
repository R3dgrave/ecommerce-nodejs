const express = require('express');
const productControllerFactory = require('../controllers/product-controller');
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateGetProductById,
  validateDeleteProduct,
  validatePagination,
} = require('../validators/product-validator');

function productRoutesFactory(productService, verifyToken, isAdmin) {
  const router = express.Router();
  const productController = productControllerFactory(productService);

  router.get('/', validatePagination, productController.getAllProducts);
  router.get('/:id', validateGetProductById, productController.getProductById);

  router.post('/', verifyToken, isAdmin, validateCreateProduct, productController.createProduct);
  router.put('/:id', verifyToken, isAdmin, validateUpdateProduct, productController.updateProduct);
  router.delete('/:id', verifyToken, isAdmin, validateDeleteProduct, productController.deleteProduct);

  return router;
}

module.exports = productRoutesFactory;