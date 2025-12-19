const request = require('supertest');
const mongoose = require('mongoose');
const { app, closeDatabase, cleanDatabase } = require('./setup.e2e');

const Category = require('../../src/models/category');
const Brand = require('../../src/models/brand');
const User = require('../../src/models/user');

let adminToken;
let existingCategoryId;
let newBrandId;

const CATEGORY_NAME_E2E = 'Brand Test Category Unique';
const MOCK_ADMIN_USER = {
  email: 'admin-brand-e2e@test.com',
  password: 'passwordSegura123',
  name: 'Admin Brand',
  isAdmin: true,
};

beforeAll(async () => {
  await cleanDatabase();

  await request(app).post('/auth/register').send(MOCK_ADMIN_USER);

  const user = await User.findOne({ email: MOCK_ADMIN_USER.email });
  if (user) {
    user.isAdmin = true;
    await user.save();
  }

  const loginRes = await request(app).post('/auth/login').send({
    email: MOCK_ADMIN_USER.email,
    password: MOCK_ADMIN_USER.password,
  });

  adminToken = loginRes.body.data.token;

  const categoryRes = await request(app)
    .post('/category')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: CATEGORY_NAME_E2E });

  existingCategoryId = categoryRes.body.result._id || categoryRes.body.result.id;
});

afterAll(async () => {
  await closeDatabase();
});

describe('E2E: /brand routes', () => {

  describe('POST /brand', () => {
    it('debería crear una marca exitosamente (Status 201)', async () => {
      const res = await request(app)
        .post('/brand')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'sony e2e',
          categoryId: existingCategoryId
        });

      expect(res.statusCode).toBe(201);
      newBrandId = res.body.result._id || res.body.result.id;
    });

    it('debería fallar con 409 si la marca ya existe', async () => {
      const res = await request(app)
        .post('/brand')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'sony e2e', categoryId: existingCategoryId });

      expect(res.statusCode).toBe(409);
    });
  });

  describe('GET /brand/categories/:categoryId', () => {
    it('debería obtener las marcas asociadas a la categoría (Status 200)', async () => {
      const res = await request(app)
        .get(`/brand/categories/${existingCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      const brands = res.body.brands || res.body.result;
      expect(brands.some(b => (b._id || b.id) === newBrandId)).toBe(true);
    });
  });

  describe('GET /brand/:id', () => {
    it('debería obtener la marca por ID (Status 200)', async () => {
      const res = await request(app)
        .get(`/brand/${newBrandId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.brand.name).toBe('sony e2e');
    });
  });

  describe('GET /brand', () => {
    it('debería obtener la lista de marcas (Status 200)', async () => {
      const res = await request(app)
        .get('/brand/')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      const brandsArray = res.body.brands.data || res.body.brands;
      expect(Array.isArray(brandsArray)).toBe(true);
      expect(brandsArray.some(b => (b._id || b.id) === newBrandId)).toBe(true);
    });
  });

  describe('PUT /brand/:id', () => {
    it('debería actualizar la marca exitosamente (Status 200)', async () => {
      const res = await request(app)
        .put(`/brand/${newBrandId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'sony updated' });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /brand/:id', () => {
    it('debería eliminar la marca exitosamente (Status 200)', async () => {
      const res = await request(app)
        .delete(`/brand/${newBrandId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);

      const checkRes = await request(app)
        .get(`/brand/${newBrandId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(checkRes.statusCode).toBe(404);
    });
  });
});