
const log = require("smallog");
const mongoose = require("mongoose");
const { loadEnvFile } = require("node:process");

try {
  loadEnvFile();
} catch (error) {
  log("No .env file detected!");
}

async function dbConnect() {
  const isTest = process.env.NODE_ENV === "test";

  const dbUrl = isTest
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error(
      isTest
        ? "TEST_DATABASE_URL environment variable is not set"
        : "DATABASE_URL environment variable is not set"
    );
  }

  const url = new URL(dbUrl);

  const expectedDatabase = isTest
    ? "village_wellness_test"
    : "village-wellness-prod";

  const databaseName = url.pathname.replace(/^\/+/, "").split("/")[0];

  if (databaseName !== expectedDatabase) {
    throw new Error(
      `Incorrect database selected. Expected ${expectedDatabase}, received ${databaseName || "default"}`
    );
  }

  log(`DB host: ${url.host}`);
  log(`Database: ${expectedDatabase}`);

  require("node:dns").setServers(["8.8.8.8", "1.1.1.1"]);

  try {
    await mongoose.connect(dbUrl);
    log("Connected");
  } catch (error) {
    log(`Database connection failed: ${error.message}`);
    throw error;
  }
}

async function dbDisconnect() {
  await mongoose.disconnect();
}

module.exports = {
  dbConnect,
  dbDisconnect,
};
