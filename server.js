const config = require("./config/index");
const { createApp } = require("./src/app");
const databaseLoader = require("./src/loaders/database");
const dependencyInjectorLoader = require("./src/loaders/dependency-injector");
const PORT = config.port;

async function connectDbAndStartServer() {
  try {
    await databaseLoader();
    const container = dependencyInjectorLoader();
    const app = createApp(container);

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
      console.log(`🌐 Entorno: ${config.env}`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error.message);
    process.exit(1);
  }
}

connectDbAndStartServer();
