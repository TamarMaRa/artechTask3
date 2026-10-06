const mongoose = require("mongoose");
const Team = require("./team");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  team: {
    type: String,
    required: true,
  },
});

userSchema.pre("save", async function (next) {
  const member = this;

  if (member.isModified("team")) {
    const team = await Team.findById(member.team);

    if (!team) {
      res.status(404).send({ error: "team doesnt exist" });
    }
  }
  next();
});

const Member = mongoose.model("Member", userSchema);

module.exports = Member;
