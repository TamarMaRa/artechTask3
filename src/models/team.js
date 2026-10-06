const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    validate(value) {
      const teams = ["web", "pixel", "creative", "express"];
      if (!teams.includes(value)) {
        throw new Error("team doesn't exist");
      }
    },
  },
  head: {
    type: String,
    required: true,
    trim: true,
  },
});

const Team = mongoose.model("Team", userSchema);

module.exports = Team;
