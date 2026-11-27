import express from "express";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { requireAuth, requireRole } from "../middleware/requireRole.js";

const router = express.Router();

/**
 * @route   POST /api/messages/requests
 * @desc    Submit a new support/dispatch request to Admin
 * @access  Authenticated (Student, Member, Admin)
 */
router.post("/requests", requireAuth, async (req, res) => {
  try {
    const { category, subject, initialMessage, urgency, emergencyMeta } = req.body;

    if (!subject?.trim() || !initialMessage?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject and detailed message are required.",
      });
    }

    const userId = req.user.id || req.user._id;

    // Check if an open/pending conversation already exists for this emergency entity
    if (emergencyMeta?.relatedId) {
      const existing = await Conversation.findOne({
        "emergencyMeta.relatedId": emergencyMeta.relatedId,
        status: { $in: ["Pending", "Active"] },
      });
      if (existing) {
        return res.status(200).json({
          success: true,
          message: "Existing emergency conversation resumed.",
          conversation: existing,
          isExisting: true,
        });
      }
    }

    let defaultChecklist = [];
    if (category === "Blood_Emergency") {
      defaultChecklist = [
        { task: "Verify patient blood group, required units, and hospital ward" },
        { task: "Match and contact potential active blood donors" },
        { task: "Coordinate donor transport and cross-matching sample" },
        { task: "Confirm blood donation and transfusion status" },
      ];
    } else if (category === "Flood_Crisis") {
      defaultChecklist = [
        { task: "Verify flood stranded location and number of affected people" },
        { task: "Alert local rescue boat & volunteer rescue team" },
        { task: "Prepare and dispatch emergency dry food / potable water" },
        { task: "Confirm safe shelter evacuation and medical condition" },
      ];
    }

    const conversation = await Conversation.create({
      requesterId: userId,
      requesterName: req.user.name || "Student Requester",
      requesterEmail: req.user.email || "",
      requesterRole: req.user.role || "Student",
      category: category || "General_Support",
      subject: subject.trim(),
      initialMessage: initialMessage.trim(),
      urgency: urgency || "Medium",
      status: "Pending",
      emergencyMeta: emergencyMeta || {},
      actionChecklist: defaultChecklist,
      lastMessage: {
        text: initialMessage.trim(),
        senderId: userId,
        senderName: req.user.name || "Student Requester",
        createdAt: new Date(),
      },
      unreadCountAdmin: 1,
      unreadCountUser: 0,
    });

    // Notify connected Admins via Socket.io (no chat messages created until accepted)
    if (req.io) {
      req.io.to("admin_dispatch_room").emit("new_support_request", {
        conversation,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Request submitted successfully. Waiting for admin review.",
      conversation,
    });
  } catch (error) {
    console.error("Create support request error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit support request. Please try again.",
    });
  }
});

/**
 * @route   GET /api/messages/my-requests
 * @desc    Get all support requests submitted by the logged-in user
 * @access  Authenticated
 */
router.get("/my-requests", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const conversations = await Conversation.find({ requesterId: userId })
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Fetch user requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve your support requests.",
    });
  }
});

/**
 * @route   GET /api/messages/admin/queue
 * @desc    Get all requests in admin dispatch queue with counts
 * @access  Admin Only
 */
router.get("/admin/queue", requireRole(["Admin"]), async (req, res) => {
  try {
    const { status, category } = req.query;

    const [pendingCount, activeCount, resolvedCount, totalCount] =
      await Promise.all([
        Conversation.countDocuments({ status: "Pending" }),
        Conversation.countDocuments({ status: "Active" }),
        Conversation.countDocuments({ status: "Resolved" }),
        Conversation.countDocuments(),
      ]);

    const filter = {};
    if (status && status !== "All") {
      filter.status = status;
    }
    if (category && category !== "All") {
      filter.category = category;
    }

    const conversations = await Conversation.find(filter)
      .sort({ urgency: 1, updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      counts: {
        pendingCount,
        activeCount,
        resolvedCount,
        totalCount,
      },
      conversations,
    });
  } catch (error) {
    console.error("Fetch admin queue error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load admin dispatch queue.",
    });
  }
});

/**
 * @route   PUT /api/messages/requests/:id/accept
 * @desc    Admin accepts a support request & activates live chat
 * @access  Admin Only
 */
