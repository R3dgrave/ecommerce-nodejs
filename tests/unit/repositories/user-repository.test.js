const sinon = require("sinon");
const UserRepository = require("../../../src/repositories/user-repository");

const MOCK_USER_DATA = {
  email: "test@example.com",
  name: "Test User",
  password: "hashedpassword",
};

const MOCK_SAVED_USER_RESULT = {
  ...MOCK_USER_DATA,
  _id: "12345",
};

let UserModelMock;
let userRepository;
let instanceMock;
let findOneStub;

describe("UserRepository", () => {
  beforeEach(() => {
    sinon.restore();

    instanceMock = {
      ...MOCK_SAVED_USER_RESULT,
      save: sinon.stub(),
    };

    instanceMock.save.resolves(instanceMock);
    UserModelMock = sinon.stub().returns(instanceMock);

    const findOneResultMock = {
      exec: sinon.stub(),
    };

    findOneStub = sinon.stub().returns(findOneResultMock);
    UserModelMock.findOne = findOneStub;

    userRepository = new UserRepository(UserModelMock);

    findOneResultMock.exec.resolves(MOCK_SAVED_USER_RESULT);
  });

  describe("findByEmail", () => {
    it("debería llamar a UserModel.findOne con el email correcto", async () => {

      const emailToFind = MOCK_USER_DATA.email;

      const result = await userRepository.findByEmail(emailToFind);

      expect(findOneStub.calledOnce).toBe(true);
      expect(findOneStub.calledWith({ email: emailToFind })).toBe(
        true
      );
      expect(result).toEqual(MOCK_SAVED_USER_RESULT);
    });

    it("debería devolver null si el usuario no es encontrado", async () => {
      UserModelMock.findOne().exec.resolves(null);

      const result = await userRepository.findByEmail("nonexistent@test.com");

      expect(result).toBeNull();
    });
  });

  describe("save", () => {
    it("debería crear una nueva instancia del modelo y llamar a save()", async () => {
      const result = await userRepository.save(MOCK_USER_DATA);

      expect(UserModelMock.calledOnce).toBe(true);
      expect(UserModelMock.firstCall.args[0]).toEqual(MOCK_USER_DATA);
      expect(instanceMock.save.calledOnce).toBe(true);
      expect(result).toMatchObject(MOCK_SAVED_USER_RESULT);
      expect(result.save).toBeDefined();
    });

    it("debería propagar el error si UserModel.save falla", async () => {
      const dbError = new Error("Database connection failed");
      instanceMock.save.rejects(dbError);

      await expect(userRepository.save(MOCK_USER_DATA)).rejects.toThrow(
        dbError
      );
      expect(UserModelMock.calledOnce).toBe(true);
    });
  });
});