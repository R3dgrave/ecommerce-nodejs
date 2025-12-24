const { BaseRepository } = require("./base-repository");

class WishlistRepository extends BaseRepository {
  constructor(WishlistModel) {
    super(WishlistModel);
  }
  async findByUserId(userId, options = {}) {
    let query = this.Model.findOne({ userId });

    if (options.populate) {
      query = query.populate("products");
    }

    const document = await query.exec();
    return this._toPlainObject(document);
  }

  async updateByUserId(userId, data) {
    const updatedDocument = await this.Model.findOneAndUpdate(
      { userId },
      data,
      { new: true, runValidators: true, upsert: true }
    )
      .populate("products")
      .exec();

    return this._toPlainObject(updatedDocument);
  }
}

module.exports = WishlistRepository;
