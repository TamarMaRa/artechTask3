const express = require("express");
require("./db/mongoose");
const teamRouter = require("./routers/team");
const memberRouter = require("./routers/member");

const app = express();
const port = process.env.PORT || 3006;

app.use(express.json());
app.use('/teams', teamRouter);
app.use('/soldiers', memberRouter);

app.listen(port, () => {
  console.log("Server is up on port " + port);
});