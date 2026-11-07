const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: ["medication", "therapy", "life_event", "appointment", "other"],
      default: "other",
      required: true,
    },
    occurred_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

const EventModel = mongoose.model("Event", EventSchema);

module.exports = {
  EventSchema,
  EventModel,
};
