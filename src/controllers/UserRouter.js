const express = require("express");
const {
  checkIfUserIsAdmin,
  checkIfUserIsTargetingThemselves,
} = require("../middleware/UserAuthorisation.js");
const { checkForUserJwt } = require("../middleware/UserAuthentication.js");
const { UserModel } = require("../models/UserModel.js");
const { generateJwt } = require("../utils/jwtUtils.js");
const userRouter = express.Router();
const crypto = require("node:crypto");

// localhost:3000/users/admin/dashboard
userRouter.get(
  "/admin/dashboard",
  checkForUserJwt,
  checkIfUserIsAdmin,
  async (request, response) => {
    const allUsers = await UserModel.find(
      {},
      {
        password: 0,
        salt: 0,
        __v: 0,
      },
    );
    // admin power excludes password, salt and mongo internal fields
    response.json({
      data: {
        users: allUsers,
      },
    });
  },
);

// admin GET methods
// GET specific user
// GET all users

// localhost:3000/users/
userRouter.get(
  "/",
  checkForUserJwt,
  checkIfUserIsAdmin,
  async (request, response) => {
    try {
      const allUsers = await UserModel.find(
        {},
        {
          password: 0,
          salt: 0,
          __v: 0,
        },
      ).sort({ createdAt: -1 });

      response.json({
        data: allUsers,
        count: allUsers.length,
      });
    } catch (error) {
      response.status(500).json({ message: "Error retrieving users" });
    }
  },
);

// GET specific user (admin only)
userRouter.get(
  "/:userId",
  checkForUserJwt,
  async (request, response) => {
    try {
      // allow if user is viewing themselves OR if user is admin
      const isOwnProfile = request.customData.user._id == request.params.userId;
      const isAdmin = request.customData.user.isAdmin;
      
      if (!isOwnProfile && !isAdmin) {
        return response.status(403).json({ 
          message: "You can only view your own profile" 
        });
      }

      const user = await UserModel.findById(request.params.userId, {
        password: 0,
        salt: 0,
        __v: 0,
      });

      if (!user) {
        return response.status(404).json({ message: "User not found" });
      }

      response.json({ data: user });
    } catch (error) {
      if (error.name === "CastError") {
        return response.status(400).json({ message: "Invalid user ID" });
      }
      response.status(500).json({ message: "Error retrieving user" });
    }
  },
);

// POST register/signup route
userRouter.post("/signup", async (request, response) => {
  try {
    //process request.body for username email and password
    let { username, email, password } = request.body;

    // validate required fields
    if (!username || !email || !password) {
      return response.status(400).json({
        message: "Username, email, and password are required",
      });
    }

    // check if user already exists
    let existingUser = await UserModel.findOne({
      $or: [{ email: email }, { username: username }],
    });

    if (existingUser) {
      return response.status(409).json({
        message: "Email or username already in use",
      });
    }

    let newUser = new UserModel({
      //create new user
      username: username,
      email: email,
      password: password,
    });

    //save to db and triggers password hashing in
    await newUser.save();
    let newJwt = generateJwt(newUser); // login immediately

    // return success
    response.status(201).json({
      message: "Welcome",
      result: newJwt,
      data: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        theme: newUser.theme,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      //handle validation errors from model
      return response.status(400).json({
        message: Object.values(error.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }

    if (error.code === 11000) {
      //if username already exists
      return response.status(409).json({
        message: "Email or username already in use",
      });
    }

    response.status(500).json({
      message: "Error creating account",
    });
  }
});

// POST login/signin route
userRouter.post("/login", async (request, response) => {
  // process request.body for email and password
  try {
    let { email, password } = request.body;

    if (!email || !password) {
      return response
        .status(400)
        .json({ message: "Email and password are required" });
    }

    let foundUser = await UserModel.findOne({ email: email });

    if (!foundUser) {
      return response
        .status(401)
        .json({ message: "Invalid email or password" });
    }

    // compare the provided password to the found relevant user
    let doPasswordsMatch = foundUser.comparePassword(password);
    if (!doPasswordsMatch) {
      return response
        .status(401)
        .json({ message: "Invalid email or password" });
    }

    let newJwt = generateJwt(foundUser); // if the user matches, make a jwt and return that jwt

    return response.status(200).json({ result: newJwt });
  } catch (error) {
    return response.status(500).json({ message: "Internal server error" });
  }
});

// PATCH specific user
// localhost:3000/users/aosdnalkandva
// can use this for password, email, username, theme updates
userRouter.patch(
  "/:userId",
  checkForUserJwt,
  checkIfUserIsTargetingThemselves,
  async (request, response) => {
    try {
      const allowedFields = ["username", "email", "password", "theme"];
      const updates = {};

      allowedFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(request.body, field)) {
          updates[field] = request.body[field];
        }
      });

      if (Object.keys(updates).length === 0) {
        return response.status(400).json({
          message: "No valid fields provided for update",
        });
      }

      const user = await UserModel.findById(request.customData.user._id);
      if (!user) {
        return response.status(404).json({ message: "User not found" });
      }

      Object.assign(user, updates);
      await user.save();

      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.salt;
      delete userResponse.__v;

      response.json({
        data: userResponse,
        message: "Update successful",
      });
    } catch (error) {
      response.status(500).json({ message: "Error updating user" });
    }
  },
);

// User DELETE Account /users/:userId
userRouter.delete(
  "/:userId",
  checkForUserJwt,
  checkIfUserIsTargetingThemselves,
  async (request, response) => {
    try {
      await UserModel.findByIdAndDelete(request.params.userId);
      response.json({
        message: "User account deleted successfully",
      });
    } catch (error) {
      response.status(500).json({ message: "Error deleting user account" });
    }
  },
);

// Admin DELETE User /users/:userId
userRouter.delete(
  "/:userId/admin",
  checkForUserJwt,
  checkIfUserIsAdmin,
  async (request, response) => {
    try {
      const deleted = await UserModel.findByIdAndDelete(request.params.userId);
      if (!deleted) {
        return response.status(404).json({ message: "User not found" });
      }
      return response
        .status(200)
        .json({ message: "User deleted successfully" });
    } catch (error) {
      if (error.name === "CastError") {
        return response.status(400).json({ message: "Invalid user ID" });
      }
      return response.status(500).json({ message: "Error deleting user" });
    }
  },
);

// if user forgets their password, or wants to reset their password
// we will leave it in the user's power to reset it themselves
// instead of asking an admin for support
function createResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

userRouter.post("/forgot-password", async (request, response) => {
  const { email } = request.body;
  if (!email) {
    return response.status(400).json({ message: "Email is required" });
  }

  const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return response.status(200).json({
      message: "If that email exists, reset instructions will be sent.",
    });
  }

  user.resetPasswordToken = createResetToken();
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // user has 1 hour before token expiry
  await user.save();

  return response.status(200).json({
    message: "Password reset token provided",
    resetToken: user.resetPasswordToken, // this is highly insecure, but free
  });
});

userRouter.post("/reset-password", async (request, response) => {
  const { token, password } = request.body;
  if (!token || !password) {
    return response
      .status(400)
      .json({ message: "Token and new password are required" });
  }

  const user = await UserModel.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return response
      .status(400)
      .json({ message: "Invalid or expired reset token" });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return response.status(200).json({ message: "Password reset successful" });
});

module.exports = {
  userRouter,
};
