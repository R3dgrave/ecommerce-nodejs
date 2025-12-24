const request = require("supertest");
const { app, closeDatabase, cleanDatabase, UserModel } = require("./setup.e2e");

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
    phone: "123456789",
    shippingAddresses: {
      street: "Avenida Siempreviva 742",
      city: "Santiago",
      state: "Santiago",
      zipCode: "123456",
      isDefault: false,
    },
    isAdmin: true,
  };

  describe("POST /auth/register", () => {
    it("debería persistir el usuario y retornar 'id' en lugar de '_id'", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send(userData);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data._id).toBeUndefined();
      
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.password).toBeUndefined();

      const userInDb = await UserModel.findOne({ email: userData.email });
      expect(userInDb).not.toBeNull();
    });
  });

  describe("POST /auth/login", () => {
    it("debería loguear con éxito y devolver estructura estandarizada", async () => {
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
      expect(response.body.data.user.password).toBeUndefined();
    });

    it("debería usar el Error Handler centralizado para credenciales inválidas", async () => {
      await request(app).post("/auth/register").send(userData);

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: userData.email,
          password: "wrong-password"
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/incorrectos/i);
    });
  });

  describe("Acciones Protegidas", () => {
    let userToken;
    let userId;

    beforeEach(async () => {
      const regRes = await request(app).post("/auth/register").send(userData);
      const loginRes = await request(app).post("/auth/login").send({
        email: userData.email,
        password: userData.password
      });
      userToken = loginRes.body.data.token;
      userId = loginRes.body.data.user.id;
    });

    it("GET /auth/user/:id - debería obtener perfil usando ID estandarizado", async () => {
      const response = await request(app)
        .get(`/auth/user/${userId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.name).toBe(userData.name);
    });

    it("PUT /auth/user/:id - debería actualizar datos y validar el cambio en DB", async () => {
      const newName = "Updated Name";
      const response = await request(app)
        .put(`/auth/user/${userId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: newName });

      expect(response.statusCode).toBe(200);
      
      const updatedUser = await UserModel.findById(userId);
      expect(updatedUser.name).toBe(newName);
    });

    it("DELETE /auth/user/:id - debería eliminar físicamente al usuario", async () => {
      const response = await request(app)
        .delete(`/auth/user/${userId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.statusCode).toBe(200);

      const userInDb = await UserModel.findById(userId);
      expect(userInDb).toBeNull();
    });
  });
});