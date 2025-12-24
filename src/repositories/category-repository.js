const { BaseRepository } = require('./base-repository');

class CategoryRepository extends BaseRepository {
  constructor(CategoryModel) {
    super(CategoryModel);
  }
}

module.exports = CategoryRepository;