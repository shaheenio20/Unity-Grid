import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import { authClient } from "../../../lib/authClient";
import { useCurrentUser } from "../../../lib/useCurrentUser";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Events = () => {
  const navigate = useNavigate();
  const { session, isAdmin } = useCurrentUser();

  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [actionMessage, setActionMessage] = useState({ text: "", type: "" });
  const [volunteeringId, setVolunteeringId] = useState(null);

  // Create / Edit Event Modal State
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
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

  const fetchEvents = async () => {
    try {
      const url =
        selectedStatus === "All"
          ? `${API_BASE}/api/events`
          : `${API_BASE}/api/events?status=${selectedStatus}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      } else {
        setError(data.message || "Failed to load events.");
      }
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchClubs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/clubs`);
      const data = await res.json();
      if (data.success) {
        setClubs(data.clubs);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchEvents();
    fetchClubs();
  }, [selectedStatus]);

  const handleOpenEditEvent = (evt) => {
    setEditingEventId(evt._id);
    const startFormatted = evt.startDate
      ? new Date(evt.startDate).toISOString().slice(0, 16)
      : "";
    const endFormatted = evt.endDate
      ? new Date(evt.endDate).toISOString().slice(0, 16)
      : "";

    setEventForm({
      title: evt.title,
      clubId: evt.clubId?._id || evt.clubId || "",
      startDate: startFormatted,
      endDate: endFormatted,
      location: evt.location || "",
      status: evt.status || "Upcoming",
      description: evt.description || "",
      banner: evt.banner || "",
    });
    setActionMessage({ text: "", type: "" });
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!session?.user) {
      navigate("/login");
      return;
    }

    setFormSubmitting(true);
    setActionMessage({ text: "", type: "" });

    try {
      const isEdit = Boolean(editingEventId);
      const url = isEdit
        ? `${API_BASE}/api/events/${editingEventId}`
        : `${API_BASE}/api/events`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(eventForm),
      });
      const data = await res.json();

      if (data.success) {
        setActionMessage({
          text: isEdit ? "Event updated successfully!" : "Event created successfully!",
          type: "success",
        });
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
        await fetchEvents();
        setTimeout(() => {
          setShowEventModal(false);
          setEditingEventId(null);
        }, 1000);
      } else {
        setActionMessage({
          text: data.message || "Failed to save event.",
          type: "error",
        });
      }
    } catch {
      setActionMessage({
        text: "Error saving event. Please try again.",
        type: "error",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!session?.user) {
      navigate("/login");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete event '${eventTitle}'?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        await fetchEvents();
      } else {
        alert(data.message || "Failed to delete event.");
      }
    } catch {
      alert("Error deleting event.");
    }
  };

  const handleVolunteerJoin = async (eventId) => {
    if (!session?.user) {
      navigate("/login");
      return;
    }

    setVolunteeringId(eventId);
    setActionMessage({ text: "", type: "" });

    try {
      const res = await fetch(`${API_BASE}/api/events/${eventId}/volunteer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setActionMessage({
          text: "You have successfully signed up as a volunteer!",
          type: "success",
        });
        fetchEvents();
      } else {
        setActionMessage({
          text: data.message || "Failed to sign up.",
          type: "error",
        });
      }
    } catch {
      setActionMessage({
        text: "Error signing up. Please try again.",
        type: "error",
      });
    } finally {
      setVolunteeringId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] pb-16">
      {/* Header Banner */}
      <section className="border-b border-[#e5e9f2] bg-white py-12 px-6">
        <div className="mx-auto max-w-[1140px]">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center rounded-md bg-[#edf2fe] p-1.5 text-[#1b3d6d]">
                  <Calendar size={18} />
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9f252c]">
                  Campus Hub
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#172337]">
                Campus Events & Volunteer Drives
              </h1>
              <p className="mt-2 text-sm text-[#667287] max-w-2xl leading-relaxed">
                Full CRUD event coordination: Create new events, update schedules, manage attendance, and volunteer.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
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
                    setActionMessage({ text: "", type: "" });
                    setShowEventModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#173b69] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#122e53] transition shadow-sm"
                >
                  <Plus size={15} /> Create Event
                </button>
              )}

              {/* Status Filter Tabs */}
              <div className="flex rounded-xl bg-gray-100 p-1 shadow-inner gap-1">
                {["All", "Upcoming", "Ongoing", "Completed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      selectedStatus === status
                        ? "bg-white text-[#173b69] shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {actionMessage.text && (
            <div
              className={`mt-4 rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${
                actionMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {actionMessage.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {actionMessage.text}
            </div>
          )}
        </div>
      </section>

      {/* Main Events List */}
      <div className="mx-auto max-w-[1140px] px-6 pt-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-72 rounded-2xl bg-white border border-gray-200 p-6 animate-pulse"
              >
                <div className="h-32 bg-gray-200 rounded-xl mb-4" />
                <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-1/2 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <Calendar className="mx-auto size-12 text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-700">No events found</h3>
            <p className="text-xs text-gray-400 mt-1">
              There are no {selectedStatus !== "All" ? selectedStatus.toLowerCase() : ""} events scheduled yet.
            </p>
            {isAdmin && (
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
                  setActionMessage({ text: "", type: "" });
                  setShowEventModal(true);
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#173b69] px-4 py-2 text-xs font-bold text-white hover:bg-[#122e53]"
              >
                <Plus size={14} /> Create First Event
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((evt) => {
              const isUserVolunteering =
                session?.user &&
                evt.volunteers?.some(
                  (v) => String(v._id || v) === String(session.user.id || session.user._id)
                );

              return (
                <article
                  key={evt._id}
                  className="flex flex-col justify-between rounded-2xl border border-[#e5e9f2] bg-white overflow-hidden shadow-sm transition hover:shadow-md hover:border-[#cbd7e8] relative group"
                >
                  <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                    {evt.banner ? (
                      <img
                        src={evt.banner}
                        alt={evt.title}
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-r from-[#173b69] to-[#244f87] text-white font-bold text-lg">
                        {evt.clubId?.name || "Campus Event"}
                      </div>
                    )}

                    <div className="absolute top-3 left-3 flex gap-2">
                      <span
                        className={`rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide backdrop-blur-md shadow-sm ${
                          evt.status === "Ongoing"
                            ? "bg-amber-500/90 text-white"
                            : evt.status === "Completed"
                            ? "bg-gray-700/80 text-white"
                            : "bg-emerald-600/90 text-white"
                        }`}
                      >
                        {evt.status}
                      </span>
                      {evt.clubId ? (
                        <span className="rounded-md bg-white/90 px-2.5 py-1 text-[10px] font-extrabold text-[#173b69] shadow-sm">
                          {evt.clubId.code}
                        </span>
                      ) : (
                        <span className="rounded-md bg-white/90 px-2.5 py-1 text-[10px] font-extrabold text-gray-700 shadow-sm">
                          Campus Wide
                        </span>
                      )}
                    </div>

                    {/* Edit & Delete Action Buttons on banner (Admin Only) */}
                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex gap-1.5 opacity-90 group-hover:opacity-100 transition">
                        <button
                          title="Edit Event"
                          onClick={() => handleOpenEditEvent(evt)}
                          className="rounded-lg bg-white/90 p-1.5 text-gray-700 hover:bg-white hover:text-[#173b69] transition shadow-sm backdrop-blur"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          title="Delete Event"
                          onClick={() => handleDeleteEvent(evt._id, evt.title)}
                          className="rounded-lg bg-white/90 p-1.5 text-gray-700 hover:bg-white hover:text-red-600 transition shadow-sm backdrop-blur"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
                        <Clock size={14} className="text-[#a81720]" />
                        <span>
                          {new Date(evt.startDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-[#1c2b40] leading-snug">
                        {evt.title}
                      </h2>
                      <p className="mt-2 text-xs text-[#5c6a7e] leading-relaxed line-clamp-3">
                        {evt.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        {evt.location && (
                          <p className="text-[11px] font-medium text-gray-600 flex items-center gap-1.5">
                            <MapPin size={13} className="text-[#a81720]" />
                            {evt.location}
                          </p>
                        )}
                        <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
                          <Users size={13} className="text-[#173b69]" />
                          {evt.volunteers?.length || 0} Registered Volunteer
                          {evt.volunteers?.length === 1 ? "" : "s"}
                        </p>
                      </div>

                      {evt.status !== "Completed" && (
                        <button
                          onClick={() => handleVolunteerJoin(evt._id)}
                          disabled={isUserVolunteering || volunteeringId === evt._id}
                          className={`rounded-lg px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                            isUserVolunteering
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                              : "bg-[#173b69] text-white hover:bg-[#122e53]"
                          }`}
                        >
                          {isUserVolunteering ? (
                            <>
                              <CheckCircle2 size={13} /> Volunteering
                            </>
                          ) : volunteeringId === evt._id ? (
                            "Joining..."
                          ) : (
                            "Join as Volunteer"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT EVENT MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-[#172337] flex items-center gap-2">
                <Calendar size={18} className="text-[#173b69]" />
                {editingEventId ? "Edit Campus Event" : "Create Campus Event"}
              </h2>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setEditingEventId(null);
                }}
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
                  placeholder="e.g. Annual Campus Hackathon"
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
                  placeholder="e.g. Central Auditorium or Online"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Banner Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={eventForm.banner}
                  onChange={(e) => setEventForm({ ...eventForm, banner: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Event details, schedule, agenda..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 outline-none focus:border-[#173b69]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEventModal(false);
                    setEditingEventId(null);
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-xl bg-[#173b69] px-5 py-2 text-xs font-bold text-white hover:bg-[#122e53] disabled:opacity-50"
                >
                  {formSubmitting ? "Saving..." : editingEventId ? "Update Event" : "Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Events;
