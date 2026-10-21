const express = require("express");
const Soldier = require("../models/soldier");
const Team = require("../models/team");
const auth = require("../middleware/auth");
const requiredHead = require("../middleware/requiredHead");
const router = new express.Router();

//status
const STATUS_CREATED = 201;
const STATUS_BAD_REQUEST = 400;
const STATUS_NOT_FOUND = 404;
const STATUS_INTERNAL_SERVER_ERROR = 500;

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
    res.status(STATUS_BAD_REQUEST).send({ error: "incorrect credentials" });
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
    res.status(STATUS_INTERNAL_SERVER_ERROR).send({ error });
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
      return res.status(STATUS_NOT_FOUND).send({ error: "Team not found" });
    }
  }

  try {
    await soldier.save();
    const token = await soldier.generateAuthToken();
    res.status(STATUS_CREATED).send({ soldier, token });
  } catch (error) {
    res.status(STATUS_BAD_REQUEST).send({ error });
  }
});

//get all soldiers
router.get("", auth, async (req, res) => {
  try {
    const soldier = await Soldier.find({});
    res.send(soldier);
  } catch (error) {
    res.status(STATUS_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//get just soldiers names
router.get("/nonHeads", auth, async (req, res) => {
  try {
    const teams = await Team.find({}, "head");
    const teamHeads = teams.map((team) => team.head);
    const soldiers = await Soldier.find({ _id: { $nin: teamHeads } });

    if (!soldiers) {
      return res.status(STATUS_NOT_FOUND).send({ error: "No soldiers found" });
    }

    const soldiersNames = soldiers.map((soldier) => soldier.name);
    res.send(soldiersNames);
  } catch (error) {
    res.status(STATUS_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//get soldiers enlisted less than a year ago
router.get("/recentSoldiers", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const soldiers = await Soldier.find({
      enlistmentDate: { $gt: oneYearAgo },
    })
      .populate("teams")
      .skip(skip)
      .limit(limit);

    if (!soldiers) {
      return res.status(STATUS_NOT_FOUND).send({ error: "No soldiers found" });
    }

    res.send(soldiers);
  } catch (error) {
    res.status(STATUS_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//get and sort soldiers by enlistment date
//GET /sortPazam?sortBy=enlistmentDate:desc(-1) or asc(1)
router.get("/sortByPazam", auth, async (req, res) => {
  const sortOrder = {};

  try {
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(":");
      sortOrder[parts[0]] = parts[1] === "desc" ? -1 : 1;
    }

    const soldiers = await Soldier.find({}).sort(sortOrder);

    if (!soldiers) {
      return res.status(STATUS_NOT_FOUND).send({ error: "No soldiers found" });
    }

    res.send(soldiers);
  } catch (error) {
    res.status(STATUS_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//get and sort just team heads by team size
//GET /headsByTeamSize?sortBy=order:desc(-1) or asc(1)
router.get("/headsByTeamSize", auth, async (req, res) => {
  let sortOrder = {};

  try {
    const results = [];
    const teams = await Team.find({}).populate("head");

    if (!teams) {
      return res.status(STATUS_NOT_FOUND).send({ error: "No teams found" });
    }

    for (let i = 0; i < teams.length; i++) {
      if (teams[i].head) {
        let count = await Soldier.countDocuments({ team: teams[i]._id });
        results.push({
          head: teams[i].head,
          soldierCount: count,
        });
      }
    }

    if (req.query.sortBy) {
      sortOrder = req.query.sortBy.split(":");

      if (sortOrder[1] === "asc") {
        results.sort((a, b) => a.soldierCount - b.soldierCount);
      } else {
        results.sort((a, b) => b.soldierCount - a.soldierCount);
      }
    }

    const heads = results.map((item) => item.head);
    res.send(heads);
  } catch (error) {
    res.status(STATUS_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//get soldier by id
router.get("/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const soldier = await Soldier.findById(_id);

    if (!soldier) {
      return res.status(STATUS_NOT_FOUND).send({ error: "Soldier not found" });
    }

    res.send(soldier);
  } catch (error) {
    res.status(STATUS_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//update
router.patch("/:id", auth, requiredHead, async (req, res) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "name",
    "email",
    "personalNumber",
    "team",
    "enlistmentDate",
    "password",
  ];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update),
  );

  if (!isValidOperation) {
    return res.status(STATUS_BAD_REQUEST).send({ error: "Invalid updates!" });
  }

  try {
    const soldier = await Soldier.findById(_id);

    if (!soldier) {
      return res.status(STATUS_NOT_FOUND).send({ error: "Soldier not found" });
    }

    //validate team update
    if (updates.includes("team")) {
      const team = await Team.findById(req.body.team);
      if (!team) {
        return res
          .status(STATUS_BAD_REQUEST)
          .send({ error: "Team does'nt exist" });
      }
    }

    updates.forEach((update) => (soldier[update] = req.body[update]));
    await soldier.save();
    res.send(soldier);
  } catch (error) {
    res.status(STATUS_BAD_REQUEST).send({ error });
  }
});

//delete
router.delete("/:id", auth, requiredHead, async (req, res) => {
  try {
    await Team.updateMany({ head: req.params.id }, { $set: { head: null } });
    const soldier = await Soldier.findOneAndDelete({ _id: req.params.id });

    if (!soldier) {
      return res.status(STATUS_NOT_FOUND).send({ error: "Soldier not found" });
    }

    res.send(soldier);
  } catch (error) {
    res.status(STATUS_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//get soldier's team
router.get("/:id/team", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const soldier = await Soldier.findById(_id);

    if (!soldier) {
      return res.status(STATUS_NOT_FOUND).send({ error: "Soldier not found" });
    }

    const team = await Team.findById(soldier.team);

    if (!team) {
      return res.send(`${soldier.name} is not assigned to a team`);
    }

    res.send(`${soldier.name} is in team ${team.name}`);
  } catch (error) {
    res.status(STATUS_INTERNAL_SERVER_ERROR).send({ error });
  }
});

module.exports = router;
