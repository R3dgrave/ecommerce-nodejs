const sinon = require("sinon");
const authMiddlewareFactory = require("../../src/middlewares/auth-middleware");

const MOCK_VALID_TOKEN = "Bearer valid.jwt.token";
const MOCK_INVALID_TOKEN = "Bearer invalid.jwt.token";
const MOCK_USER_PAYLOAD = {
  id: "user-id-123",
  name: "Authenticated User",
  isAdmin: false,
};

const MOCK_ADMIN_PAYLOAD = {
  id: "admin-id-456",
  name: "Admin User",
  isAdmin: true,
};

const mockTokenProvider = {
  verify: sinon.stub(),
};

const { verifyToken: middleware, isAdmin } = authMiddlewareFactory(mockTokenProvider);

describe("AuthMiddleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    sinon.restore();
    mockTokenProvider.verify.resetHistory();

    req = {
      header: sinon.stub(),
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };

    next = sinon.stub();
  });

  // TESTS PARA verifyTokenFactory
  // -----------------------------------------------
  it("debería adjuntar el payload del usuario a req.user y llamar a next() si el token es válido", async () => {
    req.header.withArgs("Authorization").returns(MOCK_VALID_TOKEN);
    mockTokenProvider.verify
      .withArgs("valid.jwt.token")
      .returns(MOCK_USER_PAYLOAD);

    await middleware(req, res, next);

    expect(mockTokenProvider.verify.calledOnce).toBe(true);
    expect(req.user).toEqual(MOCK_USER_PAYLOAD);
    expect(next.calledOnce).toBe(true);
    expect(res.status.called).toBe(false);
  });

  it("debería retornar 401 y un mensaje de error si el header Authorization está ausente", async () => {
    req.header.withArgs("Authorization").returns(undefined);

    await middleware(req, res, next);

    expect(mockTokenProvider.verify.called).toBe(false);
    expect(next.called).toBe(false);
    expect(res.status.calledOnceWith(401)).toBe(true);
    expect(res.json.calledOnce).toBe(true);
    expect(res.json.firstCall.args[0]).toMatchObject({
      success: false,
      error: expect.any(String),
    });
  });

  it("debería retornar 401 si el TokenProvider.verify falla (token inválido/expirado)", async () => {
    req.header.withArgs("Authorization").returns(MOCK_INVALID_TOKEN);
    mockTokenProvider.verify.throws(new Error("Token signature invalid"));

    await middleware(req, res, next);

    expect(mockTokenProvider.verify.calledOnce).toBe(true);
    expect(next.called).toBe(false);
    expect(res.status.calledOnceWith(401)).toBe(true);
    expect(res.json.calledOnce).toBe(true);
    expect(res.json.firstCall.args[0]).toMatchObject({
      success: false,
      error: expect.any(String),
    });
  });

  // TESTS PARA isAdmin
  // -----------------------------------------------
  describe("isAdmin", () => {
    it("debería llamar a next() si req.user.isAdmin es verdadero", () => {
      req.user = MOCK_ADMIN_PAYLOAD;

      isAdmin(req, res, next);

      expect(next.calledOnce).toBe(true);
      expect(res.status.called).toBe(false);
    });

    it("debería retornar 403 (Forbidden) si req.user.isAdmin es falso", () => {
      req.user = MOCK_USER_PAYLOAD;

      isAdmin(req, res, next);

      expect(next.called).toBe(false);
      expect(res.status.calledOnceWith(403)).toBe(true);
      expect(res.json.firstCall.args[0]).toMatchObject({
        success: false,
        error: expect.any(String),
      });
    });

    it("debería retornar 403 (Forbidden) si req.user no existe (falta de token previo)", () => {
      req.user = undefined;

      isAdmin(req, res, next);

      expect(next.called).toBe(false);
      expect(res.status.calledOnceWith(403)).toBe(true);
      expect(res.json.firstCall.args[0]).toMatchObject({
        success: false,
        error: expect.any(String),
      });
    });
  });
});