router.put(
  "/requests/:id/accept",
  requireRole(["Admin"]),
  async (req, res) => {
    try {
      const conversation = await Conversation.findById(req.params.id);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found.",
        });
      }

      const adminId = req.user.id || req.user._id;
      conversation.status = "Active";
      conversation.assignedAdminId = adminId;
      conversation.assignedAdminName = req.user.name || "Central Admin";
      await conversation.save();

      // 1. Student's initial problem description now officially enters the chatboard
      const initialInquiry = await Message.create({
        conversationId: conversation._id,
        senderId: conversation.requesterId,
        senderName: conversation.requesterName,
        senderRole: conversation.requesterRole,
        text: conversation.initialMessage,
        isSystemNotice: false,
      });

      // 2. System notice message
      const systemNotice = await Message.create({
        conversationId: conversation._id,
        senderId: adminId,
        senderName: "System Notice",
        senderRole: "Admin",
        text: `Request accepted by Admin ${req.user.name || "Lead"}. Live direct coordination is now active.`,
        isSystemNotice: true,
      });

      // Socket real-time notification
      if (req.io) {
        req.io.to(`conversation_${conversation._id}`).emit("request_accepted", {
          conversation,
          messages: [initialInquiry, systemNotice],
        });
        req.io.to(`user_${conversation.requesterId}`).emit("request_accepted", {
          conversation,
          messages: [initialInquiry, systemNotice],
        });
        req.io.to("admin_dispatch_room").emit("request_status_changed", {
          conversationId: conversation._id,
          status: "Active",
        });
      }

      return res.json({
        success: true,
        message: "Request accepted and channel activated.",
        conversation,
      });
    } catch (error) {
      console.error("Accept request error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to accept request.",
      });
    }
  }
);

/**
 * @route   PUT /api/messages/requests/:id/decline
 * @desc    Admin declines an invalid or spam request
 * @access  Admin Only
 */
router.put(
  "/requests/:id/decline",
  requireRole(["Admin"]),
  async (req, res) => {
    try {
      const { note } = req.body;
      const conversation = await Conversation.findById(req.params.id);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found.",
        });
      }

      conversation.status = "Declined";
      conversation.adminNote = note?.trim() || "Declined by admin dispatch.";
      await conversation.save();

      const systemNotice = await Message.create({
        conversationId: conversation._id,
        senderId: req.user.id || req.user._id,
        senderName: "System Notice",
        senderRole: "Admin",
        text: `Request closed: ${conversation.adminNote}`,
        isSystemNotice: true,
      });

      if (req.io) {
        req.io.to(`conversation_${conversation._id}`).emit("request_declined", {
          conversation,
          systemNotice,
        });
        req.io.to("admin_dispatch_room").emit("request_status_changed", {
          conversationId: conversation._id,
          status: "Declined",
        });
      }

      return res.json({
        success: true,
        message: "Request marked as declined.",
        conversation,
      });
    } catch (error) {
      console.error("Decline request error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to decline request.",
      });
    }
  }
);

/**
 * @route   GET /api/messages/conversations/:id/messages
 * @desc    Get message history for a specific conversation
 * @access  Requester or Admin
 */
router.get("/conversations/:id/messages", requireAuth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    const userId = String(req.user.id || req.user._id);
    const isAdmin = req.user.role === "Admin";

    if (!isAdmin && String(conversation.requesterId) !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: You cannot view this conversation.",
      });
    }

    // Reset unread count for current user
    if (isAdmin) {
      conversation.unreadCountAdmin = 0;
    } else {
      conversation.unreadCountUser = 0;
    }
    await conversation.save();

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      conversation,
      messages,
    });
  } catch (error) {
    console.error("Fetch conversation messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load messages.",
    });
  }
});

/**
 * @route   POST /api/messages/conversations/:id/messages
 * @desc    Send a message in an active conversation
 * @access  Requester or Admin
 */
router.post("/conversations/:id/messages", requireAuth, async (req, res) => {
  try {
    const { text, attachments } = req.body;

    if (!text?.trim() && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Message content or attachment is required.",
      });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    const userId = String(req.user.id || req.user._id);
    const isAdmin = req.user.role === "Admin";
    const isRequester = String(conversation.requesterId) === userId;

    if (!isAdmin && !isRequester) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this conversation.",
      });
    }

    if (conversation.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: `This request is currently ${conversation.status}. Please accept the request first to open direct messaging.`,
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user.id || req.user._id,
      senderName: req.user.name || (isAdmin ? "Admin Support" : "User"),
      senderRole: req.user.role || "Student",
      text: text?.trim() || "",
      attachments: Array.isArray(attachments) ? attachments : [],
      isSystemNotice: false,
    });

    // Update conversation last message & unread badge
    conversation.lastMessage = {
      text: text?.trim() || "Sent an attachment",
      senderId: req.user.id || req.user._id,
      senderName: req.user.name || "User",
      createdAt: new Date(),
    };

    if (isRequester) {
      conversation.unreadCountAdmin = (conversation.unreadCountAdmin || 0) + 1;
    } else {
      conversation.unreadCountUser = (conversation.unreadCountUser || 0) + 1;
    }
    await conversation.save();

    // Broadcast in real-time
    if (req.io) {
      req.io.to(`conversation_${conversation._id}`).emit("new_message", message);
      if (conversation.requesterId) {
        req.io.to(`user_${conversation.requesterId}`).emit("new_message", message);
      }
      if (conversation.assignedAdminId) {
        req.io.to(`user_${conversation.assignedAdminId}`).emit("new_message", message);
      }
      req.io.to("admin_dispatch_room").emit("conversation_activity", {
        conversationId: conversation._id,
        lastMessage: conversation.lastMessage,
      });
    }

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message.",
    });
  }
});

