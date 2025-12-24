const { NotFoundError, BusinessLogicError, CustomError } = require("../utils/errors");

class OrderService {
  constructor(orderRepository, cartRepository, productRepository, userRepository) {
    this.orderRepository = orderRepository;
    this.cartRepository = cartRepository;
    this.productRepository = productRepository;
    this.userRepository = userRepository;
  }

  async createOrder(userId, shippingData) {
    const cart = await this.cartRepository.findByUserId(userId, { populateProducts: true });

    if (!cart || cart.items.length === 0) {
      throw new BusinessLogicError("El carrito está vacío.");
    }

    let finalShippingAddress = shippingData;

    if (!finalShippingAddress || Object.keys(finalShippingAddress).length === 0) {
      const user = await this.userRepository.findById(userId);
      const defaultAddress = user.shippingAddresses.find(addr => addr.isDefault);

      if (!defaultAddress) {
        throw new BusinessLogicError("Debe proporcionar una dirección o tener una por defecto en su perfil.");
      }

      finalShippingAddress = {
        street: defaultAddress.street,
        city: defaultAddress.city,
        state: defaultAddress.state,
        zipCode: defaultAddress.zipCode,
        country: "Chile"
      };
    }

    for (const item of cart.items) {
      if (item.productId.stock < item.quantity) {
        throw new BusinessLogicError(`Stock insuficiente para: ${item.productId.name}`);
      }
    }

    const orderItems = cart.items.map(item => ({
      productId: item.productId.id,
      name: item.productId.name,
      price: item.productId.price,
      quantity: item.quantity
    }));

    const orderData = {
      userId,
      items: orderItems,
      totalAmount: cart.totalAmount,
      shippingAddress: shippingData,
      status: 'pending'
    };

    const newOrder = await this.orderRepository.save(orderData);

    const stockUpdates = cart.items.map(item =>
      this.productRepository.updateStock(item.productId.id, -item.quantity)
    );
    await Promise.all(stockUpdates);

    await this.cartRepository.updateByUserId(userId, { items: [], totalAmount: 0 });

    return newOrder;
  }

  async getMyOrders(userId, options) {
    return await this.orderRepository.findByUserId(userId, options);
  }

  async getOrderDetails(orderId, userId) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("Orden no encontrada.");

    if (order.userId.toString() !== userId.toString()) {
      throw new CustomError("No tienes permiso para ver esta orden", 403);
    }

    return order;
  }

  async cancelOrder(orderId, userId) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("Orden no encontrada");

    if (order.userId.toString() !== userId.toString()) {
      throw new CustomError("No tienes permiso para cancelar esta orden", 403);
    }

    if (order.status !== 'pending') {
      throw new BusinessLogicError(`No se puede cancelar una orden en estado: ${order.status}. Contacte a soporte para un reembolso.`);
    }

    const updatedOrder = await this.orderRepository.update(orderId, { 
      status: 'cancelled',
      $push: { statusHistory: { status: 'cancelled', comment: 'Cancelada por el usuario.' } }
    });

    const restockUpdates = order.items.map(item =>
      this.productRepository.updateStock(item.productId, item.quantity)
    );

    await Promise.all(restockUpdates);

    return updatedOrder;
  }
}

module.exports = OrderService;