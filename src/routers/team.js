const express = require("express");
const Team = require("../models/team");
const Soldier = require("../models/soldier");
const router = new express.Router();

//status
const STATUSE_CREATED = 201;
const STATUSE_BAD_REQUEST = 400;
const STATUSE_NOT_FOUND = 404;
const STATUSE_INTERNAL_SERVER_ERROR = 500;

//create
router.post("", async (req, res) => {
  const team = new Team(req.body);

  //validate team head
  if (team.head !== undefined) {
    const teamHead = await Soldier.findById(req.body.head);
    if (!teamHead) {
      return res
        .status(STATUSE_BAD_REQUEST)
        .send({ error: "Soldier does'nt exist" });
    }
  }

  try {
    await team.save();
    res.status(STATUSE_CREATED).send(team);
  } catch (error) {
    res.status(STATUSE_BAD_REQUEST).send({ error });
  }
});

//read all
router.get("", async (req, res) => {
  try {
    const teams = await Team.find({});
    res.send(teams);
  } catch (error) {
    res.status(STATUSE_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//read by id
router.get("/:id", async (req, res) => {
  const _id = req.params.id;
  try {
    const team = await Team.findById(_id);

    if (!team) {
      return res.status(STATUSE_NOT_FOUND).send({ error: "Team not found" });
    }

    res.send(team);
  } catch (error) {
    res.status(STATUSE_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//update
router.patch("/:id", async (req, res) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "head"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update),
  );

  if (!isValidOperation) {
    return res.status(STATUSE_BAD_REQUEST).send({ error: "Invalid updates!" });
  }

  try {
    const team = await Team.findById(_id);

    if (!team) {
      return res.status(STATUSE_NOT_FOUND).send({ error: "Team not found" });
    }

    //validate team head update
    if (updates.includes("head")) {
      const teamHead = await Soldier.findById(req.body.head);
      if (!teamHead) {
        return res
          .status(STATUSE_BAD_REQUEST)
          .send({ error: "Soldier does'nt exist" });
      }
    }

    updates.forEach((update) => (team[update] = req.body[update]));
    await team.save();
    res.send(team);
  } catch (error) {
    res.status(STATUSE_BAD_REQUEST).send({ error });
  }
});

//delete
router.delete("/:id", async (req, res) => {
  try {
    await Soldier.updateMany({ team: req.params.id }, { $set: { team: null } });
    const team = await Team.findOneAndDelete({ _id: req.params.id });

    if (!team) {
      return res.status(STATUSE_NOT_FOUND).send({ error: "Team not found" });
    }

    res.send(team);
  } catch (error) {
    res.status(STATUSE_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//read head of team
router.get("/head/:id", async (req, res) => {
  const _id = req.params.id;
  try {
    const team = await Team.findById(_id);

    if (!team) {
      return res.status(STATUSE_NOT_FOUND).send({ error: "Team not found" });
    }

    if (team.head == null) {
      return res
        .status(STATUSE_NOT_FOUND)
        .send({ error: `${team.name} doesnt have a team leader` });
    }

    const teamHead = await Soldier.findById(team.head);

    res.send(`${teamHead.name} is head of ${team.name} team`);
  } catch (error) {
    res.status(STATUSE_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//read all team members of a team
router.get("/soldiers/:id", async (req, res) => {
  const _id = req.params.id;
  try {
    const team = await Team.findById(_id);

    if (!team) {
      return res.status(STATUSE_NOT_FOUND).send({ error: "Team not found" });
    }

    const soldiers = await Soldier.find({ team: team._id });

    res.send(soldiers);
  } catch (error) {
    res.status(STATUSE_INTERNAL_SERVER_ERROR).send({ error });
  }
});

// //returns number of members in a team
router.get("/soldiers/count/:id", async (req, res) => {
  const _id = req.params.id;
  try {
    const team = await Team.findById(_id);

    if (!team) {
      return res.status(STATUSE_NOT_FOUND).send({ error: "Team not found" });
    }

    const soldiersCount = await Soldier.countDocuments({ team: team._id });
    res.send(`${team.name} has ${soldiersCount} soldiers`);
  } catch (error) {
    res.status(STATUSE_INTERNAL_SERVER_ERROR).send({ error });
  }
});

module.exports = router;
