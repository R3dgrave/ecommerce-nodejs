const { BaseRepository } = require('./base-repository');
const OrderModel = require('../models/order');

class OrderRepository extends BaseRepository {
  constructor(Order = OrderModel) {
    super(Order);
  }

  /**
   * Obtiene las órdenes de un usuario específico con paginación.
   */
  async findByUserId(userId, options = {}) {
    const filter = { userId };
    return await this.findWithPagination(filter, options);
  }

  /**
   * Actualiza el estado de una orden (ej. de pending a paid).
   */
  async updateStatus(orderId, status) {
    return await this.update(orderId, { status });
  }

  /**
   * Para el Dashboard de Admin: obtener ingresos totales.
   */
  async getIncomeStats() {
    return await this.Model.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalSales: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);
  }
}

module.exports = OrderRepository;