
const log = require("smallog");
const { app } = require("./server.js");
const { loadEnvFile } = require("node:process");

try {
  loadEnvFile();
} catch (error) {
  log("No .env file detected!");
  if (process.env.NODE_ENV == "production") {
    log("No .env file - this is intentional!");
  }
}

// Connect to the database
const { dbConnect } = require("./utils/dbConnectionManager");

dbConnect().then(() => {
  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    log(`Server is running on port ${port}`);
  });
});
