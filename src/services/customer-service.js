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
    delete updateData.shippingAddresses;

    return await this.userRepository.update(userId, updateData);
  }

  async addAddress(userId, address) {
    return await this.userRepository.update(userId, {
      $push: { shippingAddresses: address }
    });
  }

  async removeAddress(userId, addressId) {
    return await this.userRepository.update(userId, {
      $pull: { shippingAddresses: { _id: addressId } }
    });
  }
}

module.exports = CustomerService;