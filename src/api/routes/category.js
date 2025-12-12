const express = require("express");
const {
  validateCreateCategory,
  validateUpdateCategory,
  validateId,
} = require("../validators/category-validator");

module.exports = function (categoryService, verifyToken, isAdmin) {
  const router = express.Router();

  router.post(
    "/",
    validateCreateCategory,
    verifyToken,
    isAdmin,
    async (req, res, next) => {
      try {
        const { name } = req.body;
        const result = await categoryService.createCategory({ name });
        res.status(201).json({ success: true, result });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get("/", verifyToken, isAdmin, async (req, res, next) => {
    try {
      const result = await categoryService.getAllCategories();
      res.status(200).json({ success: true, result });
    } catch (error) {
      next(error);
    }
  });

  router.get(
    "/:id",
    validateId,
    verifyToken,
    isAdmin,
    async (req, res, next) => {
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
    }
  );

  router.put(
    "/:id",
    validateUpdateCategory,
    verifyToken,
    isAdmin,
    async (req, res, next) => {
      try {
        const model = req.body;
        const id = req.params.id;

        await categoryService.updateCategory(id, model);
        res.status(200).json({
          success: true,
          message: "Actualización de categoría exitosa",
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    "/:id",
    validateId,
    verifyToken,
    isAdmin,
    async (req, res, next) => {
      try {
        const id = req.params.id;
        await categoryService.deleteCategory(id);
        res.status(200).json({ success: true, message: "Eliminado" });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
};
