const sinon = require('sinon');
const CategoryRepository = require('../../../src/repositories/category-repository');
const mongoose = require('mongoose');

const mockId = new mongoose.Types.ObjectId().toString();
const mockCategory = {
  _id: mockId,
  name: 'electronics',
  toObject: () => ({ id: mockId, name: 'electronics' })
};

const mockCategoryList = [mockCategory];
let mockSave;

describe('CategoryRepository', () => {
  let categoryRepository;
  let mockMongooseMethods;

  beforeEach(() => {
    sinon.resetHistory();
    const mockCountDocumentsStub = sinon.stub().resolves(mockCategoryList.length);

    const mockFindChain = {
      skip: sinon.stub().returns({
        limit: sinon.stub().returns({
          exec: sinon.stub().resolves(mockCategoryList)
        })
      }),
      exec: sinon.stub().resolves(mockCategoryList)
    };

    mockMongooseMethods = {
      find: sinon.stub().returns(mockFindChain),
      findById: sinon.stub().returns({ exec: sinon.stub().resolves(mockCategory) }),
      findByIdAndDelete: sinon.stub().returns({ exec: sinon.stub().resolves({ deletedCount: 1 }) }),
      updateOne: sinon.stub().returns({ exec: sinon.stub().resolves({ matchedCount: 1, modifiedCount: 1 }) }),
      countDocuments: mockCountDocumentsStub
    };

    mockSave = sinon.stub().resolves(mockCategory);

    const MockModelConstructor = function (data) {
      this.save = mockSave;
      this.toObject = () => ({ id: mockId, name: data.name });
    };

    Object.assign(MockModelConstructor, mockMongooseMethods);
    categoryRepository = new CategoryRepository(MockModelConstructor);
  });

  it('debe llamar a find() en el modelo y retornar la lista de categorías', async () => {
    const result = await categoryRepository.find();

    expect(mockMongooseMethods.find.calledOnce).toBe(true);
    expect(result).toEqual([{ id: mockId, name: 'electronics' }]);
  });

  it('debe llamar a findById() en el modelo y retornar la categoría', async () => {
    const result = await categoryRepository.findById(mockId);

    expect(mockMongooseMethods.findById.calledOnce).toBe(true);
    expect(result).toEqual({ id: mockId, name: 'electronics' });
  });

  it('debe instanciar un nuevo modelo y llamar a save()', async () => {
    const newCategoryData = { name: 'electronics' };

    const result = await categoryRepository.save(newCategoryData);

    expect(mockSave.calledOnce).toBe(true);
    expect(result).toEqual({ id: mockId, name: 'electronics' });
  });

  it('debe llamar a findByIdAndDelete con el ID', async () => {
    await categoryRepository.delete(mockId);

    expect(mockMongooseMethods.findByIdAndDelete.calledWith(mockId)).toBe(true);
  });

  it('debe llamar a find y countDocuments para paginación y retornar la estructura correcta', async () => {
    const filter = { name: { $regex: /test/i } };
    const options = { limit: 10, skip: 0, page: 1 };

    const result = await categoryRepository.findWithPagination(filter, options);

    expect(mockMongooseMethods.find.calledOnce).toBe(true);
    expect(mockMongooseMethods.find.calledWith(filter)).toBe(true);

    expect(mockMongooseMethods.countDocuments.calledOnce).toBe(true);

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('totalCount', mockCategoryList.length);
  });

  it('debe llamar a updateOne con el ID y los datos y retornar el resultado', async () => {
    const updateData = { name: 'electronics-updated' };

    mockMongooseMethods.updateOne.returns({
      exec: sinon.stub().resolves({ matchedCount: 1, modifiedCount: 1 })
    });

    const result = await categoryRepository.update(mockId, updateData);

    expect(mockMongooseMethods.updateOne.calledWith({ _id: mockId }, updateData)).toBe(true);
    expect(result).toEqual({ matchedCount: 1, modifiedCount: 1 });
  });
});