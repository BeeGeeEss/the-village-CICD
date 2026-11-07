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
  // Run the server
  app.listen(process.env.PORT || 3000, () => {
    log("Server is running on http://localhost:3000/");
  });
});
