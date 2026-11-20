import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: false,
      default: null,
    },
    banner: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Completed"],
      default: "Upcoming",
    },
    location: { type: String, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);
