class OrderController {
  constructor(orderService) {
    this.orderService = orderService;
    this.create = this.create.bind(this);
    this.getMyOrders = this.getMyOrders.bind(this);
    this.getById = this.getById.bind(this);
  }

  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const shippingData = req.body.shippingAddress;

      const order = await this.orderService.createOrder(userId, shippingData);

      return res.status(201).json({
        success: true,
        message: "Orden creada exitosamente",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyOrders(req, res, next) {
    try {
      const userId = req.user.id;
      const options = {
        page: req.query.page,
        limit: req.query.limit,
      };

      const orders = await this.orderService.getMyOrders(userId, options);

      return res.status(200).json({
        success: true,
        message: "Órdenes recuperadas",
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const order = await this.orderService.getOrderDetails(id, userId);

      return res.status(200).json({
        success: true,
        message: "Detalles de la orden",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;
