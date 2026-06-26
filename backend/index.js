const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();

// I-configure ang CORS para payagan lang ang iyong Vercel frontend
const corsOptions = {
  origin: "https://i-encode.vercel.app", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};

app.use(cors(corsOptions)); 
app.use(express.json());

// Dito papasok ang /api/signup at /api/login
app.use("/api", authRoutes);

app.get("/", (req, res) => {
  res.send("🚀 EncodeGrade Backend is Running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
