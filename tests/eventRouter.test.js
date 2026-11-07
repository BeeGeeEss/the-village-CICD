require("dotenv").config();
const request = require("supertest");
const { app } = require("../src/server");
const { UserModel } = require("../src/models/UserModel");
const { EventModel } = require("../src/models/EventModel");
const { generateJwt } = require("../src/utils/jwtUtils");
const { dbConnect, dbDisconnect } = require("../src/utils/dbConnectionManager");

let testUser;
let testToken;
let testEvent;

beforeAll(async () => {
  await dbConnect();
});

afterAll(async () => {
  await dbDisconnect();
});

beforeEach(async () => {
  testUser = await new UserModel({
    username: "eventuser",
    email: "event@example.com",
    password: "password123",
  }).save();

  testToken = generateJwt(testUser);

  testEvent = await new EventModel({
    user: testUser._id,
    title: "Doctor Appointment",
    description: "Annual checkup",
    category: "appointment",
  }).save();
});

afterEach(async () => {
  await EventModel.deleteMany({});
  await UserModel.deleteMany({});
});

describe("Event Router", () => {
  it("GET /events returns all events for the user", async () => {
    const response = await request(app)
      .get("/events")
      .set("Authorization", `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.events)).toBe(true);
    expect(response.body.events.length).toBeGreaterThanOrEqual(1);
  });

  it("POST /events creates a new event", async () => {
    const response = await request(app)
      .post("/events")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        title: "Therapy Session",
        description: "Weekly therapy",
        category: "therapy",
      });

    expect(response.status).toBe(201);
    expect(response.body.event.title).toBe("Therapy Session");
    expect(response.body.event.category).toBe("therapy");
    expect(response.body.event.user).toBe(testUser._id.toString());
  });

  it("PATCH /events/:eventId updates an event", async () => {
    const response = await request(app)
      .patch(`/events/${testEvent._id}`)
      .set("Authorization", `Bearer ${testToken}`)
      .send({ title: "Updated Appointment" });

    expect(response.status).toBe(200);
    expect(response.body.event.title).toBe("Updated Appointment");
  });

  it("DELETE /events/:eventId removes an event", async () => {
    const response = await request(app)
      .delete(`/events/${testEvent._id}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Event deleted successfully");
  });
});
