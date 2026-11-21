import mongoose from "mongoose";

const bloodRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    unitsNeeded: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    hospital: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    urgency: {
      type: String,
      enum: ["Critical", "Urgent", "Standard"],
      default: "Urgent",
    },
    requiredDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Fulfilled", "Cancelled"],
      default: "Pending",
    },
    additionalNotes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export const BloodRequest =
  mongoose.models.BloodRequest || mongoose.model("BloodRequest", bloodRequestSchema);
