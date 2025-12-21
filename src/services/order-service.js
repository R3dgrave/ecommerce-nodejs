const { CustomError } = require("../utils/errors");

class OrderService {
  constructor(orderRepository, cartRepository, productRepository) {
    this.orderRepository = orderRepository;
    this.cartRepository = cartRepository;
    this.productRepository = productRepository;
  }

  async createOrder(userId, shippingData) {
    // 1. Obtener el carrito con productos poblados
    const cart = await this.cartRepository.findByUserId(userId, { populateProducts: true });

    if (!cart || cart.items.length === 0) {
      throw new CustomError("El carrito está vacío", 400);
    }

    // 2. Validar stock de todos los productos antes de hacer nada
    for (const item of cart.items) {
      if (item.productId.stock < item.quantity) {
        throw new CustomError(
          `Stock insuficiente para el producto: ${item.productId.name}`,
          400
        );
      }
    }

    // 3. Preparar los items de la orden (congelando nombre y precio)
    const orderItems = cart.items.map(item => ({
      productId: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      quantity: item.quantity
    }));

    // 4. Crear la orden en el repositorio
    const orderData = {
      userId,
      items: orderItems,
      totalAmount: cart.totalAmount,
      shippingAddress: shippingData,
      status: 'pending'
    };

    const newOrder = await this.orderRepository.save(orderData);

    // 5. Actualizar Stock (Restar las cantidades compradas)
    const stockUpdates = cart.items.map(item =>
      this.productRepository.update(item.productId._id, {
        $inc: { stock: -item.quantity }
      })
    );
    await Promise.all(stockUpdates);

    // 6. Vaciar el carrito del usuario
    await this.cartRepository.updateByUserId(userId, { items: [], totalAmount: 0 });

    return newOrder;
  }

  async getMyOrders(userId, options) {
    return await this.orderRepository.findByUserId(userId, options);
  }

  async getOrderDetails(orderId, userId) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) throw new CustomError("Orden no encontrada", 404);

    // Seguridad: verificar que la orden pertenece al usuario
    if (order.userId.toString() !== userId.toString()) {
      const conflictError = new Error("No tienes permiso para ver esta orden");
      conflictError.status = 403;
      throw conflictError;
    }

    return order;
  }
}

module.exports = OrderService;