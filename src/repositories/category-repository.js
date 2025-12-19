const { BaseRepository } = require('./base-repository');

/**
 * Clase que encapsula todas las operaciones de acceso a datos para las categorías.
 * Patrón Repository. Extiende BaseRepository para CRUD y Paginación.
 */
class CategoryRepository extends BaseRepository {
  constructor(CategoryModel) {
    super(CategoryModel);
  }

  async updateByUserId(userId, updateData) {
    let cart = await this.Model.findOne({ userId });

    if (!cart) {
      cart = new this.Model({ userId, ...updateData });
    } else {
      Object.assign(cart, updateData);
    }
    await cart.save();

    return this._toPlainObject(cart);
  }
}

module.exports = CategoryRepository;