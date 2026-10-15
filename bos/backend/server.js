const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config();

const Registration = require("./registration");
const TournamentSettings = require("./tournamentSettings");
const MatchResults = require("./matchResults");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Image upload configuration
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(
      new Error("Only JPG, PNG, and WEBP images are allowed.")
    );
  }
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) =>
    console.error("MongoDB connection error:", error.message)
  );
  
  // Public API health check
  app.get("/", (req, res) => {
    res.send("Battle of Snipers API is running");
  });
  
  app.get("/api/tournament-mode", async (req, res) => {
    try {
      let settings = await TournamentSettings.findOne();
      
      if (!settings) {
        settings = await TournamentSettings.create({
          registrationOpen: false,
          tournamentStarted: false
        });
      }
      
      res.set("Cache-Control", "no-store");
      
      return res.json({
        registrationOpen: settings.registrationOpen,
        tournamentStarted: settings.tournamentStarted,
        groupAMatches: settings.groupAMatches ?? null,
        groupBMatches: settings.groupBMatches ?? null,
        qualifiersPerGroup: settings.qualifiersPerGroup ?? null
      });
    } catch (error) {
      console.error("Tournament mode error:", error.message);
      return res.status(500).json({
        message: "Could not load tournament mode."
      });
    }
  });
  
  /* PUBLIC: Verify FF UID before allowing standings access */
  app.post("/api/verify-ff-uid", async (req, res) => {
    try {
      const { ffUid } = req.body || {};
      if (typeof ffUid !== "string" || !/^[0-9]+$/.test(ffUid.trim())) {
        return res.status(400).json({
          verified: false,
          message: "Please enter a valid numeric FF UID."
        });
      }
      
      // Standings verification is allowed only after tournament starts.
      const settings = await TournamentSettings.findOne();
      if (!settings || !settings.tournamentStarted) {
        return res.status(403).json({
          verified: false,
          message: "The tournament has not started yet."
        });
      }
        
      // Search the existing registration collection.
      const player = await Registration.findOne({
        ffUid: ffUid.trim()
      })
      .select("ffUid ffName teamName")
      .lean();
      
      if (!player) {
        return res.status(404).json({
          verified: false,
          message: "This FF UID is not registered for Season 7."
        });
      }
        
      return res.json({
        verified: true,
        ffUid: player.ffUid,
        ffName: player.ffName,
        teamName: player.teamName
      });
    } catch (error) {
      console.error("FF UID verification error:", error.message);
      return res.status(500).json({
        verified: false,
        message: "Unable to verify UID. Please try again."
      });
    }
  });
  
  // PUBLIC: Register a team
  app.post("/api/register", upload.single("teamLogo"), async (req, res) => {
    try {
      const { ffUid, ffName, teamName, contactNumber } = req.body;
      if (!ffUid || !ffName || !teamName || !contactNumber || !req.file) {
        return res.status(400).json({
          message: "Please complete all fields and upload your team logo."
        });
      }
      const settings = await TournamentSettings.findOne();
      
      if (!settings || !settings.registrationOpen || settings.tournamentStarted) {
        return res.status(403).json({
          message: "Tournament registration is currently closed."
        });
      }
  
      if (!/^[0-9]+$/.test(ffUid || "")) {
        return res.status(400).json({
          message: "FF UID must contain numbers only."
        });
      }
      
      if (!/^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/.test((teamName || "").trim())) {
        return res.status(400).json({
          message: "Team Name can contain letters, numbers, and single spaces only."
        });
      }
      
      if (!String(ffName || "").trim()) {
        return res.status(400).json({
          message: "FF Name / IGN cannot be empty."
        });
      }
      
      if (!/^[0-9]{10}$/.test((contactNumber || "").trim())) {
        return res.status(400).json({
          message: "Contact / WhatsApp Number must be exactly 10 digits."
        });
      }
      
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "battle-of-snipers-season-7/team-logos",
            resource_type: "image"
          },
          (error, uploadedImage) => {
            if (error) return reject(error);
            resolve(uploadedImage);
          }
        );
        stream.end(req.file.buffer);
      });
      
      const registration = new Registration({
        ffUid: ffUid.trim(),
        ffName: ffName.trim(),
        teamName: teamName.trim(),
        contactNumber: contactNumber.trim(),
        teamLogo: result.secure_url,
        teamLogoPublicId: result.public_id
      });
      await registration.save();
      
      return res.status(201).json({
        message: "Registration successful",
        registrationId: registration._id
      });
    } catch (error) {
      console.error("Registration error:", error.message);
      return res.status(500).json({
        message: "Registration failed. Please try again."
      });
    }
  });
  
  // Compare secret strings without an early character-by-character exit
  function safeCompare(value, expected) {
    if (typeof value !== "string" || typeof expected !== "string") {
      return false;
    }
    
    const valueBuffer = Buffer.from(value);
    const expectedBuffer = Buffer.from(expected);
    
    return (
      valueBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(valueBuffer, expectedBuffer)
    );
  }
  
  // ADMIN: Login
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body || {};
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
      console.error("Admin credentials or JWT secret are missing.");
      return res.status(500).json({
        message: "Admin login is not configured on the server."
      });
    }
    
    const validUsername = safeCompare(
      username,
      process.env.ADMIN_USERNAME
    );
    
    const validPassword = safeCompare(
      password,
      process.env.ADMIN_PASSWORD
    );
    
    if (!validUsername || !validPassword) {
      return res.status(401).json({
        message: "Invalid username or password."
      });
    }
    
    const token = jwt.sign(
      {
        role: "admin",
        username: process.env.ADMIN_USERNAME
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    
    return res.json({
      message: "Admin login successful.",
      token
    });
  });
  
  // Middleware: Protect admin routes
  function verifyAdmin(req, res, next) {
    if (!process.env.JWT_SECRET || !process.env.ADMIN_USERNAME) {
      return res.status(500).json({
        message: "Admin authentication is not configured."
      });
    }
    
    const authorization = req.headers.authorization || "";
    const parts = authorization.split(" ");
    
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        message: "Admin authentication required."
      });
    }
    
    try {
      const decoded = jwt.verify(
        parts[1],
        process.env.JWT_SECRET
      );
      
      if (decoded.role !== "admin" || decoded.username !== process.env.ADMIN_USERNAME) {
        return res.status(403).json({
          message: "Access denied."
        });
      }
      
      return next();
    } catch (error) {
      return res.status(401).json({
        message: "Your session expired. Please log in again."
      });
    }
  }
  
  app.put("/api/admin/tournament-mode", verifyAdmin, async (req, res) => {
    try {
      const {
        registrationOpen,
        tournamentStarted,
        groupAMatches,
        groupBMatches,
        qualifiersPerGroup
      } = req.body || {};

      if (typeof registrationOpen !== "boolean" || typeof tournamentStarted !== "boolean") {
        return res.status(400).json({
          message: "Both settings must be true or false."
        });
      }

      if (registrationOpen && tournamentStarted) {
        return res.status(400).json({
          message: "Close registration before starting the tournament."
        });
      }

      const validMatchSetting = (value) => value === null || value === undefined || (Number.isInteger(value) && value >= 1);
      
      if (!validMatchSetting(groupAMatches) || !validMatchSetting(groupBMatches)) {
        return res.status(400).json({
          message: "Match settings must be positive whole numbers or null."
        });
      }

      const validateGroupMatches = async (group, matches) => {
        if (matches === null || matches === undefined) {
          return null;
        }

        const teamCount = await Registration.countDocuments({ group });

        if (teamCount < 2) {
          return `Assign at least 2 teams to Group ${group} first.`;
        }

        const oneRound = teamCount - 1;
        const twoRounds = 2 * oneRound;

        if (matches !== oneRound && matches !== twoRounds) {
          return `Group ${group} allows only ${oneRound} or ${twoRounds} matches per team.`;
        }

        return null;
      };

      const groupAError = await validateGroupMatches("A", groupAMatches);

      if (groupAError) {
        return res.status(400).json({ message: groupAError });
      }

      const groupBError = await validateGroupMatches("B", groupBMatches);

      if (groupBError) {
        return res.status(400).json({ message: groupBError });
      }
      
      if (groupAMatches !== undefined && groupAMatches !== null && groupBMatches !== undefined && groupBMatches !== null && groupAMatches !== groupBMatches) {
        return res.status(400).json({
          message: "Both groups must use the same matches-per-team setting."
        });
      }

      // Validate qualifiers only when a non-null value is supplied.
      if (qualifiersPerGroup !== undefined && qualifiersPerGroup !== null) {
        if (!Number.isInteger(qualifiersPerGroup) || qualifiersPerGroup < 1) {
          return res.status(400).json({
            message: "Qualifiers must be a positive whole number."
          });
        }

        const groupACount = await Registration.countDocuments({
          group: "A"
        });

        const groupBCount = await Registration.countDocuments({
          group: "B"
        });

        if (groupACount !== groupBCount || groupACount < 1) {
          return res.status(400).json({
            message: "Assign an equal number of teams to Group A and Group B first."
          });
        }

        if (qualifiersPerGroup > groupACount) {
          return res.status(400).json({
            message: `Qualifiers cannot exceed ${groupACount} teams per group.`
          });
        }
      }

      let settings = await TournamentSettings.findOne();

      if (!settings) {
        settings = new TournamentSettings();
      }

      settings.registrationOpen = registrationOpen;
      settings.tournamentStarted = tournamentStarted;

      if (groupAMatches !== undefined) {
        settings.groupAMatches = groupAMatches;
      }

      if (groupBMatches !== undefined) {
        settings.groupBMatches = groupBMatches;
      }

      if (qualifiersPerGroup !== undefined) {
        settings.qualifiersPerGroup = qualifiersPerGroup;
      }

      await settings.save();

      return res.json({
        message: "Tournament mode updated successfully.",
        registrationOpen: settings.registrationOpen,
        tournamentStarted: settings.tournamentStarted,
        groupAMatches: settings.groupAMatches ?? null,
        groupBMatches: settings.groupBMatches ?? null,
        qualifiersPerGroup: settings.qualifiersPerGroup ?? null
      });
    } catch (error) {
      console.error("Updating tournament mode failed:", error.message);

      return res.status(500).json({
        message: "Could not update tournament mode."
      });
    }
  }
);

