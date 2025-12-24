const mongoose = require('mongoose');
const { createApp } = require("../../src/app");
const { databaseLoader, closeDatabase } = require("../../src/loaders/database");

const UserRepositoryClass = require("../../src/repositories/user-repository");
const CategoryRepositoryClass = require("../../src/repositories/category-repository");
const BrandRepositoryClass = require("../../src/repositories/brand-repository");
const ProductRepositoryClass = require("../../src/repositories/product-repository");
const CartRepositoryClass = require("../../src/repositories/cart-repository");
const OrderRepositoryClass = require("../../src/repositories/order-repository");
const PaymentRepositoryClass = require("../../src/repositories/payment-repository");

const AuthServiceClass = require("../../src/services/auth-service");
const CategoryServiceClass = require("../../src/services/category-service");
const BrandServiceClass = require("../../src/services/brand-service");
const ProductServiceClass = require("../../src/services/product-service");
const CartServiceClass = require("../../src/services/cart-service");
const OrderServiceClass = require("../../src/services/order-service");
const PaymentServiceClass = require("../../src/services/payment-service");
const CustomerServiceClass = require("../../src/services/customer-service");

const authMiddlewareFactory = require("../../src/middlewares/auth-middleware");

const UserModel = require("../../src/models/user");
const CategoryModel = require("../../src/models/category");
const BrandModel = require("../../src/models/brand");
const ProductModel = require("../../src/models/product");
const CartModel = require("../../src/models/cart");
const OrderModel = require("../../src/models/order");
const PaymentModel = require("../../src/models/payment");

const TokenProviderClass = require("../../src/providers/token-provider");
const config = require("../../config/index");

const userRepository = new UserRepositoryClass(UserModel);
const categoryRepository = new CategoryRepositoryClass(CategoryModel);
const brandRepository = new BrandRepositoryClass(BrandModel);
const productRepository = new ProductRepositoryClass(ProductModel);
const cartRepository = new CartRepositoryClass(CartModel);
const orderRepository = new OrderRepositoryClass(OrderModel);
const paymentRepository = new PaymentRepositoryClass(PaymentModel);

const tokenProvider = new TokenProviderClass(
  config.jwtSecret || "default-secret-test"
);

const authMiddleware = authMiddlewareFactory(tokenProvider, userRepository);

const authService = new AuthServiceClass(userRepository, tokenProvider);
const customerService = new CustomerServiceClass(userRepository);

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

const orderService = new OrderServiceClass(
  orderRepository,
  cartRepository,
  productRepository
);

const paymentService = new PaymentServiceClass(
  paymentRepository,
  orderRepository,
  productRepository
);

const app = createApp({
  authService,
  customerService,
  categoryService,
  brandService,
  productService,
  cartService,
  orderService,
  paymentService,
  tokenProvider,
  authMiddleware,
});

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await databaseLoader();
  }
});

afterAll(async () => {
  try {
    await cleanDatabase();
    await closeDatabase();

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (error) {
    console.error("Error cerrando el setup de tests:", error);
  }
});

const cleanDatabase = async () => {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

module.exports = {
  app,
  closeDatabase,
  cleanDatabase,

  userRepository,
  productRepository,
  cartRepository,
  orderRepository,
  paymentRepository,

  UserModel,
  CategoryModel,
  BrandModel,
  ProductModel,
  CartModel,
  OrderModel,
  PaymentModel,

  authService,
  customerService,
};