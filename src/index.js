const express = require("express");
require("./db/mongoose");
const teamRouter = require("./routers/team");
const soldierRouter = require("./routers/soldier");

const app = express();
const port = process.env.PORT || 3006;

app.use(express.json());
app.use('/teams', teamRouter);
app.use('/soldiers', soldierRouter);

app.listen(port, () => {
  console.log("Server is up on port " + port);
});