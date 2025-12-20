const bcrypt = require("bcrypt");
const { CustomError } = require("../utils/errors");
const { ConflictError } = require("../repositories/base-repository");

/**
 * Clase que contiene la lógica de negocio de la autenticación.
 * Service Pattern. Depende de abstracciones (UserRepository, TokenProvider).
 */
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
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
      };
    } catch (error) {
      if (error instanceof ConflictError) {
        const conflictError = new Error(
          "El correo electrónico ya está registrado."
        );
        conflictError.status = 409;
        throw conflictError;
      }
      throw error;
    }
  }

  async loginUser(credentials) {
    try {
      const user = await this.userRepository.findByEmail(credentials.email);
      if (!user) {
        return null;
      }

      const isMatched = await bcrypt.compare(
        credentials.password,
        user.password
      );
      if (!isMatched) {
        return null;
      }

      const payload = {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      };

      const token = this.tokenProvider.generate(payload);

      return {
        token,
        user: {
          id: user._id,
          name: user.name,
          isAdmin: user.isAdmin,
        },
      };
    } catch (error) {
      throw new CustomError("Fallo interno en la autenticación.", 500);
    }
  }

  async getUserById(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      const error = new Error("Usuario no encontrado.");
      error.status = 404;
      throw error;
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(id, updateData) {
    if (updateData.password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    return await this.userRepository.update(id, updateData);
  }

  async deleteUser(id) {
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      const error = new Error("Usuario no encontrado.");
      error.status = 404;
      throw error;
    }
    return deleted;
  }
}

module.exports = AuthService;
