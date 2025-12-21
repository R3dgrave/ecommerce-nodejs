//src/app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { swaggerUi, specs } = require("../config/swagger");

// Importaciones de Middlewares y Routers
const authMiddlewareFactory = require("./middlewares/auth-middleware");
const errorHandler = require("./middlewares/error-middleware");
const authRoutesFactory = require("./api/routes/auth");
const brandRoutesFactory = require("./api/routes/brand");
const categoryRoutesFactory = require("./api/routes/category");
const productRoutesFactory = require("./api/routes/product");
const cartRoutesFactory = require("./api/routes/cart");
const orderRoutesFactory = require("./api/routes/order");

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
  const {
    authService,
    categoryService,
    brandService,
    productService,
    cartService,
    orderService,
    tokenProvider,
  } = dependencies;

  // CREACIÓN DE MIDDLEWARES DE AUTENTICACIÓN/AUTORIZACIÓN(Estos middlewares necesitan el tokenProvider)
  const { verifyToken, isAdmin } = authMiddlewareFactory(tokenProvider);
  app.use("/auth", authRoutesFactory(authService, verifyToken));
  app.use("/category", categoryRoutesFactory(categoryService, verifyToken, isAdmin));
  app.use("/brand", brandRoutesFactory(brandService, verifyToken, isAdmin));
  app.use("/product", productRoutesFactory(productService, verifyToken, isAdmin));
  app.use("/cart", cartRoutesFactory(cartService, verifyToken));
  app.use("/order", orderRoutesFactory(orderService, verifyToken));

  app.get("/", (req, res) => { res.send("Servidor funcionando correctamente."); });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
