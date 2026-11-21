import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import {
  Building2,
  Users,
  Calendar,
  ShieldCheck,
  LayoutDashboard,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  LogOut,
  ArrowLeft,
  ArrowRight,
  Search,
  Menu,
  Clock,
  MapPin,
  Activity,
  Sparkles,
} from "lucide-react";
import { authClient } from "../../../lib/authClient";
import { useCurrentUser } from "../../../lib/useCurrentUser";
import Swal, { showAlert, showConfirmDelete } from "../../../lib/alerts";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Departments = () => {
  const navigate = useNavigate();
  const { user, session, isAdmin, loading: authLoading } = useCurrentUser();

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sidebar navigation: "overview" | "departments" | "clubs" | "events"
  const [activeTab, setActiveTab] = useState("overview");

  const [departments, setDepartments] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    departmentsCount: 0,
    clubsCount: 0,
    eventsCount: 0,
    usersCount: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [deptForm, setDeptForm] = useState({
    name: "",
    code: "",
    headOfDept: "",
    description: "",
  });

  const [showClubModal, setShowClubModal] = useState(false);
  const [editingClubId, setEditingClubId] = useState(null);
  const [clubForm, setClubForm] = useState({
    name: "",
    code: "",
    departmentId: "",
    description: "",
    logo: "",
  });

  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    clubId: "",
    startDate: "",
    endDate: "",
    location: "",
    status: "Upcoming",
    description: "",
    banner: "",
  });

  const [feedback, setFeedback] = useState({ text: "", type: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    setDataLoading(true);
    try {
      const [deptRes, clubRes, eventRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/departments`),
        fetch(`${API_BASE}/api/clubs`),
        fetch(`${API_BASE}/api/events`),
        fetch(`${API_BASE}/api/admin/stats`, { credentials: "include" }),
      ]);

      const deptData = await deptRes.json();
      const clubData = await clubRes.json();
      const eventData = await eventRes.json();
      const statsData = await statsRes.json();

      if (deptData.success) setDepartments(deptData.departments);
      if (clubData.success) setClubs(clubData.clubs);
      if (eventData.success) setEvents(eventData.events);

      if (statsData.success) {
        setStats(statsData.stats);
      } else {
        setStats({
          departmentsCount: deptData.departments?.length || 0,
          clubsCount: clubData.clubs?.length || 0,
          eventsCount: eventData.events?.length || 0,
          usersCount: 1,
        });
      }
    } catch {
      // ignore
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchDashboardData();
    }
  }, [authLoading, isAdmin]);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      navigate("/login");
    } catch {
      navigate("/login");
    }
  };

  // 1. Session verification loading
  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-[#0b1329] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-400 border-t-transparent" />
        <p className="text-xs text-slate-400 font-medium">Verifying admin session...</p>
      </div>
    );
  }

  // 2. If user is NOT logged in -> Redirect directly to /login
  if (!session?.user) {
    return (
      <Navigate
        to="/login"
        state={{
          from: "/departments",
          adminRequired: true,
          message: "Please sign in with your Admin account to access the Department Dashboard.",
        }}
        replace
      />
    );
  }

  // 3. If user IS logged in, but NOT an Admin -> Show restriction screen
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-red-100 p-6 sm:p-8 text-center shadow-xl">
          <div className="size-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4 shadow-xs">
            <ShieldCheck size={36} />
          </div>
          <h1 className="text-xl font-black text-slate-800">Admin Login Required</h1>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            You are signed in as <span className="font-bold text-slate-800">{user?.email}</span> ({user?.role || "Student"}).
            The Department Dashboard is restricted to Admin accounts only.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              to="/login"
              state={{ from: "/departments", adminRequired: true }}
              className="w-full rounded-xl bg-[#173b69] py-3 text-xs font-bold text-white hover:bg-[#122e53] shadow-sm transition"
            >
              Sign in with Admin Account
            </Link>
            <Link
              to="/"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Back to Campus Hub
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 4. USER IS ADMIN: Render Full Dashboard with Left Sidebar (NO top navbar, NO footer)
  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = Boolean(editingDeptId);
      const url = isEdit
        ? `${API_BASE}/api/departments/${editingDeptId}`
        : `${API_BASE}/api/departments`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(deptForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowDeptModal(false);
        setEditingDeptId(null);
        setDeptForm({ name: "", code: "", headOfDept: "", description: "" });
        fetchDashboardData();
        showAlert.success(
          isEdit ? "Department Updated!" : "Department Created!",
          isEdit ? "Department details updated successfully." : "New academic department created successfully."
        );
      } else {
        showAlert.error("Save Failed", data.message || "Failed to save department.");
      }
    } catch {
      showAlert.error("Error", "Error saving department.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (id, name) => {
    const confirmed = await showConfirmDelete(`department '${name}'`);
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_BASE}/api/departments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
        showAlert.success("Deleted!", `Department '${name}' has been deleted.`);
      } else {
        showAlert.error("Delete Failed", data.message || "Failed to delete department.");
      }
    } catch {
      showAlert.error("Error", "Error deleting department.");
    }
  };

  const handleSaveClub = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = Boolean(editingClubId);
      const url = isEdit
        ? `${API_BASE}/api/clubs/${editingClubId}`
        : `${API_BASE}/api/clubs`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(clubForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowClubModal(false);
        setEditingClubId(null);
        setClubForm({ name: "", code: "", departmentId: "", description: "", logo: "" });
        fetchDashboardData();
        showAlert.success(
          isEdit ? "Club Updated!" : "Club Created!",
          isEdit ? "Club details updated successfully." : "New club created successfully."
        );
      } else {
        showAlert.error("Save Failed", data.message || "Failed to save club.");
      }
    } catch {
      showAlert.error("Error", "Error saving club.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClub = async (id, name) => {
    const confirmed = await showConfirmDelete(`club '${name}'`);
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_BASE}/api/clubs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
        showAlert.success("Deleted!", `Club '${name}' has been deleted.`);
      } else {
        showAlert.error("Delete Failed", data.message || "Failed to delete club.");
      }
    } catch {
      showAlert.error("Error", "Error deleting club.");
    }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = Boolean(editingEventId);
      const url = isEdit
        ? `${API_BASE}/api/events/${editingEventId}`
        : `${API_BASE}/api/events`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(eventForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowEventModal(false);
        setEditingEventId(null);
        setEventForm({
          title: "",
          clubId: "",
          startDate: "",
          endDate: "",
          location: "",
          status: "Upcoming",
          description: "",
          banner: "",
        });
        fetchDashboardData();
        showAlert.success(
          isEdit ? "Event Updated!" : "Event Published!",
          isEdit ? "Event details updated successfully." : "New event published successfully."
        );
      } else {
        showAlert.error("Save Failed", data.message || "Failed to save event.");
      }
    } catch {
      showAlert.error("Error", "Error saving event.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id, title) => {
    const confirmed = await showConfirmDelete(`event '${title}'`);
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_BASE}/api/events/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
        showAlert.success("Deleted!", `Event '${title}' has been deleted.`);
      } else {
        showAlert.error("Delete Failed", data.message || "Failed to delete event.");
      }
    } catch {
      showAlert.error("Error", "Error deleting event.");
    }
  };

  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClubs = clubs.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.clubId?.name && e.clubId.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] font-sans text-slate-800">
      {/* ──────────────── MOBILE BACKDROP ──────────────── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* ──────────────── LEFT SIDEBAR ──────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0b1329] text-white flex flex-col justify-between border-r border-slate-800/80 shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 sm:h-18 px-5 sm:px-6 flex items-center justify-between border-b border-slate-800/80 bg-[#0f172a]/50">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#173b69] text-base font-black text-white shadow-md shadow-blue-900/30">
                U<span className="-ml-0.5 text-[#ff7474]">+</span>
              </span>
              <div>
                <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                  UnityGrid
                  <span className="rounded bg-[#a81720] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                    Admin
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">Department Dashboard</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Sidebar Menu */}
          <nav className="p-3.5 sm:p-4 space-y-1.5" aria-label="Dashboard navigation">
            <p className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Operations Console
            </p>

            <button
              onClick={() => {
                setActiveTab("overview");
                setSearchTerm("");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                activeTab === "overview"
                  ? "bg-[#173b69] text-white shadow-md shadow-blue-950/40"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <LayoutDashboard size={17} />
              <span>Overview</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("departments");
                setSearchTerm("");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                activeTab === "departments"
                  ? "bg-[#173b69] text-white shadow-md shadow-blue-950/40"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 size={17} />
                <span>Departments</span>
              </div>
              <span className="rounded-md bg-slate-800/90 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                {departments.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("clubs");
                setSearchTerm("");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                activeTab === "clubs"
                  ? "bg-[#173b69] text-white shadow-md shadow-blue-950/40"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users size={17} />
                <span>Student Clubs</span>
              </div>
              <span className="rounded-md bg-slate-800/90 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                {clubs.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("events");
                setSearchTerm("");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                activeTab === "events"
                  ? "bg-[#173b69] text-white shadow-md shadow-blue-950/40"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar size={17} />
                <span>Campus Events</span>
              </div>
              <span className="rounded-md bg-slate-800/90 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                {events.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: Profile & Exit */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800/80 space-y-2 bg-[#090f20]/50">
          {/* Admin Profile Card */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800/60">
            <div className="size-8.5 rounded-xl bg-[#173b69] text-white font-black text-xs flex items-center justify-center shrink-0">
              {user?.name ? user.name[0].toUpperCase() : "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name || "Admin"}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Return to Public Site */}
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <ArrowLeft size={14} />
            <span>Exit to Campus Hub</span>
          </Link>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ──────────────── RIGHT MAIN CONTENT ──────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Responsive Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 sm:h-18 bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition shrink-0"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 capitalize truncate">
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "departments" && "Academic Departments"}
                {activeTab === "clubs" && "Student Clubs & Societies"}
                {activeTab === "events" && "Campus Events & Volunteer Drives"}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block truncate">
                UnityGrid Super Admin Console · Active session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Campus Normal Mode Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Campus Normal</span>
            </div>

            {/* Quick Action Button depending on current tab */}
            {activeTab === "departments" && (
              <button
                onClick={() => {
                  setEditingDeptId(null);
                  setDeptForm({ name: "", code: "", headOfDept: "", description: "" });
                  setShowDeptModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#173b69] px-3.5 sm:px-4 py-2 text-xs font-bold text-white hover:bg-[#122e53] shadow-sm transition"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Add Department</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}

            {activeTab === "clubs" && (
              <button
                onClick={() => {
                  setEditingClubId(null);
                  setClubForm({ name: "", code: "", departmentId: "", description: "", logo: "" });
                  setShowClubModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#173b69] px-3.5 sm:px-4 py-2 text-xs font-bold text-white hover:bg-[#122e53] shadow-sm transition"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Add Club</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}

            {activeTab === "events" && (
              <button
                onClick={() => {
                  setEditingEventId(null);
                  setEventForm({
                    title: "",
                    clubId: "",
                    startDate: "",
                    endDate: "",
                    location: "",
                    status: "Upcoming",
                    description: "",
                    banner: "",
                  });
                  setShowEventModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#173b69] px-3.5 sm:px-4 py-2 text-xs font-bold text-white hover:bg-[#122e53] shadow-sm transition"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Create Event</span>
                <span className="sm:hidden">Create</span>
              </button>
            )}
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-16 space-y-6 sm:space-y-8">
          {feedback.text && (
            <div
              className={`rounded-2xl p-4 text-xs font-bold flex items-center gap-2.5 shadow-xs ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* ──────────────── TAB 1: OVERVIEW ──────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-6 sm:space-y-8">
              {/* Modern Welcome Banner */}
              <div className="rounded-3xl bg-gradient-to-r from-[#0b1329] via-[#173b69] to-[#1e2d4d] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/50">
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold mb-3 backdrop-blur-xs">
                    <Sparkles size={13} className="text-amber-400" />
                    <span>Administrator Control Center</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
                    Welcome back, {user?.name || "Administrator"}!
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Campus operations are running smoothly in <span className="font-bold text-emerald-300">Normal Mode</span>. Manage academic departments, student societies, and campus volunteer drives from this console.
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <button
                      onClick={() => {
                        setEditingDeptId(null);
                        setDeptForm({ name: "", code: "", headOfDept: "", description: "" });
                        setShowDeptModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white text-[#173b69] px-3.5 py-2 text-xs font-black shadow-md hover:bg-slate-100 transition"
                    >
                      <Plus size={14} /> Add Department
                    </button>
                    <button
                      onClick={() => {
                        setEditingClubId(null);
                        setClubForm({ name: "", code: "", departmentId: "", description: "", logo: "" });
                        setShowClubModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 text-xs font-bold backdrop-blur-xs transition"
                    >
                      <Plus size={14} /> Add Club
                    </button>
                    <button
                      onClick={() => {
                        setEditingEventId(null);
                        setEventForm({
                          title: "",
                          clubId: "",
                          startDate: "",
                          endDate: "",
                          location: "",
                          status: "Upcoming",
                          description: "",
                          banner: "",
                        });
                        setShowEventModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 text-xs font-bold backdrop-blur-xs transition"
                    >
                      <Plus size={14} /> Create Event
                    </button>
                  </div>
                </div>

                {/* Subtle Decorative Background Element */}
                <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:flex items-center justify-center">
                  <Building2 size={240} />
                </div>
              </div>

              {/* Metric KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
                {/* 1. Departments KPI */}
                <div
                  onClick={() => setActiveTab("departments")}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition hover:shadow-md hover:border-[#173b69] cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Departments
                    </span>
                    <span className="size-9 rounded-xl bg-blue-50 text-[#173b69] flex items-center justify-center group-hover:scale-105 transition">
                      <Building2 size={18} />
                    </span>
                  </div>
                  <p className="text-3xl font-black text-[#173b69] mt-3">{stats.departmentsCount}</p>
                  <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span>Manage faculties</span>
                    <ArrowRight size={13} className="text-[#173b69] group-hover:translate-x-1 transition" />
                  </div>
                </div>

                {/* 2. Clubs KPI */}
                <div
                  onClick={() => setActiveTab("clubs")}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition hover:shadow-md hover:border-purple-600 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Student Clubs
                    </span>
                    <span className="size-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition">
                      <Users size={18} />
                    </span>
                  </div>
                  <p className="text-3xl font-black text-purple-700 mt-3">{stats.clubsCount}</p>
                  <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span>Manage organizations</span>
                    <ArrowRight size={13} className="text-purple-700 group-hover:translate-x-1 transition" />
                  </div>
                </div>

                {/* 3. Events KPI */}
                <div
                  onClick={() => setActiveTab("events")}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition hover:shadow-md hover:border-emerald-600 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Campus Events
                    </span>
                    <span className="size-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition">
                      <Calendar size={18} />
                    </span>
                  </div>
                  <p className="text-3xl font-black text-emerald-700 mt-3">{stats.eventsCount}</p>
                  <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span>View schedule</span>
                    <ArrowRight size={13} className="text-emerald-700 group-hover:translate-x-1 transition" />
                  </div>
                </div>

                {/* 4. System Status KPI */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      System Mode
                    </span>
                    <span className="size-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs">
                      <Activity size={18} />
                    </span>
                  </div>
                  <p className="text-2xl font-black text-emerald-600 mt-3">Campus Normal</p>
                  <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span>Platform operational</span>
                    <span className="size-2 rounded-full bg-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Multi-Section Balanced Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                {/* Section 1: Academic Departments */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="size-8 rounded-xl bg-blue-50 text-[#173b69] flex items-center justify-center font-bold">
                          <Building2 size={16} />
                        </span>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Academic Departments</h3>
                          <p className="text-[11px] text-slate-400">Registered academic faculties</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingDeptId(null);
                          setDeptForm({ name: "", code: "", headOfDept: "", description: "" });
                          setShowDeptModal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-[#173b69] hover:bg-blue-50 transition"
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>

                    {departments.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl">
                        <Building2 size={28} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs text-slate-500">No departments registered yet.</p>
                        <button
                          onClick={() => {
                            setEditingDeptId(null);
                            setDeptForm({ name: "", code: "", headOfDept: "", description: "" });
                            setShowDeptModal(true);
                          }}
                          className="mt-2 text-xs font-bold text-[#173b69] hover:underline"
                        >
                          + Create first department
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {departments.slice(0, 4).map((d) => (
                          <div key={d._id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/60 px-2 rounded-xl transition">
                            <div className="min-w-0 pr-3">
                              <p className="font-bold text-slate-800 truncate">{d.name}</p>
                              <p className="text-[11px] text-slate-400 truncate">Head: {d.headOfDept || "Not assigned"}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-black text-[#173b69]">
                                {d.code}
                              </span>
                              <span className="text-[11px] text-slate-500 font-semibold">{d.clubs?.length || 0} Clubs</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {departments.length > 0 && (
                    <button
                      onClick={() => setActiveTab("departments")}
                      className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-[#173b69] hover:text-[#122e53] flex items-center justify-between"
                    >
                      <span>View all {departments.length} departments</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>

                {/* Section 2: Student Clubs */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="size-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                          <Users size={16} />
                        </span>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Student Clubs</h3>
                          <p className="text-[11px] text-slate-400">Campus societies & wings</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingClubId(null);
                          setClubForm({ name: "", code: "", departmentId: "", description: "", logo: "" });
                          setShowClubModal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-50 transition"
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>

                    {clubs.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl">
                        <Users size={28} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs text-slate-500">No student clubs registered yet.</p>
                        <button
                          onClick={() => {
                            setEditingClubId(null);
                            setClubForm({ name: "", code: "", departmentId: "", description: "", logo: "" });
                            setShowClubModal(true);
                          }}
                          className="mt-2 text-xs font-bold text-purple-700 hover:underline"
                        >
                          + Create first club
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {clubs.slice(0, 4).map((c) => (
                          <div key={c._id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/60 px-2 rounded-xl transition">
                            <div className="min-w-0 pr-3">
                              <p className="font-bold text-slate-800 truncate">{c.name}</p>
                              <p className="text-[11px] text-slate-400 truncate">
                                Dept: {c.departmentId?.name || "Campus General"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="rounded-lg bg-purple-50 px-2 py-0.5 text-[10px] font-black text-purple-700">
                                {c.code}
                              </span>
                              <span className="text-[11px] text-slate-500 font-semibold">{c.committee?.length || 0} Members</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {clubs.length > 0 && (
                    <button
                      onClick={() => setActiveTab("clubs")}
                      className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center justify-between"
                    >
                      <span>View all {clubs.length} clubs</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>

                {/* Section 3: Campus Events & Schedules */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="size-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                          <Calendar size={16} />
                        </span>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Scheduled Events</h3>
                          <p className="text-[11px] text-slate-400">Campus drives & workshops</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingEventId(null);
                          setEventForm({
                            title: "",
                            clubId: "",
                            startDate: "",
                            endDate: "",
                            location: "",
                            status: "Upcoming",
                            description: "",
                            banner: "",
                          });
                          setShowEventModal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition"
                      >
                        <Plus size={13} /> Create
                      </button>
                    </div>

                    {events.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl">
                        <Calendar size={28} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs text-slate-500">No events scheduled yet.</p>
                        <button
                          onClick={() => {
                            setEditingEventId(null);
                            setEventForm({
                              title: "",
                              clubId: "",
                              startDate: "",
                              endDate: "",
                              location: "",
                              status: "Upcoming",
                              description: "",
                              banner: "",
                            });
                            setShowEventModal(true);
                          }}
                          className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
                        >
                          + Schedule an event
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {events.slice(0, 3).map((e) => (
                          <div key={e._id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/60 px-2 rounded-xl transition">
                            <div className="min-w-0 pr-3">
                              <p className="font-bold text-slate-800 truncate">{e.title}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} /> {new Date(e.startDate).toLocaleDateString()}
                                </span>
                                {e.location && (
                                  <span className="flex items-center gap-1 truncate">
                                    <MapPin size={11} /> {e.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                  e.status === "Ongoing"
                                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                                    : e.status === "Completed"
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {e.status}
                              </span>
                              <span className="text-[11px] text-slate-500 font-semibold">{e.volunteers?.length || 0} Vol.</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {events.length > 0 && (
                    <button
                      onClick={() => setActiveTab("events")}
                      className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center justify-between"
                    >
                      <span>View all {events.length} events</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>

                {/* Section 4: System Diagnostics & Health */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                      <span className="size-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                        <Activity size={16} />
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">Platform Health & Security</h3>
                        <p className="text-[11px] text-slate-400">Environment status & RBAC</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-600 font-medium">Dual-Mode Status</span>
                        <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          Normal Standby
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-600 font-medium">Role-Based Access Control</span>
                        <span className="font-bold text-[#173b69]">Enforced (Admin Only)</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-600 font-medium">Database Connection</span>
                        <span className="font-bold text-slate-800">MongoDB Atlas Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Logged in as: <strong className="text-slate-800">{user?.name || "Admin"}</strong></span>
                    <Link to="/" className="font-bold text-[#173b69] hover:underline flex items-center gap-1">
                      Campus Home <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── TAB 2: DEPARTMENTS ──────────────── */}
          {activeTab === "departments" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search departments or code..."
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10 shadow-xs"
                  />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Showing {filteredDepartments.length} of {departments.length} departments
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-200/80">
                      <tr>
                        <th className="py-4 px-6">Code</th>
                        <th className="py-4 px-6">Department Name</th>
                        <th className="py-4 px-6">Head of Dept</th>
                        <th className="py-4 px-6">Clubs Count</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDepartments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            No departments found. Click "+ Add Department" above to create one.
                          </td>
                        </tr>
                      ) : (
                        filteredDepartments.map((dept) => (
                          <tr key={dept._id} className="hover:bg-slate-50/70 transition">
                            <td className="py-4 px-6 font-black text-[#173b69]">
                              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs">
                                {dept.code}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-bold text-slate-800">{dept.name}</td>
                            <td className="py-4 px-6 text-slate-600">{dept.headOfDept || "—"}</td>
                            <td className="py-4 px-6 text-slate-500 font-bold">
                              {dept.clubs?.length || 0} Clubs
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  title="Edit Department"
                                  onClick={() => {
                                    setEditingDeptId(dept._id);
                                    setDeptForm({
                                      name: dept.name,
                                      code: dept.code,
                                      headOfDept: dept.headOfDept || "",
                                      description: dept.description || "",
                                    });
                                    setShowDeptModal(true);
                                  }}
                                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-[#173b69] transition"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  title="Delete Department"
                                  onClick={() => handleDeleteDepartment(dept._id, dept.name)}
                                  className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── TAB 3: CLUBS ──────────────── */}
          {activeTab === "clubs" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search clubs or code..."
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10 shadow-xs"
                  />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Showing {filteredClubs.length} of {clubs.length} clubs
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-200/80">
                      <tr>
                        <th className="py-4 px-6">Code</th>
                        <th className="py-4 px-6">Club Name</th>
                        <th className="py-4 px-6">Associated Department</th>
                        <th className="py-4 px-6">Committee</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredClubs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            No clubs found. Click "+ Add Club" above to create one.
                          </td>
                        </tr>
                      ) : (
                        filteredClubs.map((c) => (
                          <tr key={c._id} className="hover:bg-slate-50/70 transition">
                            <td className="py-4 px-6 font-black text-purple-700">
                              <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs">
                                {c.code}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-bold text-slate-800">{c.name}</td>
                            <td className="py-4 px-6 text-slate-600">
                              {c.departmentId?.name ? `${c.departmentId.name} (${c.departmentId.code})` : "Campus General"}
                            </td>
                            <td className="py-4 px-6 text-slate-500 font-semibold">
                              {c.committee?.length || 0} members
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  title="Edit Club"
                                  onClick={() => {
                                    setEditingClubId(c._id);
                                    setClubForm({
                                      name: c.name,
                                      code: c.code,
                                      departmentId: c.departmentId?._id || "",
                                      description: c.description || "",
                                      logo: c.logo || "",
                                    });
                                    setShowClubModal(true);
                                  }}
                                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-[#173b69] transition"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  title="Delete Club"
                                  onClick={() => handleDeleteClub(c._id, c.name)}
                                  className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── TAB 4: EVENTS ──────────────── */}
          {activeTab === "events" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search events..."
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10 shadow-xs"
                  />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Showing {filteredEvents.length} of {events.length} events
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-200/80">
                      <tr>
                        <th className="py-4 px-6">Event Title</th>
                        <th className="py-4 px-6">Host Club</th>
                        <th className="py-4 px-6">Date</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Volunteers</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEvents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            No events found. Click "+ Create Event" above to schedule an event.
                          </td>
                        </tr>
                      ) : (
                        filteredEvents.map((evt) => (
                          <tr key={evt._id} className="hover:bg-slate-50/70 transition">
                            <td className="py-4 px-6 font-bold text-slate-800">{evt.title}</td>
                            <td className="py-4 px-6 text-slate-600">
                              {evt.clubId?.code || "Campus Wide"}
                            </td>
                            <td className="py-4 px-6 text-slate-500">
                              {new Date(evt.startDate).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`rounded-md px-2.5 py-1 text-[10px] font-black uppercase ${
                                  evt.status === "Ongoing"
                                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                                    : evt.status === "Completed"
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {evt.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-500 font-bold">
                              {evt.volunteers?.length || 0}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  title="Edit Event"
                                  onClick={() => {
                                    setEditingEventId(evt._id);
                                    setEventForm({
                                      title: evt.title,
                                      clubId: evt.clubId?._id || "",
                                      startDate: evt.startDate
                                        ? new Date(evt.startDate).toISOString().slice(0, 16)
                                        : "",
                                      endDate: evt.endDate
                                        ? new Date(evt.endDate).toISOString().slice(0, 16)
                                        : "",
                                      location: evt.location || "",
                                      status: evt.status || "Upcoming",
                                      description: evt.description || "",
                                      banner: evt.banner || "",
                                    });
                                    setShowEventModal(true);
                                  }}
                                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-[#173b69] transition"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  title="Delete Event"
                                  onClick={() => handleDeleteEvent(evt._id, evt.title)}
                                  className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ──────────────── MODALS (RESPONSIVE & SCROLLABLE) ──────────────── */}
      {/* 1. Add / Edit Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Building2 size={18} className="text-[#173b69]" />
                {editingDeptId ? "Edit Department" : "Create New Department"}
              </h3>
              <button
                onClick={() => setShowDeptModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science & Engineering"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Code (Uppercase) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Head of Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Ariful Islam"
                    value={deptForm.headOfDept}
                    onChange={(e) => setDeptForm({ ...deptForm, headOfDept: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  placeholder="Department details, faculty initiatives..."
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#173b69] px-5 py-2.5 text-xs font-black text-white hover:bg-[#122e53] shadow-sm transition"
                >
                  {submitting ? "Saving..." : editingDeptId ? "Update Department" : "Save Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add / Edit Club Modal */}
      {showClubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-purple-700" />
                {editingClubId ? "Edit Student Club" : "Create New Student Club"}
              </h3>
              <button
                onClick={() => setShowClubModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveClub} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Club Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUST Science Arena"
                  value={clubForm.name}
                  onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Club Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SSA"
                    value={clubForm.code}
                    onChange={(e) => setClubForm({ ...clubForm, code: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Department *
                  </label>
                  <select
                    required
                    value={clubForm.departmentId}
                    onChange={(e) => setClubForm({ ...clubForm, departmentId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Logo Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={clubForm.logo}
                  onChange={(e) => setClubForm({ ...clubForm, logo: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  placeholder="Club mission, initiatives..."
                  value={clubForm.description}
                  onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClubModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || departments.length === 0}
                  className="rounded-xl bg-[#173b69] px-5 py-2.5 text-xs font-black text-white hover:bg-[#122e53] shadow-sm transition"
                >
                  {submitting ? "Saving..." : editingClubId ? "Update Club" : "Save Club"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add / Edit Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Calendar size={18} className="text-emerald-700" />
                {editingEventId ? "Edit Event" : "Create Campus Event"}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Campus Hackathon"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Host Club (Optional)
                  </label>
                  <select
                    value={eventForm.clubId}
                    onChange={(e) => setEventForm({ ...eventForm, clubId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10"
                  >
                    <option value="">General Campus Event (No Club)</option>
                    {clubs.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
                  <select
                    value={eventForm.status}
                    onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Location / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Central Auditorium or Online"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Banner Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={eventForm.banner}
                  onChange={(e) => setEventForm({ ...eventForm, banner: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  placeholder="Event details, schedule..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-[#173b69] focus:ring-2 focus:ring-[#173b69]/10"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#173b69] px-5 py-2.5 text-xs font-black text-white hover:bg-[#122e53] shadow-sm transition"
                >
                  {submitting ? "Saving..." : editingEventId ? "Update Event" : "Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
