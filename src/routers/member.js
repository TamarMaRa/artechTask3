const express = require("express");
const Member = require("../models/member");
const Team = require("../models/team");
const router = new express.Router();

//create
router.post("/members", async (req, res) => {
  const team = await Team.findById(req.body.team);

  if (!team) {
    res.status(404).send({ error: "team doesnt exist" });
  }

  const member = new Member(req.body);

  try {
    await member.save();
    res.status(201).send(member);
  } catch (error) {
    res.status(400).send(error);
  }
});

//get all members
router.get("/members", async (req, res) => {
  try {
    const member = await Member.find({});
    res.send(member);
  } catch (error) {
    res.status(500).send();
  }
});

//get member by id
router.get("/members/:id", async (req, res) => {
  try {
    const member = await Member.findOne({ _id: req.params.id });

    if (!member) {
      return res.status(404).send();
    }

    res.send(member);
  } catch (error) {
    res.status(500).send();
  }
});

//update
router.patch("/members/:id", async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "team"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update),
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const member = await Member.findOne({
      _id: req.params.id,
    });

    if (!member) {
      return res.status(404).send();
    }

    updates.forEach((update) => (member[update] = req.body[update]));
    await member.save();
    res.send(member);
  } catch (error) {
    res.status(400).send(error);
  }
});

//delete
router.delete("/members/:id", async (req, res) => {
  try {
    const member = await Member.findOneAndDelete({ _id: req.params.id });

    if (!member) {
      res.status(404).send();
    }

    res.send(member);
  } catch (error) {
    res.status(500).send();
  }
});

//get member's team
router.get("/members/team/:id", async (req, res) => {
  try {
    const member = await Member.findOne({ _id: req.params.id });

    if (!member) {
      return res.status(404).send();
    }

    const team = await Team.findOne({ _id: member.team });

    if (!team) {
      return res.send(`${member.name} is not assigned to a team`);
    }

    res.send(`${member.name} is in team ${team.name}`);
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;
