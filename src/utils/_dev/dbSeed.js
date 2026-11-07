const { EventModel } = require("../../models/EventModel");
const { MoodModel } = require("../../models/MoodModel");
const { PainModel } = require("../../models/PainModel");
const { UserModel } = require("../../models/UserModel");
const { dbConnect, dbDisconnect } = require("../dbConnectionManager");
const log = require("smallog");

async function dbSeed() {
  log("before seeding...");
  // User data
  const usersToSeed = [
    {
      username: "Brando",
      password: "aGoodPa55word!",
      email: "brando.smith@test.com",
      isAdmin: false,
    },
    {
      username: "Tim",
      password: "password",
      email: "tim.maastricht@test.com",
      isAdmin: true,
    },
  ];

  log("before for await");
  // User seeding
  for await (const userData of usersToSeed) {
    await UserModel.create(userData);
  }

  // Users have passwords, passwords are hashed on pre-save hook (TODO!),
  // hooks/middleware won't fire on insertMany, we must loop through user data
  // and create the seed users one by one

  log("before post data");
  // Post data
  let user1 = await UserModel.findOne({ username: usersToSeed[0].username });
  let user2 = await UserModel.findOne({ username: usersToSeed[1].username });
  const painsToSeed = [
    {
      user: user1._id,
      value: 4,
      location: "back",
      optional_text: "Lower back ache after gardening",
      occurred_at: new Date("2026-04-28T10:00:00Z"),
      // this date is 28th of April, 2026 at 10am
    },
    {
      user: user2._id,
      value: 7,
      location: "head",
      optional_text: "Migraine with nausea",
    },
  ];

  const moodsToSeed = [
    {
      user: user1._id,
      value: 8,
      optional_text: "Feeling motivated and calm",
      occurred_at: new Date("2026-04-15T10:00:00Z"),
    },
    {
      user: user2._id,
      value: 3,
      optional_text: "Anxious and tired",
    },
  ];

  const eventsToSeed = [
    {
      user: user1._id,
      title: "Physical therapy appointment",
      description: "Routine session with physiotherapist",
      category: "therapy",
      occurred_at: new Date("2026-04-10T10:00:00Z"),
    },
    {
      user: user2._id,
      title: "Medication refill",
      description: "Picked up prescription from pharmacy",
      category: "medication",
    },
    {
      user: user2._id,
      title: "Family dinner",
      description: "Spent time with family after a long week",
      category: "life_event",
      occurred_at: new Date("2026-04-20T10:00:00Z"),
    },
  ];
  log("after user seeds");


  // We can use Post.insertMany to seed!
  await PainModel.insertMany(painsToSeed);
  await MoodModel.insertMany(moodsToSeed);
  await EventModel.insertMany(eventsToSeed);
}

dbConnect().then(async () => {
  log("Seeding the database now!");
  await dbSeed();
  log.win("Database has been seeded!");

  await dbDisconnect();
});
