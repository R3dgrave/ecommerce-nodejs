require("dotenv").config();
const mongoose = require("mongoose");
const { createApp, User, UserRepository } = require("./app");

const PORT = process.env.PORT || 3000;

async function connectDbAndStartServer() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {});
    console.log("Conexión a MongoDB establecida correctamente");

    const userRepository = new UserRepository(User);
    const app = createApp({
      userRepository: userRepository,
    });

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error.message);
    process.exit(1);
  }
}

connectDbAndStartServer();
