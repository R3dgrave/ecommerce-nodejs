const bcrypt = require("bcrypt");
const { CustomError } = require("../utils/errors");

/**
 * Clase que contiene la lógica de negocio de la autenticación.
 * Service Pattern. DIP: Depende de abstracciones (UserRepository, TokenProvider).
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
}

module.exports = AuthService;
