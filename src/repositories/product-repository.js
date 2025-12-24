const { BaseRepository } = require("./base-repository");
const ProductModel = require("../models/product");

class ProductRepository extends BaseRepository {
  constructor(Product = ProductModel) {
    super(Product);
  }

  _applyPopulate(query, populateOptions = {}) {
    if (populateOptions.populateBrand) {
      query = query.populate("brandId", "name categoryId");
    }
    if (populateOptions.populateCategory) {
      query = query.populate("categoryId", "name");
    }

    if (Object.keys(populateOptions).length === 0) {
      query = query.populate("categoryId brandId");
    }
    return query;
  }

  async findById(id, populateOptions = {}) {
    if (!this._isValidId(id)) return null;

    let query = this.Model.findById(id);
    query = this._applyPopulate(query, populateOptions);

    const document = await query.exec();
    return this._toPlainObject(document);
  }

  async findBy(filter, populateOptions = {}) {
    let query = this.Model.find(filter);
    query = this._applyPopulate(query, populateOptions);

    const documents = await query.exec();
    return this._toPlainObjectArray(documents);
  }

  async findByCategoryId(categoryId, populateOptions = {}) {
    const filter = { categoryId };
    return this.findBy(filter, populateOptions);
  }

  async findByBrandId(brandId, populateOptions = {}) {
    const filter = { brandId };
    return this.findBy(filter, populateOptions);
  }

  async countByBrandId(brandId) {
    const filter = { brandId };
    return this.count(filter);
  }

  async countByCategoryId(categoryId) {
    const filter = { categoryId };
    return this.count(filter);
  }

  async findWithPagination(filter = {}, options = {}, populateOptions = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const skip = (page - 1) * limit;

    let query = this.Model.find(filter).skip(skip).limit(limit);

    query = this._applyPopulate(query, populateOptions || {});

    const [documents, totalCount] = await Promise.all([
      query.exec(),
      this.count(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: this._toPlainObjectArray(documents),
      totalCount,
      totalPages,
      currentPage: page,
    };
  }

  async updateStock(productId, quantity) {
    const updated = await this.Model.findByIdAndUpdate(
      productId,
      { $inc: { stock: quantity } },
      { new: true }
    ).exec();

    return this._toPlainObject(updated);
  }
}

module.exports = ProductRepository;
