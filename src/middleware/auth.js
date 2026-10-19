const jwt = require("jsonwebtoken");
const Soldier = require("../models/soldier");
const auth = async (req, res, next) => {
  try {
    console.log(req.header("Authorization"));
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, "thisismynewcourse");
    const soldier = await Soldier.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });
    if (!soldier) {
      throw new Error();
    }

    req.token = token;
    req.soldier = soldier;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).send({ error: "Please authenticate." });
  }
};

module.exports = auth;
