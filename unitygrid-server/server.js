import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import connectDB from "./config/db.js";
import { auth } from "./config/betterAuth.js";
import { requireAuth } from "./middleware/requireAuth.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Connect MongoDB
connectDB();

// CORS Setup (Frontend origin + credentials true)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Better Auth Route (MUST be before express.json)
app.all("/api/auth{/*splat}", toNodeHandler(auth));

// JSON Body Parser
app.use(express.json());

// Health Check & Test Routes
app.get("/", (req, res) => {
  res.json({ success: true, message: "UnityGrid Server is Running!" });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.listen(PORT, () => {
  console.log(`UnityGrid Server running on http://localhost:${PORT}`);
});