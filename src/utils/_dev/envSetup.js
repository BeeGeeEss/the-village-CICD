const log = require("smallog");
const path = require("node:path");

// load existing env if exists
// for file read/ write and specifically using promises for async/await
const fs = require("node:fs/promises");
// import security utilities to generate a jwt secret key
const crypto = require("node:crypto");
// modern replacement of dotenv to load and check our .env values:
const { loadEnvFile } = require("node:process");

// check for any existing env variables
let envExists = true;
try {
  loadEnvFile();
  log("env file already exists");
} catch (error) {
  envExists = false;
  log("No env file exists");
}

// npm sets the project name to the environment automatically
// and we want to use this in a default mongodb connection string
if (!process.env.npm_package_name) {
  process.env.npm_package_name = "village-backend";
}
log("Default db name will be " + process.env.npm_package_name);

// if no env exists, do env setup
const defaultEnvValues = {
  // default server port
  PORT: 3000,
  // default secret key guaranteed to be unique
  JWT_SECRET_KEY: crypto.randomBytes(64).toString("hex"),
  // default db connection
  DATABASE_URL: `mongodb://127.0.0.1:27017/${process.env.npm_package_name}`,
};

async function writeToFile() {
  // loop through our default values defined somewhere
  let stringToWrite = "";

  // for each value, add it to a string that will become file content
  // defaultEnvValues.port
  for (const key in defaultEnvValues) {
    if (!Object.hasOwn(defaultEnvValues, key)) continue;

    // better for RAM usage, worse for human readability
    stringToWrite += `${key}=${defaultEnvValues[key]}\n`;
  }

  // once string is done/ loop is done, write that string to a new .env file
  // make sure there's actual content to write
  stringToWrite = stringToWrite.trim();
  if (stringToWrite.length > 0) {
    const envPath = path.resolve(process.cwd(), ".env");
    await fs.writeFile(envPath, stringToWrite);
  }
  log("Written this content to the .env file:\n" + stringToWrite);
}

if (!envExists) {
  writeToFile();
}
