const { ConflictError } = require('../repositories/base-repository');

/**
 * Clase que contiene la lógica de negocio para las Marcas.
 * Service Pattern. Depende de la abstracción BrandRepository.
 */
class BrandService {
  constructor(brandRepository, categoryRepository, productRepository) {
    this.brandRepository = brandRepository;
    this.categoryRepository = categoryRepository;
    this.productRepository = productRepository;
  }

  async _checkCategoryExistence(categoryId) {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      const error = new Error(
        `La CategoryId ${categoryId} proporcionada no existe.`
      );
      error.status = 404;
      throw error;
    }
  }

  async getAllBrands(queryParams = {}) {
    const { page, limit, name } = queryParams;

    let filter = {};
    if (name) {
      filter.name = { $regex: new RegExp(name, 'i') };
    }

    const options = { page, limit };
    return this.brandRepository.findWithPagination(filter, options);
  }

  async getBrandById(id) {
    return this.brandRepository.findById(id);
  }

  async getBrandsByCategory(categoryId) {
    return this.brandRepository.findByCategoryId(categoryId);
  }

  async createBrand(brandData) {
    if (brandData.categoryId) {
      await this._checkCategoryExistence(brandData.categoryId);
    } else {
      const error = new Error("El CategoryId es requerido.");
      error.status = 400;
      throw error;
    }

    try {
      return await this.brandRepository.save(brandData);
    } catch (error) {
      if (error instanceof ConflictError) {
        const conflictError = new Error("Ya existe una marca con este nombre.");
        conflictError.status = 409;
        throw conflictError;
      }
      throw error;
    }
  }

  async updateBrand(id, brandData) {
    if (brandData.categoryId) {
      await this._checkCategoryExistence(brandData.categoryId);
    }

    try {
      await this.brandRepository.update(id, brandData);
    } catch (error) {
      if (error instanceof ConflictError) {
        const conflictError = new Error("Ya existe otra marca con ese nombre.");
        conflictError.status = 409;
        throw conflictError;
      }
      throw error;
    }
  }

  async deleteBrand(id) {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      const notFoundError = new Error(`Marca con ID ${id} no encontrada.`);
      notFoundError.status = 404;
      throw notFoundError;
    }

    const productsCount = await this.productRepository.countByBrandId(id);
    if (productsCount > 0) {
      const conflictError = new Error(
        `No se puede eliminar la marca. ${productsCount} producto(s) dependen de ella.`
      );
      conflictError.status = 409;
      throw conflictError;
    }

    return this.brandRepository.delete(id);
  }
}

module.exports = BrandService;