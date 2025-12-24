const request = require("supertest");
const { app, cleanDatabase, authService } = require("./setup-e2e");

describe("Customer E2E", () => {
  let userToken;

  beforeAll(async () => {
    await cleanDatabase();

    await request(app).post("/auth/register").send({
      name: "Customer Test",
      email: "customer@test.com",
      password: "password123",
      phone: "123456789"
    })

    const loginRes = await request(app).post("/auth/login").send({
      email: "customer@test.com",
      password: "password123",
    });

    userToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe("GET /customer/profile", () => {
    it("debería obtener el perfil del usuario autenticado", async () => {
      const response = await request(app)
        .get("/customer/profile")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe("customer@test.com");
      expect(response.body.data).not.toHaveProperty("password");
    });

    it("debería fallar si no hay token", async () => {
      const response = await request(app).get("/customer/profile");
      expect(response.status).toBe(401);
    });
  });

  describe("PUT /customer/profile", () => {
    it("debería actualizar el nombre y el teléfono", async () => {
      const updateData = { name: "Updated Name", phone: "987654321" };

      const response = await request(app)
        .put("/customer/profile")
        .set("Authorization", `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe("Updated Name");
      expect(response.body.data.phone).toBe("987654321");
    });
  });

  describe("POST & DELETE /customer/address", () => {
    let createdAddressId;

    it("debería agregar una nueva dirección", async () => {
      const newAddress = {
        street: "Calle Test 123",
        city: "Test City",
        zipCode: "28001"
      };

      const response = await request(app)
        .post("/customer/address")
        .set("Authorization", `Bearer ${userToken}`)
        .send(newAddress);

      expect(response.status).toBe(201);
      expect(response.body.data.shippingAddresses.length).toBe(1);

      createdAddressId = response.body.data.shippingAddresses[0].id;
      expect(createdAddressId).toBeDefined();
    });

    it("debería eliminar la dirección agregada", async () => {
      const response = await request(app)
        .delete(`/customer/address/${createdAddressId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.shippingAddresses.length).toBe(0);
    });

    it("debería fallar al eliminar con un ID con formato inválido", async () => {
      const response = await request(app)
        .delete("/customer/address/123-not-valid")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(400);
    });
  });
});