const express = require("express");
const Soldier = require("../models/soldier");
const Team = require("../models/team");
const auth = require("../middleware/auth");
const requiredHead = require("../middleware/requiredHead");
const router = new express.Router();

const {
  STATUS_CREATED,
  STATUS_BAD_REQUEST,
  STATUS_NOT_FOUND,
  STATUS_INTERNAL_SERVER_ERROR,
} = require("../status");

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
    res.status(STATUS_INTERNAL_SERVER_ERROR).send({ error });
  }
});

//create
router.post("", auth, requiredHead, async (req, res) => {
  const soldier = new Soldier(req.body);

  if (soldier.team !== undefined) {
    const team = await Team.findById(req.body.team);
    if (!team) {
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
//sort soldiers by enlistment date
//GET ?sortBy=enlistmentDate:desc(-1) or asc(1)
router.get("", auth, async (req, res) => {
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

//get just soldiers names
router.get("/nonHeads", auth, async (req, res) => {
  try {
    const teams = await Team.find({}).select("head");
    const teamHeads = teams.map((team) => team.head);
    const soldiers = await Soldier.find({ _id: { $nin: teamHeads } }).select(
      "name",
    );

    if (!soldiers) {
      return res.status(STATUS_NOT_FOUND).send({ error: "No soldiers found" });
    }

    res.send(soldiers);
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
      .populate("team")
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

router.get("/headsByTeamSize", auth, async (req, res) => {
  let sortOrder = -1;

  if (req.query.sortBy) {
    const sortBy = req.query.sortBy.split(":");

    if (sortBy[1] === "asc") {
      sortOrder = 1;
    }
  }

  try {
    const heads = await Team.aggregate([
      {
        $match: {
          head: { $ne: null },
        },
      },
      {
        $lookup: {
          from: Soldier.collection.name,
          localField: "_id",
          foreignField: "team",
          as: "soldiers",
        },
      },
      {
        $addFields: {
          soldierCount: { $size: "$soldiers" },
        },
      },
      {
        $sort: {
          soldierCount: sortOrder,
        },
      },
      {
        $lookup: {
          from: Soldier.collection.name,
          localField: "head",
          foreignField: "_id",
          as: "headSoldier",
        },
      },
      {
        $unwind: "$headSoldier",
      },
      {
        $replaceRoot: {
          newRoot: "$headSoldier",
        },
      },
    ]);

    if (!heads) {
      return res
        .status(STATUS_NOT_FOUND)
        .send({ error: "No team heads found" });
    }

    res.status(200).send(heads);
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
