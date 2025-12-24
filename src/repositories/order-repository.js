const { BaseRepository } = require('./base-repository');
const OrderModel = require('../models/order');

class OrderRepository extends BaseRepository {
  constructor(Order = OrderModel) {
    super(Order);
  }

  async findByUserId(userId, options = {}) {
    const filter = { userId };
    return await this.findWithPagination(filter, options);
  }

  async updateStatus(orderId, status) {
    return await this.update(orderId, { status });
  }

  async getIncomeStats() {
    const stats = await this.Model.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalSales: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);

    if (stats.length === 0) return { totalSales: 0, count: 0 };

    return {
      totalSales: stats[0].totalSales,
      count: stats[0].count
    };
  }
}

module.exports = OrderRepository;