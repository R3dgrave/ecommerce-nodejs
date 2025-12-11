const request = require("supertest");
const sinon = require("sinon");
const {
  createApp,
  UserRepository,
  TokenProvider,
  AuthServiceClass,
} = require("../../app");

const mockUserRepository = {
  save: sinon.stub(),
  findByEmail: sinon.stub(),
};

const mockTokenProvider = {
  generate: sinon.stub().returns("valid.fake.jwt"),
  verify: sinon.stub(),
};

const app = createApp({
  userRepository: mockUserRepository,
});

const registerData = {
  name: "Test User E2E",
  email: "e2e@test.com",
  password: "securepassword123",
};

const loginCredentials = {
  email: registerData.email,
  password: registerData.password,
};

const createdUser = {
  id: "user-id-123",
  name: registerData.name,
  isAdmin: false,
};

const createdUserWithEmail = {
  _id: "user-id-123",
  name: registerData.name,
  email: registerData.email,
  isAdmin: false,
};

describe("E2E Auth Routes", () => {
  beforeEach(() => {
    sinon.restore();

    mockUserRepository.save.resetHistory();
    mockUserRepository.findByEmail.resetHistory();
    mockTokenProvider.generate.resetHistory();
  });

  describe("POST /auth/register", () => {
    it("debería retornar 201 y el usuario (sin password) si el registro es exitoso", async () => {
      mockUserRepository.save.resolves(createdUserWithEmail);

      const response = await request(app)
        .post("/auth/register")
        .send(registerData);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);

      expect(response.body.data.id).toBe(createdUserWithEmail._id);
      expect(response.body.data.name).toBe(createdUserWithEmail.name);

      expect(response.body.data.password).toBeUndefined();
    });

    it("debería retornar 409 si el email ya existe (Manejo de Error 11000)", async () => {
      const duplicateError = new Error("Duplicate key error");
      duplicateError.code = 11000;
      mockUserRepository.save.rejects(duplicateError);

      const response = await request(app)
        .post("/auth/register")
        .send(registerData);

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("El recurso ya existe");
    });
  });

  describe("POST /auth/login", () => {
    it("debería retornar 200, token y el usuario (sin email) si el login es exitoso", async () => {
      mockUserRepository.findByEmail.resolves(createdUserWithEmail);
      const AuthService = require("../../services/auth-service");
      sinon.stub(AuthService.prototype, "loginUser").resolves({
        token: "valid.fake.jwt",
        user: createdUser,
      });

      const response = await request(app)
        .post("/auth/login")
        .send(loginCredentials);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.token).toBe("valid.fake.jwt");
      expect(response.body.data.user.id).toBe(createdUser.id);
      expect(response.body.data.user.name).toBe(createdUser.name);

      expect(response.body.data.user.email).toBeUndefined();
    });

    it("debería retornar 401 y un mensaje ambiguo si las credenciales son incorrectas", async () => {
      const AuthService = require("../../services/auth-service");
      sinon.stub(AuthService.prototype, "loginUser").resolves(null);

      const response = await request(app)
        .post("/auth/login")
        .send(loginCredentials);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);

      expect(response.body.error).toBe("Correo o contraseña incorrectos.");
    });
  });
});
