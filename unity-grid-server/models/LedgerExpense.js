import mongoose from "mongoose";

const ledgerExpenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    category: {
      type: String,
      enum: [
        "Food & Water",
        "Medical Supplies",
        "Boat & Transport",
        "Shelter & Clothes",
        "Baby Food & Essentials",
        "Other",
      ],
      default: "Food & Water",
    },
    spentDate: {
      type: Date,
      default: Date.now,
    },
    receiptImage: {
      type: String,
      default: "",
    },
    aiVerified: {
      type: Boolean,
      default: true,
    },
    aiConfidenceScore: {
      type: Number,
      default: 0.95,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    spentBy: {
      type: mongoose.Schema.Types.Mixed,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export const LedgerExpense = mongoose.model("LedgerExpense", ledgerExpenseSchema);
