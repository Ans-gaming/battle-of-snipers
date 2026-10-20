require("dotenv").config();
const mongoose = require("mongoose");
const Season = require("./season");

const season1 = {
  seasonNumber: 1,
  title: "BOS Season 1",
  status: "Completed",
  standings: [
    { rank: 1, name: "Night Hunters", matches: 7, wins: 6, losses: 1, points: 12, damage: 40348 },
    { rank: 2, name: "Ans Gaming", matches: 7, wins: 5, losses: 2, points: 10, damage: 48211 },
    { rank: 3, name: "Toxic Gamers", matches: 7, wins: 4, losses: 3, points: 8, damage: 45609 },
    { rank: 4, name: "Aryan Gaming", matches: 7, wins: 4, losses: 3, points: 8, damage: 39428 },
    { rank: 5, name: "FF Gamers", matches: 7, wins: 4, losses: 3, points: 8, damage: 35190 },
    { rank: 6, name: "Titans Club", matches: 7, wins: 2, losses: 5, points: 4, damage: 33704 },
    { rank: 7, name: "Dark Hunters", matches: 7, wins: 2, losses: 5, points: 4, damage: 27384 },
    { rank: 8, name: "Team United", matches: 7, wins: 1, losses: 6, points: 2, damage: 28915 }
  ],
  matches: []
};

async function seedSeason() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from environment.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    await Season.findOneAndUpdate(
      { seasonNumber: 1 },
      { $set: season1 },
      { upsert: true, new: true, runValidators: true }
    );

    console.log("BOS Season 1 saved successfully.");
  } catch (error) {
    console.error("Season seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedSeason();