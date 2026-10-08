const axios = require("axios");
const commentController = require("../controllers/commentController");
const User = require("../models/User");
const Keyword = require("../models/Keyword");

jest.mock("axios");

describe("Fetch Comments and Auto-Reply", () => {
  it("should fetch comments and send auto-replies", async () => {
    const mongoose = require("mongoose");
    const userId = new mongoose.Types.ObjectId().toString();
    const mockUser = { _id: userId, accessToken: "mockAccessToken" };
    jest.spyOn(User, "findById").mockResolvedValue(mockUser);

    const mockComments = { data: { data: [{ text: "DM me", from: { id: "user1", username: "testUser" } }] } };
    axios.get.mockResolvedValue(mockComments);

    const mockKeywords = [{ userId: userId, keyword: "DM me", message: "Hello!" }];
    jest.spyOn(Keyword, "find").mockResolvedValue(mockKeywords);

    const mockDMResponse = { data: { success: true } };
    axios.post.mockResolvedValue(mockDMResponse);

    const req = { params: { mediaId: "media123" }, user: { id: userId } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await commentController.fetchCommentsAndReply(req, res);

    expect(axios.post).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Comments processed successfully" });
  });
});
