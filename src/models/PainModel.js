const mongoose = require("mongoose");

const PainSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    location: {
      type: String,
      enum: [
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
      ],
      required: true,
    },
    optional_text: {
      type: String,
      trim: true,
      required: false,
    },
    occurred_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

const PainModel = mongoose.model("Pain", PainSchema);

module.exports = {
  PainSchema,
  PainModel,
};
