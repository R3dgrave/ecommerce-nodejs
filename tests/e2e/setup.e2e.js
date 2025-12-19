const mongoose = require('mongoose');
const { createApp } = require("../../src/app");
const { databaseLoader, closeDatabase } = require("../../src/loaders/database");

// Repositorios
const UserRepositoryClass = require("../../src/repositories/user-repository");
const CategoryRepositoryClass = require("../../src/repositories/category-repository");
const BrandRepositoryClass = require("../../src/repositories/brand-repository");
const ProductRepositoryClass = require("../../src/repositories/product-repository");
const CartRepositoryClass = require("../../src/repositories/cart-repository");

// Servicios
const AuthServiceClass = require("../../src/services/auth-service");
const CategoryServiceClass = require("../../src/services/category-service");
const BrandServiceClass = require("../../src/services/brand-service");
const ProductServiceClass = require("../../src/services/product-service");
const CartServiceClass = require("../../src/services/cart-service");

// Modelos
const UserModel = require("../../src/models/user");
const CategoryModel = require("../../src/models/category");
const BrandModel = require("../../src/models/brand");
const ProductModel = require("../../src/models/product");
const CartModel = require("../../src/models/cart");

const TokenProviderClass = require("../../src/providers/token-provider");
const config = require("../../config/index");

// --- Instanciación de Repositorios ---
const userRepository = new UserRepositoryClass(UserModel);
const categoryRepository = new CategoryRepositoryClass(CategoryModel);
const brandRepository = new BrandRepositoryClass(BrandModel);
const productRepository = new ProductRepositoryClass(ProductModel);
const cartRepository = new CartRepositoryClass(CartModel);

const tokenProvider = new TokenProviderClass(
  config.jwtSecret || "default-secret-test"
);

// --- Instanciación de Servicios ---
const authService = new AuthServiceClass(userRepository, tokenProvider);

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

const productService = new ProductServiceClass(
  productRepository,
  categoryRepository,
  brandRepository
);

const cartService = new CartServiceClass(
  cartRepository,
  productRepository
);

// --- Inicialización de Express ---
const app = createApp({
  authService,
  categoryService,
  brandService,
  productService,
  cartService,
  tokenProvider,
});

beforeAll(async () => {
  await databaseLoader();
});

afterAll(async () => {
  await closeDatabase();
});

const cleanDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

// Exportaciones para uso en los archivos .test.js
module.exports = {
  app,
  closeDatabase,
  cleanDatabase,
  userRepository,
  productRepository,
  cartRepository,
  UserModel,
  CategoryModel,
  BrandModel,
  ProductModel,
  CartModel,
};