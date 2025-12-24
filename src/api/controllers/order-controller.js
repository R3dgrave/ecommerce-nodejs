const sendResponse = require('../../utils/response.handler');
const { NotFoundError } = require('../../utils/errors');

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

      return sendResponse(res, 201, order, "Orden creada exitosamente");
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
      return sendResponse(res, 200, orders, "Órdenes recuperadas");
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const order = await this.orderService.getOrderDetails(id, userId);
      if (!order) throw new NotFoundError("Orden no encontrada");

      return sendResponse(res, 200, order, "Detalles de la orden");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;