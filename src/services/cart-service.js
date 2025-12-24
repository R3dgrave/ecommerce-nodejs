const { NotFoundError, BusinessLogicError } = require("../utils/errors");

class CartService {
  constructor(cartRepository, productRepository) {
    this.cartRepository = cartRepository;
    this.productRepository = productRepository;
  }

  async getCartByUserId(userId) {
    let cart = await this.cartRepository.findByUserId(userId, {
      populateProducts: true,
    });

    if (!cart) {
      cart = await this.cartRepository.save({
        userId,
        items: [],
        totalAmount: 0,
      });
    }

    return cart;
  }

  async addItemToCart(userId, productId, quantity = 1) {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new NotFoundError("Producto no encontrado");

    if (product.stock < quantity) {
      throw new BusinessLogicError("Stock insuficiente para añadir al carrito");
    }

    let cart = await this.cartRepository.findByUserId(userId, {
      populateProducts: false,
    });

    const items = cart ? [...cart.items] : [];

    const existingItemIndex = items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (existingItemIndex > -1) {
      const newQuantity = items[existingItemIndex].quantity + quantity;
      if (product.stock < newQuantity) {
        throw new BusinessLogicError("Stock total disponible excedido");
      }

      items[existingItemIndex].quantity = newQuantity;
      items[existingItemIndex].price = product.price;
    } else {
      items.push({ productId, quantity, price: product.price });
    }

    return await this.cartRepository.updateByUserId(userId, { items });
  }

  async removeItem(userId, productId) {
    const cart = await this.cartRepository.findByUserId(userId, { populateProducts: false });
    if (!cart) throw new NotFoundError("Carrito no encontrado");

    const items = cart.items.filter((item) => {
      const currentId = item.productId._id || item.productId.id || item.productId;
      return currentId.toString() !== productId.toString();
    });

    return await this.cartRepository.updateByUserId(userId, { items });
  }

  async clearCart(userId) {
    return await this.cartRepository.updateByUserId(userId, { items: [] });
  }
}

module.exports = CartService;