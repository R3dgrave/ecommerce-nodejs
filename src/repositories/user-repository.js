/**
 * Clase que encapsula todas las operaciones de acceso a datos para los usuarios.
 * Patrón Repository.
 */
class UserRepository {
  constructor(UserModel) {
    this.UserModel = UserModel;
  }

  async findByEmail(email) {
    return this.UserModel.findOne({ email });
  }

  async save(userData) {
    const user = new this.UserModel(userData);
    await user.save();
    return user;
  }
}

module.exports = UserRepository;
