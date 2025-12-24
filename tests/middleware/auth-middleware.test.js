const sinon = require("sinon");
const authMiddlewareFactory = require("../../src/middlewares/auth-middleware");
const { UnauthorizedError, ForbiddenError } = require("../../src/utils/errors");

const MOCK_VALID_TOKEN = "Bearer valid.jwt.token";
const MOCK_USER_PAYLOAD = { id: "user-id-123", isAdmin: false };

describe("AuthMiddleware Unit Tests", () => {
  let req, res, next, mockTokenProvider, mockUserRepository, authMiddleware;

  beforeEach(() => {
    mockTokenProvider = { verifyToken: sinon.stub() };
    mockUserRepository = { findById: sinon.stub() };

    authMiddleware = authMiddlewareFactory(mockTokenProvider, mockUserRepository);

    req = { headers: {} };
    res = {};
    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("verifyToken", () => {
    it("debería adjuntar el payload a req.user si el token es válido", async () => {
      req.headers.authorization = MOCK_VALID_TOKEN;
      mockTokenProvider.verifyToken.returns(MOCK_USER_PAYLOAD);

      await authMiddleware.verifyToken(req, res, next);

      expect(req.user).toEqual(MOCK_USER_PAYLOAD);
      expect(next.calledOnceWithExactly()).toBe(true);
    });

    it("debería llamar a next con UnauthorizedError si no hay token", async () => {
      req.headers.authorization = undefined;

      await authMiddleware.verifyToken(req, res, next);

      const errorPassed = next.firstCall.args[0];
      expect(errorPassed).toBeInstanceOf(UnauthorizedError);
      expect(errorPassed.statusCode).toBe(401);
    });
  });

  describe("isAdmin", () => {
    it("debería permitir el acceso si el usuario es admin en la DB", async () => {
      req.user = { id: "admin-id" };
      mockUserRepository.findById.resolves({ id: "admin-id", isAdmin: true });

      await authMiddleware.isAdmin(req, res, next);

      expect(next.calledOnceWithExactly()).toBe(true);
    });

    it("debería llamar a next con ForbiddenError si el usuario no es admin", async () => {
      req.user = { id: "user-id" };
      mockUserRepository.findById.resolves({ id: "user-id", isAdmin: false });

      await authMiddleware.isAdmin(req, res, next);

      const errorPassed = next.firstCall.args[0];
      expect(errorPassed).toBeInstanceOf(ForbiddenError);
      expect(errorPassed.statusCode).toBe(403);
    });

    it("debería pasar el error al ErrorHandler si falla el repositorio", async () => {
      req.user = { id: "user-id" };
      const dbError = new Error("DB Connection Failed");
      mockUserRepository.findById.rejects(dbError);

      await authMiddleware.isAdmin(req, res, next);

      expect(next.calledOnceWith(dbError)).toBe(true);
    });
  });
});