// ADMIN: Get all registrations
app.get("/api/admin/registrations", verifyAdmin, async (req, res) => {
  try {
    const registrations = await Registration.find({})
    .select("ffUid ffName teamName contactNumber teamLogo group registeredAt")
    .sort({ registeredAt: -1 })
    .lean();
    return res.json({ registrations });
  } catch (error) {
    console.error("Loading registrations failed:", error.message);
    return res.status(500).json({
      message: "Could not load registrations."
    });
  }
});

// ADMIN: Assign a registered team to Group A, Group B, or Unassigned
app.put("/api/admin/registrations/:id/group", verifyAdmin, async (req, res) => {
  try {
    const settings = await TournamentSettings.findOne();
    if (!settings || settings.registrationOpen || settings.tournamentStarted) {
      return res.status(403).json({
        message: "Group assignment is allowed only when registration is closed and the tournament has not started."
      });
    }
    
    const { id } = req.params;
    const { group } = req.body || {};
      
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid registration ID."
      });
    }

    if (![ "A", "B", null ].includes(group)) {
      return res.status(400).json({
        message: "Group must be A, B, or null."
      });
    }
    
    const registration = await Registration.findByIdAndUpdate(id, { $set: { group } },
      { 
        new: true, runValidators: true 
      }
    ).select("_id ffUid ffName teamName group teamLogo registeredAt");
    
    if (!registration) {
      return res.status(404).json({
        message: "Registration not found."
     });
    }

    return res.json({
      message: "Team group saved successfully.", registration
    });
  } catch (error) {
    console.error("Saving team group failed:", error.message);
    return res.status(500).json({
      message: "Could not save the team group."
    });
  }
});

