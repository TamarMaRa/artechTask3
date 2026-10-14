const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    enum: ["web", "pixel", "creative", "express"],
  },
  head: {
    type: String,
    required: true,
    trim: true,
  },
});

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
