import mongoose from "mongoose";

const committeeMemberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    designation: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    description: { type: String, default: "" },
    logo: { type: String, default: "" },
    committee: [committeeMemberSchema],
  },
  { timestamps: true }
);

export const Club = mongoose.models.Club || mongoose.model("Club", clubSchema);

