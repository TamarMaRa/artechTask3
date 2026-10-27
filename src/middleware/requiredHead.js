const { ERROR_FORBIDDEN } = require("../status");

const requiredHead = (req, res, next) => {
  if (!req.isHead) {
    return res
      .status(ERROR_FORBIDDEN)
      .send({ error: "Only team heads can modify data" });
  }

  next();
};

module.exports = requiredHead;
