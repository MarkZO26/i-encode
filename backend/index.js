const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Dito papasok ang /api/signup at /api/login
app.use("/api", authRoutes);

app.get("/", (req, res) => {
  res.send("🚀 EncodeGrade Backend is Running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));