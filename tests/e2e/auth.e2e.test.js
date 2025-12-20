const request = require("supertest");
const { app, closeDatabase, cleanDatabase } = require("./setup.e2e");
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

  /**
   * FLUJO DE REGISTRO Y LOGIN (PÚBLICO)
   */
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
      // Verificamos que se haya guardado hasheado
      expect(userInDb.password).not.toBe(userData.password);
    });
  });

  describe("POST /auth/login", () => {
    it("debería loguear con éxito y devolver un token", async () => {
      await request(app).post("/auth/register").send(userData);

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data.user).toHaveProperty("id");
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

  /**
   * FLUJO DE USUARIO (PRIVADO - REQUIERE TOKEN)
   */
  describe("Acciones de Usuario Protegidas", () => {
    let userToken;
    let userId;

    beforeEach(async () => {
      await request(app).post("/auth/register").send(userData);
      const loginRes = await request(app).post("/auth/login").send({
        email: userData.email,
        password: userData.password
      });
      userToken = loginRes.body.data.token;
      userId = loginRes.body.data.user.id;
    });

    describe("GET /auth/user/:id", () => {
      it("debería obtener los datos del usuario logueado", async () => {
        const response = await request(app)
          .get(`/auth/user/${userId}`)
          .set("Authorization", `Bearer ${userToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.name).toBe(userData.name);
        expect(response.body.data.password).toBeUndefined();
      });

      it("debería fallar si no se proporciona token", async () => {
        const response = await request(app).get(`/auth/user/${userId}`);
        expect(response.statusCode).toBe(401);
      });
    });

    describe("PUT /auth/user/:id", () => {
      it("debería actualizar el nombre del usuario y persistir en DB", async () => {
        const newName = "Updated Name";
        const response = await request(app)
          .put(`/auth/user/${userId}`)
          .set("Authorization", `Bearer ${userToken}`)
          .send({ name: newName });

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toMatch(/actualizado/i);

        const updatedUser = await User.findById(userId);
        expect(updatedUser.name).toBe(newName);
      });

      it("debería permitir cambiar el password y seguir logueando exitosamente", async () => {
        const newPassword = "new-secure-password";
        
        await request(app)
          .put(`/auth/user/${userId}`)
          .set("Authorization", `Bearer ${userToken}`)
          .send({ password: newPassword });

        const loginRes = await request(app)
          .post("/auth/login")
          .send({
            email: userData.email,
            password: newPassword
          });

        expect(loginRes.statusCode).toBe(200);
      });
    });

    describe("DELETE /auth/user/:id", () => {
      it("debería eliminar al usuario de la base de datos", async () => {
        const response = await request(app)
          .delete(`/auth/user/${userId}`)
          .set("Authorization", `Bearer ${userToken}`);

        expect(response.statusCode).toBe(200);
        
        const userInDb = await User.findById(userId);
        expect(userInDb).toBeNull();
      });
    });
  });
});