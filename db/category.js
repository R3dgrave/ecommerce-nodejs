const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model("Categories", categorySchema);
module.exports = Category;
