require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// --- CLASES DE MODELOS Y REPOSITORIOS ---
// User
const User = require("./db/user");
const UserRepository = require("./repositories/user-repository");
const TokenProvider = require("./providers/token-provider");
const AuthServiceClass = require("./services/auth-service");

// Brand
const Brand = require("./db/brand");
const BrandRepository = require("./repositories/brand-repository");
const BrandServiceClass = require("./services/brand-service");
const brandRoutesFactory = require("./routes/brand");

// Category
const Category = require("./db/category");
const CategoryRepository = require("./repositories/category-repository");
const CategoryServiceClass = require("./services/category-service");
const categoryRoutesFactory = require("./routes/category");

const ProductRepository = require("./repositories/product-repository");

const authMiddlewareFactory = require("./middleware/auth-middleware"); 
const errorHandler = require("./middleware/error-middleware");
const authRoutesFactory = require("./routes/auth");

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(express.json());

function createApp(dependencies) {
  const tokenProvider = new TokenProvider(process.env.JWT_SECRET);
  const { verifyToken, isAdmin } = authMiddlewareFactory(tokenProvider);
  
  const authServiceInstance = new AuthServiceClass(
    dependencies.userRepository,
    tokenProvider
  );
  
  const productRepository = new ProductRepository(/* ProductModel */); 
  const brandRepository = new BrandRepository(Brand);
  const categoryRepository = new CategoryRepository(Category);

  const categoryService = new CategoryServiceClass(
    categoryRepository,
    brandRepository,
    productRepository
  );
  const brandService = new BrandServiceClass(
    brandRepository,
    categoryRepository, 
    productRepository
  );


  app.use("/brand", brandRoutesFactory(brandService, verifyToken, isAdmin));
  app.use("/category", categoryRoutesFactory(categoryService, verifyToken, isAdmin));
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
  Brand,
  BrandRepository,
  BrandServiceClass,
  Category,
  CategoryRepository,
  CategoryServiceClass,
  ProductRepository,
};