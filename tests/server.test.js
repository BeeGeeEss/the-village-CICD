const request = require("supertest");
const { app } = require("../src/server");

describe("GET /", () => {
  it("returns welcome message", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Welcome to The Village API" });
    expect(response.headers["content-type"]).toMatch(/json/);
  });
});