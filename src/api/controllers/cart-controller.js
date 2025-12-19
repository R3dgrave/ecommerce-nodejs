// src/controllers/cart-controller.js

/**
 * Factory Function para el controlador de Carrito.
 * @param {CartService} cartService 
 */
const CartControllerFactory = (cartService) => {
  return {
    getCart: async (req, res, next) => {
      try {
        const userId = req.user.id;
        const cart = await cartService.getCartByUserId(userId);
        res.status(200).json({ success: true, result: cart });
      } catch (error) {
        next(error);
      }
    },

    addItem: async (req, res, next) => {
      try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;
        const updatedCart = await cartService.addItemToCart(userId, productId, quantity);
        res.status(200).json({
          success: true,
          message: "Producto añadido al carrito",
          result: updatedCart
        });
      } catch (error) {
        next(error);
      }
    },

    removeItem: async (req, res, next) => {
      try {
        const userId = req.user.id;
        const { productId } = req.params;
        const updatedCart = await cartService.removeItem(userId, productId);
        res.status(200).json({
          success: true,
          message: "Producto eliminado del carrito",
          result: updatedCart
        });
      } catch (error) {
        next(error);
      }
    },

    clearCart: async (req, res, next) => {
      try {
        const userId = req.user.id;
        await cartService.clearCart(userId);
        res.status(200).json({
          success: true,
          message: "Carrito vaciado exitosamente"
        });
      } catch (error) {
        next(error);
      }
    }
  };
};

module.exports = CartControllerFactory;