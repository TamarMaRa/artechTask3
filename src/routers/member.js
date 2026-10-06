const express = require("express");
const Member = require("../models/member");
const Team = require("../models/team");
const e = require("express");

const router = new express.Router();

//create member
router.post("/members", async (req, res) => {
  const team = await Team.findById(req.body.team);

  if (!team) {
    res.status(404).send({ error: "team doesnt exist" });
  }
  const member = new Member(req.body);

  try {
    await member.save();
    res.status(201).send(member);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

//get all members
router.get("/members", async (req, res) => {
  try {
    const member = await Member.find({});
    res.send(member);
  } catch (e) {
    res.status(500).send();
  }
});

//get member by id
router.get("/members/:id", async (req, res) => {
  const _id = req.params.id;

  try {
    const member = await Member.findOne({ _id });

    if (!member) {
      return res.status(404).send();
    }

    res.send(member);
  } catch (e) {
    res.status(500).send();
  }
});

//update member's data
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
  } catch (e) {
    console.log(e);

    res.status(400).send(e);
  }
});

//delete member
router.delete("/members/:id", async (req, res) => {
  const _id = req.params.id;

  try {
    const member = await Member.findOneAndDelete({ _id });

    if (!member) {
      res.status(404).send();
    }

    res.send(member);
  } catch (e) {
    res.status(500).send();
  }
});

//get member's team by id
router.get("/members/team/:id", async (req, res) => {
  const _id = req.params.id;

  try {
    const member = await Member.findOne({ _id });

    if (!member) {
      return res.status(404).send();
    }

    const team = await Team.findOne({ _id: member.team });

    if (!team) {
      return res.send(`${member.name} is not assigned to a team`);
    }

    res.send(`${member.name} is in team ${team.name}`);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
