import express from "express";
import http from "http";
import { Server } from "socket.io";
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
import bloodRoutes from "./routes/blood.routes.js";
import crisisRoutes from "./routes/crisis.routes.js";
import ledgerRoutes from "./routes/ledger.routes.js";
import departmentWorkspaceRoutes from "./routes/departmentWorkspace.routes.js";
import messageRoutes from "./routes/message.routes.js";
import { SystemSetting } from "./models/SystemSetting.js";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Create HTTP server & Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

// Attach Socket.io instance to all requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// CORS Setup (Frontend origin + credentials true)
app.use(
  cors({
    origin: CLIENT_URL,
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
app.use("/api/blood", bloodRoutes);
app.use("/api/crisis", crisisRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/department-workspace", departmentWorkspaceRoutes);
app.use("/api/messages", messageRoutes);

// Public System Mode endpoint
app.get("/api/system/mode", async (req, res) => {
  try {
    let setting = await SystemSetting.findOne().lean();
    if (!setting) {
      setting = {
        isCrisisModeActive: false,
        crisisTitle: "Sylhet Regional Flood Relief Operation",
        emergencyHotline: "01792345238",
        reliefCampLocation: "Metropolitan University Student Center, Sylhet",
      };
    }
    return res.json({ success: true, setting });
  } catch (error) {
    return res.json({
      success: true,
      setting: { isCrisisModeActive: false, emergencyHotline: "01792345238" },
    });
  }
});

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
        department: dbUser?.department || null,
      },
    });
  } catch {
    return res.json({ success: true, user: req.user });
  }
});

// Socket.io Real-Time Event Handlers
io.on("connection", (socket) => {
  // Join user's personal alert room
  socket.on("join_user", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  // Join a specific conversation chat room
  socket.on("join_conversation", (conversationId) => {
    if (conversationId) {
      socket.join(`conversation_${conversationId}`);
    }
  });

  // Leave conversation room
  socket.on("leave_conversation", (conversationId) => {
    if (conversationId) {
      socket.leave(`conversation_${conversationId}`);
    }
  });

  // Join central Admin dispatch room
  socket.on("join_admin", () => {
    socket.join("admin_dispatch_room");
  });

  // Typing indicator
  socket.on("typing", ({ conversationId, userName, userRole }) => {
    if (conversationId) {
      socket.to(`conversation_${conversationId}`).emit("user_typing", {
        conversationId,
        userName,
        userRole,
      });
    }
  });

  // Stop typing
  socket.on("stop_typing", ({ conversationId }) => {
    if (conversationId) {
      socket.to(`conversation_${conversationId}`).emit("user_stop_typing", {
        conversationId,
      });
    }
  });

  socket.on("disconnect", () => {
    // Connection closed cleanly
  });
});

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`UnityGrid Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start UnityGrid Server:", error);
    process.exit(1);
  }
};

startServer();
