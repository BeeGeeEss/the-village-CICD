const mongoose = require("mongoose");
const { dbConnect, dbDisconnect } = require("../dbConnectionManager");
const log = require('smallog');

// drop the base
async function dbDrop() {
  log("Dropping database...")
  await mongoose.connection.dropDatabase();
  log("Database is dropped")
}

dbConnect().then(async () => {
  await dbDrop();
  await dbDisconnect();
});
