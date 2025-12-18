const { BaseRepository } = require('./base-repository');

/**
 * Clase que encapsula todas las operaciones de acceso a datos para los usuarios.
 *  */
class UserRepository extends BaseRepository {
  constructor(UserModel) {
    super(UserModel);
  }

  async findByEmail(email) {
    const user = await this.Model.findOne({ email }).exec();
    return this._toPlainObject(user);
  }

  async save(userData) {
    return super.save(userData);
  }

  async deleteAll() {
    return this.deleteMany({});
  }

  async deleteByEmail(email) {
    return this.deleteMany({ email: email });
  }

}

module.exports = UserRepository;