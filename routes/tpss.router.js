const express = require("express");
const { httpPostTpss } = require("../controllers/tpss.controller");

const tpssRouter = express.Router();

tpssRouter.post("/", httpPostTpss);

module.exports = { tpssRouter };
