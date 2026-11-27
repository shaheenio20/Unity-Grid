import mongoose from "mongoose";

const actionItemSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    task: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.Mixed,
      ref: "User",
      required: true,
    },
    requesterName: {
      type: String,
      required: true,
      trim: true,
    },
    requesterEmail: {
      type: String,
      trim: true,
      default: "",
    },
    requesterRole: {
      type: String,
      default: "Student",
    },
    category: {
      type: String,
      enum: ["Blood_Emergency", "Flood_Crisis", "Club_Inquiry", "General_Support"],
      default: "General_Support",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    initialMessage: {
      type: String,
      required: true,
      trim: true,
    },
    urgency: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "Active", "Resolved", "Declined"],
      default: "Pending",
      index: true,
    },
    assignedAdminId: {
      type: mongoose.Schema.Types.Mixed,
      ref: "User",
      default: null,
    },
    assignedAdminName: {
      type: String,
      default: "",
      trim: true,
    },
    adminNote: {
      type: String,
      default: "",
      trim: true,
    },
    actionChecklist: [actionItemSchema],
    emergencyMeta: {
      relatedType: {
        type: String,
        enum: ["BloodRequest", "CrisisTicket", "Direct", null],
        default: null,
      },
      relatedId: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      bloodGroup: { type: String, default: "", trim: true },
      hospital: { type: String, default: "", trim: true },
      unitsNeeded: { type: Number, default: 1 },
      contactNumber: { type: String, default: "", trim: true },
      location: { type: String, default: "", trim: true },
      zone: { type: String, default: "", trim: true },
      peopleCount: { type: Number, default: 0 },
      needs: { type: String, default: "", trim: true },
    },
    lastMessage: {
      text: { type: String, default: "" },
      senderId: { type: mongoose.Schema.Types.Mixed, default: null },
      senderName: { type: String, default: "" },
      createdAt: { type: Date, default: Date.now },
    },
    unreadCountUser: {
      type: Number,
      default: 0,
    },
    unreadCountAdmin: {
      type: Number,
      default: 1, // When newly created, unread for admin
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ requesterId: 1, createdAt: -1 });
conversationSchema.index({ status: 1, urgency: 1, createdAt: -1 });

export const Conversation =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);
