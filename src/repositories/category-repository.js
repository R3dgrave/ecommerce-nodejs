/**
 * Clase que encapsula todas las operaciones de acceso a datos para las categorías.
 * Patrón Repository.
 */
class CategoryRepository {
  constructor(CategoryModel) {
    this.CategoryModel = CategoryModel;
  }

  async find() {
    const categories = await this.CategoryModel.find().exec();
    return categories.map((c) => c.toObject());
  }

  async findById(id) {
    const category = await this.CategoryModel.findById(id).exec();
    return category ? category.toObject() : null;
  }

  async save(categoryData) {
    const category = new this.CategoryModel(categoryData);
    await category.save();
    return category.toObject();
  }

  async update(id, categoryData) {
    await this.CategoryModel.findOneAndUpdate({ _id: id }, categoryData).exec();
  }

  async delete(id) {
    await this.CategoryModel.findByIdAndDelete(id).exec();
  }
}

module.exports = CategoryRepository;
