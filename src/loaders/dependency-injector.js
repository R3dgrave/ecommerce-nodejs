// Import Configuración
const config = require("../../config/index");

// Import Modelos (Mongoose)
const UserModel = require("../models/user");
const CategoryModel = require("../models/category");
const BrandModel = require("../models/brand");
const ProductModel = require('../models/product');

// Import Repositorios
const UserRepository = require("../repositories/user-repository");
const CategoryRepository = require("../repositories/category-repository");
const BrandRepository = require("../repositories/brand-repository");
const ProductRepository = require("../repositories/product-repository");

// Import Providers
const TokenProvider = require("../providers/token-provider");

// Import Servicios
const AuthServiceClass = require("../services/auth-service");
const CategoryServiceClass = require("../services/category-service");
const BrandServiceClass = require("../services/brand-service");
const ProductServiceClass = require("../services/product-service");

/**
 * Instancia y enlaza todas las dependencias de la aplicación.
 * @returns {object} Un contenedor de dependencias con todas las instancias de Servicios y Providers.
 */
function dependencyInjectorLoader() {
  // INSTANCIAR PROVIDERS
  const tokenProvider = new TokenProvider(config.jwtSecret);

  // INSTANCIAR REPOSITORIOS (Necesitan sus Modelos de Mongoose)
  const userRepository = new UserRepository(UserModel);
  const categoryRepository = new CategoryRepository(CategoryModel);
  const brandRepository = new BrandRepository(BrandModel);
  const productRepository = new ProductRepository(ProductModel);

  // INSTANCIAR SERVICIOS (Necesitan Repositorios y/o Providers)
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

  // ENSAMBLAR Y RETORNAR EL CONTENEDOR FINAL
  const container = {
    // Servicios
    authService,
    categoryService,
    brandService,
    productService,

    // Repositorios
    userRepository,
    categoryRepository,
    brandRepository,
    productRepository,

    // Providers
    tokenProvider,

    // Configuración
    config,
  };

  console.log(
    "📦 Inyector de Dependencias: Componentes instanciados correctamente."
  );
  return container;
}

module.exports = dependencyInjectorLoader;
