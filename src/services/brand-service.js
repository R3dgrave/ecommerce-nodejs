const { NotFoundError, ConflictError, BusinessLogicError } = require("../utils/errors");

class BrandService {
  constructor(brandRepository, categoryRepository, productRepository) {
    this.brandRepository = brandRepository;
    this.categoryRepository = categoryRepository;
    this.productRepository = productRepository;
  }

  async _checkCategoryExistence(categoryId) {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundError(`La categoría con ID ${categoryId} no existe.`);
    }
  }

  async getAllBrands(queryParams = {}) {
    const { page, limit, name } = queryParams;
    let filter = {};
    if (name) filter.name = { $regex: new RegExp(name, 'i') };

    return this.brandRepository.findWithPagination(filter, { page, limit });
  }

  async getBrandById(id) {
    const brand = await this.brandRepository.findById(id);
    if (!brand) throw new NotFoundError("Marca no encontrada.");
    return brand;
  }

  async getBrandsByCategory(categoryId) {
    await this._checkCategoryExistence(categoryId);
    return this.brandRepository.findByCategoryId(categoryId);
  }

  async createBrand(brandData) {
    if (!brandData.categoryId) {
      throw new BusinessLogicError("El CategoryId es requerido.");
    }

    await this._checkCategoryExistence(brandData.categoryId);

    try {
      return await this.brandRepository.save(brandData);
    } catch (error) {
      if (error.status === 409) {
        throw new ConflictError("Ya existe una marca con este nombre.");
      }
      throw error;
    }
  }

  async updateBrand(id, brandData) {
    if (brandData.categoryId) {
      await this._checkCategoryExistence(brandData.categoryId);
    }

    try {
      const updated = await this.brandRepository.update(id, brandData);
      return updated;
    } catch (error) {
      if (error.status === 404) throw new NotFoundError("Marca no encontrada.");
      if (error.status === 409) throw new ConflictError("Ya existe otra marca con ese nombre.");
      throw error;
    }
  }

  async deleteBrand(id) {
    const brand = await this.brandRepository.findById(id);
    if (!brand) throw new NotFoundError(`Marca con ID ${id} no encontrada.`);

    const productsCount = await this.productRepository.countByBrandId(id);
    if (productsCount > 0) {
      throw new ConflictError(
        `No se puede eliminar la marca. ${productsCount} producto(s) dependen de ella.`
      );
    }

    return this.brandRepository.delete(id);
  }
}

module.exports = BrandService;