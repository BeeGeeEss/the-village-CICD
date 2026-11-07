const express = require("express");
const { checkForUserJwt } = require("../middleware/UserAuthentication.js");
const { MoodModel } = require("../models/MoodModel.js");

const moodRouter = express.Router();

// middleware to check if mood belongs to current logged in user
const checkMoodOwnership = async (request, response, next) => {
  try {
    const mood = await MoodModel.findById(request.params.moodId);
    if (!mood) {
      return response.status(404).json({ message: "Mood not found" });
    }

    if (mood.user.toString() !== request.customData.user.id) {
      return response.status(403).json({ message: "Access denied" });
    }

    request.mood = mood; // attach the mood to request for later use
    next();
  } catch (error) {
    response.status(500).json({ message: "Error checking mood ownership" });
  }
};

// GET all /moods for user
moodRouter.get("/", checkForUserJwt, async (request, response) => {
  try {
    const userId = request.customData.user.id;
    let query = { user: userId };

    const { startDate, endDate } = request.query;
    // optional date filtering
    if (startDate || endDate) {
      query.occurred_at = {};
      if (startDate) query.occurred_at.$gte = new Date(startDate);
      if (endDate) query.occurred_at.$lte = new Date(endDate);
    }

    const moods = await MoodModel.find(query).sort({ occurred_at: -1 });
    response.json({
      data: moods,
      count: moods.length
    });
  } catch (error) {
    response.status(500).json({ message: "Error retrieving moods" });
  }
});

// GET /moods/:moodId for specific mood
moodRouter.get("/:moodId", checkForUserJwt, checkMoodOwnership, async (request, response) => {
  response.json({
    data: request.mood
  });
});

// POST /moods create a mood
moodRouter.post("/", checkForUserJwt, async (request, response) => {
  try {
    const { value, optional_text, occurred_at } = request.body;
    const userId = request.customData.user.id;

    // validate required fields
    if (value === undefined || value === null) {
      return response.status(400).json({ message: "Mood value is required" });
    }

    if (value < 0 || value > 10) {
      return response.status(400).json({ message: "Mood value must be between 0 and 10" });
    }

    const newMood = new MoodModel({
      user: userId,
      value: value,
      optional_text: optional_text || "",
      occurred_at: occurred_at ? new Date(occurred_at) : new Date()
    });

    await newMood.save();

    response.status(201).json({
      message: "Mood entry created successfully",
      data: newMood
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return response.status(400).json({
        message: Object.values(error.errors).map(e => e.message).join(", ")
      });
    }
    response.status(500).json({ message: "Error creating mood entry" });
  }
});

// PATCH /moods/:moodId 
moodRouter.patch("/:moodId", checkForUserJwt, checkMoodOwnership, async (request, response) => {
  try {
    const { value, optional_text, occurred_at } = request.body;
    const updates = {};

    if (value !== undefined) {
      if (value < 0 || value > 10) {
        return response.status(400).json({ message: "Mood value must be between 0 and 10" });
      }
      updates.value = value;
    }

    if (optional_text !== undefined) {
      updates.optional_text = optional_text;
    }

    if (occurred_at !== undefined) {
      updates.occurred_at = new Date(occurred_at);
    }

    const updatedMood = await MoodModel.findByIdAndUpdate(
      request.params.moodId,
      updates,
      { new: true, runValidators: true }
    );

    response.json({
      message: "Mood entry updated successfully",
      data: updatedMood
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return response.status(400).json({
        message: Object.values(error.errors).map(e => e.message).join(", ")
      });
    }
    response.status(500).json({ message: "Error updating mood entry" });
  }
});

// DELETE /moods/:moodId 
moodRouter.delete("/:moodId", checkForUserJwt, checkMoodOwnership, async (request, response) => {
  try {
    await MoodModel.findByIdAndDelete(request.params.moodId);
    response.json({
      message: "Mood entry deleted successfully"
    });
  } catch (error) {
    response.status(500).json({ message: "Error deleting mood entry" });
  }
});

module.exports = {
  moodRouter,
};
