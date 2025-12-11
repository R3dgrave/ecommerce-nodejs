require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Clases de Dependencias
const User = require("./db/user");
const UserRepository = require("./repositories/user-repository");
const TokenProvider = require("./providers/token-provider");
const AuthServiceClass = require("./services/auth-service");

// Importación de Middlewares y Factories
const { verifyTokenFactory } = require("./middleware/auth-middleware");
const errorHandler = require("./middleware/error-middleware");
const authRoutesFactory = require("./routes/auth");

// Rutas protegidas
const brandRoutes = require("./routes/brand");

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Middlewares Globales
app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(express.json());

function createApp(dependencies) {
  const tokenProvider = new TokenProvider(process.env.JWT_SECRET);
  const verifyTokenInstance = verifyTokenFactory(tokenProvider);

  const authServiceInstance = new AuthServiceClass(
    dependencies.userRepository,
    tokenProvider
  );

  app.use("/auth", authRoutesFactory(authServiceInstance));

  app.get("/", (req, res) => {
    res.send("Servidor funcionando correctamente.");
  });

  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
  User,
  UserRepository,
  TokenProvider,
  AuthServiceClass,
};
