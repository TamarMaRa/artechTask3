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
    type: mongoose.Schema.Types.ObjectId,
    ref: "Soldier",
    trim: true,
  },
  soldiers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Soldier"
  }]
});

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
