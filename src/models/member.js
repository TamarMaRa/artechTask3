const mongoose = require("mongoose");
const Team = require("./team");

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
});

memberSchema.pre("save", async function (next, req,res) {
  const member = this;

  if (member.isModified("team")) {
    const team = await Team.findById(member.team);

    if (!team) {
       return res.status(404).send({ error: "team doesnt exist" });
    }
  }
  next();
});

const Member = mongoose.model("Member", memberSchema);

module.exports = Member;
