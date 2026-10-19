const jwt = require("jsonwebtoken");
const Soldier = require("../models/soldier");
const Team = require("../models/team");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, "thisismynewcourse");
    const soldier = await Soldier.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!soldier) {
      throw new Error();
    }

    const isHead = await Team.findOne({ head: soldier._id });
    console.log(1)
    console.log(isHead)

    req.token = token;
    req.soldier = soldier;
    req.isHead = Boolean(isHead);
    next();
  } catch (error) {
    console.log(error);
    res.status(401).send({ error: "Please authenticate." });
  }
};

module.exports = auth;