// PUBLIC: Read-only group lists for the standings page
app.get("/api/standings/teams", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");

    const registrations = await Registration.find({
      group: { $in: ["A", "B"] }
    })
    .select("_id teamName teamLogo group registeredAt")
    .sort({ teamName: 1 })
    .lean();
    
    return res.json({
      groups: {
        A: registrations.filter(team => team.group === "A"),
        B: registrations.filter(team => team.group === "B")
      }
    });
  } catch (error) {
    console.error("Loading public standings teams failed:", error.message);
    
    return res.status(500).json({
      message: "Could not load standings teams."
    });
  }
});

const ROUND_POINTS = {
  0: 10,
  1: 9,
  2: 8,
  3: 7,
  4: 6,
  5: 5,
  6: 4,
  7: 3
};

// ADMIN: Save a match result
app.post("/api/admin/standings/match", verifyAdmin, async (req, res) => {
  try {
    const { group, winnerId, loserId, loserRounds } = req.body || {};
    if (!["A", "B"].includes(group)) {
      return res.status(400).json({
        message: "Group must be A or B."
      });
    }

    if (!mongoose.isValidObjectId(winnerId) || !mongoose.isValidObjectId(loserId)) {
      return res.status(400).json({
        message: "Select valid winner and loser teams."
      });
    }
    
    if (winnerId === loserId) {
      return res.status(400).json({
        message: "Winner and loser cannot be the same team."
      });
    }

    if (!Number.isInteger(loserRounds) || loserRounds < 0 || loserRounds > 7) {
      return res.status(400).json({
        message: "Loser's rounds must be between 0 and 7."
      });
    }

    const assignedTeams = await Registration.find({group})
    .select("_id teamName")
    .lean();

    const winnerRegistration = assignedTeams.find(team => team._id.toString() === winnerId);
    
    const loserRegistration = assignedTeams.find(team => team._id.toString() === loserId);

    if (!winnerRegistration || !loserRegistration) {
      return res.status(400).json({
        message: "Both teams must be assigned to the selected group."
      });
    }

    let result = await MatchResults.findOne({ group });

    if (!result) {
      result = new MatchResults({
        group,
        teams: assignedTeams.map(team => ({
          registrationId: team._id,
          teamName: team.teamName,
          won: 0,
          lost: 0,
          roundsPoints: 0,
          totalPoints: 0
        })),
        history: []
      });
    }

    // Add newly assigned teams without resetting existing scores.
    for (const team of assignedTeams) {
      const exists = result.teams.some(saved => saved.registrationId.toString() === team._id.toString());

      if (!exists) {
        result.teams.push({
          registrationId: team._id,
          teamName: team.teamName,
          won: 0,
          lost: 0,
          roundsPoints: 0,
          totalPoints: 0
        });
      }
    }

    const winner = result.teams.find(team => team.registrationId.toString() === winnerId);
    const loser = result.teams.find(team => team.registrationId.toString() === loserId);
    if (!winner || !loser) {
      return res.status(400).json({
        message: "Could not find both teams in the score table."
      });
    }
    
    const settings = await TournamentSettings.findOne();
    const maxMatches = settings?.groupAMatches;
    
    if (!settings || !Number.isInteger(maxMatches) || maxMatches < 1 || settings.groupBMatches !== maxMatches) {
      return res.status(400).json({
        message: "Please configure the same valid match limit for both groups first."
      });
    }
    
    if (!Number.isInteger(maxMatches) || maxMatches < 1) {
      return res.status(400).json({
        message: `Please configure the match limit for Group ${group} first.`
      });
    }
    
    if (winner.won + winner.lost >= maxMatches || loser.won + loser.lost >= maxMatches) {
      return res.status(400).json({
        message: `A team in Group ${group} has reached its ${maxMatches}-match limit.`
      });
    }
    
    if (loserRounds === null || loserRounds === undefined || loserRounds === "" || !Number.isInteger(Number(loserRounds)) || Number(loserRounds) < 0 || Number(loserRounds) > 7) {
      return res.status(400).json({
        message: "Please select valid loser rounds (0–7)."
      });
    }
    
    const roundPoints = ROUND_POINTS[loserRounds];

    // Preserve the original Season 6 scoring rules.
    winner.won += 1;
    winner.roundsPoints += roundPoints;
    winner.totalPoints = winner.won * 4;

    loser.lost += 1;
    loser.roundsPoints -= roundPoints;
    loser.totalPoints = loser.won * 4;

    result.history.push({
      group,
      winnerId: winner.registrationId,
      loserId: loser.registrationId,
      loserRounds,
      winnerRoundPoints: roundPoints,
      loserRoundPoints: -roundPoints,
      winnerTotalPoints: winner.totalPoints,
      loserTotalPoints: loser.totalPoints
    });

    await result.save();

    return res.json({
      message: "Match result saved successfully.", group, teams: result.teams, history: result.history
    });
  } catch (error) {
    console.error("Saving match result failed:", error.message);
    return res.status(500).json({
      message: "Could not save match result."
    });
  }
});

