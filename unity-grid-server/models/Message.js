import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.Mixed,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderRole: {
      type: String,
      default: "Student",
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: [
      {
        url: { type: String, required: true },
        name: { type: String, default: "attachment" },
        fileType: { type: String, default: "image" },
      },
    ],
    isSystemNotice: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
