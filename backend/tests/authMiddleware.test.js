const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

describe("Auth Middleware", () => {
  it("should return 401 if no token is provided", () => {
    const req = { header: jest.fn().mockReturnValue(null) };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No token, authorization denied" });
  });

  it("should proceed if token is valid", async () => {
    const user = new User({
      facebookId: "12345",
      instagramId: "12345",
      accessToken: "test-token",
      username: "testuser"
    });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    const req = { header: jest.fn().mockReturnValue(`Bearer ${token}`), path: "/test" };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await authMiddleware(req, res, next);
    expect(req.user.id).toBe(user._id.toString());
    expect(next).toHaveBeenCalled();
  });
});
