const sinon = require("sinon");
const bcrypt = require("bcrypt");
const AuthServiceClass = require("../../../src/services/auth-service");
const { ConflictError } = require("../../../src/repositories/base-repository");

const mockUserRepository = {
  findByEmail: sinon.stub(),
  save: sinon.stub(),
};

const mockTokenProvider = {
  generate: sinon.stub(),
  verify: sinon.stub(),
};

const testUser = {
  _id: "12345",
  name: "Test User",
  email: "test@example.com",
  password: "hashedpassword",
  isAdmin: false,
};

const authService = new AuthServiceClass(mockUserRepository, mockTokenProvider);

describe("AuthService", () => {
  beforeEach(() => {
    sinon.restore();

    sinon.stub(bcrypt, "hash").resolves("new-hashed-password");

    mockUserRepository.save.resolves(testUser);

    mockTokenProvider.generate.resetHistory();
    mockUserRepository.findByEmail.resetHistory();
    mockUserRepository.save.resetHistory();
  });

  describe("registerUser", () => {
    const userData = {
      name: "New User",
      email: "new@test.com",
      password: "plainpassword",
    };

    it("debería hashear la contraseña y llamar al repositorio.save()", async () => {
      await authService.registerUser(userData);

      expect(bcrypt.hash.calledOnce).toBe(true);
      expect(mockUserRepository.save.calledOnce).toBe(true);

      const savedData = mockUserRepository.save.firstCall.args[0];
      expect(savedData.password).toBe("new-hashed-password");
      expect(savedData.email).toBe(userData.email);
    });

    it("debería propagar el error si UserRepository.save falla", async () => {
      const dbError = new Error("DB connection failed");

      mockUserRepository.save.rejects(dbError);

      await expect(authService.registerUser(userData)).rejects.toThrow(dbError);
    });

    it("debería lanzar 409 si el email ya existe (ConflictError)", async () => {
      const conflictError = new ConflictError("Ya existe");

      mockUserRepository.save.rejects(conflictError);

      await expect(authService.registerUser(userData)).rejects.toHaveProperty('status', 409);
    });
  });

  describe("loginUser", () => {
    const credentials = {
      email: testUser.email,
      password: "correctPassword",
    };

    it("debería retornar el token si las credenciales son correctas", async () => {
      mockUserRepository.findByEmail.resolves(testUser);
      sinon.stub(bcrypt, "compare").resolves(true);
      mockTokenProvider.generate.returns("fake.jwt.token");

      const result = await authService.loginUser(credentials);

      expect(bcrypt.compare.calledOnce).toBe(true);
      expect(mockTokenProvider.generate.calledOnce).toBe(true);

      expect(result.token).toBe("fake.jwt.token");
      expect(result.user).toEqual({
        id: testUser._id,
        name: testUser.name,
        isAdmin: testUser.isAdmin,
      });
    });

    it("debería retornar null si el usuario no existe", async () => {
      mockUserRepository.findByEmail.resolves(null);

      const compareSpy = sinon.spy(bcrypt, "compare");
      const result = await authService.loginUser(credentials);

      expect(result).toBeNull();
      expect(compareSpy.called).toBe(false);

      compareSpy.restore();
    });

    it("debería retornar null si la contraseña es incorrecta", async () => {
      mockUserRepository.findByEmail.resolves(testUser);
      sinon.stub(bcrypt, "compare").resolves(false);

      const result = await authService.loginUser(credentials);

      expect(result).toBeNull();
      expect(bcrypt.compare.calledOnce).toBe(true);
      expect(mockTokenProvider.generate.called).toBe(false);
    });
  });
});
