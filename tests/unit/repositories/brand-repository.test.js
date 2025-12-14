const sinon = require("sinon");
const BrandRepository = require("../../../src/repositories/brand-repository");
const MockBrandModel = {};
const MOCK_CATEGORY_ID = 'cat123';
const MOCK_BRAND_DATA = { name: 'Samsung', categoryId: MOCK_CATEGORY_ID };

describe("BrandRepository", () => {
  let brandRepository;
  let baseRepositoryStubs = {};

  beforeEach(() => {
    sinon.restore();
    brandRepository = new BrandRepository(MockBrandModel);
    baseRepositoryStubs.findBy = sinon.stub(brandRepository, 'findBy').resolves([MOCK_BRAND_DATA]);
    baseRepositoryStubs.count = sinon.stub(brandRepository, 'count').resolves(5);
  });

  describe("findByCategoryId", () => {
    it("debería llamar a findBy con el categoryId correcto", async () => {
      await brandRepository.findByCategoryId(MOCK_CATEGORY_ID);
      expect(baseRepositoryStubs.findBy.calledOnce).toBe(true);
      expect(baseRepositoryStubs.findBy.calledWith({ categoryId: MOCK_CATEGORY_ID })).toBe(true);
    });

    it("debería devolver el resultado de findBy", async () => {
      const result = await brandRepository.findByCategoryId(MOCK_CATEGORY_ID);
      expect(result).toEqual([MOCK_BRAND_DATA]);
    });

    it("debería devolver una lista de todas las marcas si categoryId es nulo o indefinido", async () => {
      await brandRepository.findByCategoryId(null);
      expect(baseRepositoryStubs.findBy.calledWith({})).toBe(true);
    });
  });

  describe("countByCategoryId", () => {
    it("debería llamar a count con el categoryId correcto", async () => {
      await brandRepository.countByCategoryId(MOCK_CATEGORY_ID);
      expect(baseRepositoryStubs.count.calledOnce).toBe(true);
      expect(baseRepositoryStubs.count.calledWith({ categoryId: MOCK_CATEGORY_ID })).toBe(true);
    });

    it("debería devolver el recuento de marcas", async () => {
      const result = await brandRepository.countByCategoryId(MOCK_CATEGORY_ID);
      expect(result).toBe(5);
    });
  });

  describe("countByFilter", () => {
    it("debería llamar a count con el filtro proporcionado", async () => {
      const customFilter = { name: 'test' };
      await brandRepository.countByFilter(customFilter);

      expect(baseRepositoryStubs.count.calledOnce).toBe(true);
      expect(baseRepositoryStubs.count.calledWith(customFilter)).toBe(true);
    });
  });
});