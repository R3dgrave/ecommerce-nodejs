const { NotFoundError } = require("../utils/errors");

class CustomerService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async getProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError("Usuario no encontrado");

    const { password, ...profile } = user;
    return profile;
  }

  async updateProfile(userId, updateData) {
    delete updateData.isAdmin;
    delete updateData.password;

    try {
      return await this.userRepository.update(userId, updateData);
    } catch (error) {
      if (error.status === 404) throw new NotFoundError("Perfil no encontrado.");
      throw error;
    }
  }

  async addAddress(userId, address) {
    return await this.userRepository.update(userId, {
      $push: { shippingAddresses: address }
    });
  }
}

module.exports = CustomerService;