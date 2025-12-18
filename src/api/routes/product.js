const express = require('express');
const productControllerFactory = require('../controllers/product-controller');
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateGetProductById,
  validateDeleteProduct,
  validatePagination,
} = require('../validators/product-validator');

/**
 * Función factory para crear el router de Productos
 * @param {ProductService} productService - Instancia del servicio de Productos
 * @param {Function} verifyToken - Middleware para verificar el token de autenticación
 * @param {Function} isAdmin - Middleware para verificar si el usuario es administrador
 * @returns {express.Router} El router configurado.
 */
function productRoutesFactory(productService, verifyToken, isAdmin) {
  const router = express.Router();
  const productController = productControllerFactory(productService);

  // Rutas de Acceso Público

  // GET /product (Listado/Búsqueda - Cualquiera puede ver)
  router.get('/', validatePagination, productController.getAllProducts);

  // GET /product/:id (Detalle - Cualquiera puede ver)
  router.get('/:id', validateGetProductById, productController.getProductById);

  // Rutas de Administración (Requieren Autenticación y Rol de Admin)

  // POST /product
  router.post('/', verifyToken, isAdmin, validateCreateProduct, productController.createProduct);

  // PUT /product/:id
  router.put('/:id', verifyToken, isAdmin, validateUpdateProduct, productController.updateProduct);

  // DELETE /product/:id
  router.delete('/:id', verifyToken, isAdmin, validateDeleteProduct, productController.deleteProduct);

  return router;
}

module.exports = productRoutesFactory;