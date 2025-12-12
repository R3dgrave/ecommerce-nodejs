/**
 * Clase que contiene la lógica de negocio para las Categorías.
 * Service Pattern. DIP: Depende de la abstracción CategoryRepository.
 * lógica interna, acceso a otros servicios/repositorios, o traducción de errores de la base de datos
 */
class CategoryService {
  constructor(categoryRepository, brandRepository, productRepository) {
    this.categoryRepository = categoryRepository;
    this.brandRepository = brandRepository;
    this.productRepository = productRepository;
  }

  async getAllCategories() {
    return this.categoryRepository.find();
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

    try {
      return await this.categoryRepository.save(categoryData);
    } catch (error) {
      if (error.code === 11000) {
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
      // 2. Llamar al repositorio para la actualización
      await this.categoryRepository.update(id, categoryData);

      // Opcional: verificar si la actualización afectó a 0 documentos
      // para lanzar un 404 si el ID no existía. Esto requiere que el Repositorio
      // devuelva información sobre el número de documentos afectados.
    } catch (error) {
      if (error.code === 11000) {
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

    // CHEQUEO DE INTEGRIDAD REFERENCIAL (Brand)
    // necesario implementar un método countByCategoryId() en BrandRepository
    const brandsCount = await this.brandRepository.countByCategoryId(id);
    if (brandsCount > 0) {
      const conflictError = new Error(
        `No se puede eliminar la categoría. ${brandsCount} marca(s) dependen de ella.`
      );
      conflictError.status = 409;
      throw conflictError;
    }

    // CHEQUEO DE INTEGRIDAD REFERENCIAL (Product)
    // implementar un método countByCategoryId() en ProductRepository
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
