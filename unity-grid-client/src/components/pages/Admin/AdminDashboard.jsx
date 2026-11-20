import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  Calendar,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
  ArrowRight,
  Search,
} from "lucide-react";
import { useCurrentUser } from "../../../lib/useCurrentUser";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useCurrentUser();

  const [activeTab, setActiveTab] = useState("departments"); // departments | clubs | events | users
  const [stats, setStats] = useState({
    departmentsCount: 0,
    clubsCount: 0,
    eventsCount: 0,
    usersCount: 0,
  });

  const [departments, setDepartments] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Department Modal State
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [deptForm, setDeptForm] = useState({
    name: "",
    code: "",
    headOfDept: "",
    description: "",
  });

  // Club Modal State
  const [showClubModal, setShowClubModal] = useState(false);
  const [editingClubId, setEditingClubId] = useState(null);
  const [clubForm, setClubForm] = useState({
    name: "",
    code: "",
    departmentId: "",
    description: "",
    logo: "",
  });

  // Event Modal State
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

  const fetchAllData = async () => {
    setDataLoading(true);
    try {
      const [statsRes, deptRes, clubRes, eventRes, userRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/stats`, { credentials: "include" }),
        fetch(`${API_BASE}/api/departments`),
        fetch(`${API_BASE}/api/clubs`),
        fetch(`${API_BASE}/api/events`),
        fetch(`${API_BASE}/api/admin/users`, { credentials: "include" }),
      ]);

      const statsData = await statsRes.json();
      const deptData = await deptRes.json();
      const clubData = await clubRes.json();
      const eventData = await eventRes.json();
      const userData = await userRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (deptData.success) setDepartments(deptData.departments);
      if (clubData.success) setClubs(clubData.clubs);
      if (eventData.success) setEvents(eventData.events);
      if (userData.success) setUsers(userData.users);
    } catch {
      // ignore
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchAllData();
    }
  }, [authLoading, isAdmin]);

  // Handle User Role Change
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          text: `User role successfully updated to ${newRole}!`,
          type: "success",
        });
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
        setTimeout(() => setFeedback({ text: "", type: "" }), 3000);
      } else {
        alert(data.message || "Failed to update user role.");
      }
    } catch {
      alert("Error updating user role.");
    }
  };

  // Save Department (Create / Update)
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
        setFeedback({
          text: isEdit ? "Department updated successfully!" : "Department created successfully!",
          type: "success",
        });
        setShowDeptModal(false);
        setEditingDeptId(null);
        setDeptForm({ name: "", code: "", headOfDept: "", description: "" });
        fetchAllData();
      } else {
        alert(data.message || "Failed to save department.");
      }
    } catch {
      alert("Error saving department.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Department
  const handleDeleteDepartment = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete '${name}'?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/departments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      } else {
        alert(data.message || "Failed to delete department.");
      }
    } catch {
      alert("Error deleting department.");
    }
  };

  // Save Club (Create / Update)
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
        setFeedback({
          text: isEdit ? "Club updated successfully!" : "Club created successfully!",
          type: "success",
        });
        setShowClubModal(false);
        setEditingClubId(null);
        setClubForm({ name: "", code: "", departmentId: "", description: "", logo: "" });
        fetchAllData();
      } else {
        alert(data.message || "Failed to save club.");
      }
    } catch {
      alert("Error saving club.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Club
  const handleDeleteClub = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete club '${name}'?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/clubs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      } else {
        alert(data.message || "Failed to delete club.");
      }
    } catch {
      alert("Error deleting club.");
    }
  };

  // Save Event
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
        setFeedback({
          text: isEdit ? "Event updated successfully!" : "Event created successfully!",
          type: "success",
        });
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
        fetchAllData();
      } else {
        alert(data.message || "Failed to save event.");
      }
    } catch {
      alert("Error saving event.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete event '${title}'?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/events/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      } else {
        alert(data.message || "Failed to delete event.");
      }
    } catch {
      alert("Error deleting event.");
    }
  };

  // Access check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#173b69]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center shadow-sm">
          <div className="size-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Admin Access Required</h1>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed">
            This dashboard is restricted to System Administrators only. Your current role is not authorized to access this panel.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-[#173b69] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#122e53]"
          >
            Return to Homepage
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] pb-16">
      {/* Top Header */}
      <section className="border-b border-[#e5e9f2] bg-white py-10 px-6">
        <div className="mx-auto max-w-[1140px]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center rounded-md bg-[#173b69] p-1 text-white">
                  <ShieldCheck size={16} />
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#a81720]">
                  System Super Admin
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#172337]">
                Department & Campus Admin Dashboard
              </h1>
              <p className="mt-1 text-xs text-[#667287]">
                Manage academic departments, student clubs, campus events, and assign user roles.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 bg-gray-100 rounded-lg px-3 py-1.5">
                Logged in as: <span className="text-[#173b69]">{user?.email}</span>
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-200 bg-[#f8fafc] p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                Departments
              </p>
              <p className="text-2xl font-black text-[#173b69] mt-1">{stats.departmentsCount}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-[#f8fafc] p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                Student Clubs
              </p>
              <p className="text-2xl font-black text-[#173b69] mt-1">{stats.clubsCount}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-[#f8fafc] p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                Campus Events
              </p>
              <p className="text-2xl font-black text-[#173b69] mt-1">{stats.eventsCount}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-[#f8fafc] p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                Registered Users
              </p>
              <p className="text-2xl font-black text-[#a81720] mt-1">{stats.usersCount}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-8 flex border-b border-gray-200 gap-6">
            {[
              { id: "departments", label: "Departments", icon: Building2 },
              { id: "clubs", label: "Clubs", icon: Users },
              { id: "events", label: "Events", icon: Calendar },
              { id: "users", label: "User Roles (RBAC)", icon: UserCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-3 text-xs font-bold border-b-2 transition ${
                    activeTab === tab.id
                      ? "border-[#173b69] text-[#173b69]"
                      : "border-transparent text-gray-400 hover:text-gray-700"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {feedback.text && (
            <div
              className={`mt-4 rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {feedback.text}
            </div>
          )}
        </div>
      </section>

      {/* Main Tab Content */}
      <div className="mx-auto max-w-[1140px] px-6 pt-8">
        {/* TAB 1: DEPARTMENTS */}
        {activeTab === "departments" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">
                Academic Departments ({departments.length})
              </h2>
              <button
                onClick={() => {
                  setEditingDeptId(null);
                  setDeptForm({ name: "", code: "", headOfDept: "", description: "" });
                  setShowDeptModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#173b69] px-4 py-2 text-xs font-bold text-white hover:bg-[#122e53]"
              >
                <Plus size={14} /> Add Department
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-gray-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Department Name</th>
                    <th className="py-3 px-4">Head of Dept</th>
                    <th className="py-3 px-4">Clubs</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No departments found. Create your first department using the button above.
                      </td>
                    </tr>
                  ) : (
                    departments.map((dept) => (
                      <tr key={dept._id} className="hover:bg-gray-50/70 transition">
                        <td className="py-3 px-4 font-extrabold text-[#173b69]">{dept.code}</td>
                        <td className="py-3 px-4 font-bold text-gray-800">{dept.name}</td>
                        <td className="py-3 px-4 text-gray-600">{dept.headOfDept || "—"}</td>
                        <td className="py-3 px-4 text-gray-500 font-semibold">
                          {dept.clubs?.length || 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
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
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-[#173b69]"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteDepartment(dept._id, dept.name)}
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
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
        )}

        {/* TAB 2: CLUBS */}
        {activeTab === "clubs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">
                Student Clubs ({clubs.length})
              </h2>
              <button
                onClick={() => {
                  setEditingClubId(null);
                  setClubForm({ name: "", code: "", departmentId: "", description: "", logo: "" });
                  setShowClubModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#173b69] px-4 py-2 text-xs font-bold text-white hover:bg-[#122e53]"
              >
                <Plus size={14} /> Add Club
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-gray-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Club Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Committee</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clubs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No clubs found. Create your first student club above.
                      </td>
                    </tr>
                  ) : (
                    clubs.map((c) => (
                      <tr key={c._id} className="hover:bg-gray-50/70 transition">
                        <td className="py-3 px-4 font-extrabold text-[#173b69]">{c.code}</td>
                        <td className="py-3 px-4 font-bold text-gray-800">{c.name}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {c.departmentId?.name ? `${c.departmentId.name} (${c.departmentId.code})` : "—"}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {c.committee?.length || 0} members
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
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
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-[#173b69]"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteClub(c._id, c.name)}
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
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
        )}

        {/* TAB 3: EVENTS */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">
                Campus Events ({events.length})
              </h2>
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#173b69] px-4 py-2 text-xs font-bold text-white hover:bg-[#122e53]"
              >
                <Plus size={14} /> Create Event
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-gray-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Event Title</th>
                    <th className="py-3 px-4">Host Club</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Volunteers</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        No events found. Create your first event above.
                      </td>
                    </tr>
                  ) : (
                    events.map((evt) => (
                      <tr key={evt._id} className="hover:bg-gray-50/70 transition">
                        <td className="py-3 px-4 font-bold text-gray-800">{evt.title}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {evt.clubId?.code || "Campus Wide"}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(evt.startDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                              evt.status === "Ongoing"
                                ? "bg-amber-100 text-amber-800"
                                : evt.status === "Completed"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {evt.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 font-semibold">
                          {evt.volunteers?.length || 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingEventId(evt._id);
                                setEventForm({
                                  title: evt.title,
                                  clubId: evt.clubId?._id || "",
                                  startDate: evt.startDate ? new Date(evt.startDate).toISOString().slice(0, 16) : "",
                                  endDate: evt.endDate ? new Date(evt.endDate).toISOString().slice(0, 16) : "",
                                  location: evt.location || "",
                                  status: evt.status || "Upcoming",
                                  description: evt.description || "",
                                  banner: evt.banner || "",
                                });
                                setShowEventModal(true);
                              }}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-[#173b69]"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(evt._id, evt.title)}
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
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
        )}

        {/* TAB 4: USER ROLES MANAGEMENT */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-800">
                  User Roles & Access Control ({users.length})
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Assign platform roles: Admin (Super Admin), Member (Club Exec), or Student.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-gray-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">User Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Department / ID</th>
                    <th className="py-3 px-4">Current Role</th>
                    <th className="py-3 px-4 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4 font-bold text-gray-800">{u.name || "—"}</td>
                      <td className="py-3 px-4 text-gray-600">{u.email}</td>
                      <td className="py-3 px-4 text-gray-500">
                        {u.department?.code || u.studentId || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            u.role === "Admin"
                              ? "bg-purple-100 text-purple-800"
                              : u.role === "Member"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {u.role || "Student"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <select
                          value={u.role || "Student"}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 outline-none focus:border-[#173b69]"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Member">Member</option>
                          <option value="Student">Student</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT DEPARTMENT */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-[#172337] flex items-center gap-2">
                <Building2 size={18} className="text-[#173b69]" />
                {editingDeptId ? "Edit Department" : "Add Department"}
              </h2>
              <button
                onClick={() => setShowDeptModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science & Engineering"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Code (Uppercase) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69] uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Head of Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Ariful Islam"
                    value={deptForm.headOfDept}
                    onChange={(e) => setDeptForm({ ...deptForm, headOfDept: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#173b69] px-5 py-2 text-xs font-bold text-white hover:bg-[#122e53]"
                >
                  {submitting ? "Saving..." : editingDeptId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CLUB */}
      {showClubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-[#172337] flex items-center gap-2">
                <Users size={18} className="text-[#173b69]" />
                {editingClubId ? "Edit Student Club" : "Add Student Club"}
              </h2>
              <button
                onClick={() => setShowClubModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveClub} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Club Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUST Science Arena"
                  value={clubForm.name}
                  onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Club Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SSA"
                    value={clubForm.code}
                    onChange={(e) => setClubForm({ ...clubForm, code: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69] uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    required
                    value={clubForm.departmentId}
                    onChange={(e) => setClubForm({ ...clubForm, departmentId: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69]"
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
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={clubForm.logo}
                  onChange={(e) => setClubForm({ ...clubForm, logo: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={clubForm.description}
                  onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowClubModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#173b69] px-5 py-2 text-xs font-bold text-white hover:bg-[#122e53]"
                >
                  {submitting ? "Saving..." : editingClubId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EVENT */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-[#172337] flex items-center gap-2">
                <Calendar size={18} className="text-[#173b69]" />
                {editingEventId ? "Edit Event" : "Create Event"}
              </h2>
              <button
                onClick={() => setShowEventModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Tech Fest"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Host Club (Optional)
                  </label>
                  <select
                    value={eventForm.clubId}
                    onChange={(e) => setEventForm({ ...eventForm, clubId: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69]"
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
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={eventForm.status}
                    onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69]"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Location / Venue
                </label>
                <input
                  type="text"
                  placeholder="e.g. Central Auditorium"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#173b69] px-5 py-2 text-xs font-bold text-white hover:bg-[#122e53]"
                >
                  {submitting ? "Saving..." : editingEventId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default AdminDashboard;

