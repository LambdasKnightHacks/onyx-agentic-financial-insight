const express = require("express");
const cors = require("cors");
require("dotenv").config();

const plaidRoutes = require("./routes/plaidRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Plaid Authentication API is running!",
    version: "2020-09-14",
    status: "healthy",
  });
});

app.use("/api/plaid", plaidRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`Plaid Authentication API running on port ${PORT}`);
  console.log(`Make sure to set up your .env file with Plaid credentials`);
  console.log(`Visit http://localhost:${PORT} to test the API`);
});

module.exports = app;
