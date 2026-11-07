const express = require("express");
const { EventModel } = require("../models/EventModel.js");
const { checkForUserJwt } = require("../middleware/UserAuthentication.js");

const eventRouter = express.Router();

// middleware to check if event belongs to user
const checkEventOwnership = async (request, response, next) => {
  try {
    const event = await EventModel.findById(request.params.eventId);
    if (!event) {
      return response.status(404).json({ message: "Event not found" });
    }

    if (event.user.toString() !== request.customData.user.id) {
      return response.status(403).json({ message: "Access denied" });
    }

    request.event = event; // attach the event to request for later use
    next();
  } catch (error) {
    response.status(500).json({ message: "Error checking event ownership" });
  }
};

// GET all events for user
eventRouter.get("/", checkForUserJwt, async (request, response) => {
  try {
    // build query - start with user's events
    let query = { user: request.customData.user.id };

    // optional date filtering
    if (request.query.startDate || request.query.endDate) {
      query.occurred_at = {};
      if (request.query.startDate) {
        query.occurred_at.$gte = new Date(request.query.startDate);
      }
      if (request.query.endDate) {
        query.occurred_at.$lte = new Date(request.query.endDate);
      }
    }

    // grab events sorted by most recent first
    const events = await EventModel.find(query).sort({ occurred_at: -1 });

    response.json({ events });
  } catch (error) {
    response.status(500).json({ error: "Failed to fetch events" });
  }
});

// GET specific event
eventRouter.get("/:eventId", checkForUserJwt, checkEventOwnership, async (request, response) => {
  // event is already loaded by checkEventOwnership middleware
  response.json({ event: request.event });
});

// POST create new event
eventRouter.post("/", checkForUserJwt, async (request, response) => {
  try {
    const { title, description, category, occurred_at } = request.body;

    // validate required fields
    if (!title || !title.trim()) {
      return response.status(400).json({ error: "Title is required" });
    }

    // check category is valid
    const validCategories = ["medication", "therapy", "life_event", "appointment", "other"];
    if (!category || !validCategories.includes(category)) {
      return response.status(400).json({
        error: "Category must be one of: medication, therapy, life_event, appointment, other"
      });
    }

    // create the event
    const newEvent = new EventModel({
      user: request.customData.user.id,
      title: title.trim(),
      description: description ? description.trim() : undefined,
      category,
      occurred_at: occurred_at ? new Date(occurred_at) : new Date(),
    });

    const savedEvent = await newEvent.save();
    response.status(201).json({ event: savedEvent });
  } catch (error) {
    response.status(500).json({ error: "Failed to create event" });
  }
});

// PATCH update event
eventRouter.patch("/:eventId", checkForUserJwt, checkEventOwnership, async (request, response) => {
  try {
    const { title, description, category, occurred_at } = request.body;
    const updateData = {};

    // only update fields that were provided
    if (title !== undefined) {
      if (!title || !title.trim()) {
        return response.status(400).json({ error: "Title cannot be empty" });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description ? description.trim() : "";
    }

    // validate category if provided
    if (category !== undefined) {
      const validCategories = ["medication", "therapy", "life_event", "appointment", "other"];
      if (!validCategories.includes(category)) {
        return response.status(400).json({
          error: "Category must be one of: medication, therapy, life_event, appointment, other"
        });
      }
      updateData.category = category;
    }

    if (occurred_at !== undefined) {
      updateData.occurred_at = new Date(occurred_at);
    }

    // update the event
    const updatedEvent = await EventModel.findByIdAndUpdate(
      request.params.eventId,
      updateData,
      { new: true, runValidators: true }
    );

    response.json({ event: updatedEvent });
  } catch (error) {
    response.status(500).json({ error: "Failed to update event" });
  }
});

// DELETE event
eventRouter.delete("/:eventId", checkForUserJwt, checkEventOwnership, async (request, response) => {
  try {
    // delete the event
    await EventModel.findByIdAndDelete(request.params.eventId);
    response.json({ message: "Event deleted successfully" });
  } catch (error) {
    response.status(500).json({ error: "Failed to delete event" });
  }
});

module.exports = {
  eventRouter,
  checkEventOwnership,
};