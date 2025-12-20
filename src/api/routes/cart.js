// src/api/routes/cart.js
const express = require("express");
const CartControllerFactory = require("../controllers/cart-controller");
const { validateAddItem, validateRemoveItem } = require("../validators/cart-validator");

module.exports = function (cartService, verifyToken) {
  const router = express.Router();
  
  const cartController = CartControllerFactory(cartService);

  router.get("/", verifyToken, cartController.getCart);
  router.post("/add", verifyToken, validateAddItem, cartController.addItem);
  router.delete("/remove/:productId", verifyToken, validateRemoveItem, cartController.removeItem);
  router.delete("/clear", verifyToken, cartController.clearCart);

  return router;
};