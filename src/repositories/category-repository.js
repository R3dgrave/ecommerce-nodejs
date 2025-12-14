const { BaseRepository } = require('./base-repository');

/**
 * Clase que encapsula todas las operaciones de acceso a datos para las categorías.
 * Patrón Repository. Extiende BaseRepository para CRUD y Paginación.
 */
class CategoryRepository extends BaseRepository {
    constructor(CategoryModel) {
        super(CategoryModel);
    }
}

module.exports = CategoryRepository;