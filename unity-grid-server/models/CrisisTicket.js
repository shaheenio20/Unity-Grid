import mongoose from "mongoose";

const crisisTicketSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.Mixed,
      ref: "User",
      default: null,
    },
    reporterName: {
      type: String,
      default: "Anonymous Reporter",
      trim: true,
    },
    rawText: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    zone: {
      type: String,
      enum: [
        "Companygonj",
        "Gowainghat",
        "Kanaighat",
        "Jalalabad Ghat",
        "Sunamganj Border",
        "Sylhet Sadar",
        "Shahjalal Uposhahar",
        "Other",
      ],
      default: "Other",
    },
    urgency: {
      type: String,
      enum: ["Critical", "High", "Moderate"],
      default: "High",
    },
    contactInfo: {
      type: String,
      required: true,
      trim: true,
    },
    needs: {
      type: String,
      default: "Rescue Boat, Clean Drinking Water, Dry Food",
      trim: true,
    },
    peopleCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved"],
      default: "Open",
    },
    assignedVolunteers: [
      {
        type: mongoose.Schema.Types.Mixed,
        ref: "User",
      },
    ],
    fieldNotes: [
      {
        note: { type: String, required: true },
        author: { type: String, default: "Campus Rescue Team" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const CrisisTicket = mongoose.model("CrisisTicket", crisisTicketSchema);
