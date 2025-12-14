const { ConflictError } = require('../repositories/base-repository');

/**
 * Clase que contiene la lógica de negocio para las Categorías.
 * Service Pattern. Depende de la abstracción CategoryRepository.
 */
class CategoryService {
  constructor(categoryRepository, brandRepository, productRepository) {
    this.categoryRepository = categoryRepository;
    this.brandRepository = brandRepository;
    this.productRepository = productRepository;
  }

  async getAllCategories(query = {}) {
    const { page = 1, limit = 10, name } = query;

    const filter = {};
    if (name) {
      filter.name = { $regex: new RegExp(name, 'i') };
    }

    const options = {
      limit: parseInt(limit, 10),
      page: parseInt(page, 10),
    };

    return this.categoryRepository.findWithPagination(filter, options);
  }

  async getCategoryById(id) {
    return this.categoryRepository.findById(id);
  }

  async createCategory(categoryData) {
    if (!categoryData.name || categoryData.name.trim().length === 0) {
      const error = new Error(
        "El nombre de la categoría es requerido y no puede estar vacío."
      );
      error.status = 400;
      throw error;
    }

    categoryData.name = categoryData.name.trim();

    try {
      return await this.categoryRepository.save(categoryData);
    } catch (error) {
      if (error instanceof ConflictError) {
        const conflictError = new Error(
          "Ya existe una categoría con este nombre."
        );
        conflictError.status = 409;
        throw conflictError;
      }
      throw error;
    }
  }

  async updateCategory(id, categoryData) {
    if (categoryData.name && categoryData.name.trim().length === 0) {
      const error = new Error(
        "El nombre de la categoría no puede estar vacío."
      );
      error.status = 400;
      throw error;
    }

    try {
      await this.categoryRepository.update(id, categoryData);
    } catch (error) {
      if (error instanceof ConflictError) {
        const conflictError = new Error(
          "Ya existe otra categoría con ese nombre."
        );
        conflictError.status = 409;
        throw conflictError;
      }
      throw error;
    }
  }

  async deleteCategory(id) {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      const notFoundError = new Error(`Categoría con ID ${id} no encontrada.`);
      notFoundError.status = 404;
      throw notFoundError;
    }

    const brandsCount = await this.brandRepository.countByCategoryId(id);
    if (brandsCount > 0) {
      const conflictError = new Error(
        `No se puede eliminar la categoría. ${brandsCount} marca(s) dependen de ella.`
      );
      conflictError.status = 409;
      throw conflictError;
    }

    const productsCount = await this.productRepository.countByCategoryId(id);
    if (productsCount > 0) {
      const conflictError = new Error(
        `No se puede eliminar la categoría. ${productsCount} producto(s) dependen de ella.`
      );
      conflictError.status = 409;
      throw conflictError;
    }

    return this.categoryRepository.delete(id);
  }
}

module.exports = CategoryService;