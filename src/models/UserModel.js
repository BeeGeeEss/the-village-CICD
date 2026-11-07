const mongoose = require("mongoose");
const crypto = require("node:crypto");

const UserSchema = new mongoose.Schema(
  {
    username: {
      unique: true,
      required: true,
      type: String,
      minlength: [3, "Username too short!"],
      trim: true,
    },
    password: {
      required: true,
      type: String,
      minlength: [8, "Password too short!"],
    },
    email: {
      unique: true,
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
      required: false,
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    salt: {
      type: String,
      required: true,
      default: generateSalt,
    },
    resetPasswordToken: {
      type: String,
      required: false,
    },
    resetPasswordExpires: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

function generateSalt() {
  return crypto.randomBytes(64).toString("hex");
}

// middleware/hook to hash the password when the password is updated
UserSchema.pre("save", function (next) {
  // Check if the salt is available for this user
  // if not, create a salt
  if (!this.salt) {
    this.salt = generateSalt();
  }

  // Only proceed if the user password was modified
  if (!this.isModified("password")) return;

  // if we reach this point in the middleware hook, then the password
  // needs to be rehashed!!!

  this.password = crypto
    .scryptSync(this.password, this.salt, 64)
    .toString("hex");

  // leaving out next() because it might only be for post hooks nowadays
  // next();
});

// Compare passwords
UserSchema.methods.comparePassword = function (incomingPasswordToCheck) {
  if (!this.salt) {
    this.salt = generateSalt();
  }

  // if (incomingPasswordToCheck == this.password)
  // we need to hash incomingPasswordToCheck and see if the hashed version matches

  let hashedAndSaltedIncomingPassword = crypto
    .scryptSync(incomingPasswordToCheck, this.salt, 64)
    .toString("hex");

  if (hashedAndSaltedIncomingPassword == this.password) {
    return true;
  } else {
    return false;
  }
};
// foundUser.comparePassword(request.body.loginpassword)

const UserModel = mongoose.model("User", UserSchema);

module.exports = {
  UserSchema,
  UserModel,
};
