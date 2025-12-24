const sinon = require("sinon");
const CustomerService = require("../../../src/services/customer-service");
const { NotFoundError } = require("../../../src/utils/errors");

describe("CustomerService", () => {
  let customerService;
  let userRepositoryMock;

  const MOCK_USER_ID = "64f1a2b3c4d5e6f7a8b9c123";
  const MOCK_USER = {
    id: MOCK_USER_ID,
    name: "John Doe",
    email: "john@test.com",
    password: "hashed_password",
    shippingAddresses: []
  };

  beforeEach(() => {
    userRepositoryMock = {
      findById: sinon.stub(),
      update: sinon.stub()
    };
    customerService = new CustomerService(userRepositoryMock);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("getProfile", () => {
    it("debería retornar el perfil sin el password", async () => {
      userRepositoryMock.findById.resolves(MOCK_USER);

      const result = await customerService.getProfile(MOCK_USER_ID);

      expect(userRepositoryMock.findById.calledWith(MOCK_USER_ID)).toBe(true);
      expect(result).not.toHaveProperty("password");
      expect(result.name).toBe("John Doe");
    });

    it("debería lanzar NotFoundError si el usuario no existe", async () => {
      userRepositoryMock.findById.resolves(null);

      await expect(customerService.getProfile(MOCK_USER_ID))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe("updateProfile", () => {
    it("debería limpiar campos sensibles antes de actualizar", async () => {
      const updateData = {
        name: "New Name",
        isAdmin: true,
        password: "new_password",
        shippingAddresses: ["calle falsa 123"]
      };

      userRepositoryMock.update.resolves({ id: MOCK_USER_ID, name: "New Name" });

      await customerService.updateProfile(MOCK_USER_ID, updateData);

      const callArgs = userRepositoryMock.update.getCall(0).args[1];
      expect(callArgs).not.toHaveProperty("isAdmin");
      expect(callArgs).not.toHaveProperty("password");
      expect(callArgs).not.toHaveProperty("shippingAddresses");
      expect(callArgs.name).toBe("New Name");
    });
  });

  describe("addAddress", () => {
    it("debería llamar al repositorio con el operador $push", async () => {
      const newAddress = { street: "Main St", city: "NY", zipCode: "10001" };
      userRepositoryMock.update.resolves({ id: MOCK_USER_ID, shippingAddresses: [newAddress] });

      await customerService.addAddress(MOCK_USER_ID, newAddress);

      expect(userRepositoryMock.update.calledWith(MOCK_USER_ID, {
        $push: { shippingAddresses: newAddress }
      })).toBe(true);
    });
  });

  describe("removeAddress", () => {
    it("debería llamar al repositorio con el operador $pull y el _id", async () => {
      const addressId = "address_123";
      userRepositoryMock.update.resolves({ id: MOCK_USER_ID, shippingAddresses: [] });

      await customerService.removeAddress(MOCK_USER_ID, addressId);

      expect(userRepositoryMock.update.calledWith(MOCK_USER_ID, {
        $pull: { shippingAddresses: { _id: addressId } }
      })).toBe(true);
    });
  });
});