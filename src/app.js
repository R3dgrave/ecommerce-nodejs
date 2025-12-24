const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { swaggerUi, specs } = require("../config/swagger");

const errorHandler = require("./middlewares/error-middleware");
const authRoutesFactory = require("./api/routes/auth-routes");
const brandRoutesFactory = require("./api/routes/brand-routes");
const categoryRoutesFactory = require("./api/routes/category-routes");
const productRoutesFactory = require("./api/routes/product-routes");
const cartRoutesFactory = require("./api/routes/cart-routes");
const orderRoutesFactory = require("./api/routes/order-routes");
const paymentRoutesFactory = require("./api/routes/payment-routes");
const customerRoutesFactory = require("./api/routes/customer-routes");
const wishlistRoutesFactory = require("./api/routes/wishlist-routes");

const app = express();

const config = require("../config/index");

const corsOptions = {
  origin: config.frontendURL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/payment/webhook')) {
      req.rawBody = buf;
    }
  }
}));

app.use(morgan("dev"));
app.use(cors(corsOptions));

function createApp(dependencies) {
  const {
    authService,
    customerService,
    categoryService,
    brandService,
    productService,
    cartService,
    orderService,
    paymentService,
    wishlistService,
    authMiddleware,
  } = dependencies;

  // CREACIÓN DE MIDDLEWARES DE AUTENTICACIÓN/AUTORIZACIÓN(Estos middlewares necesitan el tokenProvider)
  const { verifyToken, isAdmin } = authMiddleware;
  app.use("/auth", authRoutesFactory(authService, verifyToken));
  app.use("/customer", customerRoutesFactory(customerService, verifyToken));
  app.use("/wishlist", wishlistRoutesFactory(wishlistService, verifyToken));

  app.use("/category", categoryRoutesFactory(categoryService, verifyToken, isAdmin));
  app.use("/brand", brandRoutesFactory(brandService, verifyToken, isAdmin));
  app.use("/product", productRoutesFactory(productService, verifyToken, isAdmin));

  app.use("/cart", cartRoutesFactory(cartService, verifyToken));
  app.use("/order", orderRoutesFactory(orderService, verifyToken));

  app.use("/payment", paymentRoutesFactory(paymentService, verifyToken, isAdmin));

  app.get("/", (req, res) => { res.send("Servidor funcionando correctamente."); });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
