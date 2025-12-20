class CartService {
  constructor(cartRepository, productRepository) {
    this.cartRepository = cartRepository;
    this.productRepository = productRepository;
  }

  /**
   * Obtiene el carrito del usuario.
   * Si no existe, crea uno vacío automáticamente para facilitar el flujo del frontend.
   */
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

  /**
   * Añade un producto al carrito o actualiza su cantidad si ya existe.
   */
  async addItemToCart(userId, productId, quantity = 1) {
    const product = await this.productRepository.findById(productId);
    if (!product) throw this._createError("Producto no encontrado", 404);
    if (product.stock < quantity)
      throw this._createError("Stock insuficiente", 400);

    let cart = await this.cartRepository.findByUserId(userId, {
      populateProducts: false,
    });

    const items = cart ? [...cart.items] : [];

    const existingItemIndex = items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (existingItemIndex > -1) {
      const newQuantity = items[existingItemIndex].quantity + quantity;
      if (product.stock < newQuantity)
        throw this._createError("Stock total excedido", 400);

      items[existingItemIndex].quantity = newQuantity;
      items[existingItemIndex].price = product.price;
    } else {
      items.push({ productId, quantity, price: product.price });
    }

    return await this.cartRepository.updateByUserId(userId, { items });
  }

  _createError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
  }

  /**
   * Elimina un ítem específico del carrito.
   */
  async removeItem(userId, productId) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) return null;

    const items = cart.items.filter(
      (item) => item.productId.toString() !== productId.toString()
    );

    return await this.cartRepository.updateByUserId(userId, { items });
  }

  /**
   * Vacía el carrito (para usarlo despues de completar una compra).
   */
  async clearCart(userId) {
    return await this.cartRepository.updateByUserId(userId, { items: [] });
  }
}

module.exports = CartService;
