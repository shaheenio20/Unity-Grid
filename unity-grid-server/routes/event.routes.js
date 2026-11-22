import express from "express";
import { Event } from "../models/Event.js";
import { Club } from "../models/Club.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

// GET /api/events - Public
// Query filters: ?status=Upcoming|Ongoing|Completed & ?clubId=...
router.get("/", async (req, res) => {
  try {
    const { status, clubId } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (clubId) {
      filter.clubId = clubId;
    }

    const events = await Event.find(filter)
      .populate("clubId", "name code logo")
      .populate("volunteers", "name email studentId phone department")
      .sort({ startDate: 1 })
      .lean();

    return res.json({ success: true, events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch events." });
  }
});

// GET /api/events/:eventId - Public
router.get("/:eventId", async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate("clubId", "name code logo departmentId description")
      .populate("volunteers", "name email studentId phone department")
      .lean();

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    return res.json({ success: true, event });
  } catch (error) {
    console.error("Error fetching event:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch event." });
  }
});

// POST /api/events - Admin or Member
router.post("/", requireRole(["Admin", "Member"]), async (req, res) => {
  try {
    const { title, description, clubId, banner, status, location, startDate, endDate } =
      req.body;

    if (!title || !startDate) {
      return res.status(400).json({
        success: false,
        message: "Event title and startDate are required.",
      });
    }

    let validClubId = null;
    if (clubId) {
      const clubExists = await Club.findById(clubId);
      if (clubExists) {
        validClubId = clubExists._id;
      }
    }

    const event = new Event({
      title: title.trim(),
      description: description || "",
      clubId: validClubId,
      banner: banner || "",
      status: status || "Upcoming",
      location: location || "",
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      volunteers: [],
    });

    await event.save();
    if (validClubId) {
      await event.populate("clubId", "name code logo");
    }
    return res.status(201).json({ success: true, event });
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json({ success: false, message: "Failed to create event." });
  }
});

// PATCH /api/events/:eventId - Admin or Member
router.patch("/:eventId", requireRole(["Admin", "Member"]), async (req, res) => {
  try {
    const { title, description, clubId, banner, status, location, startDate, endDate } =
      req.body;
    const updates = {};

    if (title) updates.title = title.trim();
    if (description !== undefined) updates.description = description;
    if (clubId !== undefined) updates.clubId = clubId || null;
    if (banner !== undefined) updates.banner = banner;
    if (status) updates.status = status;
    if (location !== undefined) updates.location = location;
    if (startDate) updates.startDate = new Date(startDate);
    if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;

    const event = await Event.findByIdAndUpdate(req.params.eventId, updates, {
      returnDocument: "after",
      runValidators: true,
    }).populate("clubId", "name code logo");

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    return res.json({ success: true, event });
  } catch (error) {
    console.error("Error updating event:", error);
    return res.status(500).json({ success: false, message: "Failed to update event." });
  }
});

// DELETE /api/events/:eventId - Admin or Member
router.delete("/:eventId", requireRole(["Admin", "Member"]), async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    return res.json({ success: true, message: "Event deleted successfully." });
  } catch (error) {
    console.error("Error deleting event:", error);
    return res.status(500).json({ success: false, message: "Failed to delete event." });
  }
});

// POST /api/events/:eventId/volunteer - Authenticated Users (Student, Member, Admin)
// Register logged-in user as volunteer for the event
router.post(
  "/:eventId/volunteer",
  requireRole(["Student", "Member", "Admin"]),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.eventId);
      if (!event) {
        return res.status(404).json({ success: false, message: "Event not found." });
      }

      const userId = req.user.id || req.user._id;

      // Check if user is already registered as a volunteer
      const isAlreadyVolunteering = event.volunteers.some(
        (volunteerId) => String(volunteerId) === String(userId)
      );

      if (isAlreadyVolunteering) {
        return res.status(400).json({
          success: false,
          message: "You are already registered as a volunteer for this event.",
        });
      }

      event.volunteers.push(userId);
      await event.save();

      return res.json({
        success: true,
        message: "Successfully registered as volunteer.",
        volunteersCount: event.volunteers.length,
      });
    } catch (error) {
      console.error("Error signing up as volunteer:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to register as volunteer.",
      });
    }
  }
);

export default router;
