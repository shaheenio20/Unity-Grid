import express from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/betterAuth.js";
import { CrisisTicket } from "../models/CrisisTicket.js";
import { requireAuth, requireRole } from "../middleware/requireRole.js";
import { parseSosMessage } from "../utils/geminiSosParser.js";

const router = express.Router();

// 1. POST /api/crisis/parse-sos (Public - Parses raw message via Gemini AI or resilient NLP)
router.post("/parse-sos", async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter or paste an emergency message to parse.",
      });
    }

    const parsed = await parseSosMessage(rawText);
    return res.json({
      success: true,
      parsed,
    });
  } catch (error) {
    console.error("Error in parse-sos:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to parse SOS message.",
    });
  }
});

// 2. GET /api/crisis/tickets (Public - List SOS tickets with zone, status, and urgency filters)
router.get("/tickets", async (req, res) => {
  try {
    const { status, urgency, zone } = req.query;
    const filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }
    if (urgency && urgency !== "All") {
      filter.urgency = urgency;
    }
    if (zone && zone !== "All") {
      filter.zone = zone;
    }

    const tickets = await CrisisTicket.find(filter)
      .populate("assignedVolunteers", "name email phone")
      .populate("reporterId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    // Priority sort: Critical first, then High, then Moderate; Open before Resolved
    const urgencyOrder = { Critical: 1, High: 2, Moderate: 3 };
    const statusOrder = { Open: 1, "In Progress": 2, Resolved: 3 };

    tickets.sort((a, b) => {
      const sA = statusOrder[a.status] || 4;
      const sB = statusOrder[b.status] || 4;
      if (sA !== sB) return sA - sB;

      const uA = urgencyOrder[a.urgency] || 4;
      const uB = urgencyOrder[b.urgency] || 4;
      return uA - uB;
    });

    return res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Error fetching crisis tickets:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch crisis tickets." });
  }
});

// 3. POST /api/crisis/tickets (Public / Authenticated - Create an emergency rescue ticket)
router.post("/tickets", async (req, res) => {
  try {
    const {
      rawText,
      location,
      zone,
      urgency,
      contactInfo,
      needs,
      peopleCount,
    } = req.body;

    if (!location || !contactInfo) {
      return res.status(400).json({
        success: false,
        message: "Location and contact phone number are required to submit an SOS ticket.",
      });
    }

    let reporterId = null;
    let reporterName = "Anonymous Reporter";

    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (session?.user) {
        reporterId = session.user.id || session.user._id;
        reporterName = session.user.name || "Campus Student";
      }
    } catch {
      // Guest submission permitted during emergency
    }

    const ticket = await CrisisTicket.create({
      reporterId,
      reporterName,
      rawText: rawText ? rawText.trim() : `Emergency at ${location}. Call ${contactInfo}`,
      location: location.trim(),
      zone: zone || "Other",
      urgency: ["Critical", "High", "Moderate"].includes(urgency) ? urgency : "High",
      contactInfo: contactInfo.trim(),
      needs: needs ? needs.trim() : "Emergency Rescue, Food & Water",
      peopleCount: Number(peopleCount) || 1,
      status: "Open",
    });

    return res.status(201).json({
      success: true,
      message: "Emergency SOS ticket registered successfully. Rescue teams have been notified.",
      ticket,
    });
  } catch (error) {
    console.error("Error creating crisis ticket:", error);
    return res.status(500).json({ success: false, message: "Failed to publish crisis ticket." });
  }
});

// 4. PATCH /api/crisis/tickets/:ticketId/status (Member, Admin - Update status)
router.patch("/tickets/:ticketId/status", requireRole(["Admin", "Member"]), async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!["Open", "In Progress", "Resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed values: Open, In Progress, Resolved.",
      });
    }

    const ticket = await CrisisTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Crisis ticket not found." });
    }

    ticket.status = status;
    await ticket.save();

    const updated = await CrisisTicket.findById(ticketId)
      .populate("assignedVolunteers", "name email phone")
      .lean();

    return res.json({
      success: true,
      message: `Ticket status updated to ${status}.`,
      ticket: updated,
    });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return res.status(500).json({ success: false, message: "Failed to update ticket status." });
  }
});

// 5. PATCH /api/crisis/tickets/:ticketId/field-note (Member, Admin - Add field rescue note)
router.patch("/tickets/:ticketId/field-note", requireRole(["Admin", "Member"]), async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: "Field note content is required." });
    }

    const ticket = await CrisisTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Crisis ticket not found." });
    }

    const authorName = req.user?.name || "Rescue Volunteer";
    ticket.fieldNotes.push({
      note: note.trim(),
      author: authorName,
      createdAt: new Date(),
    });

    await ticket.save();

    return res.json({
      success: true,
      message: "Field update added to ticket.",
      ticket,
    });
  } catch (error) {
    console.error("Error adding field note:", error);
    return res.status(500).json({ success: false, message: "Failed to add field note." });
  }
});

// 6. DELETE /api/crisis/tickets/:ticketId (Admin Only - Remove invalid/duplicate ticket)
router.delete("/tickets/:ticketId", requireRole(["Admin"]), async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await CrisisTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Crisis ticket not found." });
    }

    await CrisisTicket.findByIdAndDelete(ticketId);

    return res.json({
      success: true,
      message: "Crisis ticket removed successfully.",
    });
  } catch (error) {
    console.error("Error deleting crisis ticket:", error);
    return res.status(500).json({ success: false, message: "Failed to delete ticket." });
  }
});

export default router;
