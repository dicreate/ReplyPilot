const request = require("supertest");
const app = require("../app");

// Эти роуты защищены authMiddleware: с невалидным токеном API обязан
// отвечать 401, а не 200 (старые ожидания 200 были неверны).
describe("API Endpoints", () => {
  it("should require auth for analytics", async () => {
    const res = await request(app).get("/api/analytics").set("Authorization", "Bearer testToken");
    expect(res.statusCode).toBe(401);
  });

  it("should require auth for comments", async () => {
    const res = await request(app).get("/api/comments/media123").set("Authorization", "Bearer testToken");
    expect(res.statusCode).toBe(401);
  });
});
