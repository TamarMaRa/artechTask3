const jwt = require("jsonwebtoken");
const Soldier = require("../models/soldier");
const Team = require("../models/team");

require("dotenv").config();
const bearer_token = process.env.BEARER_TOKEN;

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, bearer_token);
    const soldier = await Soldier.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!soldier) {
      throw new Error();
    }

    const isHead = await Team.findOne({ head: soldier._id });

    req.token = token;
    req.soldier = soldier;
    req.isHead = Boolean(isHead);
    next();
  } catch (error) {
    res.status(401).send({ error: "Please authenticate." });
  }
};

module.exports = auth;
