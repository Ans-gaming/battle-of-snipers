
const mongoose = require("mongoose");

const tournamentSettingsSchema = new mongoose.Schema({
  registrationOpen: {
    type: Boolean,
    default: true
  },
  tournamentStarted: {
    type: Boolean,
    default: false
  },
  groupAMatches: {
    type: Number,
    default: null,
    min: 1
  },
  groupBMatches: {
    type: Number,
    default: null,
    min: 1
  },
  qualifiersPerGroup: {
    type: Number,
    default: null,
    min: 1
  }
});

module.exports = mongoose.model(
  "TournamentSettings",
  tournamentSettingsSchema,
  "tournamentsettings"
);