app.post("/api/admin/standings/tie-breaker", verifyAdmin, async (req, res) => {
  try {
    const { group, team1Id, team2Id } = req.body || {};
    if (!["A", "B"].includes(group)) {
      return res.status(400).json({
        message: "Group must be A or B."
      });
    }

    if (!mongoose.isValidObjectId(team1Id) || !mongoose.isValidObjectId(team2Id)) {
      return res.status(400).json({
        message: "Select two valid teams."
      });
    }

    if (team1Id === team2Id) {
      return res.status(400).json({
        message: "Select two different teams."
      });
    }

    const assignedTeams = await Registration.find({ group })
    .select("_id teamName")
    .lean();
    
    const team1Registration = assignedTeams.find(team => team._id.toString() === team1Id);
    const team2Registration = assignedTeams.find(team => team._id.toString() === team2Id);
    
    if (!team1Registration || !team2Registration) {
      return res.status(400).json({
        message: "Both teams must belong to the selected group."
      });
    }

    let result = await MatchResults.findOne({ group });
    
    if (!result) {
      result = new MatchResults({group, 
        teams: assignedTeams.map(team => ({
          registrationId: team._id,
          teamName: team.teamName,
          won: 0,
          lost: 0,
          roundsPoints: 0,
          totalPoints: 0
        })),
        history: []
      });
    }

    // Add newly registered teams without resetting existing scores.
    for (const team of assignedTeams) {
      const exists = result.teams.some(saved => saved.registrationId.toString() === team._id.toString());
      if (!exists) {
        result.teams.push({
          registrationId: team._id,
          teamName: team.teamName,
          won: 0,
          lost: 0,
          roundsPoints: 0,
          totalPoints: 0
        });
      }
    }

    const team1 = result.teams.find(team => team.registrationId.toString() === team1Id);
    const team2 = result.teams.find(team => team.registrationId.toString() === team2Id);
    
    if (!team1 || !team2) {
      return res.status(400).json({
        message: "Could not find both teams in the score table."
      });
    }
    
    const settings = await TournamentSettings.findOne();
    const maxMatches = settings?.groupAMatches;
    
    if (!settings || !Number.isInteger(maxMatches) || maxMatches < 1 || settings.groupBMatches !== maxMatches) {
      return res.status(400).json({
        message:"Please configure the same valid match limit for both groups first."
      });
    }
    
    if (team1.won + team1.lost >= maxMatches || team2.won + team2.lost >= maxMatches) {
      return res.status(400).json({
        message: `A selected team has already reached its ${maxMatches}-match limit. Tie breaker cannot be saved.`
      });
    }

    // Apply the tie-breaker penalty to both teams.
    team1.lost += 1;
    team1.roundsPoints -= 10;

    team2.lost += 1;
    team2.roundsPoints -= 10;

    // totalPoints intentionally remains unchanged.
    result.history.push({
      type: "tieBreaker",
      group,
      team1Id: team1.registrationId,
      team2Id: team2.registrationId,
      team1RoundPoints: -10,
      team2RoundPoints: -10
    });

    await result.save();

    return res.json({
      message: "Tie breaker saved successfully.",
      group,
      teams: result.teams,
      history: result.history
    });
  } catch (error) {
    console.error("Saving tie breaker failed:", error);
    return res.status(500).json({
      message: "Could not save tie breaker."
    });
  }
});

