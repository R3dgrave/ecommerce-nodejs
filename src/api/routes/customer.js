const express = require("express");
const CustomerControllerFactory = require("../controllers/customer-controller");
const { validateUpdateProfile, validateAddress, validateAddressId } = require("../validators/customer-validator");

module.exports = function (customerService, verifyToken) {
  const router = express.Router();
  const customerController = CustomerControllerFactory(customerService);

  router.get("/profile", verifyToken, customerController.getProfile);
  router.put("/profile", verifyToken, validateUpdateProfile, customerController.updateProfile);
  router.post("/address", verifyToken, validateAddress, customerController.addAddress);
  router.delete("/address/:addressId", verifyToken, validateAddressId, customerController.removeAddress);

  return router;
};