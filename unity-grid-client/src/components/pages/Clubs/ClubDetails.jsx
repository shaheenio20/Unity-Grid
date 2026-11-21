import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  Building2,
  ArrowLeft,
  Mail,
  ShieldCheck,
  MapPin,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { authClient } from "../../../lib/authClient";
import { useCurrentUser } from "../../../lib/useCurrentUser";
import Swal, { showAlert, showConfirmDelete } from "../../../lib/alerts";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ClubDetails = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { session, isAdmin } = useCurrentUser();

  const [club, setClub] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit Club Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ text: "", type: "" });
  const [clubForm, setClubForm] = useState({
    name: "",
    code: "",
    departmentId: "",
    description: "",
    logo: "",
  });

  const fetchClub = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/clubs/${clubId}`);
      const data = await response.json();
      if (data.success) {
        setClub(data.club);
        setClubForm({
          name: data.club.name,
          code: data.club.code,
          departmentId: data.club.departmentId?._id || "",
          description: data.club.description || "",
          logo: data.club.logo || "",
        });
      } else {
        setError(data.message || "Failed to load club details.");
      }
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/departments`);
      const data = await res.json();
      if (data.success) {
        setDepartments(data.departments);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchClub();
    fetchDepartments();
  }, [clubId]);

  const handleUpdateClub = async (e) => {
    e.preventDefault();
    if (!session?.user) {
      navigate("/login");
      return;
    }

    setFormSubmitting(true);
    setFeedback({ text: "", type: "" });

    try {
      const res = await fetch(`${API_BASE}/api/clubs/${clubId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(clubForm),
      });
      const data = await res.json();

      if (data.success) {
        setShowEditModal(false);
        await fetchClub();
        showAlert.success("Club Updated!", "Club details have been updated successfully.");
      } else {
        showAlert.error("Update Failed", data.message || "Failed to update club.");
      }
    } catch {
      showAlert.error("Error", "Error updating club.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteClub = async () => {
    if (!session?.user) {
      navigate("/login");
      return;
    }

    const confirmed = await showConfirmDelete(`club '${club.name}'`);
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/clubs/${clubId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        await showAlert.success("Deleted!", `Club '${club.name}' has been deleted.`);
        navigate("/departments");
      } else {
        showAlert.error("Delete Failed", data.message || "Failed to delete club.");
      }
    } catch {
      showAlert.error("Error", "Error deleting club.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#173b69]" />
      </div>
    );
  }

  if (error || !club) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-600">{error || "Club not found."}</p>
          <Link
            to="/departments"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#173b69] px-4 py-2 text-xs font-bold text-white hover:bg-[#122e53]"
          >
            <ArrowLeft size={14} /> Back to Departments
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] pb-16">
      {/* Club Header Banner */}
      <section className="border-b border-[#e5e9f2] bg-white py-10 px-6">
        <div className="mx-auto max-w-[1140px]">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/departments"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#56657a] hover:text-[#173b69] transition"
            >
              <ArrowLeft size={14} /> Back to Departments
            </Link>

            {/* Club CRUD Actions (Admin Only) */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFeedback({ text: "", type: "" });
                    setShowEditModal(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-[#173b69] hover:bg-gray-50 transition shadow-sm"
                >
                  <Pencil size={13} /> Edit Club
                </button>
                <button
                  onClick={handleDeleteClub}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition shadow-sm"
                >
                  <Trash2 size={13} /> Delete Club
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {club.logo ? (
              <img
                src={club.logo}
                alt={club.name}
                className="size-20 md:size-24 rounded-2xl object-cover border border-gray-100 shadow-sm"
              />
            ) : (
              <div className="size-20 md:size-24 rounded-2xl bg-gradient-to-br from-[#173b69] to-[#25528d] text-white flex items-center justify-center font-extrabold text-2xl shadow-sm">
                {club.code}
              </div>
            )}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-md bg-[#173b69] px-2.5 py-0.5 text-xs font-extrabold text-white">
                  {club.code}
                </span>
                {club.departmentId && (
                  <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#173b69]">
                    {club.departmentId.name} ({club.departmentId.code})
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#172337]">
                {club.name}
              </h1>
              <p className="mt-2 text-xs md:text-sm text-[#667287] max-w-2xl leading-relaxed">
                {club.description || "Active student club dedicated to student leadership and campus initiatives."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="mx-auto max-w-[1140px] px-6 pt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Events (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#172337] flex items-center gap-2">
              <Calendar size={18} className="text-[#a81720]" />
              Hosted Campus Events
            </h2>
            <Link
              to="/events"
              className="text-xs font-bold text-[#173b69] hover:underline"
            >
              Browse All Events →
            </Link>
          </div>

          {club.events && club.events.length > 0 ? (
            <div className="grid gap-4">
              {club.events.map((evt) => (
                <div
                  key={evt._id}
                  className="rounded-2xl border border-[#e5e9f2] bg-white p-5 shadow-sm transition hover:shadow-md flex flex-col md:flex-row gap-5"
                >
                  {evt.banner && (
                    <img
                      src={evt.banner}
                      alt={evt.title}
                      className="w-full md:w-44 h-32 rounded-xl object-cover"
                    />
                  )}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
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
                        <span className="text-[11px] font-semibold text-gray-400">
                          {new Date(evt.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#1c2b40]">{evt.title}</h3>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                        {evt.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      {evt.location && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <MapPin size={12} className="text-[#a81720]" />
                          {evt.location}
                        </span>
                      )}
                      <Link
                        to="/events"
                        className="font-bold text-[#173b69] hover:underline ml-auto"
                      >
                        Event Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <Calendar className="mx-auto size-10 text-gray-300 mb-2" />
              <p className="text-xs text-gray-500">No events currently scheduled for this club.</p>
            </div>
          )}
        </div>

        {/* Right Column: Executive Committee (1 Col) */}
        <div>
          <div className="rounded-2xl border border-[#e5e9f2] bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#172337] flex items-center gap-2 mb-4">
              <Users size={16} className="text-[#173b69]" />
              Executive Committee
            </h2>

            {club.committee && club.committee.length > 0 ? (
              <div className="space-y-4">
                {club.committee.map((member, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#f8fafc] border border-gray-100"
                  >
                    <div className="size-10 rounded-full bg-[#173b69]/10 text-[#173b69] flex items-center justify-center font-bold text-sm">
                      {member.userId?.name ? member.userId.name[0] : "M"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {member.userId?.name || "Member"}
                      </p>
                      <p className="text-[11px] font-semibold text-[#a81720]">
                        {member.designation}
                      </p>
                      {member.userId?.email && (
                        <p className="text-[10px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
                          <Mail size={10} /> {member.userId.email}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <ShieldCheck size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-gray-400">
                  Committee roster will be updated shortly by club executives.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT CLUB MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-[#172337] flex items-center gap-2">
                <Pencil size={18} className="text-[#173b69]" />
                Edit Student Club
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
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

            <form onSubmit={handleUpdateClub} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Club Name *
                </label>
                <input
                  type="text"
                  required
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
                    value={clubForm.code}
                    onChange={(e) => setClubForm({ ...clubForm, code: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69] uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Department
                  </label>
                  <select
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
                  Logo Image URL
                </label>
                <input
                  type="url"
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
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-xl bg-[#173b69] px-5 py-2 text-xs font-bold text-white hover:bg-[#122e53] disabled:opacity-50"
                >
                  {formSubmitting ? "Updating..." : "Update Club"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default ClubDetails;
