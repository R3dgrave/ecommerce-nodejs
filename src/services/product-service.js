const { NotFoundError, ConflictError } = require("../utils/errors");

class ProductService {
  constructor(productRepository, categoryRepository, brandRepository) {
    this.productRepository = productRepository;
    this.categoryRepository = categoryRepository;
    this.brandRepository = brandRepository;
  }

  async _checkDependencies(categoryId, brandId) {
    if (categoryId) {
      const exists = await this.categoryRepository.findById(categoryId);
      if (!exists) throw new NotFoundError(`La categoría ${categoryId} no existe.`);
    }
    if (brandId) {
      const exists = await this.brandRepository.findById(brandId);
      if (!exists) throw new NotFoundError(`La marca ${brandId} no existe.`);
    }
  }

  async getAllProducts(query = {}, populateOptions = {}) {
    const { page = 1, limit = 10, name, categoryId, brandId } = query;
    const filter = {};

    if (name) filter.name = { $regex: new RegExp(name, "i") };
    if (categoryId) filter.categoryId = categoryId;
    if (brandId) filter.brandId = brandId;

    return this.productRepository.findWithPagination(filter, { page, limit }, populateOptions);
  }

  async getProductById(id, populateOptions = {}) {
    const product = await this.productRepository.findById(id, populateOptions);
    if (!product) throw new NotFoundError(`Producto no encontrado.`);
    return product;
  }

  async createProduct(productData) {
    await this._checkDependencies(productData.categoryId, productData.brandId);
    try {
      return await this.productRepository.save(productData);
    } catch (error) {
      if (error.status === 409) throw new ConflictError("Ya existe un producto con este nombre.");
      throw error;
    }
  }

  async updateProduct(id, productData) {
    await this._checkDependencies(productData.categoryId, productData.brandId);
    try {
      return await this.productRepository.update(id, productData);
    } catch (error) {
      if (error.status === 404) throw new NotFoundError("Producto no encontrado.");
      if (error.status === 409) throw new ConflictError("Nombre de producto ya en uso.");
      throw error;
    }
  }

  async deleteProduct(id) {
    const deleted = await this.productRepository.delete(id);
    if (!deleted) throw new NotFoundError("Producto no encontrado.");
    return deleted;
  }
}

module.exports = ProductService;