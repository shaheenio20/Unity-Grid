import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HeartHandshake,
  Droplet,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  Filter,
  Users,
  Pencil,
  Trash2,
  Building2,
  GraduationCap,
  UserRound,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { useCurrentUser } from "../../../lib/useCurrentUser";
import { showAlert, showConfirmDelete, showToast } from "../../../lib/alerts";
import sylhetDonorsData from "../../../data/sylhetDonors.json";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BLOOD_GROUPS = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const BloodBank = () => {
  const navigate = useNavigate();
  const { user, session, isAdmin, isMember } = useCurrentUser();

  // Navigation tab: "requests" | "donors"
  const [activeTab, setActiveTab] = useState("requests");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [statusFilter, setStatusFilter] = useState("Pending"); // "All" | "Pending" | "Fulfilled"

  // Data states (NO dummy/seed data)
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showSylhetModal, setShowSylhetModal] = useState(false);
  const [sylhetSearch, setSylhetSearch] = useState("");
  const [sylhetGroupFilter, setSylhetGroupFilter] = useState("All");
  const [sylhetPage, setSylhetPage] = useState(1);
  const sylhetPageSize = 25;
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ text: "", type: "" });

  const initialRequestForm = {
    patientName: "",
    bloodGroup: "O+",
    unitsNeeded: 1,
    hospital: "",
    location: "",
    contactNumber: "",
    urgency: "Urgent",
    requiredDate: "",
    status: "Pending",
    additionalNotes: "",
  };

  // Request Form
  const [requestForm, setRequestForm] = useState(initialRequestForm);

  // Departments list for dropdown
  const [departments, setDepartments] = useState([]);

  // Initial Donor Form
  const initialDonorForm = {
    name: "",
    role: "Student", // "Student" | "Member"
    bloodGroup: "O+",
    phone: "",
    department: "",
    studentId: "",
    lastDonatedAt: "",
    isAvailableForDonation: true,
  };

  // Campus Donation / Donor Form State
  const [donorForm, setDonorForm] = useState(initialDonorForm);
  const [editingDonorId, setEditingDonorId] = useState(null);

  // Fetch departments list
  useEffect(() => {
    fetch(`${API_BASE}/api/departments`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.departments) {
          setDepartments(data.departments);
        }
      })
      .catch(() => { });
  }, []);

  // Fetch Blood Requests
  const fetchRequests = async () => {
    try {
      const query = new URLSearchParams();
      if (selectedGroup !== "All") query.append("bloodGroup", selectedGroup);
      if (statusFilter !== "All") query.append("status", statusFilter);

      const res = await fetch(`${API_BASE}/api/blood/requests?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    }
  };

  // Fetch Donors
  const fetchDonors = async () => {
    try {
      const query = new URLSearchParams();
      if (selectedGroup !== "All") query.append("bloodGroup", selectedGroup);

      const res = await fetch(`${API_BASE}/api/blood/donors?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDonors(data.donors || []);
      }
    } catch (err) {
      console.error("Failed to load donors:", err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchRequests(), fetchDonors()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [selectedGroup, statusFilter]);

  // Open Modal for Create (Admin Only)
  const handleOpenCreateModal = () => {
    if (!isAdmin) {
      showAlert.error("Admin Only", "Only administrators can create or post blood requests.");
      return;
    }
    setEditingRequestId(null);
    setRequestForm(initialRequestForm);
    setShowRequestModal(true);
  };

  // Open Modal for Edit (Admin Only)
  const handleOpenEditModal = (req) => {
    if (!isAdmin) {
      showAlert.error("Admin Only", "Only administrators can edit blood requests.");
      return;
    }
    setEditingRequestId(req._id);
    let formattedDate = "";
    if (req.requiredDate) {
      const d = new Date(req.requiredDate);
      if (!isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2, "0");
        formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    }
    setRequestForm({
      patientName: req.patientName || "",
      bloodGroup: req.bloodGroup || "O+",
      unitsNeeded: req.unitsNeeded || 1,
      hospital: req.hospital || "",
      location: req.location || "",
      contactNumber: req.contactNumber || "",
      urgency: req.urgency || "Urgent",
      requiredDate: formattedDate,
      status: req.status || "Pending",
      additionalNotes: req.additionalNotes || "",
    });
    setShowRequestModal(true);
  };

  // Submit or Update Blood Request (Admin Only)
  const handleSaveRequest = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      showAlert.error("Admin Only", "Only administrators can save or update blood requests.");
      return;
    }
    setSubmitting(true);
    try {
      const isEditing = Boolean(editingRequestId);
      const url = isEditing
        ? `${API_BASE}/api/blood/requests/${editingRequestId}`
        : `${API_BASE}/api/blood/requests`;
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowRequestModal(false);
        setEditingRequestId(null);
        setRequestForm(initialRequestForm);
        fetchRequests();
        showAlert.success(
          isEditing ? "Request Updated!" : "Request Posted!",
          isEditing
            ? "Blood request has been updated successfully."
            : "Emergency blood request published successfully."
        );
      } else {
        showAlert.error(
          "Submission Failed",
          data.message || (isEditing ? "Failed to update blood request." : "Failed to post blood request.")
        );
      }
    } catch {
      showAlert.error("Network Error", "Error saving request. Please check server connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Blood Request (Admin Only)
  const handleDeleteRequest = async (requestId, patientName) => {
    if (!isAdmin) {
      showAlert.error("Admin Only", "Only administrators can delete blood requests.");
      return;
    }
    const confirmed = await showConfirmDelete(
      `the blood request for ${patientName || "this patient"}`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/blood/requests/${requestId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        fetchRequests();
        showAlert.success("Deleted!", "Blood request has been removed successfully.");
      } else {
        showAlert.error("Delete Failed", data.message || "Failed to delete request.");
      }
    } catch {
      showAlert.error("Error", "Error deleting blood request.");
    }
  };

  // One-Click Direct Triage / Emergency Chat Dispatch
  const handleEmergencyChat = async (bloodReq) => {
    if (!user) {
      showAlert.error("Sign In Required", "Please sign in to start an emergency chat with Admin.");
      navigate("/login");
      return;
    }

    try {
      showToast.info("Connecting to Emergency Dispatch...");
      const res = await fetch(`${API_BASE}/api/messages/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category: "Blood_Emergency",
          subject: `🩸 [Blood Alert] ${bloodReq.bloodGroup} needed at ${bloodReq.hospital}`,
          initialMessage: `Patient: ${bloodReq.patientName}\nBlood Group: ${bloodReq.bloodGroup}\nUnits Needed: ${bloodReq.unitsNeeded} Bag(s)\nHospital: ${bloodReq.hospital}, ${bloodReq.location}\nNeeded by: ${new Date(bloodReq.requiredDate).toLocaleDateString()}\nContact Phone: ${bloodReq.contactNumber}\nNotes: ${bloodReq.additionalNotes || "Urgent assistance required."}`,
          urgency: bloodReq.urgency === "Critical" ? "Critical" : "High",
          emergencyMeta: {
            relatedType: "BloodRequest",
            relatedId: bloodReq._id,
            bloodGroup: bloodReq.bloodGroup,
            hospital: bloodReq.hospital,
            unitsNeeded: bloodReq.unitsNeeded,
            contactNumber: bloodReq.contactNumber,
            location: bloodReq.location,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.conversation?._id) {
        showToast.success(
          data.isExisting
            ? "Opening active emergency conversation..."
            : "Emergency request submitted to Admin queue."
        );
        navigate(`/messages?id=${data.conversation._id}`, {
          state: { conversationId: data.conversation._id },
        });
      } else {
        showAlert.error("Dispatch Failed", data.message || "Failed to start emergency chat.");
      }
    } catch (err) {
      console.error("Emergency chat dispatch error:", err);
      showAlert.error("Network Error", "Unable to connect to the emergency dispatch desk.");
    }
  };

  // Update Status (Fulfilled / Cancelled / Reopen - Admin Only)
  const handleUpdateStatus = async (requestId, newStatus) => {
    if (!isAdmin) {
      showAlert.error("Admin Only", "Only administrators can update blood request status.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/blood/requests/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRequests();
        showToast.success(
          newStatus === "Pending"
            ? "Request reopened and set to Active!"
            : `Request marked as ${newStatus}!`
        );
      } else {
        showAlert.error("Status Update Failed", data.message || "Failed to update status.");
      }
    } catch {
      showAlert.error("Error", "Error updating request status.");
    }
  };

  // Open Modal to Newly Add a Member or Student Donor (Admin Only)
  const handleOpenAddDonorModal = () => {
    if (!isAdmin) {
      showAlert.error("Admin Only", "Only administrators can add or register campus donors.");
      return;
    }
    setEditingDonorId(null);
    setDonorForm(initialDonorForm);
    setShowDonationModal(true);
  };

  // Open Modal to Edit an Existing Donor (Admin Only)
  const handleOpenEditDonorModal = (donor) => {
    if (!isAdmin) {
      showAlert.error("Admin Only", "Only administrators can edit campus donors.");
      return;
    }
    setEditingDonorId(donor._id);
    let formattedDate = "";
    if (donor.lastDonatedAt) {
      const d = new Date(donor.lastDonatedAt);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().slice(0, 10);
      }
    }
    setDonorForm({
      name: donor.name || "",
      role: donor.role || "Student",
      bloodGroup: donor.bloodGroup || "O+",
      phone: donor.phone || "",
      department: donor.department?._id || donor.department || "",
      studentId: donor.studentId || "",
      lastDonatedAt: formattedDate,
      isAvailableForDonation: donor.isAvailableForDonation ?? true,
    });
    setShowDonationModal(true);
  };

  // Submit Campus Donation Form (Create or Update Donor Record - Admin Only)
  const handleSaveDonor = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      showAlert.error("Admin Only", "Only administrators can add or edit campus donors.");
      return;
    }

    setSubmitting(true);
    try {
      const isEditing = Boolean(editingDonorId);
      const url = isEditing
        ? `${API_BASE}/api/blood/donors/${editingDonorId}`
        : `${API_BASE}/api/blood/donors`;
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(donorForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowDonationModal(false);
        setEditingDonorId(null);
        setDonorForm(initialDonorForm);
        fetchDonors();
        showAlert.success(
          isEditing ? "Donor Profile Updated!" : "New Donor Added!",
          isEditing
            ? `Donor profile for '${donorForm.name}' has been updated successfully.`
            : `New ${donorForm.role} donor '${donorForm.name}' (${donorForm.bloodGroup}) added to the campus directory!`
        );
      } else {
        showAlert.error("Operation Failed", data.message || "Failed to save donor profile.");
      }
    } catch {
      showAlert.error("Network Error", "Error submitting campus donation form.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Donor Record (Admin Only)
  const handleDeleteDonor = async (donorId, donorName) => {
    if (!isAdmin) {
      showAlert.error("Admin Only", "Only administrators can delete campus donors.");
      return;
    }
    const confirmed = await showConfirmDelete(`donor '${donorName || "this donor"}'`);
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/blood/donors/${donorId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        fetchDonors();
        showAlert.success("Deleted!", `Donor '${donorName}' has been removed from the registry.`);
      } else {
        showAlert.error("Delete Failed", data.message || "Failed to delete donor.");
      }
    } catch {
      showAlert.error("Error", "Error deleting donor record.");
    }
  };

  // Filtered Sylhet Regional Donors (from Need blood (Sylhet).pdf)
  const filteredSylhetDonors = sylhetDonorsData.filter((d) => {
    const matchesGroup =
      sylhetGroupFilter === "All" || d.bloodGroup === sylhetGroupFilter;
    const q = sylhetSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.location.toLowerCase().includes(q) ||
      d.phone.includes(q);
    return matchesGroup && matchesSearch;
  });

  const totalSylhetPages = Math.ceil(filteredSylhetDonors.length / sylhetPageSize) || 1;
  const currentSylhetDonors = filteredSylhetDonors.slice(
    (sylhetPage - 1) * sylhetPageSize,
    sylhetPage * sylhetPageSize
  );

  // Critical alerts count
  const criticalRequests = requests.filter(
    (r) => r.urgency === "Critical" && r.status === "Pending"
  );
  const eligibleDonorsCount = donors.filter((d) => d.isEligible).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-20">
      {/* ──────────────── HERO & EMERGENCY SUMMARY ──────────────── */}
      <section className="bg-gradient-to-b from-[#101b33] via-[#172b53] to-[#12213f] text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-700/60 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold mb-3 backdrop-blur-xs">
                <span className="size-2 rounded-full bg-red-400 animate-ping" />
                <span>Emergency Blood Logistics Hub</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3">
                <span>Campus Blood Network</span>
                <Droplet className="text-red-500 fill-red-500" size={32} />
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Connect urgent patients with matched campus donors instantly. Automated 90-day cooldown logistics ensure donor recovery and medical safety.
              </p>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 text-xs font-black shadow-lg shadow-red-900/40 transition active:scale-95"
                >
                  <Plus size={16} /> Request Blood
                </button>

                <button
                  onClick={handleOpenAddDonorModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 text-xs font-bold border border-white/20 backdrop-blur-xs transition"
                >
                  <HeartHandshake size={16} />
                  <span>Add Campus Donor</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Metrics KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-700/60">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 sm:p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Active Requests
              </p>
              <p className="text-2xl font-black text-white mt-1">
                {requests.filter((r) => r.status === "Pending").length}
              </p>
            </div>

            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3.5 sm:p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-red-300 flex items-center gap-1">
                <AlertTriangle size={12} /> Critical Need
              </p>
              <p className="text-2xl font-black text-red-400 mt-1">{criticalRequests.length}</p>
            </div>

            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 sm:p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                Registered Donors
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-400">{donors.length}</span>
                <span className="text-[10px] text-emerald-200/80">({eligibleDonorsCount} ready now)</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 sm:p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Cooldown Rule
              </p>
              <p className="text-2xl font-black text-slate-200 mt-1">90 Days</p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── CRITICAL URGENCY FLASH BANNER ──────────────── */}
      {criticalRequests.length > 0 && (
        <div className="bg-red-600 text-white py-3 px-4 shadow-md">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-1 rounded-lg bg-white/20 animate-pulse shrink-0">
                <AlertTriangle size={18} />
              </span>
              <p className="text-xs sm:text-sm font-black">
                URGENT ATTENTION REQUIRED: {criticalRequests[0].patientName} requires{" "}
                <strong className="underline">{criticalRequests[0].bloodGroup}</strong> (
                {criticalRequests[0].unitsNeeded} Bags) at {criticalRequests[0].hospital}.
              </p>
            </div>
            <a
              href={`tel:${criticalRequests[0].contactNumber}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white text-red-700 px-3 py-1.5 text-xs font-black hover:bg-red-50 transition shrink-0"
            >
              <Phone size={13} /> Call {criticalRequests[0].contactNumber}
            </a>
          </div>
        </div>
      )}

      {/* ──────────────── MAIN CONTAINER ──────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Global Feedback Banner */}
        {feedback.text && (
          <div
            className={`rounded-2xl p-3.5 text-xs font-bold flex items-center gap-2 ${feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
              }`}
          >
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Navigation & Blood Group Filters */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            {/* View Switcher Tabs + More Donors Button Container */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Row 1 on mobile: 2 main tabs side-by-side (50% each on mobile) */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("requests")}
                  className={`rounded-xl px-2.5 py-2 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === "requests"
                      ? "bg-[#173b69] text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Droplet size={13} className={activeTab === "requests" ? "text-red-300" : "text-red-500"} />
                  <span>Patients & Requests</span>
                  <span className="rounded-full bg-slate-800/20 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-black">
                    {requests.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("donors")}
                  className={`rounded-xl px-2.5 py-2 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === "donors"
                      ? "bg-[#173b69] text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Users size={13} />
                  <span>Campus Donors</span>
                  <span className="rounded-full bg-slate-800/20 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-black">
                    {donors.length}
                  </span>
                </button>
              </div>

              {/* Row 2 on mobile: More Donors button full-width underneath! */}
              <button
                type="button"
                onClick={() => setShowSylhetModal(true)}
                className="w-full sm:w-auto rounded-xl px-3.5 py-2 text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 shadow-2xs"
                title="Browse 370+ Sylhet Regional Donors from PDF sheet"
              >
                <Users size={13} className="text-red-600" />
                <span>More Donors (Sylhet)</span>
                <span className="rounded-full bg-red-200 text-red-900 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-black">
                  376
                </span>
              </button>
            </div>

            {/* Request Status Filter (Only in Requests Tab) */}
            {activeTab === "requests" && (
              <div className="flex items-center gap-1.5 text-xs overflow-x-auto py-0.5 shrink-0 self-start md:self-auto">
                <span className="text-slate-400 font-semibold text-[10px] sm:text-[11px]">Status:</span>
                {["Pending", "Fulfilled", "All"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-lg px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold transition shrink-0 ${
                      statusFilter === st
                        ? "bg-slate-800 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Blood Group Quick Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-400 mr-1.5 flex items-center gap-1">
              <Filter size={12} /> Blood Group:
            </span>
            {BLOOD_GROUPS.map((bg) => (
              <button
                key={bg}
                onClick={() => setSelectedGroup(bg)}
                className={`rounded-xl px-3 py-1.5 text-xs font-black transition shrink-0 ${selectedGroup === bg
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-700 hover:border-red-300 hover:text-red-600"
                  }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>

        {/* ──────────────── TAB 1: BLOOD REQUESTS FEED ──────────────── */}
        {activeTab === "requests" && (
          <div>
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <div className="size-8 mx-auto border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
                Loading blood requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
                <Droplet size={40} className="mx-auto text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-700 text-sm">No Blood Requests Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  There are currently no blood requests matching your selected filter. All data is fetched live from the campus database.
                </p>
                {isAdmin && (
                  <button
                    onClick={handleOpenCreateModal}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition"
                  >
                    <Plus size={14} /> Post a Blood Request
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {requests.map((req) => {
                  const canManage = Boolean(isAdmin);

                  return (
                    <div
                      key={req._id}
                      className={`rounded-3xl border bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between ${req.urgency === "Critical" && req.status === "Pending"
                          ? "border-red-300 ring-2 ring-red-500/10"
                          : "border-slate-200/90"
                        }`}
                    >
                      <div>
                        {/* Header: Blood Group & Urgency Pill */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span className="size-11 rounded-2xl bg-red-50 text-red-600 font-black text-base flex items-center justify-center border border-red-200 shadow-xs">
                              {req.bloodGroup}
                            </span>
                            <div>
                              <span className="text-[10px] font-black uppercase text-slate-400">
                                Required:
                              </span>
                              <p className="text-xs font-bold text-slate-800">
                                {req.unitsNeeded} {req.unitsNeeded > 1 ? "Bags" : "Bag"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {req.status === "Pending" ? (
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${req.urgency === "Critical"
                                    ? "bg-red-100 text-red-800 border border-red-300 animate-pulse"
                                    : req.urgency === "Urgent"
                                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                                      : "bg-blue-50 text-blue-800 border border-blue-200"
                                  }`}
                              >
                                {req.urgency}
                              </span>
                            ) : req.status === "Fulfilled" ? (
                              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-xs">
                                <CheckCircle2 size={11} className="text-emerald-700" />
                                <span>Fulfilled</span>
                              </span>
                            ) : (
                              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                Cancelled
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Patient & Medical Details */}
                        <div className="mt-3.5 space-y-2 text-xs">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-slate-400">
                              Patient Name:
                            </span>
                            <p className="font-bold text-slate-800">{req.patientName}</p>
                          </div>

                          <div className="flex items-start gap-1.5 text-slate-600">
                            <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
                            <span className="truncate">
                              {req.hospital}, {req.location}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Clock size={13} className="text-slate-400 shrink-0" />
                            <span>
                              Needed by: {new Date(req.requiredDate).toLocaleDateString()} (
                              {new Date(req.requiredDate).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              )
                            </span>
                          </div>

                          {req.additionalNotes && (
                            <p className="p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-600 border border-slate-100 italic">
                              "{req.additionalNotes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Call Action & Management */}
                      <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                        {req.status === "Pending" ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <a
                              href={`tel:${req.contactNumber}`}
                              className="flex items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white py-2 text-xs font-bold transition shadow-xs truncate"
                            >
                              <Phone size={13} className="shrink-0" /> <span className="truncate">Call: {req.contactNumber}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleEmergencyChat(req)}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 py-2 text-xs font-bold transition shadow-2xs truncate"
                              title="Start emergency live triage and chat with dispatch admin"
                            >
                              <MessageSquare size={13} className="shrink-0" />
                              <span className="truncate">Emergency Chat</span>
                            </button>
                          </div>
                        ) : req.status === "Fulfilled" ? (
                          <div className="w-full rounded-2xl bg-emerald-50/90 border border-emerald-200 p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-xs">
                              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                              <span>Blood Arranged · Request Fulfilled</span>
                            </div>
                            <p className="text-[10px] text-emerald-700/80 mt-0.5">
                              Ref Contact: {req.contactNumber}
                            </p>
                          </div>
                        ) : (
                          <div className="w-full rounded-2xl bg-slate-100 border border-slate-200 p-2.5 text-center text-slate-500 font-bold text-xs">
                            Request Cancelled
                          </div>
                        )}

                        {/* Actions for PENDING request */}
                        {canManage && req.status === "Pending" && (
                          <>
                            <div className="flex items-center gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(req)}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 text-xs font-bold transition"
                                title="Edit blood request"
                              >
                                <Pencil size={13} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRequest(req._id, req.patientName)}
                                className="rounded-xl px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-1.5 text-xs font-bold transition flex items-center gap-1"
                                title="Delete blood request"
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateStatus(req._id, "Fulfilled")}
                                className="flex-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-1.5 text-[11px] font-bold transition"
                              >
                                Mark Fulfilled
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(req._id, "Cancelled")}
                                className="rounded-xl px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 py-1.5 text-[11px] font-bold transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        )}

                        {/* Actions for FULFILLED or CANCELLED request (Delete only) */}
                        {canManage && req.status !== "Pending" && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteRequest(req._id, req.patientName)}
                              className="w-full rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-1.5 text-xs font-bold transition flex items-center justify-center gap-1.5"
                              title="Delete request"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ──────────────── TAB 2: ELIGIBLE DONORS DIRECTORY ──────────────── */}
        {activeTab === "donors" && (
          <div className="space-y-4">
            {/* Campus Donation Call-To-Action Banner */}
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-red-50/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center border border-red-200 shrink-0">
                  <HeartHandshake size={22} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-800">
                    Campus Donor Registry (Students & Members)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Join the campus life-saving network by registering your blood group and emergency contact.
                  </p>
                </div>
              </div>

              {isAdmin && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenAddDonorModal}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173b69] hover:bg-[#122e53] text-white px-4 py-2.5 text-xs font-bold shadow-xs transition"
                  >
                    <Plus size={15} />
                    <span>Add Campus Donor</span>
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <div className="size-8 mx-auto border-2 border-[#173b69] border-t-transparent rounded-full animate-spin mb-3" />
                Loading donor network...
              </div>
            ) : donors.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
                <Users size={40} className="mx-auto text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-700 text-sm">No Campus Donors Registered Yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  No campus students or members are listed for this blood group yet. You can add one, or browse 370+ donors from the Sylhet Regional Directory!
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSylhetModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition"
                  >
                    <Users size={14} /> View 370+ Sylhet Donors
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleOpenAddDonorModal}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#173b69] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#122e53] transition"
                    >
                      <Plus size={14} /> Add Campus Donor
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {donors.map((donor) => {
                  const canManageDonor = Boolean(isAdmin);

                  return (
                    <div
                      key={donor._id}
                      className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        {/* Donor Profile Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-[#173b69] text-white font-black text-xs flex items-center justify-center shadow-xs">
                              {donor.name ? donor.name[0].toUpperCase() : "U"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{donor.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                                    donor.role === "Member"
                                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                                      : "bg-blue-50 text-blue-700 border border-blue-200"
                                  }`}
                                >
                                  {donor.role || "Student"}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate">
                                  {donor.department?.code || ""}
                                </span>
                              </div>
                            </div>
                          </div>

                          <span className="size-8 rounded-xl bg-red-50 text-red-600 font-black text-xs flex items-center justify-center border border-red-100 shrink-0">
                            {donor.bloodGroup}
                          </span>
                        </div>

                        {/* 90-Day Cooldown Status Badge */}
                        <div className="mt-3.5 space-y-2">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                              Donation Eligibility:
                            </span>
                            <div className="mt-1">
                              {donor.isEligible ? (
                                <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-black text-emerald-800">
                                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Available to Donate</span>
                                </div>
                              ) : (
                                <div className="rounded-xl bg-amber-50 border border-amber-200 p-2 text-amber-900">
                                  <p className="text-[11px] font-black flex items-center gap-1">
                                    <Clock size={11} /> Cooldown Active
                                  </p>
                                  <p className="text-[10px] text-amber-800 mt-0.5">
                                    {donor.daysRemaining} days remaining before eligible.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {donor.lastDonatedAt && (
                            <p className="text-[10px] text-slate-400">
                              Last donated: {new Date(donor.lastDonatedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Contact & Management Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                        {donor.phone ? (
                          <a
                            href={`tel:${donor.phone}`}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 py-2 text-xs font-bold text-slate-700 transition"
                          >
                            <Phone size={13} className="text-slate-500" />
                            <span>Call Donor ({donor.phone})</span>
                          </a>
                        ) : (
                          <span className="block text-center text-[10px] text-slate-400 py-1.5">
                            Phone not publicly shared
                          </span>
                        )}

                        {canManageDonor && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditDonorModal(donor)}
                              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 text-xs font-bold transition"
                              title="Edit donor"
                            >
                              <Pencil size={12} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDonor(donor._id, donor.name)}
                              className="rounded-xl px-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-1.5 text-xs font-bold transition flex items-center gap-1"
                              title="Delete donor"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ──────────────── MODAL 1: REQUEST BLOOD (CREATE & EDIT) ──────────────── */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Droplet size={18} className="text-red-600 fill-red-600" />
                {editingRequestId ? "Edit Blood Request" : "Post Emergency Blood Request"}
              </h3>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setEditingRequestId(null);
                }}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRequest} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Patient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahim Uddin"
                  value={requestForm.patientName}
                  onChange={(e) => setRequestForm({ ...requestForm, patientName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Blood Group *
                  </label>
                  <select
                    required
                    value={requestForm.bloodGroup}
                    onChange={(e) => setRequestForm({ ...requestForm, bloodGroup: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-red-600"
                  >
                    {BLOOD_GROUPS.filter((g) => g !== "All").map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Units Needed *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={requestForm.unitsNeeded}
                    onChange={(e) => setRequestForm({ ...requestForm, unitsNeeded: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Urgency Level *</label>
                  <select
                    value={requestForm.urgency}
                    onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-red-600"
                  >
                    <option value="Critical">Critical (Immediate / Emergency)</option>
                    <option value="Urgent">Urgent (Within 24 Hours)</option>
                    <option value="Standard">Standard (Scheduled Surgery)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Required Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={requestForm.requiredDate}
                    onChange={(e) => setRequestForm({ ...requestForm, requiredDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Hospital / Clinic *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sylhet MAG Osmani Medical College Hospital"
                  value={requestForm.hospital}
                  onChange={(e) => setRequestForm({ ...requestForm, hospital: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Location / Area *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sylhet Sadar"
                    value={requestForm.location}
                    onChange={(e) => setRequestForm({ ...requestForm, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Emergency Contact Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 01700000000"
                    value={requestForm.contactNumber}
                    onChange={(e) => setRequestForm({ ...requestForm, contactNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Status field when editing */}
              {editingRequestId && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Request Status *
                  </label>
                  <select
                    value={requestForm.status}
                    onChange={(e) => setRequestForm({ ...requestForm, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-red-600 font-semibold"
                  >
                    <option value="Pending">Pending (Searching for donors)</option>
                    <option value="Fulfilled">Fulfilled (Donor found / Completed)</option>
                    <option value="Cancelled">Cancelled (No longer needed)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Platelets needed, cross-matching required..."
                  value={requestForm.additionalNotes}
                  onChange={(e) => setRequestForm({ ...requestForm, additionalNotes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-red-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false);
                    setEditingRequestId(null);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 text-xs font-black text-white shadow-sm transition"
                >
                  {submitting
                    ? "Saving..."
                    : editingRequestId
                      ? "Update Blood Request"
                      : "Publish Emergency Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL 2: ADD / EDIT CAMPUS DONOR (MEMBERS & STUDENTS) ──────────────── */}
      {showDonationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <HeartHandshake size={20} className="text-red-600" />
                  {editingDonorId ? "Edit Campus Donor Profile" : "Add Campus Donor (Student / Member)"}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {editingDonorId
                    ? "Update donor details and medical cooldown"
                    : "Newly add a student or member to the campus blood registry"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDonationModal(false);
                  setEditingDonorId(null);
                }}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDonor} className="p-6 overflow-y-auto space-y-4">
              {/* 1. Donor Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Donor Full Name *
                </label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2.5 h-10 focus-within:border-red-600 bg-white">
                  <UserRound size={15} className="text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Hasan"
                    value={donorForm.name}
                    onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })}
                    className="w-full bg-transparent outline-none text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* 2. Donor Role: Student or Member */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Donor Role / Category *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDonorForm({ ...donorForm, role: "Student" })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      donorForm.role === "Student"
                        ? "bg-blue-50 border-blue-600 text-blue-800 ring-2 ring-blue-600/10 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <GraduationCap size={15} className={donorForm.role === "Student" ? "text-blue-700" : "text-slate-400"} />
                    <span>Campus Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDonorForm({ ...donorForm, role: "Member" })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      donorForm.role === "Member"
                        ? "bg-purple-50 border-purple-600 text-purple-800 ring-2 ring-purple-600/10 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Users size={15} className={donorForm.role === "Member" ? "text-purple-700" : "text-slate-400"} />
                    <span>Club Member</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Blood Group *
                  </label>
                  <select
                    required
                    value={donorForm.bloodGroup}
                    onChange={(e) => setDonorForm({ ...donorForm, bloodGroup: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-red-700 outline-none focus:border-red-600"
                  >
                    {BLOOD_GROUPS.filter((g) => g !== "All").map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Emergency Phone Number *
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2.5 h-10 focus-within:border-red-600 bg-white">
                    <Phone size={14} className="text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="01700000000"
                      value={donorForm.phone}
                      onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })}
                      className="w-full bg-transparent outline-none text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Academic Department
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2.5 h-10 focus-within:border-red-600 bg-white">
                    <Building2 size={14} className="text-slate-400 shrink-0" />
                    <select
                      value={donorForm.department}
                      onChange={(e) => setDonorForm({ ...donorForm, department: e.target.value })}
                      className="w-full bg-transparent outline-none text-xs text-slate-800"
                    >
                      <option value="">Select Department...</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Student / Member ID (Optional)
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2.5 h-10 focus-within:border-red-600 bg-white">
                    <GraduationCap size={14} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="e.g. 2021331000"
                      value={donorForm.studentId}
                      onChange={(e) => setDonorForm({ ...donorForm, studentId: e.target.value })}
                      className="w-full bg-transparent outline-none text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Date of Last Blood Donation (Optional)
                </label>
                <input
                  type="date"
                  value={donorForm.lastDonatedAt}
                  onChange={(e) => setDonorForm({ ...donorForm, lastDonatedAt: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-red-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Enter donation date to activate 90-day medical recovery cooldown. Leave empty if never donated or donated long ago.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={donorForm.isAvailableForDonation}
                  onChange={(e) =>
                    setDonorForm({ ...donorForm, isAvailableForDonation: e.target.checked })
                  }
                  className="size-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="availCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  List this donor in the Campus Blood Donor Directory (Ready to help)
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowDonationModal(false);
                    setEditingDonorId(null);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#173b69] hover:bg-[#122e53] px-5 py-2.5 text-xs font-black text-white shadow-sm transition"
                >
                  {submitting
                    ? "Saving..."
                    : editingDonorId
                    ? "Update Donor Information"
                    : "Add Donor to Registry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL 3: MORE DONORS (SYLHET REGIONAL DIRECTORY) ──────────────── */}
      {showSylhetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-xs overflow-hidden">
          <div className="w-full max-w-5xl rounded-2xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden my-auto max-h-[96vh] sm:max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="size-8 sm:size-10 rounded-xl sm:rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Users size={18} className="sm:size-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h3 className="text-xs sm:text-base font-black text-slate-800 truncate">
                      Sylhet Donors Directory
                    </h3>
                    <span className="rounded-full bg-red-100 text-red-800 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.2 border border-red-200 shrink-0">
                      {filteredSylhetDonors.length}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                    Voluntary donor sheet from Sylhet district
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <a
                  href="/Need-blood-Sylhet.pdf"
                  download="Need-blood-Sylhet.pdf"
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-bold text-slate-700 shadow-2xs transition"
                  title="Download offline PDF document"
                >
                  <Download size={13} className="text-red-600" />
                  <span className="hidden xs:inline">PDF</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowSylhetModal(false)}
                  className="rounded-xl p-1 sm:p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-3 sm:p-4 border-b border-slate-100 bg-white space-y-2.5 shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* Search input */}
                <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-xl px-2.5 sm:px-3 h-9 sm:h-10 bg-slate-50 focus-within:bg-white focus-within:border-red-600 transition">
                  <Search size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={sylhetSearch}
                    onChange={(e) => {
                      setSylhetSearch(e.target.value);
                      setSylhetPage(1);
                    }}
                    placeholder="Search name, area, phone (e.g. Golapgonj, 017...)"
                    className="w-full bg-transparent outline-none text-[11px] sm:text-xs text-slate-800 placeholder:text-slate-400"
                  />
                  {sylhetSearch && (
                    <button
                      type="button"
                      onClick={() => setSylhetSearch("")}
                      className="text-slate-400 hover:text-slate-600 text-[10px] sm:text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Quick count info */}
                <div className="text-[11px] sm:text-xs text-slate-500 font-bold shrink-0 flex items-center justify-between sm:justify-start gap-1">
                  <span>Filtered Donors:</span>
                  <span className="text-red-600 font-black">{filteredSylhetDonors.length}</span>
                </div>
              </div>

              {/* Blood group pills - responsive scrolling on mobile */}
              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {BLOOD_GROUPS.map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => {
                      setSylhetGroupFilter(group);
                      setSylhetPage(1);
                    }}
                    className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-xl text-[10px] sm:text-xs font-bold transition shrink-0 ${
                      sylhetGroupFilter === group
                        ? "bg-red-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Container: Mobile Cards + Desktop Table */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5">
              {currentSylhetDonors.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Users size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">No Sylhet donors matched your search</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Try searching for a different area or blood group</p>
                </div>
              ) : (
                <>
                  {/* MOBILE VIEW (Screens < 640px): Clean Cards */}
                  <div className="block sm:hidden space-y-2">
                    {currentSylhetDonors.map((donor, idx) => {
                      const serial = (sylhetPage - 1) * sylhetPageSize + idx + 1;
                      return (
                        <div
                          key={donor.id || serial}
                          className="p-3 rounded-2xl border border-slate-200/90 bg-white shadow-2xs flex items-center justify-between gap-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="size-6 rounded-lg bg-red-50 text-red-700 font-black text-[10px] flex items-center justify-center border border-red-200 shrink-0">
                                {donor.bloodGroup}
                              </span>
                              <p className="font-bold text-xs text-slate-800 truncate">
                                {donor.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 truncate">
                              <MapPin size={11} className="text-slate-400 shrink-0" />
                              <span className="truncate">{donor.location}</span>
                            </div>
                          </div>

                          <a
                            href={`tel:${donor.phone}`}
                            className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 text-[11px] font-bold shadow-xs shrink-0 transition"
                          >
                            <Phone size={12} />
                            <span>Call</span>
                          </a>
                        </div>
                      );
                    })}
                  </div>

                  {/* DESKTOP VIEW (Screens >= 640px): Full Table */}
                  <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black text-[11px] uppercase tracking-wider">
                          <th className="py-3 px-3.5">#</th>
                          <th className="py-3 px-3.5">Donor Name</th>
                          <th className="py-3 px-3.5">Group</th>
                          <th className="py-3 px-3.5">Location / Area</th>
                          <th className="py-3 px-3.5 text-right">Emergency Contact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {currentSylhetDonors.map((donor, idx) => {
                          const serial = (sylhetPage - 1) * sylhetPageSize + idx + 1;
                          return (
                            <tr key={donor.id || serial} className="hover:bg-slate-50/80 transition">
                              <td className="py-2.5 px-3.5 text-slate-400 font-mono text-[11px]">
                                {serial}
                              </td>
                              <td className="py-2.5 px-3.5 font-bold text-slate-800">
                                {donor.name}
                              </td>
                              <td className="py-2.5 px-3.5">
                                <span className="inline-flex items-center justify-center size-7 rounded-lg bg-red-50 text-red-700 font-black text-xs border border-red-200">
                                  {donor.bloodGroup}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-600">
                                <span className="inline-flex items-center gap-1">
                                  <MapPin size={12} className="text-slate-400 shrink-0" />
                                  {donor.location}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 text-right">
                                <a
                                  href={`tel:${donor.phone}`}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs"
                                >
                                  <Phone size={12} />
                                  <span>Call ({donor.phone})</span>
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Modal Pagination Footer */}
            <div className="px-4 py-2.5 sm:px-6 sm:py-3 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-600 shrink-0">
              <div>
                Showing {(sylhetPage - 1) * sylhetPageSize + 1} -{" "}
                {Math.min(sylhetPage * sylhetPageSize, filteredSylhetDonors.length)} of{" "}
                {filteredSylhetDonors.length} donors
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={sylhetPage <= 1}
                  onClick={() => setSylhetPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold hover:bg-white disabled:opacity-40 transition flex items-center gap-1"
                >
                  <ChevronLeft size={13} /> Prev
                </button>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700">
                  Page {sylhetPage} of {totalSylhetPages}
                </span>
                <button
                  type="button"
                  disabled={sylhetPage >= totalSylhetPages}
                  onClick={() => setSylhetPage((p) => Math.min(totalSylhetPages, p + 1))}
                  className="rounded-lg border border-slate-200 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold hover:bg-white disabled:opacity-40 transition flex items-center gap-1"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodBank;
