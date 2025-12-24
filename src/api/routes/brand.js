const express = require("express");
const BrandControllerFactory = require("../controllers/brand-controller");
const {
  validateCreateBrand,
  validateId,
  validateUpdateBrand,
  validateCategoryIdParam,
} = require("../validators/brand-validator");

module.exports = function (brandService, verifyToken, isAdmin) {
  const router = express.Router();
  const brandController = BrandControllerFactory(brandService);

  router.post(
    "/",
    validateCreateBrand,
    verifyToken,
    isAdmin,
    brandController.createBrand
  );

  router.get(
    "/categories/:categoryId",
    validateCategoryIdParam,
    verifyToken,
    isAdmin,
    brandController.getBrandsByCategory
  );

  router.get(
    "/:id",
    validateId,
    verifyToken,
    isAdmin,
    brandController.getBrandById
  );

  router.get("/", verifyToken, isAdmin, brandController.getAllBrands);

  router.put(
    "/:id",
    validateUpdateBrand,
    verifyToken,
    isAdmin,
    brandController.updateBrand
  );

  router.delete(
    "/:id",
    validateId,
    verifyToken,
    isAdmin,
    brandController.deleteBrand
  );

  return router;
};
