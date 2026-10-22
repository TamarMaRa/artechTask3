const ERROR_FORBIDDEN = 403;
const requiredHead = (req, res, next) => {
  if (req.isHead !== true) {
    return res
      .status(ERROR_FORBIDDEN)
      .send({ error: "Only team heads can modify data" });
  }

  next();
};

module.exports = requiredHead;
