import { useEffect, useState } from "react";
import { GraduationCap, Mail, Pencil, Phone, Plus, Trash2, Users, X } from "lucide-react";
import { showConfirmDelete } from "../../../lib/alerts";

const emptyProfile = { name: "", designation: "", email: "", phone: "", photo: "", bio: "", clubId: "" };

export default function DepartmentMembers({ type, clubs, request }) {
  const faculty = type === "faculty";
  const label = faculty ? "Faculty" : "Forum";
  const Icon = faculty ? GraduationCap : Users;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyProfile);
  const [busy, setBusy] = useState(false);

  const load = async () => { const data = await request("/members"); setMembers(data.members.filter((member) => member.type === type)); };
  useEffect(() => {
    let active = true;
    request("/members").then((data) => { if (active) setMembers(data.members.filter((member) => member.type === type)); }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [request, type]);

  const open = (member) => {
    setError(""); setNotice(""); setEditingId(member?._id || null);
    setForm(member ? { name: member.name, designation: member.designation, email: member.email || "", phone: member.phone || "", photo: member.photo || "", bio: member.bio || "", clubId: member.clubId?._id || "" } : { ...emptyProfile, clubId: clubs[0]?._id || "" });
    setDialog(true);
  };
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await request(editingId ? `/members/${editingId}` : "/members", { method: editingId ? "PATCH" : "POST", body: JSON.stringify({ ...form, type }) });
      setDialog(false); setNotice(`${label} profile ${editingId ? "updated" : "created"}.`); await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const remove = async (member) => {
    if (!await showConfirmDelete(`${label.toLowerCase()} profile for ${member.name}`)) return;
    setBusy(true); setError(""); setNotice("");
    try { await request(`/members/${member._id}`, { method: "DELETE" }); setNotice("Profile deleted."); await load(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <>
    <div className="dw-page-heading"><div><div className="dw-eyebrow"><span/> PEOPLE DIRECTORY</div><h1>{label} members</h1><p>{faculty ? "Manage the faculty profiles in your department." : "Manage profiles for members of your department's clubs and forums."}</p></div><button className="dw-primary" onClick={() => open(null)} disabled={!faculty && !clubs.length}><Plus size={17}/> Add {label.toLowerCase()} member</button></div>
    {!faculty && !clubs.length && <div className="dw-info">Ask an administrator to add a club or forum to this department before adding forum members.</div>}
    {error && !dialog && <div role="alert" className="dw-alert dw-alert-error">{error} <button onClick={() => { setError(""); setLoading(true); load().catch((err) => setError(err.message)).finally(() => setLoading(false)); }}>Try again</button></div>}
    {notice && <div role="status" className="dw-alert dw-alert-success">{notice}</div>}
    {loading ? <div className="dw-loading">Loading profiles…</div> : members.length ? <div className="dw-member-grid">{members.map((member) => <article className="dw-card dw-member" key={member._id}>
      <div className="dw-member-head">{member.photo ? <img className="dw-member-avatar" src={member.photo} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }}/> : <span className="dw-member-avatar dw-member-initial">{member.name.slice(0, 1).toUpperCase()}</span>}<div className="dw-member-actions"><button disabled={busy} aria-label={`Edit ${member.name}`} title="Edit profile" onClick={() => open(member)}><Pencil size={16}/></button><button disabled={busy} aria-label={`Delete ${member.name}`} title="Delete profile" onClick={() => remove(member)}><Trash2 size={16}/></button></div></div>
      <h2>{member.name}</h2><p className="dw-member-role">{member.designation}</p>{member.type === "forum" && <span className="dw-code-pill">{member.clubId?.name || "Forum unavailable"}</span>}{member.bio && <p className="dw-member-bio">{member.bio}</p>}<div className="dw-member-contact">{member.email && <a href={`mailto:${member.email}`}><Mail size={14}/>{member.email}</a>}{member.phone && <span><Phone size={14}/>{member.phone}</span>}</div>
    </article>)}</div> : !error && <div className="dw-card"><div className="dw-empty"><span className="dw-empty-icon"><Icon size={21}/></span><h3>No {label.toLowerCase()} profiles yet</h3><p>Add a profile to start your department directory.</p></div></div>}
    {dialog && <div className="dw-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="member-title" onClick={(event) => { if (event.target === event.currentTarget && !busy) setDialog(false); }}><form onSubmit={save} className="dw-modal dw-form"><div className="dw-modal-head"><div><span className="dw-kicker">PEOPLE DIRECTORY</span><h2 id="member-title">{editingId ? "Edit" : "Add"} {label.toLowerCase()} member</h2><p>Profile details are available to this department workspace.</p></div><button type="button" aria-label="Close" onClick={() => setDialog(false)}><X size={20}/></button></div>
      <label>Full name<input required autoFocus maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name"/></label><label>{faculty ? "Designation" : "Forum role"}<input required maxLength={120} value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder={faculty ? "e.g. Assistant Professor" : "e.g. President"}/></label>
      {!faculty && <label>Forum or club<select required value={form.clubId} onChange={(e) => setForm({ ...form, clubId: e.target.value })}><option value="">Select a forum</option>{clubs.map((club) => <option value={club._id} key={club._id}>{club.name}</option>)}</select></label>}
      <div className="dw-form-grid"><label>Email <span className="dw-optional">Optional</span><input type="email" maxLength={254} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/></label><label>Phone <span className="dw-optional">Optional</span><input type="tel" maxLength={40} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}/></label></div><label>Photo URL <span className="dw-optional">Optional</span><input type="url" maxLength={2048} value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })} placeholder="https://..."/></label><label>About <span className="dw-optional">Optional</span><textarea rows={3} maxLength={1000} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}/></label>
      {error && <p className="dw-modal-error" role="alert">{error}</p>}<div className="dw-form-actions"><button type="button" className="dw-outline" onClick={() => setDialog(false)}>Cancel</button><button disabled={busy} className="dw-primary">{busy ? "Saving…" : editingId ? "Save changes" : "Add profile"}</button></div>
    </form></div>}
  </>;
}
