const express = require("express");
const Member = require("../models/member");
const Team = require("../models/team");
const router = new express.Router();

//status
const STATUSE_CREATED = 201;
const STATUSE_BAD_REQUEST = 400;
const STATUSE_NOT_FOUND = 404;
const STATUSE_INTERNAL_SERVER_ERROR = 500;

//create
router.post("", async (req, res) => {
  const team = await Team.findById(req.body.team);

  if (!team) {
    return res.status(statusCodes.NOT_FOUND).send({ error: "Team not found" });
  }

  const member = new Member(req.body);

  try {
    await member.save();
    res.status(STATUSE_CREATED).send(member);
  } catch (error) {
    res.status(STATUSE_BAD_REQUEST).send({ error });
  }
});

//get all members
router.get("", async (req, res) => {
  try {
    const member = await Member.find({});
    res.send(member);
  } catch (error) {
    res.status(STATUSE_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//get member by id
router.get("/:id", async (req, res) => {
  const _id = req.params.id;
  try {
    const member = await Member.findById(_id);

    if (!member) {
      return res.status(STATUSE_NOT_FOUND).send({ error: "Soldier not found" });
    }

    res.send(member);
  } catch (error) {
    res.status(STATUSE_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//update
router.patch("/:id", async (req, res) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "team"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update),
  );

  if (!isValidOperation) {
    return res.status(STATUSE_BAD_REQUEST).send({ error: "Invalid updates!" });
  }

  try {
    const member = await Member.findById(_id);

    if (!member) {
      return res.status(STATUSE_NOT_FOUND).send({ error: "Soldier not found" });
    }

    updates.forEach((update) => (member[update] = req.body[update]));
    await member.save();
    res.send(member);
  } catch (error) {
    res.status(STATUSE_BAD_REQUEST).send({ error });
  }
});

//delete
router.delete("/:id", async (req, res) => {
  try {
    const member = await Member.findOneAndDelete({ _id: req.params.id });

    if (!member) {
      return res.status(STATUSE_NOT_FOUND).send({ error: "Soldier not found" });
    }

    res.send(member);
  } catch (error) {
    res.status(STATUSE_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//get member's team
router.get("/:id/team", async (req, res) => {
  const _id = req.params.id;
  try {
    const member = await Member.findById(_id);

    if (!member) {
      return res.status(STATUSE_NOT_FOUND).send({ error: "Soldier not found" });
    }

    const team = await Team.findById(member.team);

    if (!team) {
      return res.send(`${member.name} is not assigned to a team`);
    }

    res.send(`${member.name} is in team ${team.name}`);
  } catch (error) {
    res.status(STATUSE_INTERNAL_SERVER_ERROR).send({ error });
  }
});

module.exports = router;
