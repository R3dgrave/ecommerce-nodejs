const sinon = require("sinon");
const bcrypt = require("bcrypt");
const AuthServiceClass = require("../../../src/services/auth-service");
const { NotFoundError, ConflictError } = require("../../../src/utils/errors");

describe("AuthService", () => {
  let authService;
  let mockUserRepository;
  let mockTokenProvider;

  const testUser = {
    id: "12345",
    name: "Test User",
    email: "test@example.com",
    password: "hashedpassword",
    isAdmin: false,
    phone: "123456",
    shippingAddresses: []
  };

  beforeEach(() => {
    sinon.restore();

    mockUserRepository = {
      findByEmail: sinon.stub(),
      save: sinon.stub(),
      findById: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub(),
    };

    mockTokenProvider = {
      generate: sinon.stub(),
      verifyToken: sinon.stub(),
    };

    authService = new AuthServiceClass(mockUserRepository, mockTokenProvider);
    
    sinon.stub(bcrypt, "hash").resolves("new-hashed-password");
  });

  describe("registerUser", () => {
    const userData = {
      name: "New User",
      email: "new@test.com",
      password: "plainpassword",
    };

    it("debería hashear la contraseña y retornar el usuario con id (sin password)", async () => {
      mockUserRepository.save.resolves(testUser);

      const result = await authService.registerUser(userData);

      expect(bcrypt.hash.calledOnce).toBe(true);
      expect(mockUserRepository.save.calledOnce).toBe(true);
      expect(result.id).toBe(testUser.id);
      expect(result).not.toHaveProperty("password");
    });

    it("debería lanzar ConflictError (409) si el repo lanza error de status 409", async () => {
      const repoError = new Error("Duplicate");
      repoError.status = 409;
      mockUserRepository.save.rejects(repoError);

      await expect(authService.registerUser(userData))
        .rejects.toThrow(ConflictError);
    });
  });

  describe("loginUser", () => {
    const credentials = { email: "test@example.com", password: "correctPassword" };

    it("debería retornar token y datos de usuario si las credenciales coinciden", async () => {
      mockUserRepository.findByEmail.resolves(testUser);
      sinon.stub(bcrypt, "compare").resolves(true);
      mockTokenProvider.generate.returns("fake.jwt.token");

      const result = await authService.loginUser(credentials);

      expect(result.token).toBe("fake.jwt.token");
      expect(result.user.id).toBe(testUser.id);
    });

    it("debería retornar null si el usuario no existe", async () => {
      mockUserRepository.findByEmail.resolves(null);
      const result = await authService.loginUser(credentials);
      expect(result).toBeNull();
    });
  });

  describe("getUserById", () => {
    it("debería retornar el usuario sin el password si existe", async () => {
      mockUserRepository.findById.resolves(testUser);

      const result = await authService.getUserById("12345");

      expect(result.password).toBeUndefined();
      expect(result.id).toBe(testUser.id);
    });

    it("debería lanzar NotFoundError si el usuario no existe", async () => {
      mockUserRepository.findById.resolves(null);
      
      await expect(authService.getUserById("999"))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe("updateUser", () => {
    it("debería limpiar isAdmin y hashear password si se envía", async () => {
      const updateData = { password: "new_password", isAdmin: true };
      const updatedMock = { ...testUser, name: "Updated" };
      mockUserRepository.update.resolves(updatedMock);

      await authService.updateUser("12345", updateData);

      const callArgs = mockUserRepository.update.firstCall.args[1];
      expect(callArgs.password).toBe("new-hashed-password");
      expect(callArgs.isAdmin).toBeUndefined();
    });

    it("debería lanzar NotFoundError si el repo lanza status 404", async () => {
      const repoError = new Error("Not found");
      repoError.status = 404;
      mockUserRepository.update.rejects(repoError);

      await expect(authService.updateUser("123", { name: "test" }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteUser", () => {
    it("debería retornar el resultado del borrado si es exitoso", async () => {
      mockUserRepository.delete.resolves({ id: "12345" });
      const result = await authService.deleteUser("12345");
      expect(result).toBeDefined();
    });

    it("debería lanzar NotFoundError si el repo retorna null", async () => {
      mockUserRepository.delete.resolves(null);
      await expect(authService.deleteUser("999"))
        .rejects.toThrow(NotFoundError);
    });
  });
});