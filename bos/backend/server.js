
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config();

const Registration = require("./registration");

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

// PUBLIC: Register a team
app.post("/api/register", upload.single("teamLogo"), async (req, res) => {
  try {
    const { ffUid, ffName, teamName, contactNumber } = req.body;

    if (
      !ffUid ||
      !ffName ||
      !teamName ||
      !contactNumber ||
      !req.file
    ) {
      return res.status(400).json({
        message: "Please complete all fields and upload your team logo."
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
    valueBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(valueBuffer, expectedBuffer)
  );
}

// ADMIN: Login
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {};

  if (
    !process.env.ADMIN_USERNAME ||
    !process.env.ADMIN_PASSWORD ||
    !process.env.JWT_SECRET
  ) {
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

    if (
      decoded.role !== "admin" ||
      decoded.username !== process.env.ADMIN_USERNAME
    ) {
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

// ADMIN: Get all registrations
app.get(
  "/api/admin/registrations",
  verifyAdmin,
  async (req, res) => {
    try {
      const registrations = await Registration.find({})
        .select(
          "ffUid ffName teamName contactNumber teamLogo registeredAt"
        )
        .sort({ registeredAt: -1 })
        .lean();

      return res.json({ registrations });
    } catch (error) {
      console.error("Loading registrations failed:", error.message);

      return res.status(500).json({
        message: "Could not load registrations."
      });
    }
  }
);

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
    if (
      segments[0] &&
      /^(?:[a-z]\w*_[^/]+,)*(?:c_[^/]+|w_[^/]+|h_[^/]+|q_[^/]+|f_[^/]+|t_[^/]+|e_[^/]+|ar_[^/]+|g_[^/]+|r_[^/]+|a_[^/]+|b_[^/]+|d_[^/]+|fl_[^/]+)(?:,.*)?$/i.test(segments[0])
    ) {
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
app.delete(
  "/api/admin/registrations/:id",
  verifyAdmin,
  async (req, res) => {
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
      const cloudResult = await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type: "image",
          invalidate: true
        }
      );

      if (
        cloudResult.result !== "ok" &&
        cloudResult.result !== "not found"
      ) {
        console.error("Cloudinary deletion failed:", cloudResult);

        return res.status(502).json({
          message: "Logo deletion failed. The registration was kept."
        });
      }

      // Remove the registration from MongoDB.
      await Registration.findByIdAndDelete(id);

      return res.json({
        message: "Registration and team logo deleted successfully.",
        deletedId: id
      });
    } catch (error) {
      console.error("Delete error:", error.message);

      return res.status(500).json({
        message: "Could not complete the deletion."
      });
    }
  }
);

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
