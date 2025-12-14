const { createApp } = require('../../src/app');
const { databaseLoader, closeDatabase } = require('../../src/loaders/database');

const UserRepositoryClass = require('../../src/repositories/user-repository');
const CategoryRepositoryClass = require('../../src/repositories/category-repository');
const BrandRepositoryClass = require('../../src/repositories/brand-repository');
const ProductRepositoryClass = require('../../src/repositories/product-repository');

const AuthServiceClass = require('../../src/services/auth-service');
const CategoryServiceClass = require('../../src/services/category-service');
const BrandServiceClass = require('../../src/services/brand-service');

const UserModel = require('../../src/models/user');
const CategoryModel = require('../../src/models/category');
const BrandModel = require('../../src/models/brand');
// const ProductModel = require('../../src/models/product');

const TokenProviderClass = require('../../src/providers/token-provider');
const config = require('../../config/index');

// Repositorios (usando los modelos de Mongoose)
const userRepository = new UserRepositoryClass(UserModel);
const categoryRepository = new CategoryRepositoryClass(CategoryModel);
const brandRepository = new BrandRepositoryClass(BrandModel);
const productRepository = new ProductRepositoryClass(/* ProductModel */);


const tokenProvider = new TokenProviderClass(config.jwtSecret || 'default-secret-test');

// Servicios (Inyección de Repositorios/Providers)
const authService = new AuthServiceClass(userRepository, tokenProvider);
const categoryService = new CategoryServiceClass(categoryRepository, brandRepository, productRepository);
const brandService = new BrandServiceClass(brandRepository, categoryRepository, productRepository);

// Inicialización de Express (la instancia REAL)
// Se crea la app con todas las dependencias instanciadas
const app = createApp({ authService, categoryService, brandService, tokenProvider });

beforeAll(async () => {
    await databaseLoader();
});

afterAll(async () => {
    await closeDatabase();
});

// Exporta la app inicializada y la función de cierre para el test E2E.
module.exports = { app, closeDatabase, userRepository, CategoryModel, BrandModel };