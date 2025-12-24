const bcrypt = require("bcrypt");
const { NotFoundError, ConflictError } = require("../utils/errors");

class AuthService {
  constructor(userRepository, tokenProvider) {
    this.userRepository = userRepository;
    this.tokenProvider = tokenProvider;
  }

  async registerUser(userData) {
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      const userToSave = {
        ...userData,
        password: hashedPassword,
      };

      const user = await this.userRepository.save(userToSave);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        shippingAddresses: user.shippingAddresses || [],
        isAdmin: user.isAdmin || false,
      };
    } catch (error) {
      if (error.status === 409) {
        throw new ConflictError("El correo electrónico ya está registrado.");
      }
      throw error;
    }
  }

  async loginUser(credentials) {
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user) return null;

    const isMatched = await bcrypt.compare(credentials.password, user.password);
    if (!isMatched) return null;

    const payload = {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    const token = this.tokenProvider.generate(payload);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    };
  }

  async getUserById(id) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundError("Usuario no encontrado.");
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(id, updateData) {
    if (updateData.isAdmin !== undefined) delete updateData.isAdmin;

    if (updateData.password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    try {
      const updatedUser = await this.userRepository.update(id, updateData);
      const { password, ...safeUser } = updatedUser;
      return safeUser;
    } catch (error) {
      if (error.status === 404) throw new NotFoundError("Usuario no encontrado.");
      if (error.status === 409) throw new ConflictError("El nuevo email ya está en uso.");
      throw error;
    }
  }

  async deleteUser(id) {
    const deleted = await this.userRepository.delete(id);
    if (!deleted) throw new NotFoundError("Usuario no encontrado.")
    return deleted;
  }
}

module.exports = AuthService;