require("dotenv").config();
const request = require("supertest");
const { app } = require("../src/server");
const { UserModel } = require("../src/models/UserModel");
const { generateJwt } = require("../src/utils/jwtUtils");
const { dbConnect, dbDisconnect } = require("../src/utils/dbConnectionManager");

let testUser;
let testToken;

beforeAll(async () => {
  await dbConnect();
});

afterAll(async () => {
  await dbDisconnect();
});

beforeEach(async () => {
  testUser = await new UserModel({
    username: "testuser",
    email: "user@example.com",
    password: "password123",
  }).save();

  testToken = generateJwt(testUser);
});

afterEach(async () => {
  await UserModel.deleteMany({});
});

describe("User Router", () => {
  it("POST /users/signup creates a new user account", async () => {
    const response = await request(app)
      .post("/users/signup")
      .send({
        username: "newuser",
        email: "newuser@example.com",
        password: "securepass123",
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Welcome");
    expect(response.body.data.username).toBe("newuser");
    expect(response.body.data.email).toBe("newuser@example.com");
    expect(response.body.result).toBeDefined();
  });

  it("POST /users/login authenticates user and returns token", async () => {
    const response = await request(app)
      .post("/users/login")
      .send({
        email: "user@example.com",
        password: "password123",
      });

    expect(response.status).toBe(200);
    expect(response.body.result).toBeDefined();
  });

  it("PATCH /users/:userId updates user profile", async () => {
    const response = await request(app)
      .patch(`/users/${testUser._id}`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({ theme: "dark" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Update successful");
    expect(response.body.data).toBeDefined();
  });

  it("GET /users/admin/dashboard returns all users when authenticated as admin", async () => {
    // Promote test user to admin
    testUser.isAdmin = true;
    await testUser.save();

    const adminToken = generateJwt(testUser);

    const response = await request(app)
      .get("/users/admin/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.users)).toBe(true);
  });

  it("GET /users/ returns all users for admin", async () => {
    // Create another user first
    await new UserModel({
      username: "otheruser",
      email: "other@example.com",
      password: "password456",
    }).save();

    // Promote test user to admin
    testUser.isAdmin = true;
    await testUser.save();

    const adminToken = generateJwt(testUser);

    const response = await request(app)
      .get("/users/")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.count).toBeGreaterThanOrEqual(2);
    // Check that sensitive fields are excluded
    expect(response.body.data[0].password).toBeUndefined();
    expect(response.body.data[0].salt).toBeUndefined();
  });
});
