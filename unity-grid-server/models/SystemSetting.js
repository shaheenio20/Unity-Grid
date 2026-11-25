import mongoose from "mongoose";

const systemSettingSchema = new mongoose.Schema(
  {
    isCrisisModeActive: {
      type: Boolean,
      default: false,
    },
    crisisTitle: {
      type: String,
      default: "Sylhet Regional Flood Relief Operation",
      trim: true,
    },
    emergencyHotline: {
      type: String,
      default: "01792345238",
      trim: true,
    },
    reliefCampLocation: {
      type: String,
      default: "Metropolitan University Student Center, Sylhet",
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.Mixed,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export const SystemSetting = mongoose.model("SystemSetting", systemSettingSchema);