app.get("/api/standings/points", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");

    const registrations = await Registration.find({group: { $in: ["A", "B"] }})
    .select("_id teamName teamLogo group")
    .sort({ teamName: 1 })
    .lean();

    const results = await MatchResults.find({group: { $in: ["A", "B"] }}).lean();
    const settings = await TournamentSettings.findOne().lean();
    const qualifiersPerGroup = settings?.qualifiersPerGroup ?? null;
    const groups = { A: [], B: [] };

    for (const group of ["A", "B"]) {
      const savedResult = results.find(result => result.group === group);
      const savedTeams = savedResult?.teams || [];
      groups[group] = registrations.filter(team => team.group === group).map(team => {
        const score = savedTeams.find(saved => saved.registrationId.toString() === team._id.toString());
        return {
          _id: team._id,
          teamName: team.teamName,
          teamLogo: team.teamLogo,
          played: (score?.won || 0) + (score?.lost || 0),
          won: score?.won || 0,
          lost: score?.lost || 0,
          roundsPoints: score?.roundsPoints || 0,
          totalPoints: score?.totalPoints || 0
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints || b.roundsPoints - a.roundsPoints).map((team, index) => ({
        ...team, qualificationStatus: Number.isInteger(qualifiersPerGroup) && qualifiersPerGroup >= 1 ? index < qualifiersPerGroup ? "Q" : "E" : null
      }));
    }

    return res.json({ groups });
  } catch (error) {
    console.error("Loading points table failed:", error.message);

    return res.status(500).json({
      message: "Could not load points table."
    });
  }
});


