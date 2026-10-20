
require("dotenv").config();
const mongoose = require("mongoose");
const Season = require("./season");

const matches = [
  { matchNumber: 1, date: "07-11-2021", teams: "Toxic Gamers VS FF Gamers", winner: "Toxic Gamers", loser: "FF Gamers" },
  { matchNumber: 2, date: "08-11-2021", teams: "Titans Club VS Team United", winner: "Titans Club", loser: "Team United" },
  { matchNumber: 3, date: "09-11-2021", teams: "Ans Gaming VS Dark Hunters", winner: "Ans Gaming", loser: "Dark Hunters" },
  { matchNumber: 4, date: "10-11-2021", teams: "FF Gamers VS Team United", winner: "Team United", loser: "FF Gamers" },
  { matchNumber: 5, date: "11-11-2021", teams: "Toxic Gamers VS Titans Club", winner: "Titans Club", loser: "Toxic Gamers" },
  { matchNumber: 6, date: "12-11-2021", teams: "Toxic Gamers VS Dark Hunters", winner: "Toxic Gamers", loser: "Dark Hunters" },
  { matchNumber: 7, date: "13-11-2021", teams: "Night Hunters VS Aryan Gaming", winner: "Night Hunters", loser: "Aryan Gaming" },
  { matchNumber: 8, date: "14-11-2021", teams: "Night Hunters VS Team United", winner: "Night Hunters", loser: "Team United" },
  { matchNumber: 9, date: "15-11-2021", teams: "Aryan Gaming VS FF Gamers", winner: "FF Gamers", loser: "Aryan Gaming" },
  { matchNumber: 10, date: "16-11-2021", teams: "FF Gamers VS Dark Hunters", winner: "FF Gamers", loser: "Dark Hunters" },
  { matchNumber: 11, date: "17-11-2021", teams: "Toxic Gamers VS Team United", winner: "Toxic Gamers", loser: "Team United" },
  { matchNumber: 12, date: "18-11-2021", teams: "Night Hunters VS FF Gamers", winner: "Night Hunters", loser: "FF Gamers" },
  { matchNumber: 13, date: "19-11-2021", teams: "Ans Gaming VS Titans Club", winner: "Ans Gaming", loser: "Titans Club" },
  { matchNumber: 14, date: "20-11-2021", teams: "Titans Club VS Dark Hunters", winner: "Dark Hunters", loser: "Titans Club" },
  { matchNumber: 15, date: "21-11-2021", teams: "Ans Gaming VS Toxic Gamers", winner: "Toxic Gamers", loser: "Ans Gaming" },
  { matchNumber: 16, date: "22-11-2021", teams: "Night Hunters VS Ans Gaming", winner: "Ans Gaming", loser: "Night Hunters" },
  { matchNumber: 17, date: "23-11-2021", teams: "Ans Gaming VS FF Gamers", winner: "Ans Gaming", loser: "FF Gamers" },
  { matchNumber: 18, date: "24-11-2021", teams: "Ans Gaming VS Aryan Gaming", winner: "Aryan Gaming", loser: "Ans Gaming" },
  { matchNumber: 19, date: "25-11-2021", teams: "Aryan Gaming VS Dark Hunters", winner: "Aryan Gaming", loser: "Dark Hunters" },
  { matchNumber: 20, date: "26-11-2021", teams: "Aryan Gaming VS Titans Club", winner: "Aryan Gaming", loser: "Titans Club" },
  { matchNumber: 21, date: "27-11-2021", teams: "Ans Gaming VS Team United", winner: "Ans Gaming", loser: "Team United" },
  { matchNumber: 22, date: "28-11-2021", teams: "FF Gamers VS Titans Club", winner: "FF Gamers", loser: "Titans Club" },
  { matchNumber: 23, date: "29-11-2021", teams: "Night Hunters VS Toxic Gamers", winner: "Night Hunters", loser: "Toxic Gamers" },
  { matchNumber: 24, date: "30-11-2021", teams: "Toxic Gamers VS Aryan Gaming", winner: "Toxic Gamers", loser: "Aryan Gaming" },
  { matchNumber: 25, date: "01-12-2021", teams: "Team United VS Dark Hunters", winner: "Dark Hunters", loser: "Team United" },
  { matchNumber: 26, date: "02-12-2021", teams: "Night Hunters VS Titans Club", winner: "Night Hunters", loser: "Titans Club" },
  { matchNumber: 27, date: "03-12-2021", teams: "Aryan Gaming VS Team United", winner: "Aryan Gaming", loser: "Team United" },
  { matchNumber: 28, date: "04-12-2021", teams: "Night Hunters VS Dark Hunters", winner: "Night Hunters", loser: "Dark Hunters" }
];

async function seedSeason1Matches() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from environment.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const season = await Season.findOne({ seasonNumber: 1 });

    if (!season) {
      throw new Error("Season 1 not found. Seed Season 1 first.");
    }

    const result = await Season.updateOne(
      { seasonNumber: 1 },
      { $set: { matches } },
      { runValidators: true }
    );

    console.log(`Season 1 matches saved: ${matches.length}`);
    console.log("Matched documents:", result.matchedCount);
    console.log("Standings were not changed.");
  } catch (error) {
    console.error("Saving Season 1 matches failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedSeason1Matches();
