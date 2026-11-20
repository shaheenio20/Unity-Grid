import express from "express";
import cors from "cors";
import "dotenv/config";
import { toNodeHandler } from "better-auth/node";
import { connectDB } from "./config/db.js";
import { auth } from "./config/betterAuth.js";
import { requireAuth } from "./middleware/requireRole.js";
import { User } from "./models/User.js";
import departmentRoutes from "./routes/department.routes.js";
import clubRoutes from "./routes/club.routes.js";
import eventRoutes from "./routes/event.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

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

// Mount API Routes
app.use("/api/departments", departmentRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/admin", adminRoutes);

// Health Check & Test Routes
app.get("/", (req, res) => {
  res.json({ success: true, message: "UnityGrid Server is Running!" });
});

app.get("/api/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const dbUser = await User.findById(userId).lean();
    return res.json({
      success: true,
      user: {
        ...req.user,
        role: dbUser?.role || req.user.role || "Student",
      },
    });
  } catch {
    return res.json({ success: true, user: req.user });
  }
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`UnityGrid Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start UnityGrid Server:", error);
    process.exit(1);
  }
};

startServer();
