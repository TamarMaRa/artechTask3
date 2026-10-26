const express = require("express");
const Team = require("../models/team");
const Soldier = require("../models/soldier");
const auth = require("../middleware/auth");
const requiredHead = require("../middleware/requiredHead");
const router = new express.Router();

const {
  STATUS_CREATED,
  STATUS_BAD_REQUEST,
  STATUS_NOT_FOUND,
  STATUS_INTERNAL_SERVER_ERROR,
} = require("../status");

//create
router.post("", auth, requiredHead, async (req, res) => {
  const team = new Team(req.body);

  try {
    await team.save();
    res.status(STATUS_CREATED).send(team);
  } catch (error) {
    res.status(STATUS_BAD_REQUEST).send({ error });
  }
});

//read all
router.get("", auth, async (req, res) => {
  try {
    const teams = await Team.find({});
    res.send(teams);
  } catch (error) {
    res.status(STATUS_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//read by id
router.get("/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const team = await Team.findById(_id);

    if (!team) {
      return res.status(STATUS_NOT_FOUND).send({ error: "Team not found" });
    }

    res.send(team);
  } catch (error) {
    res.status(STATUS_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//update
router.patch("/:id", auth, requiredHead, async (req, res) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "head"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update),
  );

  if (!isValidOperation) {
    return res.status(STATUS_BAD_REQUEST).send({ error: "Invalid updates!" });
  }

  try {
    const team = await Team.findById(_id);

    if (!team) {
      return res.status(STATUS_NOT_FOUND).send({ error: "Team not found" });
    }

    updates.forEach((update) => (team[update] = req.body[update]));
    await team.save();
    res.send(team);
  } catch (error) {
    res.status(STATUS_BAD_REQUEST).send({ error });
  }
});

//delete
router.delete("/:id", auth, requiredHead, async (req, res) => {
  try {
    await Soldier.updateMany({ team: req.params.id }, { $set: { team: null } });
    const team = await Team.findOneAndDelete({ _id: req.params.id });

    if (!team) {
      return res.status(STATUS_NOT_FOUND).send({ error: "Team not found" });
    }

    res.send(team);
  } catch (error) {
    res.status(STATUS_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//read head of team
router.get("/head/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const team = await Team.findById(_id);

    if (!team) {
      return res.status(STATUS_NOT_FOUND).send({ error: "Team not found" });
    }

    if (team.head == null) {
      return res
        .status(STATUS_NOT_FOUND)
        .send({ error: `${team.name} doesnt have a team leader` });
    }

    const teamHead = await Soldier.findById(team.head);

    res.send(`${teamHead.name} is head of ${team.name} team`);
  } catch (error) {
    res.status(STATUS_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//read all team members of a team
router.get("/soldiers/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const team = await Team.findById(_id);

    if (!team) {
      return res.status(STATUS_NOT_FOUND).send({ error: "Team not found" });
    }

    const soldiers = await Soldier.find({ team: team._id });

    res.send(soldiers);
  } catch (error) {
    res.status(STATUS_INTERNAL_SERVER_ERROR).send({ error });
  }
});

// //returns number of members in a team
router.get("/soldiers/count/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const team = await Team.findById(_id);

    if (!team) {
      return res.status(STATUS_NOT_FOUND).send({ error: "Team not found" });
    }

    const soldiersCount = await Soldier.countDocuments({ team: team._id });
    res.send(`${team.name} has ${soldiersCount} soldiers`);
  } catch (error) {
    res.status(STATUS_INTERNAL_SERVER_ERROR).send({ error });
  }
});

module.exports = router;
