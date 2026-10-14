const mongoose = require("mongoose");
const Team = require("./team");

const soldierSchema = new mongoose.Schema({
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

soldierSchema.pre("save", async function (next, req,res) {
  const soldier = this;

  if (soldier.isModified("team")) {
    const team = await Team.findById(soldier.team);

    if (!team) {
       return res.status(404).send({ error: "team doesnt exist" });
    }
  }
  next();
});

const Soldier = mongoose.model("Soldier", soldierSchema);

module.exports = Soldier;
