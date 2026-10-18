
const mongoose = require("mongoose");

const scheduledMatchSchema = new mongoose.Schema(
  {
    group: {
      type: String,
      enum: ["A", "B"],
      required: true
    },

    team1Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      required: true
    },

    team1Name: {
      type: String,
      required: true,
      trim: true
    },

    team2Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      required: true
    },

    team2Name: {
      type: String,
      required: true,
      trim: true
    },

    matchDate: {
      type: Date,
      required: true
    },

    assignedTo: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "ScheduledMatch",
  scheduledMatchSchema,
  "scheduledmatches"
);
