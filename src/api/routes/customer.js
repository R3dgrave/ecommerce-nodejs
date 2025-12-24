const express = require("express");
const CustomerControllerFactory = require("../controllers/customer-controller");
const { validateUpdateProfile } = require("../validators/customer-validator");

module.exports = function (customerService, verifyToken) {
  const router = express.Router();
  const customerController = CustomerControllerFactory(customerService);

  router.get("/profile", verifyToken, customerController.getProfile);
  router.put("/profile", verifyToken, validateUpdateProfile, customerController.updateProfile);

  return router;
};