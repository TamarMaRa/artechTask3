const mongoose = require("mongoose");
const path = require("path")
require("dotenv").config({path: path.resolve(__dirname, "../../.env")});

const connectionString = process.env.MONGO_URI;

mongoose.connect(connectionString, {});
