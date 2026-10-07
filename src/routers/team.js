const express = require("express");
const Team = require("../models/team");
const Member = require("../models/member");
const router = new express.Router();

//create
router.post("/teams", async (req, res) => {
  const teams = new Team(req.body);

  try {
    await teams.save();
    res.status(201).send(teams);
  } catch (error) {
    res.status(400).send(error);
  }
});

//read all
router.get("/teams", async (req, res) => {
  try {
    const teams = await Team.find({});
    res.send(teams);
  } catch (error) {
    res.status(500).send();
  }
});

//read by id
router.get("/teams/:id", async (req, res) => {
  try {
    const teams = await Team.find({ _id: req.params.id });
    res.send(teams);
  } catch (error) {
    res.status(500).send();
  }
});

//update
router.patch("/teams/:id", async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "head"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update),
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const team = await Team.findOne({ _id: req.params.id });

    if (!team) {
      return res.status(404).send();
    }

    updates.forEach((update) => (team[update] = req.body[update]));
    await team.save();
    res.send(team);
  } catch (error) {
    res.status(400).send(error);
  }
});

//delete
router.delete("/teams/:id", async (req, res) => {
  try {
    await Member.updateMany(
      { team: req.params.id },
      { $set: { team: "not assigned" } },
    );
    const team = await Team.findOneAndDelete({ _id: req.params.id });

    if (!team) {
      res.status(404).send();
    }

    res.send(team);
  } catch (error) {
    res.status(500).send();
  }
});

//read head of team
router.get("/teams/head/:id", async (req, res) => {
  try {
    const teams = await Team.find({ _id: req.params.id });
    res.send(`${teams[0].head} is head of ${teams[0].name} team`);
  } catch (error) {
    res.status(500).send();
  }
});

//read all team members of a team
router.get("/teams/members/:id", async (req, res) => {
  try {
    const team = await Team.find({ _id: req.params.id });
    const members = await Member.find({ team: team[0]._id });
    res.send(members);
  } catch (error) {
    res.status(500).send();
  }
});

//returns number of members in a team
router.get("/teams/members/count/:id", async (req, res) => {
  try {
    const team = await Team.find({ _id: req.params.id });
    const members = await Member.find({ team: team[0]._id });
    res.send(`${team[0].name} has ${members.length} members`);
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;
