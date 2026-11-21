import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    headOfDept: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Department =
  mongoose.models.Department || mongoose.model("Department", departmentSchema);

