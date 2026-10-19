const express = require("express");
const Soldier = require("../models/soldier");
const Team = require("../models/team");
const auth = require("../middleware/auth");
const requiredHead = require("../middleware/requiredHead");
const router = new express.Router();

//status
const STATUSE_CREATED = 201;
const STATUSE_BAD_REQUEST = 400;
const STATUSE_NOT_FOUND = 404;
const STATUSE_INTERNAL_SERVER_ERROR = 500;

//authentication functions
//login
router.post("/login", async (req, res) => {
  try {
    const soldier = await Soldier.findByCredentials(
      req.body.email,
      req.body.password,
    );
    const token = await soldier.generateAuthToken();
    res.send({ soldier, token });
  } catch (error) {
    res.status(STATUSE_BAD_REQUEST).send({ error: "incorrect credentials" });
  }
});

//logout
router.post("/logout", auth, async (req, res) => {
  try {
    req.soldier.tokens = req.soldier.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.soldier.save();

    res.send();
  } catch (error) {
    res.status(STATUSE_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//logout soldier from all
router.post("/logoutAll", auth, async (req, res) => {
  try {
    req.soldier.tokens = [];
    await req.soldier.save();
    res.send();
  } catch (error) {
    res.status(500).send({ error });
  }
});

//create
router.post("", auth, requiredHead, async (req, res) => {
  const soldier = new Soldier(req.body);
  const team = await Team.findById(req.body.team);

  if (!team) {
    if (soldier.team !== null) {
      return res.status(STATUSE_NOT_FOUND).send({ error: "Team not found" });
    }
  }

  try {
    await soldier.save();
    const token = await soldier.generateAuthToken();
    res.status(STATUSE_CREATED).send({ soldier, token });
  } catch (error) {
    console.log(error);
    res.status(STATUSE_BAD_REQUEST).send({ error });
  }
});

//get all soldiers
router.get("", auth, async (req, res) => {
  try {
    const soldier = await Soldier.find({});
    res.send(soldier);
  } catch (error) {
    res.status(STATUSE_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//get soldier by id
router.get("/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const soldier = await Soldier.findById(_id);

    if (!soldier) {
      return res.status(STATUSE_NOT_FOUND).send({ error: "Soldier not found" });
    }

    res.send(soldier);
  } catch (error) {
    res.status(STATUSE_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//update
router.patch("/:id", auth, requiredHead, async (req, res) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "personalNumber", "team"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update),
  );

  if (!isValidOperation) {
    return res.status(STATUSE_BAD_REQUEST).send({ error: "Invalid updates!" });
  }

  try {
    const soldier = await Soldier.findById(_id);

    if (!soldier) {
      return res.status(STATUSE_NOT_FOUND).send({ error: "Soldier not found" });
    }

    //validate team update
    if (updates.includes("team")) {
      const team = await Team.findById(req.body.team);
      if (!team) {
        return res
          .status(STATUSE_BAD_REQUEST)
          .send({ error: "Team does'nt exist" });
      }
    }

    updates.forEach((update) => (soldier[update] = req.body[update]));
    await soldier.save();
    res.send(soldier);
  } catch (error) {
    res.status(STATUSE_BAD_REQUEST).send({ error });
  }
});

//delete
router.delete("/:id", auth, requiredHead, async (req, res) => {
  try {
    await Team.updateMany({ head: req.params.id }, { $set: { head: null } });
    const soldier = await Soldier.findOneAndDelete({ _id: req.params.id });

    if (!soldier) {
      return res.status(STATUSE_NOT_FOUND).send({ error: "Soldier not found" });
    }

    res.send(soldier);
  } catch (error) {
    res.status(STATUSE_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//get soldier's team
router.get("/:id/team", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const soldier = await Soldier.findById(_id);

    if (!soldier) {
      return res.status(STATUSE_NOT_FOUND).send({ error: "Soldier not found" });
    }

    const team = await Team.findById(soldier.team);

    if (!team) {
      return res.send(`${soldier.name} is not assigned to a team`);
    }

    res.send(`${soldier.name} is in team ${team.name}`);
  } catch (error) {
    res.status(STATUSE_INTERNAL_SERVER_ERROR).send({ error });
  }
});

module.exports = router;
