const express = require("express");
const CategoryControllerFactory = require("../controllers/category-controller");
const {
  validateCreateCategory,
  validateUpdateCategory,
  validateId,
  validatePagination
} = require("../validators/category-validator");

module.exports = function (categoryService, verifyToken, isAdmin) {
  const router = express.Router();
  const categoryController = CategoryControllerFactory(categoryService);

  router.post(
    "/",
    validateCreateCategory,
    verifyToken,
    isAdmin,
    categoryController.createCategory
  );

  router.get(
    "/",
    validatePagination,
    verifyToken,
    isAdmin,
    categoryController.getAllCategories
  );

  router.get(
    "/:id",
    validateId,
    verifyToken,
    isAdmin,
    categoryController.getCategoryById
  );

  router.put(
    "/:id",
    validateUpdateCategory,
    verifyToken,
    isAdmin,
    categoryController.updateCategory
  );

  router.delete(
    "/:id",
    validateId,
    verifyToken,
    isAdmin,
    categoryController.deleteCategory
  );

  return router;
};