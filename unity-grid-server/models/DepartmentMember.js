import mongoose from "mongoose";

const departmentMemberSchema = new mongoose.Schema({
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true, index: true },
  type: { type: String, enum: ["faculty", "forum"], required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  designation: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, trim: true, maxlength: 254, default: "" },
  phone: { type: String, trim: true, maxlength: 40, default: "" },
  photo: { type: String, trim: true, maxlength: 2048, default: "" },
  bio: { type: String, trim: true, maxlength: 1000, default: "" },
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: "Club", default: null },
}, { timestamps: true });

export const DepartmentMember = mongoose.models.DepartmentMember || mongoose.model("DepartmentMember", departmentMemberSchema);
