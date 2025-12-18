const express = require("express");
const BrandControllerFactory = require("../controllers/brand-controller");
const {
  validateCreateBrand,
  validateId,
  validateUpdateBrand,
  validateCategoryIdParam
} = require("../validators/brand-validator");

/**
 * Función factory para crear el router de Marcas.
 * @param {BrandService} brandService - Instancia del servicio de Marcas.
 * @param {Function} verifyToken - Middleware de autenticación.
 * @param {Function} isAdmin - Middleware de autorización.
 * @returns {express.Router} El router configurado.
 */
module.exports = function (brandService, verifyToken, isAdmin) {
  const router = express.Router();
  const brandController = BrandControllerFactory(brandService);

  // POST /brand
  router.post(
    "/",
    validateCreateBrand,
    verifyToken,
    isAdmin,
    brandController.createBrand
  );

  // GET /brand/categories/:categoryId
  router.get(
    "/categories/:categoryId",
    validateCategoryIdParam,
    verifyToken,
    isAdmin,
    brandController.getBrandsByCategory
  );

  // GET /brand/:id
  router.get(
    "/:id",
    validateId,
    verifyToken,
    isAdmin,
    brandController.getBrandById
  );

  // GET /brand (GetAll)
  router.get(
    "/",
    verifyToken,
    isAdmin,
    brandController.getAllBrands
  );


  // PUT /brand/:id
  router.put(
    "/:id",
    validateUpdateBrand,
    verifyToken,
    isAdmin,
    brandController.updateBrand
  );

  // DELETE /brand/:id
  router.delete(
    "/:id",
    validateId,
    verifyToken,
    isAdmin,
    brandController.deleteBrand
  );

  return router;
};