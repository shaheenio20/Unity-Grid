import express from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/betterAuth.js";
import { BloodRequest } from "../models/BloodRequest.js";
import { User } from "../models/User.js";
import { Donor } from "../models/Donor.js";
import { requireAuth } from "../middleware/requireRole.js";

const router = express.Router();
const COOLDOWN_DAYS = 90;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

// Helper: Calculate 90-day cooldown status
const calculateCooldown = (lastDonatedAt) => {
  if (!lastDonatedAt) {
    return { isEligible: true, daysRemaining: 0, lastDonatedAt: null };
  }
  const lastDate = new Date(lastDonatedAt).getTime();
  const nextEligibleDate = new Date(lastDate + COOLDOWN_MS);
  const now = Date.now();
  const diffTime = nextEligibleDate.getTime() - now;

  if (diffTime <= 0) {
    return {
      isEligible: true,
      daysRemaining: 0,
      lastDonatedAt,
      nextEligibleDate,
    };
  }

  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return {
    isEligible: false,
    daysRemaining,
    lastDonatedAt,
    nextEligibleDate,
  };
};

// 1. GET /api/blood/requests (Public - filter by bloodGroup, status, urgency)
router.get("/requests", async (req, res) => {
  try {
    const { bloodGroup, status, urgency } = req.query;
    const filter = {};

    if (bloodGroup && bloodGroup !== "All") {
      filter.bloodGroup = bloodGroup;
    }
    if (status && status !== "All") {
      filter.status = status;
    }
    if (urgency && urgency !== "All") {
      filter.urgency = urgency;
    }

    const requests = await BloodRequest.find(filter)
      .populate("requesterId", "name email phone")
      .sort({
        // Sort Critical first, then Urgent, then Standard, then by requiredDate
        status: 1, // 'Pending' comes first
        urgency: 1,
        createdAt: -1,
      })
      .lean();

    // Priority sort: Critical > Urgent > Standard
    const urgencyOrder = { Critical: 1, Urgent: 2, Standard: 3 };
    requests.sort((a, b) => {
      if (a.status === "Pending" && b.status !== "Pending") return -1;
      if (a.status !== "Pending" && b.status === "Pending") return 1;
      const orderA = urgencyOrder[a.urgency] || 4;
      const orderB = urgencyOrder[b.urgency] || 4;
      return orderA - orderB;
    });

    return res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Error fetching blood requests:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch blood requests." });
  }
});

// 2. POST /api/blood/requests (Public / Guest & Authenticated)
router.post("/requests", async (req, res) => {
  try {
    const {
      patientName,
      bloodGroup,
      unitsNeeded,
      hospital,
      location,
      contactNumber,
      urgency,
      requiredDate,
      additionalNotes,
    } = req.body;

    if (!patientName || !bloodGroup || !hospital || !location || !contactNumber || !requiredDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for blood request.",
      });
    }

    let requesterId = null;
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (session?.user) {
        requesterId = session.user.id || session.user._id;
      }
    } catch {
      // Guest submission (no active session)
    }

    const newRequest = await BloodRequest.create({
      requesterId,
      patientName: patientName.trim(),
      bloodGroup,
      unitsNeeded: Number(unitsNeeded) || 1,
      hospital: hospital.trim(),
      location: location.trim(),
      contactNumber: contactNumber.trim(),
      urgency: urgency || "Urgent",
      requiredDate: new Date(requiredDate),
      additionalNotes: additionalNotes ? additionalNotes.trim() : "",
      status: "Pending",
    });

    const populated = await BloodRequest.findById(newRequest._id)
      .populate("requesterId", "name email phone")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Emergency blood request published successfully.",
      request: populated,
    });
  } catch (error) {
    console.error("Error creating blood request:", error);
    return res.status(500).json({ success: false, message: "Failed to publish blood request." });
  }
});

