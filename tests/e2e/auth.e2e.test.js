const request = require("supertest");
const { app, closeDatabase, cleanDatabase, UserModel } = require("./setup.e2e");
const User = require('../../src/models/user');

describe("E2E Auth Routes (Real DB)", () => {

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  const userData = {
    name: "Test User",
    email: "real-e2e@test.com",
    password: "securepassword123",
  };

  describe("POST /auth/register", () => {
    it("debería persistir el usuario en la DB y no devolver el password", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send(userData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.password).toBeUndefined();

      const userInDb = await User.findOne({ email: userData.email });
      expect(userInDb).not.toBeNull();
      expect(userInDb.password).not.toBe(userData.password);
    });
  });

  describe("POST /auth/login", () => {
    it("debería loguear con éxito un usuario previamente registrado", async () => {
      await request(app).post("/auth/register").send(userData);

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data.user.email).toBeUndefined();
    });

    it("debería fallar con credenciales incorrectas", async () => {
      await request(app).post("/auth/register").send(userData);

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: userData.email,
          password: "wrong-password"
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});