const mongoose = require("mongoose");
const config = require("../../config/index");

/**
 * Conecta la aplicación a la base de datos MongoDB usando Mongoose.
 * @returns {Promise<void>}
 */
async function databaseLoader() {
  try {
    await mongoose.connect(config.databaseURL);
    console.log("🟢 MongoDB: Conexión establecida correctamente.");
    mongoose.connection.on("error", (err) => {
      console.error(
        `🔴 MongoDB Error de conexión después del inicio: ${err.message}`
      );
    });
  } catch (error) {
    console.error(
      "🔴 MongoDB Error: Falló la conexión inicial a la base de datos.",
      error
    );
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Cierra la conexión de Mongoose con la base de datos para test de jest.
 * @returns {Promise<void>}
 */
async function closeDatabase() {
  if (mongoose.connection.readyState !== 0 && mongoose.connection.readyState !== 3) {
    await mongoose.disconnect();
    console.log("🟡 MongoDB: Conexión cerrada.");
  }
}

module.exports = { databaseLoader, closeDatabase };