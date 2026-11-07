require("dotenv").config();
const request = require("supertest");
const { app } = require("../src/server");
const { UserModel } = require("../src/models/UserModel");
const { MoodModel } = require("../src/models/MoodModel");
const { generateJwt } = require("../src/utils/jwtUtils");
const { dbConnect, dbDisconnect } = require("../src/utils/dbConnectionManager");

let testUser;
let testToken;
let testMood;

beforeAll(async () => {
  await dbConnect();
});

afterAll(async () => {
  await dbDisconnect();
});

beforeEach(async () => {
  testUser = await new UserModel({
    username: "testuser",
    email: "test@example.com",
    password: "password123",
  }).save();

  testToken = generateJwt(testUser);

  testMood = await new MoodModel({
    user: testUser._id,
    value: 7,
    optional_text: "Feeling good",
  }).save();
});

afterEach(async () => {
  await MoodModel.deleteMany({});
  await UserModel.deleteMany({});
});

describe("Mood Router", () => {
  it("GET /moods returns moods for the user", async () => {
    const response = await request(app)
      .get("/moods")
      .set("Authorization", `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.count).toBeGreaterThanOrEqual(1);
  });

  it("POST /moods creates a new mood entry", async () => {
    const response = await request(app)
      .post("/moods")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ value: 8, optional_text: "Great day" });

    expect(response.status).toBe(201);
    expect(response.body.data.value).toBe(8);
    expect(response.body.data.user).toBe(testUser._id.toString());
  });

  it("GET /moods/:moodId returns the created mood", async () => {
    const response = await request(app)
      .get(`/moods/${testMood._id}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data._id).toBe(testMood._id.toString());
  });

  it("PATCH /moods/:moodId updates a mood entry", async () => {
    const response = await request(app)
      .patch(`/moods/${testMood._id}`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({ value: 5 });

    expect(response.status).toBe(200);
    expect(response.body.data.value).toBe(5);
  });

  it("DELETE /moods/:moodId removes a mood entry", async () => {
    const response = await request(app)
      .delete(`/moods/${testMood._id}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Mood entry deleted successfully");
  });
});
