import express from "express";
import { Club } from "../models/Club.js";
import { Event } from "../models/Event.js";
import { Department } from "../models/Department.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

// GET /api/clubs - Public
// Supports query: ?departmentId=...
router.get("/", async (req, res) => {
  try {
    const { departmentId } = req.query;
    const filter = {};
    if (departmentId) {
      filter.departmentId = departmentId;
    }

    const clubs = await Club.find(filter)
      .populate("departmentId", "name code")
      .populate("committee.userId", "name email image role")
      .sort({ name: 1 })
      .lean();

    return res.json({ success: true, clubs });
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch clubs." });
  }
});

// GET /api/clubs/:clubId - Public
// Returns populated club with executive committee profiles and active events
router.get("/:clubId", async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId)
      .populate("departmentId", "name code description headOfDept")
      .populate("committee.userId", "name email image role department studentId phone")
      .lean();

    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found." });
    }

    const events = await Event.find({ clubId: club._id })
      .sort({ startDate: 1 })
      .lean();

    return res.json({
      success: true,
      club: {
        ...club,
        events,
      },
    });
  } catch (error) {
    console.error("Error fetching club details:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch club details." });
  }
});

// POST /api/clubs - Admin only
router.post("/", requireRole(["Admin"]), async (req, res) => {
  try {
    const { name, code, departmentId, description, logo, committee } = req.body;

    if (!name || !code || !departmentId) {
      return res.status(400).json({
        success: false,
        message: "Club name, code, and departmentId are required.",
      });
    }

    const departmentExists = await Department.findById(departmentId);
    if (!departmentExists) {
      return res.status(404).json({
        success: false,
        message: "Specified Department not found.",
      });
    }

    const club = new Club({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      departmentId,
      description: description || "",
      logo: logo || "",
      committee: Array.isArray(committee) ? committee : [],
    });

    await club.save();
    await club.populate("departmentId", "name code");
    return res.status(201).json({ success: true, club });
  } catch (error) {
    console.error("Error creating club:", error);
    return res.status(500).json({ success: false, message: "Failed to create club." });
  }
});

// PATCH /api/clubs/:clubId/committee - Admin, Member (Executive of target club)
router.patch("/:clubId/committee", requireRole(["Admin", "Member"]), async (req, res) => {
  try {
    const { committee } = req.body;

    if (!Array.isArray(committee)) {
      return res.status(400).json({
        success: false,
        message: "Committee must be an array of [{ userId, designation }].",
      });
    }

    const club = await Club.findById(req.params.clubId);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found." });
    }

    club.committee = committee;
    await club.save();
    await club.populate("committee.userId", "name email image role");

    return res.json({ success: true, club });
  } catch (error) {
    console.error("Error updating club committee:", error);
    return res.status(500).json({ success: false, message: "Failed to update committee." });
  }
});

// PATCH /api/clubs/:clubId - Admin or Member
router.patch("/:clubId", requireRole(["Admin", "Member"]), async (req, res) => {
  try {
    const { name, code, departmentId, description, logo } = req.body;
    const updates = {};

    if (name) updates.name = name.trim();
    if (code) updates.code = code.trim().toUpperCase();
    if (departmentId) updates.departmentId = departmentId;
    if (description !== undefined) updates.description = description;
    if (logo !== undefined) updates.logo = logo;

    const club = await Club.findByIdAndUpdate(req.params.clubId, updates, {
      returnDocument: "after",
      runValidators: true,
    }).populate("departmentId", "name code");

    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found." });
    }

    return res.json({ success: true, club });
  } catch (error) {
    console.error("Error updating club:", error);
    return res.status(500).json({ success: false, message: "Failed to update club." });
  }
});

// DELETE /api/clubs/:clubId - Admin only
router.delete("/:clubId", requireRole(["Admin"]), async (req, res) => {
  try {
    const club = await Club.findByIdAndDelete(req.params.clubId);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found." });
    }

    return res.json({ success: true, message: "Club deleted successfully." });
  } catch (error) {
    console.error("Error deleting club:", error);
    return res.status(500).json({ success: false, message: "Failed to delete club." });
  }
});

export default router;

