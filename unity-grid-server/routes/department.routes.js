import express from "express";
import { Department } from "../models/Department.js";
import { Club } from "../models/Club.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

// GET /api/departments - Public
// Lists all departments with their associated clubs
router.get("/", async (req, res) => {
  try {
    const departments = await Department.find().sort({ code: 1 }).lean();
    const departmentIds = departments.map((d) => d._id);
    const clubs = await Club.find({ departmentId: { $in: departmentIds } }).lean();

    const formatted = departments.map((dept) => ({
      ...dept,
      clubs: clubs.filter((c) => String(c.departmentId) === String(dept._id)),
    }));

    return res.json({ success: true, departments: formatted });
  } catch (error) {
    console.error("Error fetching departments:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch departments." });
  }
});

// GET /api/departments/:id - Public
router.get("/:id", async (req, res) => {
  try {
    const department = await Department.findById(req.params.id).lean();
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found." });
    }

    const clubs = await Club.find({ departmentId: department._id }).lean();
    return res.json({
      success: true,
      department: {
        ...department,
        clubs,
      },
    });
  } catch (error) {
    console.error("Error fetching department:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch department." });
  }
});

// POST /api/departments - Admin only
router.post("/", requireRole(["Admin"]), async (req, res) => {
  try {
    const { name, code, description, headOfDept } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Department name and code are required.",
      });
    }

    const existing = await Department.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Department with code '${code.toUpperCase()}' already exists.`,
      });
    }

    const department = new Department({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description || "",
      headOfDept: headOfDept || "",
    });

    await department.save();
    return res.status(201).json({ success: true, department });
  } catch (error) {
    console.error("Error creating department:", error);
    return res.status(500).json({ success: false, message: "Failed to create department." });
  }
});

// PATCH /api/departments/:id - Admin only
router.patch("/:id", requireRole(["Admin"]), async (req, res) => {
  try {
    const { name, code, description, headOfDept } = req.body;
    const updates = {};

    if (name) updates.name = name.trim();
    if (code) updates.code = code.trim().toUpperCase();
    if (description !== undefined) updates.description = description;
    if (headOfDept !== undefined) updates.headOfDept = headOfDept;

    const department = await Department.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found." });
    }

    return res.json({ success: true, department });
  } catch (error) {
    console.error("Error updating department:", error);
    return res.status(500).json({ success: false, message: "Failed to update department." });
  }
});

// DELETE /api/departments/:id - Admin only
router.delete("/:id", requireRole(["Admin"]), async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found." });
    }

    return res.json({ success: true, message: "Department deleted successfully." });
  } catch (error) {
    console.error("Error deleting department:", error);
    return res.status(500).json({ success: false, message: "Failed to delete department." });
  }
});

export default router;

