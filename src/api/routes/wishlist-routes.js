const express = require("express");
const WishlistControllerFactory = require("../controllers/wishlist-controller");
const {
  validateAddToWishlist,
  validateWishlistProductId
} = require("../validators/wishlist-validator");

module.exports = function (wishlistService, verifyToken) {
  const router = express.Router();
  const wishlistController = WishlistControllerFactory(wishlistService);

  router.use(verifyToken);

  router.get("/", wishlistController.getWishlist);

  router.post(
    "/add",
    validateAddToWishlist,
    wishlistController.addToWishlist
  );

  router.delete(
    "/:productId",
    validateWishlistProductId,
    wishlistController.removeFromWishlist
  );

  return router;
};