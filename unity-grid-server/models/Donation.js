import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    donorName: {
      type: String,
      default: "Anonymous Supporter",
      trim: true,
    },
    donorPhone: {
      type: String,
      trim: true,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      min: 50,
    },
    paymentMethod: {
      type: String,
      enum: ["bKash", "Nagad", "Rocket", "Bank"],
      default: "bKash",
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    reference: {
      type: String,
      default: "Sylhet Flood Relief Fund",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Verified",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.Mixed,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export const Donation = mongoose.model("Donation", donationSchema);