// 3. PATCH /api/blood/requests/:requestId/status (Admin, Member, or Request Creator)
router.patch("/requests/:requestId/status", requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!["Pending", "Fulfilled", "Cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed values: Pending, Fulfilled, Cancelled.",
      });
    }

    const targetRequest = await BloodRequest.findById(requestId);
    if (!targetRequest) {
      return res.status(404).json({ success: false, message: "Blood request not found." });
    }

    const currentUserId = String(req.user.id || req.user._id);
    const requesterId = targetRequest.requesterId ? String(targetRequest.requesterId) : null;
    const isOwner = requesterId && currentUserId === requesterId;
    const isPrivileged = req.user.role === "Admin" || req.user.role === "Member";

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to update this request status.",
      });
    }

    targetRequest.status = status;
    await targetRequest.save();

    const updated = await BloodRequest.findById(requestId)
      .populate("requesterId", "name email phone")
      .lean();

    return res.json({
      success: true,
      message: `Blood request status updated to ${status}.`,
      request: updated,
    });
  } catch (error) {
    console.error("Error updating blood request status:", error);
    return res.status(500).json({ success: false, message: "Failed to update status." });
  }
});

// 4. PATCH /api/blood/requests/:requestId (Full Update/Edit - Admin, Member, or Creator)
router.patch("/requests/:requestId", requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const {
      patientName,
      bloodGroup,
      unitsNeeded,
      hospital,
      location,
      contactNumber,
      urgency,
      requiredDate,
      status,
      additionalNotes,
    } = req.body;

    const targetRequest = await BloodRequest.findById(requestId);
    if (!targetRequest) {
      return res.status(404).json({ success: false, message: "Blood request not found." });
    }

    const currentUserId = String(req.user.id || req.user._id);
    const requesterId = targetRequest.requesterId ? String(targetRequest.requesterId) : null;
    const isOwner = requesterId && currentUserId === requesterId;
    const isPrivileged = req.user.role === "Admin" || req.user.role === "Member";

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to edit this request.",
      });
    }

    if (patientName) targetRequest.patientName = patientName.trim();
    if (bloodGroup) targetRequest.bloodGroup = bloodGroup;
    if (unitsNeeded) targetRequest.unitsNeeded = Number(unitsNeeded) || targetRequest.unitsNeeded;
    if (hospital) targetRequest.hospital = hospital.trim();
    if (location) targetRequest.location = location.trim();
    if (contactNumber) targetRequest.contactNumber = contactNumber.trim();
    if (urgency) targetRequest.urgency = urgency;
    if (requiredDate) targetRequest.requiredDate = new Date(requiredDate);
    if (status && ["Pending", "Fulfilled", "Cancelled"].includes(status)) {
      targetRequest.status = status;
    }
    if (typeof additionalNotes === "string") {
      targetRequest.additionalNotes = additionalNotes.trim();
    }

    await targetRequest.save();

    const updated = await BloodRequest.findById(requestId)
      .populate("requesterId", "name email phone")
      .lean();

    return res.json({
      success: true,
      message: "Blood request updated successfully.",
      request: updated,
    });
  } catch (error) {
    console.error("Error editing blood request:", error);
    return res.status(500).json({ success: false, message: "Failed to edit blood request." });
  }
});

// 5. DELETE /api/blood/requests/:requestId (Delete - Admin, Member, or Creator)
router.delete("/requests/:requestId", requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;

    const targetRequest = await BloodRequest.findById(requestId);
    if (!targetRequest) {
      return res.status(404).json({ success: false, message: "Blood request not found." });
    }

    const currentUserId = String(req.user.id || req.user._id);
    const requesterId = targetRequest.requesterId ? String(targetRequest.requesterId) : null;
    const isOwner = requesterId && currentUserId === requesterId;
    const isPrivileged = req.user.role === "Admin" || req.user.role === "Member";

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to delete this request.",
      });
    }

    await BloodRequest.findByIdAndDelete(requestId);

    return res.json({
      success: true,
      message: "Blood request deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting blood request:", error);
    return res.status(500).json({ success: false, message: "Failed to delete blood request." });
  }
});

