const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Team = require("./team");

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
    match: [/^\d{7}$/, "must be 7 characters and contain only numbers"],
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    ref: "Team",
  },
  enlistmentDate: {
    type: Date,
    required: true,
    max: new Date().toJSON().slice(0, 10),
  },
  password: {
    type: String,
    required: true,
    minlength: 7,
    trim: true,
    validate(value) {
      if (value.toLowerCase().includes("password")) {
        throw new Error('Password cannot contain "password"');
      }
    },
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
});

soldierSchema.methods.toJSON = function () {
  const soldier = this;
  const soldierObject = soldier.toObject();

  delete soldierObject.password;
  delete soldierObject.tokens;

  return soldierObject;
};

soldierSchema.methods.generateAuthToken = async function () {
  const soldier = this;
  const isHead = await Team.findOne({ head: soldier._id });
  const token = jwt.sign(
    { _id: soldier._id.toString(), isHead: isHead },
    "thisismynewcourse",
  );

  soldier.tokens = soldier.tokens.concat({ token });
  await soldier.save();

  return token;
};

soldierSchema.statics.findByCredentials = async (email, password) => {
  const soldier = await Soldier.findOne({ email });

  if (!soldier) {
    throw new Error("Unable to login");
  }

  const isMatch = await bcrypt.compare(password, soldier.password);

  if (!isMatch) {
    throw new Error("Unable to login");
  }

  return soldier;
};

// Hash the plain text password before saving
soldierSchema.pre("save", async function (next) {
  const soldier = this;

  if (soldier.isModified("password")) {
    soldier.password = await bcrypt.hash(soldier.password, 8);
  }
  next();
});

const Soldier = mongoose.model("Soldier", soldierSchema);

module.exports = Soldier;
