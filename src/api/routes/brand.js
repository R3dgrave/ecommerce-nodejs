const express = require("express");
const {
  validateCreateBrand,
  validateId,
  validateUpdateBrand,
  validateCategoryIdParam
} = require("../validators/brand-validator");

module.exports = function (brandService, verifyToken, isAdmin) {
  const router = express.Router();

  router.post(
    "/",
    validateCreateBrand,
    verifyToken,
    isAdmin,

    async (req, res, next) => {
      try {
        const { name, categoryId } = req.body;
        const result = await brandService.createBrand({ name, categoryId });
        res.status(201).json({ success: true, result });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    "/categories/:categoryId",
    validateCategoryIdParam,
    verifyToken,
    isAdmin,

    async (req, res, next) => {
      try {
        const categoryId = req.params.categoryId;
        const brands = await brandService.getBrandsByCategory(categoryId);
        res.status(200).json({ success: true, brands });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    "/:id",
    validateId,
    verifyToken,
    isAdmin,
    async (req, res, next) => {
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
    }
  );

  router.get("/", verifyToken, isAdmin, async (req, res, next) => {
    try {
      const brands = await brandService.getAllBrands();
      res.status(200).json({ success: true, brands });
    } catch (error) {
      next(error);
    }
  });


  router.put(
    "/:id",
    validateUpdateBrand,
    verifyToken,
    isAdmin,
    async (req, res, next) => {
      try {
        const id = req.params.id;
        const model = req.body;
        await brandService.updateBrand(id, model);
        res.status(200).json({ success: true, message: "Marca actualizada" });
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
        await brandService.deleteBrand(id);
        res.status(200).json({ success: true, message: "eliminado" });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
};