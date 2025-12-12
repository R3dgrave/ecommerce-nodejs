/**
 * Clase que encapsula todas las operaciones de acceso a datos para las marcas.
 * Patrón Repository.
 */
class BrandRepository {
  constructor(BrandModel) {
    this.BrandModel = BrandModel;
  }

  async find() {
    const brands = await this.BrandModel.find().exec();
    return brands.map((x) => x.toObject());
  }

  async findById(id) {
    const brand = await this.BrandModel.findById(id).exec();
    return brand ? brand.toObject() : null;
  }

  async findByCategoryId(categoryId) {
    const filter = categoryId ? { categoryId } : {};
    const brands = await this.BrandModel.find(filter).exec();
    return brands.map((x) => x.toObject());
  }

  async save(brandData) {
    const brand = new this.BrandModel(brandData);
    await brand.save();
    return brand.toObject();
  }

  async update(id, brandData) {
    await this.BrandModel.findByIdAndUpdate(id, brandData).exec();
  }

  async delete(id) {
    await this.BrandModel.findByIdAndDelete(id).exec();
  }
}

module.exports = BrandRepository;
