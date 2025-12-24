const { NotFoundError } = require("../utils/errors");

class WishlistService {
  constructor(wishlistRepository, productRepository) {
    this.wishlistRepository = wishlistRepository;
    this.productRepository = productRepository;
  }

  async getWishlist(userId) {
    let wishlist = await this.wishlistRepository.findByUserId(userId, { populate: true });
    if (!wishlist) {
      wishlist = await this.wishlistRepository.save({ userId, products: [] });
    }
    return wishlist;
  }

  async addProduct(userId, productId) {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new NotFoundError("Producto no encontrado");

    return await this.wishlistRepository.updateByUserId(userId, {
      $addToSet: { products: productId }
    });
  }

  async removeProduct(userId, productId) {
    return await this.wishlistRepository.updateByUserId(userId, {
      $pull: { products: productId }
    });
  }
}

module.exports = WishlistService;