app.post("/api/admin/standings/:group/undo", verifyAdmin, async (req, res) => {
  try {
    const group = req.params.group;
    if (!["A", "B"].includes(group)) {
      return res.status(400).json({
        message: "Group must be A or B."
      });
    }

    const result = await MatchResults.findOne({ group });

    if (!result || result.history.length === 0) {
      return res.status(404).json({
        message: "No match history available to undo."
      });
    }

    const lastMatch = result.history[result.history.length - 1];
    if (lastMatch.type === "tieBreaker") {
      const team1 = result.teams.find(team => team.registrationId.toString() === lastMatch.team1Id.toString());
      const team2 = result.teams.find(team => team.registrationId.toString() === lastMatch.team2Id.toString());
      
      if (!team1 || !team2 || team1.lost < 1 || team2.lost < 1) {
        return res.status(409).json({
          message: "Cannot safely undo this tie breaker."
        });
      }
        
      team1.lost -= 1;
      team1.roundsPoints -= lastMatch.team1RoundPoints;
      team2.lost -= 1;
      team2.roundsPoints -= lastMatch.team2RoundPoints;

      // totalPoints remain unchanged.

    } else {
      const winner = result.teams.find(team => team.registrationId.toString() === lastMatch.winnerId.toString());
      const loser = result.teams.find(team => team.registrationId.toString() === lastMatch.loserId.toString());
      
      if (!winner || !loser || winner.won < 1 || loser.lost < 1) {
        return res.status(409).json({
          message: "Cannot safely undo this match."
        });
      }

      const roundPoints = lastMatch.winnerRoundPoints;
      winner.won -= 1;
      winner.roundsPoints -= roundPoints;
      winner.totalPoints = winner.won * 4;
      loser.lost -= 1;
      loser.roundsPoints += roundPoints;
      loser.totalPoints = loser.won * 4;
    }
    result.history.pop();
    await result.save();
    
    return res.json({
      message: "Last match undone successfully.",
      group,
      teams: result.teams,
      history: result.history
    });
  } catch (error) {
    console.error("Undo match failed:", error.message);
    return res.status(500).json({
      message: "Could not undo the last match."
    });
  }
});

function getCloudinaryPublicId(registration) {
  // Use the stored Cloudinary ID for new registrations.
  if (registration.teamLogoPublicId) {
    return registration.teamLogoPublicId;
  }

  // Support older registrations without a stored public ID.
  try {
    const url = new URL(registration.teamLogo);
    const marker = "/upload/";
    const uploadIndex = url.pathname.indexOf(marker);

    if (uploadIndex === -1) {
      return null;
    }

    let imagePath = url.pathname.substring(
      uploadIndex + marker.length
    );

    const segments = imagePath.split("/");

    // Remove an optional Cloudinary transformation segment.
    if (segments[0] && /^(?:[a-z]\w*_[^/]+,)*(?:c_[^/]+|w_[^/]+|h_[^/]+|q_[^/]+|f_[^/]+|t_[^/]+|e_[^/]+|ar_[^/]+|g_[^/]+|r_[^/]+|a_[^/]+|b_[^/]+|d_[^/]+|fl_[^/]+)(?:,.*)?$/i.test(segments[0])) {
      segments.shift();
    }

    imagePath = segments.join("/");

    // Remove the version number, such as v1234567890/.
    imagePath = imagePath.replace(/^v\d+\//, "");

    // Remove the image extension.
    return imagePath.replace(/\.[^/.]+$/, "");
  } catch (error) {
    return null;
  }
}

// ADMIN: Delete registration and its Cloudinary logo
app.delete("/api/admin/registrations/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid registration ID."
      });
    }

    const registration = await Registration.findById(id);

    if (!registration) {
      return res.status(404).json({
        message: "Registration not found."
      });
    }

    const publicId = getCloudinaryPublicId(registration);

    if (!publicId) {
      return res.status(500).json({
        message: "Could not identify the logo. Registration was not deleted."
      });
    }

    // Delete the image from Cloudinary first.
    const cloudResult = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image", invalidate: true
    });
    
    if (cloudResult.result !== "ok" && cloudResult.result !== "not found") {
      console.error("Cloudinary deletion failed:", cloudResult);
      return res.status(502).json({
        message: "Logo deletion failed. The registration was kept."
      });
    }

    // Remove the registration from MongoDB.
    await Registration.findByIdAndDelete(id);

    return res.json({
      message: "Registration and team logo deleted successfully.", deletedId: id
    });
  } catch (error) {
    console.error("Delete error:", error.message);
    return res.status(500).json({
      message: "Could not complete the deletion."
    });
  }
});

// Error handler for uploads and other middleware errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      message: "Logo upload failed. Maximum file size is 5 MB."
    });
  }

  if (error) {
    return res.status(400).json({
      message: error.message || "Something went wrong."
    });
  }

  return next();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
