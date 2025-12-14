const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Importaciones de Middlewares y Routers
const authMiddlewareFactory = require("./middlewares/auth-middleware");
const errorHandler = require("./middlewares/error-middleware");
const authRoutesFactory = require("./api/routes/auth");
const brandRoutesFactory = require("./api/routes/brand");
const categoryRoutesFactory = require("./api/routes/category");

const app = express();

const config = require("../config/index");

const corsOptions = {
  origin: config.frontendURL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(express.json());

function createApp(dependencies) {
  const { authService, categoryService, brandService, tokenProvider } = dependencies;

  // CREACIÓN DE MIDDLEWARES DE AUTENTICACIÓN/AUTORIZACIÓN(Estos middlewares necesitan el tokenProvider)
  const { verifyToken, isAdmin } = authMiddlewareFactory(tokenProvider);
  app.use("/auth", authRoutesFactory(authService));
  app.use("/category", categoryRoutesFactory(categoryService, verifyToken, isAdmin));
  app.use("/brand", brandRoutesFactory(brandService, verifyToken, isAdmin));

  app.get("/", (req, res) => { res.send("Servidor funcionando correctamente."); });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
