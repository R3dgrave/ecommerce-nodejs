const mongoose = require("mongoose");
const config = require("../../config/index");

/**
 * Conecta la aplicación a la base de datos MongoDB usando Mongoose.
 * Su configuración es inyectada desde el archivo config/index.js.
 * @returns {Promise<void>} Una promesa que se resuelve cuando la conexión es exitosa.
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
    process.exit(1);
  }
}

module.exports = databaseLoader;
