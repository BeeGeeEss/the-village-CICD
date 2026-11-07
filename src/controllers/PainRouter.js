const express = require("express");
const { PainModel } = require("../models/PainModel.js");
const { checkForUserJwt } = require("../middleware/UserAuthentication.js");

const painRouter = express.Router();

// middleware to check if pain belongs to current logged in user
const checkPainOwnership = async (request, response, next) => {
  try {
    const pain = await PainModel.findById(request.params.painId);
    if (!pain) {
      return response.status(404).json({ message: "Pain not found" });
    }

    if (pain.user.toString() !== request.customData.user.id) {
      return response.status(403).json({ message: "Access denied" });
    }

    request.pain = pain; // attach the pain to request for later use
    next();
  } catch (error) {
    response.status(500).json({ message: "Error checking pain ownership" });
  }
};

// GET all /pains for user
painRouter.get("/", checkForUserJwt, async (request, response) => {
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

    const pains = await PainModel.find(query).sort({ occurred_at: -1 });
    response.json({
      data: pains,
      count: pains.length,
    });
  } catch (error) {
    response.status(500).json({ message: "Error retrieving pains" });
  }
});

// GET /pains/:painId for specific pain
painRouter.get(
  "/:painId",
  checkForUserJwt,
  checkPainOwnership,
  async (request, response) => {
    response.json({
      data: request.pain,
    });
  },
);

// POST /pains create a pain
painRouter.post("/", checkForUserJwt, async (request, response) => {
  try {
    const { value, location, optional_text, occurred_at } = request.body;
    const userId = request.customData.user.id;

    // validate required fields
    if (value === undefined || value === null) {
      return response.status(400).json({ message: "Pain value is required" });
    }

    if (value < 0 || value > 10) {
      return response
        .status(400)
        .json({ message: "Pain value must be between 0 and 10" });
    }

    if (!location) {
      return response
        .status(400)
        .json({ message: "Pain location is required" });
    }

    const validLocations = [
      "all_over",
      "head",
      "neck",
      "throat",
      "shoulders",
      "back",
      "chest",
      "abdomen",
      "arms",
      "hands",
      "pelvic_region",
      "upper_legs",
      "lower_legs",
      "feet",
    ];

    if (!validLocations.includes(location)) {
      return response.status(400).json({ message: "Invalid pain location" });
    }

    const newPain = new PainModel({
      user: userId,
      value: value,
      location: location,
      optional_text: optional_text || "",
      occurred_at: occurred_at ? new Date(occurred_at) : new Date(),
    });

    await newPain.save();

    response.status(201).json({
      message: "Pain entry created successfully",
      data: newPain,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return response.status(400).json({
        message: Object.values(error.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }
    response.status(500).json({ message: "Error creating pain entry" });
  }
});

// PATCH /pains/:painId
painRouter.patch(
  "/:painId",
  checkForUserJwt,
  checkPainOwnership,
  async (request, response) => {
    try {
      const { value, location, optional_text, occurred_at } = request.body;
      const updates = {};

      if (value !== undefined) {
        if (value < 0 || value > 10) {
          return response
            .status(400)
            .json({ message: "Pain value must be between 0 and 10" });
        }
        updates.value = value;
      }

      if (location !== undefined) {
        const validLocations = [
          "all_over",
          "head",
          "neck",
          "throat",
          "shoulders",
          "back",
          "chest",
          "abdomen",
          "arms",
          "hands",
          "pelvic_region",
          "upper_legs",
          "lower_legs",
          "feet",
        ];

        if (!validLocations.includes(location)) {
          return response
            .status(400)
            .json({ message: "Invalid pain location" });
        }
        updates.location = location;
      }

      if (optional_text !== undefined) {
        updates.optional_text = optional_text;
      }

      if (occurred_at !== undefined) {
        updates.occurred_at = new Date(occurred_at);
      }

      const updatedPain = await PainModel.findByIdAndUpdate(
        request.params.painId,
        updates,
        { new: true, runValidators: true },
      );

      response.json({
        message: "Pain entry updated successfully",
        data: updatedPain,
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        return response.status(400).json({
          message: Object.values(error.errors)
            .map((e) => e.message)
            .join(", "),
        });
      }
      response.status(500).json({ message: "Error updating pain entry" });
    }
  },
);

// DELETE /pains/:painId
painRouter.delete(
  "/:painId",
  checkForUserJwt,
  checkPainOwnership,
  async (request, response) => {
    try {
      await PainModel.findByIdAndDelete(request.params.painId);
      response.json({
        message: "Pain entry deleted successfully",
      });
    } catch (error) {
      response.status(500).json({ message: "Error deleting pain entry" });
    }
  },
);

module.exports = {
  painRouter,
};
