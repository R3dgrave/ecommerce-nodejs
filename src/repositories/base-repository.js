/**
 * Error personalizado para conflicto de clave única (ej. código 11000 de Mongo)
 */
class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.status = 409;
  }
}

/**
 * Repositorio base que implementa operaciones CRUD y paginación genéricas.
 * Encapsula TODA la interacción directa con Mongoose.
 */
class BaseRepository {
  constructor(Model) {
    this.Model = Model;
  }

  _toPlainObject(doc) {
    if (!doc) return null;
    return typeof doc.toObject === 'function' ? doc.toObject() : doc;
  }

  _toPlainObjectArray(docs) {
    return docs.map(this._toPlainObject);
  }

  // --- Operaciones CRUD Básicas ---
  async find() {
    return this.findBy({});
  }

  async findBy(filter) {
    const documents = await this.Model.find(filter).exec();
    return this._toPlainObjectArray(documents);
  }

  async findById(id) {
    const document = await this.Model.findById(id).exec();
    return this._toPlainObject(document);
  }

  async count(filter) {
    return this.Model.countDocuments(filter);
  }

  async save(data) {
    try {
      const document = new this.Model(data);
      await document.save();
      return this._toPlainObject(document);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictError("El recurso con esa clave única ya existe.");
      }
      throw error;
    }
  }

  async update(id, data) {
    try {
      const result = await this.Model.updateOne({ _id: id }, data).exec();

      if (result.matchedCount === 0) {
        const notFoundError = new Error("Documento no encontrado para actualizar.");
        notFoundError.status = 404;
        throw notFoundError;
      }

      return result;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictError("El recurso con esa clave única ya existe.");
      }
      throw error;
    }
  }

  async delete(id) {
    const result = await this.Model.findByIdAndDelete(id).exec();
    return result;
  }

  // --- Operación de Paginación ---

  async findWithPagination(filter = {}, options = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [documents, totalCount] = await Promise.all([
      this.Model.find(filter)
        .skip(skip)
        .limit(limit)
        .exec(),
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
}

module.exports = { BaseRepository, ConflictError };