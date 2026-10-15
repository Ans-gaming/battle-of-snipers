
const mongoose = require("mongoose");

const teamScoreSchema = new mongoose.Schema(
  {
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      required: true
    },
    teamName: {
      type: String,
      required: true,
      trim: true
    },
    won: {
      type: Number,
      default: 0,
      min: 0
    },
    lost: {
      type: Number,
      default: 0,
      min: 0
    },
    roundsPoints: {
      type: Number,
      default: 0
    },
    totalPoints: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const matchHistorySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["match", "tieBreaker"],
      default: "match",
      required: true
    },
    group: {
      type: String,
      enum: ["A", "B"],
      required: true
    },

    // Normal match fields
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      required: function () {
        return this.type === "match";
      }
    },
    loserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      required: function () {
        return this.type === "match";
      }
    },
    loserRounds: {
      type: Number,
      required: function () {
        return this.type === "match";
      },
      min: 0,
      max: 7
    },
    winnerRoundPoints: {
      type: Number,
      required: function () {
        return this.type === "match";
      }
    },
    loserRoundPoints: {
      type: Number,
      required: function () {
        return this.type === "match";
      }
    },
    winnerTotalPoints: {
      type: Number,
      required: function () {
        return this.type === "match";
      }
    },
    loserTotalPoints: {
      type: Number,
      required: function () {
        return this.type === "match";
      }
    },

    // Tie-breaker fields
    team1Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      required: function () {
        return this.type === "tieBreaker";
      }
    },
    team2Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      required: function () {
        return this.type === "tieBreaker";
      }
    },
    team1RoundPoints: {
      type: Number,
      required: function () {
        return this.type === "tieBreaker";
      }
    },
    team2RoundPoints: {
      type: Number,
      required: function () {
        return this.type === "tieBreaker";
      }
    }
  },
  { timestamps: true }
);
const matchResultsSchema = new mongoose.Schema(
  {
    group: {
      type: String,
      enum: ["A", "B"],
      required: true,
      unique: true
    },
    teams: {
      type: [teamScoreSchema],
      default: []
    },
    history: {
      type: [matchHistorySchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "MatchResults",
  matchResultsSchema
);
