import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, default: false },
    image: { type: String },
    role: {
      type: String,
      enum: ["Admin", "Member", "Student"],
      default: "Student",
    },
    department: {
      type: mongoose.Schema.Types.Mixed,
      ref: "Department",
      required: false,
    },
    studentId: { type: String },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    lastDonatedAt: { type: Date },
    phone: { type: String },
    isAvailableForDonation: { type: Boolean, default: true },
  },
  { collection: "user", timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);

