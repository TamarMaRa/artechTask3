const mongoose = require("mongoose");
const validator = require("validator");

const soldierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Email is invalid");
      }
    },
  },
  personalNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^\d{7}$/, "must be 7 characters and contain only numbers"]
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    ref: "Team",
  },
});

const Soldier = mongoose.model("Soldier", soldierSchema);

module.exports = Soldier;
