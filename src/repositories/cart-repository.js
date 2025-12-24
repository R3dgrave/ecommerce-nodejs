const { BaseRepository } = require("./base-repository");
const CartModel = require("../models/cart");

class CartRepository extends BaseRepository {
  constructor(Cart = CartModel) {
    super(Cart);
  }

  _applyPopulate(query, populateOptions = {}) {
    if (populateOptions.populateProducts) {
      query = query.populate({
        path: "items.productId",
        select: "name price images stock",
      });
    }

    if (populateOptions.populateUser) {
      query = query.populate("userId", "name email");
    }

    if (Object.keys(populateOptions).length === 0) {
      query = query.populate("items.productId");
    }

    return query;
  }

  async findByUserId(userId, populateOptions = {}) {
    let query = this.Model.findOne({ userId });
    query = this._applyPopulate(query, populateOptions);
    const cart = await query.exec();
    return this._toPlainObject(cart)
  }

  async updateByUserId(userId, data) {
    let cart = await this.Model.findOne({ userId });

    if (!cart) {
      cart = new this.Model({ userId, ...data });
    } else {
      Object.assign(cart, data);
    }
    await cart.save();
    return this.findByUserId(userId, { populateProducts: true });
  }

  async save(data) {
    return await this.Model.create(data);
  }

  async findById(id, populateOptions = {}) {
    let query = this.Model.findById(id);
    query = this._applyPopulate(query, populateOptions);

    const document = await query.exec();
    return this._toPlainObject(document);
  }

  async findWithPagination(filter = {}, options = {}, populateOptions = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const skip = (page - 1) * limit;

    let query = this.Model.find(filter).skip(skip).limit(limit);
    query = this._applyPopulate(query, populateOptions);

    const [documents, totalCount] = await Promise.all([
      query.exec(),
      this.count(filter),
    ]);

    return {
      data: this._toPlainObjectArray(documents),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  }
}

module.exports = CartRepository;
