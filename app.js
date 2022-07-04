const express = require("express");
const cors = require("cors");

const { tpssRouter } = require("./routes/tpss.router");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/split-payments/compute", tpssRouter);

module.exports = app;
