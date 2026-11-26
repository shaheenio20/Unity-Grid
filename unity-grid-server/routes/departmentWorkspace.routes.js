import express from "express";
import mongoose from "mongoose";
import { requireRole } from "../middleware/requireRole.js";
import { User } from "../models/User.js";
import { Department } from "../models/Department.js";
import { Club } from "../models/Club.js";
import { Event } from "../models/Event.js";
import { DepartmentMember } from "../models/DepartmentMember.js";

const router = express.Router();
router.use(requireRole(["Department"]));
router.use(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id || req.user._id).lean();
    if (!user?.department || !mongoose.isValidObjectId(user.department)) return res.status(403).json({ success: false, message: "No valid department is assigned to this account." });
    req.departmentId = user.department;
    next();
  } catch { return res.status(500).json({ success: false, message: "Could not verify department access." }); }
});

router.get("/", async (req, res) => {
  try {
    const department = await Department.findById(req.departmentId).lean();
    if (!department) return res.status(404).json({ success: false, message: "Department not found." });
    const clubs = await Club.find({ departmentId: department._id }).sort({ name: 1 }).lean();
    const events = await Event.find({ clubId: { $in: clubs.map((club) => club._id) } }).populate("clubId", "name code").sort({ startDate: 1 }).lean();
    return res.json({ success: true, department, clubs, events });
  } catch { return res.status(500).json({ success: false, message: "Could not load department workspace." }); }
});

router.patch("/profile", async (req, res) => {
  try {
    const { description, headOfDept } = req.body;
    if (typeof description !== "string" || typeof headOfDept !== "string" || description.length > 2000 || headOfDept.length > 150) return res.status(400).json({ success: false, message: "Please provide valid department details." });
    const department = await Department.findByIdAndUpdate(req.departmentId, { description: description.trim(), headOfDept: headOfDept.trim() }, { returnDocument: "after", runValidators: true });
    if (!department) return res.status(404).json({ success: false, message: "Department not found." });
    return res.json({ success: true, department });
  } catch { return res.status(500).json({ success: false, message: "Could not update department." }); }
});

router.get("/members", async (req, res) => {
  try {
    const members = await DepartmentMember.find({ departmentId: req.departmentId }).populate("clubId", "name code").sort({ name: 1 }).lean();
    return res.json({ success: true, members });
  } catch { return res.status(500).json({ success: false, message: "Could not load member profiles." }); }
});

const validateMember = async (body, departmentId) => {
  const { type, name, designation, email = "", phone = "", photo = "", bio = "", clubId } = body;
  if (!["faculty", "forum"].includes(type) || typeof name !== "string" || !name.trim() || name.length > 120 || typeof designation !== "string" || !designation.trim() || designation.length > 120 || [email, phone, photo, bio].some((value) => typeof value !== "string") || email.length > 254 || phone.length > 40 || photo.length > 2048 || bio.length > 1000) return { error: "Please check the profile fields." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { error: "Please enter a valid email address." };
  if (photo) { try { const url = new URL(photo); if (url.protocol !== "https:" && url.protocol !== "http:") return { error: "Photo must be an HTTP or HTTPS URL." }; } catch { return { error: "Please enter a valid photo URL." }; } }
  if (type === "forum" && (!mongoose.isValidObjectId(clubId) || !await Club.exists({ _id: clubId, departmentId }))) return { error: "Choose a forum belonging to your department." };
  return { data: { type, name: name.trim(), designation: designation.trim(), email: email.trim(), phone: phone.trim(), photo: photo.trim(), bio: bio.trim(), clubId: type === "forum" ? clubId : null } };
};

router.post("/members", async (req, res) => {
  try {
    const { data, error } = await validateMember(req.body, req.departmentId);
    if (error) return res.status(400).json({ success: false, message: error });
    const member = await DepartmentMember.create({ ...data, departmentId: req.departmentId });
    return res.status(201).json({ success: true, member });
  } catch { return res.status(500).json({ success: false, message: "Could not create member profile." }); }
});

router.patch("/members/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid profile." });
    const { data, error } = await validateMember(req.body, req.departmentId);
    if (error) return res.status(400).json({ success: false, message: error });
    const member = await DepartmentMember.findOneAndUpdate({ _id: req.params.id, departmentId: req.departmentId }, data, { returnDocument: "after", runValidators: true });
    if (!member) return res.status(404).json({ success: false, message: "Profile not found." });
    return res.json({ success: true, member });
  } catch { return res.status(500).json({ success: false, message: "Could not update member profile." }); }
});

router.delete("/members/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid profile." });
    const member = await DepartmentMember.findOneAndDelete({ _id: req.params.id, departmentId: req.departmentId });
    if (!member) return res.status(404).json({ success: false, message: "Profile not found." });
    return res.json({ success: true });
  } catch { return res.status(500).json({ success: false, message: "Could not delete member profile." }); }
});

router.post("/events", async (req, res) => {
  try {
    const { title, clubId, startDate, endDate, location, description, status } = req.body;
    if (typeof title !== "string" || !title.trim() || title.length > 200 || !mongoose.isValidObjectId(clubId) || !startDate || Number.isNaN(Date.parse(startDate)) || (endDate && (Number.isNaN(Date.parse(endDate)) || new Date(endDate) < new Date(startDate))) || !["Upcoming", "Ongoing", "Completed"].includes(status)) return res.status(400).json({ success: false, message: "Please check the event details and dates." });
    const club = await Club.findOne({ _id: clubId, departmentId: req.departmentId });
    if (!club) return res.status(403).json({ success: false, message: "Choose a club belonging to your department." });
    const event = await Event.create({ title: title.trim(), clubId, startDate, endDate: endDate || undefined, location: typeof location === "string" ? location.trim() : "", description: typeof description === "string" ? description.trim() : "", status });
    return res.status(201).json({ success: true, event });
  } catch { return res.status(500).json({ success: false, message: "Could not create event." }); }
});

router.patch("/events/:id/status", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !["Upcoming", "Ongoing", "Completed"].includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid event or status." });
    const clubs = await Club.find({ departmentId: req.departmentId }).select("_id").lean();
    const event = await Event.findOneAndUpdate({ _id: req.params.id, clubId: { $in: clubs.map((club) => club._id) } }, { status: req.body.status }, { returnDocument: "after", runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: "Event not found in your department." });
    return res.json({ success: true, event });
  } catch { return res.status(500).json({ success: false, message: "Could not update event." }); }
});

export default router;
