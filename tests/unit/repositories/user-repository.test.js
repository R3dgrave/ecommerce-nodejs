const sinon = require("sinon");
const UserRepository = require("../../../src/repositories/user-repository");
const mongoose = require("mongoose");

describe("UserRepository", () => {
  let userRepository;
  let UserModelMock;
  const MOCK_ID = new mongoose.Types.ObjectId();

  const mockUserDoc = {
    _id: MOCK_ID,
    email: "test@test.com",
    name: "Test User",
    save: sinon.stub(),
    toObject: sinon.stub().returns({ _id: MOCK_ID, email: "test@test.com", name: "Test User" })
  };

  beforeEach(() => {
    sinon.restore();
    
    UserModelMock = sinon.stub().returns(mockUserDoc);
    mockUserDoc.save.resolves(mockUserDoc);
    
    UserModelMock.findOne = sinon.stub().returns({ exec: sinon.stub().resolves(mockUserDoc) });
    UserModelMock.findById = sinon.stub().returns({ exec: sinon.stub().resolves(mockUserDoc) });
    UserModelMock.findByIdAndUpdate = sinon.stub().returns({ exec: sinon.stub().resolves(mockUserDoc) });

    userRepository = new UserRepository(UserModelMock);
  });

  describe("findByEmail", () => {
    it("debería devolver el usuario con 'id' string", async () => {
      const result = await userRepository.findByEmail("test@test.com");
      
      expect(result.id).toBe(MOCK_ID.toString());
      expect(result).not.toHaveProperty("_id");
      expect(UserModelMock.findOne.calledWith({ email: "test@test.com" })).toBe(true);
    });
  });

  describe("save", () => {
    it("debería instanciar, guardar y retornar objeto limpio", async () => {
      const userData = { email: "test@test.com", name: "Test User" };
      const result = await userRepository.save(userData);

      expect(UserModelMock.calledWith(userData)).toBe(true);
      expect(mockUserDoc.save.calledOnce).toBe(true);
      expect(result.id).toBe(MOCK_ID.toString());
    });
  });

  describe("update (Heredado)", () => {
    it("debería transformar el resultado de la actualización", async () => {
      const result = await userRepository.update(MOCK_ID.toString(), { name: "Updated" });
      
      expect(result.id).toBe(MOCK_ID.toString());
      expect(result).not.toHaveProperty("_id");
      expect(UserModelMock.findByIdAndUpdate.calledOnce).toBe(true);
    });
  });
});