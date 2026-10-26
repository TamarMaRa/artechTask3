const mongoose = require("mongoose");
const Soldier = require("./soldier");

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
});

//validate team head before saving
teamSchema.pre("save", async function (next) {
  const team = this;

  if(team.isModified("head")) {
    const head = await Soldier.findById(team.head);
    if(!head) {
      throw new Error("Soldier doesn't exists")
    }
  }
  next();
});

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
