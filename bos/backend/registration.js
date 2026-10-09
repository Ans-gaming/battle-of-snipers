
const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema({
  ffUid: {
    type: String,
    required: true,
    trim: true
  },
  ffName: {
    type: String,
    required: true,
    trim: true
  },
  teamName: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  teamLogo: {
    type: String,
    required: true
  },
  teamLogoPublicId: {
    type: String,
    default: null
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model(
  "Registration",
  registrationSchema,
  "registrations"
);
