const request = require('supertest');
const mongoose = require('mongoose');
const { app, closeDatabase, userRepository } = require('./setup.e2e');

const Category = require('../../src/models/category');
const Brand = require('../../src/models/brand');
const User = require('../../src/models/user');

let adminToken;
let existingCategoryId;
let newBrandId;

const CATEGORY_NAME_E2E = 'Electronics Brand Test';
const MOCK_ADMIN_USER = {
  email: 'admin-brand-e2e@test.com',
  password: 'passwordSegura123',
  name: 'Admin Brand',
  isAdmin: true,
};

beforeAll(async () => {
  await Brand.deleteMany({});
  await Category.deleteMany({ name: CATEGORY_NAME_E2E });
  await User.deleteMany({ email: MOCK_ADMIN_USER.email });

  await request(app).post('/auth/register').send(MOCK_ADMIN_USER);

  const user = await userRepository.findByEmail(MOCK_ADMIN_USER.email);
  if (user) {
    const userId = user.id || user._id;

    if (userId) {
      await userRepository.update(userId, { isAdmin: true });
    } else {
      throw new Error("❌ Error: Usuario encontrado pero sin ID válido para actualizar.");
    }
  } else {
    throw new Error("❌ Error: Usuario de prueba no encontrado en la BDD.");
  }

  const loginRes = await request(app).post('/auth/login').send({
    email: MOCK_ADMIN_USER.email,
    password: MOCK_ADMIN_USER.password,
  });

  if (loginRes.statusCode !== 200) {
    throw new Error(`❌ Error de Login en beforeAll. Estado: ${loginRes.statusCode}`);
  }

  adminToken = loginRes.body.data.token;

  const categoryRes = await request(app)
    .post('/category')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: CATEGORY_NAME_E2E });

  if (categoryRes.statusCode !== 201) {
    throw new Error(`❌ Error al crear la categoría de prueba. Estado: ${categoryRes.statusCode}. Mensaje: ${JSON.stringify(categoryRes.body)}`);
  }

  existingCategoryId = categoryRes.body.result._id;

  expect(categoryRes.statusCode).toBe(201);
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await Brand.deleteMany({});
    await Category.deleteMany({ name: CATEGORY_NAME_E2E });
    await User.deleteMany({ email: MOCK_ADMIN_USER.email });
  } else {
  }
  await closeDatabase();
});

describe('E2E: /brand routes', () => {
  describe('POST /brand', () => {
    const createBrandData = {
      name: 'sony e2e',
      categoryId: existingCategoryId
    };

    it('debería crear una marca exitosamente (Status 201)', async () => {
      createBrandData.categoryId = existingCategoryId;

      const res = await request(app)
        .post('/brand')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createBrandData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.result.name).toBe('sony e2e');
      expect(res.body.result.categoryId).toBe(existingCategoryId);

      newBrandId = res.body.result._id;
    });

    it('debería fallar con 409 si la marca ya existe', async () => {
      const res = await request(app)
        .post('/brand')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createBrandData);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Ya existe una marca con este nombre/);
    });

    it('debería fallar con 400 si falta el categoryId', async () => {
      const res = await request(app)
        .post('/brand')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Brand Missing Category' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debería fallar con 404 si la categoría proporcionada no existe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/brand')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Brand Invalid Cat', categoryId: nonExistentId });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/no existe/);
    });

    it('debería fallar con 401 si no se proporciona token', async () => {
      const res = await request(app)
        .post('/brand')
        .send(createBrandData);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /brand/categories/:categoryId', () => {
    it('debería obtener las marcas asociadas a la categoría (Status 200)', async () => {
      const res = await request(app)
        .get(`/brand/categories/${existingCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.brands)).toBe(true);
      expect(res.body.brands.some(b => b._id === newBrandId)).toBe(true);
    });

    it('debería devolver una lista vacía si el ID de la categoría no tiene marcas', async () => {
      const otherCategoryRes = await request(app)
        .post('/category')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'other category test e2e' + Date.now() });

      const otherCategoryId = otherCategoryRes.body.result._id;

      const res = await request(app)
        .get(`/brand/categories/${otherCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.brands).toEqual([]);

      await Category.findByIdAndDelete(otherCategoryId);
    });
  });

  describe('GET /brand/:id', () => {
    it('debería obtener la marca por ID (Status 200)', async () => {
      expect(newBrandId).toBeDefined();

      const res = await request(app)
        .get(`/brand/${newBrandId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.brand._id).toBe(newBrandId);
      expect(res.body.brand.name).toBe('sony e2e');
    });

    it('debería fallar con 404 si la marca no existe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .get(`/brand/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Marca no encontrada/);
    });
  });

  describe('GET /brand', () => {
    it('debería obtener la lista de marcas (Status 200)', async () => {
      const res = await request(app)
        .get('/brand/')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      const brandsArray = res.body.brands.data;
      expect(Array.isArray(brandsArray)).toBe(true);
      expect(brandsArray.length).toBeGreaterThan(0);
      expect(brandsArray.some(b => b._id === newBrandId)).toBe(true);
    });
  });

  describe('PUT /brand/:id', () => {
    it('debería actualizar la marca exitosamente (Status 200)', async () => {
      const updateData = { name: 'sony updated' };
      const res = await request(app)
        .put(`/brand/${newBrandId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const checkRes = await request(app)
        .get(`/brand/${newBrandId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(checkRes.body.brand.name).toBe('sony updated');
    });

    it('debería fallar con 404 si el ID no existe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/brand/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/no encontrado para actualizar/i);
    });

    it('debería fallar con 409 si se intenta usar un nombre ya existente', async () => {
      const secondBrandRes = await request(app)
        .post('/brand')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'brand b', categoryId: existingCategoryId });

      if (secondBrandRes.statusCode !== 201) {
        throw new Error(`Fallo al crear la segunda marca: ${JSON.stringify(secondBrandRes.body)}`);
      }

      const secondBrandName = secondBrandRes.body.result.name;

      const res = await request(app)
        .put(`/brand/${newBrandId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: secondBrandName });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Ya existe otra marca con ese nombre/);

      await request(app)
        .delete(`/brand/${secondBrandRes.body.result.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });
  });

  describe('DELETE /brand/:id', () => {
    it('debería eliminar la marca exitosamente (Status 200)', async () => {
      expect(newBrandId).toBeDefined();

      const res = await request(app)
        .delete(`/brand/${newBrandId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('eliminado');

      const checkRes = await request(app)
        .get(`/brand/${newBrandId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(checkRes.statusCode).toBe(404);
    });

    it('debería fallar con 404 si se intenta eliminar una marca que no existe', async () => {
      const res = await request(app)
        .delete(`/brand/${newBrandId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Marca con ID .* no encontrada/);
    });

  });
});