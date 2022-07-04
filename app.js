const express = require("express");
const cors = require("cors");

const { tpssRouter } = require("./routes/tpss.router");

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());

app.use("/split-payments/compute", tpssRouter);

const startServer = () => {
    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
    });
  };

startServer();
