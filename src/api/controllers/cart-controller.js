const sendResponse = require('../../utils/response.handler');

const CartControllerFactory = (cartService) => {
  return {
    getCart: async (req, res, next) => {
      try {
        const userId = req.user.id;
        const cart = await cartService.getCartByUserId(userId);
        return sendResponse(res, 200, cart);
      } catch (error) {
        next(error);
      }
    },

    addItem: async (req, res, next) => {
      try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;
        const updatedCart = await cartService.addItemToCart(userId, productId, quantity);
        
        return sendResponse(res, 200, updatedCart, "Producto añadido al carrito");
      } catch (error) {
        next(error);
      }
    },

    removeItem: async (req, res, next) => {
      try {
        const userId = req.user.id;
        const { productId } = req.params;
        const updatedCart = await cartService.removeItem(userId, productId);
        
        return sendResponse(res, 200, updatedCart, "Producto eliminado del carrito");
      } catch (error) {
        next(error);
      }
    },

    clearCart: async (req, res, next) => {
      try {
        const userId = req.user.id;
        await cartService.clearCart(userId);
        return sendResponse(res, 200, null, "Carrito vaciado exitosamente");
      } catch (error) {
        next(error);
      }
    },
  };
};

module.exports = CartControllerFactory;