// 4. GET /api/blood/donors (Public - Lists registered campus donors with 90-day cooldown status)
router.get("/donors", async (req, res) => {
  try {
    const { bloodGroup } = req.query;
    const filter = {
      isAvailableForDonation: { $ne: false },
    };

    if (bloodGroup && bloodGroup !== "All") {
      filter.bloodGroup = bloodGroup;
    }

    const donors = await Donor.find(filter)
      .populate("department", "name code")
      .populate("addedBy", "name email role")
      .lean();

    const donorsWithCooldown = donors.map((donor) => {
      const cooldown = calculateCooldown(donor.lastDonatedAt);
      return {
        ...donor,
        ...cooldown,
      };
    });

    // Sort: Eligible donors first, then by daysRemaining ascending
    donorsWithCooldown.sort((a, b) => {
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      return a.daysRemaining - b.daysRemaining;
    });

    return res.json({
      success: true,
      count: donorsWithCooldown.length,
      donors: donorsWithCooldown,
    });
  } catch (error) {
    console.error("Error fetching donors:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch donors." });
  }
});

// 5. POST /api/blood/donors (Authenticated - Newly add a Member or Student as a donor)
router.post("/donors", requireAuth, async (req, res) => {
  try {
    const {
      name,
      role,
      bloodGroup,
      phone,
      department,
      studentId,
      lastDonatedAt,
      isAvailableForDonation,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Donor full name is required." });
    }
    if (!bloodGroup) {
      return res.status(400).json({ success: false, message: "Blood group is required." });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: "Contact phone number is required." });
    }

    const donorRole = ["Student", "Member"].includes(role) ? role : "Student";

    const newDonor = await Donor.create({
      name: name.trim(),
      role: donorRole,
      bloodGroup,
      phone: phone.trim(),
      department: department || null,
      studentId: studentId ? studentId.trim() : null,
      lastDonatedAt: lastDonatedAt ? new Date(lastDonatedAt) : null,
      isAvailableForDonation: isAvailableForDonation ?? true,
      addedBy: req.user.id || req.user._id,
    });

    const populated = await Donor.findById(newDonor._id)
      .populate("department", "name code")
      .populate("addedBy", "name email role")
      .lean();

    const cooldown = calculateCooldown(populated.lastDonatedAt);

    return res.status(201).json({
      success: true,
      message: `New ${donorRole} donor added successfully to campus directory!`,
      donor: {
        ...populated,
        ...cooldown,
      },
    });
  } catch (error) {
    console.error("Error creating campus donor:", error);
    return res.status(500).json({ success: false, message: "Failed to add donor." });
  }
});

// 6. PATCH /api/blood/donors/:donorId (Authenticated - Edit donor details)
router.patch("/donors/:donorId", requireAuth, async (req, res) => {
  try {
    const { donorId } = req.params;
    const {
      name,
      role,
      bloodGroup,
      phone,
      department,
      studentId,
      lastDonatedAt,
      isAvailableForDonation,
    } = req.body;

    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: "Donor not found." });
    }

    const currentUserId = String(req.user.id || req.user._id);
    const addedById = donor.addedBy ? String(donor.addedBy) : null;
    const isOwner = addedById && currentUserId === addedById;
    const isPrivileged = req.user.role === "Admin" || req.user.role === "Member";

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ success: false, message: "Forbidden: You cannot edit this donor." });
    }

    if (name) donor.name = name.trim();
    if (role && ["Student", "Member"].includes(role)) donor.role = role;
    if (bloodGroup) donor.bloodGroup = bloodGroup;
    if (phone) donor.phone = phone.trim();
    if (department !== undefined) donor.department = department || null;
    if (studentId !== undefined) donor.studentId = studentId ? studentId.trim() : null;
    if (lastDonatedAt !== undefined) {
      donor.lastDonatedAt = lastDonatedAt ? new Date(lastDonatedAt) : null;
    }
    if (typeof isAvailableForDonation === "boolean") {
      donor.isAvailableForDonation = isAvailableForDonation;
    }

    await donor.save();

    const updated = await Donor.findById(donorId)
      .populate("department", "name code")
      .populate("addedBy", "name email role")
      .lean();

    const cooldown = calculateCooldown(updated.lastDonatedAt);

    return res.json({
      success: true,
      message: "Donor profile updated successfully.",
      donor: {
        ...updated,
        ...cooldown,
      },
    });
  } catch (error) {
    console.error("Error editing donor:", error);
    return res.status(500).json({ success: false, message: "Failed to edit donor." });
  }
});

