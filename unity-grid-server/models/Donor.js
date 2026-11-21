import mongoose from "mongoose";

const donorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["Student", "Member"],
      default: "Student",
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.Mixed,
      ref: "Department",
      default: null,
    },
    studentId: {
      type: String,
      default: null,
      trim: true,
    },
    lastDonatedAt: {
      type: Date,
      default: null,
    },
    isAvailableForDonation: {
      type: Boolean,
      default: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { collection: "donors", timestamps: true }
);

export const Donor = mongoose.models.Donor || mongoose.model("Donor", donorSchema);
