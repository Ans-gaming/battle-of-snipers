const mongoose = require("mongoose");

const seasonTeamSchema = new mongoose.Schema(
  {
    rank: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    matches: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    damage: { type: Number, default: 0 }
  },
  { _id: false }
);

const seasonSchema = new mongoose.Schema(
  {
    seasonNumber: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    status: { type: String, default: "Completed" },
    standings: { type: [seasonTeamSchema], default: [] },
    matches: { type: [mongoose.Schema.Types.Mixed], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Season", seasonSchema);