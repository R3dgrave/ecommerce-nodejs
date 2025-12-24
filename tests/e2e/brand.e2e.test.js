const request = require('supertest');
const { app, closeDatabase, cleanDatabase, UserModel } = require('./setup.e2e');

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

  await UserModel.updateOne({ email: MOCK_ADMIN_USER.email }, { $set: { isAdmin: true } });

  const loginRes = await request(app).post('/auth/login').send({
    email: MOCK_ADMIN_USER.email,
    password: MOCK_ADMIN_USER.password,
  });

  adminToken = loginRes.body.data.token;

  const categoryRes = await request(app)
    .post('/category')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: CATEGORY_NAME_E2E });

  existingCategoryId = categoryRes.body.data.id; 
});

afterAll(async () => {
  await closeDatabase();
});

describe('E2E: /brand routes', () => {

  describe('POST /brand', () => {
    it('debería crear una marca exitosamente y devolver id estándar', async () => {
      const res = await request(app)
        .post('/brand')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'sony e2e',
          categoryId: existingCategoryId
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data._id).toBeUndefined();
      
      newBrandId = res.body.data.id;
    });

    it('debería fallar con 409 usando el ErrorHandler si la marca ya existe', async () => {
      const res = await request(app)
        .post('/brand')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'sony e2e', categoryId: existingCategoryId });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined(); 
    });
  });

  describe('GET /brand/categories/:categoryId', () => {
    it('debería obtener las marcas asociadas a la categoría dentro de data', async () => {
      const res = await request(app)
        .get(`/brand/categories/${existingCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some(b => b.id === newBrandId)).toBe(true);
    });
  });

  describe('GET /brand/:id', () => {
    it('debería obtener la marca por ID con formato estandarizado', async () => {
      const res = await request(app)
        .get(`/brand/${newBrandId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(newBrandId);
      expect(res.body.data.name).toBe('sony e2e');
    });

    it('debería retornar 404 si el ID no existe', async () => {
      const fakeId = new (require('mongoose').Types.ObjectId)();
      const res = await request(app)
        .get(`/brand/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /brand', () => {
    it('debería obtener la lista de marcas (con soporte de paginación)', async () => {
      const res = await request(app)
        .get('/brand/')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      
      const brandsArray = res.body.data.data;
      expect(res.body.data).toHaveProperty('totalCount');
      expect(brandsArray.some(b => b.id === newBrandId)).toBe(true);
    });
  });

  describe('PUT /brand/:id', () => {
    it('debería actualizar la marca y persistir cambios', async () => {
      const res = await request(app)
        .put(`/brand/${newBrandId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'sony updated' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('sony updated');
    });
  });

  describe('DELETE /brand/:id', () => {
    it('debería eliminar la marca y retornar 404 al buscarla después', async () => {
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