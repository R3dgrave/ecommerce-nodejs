class ProductRepository {
  constructor(ProductModel) {
    this.ProductModel = ProductModel;
  }
  async countByCategoryId(id) {
    return 0;
  }
  async countByBrandId(id) {
    return 0;
  }
}

module.exports = ProductRepository;
