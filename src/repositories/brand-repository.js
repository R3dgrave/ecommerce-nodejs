const { BaseRepository } = require('./base-repository');

class BrandRepository extends BaseRepository {
  constructor(BrandModel) {
    super(BrandModel);
  }

  async findByCategoryId(categoryId) {
    const filter = categoryId ? { categoryId } : {};
    return this.findBy(filter);
  }

  async countByFilter(filter) {
    return this.count(filter);
  }

  async countByCategoryId(categoryId) {
    const filter = { categoryId: categoryId };
    return this.count(filter);
  }
}

module.exports = BrandRepository;