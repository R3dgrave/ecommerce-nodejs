const mongoose = require("mongoose");

/**
 * Repositorio base que implementa operaciones CRUD y paginación genéricas.
 * Encapsula TODA la interacción directa con Mongoose.
 */
class BaseRepository {
  constructor(Model) {
    this.Model = Model;
  }

  _isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  _toPlainObject(doc) {
    if (!doc) return null;
    const obj = typeof doc.toObject === 'function' ? doc.toObject({ virtuals: true }) : { ...doc };

    if (obj._id) {
      obj.id = obj._id.toString();
      delete obj._id;
    }

    delete obj.__v;
    return obj;
  }

  _toPlainObjectArray(docs) {
    return docs.map(this._toPlainObject);
  }

  async find() {
    return this.findBy({});
  }

  async findBy(filter) {
    const documents = await this.Model.find(filter).exec();
    return this._toPlainObjectArray(documents);
  }

  async findById(id) {
    if (!this._isValidId(id)) return null;
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
        const conflictError = new Error("Conflict: Unique constraint violated");
        conflictError.status = 409;
        throw conflictError;
      }
      throw error;
    }
  }

  async update(id, data) {
    if (!this._isValidId(id)) {
      const error = new Error("Formato de ID inválido.");
      error.status = 400;
      throw error;
    }

    try {
      const updatedDocument = await this.Model.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
      ).exec();

      if (!updatedDocument) {
        const notFoundError = new Error("Documento no encontrado para actualizar.");
        notFoundError.status = 404;
        throw notFoundError;
      }

      return this._toPlainObject(updatedDocument);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictError("El recurso con esa clave única ya existe.");
      }
      throw error;
    }
  }

  async delete(id) {
    if (!this._isValidId(id)) return null;
    const result = await this.Model.findByIdAndDelete(id).exec();
    return result;
  }

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
      page,
    };
  }
}

module.exports = { BaseRepository };