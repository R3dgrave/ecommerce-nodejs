const { BaseRepository } = require('./base-repository');

class BrandRepository extends BaseRepository {
  constructor(BrandModel) {
    super(BrandModel);
  }

  async findByCategoryId(categoryId) {
    const filter = categoryId ? { categoryId } : {};
    return this.findBy(filter);
  }

  async countByFilter(filter) {
    return this.count(filter);
  }

  /**
    * Cuenta cuántas marcas existen para una categoría dada.
    * Método vital para la lógica de eliminación de CategoryService.
    * @param {string} categoryId
    * @returns {Promise<number>}
    */
  async countByCategoryId(categoryId) {
    const filter = { categoryId: categoryId };
    return this.count(filter);
  }
}

module.exports = BrandRepository;