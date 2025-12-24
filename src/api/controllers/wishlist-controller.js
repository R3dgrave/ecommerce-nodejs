const sendResponse = require('../../utils/response.handler');

const WishlistController = (wishlistService) => {
  const getWishlist = async (req, res, next) => {
    try {
      const result = await wishlistService.getWishlist(req.user.id);
      return sendResponse(res, 200, result);
    } catch (error) {
      next(error);
    }
  };

  const addToWishlist = async (req, res, next) => {
    try {
      const { productId } = req.body;
      const result = await wishlistService.addProduct(req.user.id, productId);
      return sendResponse(res, 200, result, "Producto añadido a la lista de deseos");
    } catch (error) {
      next(error);
    }
  };

  const removeFromWishlist = async (req, res, next) => {
    try {
      const { productId } = req.params;
      const result = await wishlistService.removeProduct(req.user.id, productId);
      return sendResponse(res, 200, result, "Producto eliminado de la lista de deseos");
    } catch (error) {
      next(error);
    }
  };

  return { getWishlist, addToWishlist, removeFromWishlist };
};

module.exports = WishlistController;