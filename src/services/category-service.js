const { NotFoundError, ConflictError, BusinessLogicError } = require("../utils/errors");

class CategoryService {
  constructor(categoryRepository, brandRepository, productRepository) {
    this.categoryRepository = categoryRepository;
    this.brandRepository = brandRepository;
    this.productRepository = productRepository;
  }

  async getAllCategories(query = {}) {
    const { page, limit, name } = query;
    const filter = {};
    if (name) filter.name = { $regex: new RegExp(name, 'i') };

    return this.categoryRepository.findWithPagination(filter, { page, limit });
  }

  async getCategoryById(id) {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundError("Categoría no encontrada");
    return category;
  }

  async createCategory(categoryData) {
    if (!categoryData.name || categoryData.name.trim().length === 0) {
      throw new BusinessLogicError("El nombre de la categoría es requerido.");
    }

    try {
      categoryData.name = categoryData.name.trim();
      return await this.categoryRepository.save(categoryData);
    } catch (error) {
      if (error.status === 409) {
        throw new ConflictError("Ya existe una categoría con este nombre.");
      }
      throw error;
    }
  }

  async updateCategory(id, categoryData) {
    if (categoryData.name !== undefined && categoryData.name.trim().length === 0) {
      throw new BusinessLogicError("El nombre de la categoría no puede estar vacío.");
    }

    try {
      if (categoryData.name) categoryData.name = categoryData.name.trim();
      return await this.categoryRepository.update(id, categoryData);
    } catch (error) {
      if (error.status === 404) throw new NotFoundError("Categoría no encontrada.");
      if (error.status === 409) throw new ConflictError("Ya existe otra categoría con ese nombre.");
      throw error;
    }
  }

  async deleteCategory(id) {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundError(`Categoría con ID ${id} no encontrada.`);

    const brandsCount = await this.brandRepository.countByCategoryId(id);
    if (brandsCount > 0) {
      throw new ConflictError(`No se puede eliminar: ${brandsCount} marca(s) asociadas.`);
    }

    const productsCount = await this.productRepository.countByCategoryId(id);
    if (productsCount > 0) {
      throw new ConflictError(`No se puede eliminar: ${productsCount} producto(s) asociados.`);
    }

    return this.categoryRepository.delete(id);
  }
}

module.exports = CategoryService;