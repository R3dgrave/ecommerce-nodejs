const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del producto es requerido.'],
      trim: true,
      unique: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'La descripción corta es requerida.'],
      trim: true,
      maxlength: [200, 'La descripción corta no puede exceder los 200 caracteres.']
    },
    description: {
      type: String,
      required: [true, 'La descripción completa es requerida.']
    },
    price: {
      type: Number,
      required: [true, 'El precio es requerido.'],
      min: [0, 'El precio no puede ser negativo.'],
      default: 0
    },
    discount: {
      type: Number,
      min: [0, 'El descuento no puede ser negativo.'],
      max: [100, 'El descuento no puede ser superior al 100.'],
      default: 0
    },
    images: {
      type: [String],
      default: []
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Categories',
      required: [true, 'La categoría es requerida.']
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brands',
      required: [true, 'La marca es requerida.']
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isNewProduct: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

ProductSchema.index({ name: 1, categoryId: 1 });

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;