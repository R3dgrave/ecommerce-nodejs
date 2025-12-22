const { ConflictError } = require("../repositories/base-repository");

class ProductService {
  constructor(productRepository, categoryRepository, brandRepository) {
    this.productRepository = productRepository;
    this.categoryRepository = categoryRepository;
    this.brandRepository = brandRepository;
  }

  /**
   * @private
   * Verifica la existencia de la categoría y marca antes de crear/actualizar un producto.
   * Lanza 404 si no existen.
   */
  async _checkDependencies(categoryId, brandId) {
    if (categoryId) {
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        const error = new Error(
          `La CategoryId ${categoryId} proporcionada no existe.`
        );
        error.status = 404;
        throw error;
      }
    }

    if (brandId) {
      const brand = await this.brandRepository.findById(brandId);
      if (!brand) {
        const error = new Error(
          `La BrandId ${brandId} proporcionada no existe.`
        );
        error.status = 404;
        throw error;
      }
    }
  }

  // --- Métodos de Consulta Principales ---

  /**
   * Obtiene una lista paginada de productos con opciones de filtro.
   * Es crucial para la API de listado de productos.
   * @param {Object} query Parámetros de la consulta (page, limit, name, categoryId, brandId)
   * @param {Object} [populateOptions={}] Opciones para poblar (populateBrand, populateCategory)
   */
  async getAllProducts(query = {}, populateOptions = {}) {
    const { page = 1, limit = 10, name, categoryId, brandId } = query;

    const filter = {};

    if (name) {
      filter.name = { $regex: new RegExp(name, "i") };
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (brandId) {
      filter.brandId = brandId;
    }

    const options = {
      limit: parseInt(limit, 10),
      page: parseInt(page, 10),
    };

    // Se usa findWithPagination, pero se modifica en product-repository para que acepte las opciones de población.
    return this.productRepository.findWithPagination(
      filter,
      options,
      populateOptions
    );
  }

  /**
   * Obtiene un solo producto por ID. Permite control de población.
   */
  async getProductById(id, populateOptions = {}) {
    const product = await this.productRepository.findById(id, populateOptions);

    if (!product) {
      const notFoundError = new Error(`Producto con ID ${id} no encontrado.`);
      notFoundError.status = 404;
      throw notFoundError;
    }
    return product;
  }

  /**
   * Obtiene múltiples productos por sus IDs. Vital para servicios como Cart/Order.
   */
  async getProductsByIds(ids, populateOptions = {}) {
    const filter = { _id: { $in: ids } };
    return this.productRepository.findBy(filter, populateOptions);
  }

  // --- Métodos CRUD ---

  async createProduct(productData) {
    await this._checkDependencies(productData.categoryId, productData.brandId);

    try {
      return await this.productRepository.save(productData);
    } catch (error) {
      if (error instanceof ConflictError) {
        const conflictError = new Error(
          "Ya existe un producto con este nombre."
        );
        conflictError.status = 409;
        throw conflictError;
      }
      throw error;
    }
  }

  async updateProduct(id, productData) {
    // 1. Si se cambian las IDs, validar dependencias
    await this._checkDependencies(productData.categoryId, productData.brandId);

    // 2. Actualizar
    try {
      await this.productRepository.update(id, productData);
    } catch (error) {
      if (error instanceof ConflictError) {
        const conflictError = new Error(
          "Ya existe otro producto con ese nombre."
        );
        conflictError.status = 409;
        throw conflictError;
      }
      throw error;
    }
  }

  async deleteProduct(id) {
    const deleted = await this.productRepository.delete(id);

    if (!deleted) {
      const notFoundError = new Error(`Producto con ID ${id} no encontrado.`);
      notFoundError.status = 404;
      throw notFoundError;
    }

    return deleted;
  }
}

module.exports = ProductService;