// 7. DELETE /api/blood/donors/:donorId (Authenticated - Delete donor)
router.delete("/donors/:donorId", requireAuth, async (req, res) => {
  try {
    const { donorId } = req.params;
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: "Donor not found." });
    }

    const currentUserId = String(req.user.id || req.user._id);
    const addedById = donor.addedBy ? String(donor.addedBy) : null;
    const isOwner = addedById && currentUserId === addedById;
    const isPrivileged = req.user.role === "Admin" || req.user.role === "Member";

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ success: false, message: "Forbidden: You cannot delete this donor." });
    }

    await Donor.findByIdAndDelete(donorId);

    return res.json({
      success: true,
      message: "Donor removed successfully from campus directory.",
    });
  } catch (error) {
    console.error("Error deleting donor:", error);
    return res.status(500).json({ success: false, message: "Failed to delete donor." });
  }
});

// 8. POST /api/blood/register-donor (Alias for adding/registering donor)
router.post("/register-donor", requireAuth, async (req, res) => {
  try {
    const {
      name,
      role,
      bloodGroup,
      phone,
      department,
      studentId,
      lastDonatedAt,
      isAvailableForDonation,
    } = req.body;

    const donorName = name && name.trim() ? name.trim() : req.user.name;
    const donorRole = ["Student", "Member"].includes(role) ? role : (req.user.role === "Member" ? "Member" : "Student");

    const newDonor = await Donor.create({
      name: donorName,
      role: donorRole,
      bloodGroup: bloodGroup || "O+",
      phone: phone ? phone.trim() : (req.user.phone || ""),
      department: department || null,
      studentId: studentId ? studentId.trim() : null,
      lastDonatedAt: lastDonatedAt ? new Date(lastDonatedAt) : null,
      isAvailableForDonation: isAvailableForDonation ?? true,
      addedBy: req.user.id || req.user._id,
    });

    const populated = await Donor.findById(newDonor._id)
      .populate("department", "name code")
      .populate("addedBy", "name email role")
      .lean();

    const cooldown = calculateCooldown(populated.lastDonatedAt);

    return res.json({
      success: true,
      message: "Campus donor registered successfully!",
      donor: {
        ...populated,
        ...cooldown,
      },
    });
  } catch (error) {
    console.error("Error in register-donor alias:", error);
    return res.status(500).json({ success: false, message: "Failed to register donor." });
  }
});

// 6. POST /api/blood/log-donation (Authenticated - Logs recent donation date & updates cooldown)
router.post("/log-donation", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { donationDate, bloodGroup, phone, isAvailableForDonation } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User profile not found." });
    }

    if (donationDate) {
      user.lastDonatedAt = new Date(donationDate);
    } else {
      user.lastDonatedAt = new Date();
    }

    if (bloodGroup) user.bloodGroup = bloodGroup;
    if (phone) user.phone = phone.trim();
    if (typeof isAvailableForDonation === "boolean") {
      user.isAvailableForDonation = isAvailableForDonation;
    }

    await user.save();

    const cooldown = calculateCooldown(user.lastDonatedAt);

    return res.json({
      success: true,
      message: "Blood donation record logged successfully. 90-day cooldown updated.",
      user: {
        id: user._id,
        name: user.name,
        bloodGroup: user.bloodGroup,
        phone: user.phone,
        isAvailableForDonation: user.isAvailableForDonation,
        ...cooldown,
      },
    });
  } catch (error) {
    console.error("Error logging donation:", error);
    return res.status(500).json({ success: false, message: "Failed to log donation." });
  }
});

// 7. GET /api/blood/my-status (Authenticated - Current user's donor status)
router.get("/my-status", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId)
      .select("name email phone bloodGroup lastDonatedAt isAvailableForDonation department studentId role")
      .populate("department", "name code")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const cooldown = calculateCooldown(user.lastDonatedAt);

    return res.json({
      success: true,
      donor: {
        ...user,
        ...cooldown,
      },
    });
  } catch (error) {
    console.error("Error fetching my blood status:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch donor status." });
  }
});

export default router;