/**
 * @route   PUT /api/messages/conversations/:id/checklist
 * @desc    Manage action checklist tasks assigned by Admin (Add, Toggle, Delete)
 * @access  Requester or Admin
 */
router.put("/conversations/:id/checklist", requireAuth, async (req, res) => {
  try {
    const { action, task, taskId } = req.body;
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    const userId = String(req.user.id || req.user._id);
    const isAdmin = req.user.role === "Admin";
    const isRequester = String(conversation.requesterId) === userId;

    if (!isAdmin && !isRequester) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    if (action === "add") {
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Only Admins can assign new action tasks.",
        });
      }
      if (!task?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Task description is required.",
        });
      }
      conversation.actionChecklist.push({
        task: task.trim(),
        completed: false,
      });
    } else if (action === "toggle") {
      const item = conversation.actionChecklist.find((i) => i.id === taskId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Task item not found.",
        });
      }
      item.completed = !item.completed;
      item.completedAt = item.completed ? new Date() : null;
    } else if (action === "delete") {
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Only Admins can delete checklist tasks.",
        });
      }
      conversation.actionChecklist = conversation.actionChecklist.filter(
        (i) => i.id !== taskId
      );
    }

    await conversation.save();

    if (req.io) {
      req.io
        .to(`conversation_${conversation._id}`)
        .emit("checklist_updated", conversation.actionChecklist);
    }

    return res.json({
      success: true,
      actionChecklist: conversation.actionChecklist,
    });
  } catch (error) {
    console.error("Checklist update error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update action checklist.",
    });
  }
});

/**
 * @route   PUT /api/messages/conversations/:id/resolve
 * @desc    Mark the conversation issue as resolved
 * @access  Admin Only
 */
router.put(
  "/conversations/:id/resolve",
  requireRole(["Admin"]),
  async (req, res) => {
    try {
      const conversation = await Conversation.findById(req.params.id);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found.",
        });
      }

      conversation.status = "Resolved";
      await conversation.save();

      const systemNotice = await Message.create({
        conversationId: conversation._id,
        senderId: req.user.id || req.user._id,
        senderName: "System Notice",
        senderRole: "Admin",
        text: `Issue successfully resolved and closed by Admin ${req.user.name || "Lead"}. Thank you!`,
        isSystemNotice: true,
      });

      if (req.io) {
        req.io.to(`conversation_${conversation._id}`).emit("issue_resolved", {
          conversation,
          systemNotice,
        });
        req.io.to("admin_dispatch_room").emit("request_status_changed", {
          conversationId: conversation._id,
          status: "Resolved",
        });
      }

      return res.json({
        success: true,
        message: "Conversation marked as Resolved.",
        conversation,
      });
    } catch (error) {
      console.error("Resolve conversation error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to resolve conversation.",
      });
    }
  }
);

/**
 * @route   DELETE /api/messages/conversations/:id
 * @desc    Permanently delete a conversation and its messages from DB
 * @access  Admin Only
 */
router.delete(
  "/conversations/:id",
  requireRole(["Admin"]),
  async (req, res) => {
    try {
      const conversation = await Conversation.findById(req.params.id);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found.",
        });
      }

      // Delete all messages belonging to this conversation
      await Message.deleteMany({ conversationId: conversation._id });

      // Delete the conversation document
      await Conversation.findByIdAndDelete(conversation._id);

      if (req.io) {
        req.io.to(`conversation_${conversation._id}`).emit("conversation_deleted", {
          conversationId: conversation._id,
        });
        if (conversation.requesterId) {
          req.io.to(`user_${conversation.requesterId}`).emit("conversation_deleted", {
            conversationId: conversation._id,
          });
        }
        req.io.to("admin_dispatch_room").emit("conversation_deleted", {
          conversationId: conversation._id,
        });
      }

      return res.json({
        success: true,
        message: "Conversation and all associated messages permanently deleted.",
        conversationId: conversation._id,
      });
    } catch (error) {
      console.error("Delete conversation error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete conversation.",
      });
    }
  }
);

export default router;
