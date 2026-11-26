import express from "express";
import { User } from "../models/User.js";
import { Department } from "../models/Department.js";
import { Club } from "../models/Club.js";
import { Event } from "../models/Event.js";
import { requireRole } from "../middleware/requireRole.js";
import { auth } from "../config/betterAuth.js";

const router = express.Router();

// All routes in this file require Admin role
router.use(requireRole(["Admin"]));

router.post("/department-accounts", async (req, res) => {
  try {
    const { departmentId, email, password } = req.body;
    if (!departmentId || !email || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ success: false, message: "Department, email and a password of at least 8 characters are required." });
    }
    const department = await Department.findById(departmentId);
    if (!department) return res.status(404).json({ success: false, message: "Department not found." });
    const result = await auth.api.signUpEmail({ body: { name: department.name, email: email.trim(), password } });
    const user = await User.findByIdAndUpdate(result.user.id, { role: "Department", department: String(department._id) }, { returnDocument: "after", runValidators: true });
    if (!user) throw new Error("Created account could not be assigned to a department.");
    return res.status(201).json({ success: true, message: "Department account created." });
  } catch (error) {
    console.error("Department account creation failed:", error);
    return res.status(400).json({ success: false, message: "Could not create account. Check the email and try again." });
  }
});

// GET /api/admin/stats - Quick stats overview
router.get("/stats", async (req, res) => {
  try {
    const [departmentsCount, clubsCount, eventsCount, usersCount] = await Promise.all([
      Department.countDocuments(),
      Club.countDocuments(),
      Event.countDocuments(),
      User.countDocuments(),
    ]);

    return res.json({
      success: true,
      stats: {
        departmentsCount,
        clubsCount,
        eventsCount,
        usersCount,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch stats." });
  }
});

// GET /api/admin/users - List platform users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role department studentId phone createdAt")
      .populate("department", "name code")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
});

// PATCH /api/admin/users/:userId/role - Modify user role (Admin, Member, Student)
router.patch("/users/:userId/role", async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["Admin", "Member", "Student"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: { role } },
      { returnDocument: "after" }
    ).select("name email role");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({ success: false, message: "Failed to update role." });
  }
});

export default router;

