require("dotenv").config();

const request = require("supertest");
const { app } = require("../src/server");
const { UserModel } = require("../src/models/UserModel");
const { PainModel } = require("../src/models/PainModel");
const { generateJwt } = require("../src/utils/jwtUtils");
const {
  dbConnect,
  dbDisconnect,
} = require("../src/utils/dbConnectionManager");

let testUser;
let testToken;
let testPain;

const testUsername = "pain-router-testuser";
const testEmail = "pain-router-test@example.com";

beforeAll(async () => {
  await dbConnect();
});

beforeEach(async () => {
  // Remove leftover records from previous test runs.
  const existingUser = await UserModel.findOne({
    username: testUsername,
  });

  if (existingUser) {
    await PainModel.deleteMany({ user: existingUser._id });
  }

  await UserModel.deleteOne({
    username: testUsername,
  });

  testUser = await new UserModel({
    username: testUsername,
    email: testEmail,
    password: "password123",
  }).save();

  testToken = generateJwt(testUser);

  testPain = await new PainModel({
    user: testUser._id,
    value: 6,
    location: "back",
    optional_text: "Lower back pain",
  }).save();
});

afterEach(async () => {
  if (testUser?._id) {
    await PainModel.deleteMany({
      user: testUser._id,
    });

    await UserModel.deleteOne({
      _id: testUser._id,
    });
  }
});

afterAll(async () => {
  await dbDisconnect();
});

describe("Pain Router", () => {
  it("GET /pains returns all pain entries for the user", async () => {
    const response = await request(app)
      .get("/pains")
      .set("Authorization", `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.count).toBeGreaterThanOrEqual(1);
  });

  it("POST /pains creates a new pain entry", async () => {
    const response = await request(app)
      .post("/pains")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        value: 7,
        location: "head",
        optional_text: "Headache",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.value).toBe(7);
    expect(response.body.data.location).toBe("head");
    expect(response.body.data.user).toBe(testUser._id.toString());
  });

  it("PATCH /pains/:painId updates a pain entry", async () => {
    const response = await request(app)
      .patch(`/pains/${testPain._id}`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        value: 4,
        optional_text: "Feeling better",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.value).toBe(4);
    expect(response.body.data.optional_text).toBe("Feeling better");
  });

  it("DELETE /pains/:painId removes a pain entry", async () => {
    const response = await request(app)
      .delete(`/pains/${testPain._id}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Pain entry deleted successfully");
  });
});