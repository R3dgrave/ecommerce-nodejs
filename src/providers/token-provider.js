const jwt = require("jsonwebtoken");

/**
 * Clase que encapsula la generación y verificación de JWT.
 * Principio (SRP) y Provider.
 */
class TokenProvider {
  constructor(secret) {
    if (!secret) {
      throw new Error("JWT Secret es requerido para TokenProvider.");
    }
    this.secret = secret;
    this.expiresIn = "1h";
  }

  generate(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verifyToken(token) {
    return jwt.verify(token, this.secret);
  }
}

module.exports = TokenProvider;
