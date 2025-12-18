const express = require("express");
const CategoryControllerFactory = require("../controllers/category-controller");
const {
  validateCreateCategory,
  validateUpdateCategory,
  validateId,
  validatePagination
} = require("../validators/category-validator");

/**
 * Función factory para crear el router de Categorías.
 * @param {CategoryService} categoryService - Instancia del servicio de Categorías.
 * @param {Function} verifyToken - Middleware de autenticación.
 * @param {Function} isAdmin - Middleware de autorización.
 * @returns {express.Router} El router configurado.
 */
module.exports = function (categoryService, verifyToken, isAdmin) {
  const router = express.Router();
  const categoryController = CategoryControllerFactory(categoryService);

  // POST /category
  router.post(
    "/",
    validateCreateCategory,
    verifyToken,
    isAdmin,
    categoryController.createCategory
  );

  // GET /category
  router.get(
    "/",
    validatePagination,
    verifyToken,
    isAdmin,
    categoryController.getAllCategories
  );

  // GET /category/:id
  router.get(
    "/:id",
    validateId,
    verifyToken,
    isAdmin,
    categoryController.getCategoryById
  );

  // PUT /category/:id
  router.put(
    "/:id",
    validateUpdateCategory,
    verifyToken,
    isAdmin,
    categoryController.updateCategory
  );

  // DELETE /category/:id
  router.delete(
    "/:id",
    validateId,
    verifyToken,
    isAdmin,
    categoryController.deleteCategory
  );

  return router;
};