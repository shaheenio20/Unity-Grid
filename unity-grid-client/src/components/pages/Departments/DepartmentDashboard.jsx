import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowDownRight, ArrowRight, Building2, CalendarDays, CheckCircle2, ChevronRight, Clock3, GraduationCap, LayoutGrid, LogOut, Pencil, Plus, Users, X } from "lucide-react";
import { useCurrentUser } from "../../../lib/useCurrentUser";
import { authClient } from "../../../lib/authClient";
import DepartmentMembers from "./DepartmentMembers";
import "./DepartmentDashboard.css";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/department-workspace`;
const initialEvent = { title: "", clubId: "", startDate: "", endDate: "", location: "", description: "", status: "Upcoming" };
const dateParts = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? { day: "—", month: "—", full: "Date not set" } : { day: date.toLocaleDateString("en-GB", { day: "2-digit" }), month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(), full: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) };
};

function EmptyState({ icon: Icon, title, children }) {
  return <div className="dw-empty"><span className="dw-empty-icon"><Icon size={21}/></span><h3>{title}</h3><p>{children}</p></div>;
}

export default function DepartmentDashboard() {
  const { user, session, loading } = useCurrentUser();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [tab, setTab] = useState("overview");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(initialEvent);
  const [profile, setProfile] = useState({ headOfDept: "", description: "" });
  const [editing, setEditing] = useState(false);
  const request = useCallback(async (path = "", options = {}) => {
    const response = await fetch(`${API}${path}`, { credentials: "include", ...options, headers: { "Content-Type": "application/json", ...options.headers } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Something went wrong.");
    return data;
  }, []);
  const reload = useCallback(async () => {
    const data = await request();
    setWorkspace(data);
    setProfile({ headOfDept: data.department.headOfDept || "", description: data.department.description || "" });
  }, [request]);
  useEffect(() => {
    if (user?.role !== "Department") return;
    let active = true;
    request().then((data) => {
      if (!active) return;
      setWorkspace(data);
      setProfile({ headOfDept: data.department.headOfDept || "", description: data.department.description || "" });
    }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [user?.role, request]);
  const perform = async (action, message) => {
    setBusy(true); setError(""); setNotice("");
    try { await action(); await reload(); setNotice(message); return true; }
    catch (err) { setError(err.message); return false; }
    finally { setBusy(false); }
  };
  const saveEvent = async (event) => {
    event.preventDefault();
    if (await perform(() => request("/events", { method: "POST", body: JSON.stringify(form) }), "Event created successfully.")) { setDialog(false); setForm(initialEvent); }
  };
  const saveProfile = async (event) => {
    event.preventDefault();
    if (await perform(() => request("/profile", { method: "PATCH", body: JSON.stringify(profile) }), "Department profile updated.")) setEditing(false);
  };
  if (loading) return <main className="dw-loading">Checking session…</main>;
  if (!session?.user) return <Navigate to="/login" replace />;
  if (user?.role !== "Department") return <main className="dw-loading">This workspace is available to department accounts. <Link to="/">Return home</Link></main>;

  const department = workspace?.department;
  const clubs = workspace?.clubs || [];
  const events = workspace?.events || [];
  const upcoming = events.filter((event) => event.status === "Upcoming");
  const navigation = [["overview", "Overview", LayoutGrid], ["faculty", "Faculty members", GraduationCap], ["forum", "Forum members", Users], ["clubs", "Clubs & societies", Users], ["events", "Events", CalendarDays], ["profile", "Department profile", Building2]];
  const openEvent = () => { setError(""); setForm({ ...initialEvent, clubId: clubs[0]?._id || "" }); setDialog(true); };
  const EventRow = ({ event, manage = false }) => {
    const date = dateParts(event.startDate);
    return <article className="dw-event-row"><div className="dw-date"><strong>{date.day}</strong><span>{date.month}</span></div><div className="dw-event-info"><h4>{event.title}</h4><p>{event.clubId?.name || "Department event"}<span> · </span>{date.full}{event.location && <> <span>·</span> {event.location}</>}</p></div>{manage ? <label className="dw-status-label"><span>Status</span><select aria-label={`Status for ${event.title}`} disabled={busy} value={event.status} onChange={(e) => { const status = e.target.value; perform(() => request(`/events/${event._id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }), "Event status updated."); }}>{["Upcoming", "Ongoing", "Completed"].map((status) => <option key={status}>{status}</option>)}</select></label> : <span className="dw-status"><span/>Upcoming</span>}</article>;
  };

  return <main className="dw-shell">
    <aside className="dw-sidebar"><div className="dw-side-label">DEPARTMENT WORKSPACE</div><nav className="dw-nav" aria-label="Department navigation">{navigation.map(([key, label, Icon]) => <button key={key} type="button" aria-current={tab === key ? "page" : undefined} onClick={() => { setTab(key); setNotice(""); }} className={tab === key ? "active" : ""}><Icon size={18}/><span>{label}</span>{tab === key && <ChevronRight className="dw-nav-arrow" size={15}/>}</button>)}</nav><div className="dw-side-bottom"><div className="dw-side-account"><span className="dw-avatar">{(department?.code || user.name || "D").slice(0, 2).toUpperCase()}</span><span><strong>{department?.code || "Department"}</strong><small>Department account</small></span></div><button className="dw-signout" onClick={async () => { await authClient.signOut(); navigate("/login"); }}><LogOut size={16}/> Sign out</button></div></aside>
    <div className="dw-main">
      <div className="dw-content">{error && <div role="alert" className="dw-alert dw-alert-error">{error} <button onClick={() => reload().then(() => setError("")).catch((err) => setError(err.message))}>Try again</button></div>}{notice && <div role="status" className="dw-alert dw-alert-success"><CheckCircle2 size={17}/>{notice}</div>}{!workspace && !error && <div className="dw-loading">Loading your workspace…</div>}
      {workspace && <>
        {(tab === "faculty" || tab === "forum") && <DepartmentMembers key={tab} type={tab} clubs={clubs} request={request} />}
        {tab === "overview" && <><div className="dw-page-heading"><div><div className="dw-eyebrow"><span/> DEPARTMENT WORKSPACE</div><h1>Welcome to {department.name}</h1><p>Here’s what’s happening across your department.</p></div><button className="dw-primary" disabled={!clubs.length} title={!clubs.length ? "A department club is needed first" : undefined} onClick={openEvent}><Plus size={17}/> Create event</button></div>
          <div className="dw-stats">{[["Clubs & societies", clubs.length, Users, "Your department network"], ["Total events", events.length, CalendarDays, "Across your clubs"], ["Upcoming events", upcoming.length, Clock3, "Ready to look forward to"]].map(([label, count, Icon, caption], i) => <div className="dw-stat" key={label}><div className="dw-stat-top"><span>{label}</span><span className={`dw-stat-icon tone-${i}`}><Icon size={19}/></span></div><strong>{String(count).padStart(2, "0")}</strong><p>{caption}</p></div>)}</div>
          <div className="dw-overview-grid"><section className="dw-card dw-events-card"><div className="dw-card-head"><div><span className="dw-kicker">YOUR CALENDAR</span><h2>Upcoming events</h2><p>What’s coming up in your department</p></div><button className="dw-text-button" onClick={() => setTab("events")}>View all <ArrowRight size={15}/></button></div>{upcoming.length ? <div className="dw-event-list">{upcoming.slice(0, 4).map((event) => <EventRow key={event._id} event={event}/>)}</div> : <EmptyState icon={CalendarDays} title="No upcoming events">When your clubs schedule an event, it will appear here.</EmptyState>}</section>
          <div className="dw-overview-side"><section className="dw-card dw-dept-card"><div className="dw-card-head"><div><span className="dw-kicker">YOUR DEPARTMENT</span><h2>Department details</h2></div><span className="dw-card-icon"><Building2 size={18}/></span></div><div className="dw-detail"><span>Department code</span><strong>{department.code}</strong></div><div className="dw-detail"><span>Head of department</span><strong>{department.headOfDept || "Not added yet"}</strong></div><button className="dw-outline dw-full" onClick={() => setTab("profile")}>View department profile <ArrowRight size={15}/></button></section><section className="dw-quick-card"><div className="dw-quick-icon"><GraduationCap size={20}/></div><div><strong>Stronger together.</strong><p>Explore the clubs that bring your department to life.</p><button onClick={() => setTab("clubs")}>Explore clubs <ArrowRight size={14}/></button></div><ArrowDownRight className="dw-quick-decoration" size={84}/></section></div></div></>}
        {tab === "clubs" && <><div className="dw-page-heading"><div><div className="dw-eyebrow"><span/> DEPARTMENT NETWORK</div><h1>Clubs & societies</h1><p>Discover the groups connected to your department.</p></div><span className="dw-count-pill">{clubs.length} {clubs.length === 1 ? "club" : "clubs"}</span></div>{clubs.length ? <div className="dw-club-grid">{clubs.map((club) => <article className="dw-card dw-club" key={club._id}><div className="dw-club-top"><span className="dw-club-icon">{club.code?.slice(0, 2) || "CL"}</span><span className="dw-code-pill">{club.code}</span></div><h2>{club.name}</h2><p>{club.description || "No club description has been added yet."}</p><Link to={`/clubs/${club._id}`}>View club profile <ArrowRight size={15}/></Link></article>)}</div> : <div className="dw-card"><EmptyState icon={Users} title="No clubs assigned yet">Ask an administrator to add a club to your department.</EmptyState></div>}</>}
        {tab === "events" && <><div className="dw-page-heading"><div><div className="dw-eyebrow"><span/> DEPARTMENT CALENDAR</div><h1>Events</h1><p>Plan and keep track of your department’s club events.</p></div><button disabled={!clubs.length} title={!clubs.length ? "A department club is needed first" : undefined} onClick={openEvent} className="dw-primary"><Plus size={17}/> Create event</button></div>{!clubs.length && <div className="dw-info">A club must be assigned to your department before you can create an event.</div>}<section className="dw-card"><div className="dw-card-head"><div><span className="dw-kicker">EVENT DIRECTORY</span><h2>All events <span className="dw-heading-count">{events.length}</span></h2><p>Update the status as events progress.</p></div></div>{events.length ? <div className="dw-event-list">{events.map((event) => <EventRow key={event._id} event={event} manage/>)}</div> : <EmptyState icon={CalendarDays} title="No events yet">Events created for your department’s clubs will appear here.</EmptyState>}</section></>}
        {tab === "profile" && <><div className="dw-page-heading"><div><div className="dw-eyebrow"><span/> DEPARTMENT SETTINGS</div><h1>Department profile</h1><p>Keep your department’s information current.</p></div>{!editing && <button className="dw-outline" onClick={() => setEditing(true)}><Pencil size={15}/> Edit profile</button>}</div><section className="dw-card dw-profile"><div className="dw-card-head"><div><span className="dw-kicker">GENERAL INFORMATION</span><h2>Department details</h2><p>Your department name and code are managed by administrators.</p></div><span className="dw-card-icon"><Building2 size={18}/></span></div><div className="dw-profile-ident"><div><span>DEPARTMENT NAME</span><strong>{department.name}</strong></div><div><span>DEPARTMENT CODE</span><strong>{department.code}</strong></div></div><form onSubmit={saveProfile} className="dw-form dw-profile-form"><label>Head of department<input disabled={!editing} maxLength={150} value={profile.headOfDept} onChange={(e) => setProfile({ ...profile, headOfDept: e.target.value })} placeholder="Add the head of department"/></label><label>About the department<textarea disabled={!editing} maxLength={2000} rows={5} value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} placeholder="Add a short department description"/></label>{editing && <div className="dw-form-actions"><button disabled={busy} className="dw-primary">{busy ? "Saving…" : "Save changes"}</button><button type="button" className="dw-outline" onClick={() => { setProfile({ headOfDept: department.headOfDept || "", description: department.description || "" }); setEditing(false); }}>Cancel</button></div>}</form></section></>}
      </>}</div>
    </div>
    {dialog && <div className="dw-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="event-title" onClick={(e) => { if (e.target === e.currentTarget && !busy) setDialog(false); }}><form onSubmit={saveEvent} className="dw-modal dw-form"><div className="dw-modal-head"><div><span className="dw-kicker">DEPARTMENT CALENDAR</span><h2 id="event-title">Create an event</h2><p>Share a new event from one of your department clubs.</p></div><button type="button" aria-label="Close" onClick={() => setDialog(false)}><X size={20}/></button></div><label>Event title<input required autoFocus maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Annual technology showcase"/></label><label>Organising club<select required value={form.clubId} onChange={(e) => setForm({ ...form, clubId: e.target.value })}>{clubs.map((club) => <option key={club._id} value={club._id}>{club.name}</option>)}</select></label><div className="dw-form-grid"><label>Starts<input type="datetime-local" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}/></label><label>Ends <span className="dw-optional">Optional</span><input type="datetime-local" min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}/></label></div><label>Location <span className="dw-optional">Optional</span><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. University auditorium"/></label><label>Description <span className="dw-optional">Optional</span><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell people a little about the event"/></label><label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["Upcoming", "Ongoing", "Completed"].map((status) => <option key={status}>{status}</option>)}</select></label>{error && <p role="alert" className="dw-modal-error">{error}</p>}<div className="dw-form-actions"><button type="button" className="dw-outline" onClick={() => setDialog(false)}>Cancel</button><button disabled={busy} className="dw-primary">{busy ? "Creating…" : "Create event"} <ArrowRight size={15}/></button></div></form></div>}
  </main>;
}
