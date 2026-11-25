import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Droplet,
  Calendar,
  Users,
  ArrowRight,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Building2,
  AlertTriangle,
  HeartHandshake,
  CheckCircle2,
  ChevronRight,
  Award,
  Receipt,
} from "lucide-react";
import sylhetDonorsData from "../../data/sylhetDonors.json";
import { useCurrentUser } from "../../lib/useCurrentUser";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Home() {
  const { session } = useCurrentUser();

  // Live data states
  const [bloodRequests, setBloodRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [campusDonorsCount, setCampusDonorsCount] = useState(0);
  const [crisisTickets, setCrisisTickets] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState({
    totalDonations: 0,
    totalExpenses: 0,
    balance: 0,
    donationsCount: 0,
    expensesCount: 0,
  });
  const [systemSetting, setSystemSetting] = useState({
    isCrisisModeActive: true,
    crisisTitle: "Sylhet Regional Flood Relief Operation",
    emergencyHotline: "01792345238",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);

        const [
          requestsRes,
          eventsRes,
          deptsRes,
          donorsRes,
          crisisRes,
          ledgerRes,
          systemRes,
        ] = await Promise.allSettled([
          fetch(`${API_BASE}/api/blood/requests`),
          fetch(`${API_BASE}/api/events`),
          fetch(`${API_BASE}/api/departments`),
          fetch(`${API_BASE}/api/blood/donors`),
          fetch(`${API_BASE}/api/crisis/tickets`),
          fetch(`${API_BASE}/api/ledger/summary`),
          fetch(`${API_BASE}/api/system/mode`),
        ]);

        // Process Blood Requests
        if (requestsRes.status === "fulfilled" && requestsRes.value.ok) {
          const reqData = await requestsRes.value.json();
          if (reqData.success && Array.isArray(reqData.requests)) {
            setBloodRequests(reqData.requests);
          }
        }

        // Process Campus Donors Count
        if (donorsRes.status === "fulfilled" && donorsRes.value.ok) {
          const donorsData = await donorsRes.value.json();
          if (donorsData.success && Array.isArray(donorsData.donors)) {
            setCampusDonorsCount(donorsData.donors.length);
          }
        }

        // Process Events
        if (eventsRes.status === "fulfilled" && eventsRes.value.ok) {
          const evData = await eventsRes.value.json();
          if (evData.success && Array.isArray(evData.events)) {
            setEvents(evData.events);
          }
        }

        // Process Crisis Tickets
        if (crisisRes.status === "fulfilled" && crisisRes.value.ok) {
          const cData = await crisisRes.value.json();
          if (cData.success && Array.isArray(cData.tickets)) {
            setCrisisTickets(cData.tickets);
          }
        }

        // Process Ledger Summary
        if (ledgerRes.status === "fulfilled" && ledgerRes.value.ok) {
          const lData = await ledgerRes.value.json();
          if (lData.success && lData.summary) {
            setLedgerSummary(lData.summary);
          }
        }

        // Process System Setting
        if (systemRes.status === "fulfilled" && systemRes.value.ok) {
          const sData = await systemRes.value.json();
          if (sData.success && sData.setting) {
            setSystemSetting(sData.setting);
          }
        }

        // Process Departments & Clubs
        if (deptsRes.status === "fulfilled" && deptsRes.value.ok) {
          const deptData = await deptsRes.value.json();
          if (deptData.success && Array.isArray(deptData.departments)) {
            setDepartments(deptData.departments);
            // Extract all clubs across departments
            const extractedClubs = [];
            deptData.departments.forEach((dept) => {
              if (Array.isArray(dept.clubs)) {
                dept.clubs.forEach((club) => {
                  extractedClubs.push({
                    ...club,
                    departmentName: dept.name,
                    deptCode: dept.code,
                  });
                });
              }
            });
            setClubs(extractedClubs);
          }
        }
      } catch (err) {
        console.error("Error fetching homepage live data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Filter 3 active or latest requests for live showcase
  const activeRequests = bloodRequests.filter((r) => r.status === "Pending");
  const showcaseRequests = (
    activeRequests.length > 0 ? activeRequests : bloodRequests
  ).slice(0, 3);

  // Filter 3 upcoming or latest events
  const upcomingEvents = events.filter((e) => e.status === "Upcoming");
  const showcaseEvents = (
    upcomingEvents.length > 0 ? upcomingEvents : events
  ).slice(0, 3);

  // Featured 3 clubs
  const showcaseClubs = clubs.slice(0, 3);

  // Dynamic Metrics - 100% Real
  const totalDonorsCount = sylhetDonorsData.length + campusDonorsCount;
  const activeRequestsCount = activeRequests.length;
  const totalClubsCount = clubs.length;
  const totalEventsCount = events.length;

  return (
    <main className="bg-[#f8fafc] text-slate-800 font-sans pb-24">
      {/* ──────────────── 1. HERO SECTION ──────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#101b33] via-[#16274b] to-[#111f3d] text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-700/60 shadow-xl">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-1/4 size-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 size-80 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              {/* Dynamic Live Ticker / Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold backdrop-blur-md transition">
                <span className="size-2 rounded-full bg-red-400 animate-ping" />
                <span className="text-red-300 font-bold">Live Campus Network</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-200 text-[11px]">
                  {activeRequestsCount > 0
                    ? `${activeRequestsCount} Urgent Blood Request${activeRequestsCount > 1 ? "s" : ""} Active`
                    : "Connecting Campus Clubs & Humanitarian Support"}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
                Stronger campus communities{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-300">
                  start here.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                UnityGrid connects Metropolitan University students, academic clubs, and humanitarian logistics — making it effortless to participate in campus life and save lives during emergencies.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/blood"
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-3 text-xs sm:text-sm font-bold shadow-lg shadow-red-900/40 transition active:scale-95"
                >
                  <Droplet size={16} className="fill-white" />
                  <span>Blood Network</span>
                  <ArrowRight size={14} />
                </Link>

                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white px-5 py-3 text-xs sm:text-sm font-bold border border-white/20 backdrop-blur-xs transition"
                >
                  <Calendar size={16} />
                  <span>Campus Events</span>
                </Link>

                <Link
                  to="/departments"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 px-4 py-3 text-xs sm:text-sm font-semibold border border-slate-700 transition"
                >
                  <Building2 size={16} />
                  <span>Clubs & Societies</span>
                </Link>
              </div>

              {/* Verified Trust Strip */}
              <div className="pt-4 flex items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span>90-Day Cooldown Safe</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Award size={16} className="text-amber-400" />
                  <span>376+ Sylhet Donors</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Sparkles size={16} className="text-blue-400" />
                  <span>Real-Time Updates</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Graphic & Quick Interactive Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 p-6 backdrop-blur-xl shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md">
                        <Droplet size={18} className="fill-white" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">Emergency Logistics Hub</p>
                        <p className="text-[10px] text-slate-400">Metropolitan University, Sylhet</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                      Online
                    </span>
                  </div>

                  {/* Featured Preview Item inside Hero */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Top Campus Priority
                      </span>
                      <span className="text-[10px] font-bold text-red-300 bg-red-500/20 px-2 py-0.5 rounded-md">
                        24/7 Response
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white">
                      Verified Voluntary Blood Directory & Student Club Management
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Instant matching with eligible donors on campus and across Sylhet division hospitals.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="rounded-xl bg-white/5 p-3 border border-white/10 text-center">
                      <p className="text-[10px] font-black uppercase text-slate-400">Sylhet Donors</p>
                      <p className="text-lg font-black text-white mt-0.5">376+</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-3 border border-white/10 text-center">
                      <p className="text-[10px] font-black uppercase text-slate-400">Active Societies</p>
                      <p className="text-lg font-black text-white mt-0.5">{totalClubsCount}</p>
                    </div>
                  </div>

                  <Link
                    to="/blood"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white py-2.5 text-xs font-bold transition shadow-xs"
                  >
                    <span>Check Emergency Donors</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────── 2. QUICK IMPACT STATS BAR ──────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-12 pt-8 border-t border-slate-700/60">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Verified Donors
              </p>
              <p className="text-2xl font-black text-white mt-1">{totalDonorsCount}+</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Campus & Sylhet Regional</p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Active Clubs & Forums
              </p>
              <p className="text-2xl font-black text-white mt-1">{totalClubsCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Across {departments.length || 3} Departments</p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Events & Contests
              </p>
              <p className="text-2xl font-black text-white mt-1">{totalEventsCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Hackathons & Fests</p>
            </div>

            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-red-300 flex items-center gap-1">
                <AlertTriangle size={12} /> Active Blood Needs
              </p>
              <p className="text-2xl font-black text-white mt-1">{activeRequestsCount}</p>
              <p className="text-[10px] text-red-300/80 mt-0.5">Updated in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── 3. EMERGENCY BLOOD SPOTLIGHT ──────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 text-red-600 text-xs font-black uppercase tracking-wider mb-1">
              <Droplet size={14} className="fill-red-600" />
              <span>Live Emergency Alerts</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Urgent Blood Requests
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live emergency cases directly from our campus database. Call directly to arrange blood.
            </p>
          </div>

          <Link
            to="/blood"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl px-3.5 py-2 transition shrink-0 self-start sm:self-auto"
          >
            <span>View All Requests & Donors</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Requests Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          {showcaseRequests.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
              <p className="font-bold text-slate-700">No Pending Emergency Blood Requests Right Now</p>
              <p className="mt-1">All current campus patient requests have been fulfilled or resolved.</p>
            </div>
          ) : (
            showcaseRequests.map((req) => (
              <div
                key={req._id}
                className={`rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between ${req.urgency === "Critical" && req.status === "Pending"
                    ? "border-red-300 ring-2 ring-red-500/10"
                    : "border-slate-200"
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="size-10 rounded-xl bg-red-50 text-red-600 font-black text-base flex items-center justify-center border border-red-200">
                      {req.bloodGroup}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${req.status === "Fulfilled"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : req.urgency === "Critical"
                            ? "bg-red-100 text-red-800 border border-red-300 animate-pulse"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                    >
                      {req.status === "Fulfilled" ? "Fulfilled" : req.urgency}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Patient:</span>
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
                        Needed by: {new Date(req.requiredDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  {req.status === "Pending" ? (
                    <a
                      href={`tel:${req.contactNumber}`}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white py-2 text-xs font-bold transition shadow-xs"
                    >
                      <Phone size={13} /> Call {req.contactNumber}
                    </a>
                  ) : (
                    <div className="w-full text-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl py-2 flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={13} /> Blood Arranged
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ──────────────── 4. UPCOMING CAMPUS EVENTS ──────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[#173b69] text-xs font-black uppercase tracking-wider mb-1">
              <Calendar size={14} />
              <span>Campus Activities</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Featured Events & Hackathons
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Stay ahead with upcoming hackathons, programming contests, and workshops organized by campus clubs.
            </p>
          </div>

          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173b69] hover:text-[#122e53] bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3.5 py-2 transition shrink-0 self-start sm:self-auto"
          >
            <span>Explore All Events</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Events Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          {showcaseEvents.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
              <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">No Events Listed Yet</p>
              <p className="mt-1">Check back soon for upcoming campus contests and seminars.</p>
            </div>
          ) : (
            showcaseEvents.map((ev) => (
              <div
                key={ev._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="rounded-lg bg-blue-50 text-blue-700 font-black text-[10px] px-2 py-0.5 border border-blue-200">
                      {ev.clubId?.code || "Campus Event"}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${ev.status === "Upcoming"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                    >
                      {ev.status || "Upcoming"}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2 text-xs">
                    <h3 className="font-black text-slate-800 text-sm leading-snug line-clamp-2">
                      {ev.title}
                    </h3>

                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {ev.description || "Exciting campus event and contest for university students."}
                    </p>

                    <div className="pt-2 space-y-1.5 text-slate-600 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400 shrink-0" />
                        <span>
                          {new Date(ev.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="truncate">{ev.location || "Campus Venue"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    to="/events"
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white py-2 text-xs font-bold transition shadow-xs"
                  >
                    <span>View Event Details</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ──────────────── 5. FEATURED CLUBS & SOCIETIES ──────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 text-blue-700 text-xs font-black uppercase tracking-wider mb-1">
              <Users size={14} />
              <span>Student Leadership</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Campus Clubs & Academic Societies
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Get involved with departmental clubs, participate in peer learning, and build your portfolio.
            </p>
          </div>

          <Link
            to="/departments"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3.5 py-2 transition shrink-0 self-start sm:self-auto"
          >
            <span>Browse All Departments</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          {showcaseClubs.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
              <Building2 size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">No Clubs Registered Yet</p>
            </div>
          ) : (
            showcaseClubs.map((club) => (
              <div
                key={club._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="size-11 rounded-xl bg-[#173b69] text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                      {club.name ? club.name.slice(0, 2).toUpperCase() : "CL"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-800 text-xs sm:text-sm truncate">
                        {club.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 truncate">
                        {club.departmentName || club.deptCode}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2">
                    {club.description || "Active student organization focused on academic and leadership growth."}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      Code: {club.code || "CAMPUS"}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      Verified Club
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    to={`/clubs/${club._id}`}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 text-xs font-bold transition"
                  >
                    <span>View Club Profile</span>
                    <ChevronRight size={13} className="text-slate-400" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ──────────────── 6. CRISIS & RELIEF TRANSPARENCY HUB ──────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Emergency Flood & Crisis SOS Hub */}
          <div className="relative overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-br from-white via-rose-50/20 to-rose-100/30 p-6 shadow-xs hover:shadow-md transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <AlertTriangle size={22} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                      <span className="size-1.5 rounded-full bg-rose-600 animate-ping" />
                      Live Response
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">Sylhet Zone</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                    Emergency Flood & Crisis SOS Hub
                  </h3>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Real-time campus & community disaster coordination. Submit rescue alerts, parse unstructured social media posts with AI, and track field dispatch.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/80 border border-rose-100 backdrop-blur-xs">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400">Active SOS Tickets</span>
                <p className="text-lg font-black text-rose-600">
                  {crisisTickets.filter((t) => t.status === "Open" || t.status === "In_Progress").length}
                  <span className="text-xs font-normal text-slate-500 ml-1">Open</span>
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400">Emergency Helpline</span>
                <a
                  href={`tel:${systemSetting?.emergencyHotline || "01792345238"}`}
                  className="text-xs sm:text-sm font-bold text-slate-800 hover:text-rose-600 flex items-center gap-1 mt-1 transition"
                >
                  <Phone size={13} className="text-rose-500 shrink-0" />
                  {systemSetting?.emergencyHotline || "01792345238"}
                </a>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Link
                to="/crisis"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
              >
                Open Live SOS Board
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/crisis?tab=parser"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold transition"
              >
                <Sparkles size={14} className="text-rose-600" />
                Parse SOS with AI
              </Link>
            </div>
          </div>

          {/* Card 2: 100% Transparent Relief Ledger */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/20 to-emerald-100/30 p-6 shadow-xs hover:shadow-md transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Public Audit
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">Every ৳ Accounted For</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                    Transparent Public Relief Ledger
                  </h3>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Live financial tracking of all campus relief contributions and expenditures. Verified against receipts with zero hidden deductions.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-white/80 border border-emerald-100 backdrop-blur-xs text-center sm:text-left">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400">Total Raised</span>
                <p className="text-base sm:text-lg font-black text-slate-800">
                  ৳{(ledgerSummary?.totalDonations || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400">Relief Spent</span>
                <p className="text-base sm:text-lg font-black text-amber-600">
                  ৳{(ledgerSummary?.totalExpenses || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400">Net Fund</span>
                <p className="text-base sm:text-lg font-black text-emerald-600">
                  ৳{(ledgerSummary?.balance || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Link
                to="/ledger"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                <HeartHandshake size={14} />
                Donate to Relief Fund
              </Link>
              <Link
                to="/ledger"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold transition"
              >
                <Receipt size={14} className="text-emerald-600" />
                View Full Audit Ledger
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── 7. HOW UNITYGRID EMPOWERS CAMPUS ──────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="rounded-3xl bg-gradient-to-br from-[#101b33] to-[#182f5a] text-white p-8 sm:p-12 shadow-xl border border-slate-700/80">
          <div className="max-w-2xl mb-8">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
              Engineered for Student Impact
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              How UnityGrid Streamlines Campus Life
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              A single unified portal designed to replace fragmented social media groups with reliable, structured coordination.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-2.5 backdrop-blur-xs">
              <div className="size-10 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-black">
                <Droplet size={20} />
              </div>
              <h3 className="font-bold text-white text-sm">Automated Blood Safety</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                90-day medical cooldown calculation ensures donors recover safely while patients get matched instantly.
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-2.5 backdrop-blur-xs">
              <div className="size-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black">
                <Calendar size={20} />
              </div>
              <h3 className="font-bold text-white text-sm">Verified Event Pipeline</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Departmental clubs post hackathons, fests, and workshops directly with student volunteer registration.
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-2.5 backdrop-blur-xs">
              <div className="size-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-white text-sm">Role-Protected Governance</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Role-based access control (Admin, Member, Student) keeps student records safe and actions verified.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── 7. BOTTOM CTA ──────────────── */}
      {!session?.user && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Ready to make a difference on campus?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                Create your student or member account in seconds to register for club events, apply as volunteer, and support your campus peers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/register"
                className="rounded-xl bg-[#173b69] hover:bg-[#122e53] text-white px-5 py-2.5 text-xs font-bold shadow-xs transition"
              >
                Register Now
              </Link>
              <Link
                to="/login"
                className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-5 py-2.5 text-xs font-bold transition"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default Home;
