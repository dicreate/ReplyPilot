const axios = require("axios");
const authController = require("../controllers/authController");
const User = require("../models/User");

jest.mock("axios");

describe("Instagram OAuth Login", () => {
  it("should exchange code for access token and create a user", async () => {
    const mockResponse = { data: { access_token: "mockAccessToken", user_id: "12345" } };
    axios.post.mockResolvedValue(mockResponse);
    // Обмен на long-lived токен + профиль /me (иначе ретраи /me висят на паузах)
    axios.get
      .mockResolvedValueOnce({ data: { access_token: "mockLongToken", expires_in: 5184000 } })
      .mockResolvedValueOnce({ data: { id: "12345", username: "mockuser" } });

    jest.spyOn(User, "findOneAndUpdate").mockResolvedValue({
      _id: "mockUserId",
      instagramId: "12345",
      username: "mockuser"
    });

    const req = { body: { code: "mockCode" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await authController.instagramLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});
