const sinon = require('sinon');
const CategoryRepository = require('../../../src/repositories/category-repository');
const mongoose = require('mongoose');

describe('CategoryRepository', () => {
  let categoryRepository;
  let mockMongooseMethods;
  let mockId;
  let mockCategoryDoc;
  let mockSave;

  beforeEach(() => {
    sinon.restore();
    mockId = new mongoose.Types.ObjectId();
    
    mockCategoryDoc = {
      _id: mockId,
      name: 'electronics',
      toObject: sinon.stub().returns({ _id: mockId, name: 'electronics', __v: 0 })
    };

    const mockCategoryList = [mockCategoryDoc];

    const mockFindChain = {
      skip: sinon.stub().returnsThis(),
      limit: sinon.stub().returnsThis(),
      exec: sinon.stub().resolves(mockCategoryList)
    };

    mockMongooseMethods = {
      find: sinon.stub().returns(mockFindChain),
      findById: sinon.stub().returns({ exec: sinon.stub().resolves(mockCategoryDoc) }),
      findByIdAndDelete: sinon.stub().returns({ exec: sinon.stub().resolves(mockCategoryDoc) }),
      findByIdAndUpdate: sinon.stub().returns({ exec: sinon.stub().resolves(mockCategoryDoc) }),
      countDocuments: sinon.stub().resolves(mockCategoryList.length)
    };

    mockSave = sinon.stub().resolves(mockCategoryDoc);

    const MockModelConstructor = function (data) {
      this.save = mockSave;
      this.toObject = () => ({ _id: mockId, name: data.name });
    };

    Object.assign(MockModelConstructor, mockMongooseMethods);
    categoryRepository = new CategoryRepository(MockModelConstructor);
  });

  it('debe llamar a find() y retornar la lista con id (no _id)', async () => {
    const result = await categoryRepository.find();

    expect(mockMongooseMethods.find.calledOnce).toBe(true);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).not.toHaveProperty('_id');
    expect(result[0].id).toBe(mockId.toString());
  });

  it('debe llamar a findById() y retornar la categoría transformada', async () => {
    const result = await categoryRepository.findById(mockId.toString());

    expect(mockMongooseMethods.findById.calledOnce).toBe(true);
    expect(result.id).toBe(mockId.toString());
    expect(result).not.toHaveProperty('_id');
  });

  it('debe instanciar un nuevo modelo, llamar a save() y retornar id', async () => {
    const result = await categoryRepository.save({ name: 'electronics' });

    expect(mockSave.calledOnce).toBe(true);
    expect(result.id).toBe(mockId.toString());
  });

  it('debe llamar a findByIdAndDelete con el ID correcto', async () => {
    await categoryRepository.delete(mockId.toString());
    expect(mockMongooseMethods.findByIdAndDelete.calledWith(mockId.toString())).toBe(true);
  });

  it('debe manejar la paginación y retornar la estructura de datos limpia', async () => {
    const filter = { name: /test/i };
    const options = { limit: 10, page: 1 };

    const result = await categoryRepository.findWithPagination(filter, options);

    expect(result.data[0]).toHaveProperty('id');
    expect(result.totalCount).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('debe llamar a findByIdAndUpdate y retornar el objeto con id', async () => {
    const result = await categoryRepository.update(mockId.toString(), { name: 'updated' });

    expect(mockMongooseMethods.findByIdAndUpdate.calledOnce).toBe(true);
    expect(result.id).toBe(mockId.toString());
  });
});