import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  HeartHandshake,
  Sparkles,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  Send,
  Plus,
  X,
  DollarSign,
  Receipt,
  Compass,
  Trash2,
  Eye,
  RefreshCw,
  MessageSquare,
  Waves,
  Droplets,
  Leaf,
  PhoneCall,
} from "lucide-react";
import { useCurrentUser } from "../../../lib/useCurrentUser";
import { showAlert, showConfirmDelete, showToast } from "../../../lib/alerts";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ZONES = [
  "All",
  "Companygonj",
  "Gowainghat",
  "Kanaighat",
  "Jalalabad Ghat",
  "Sunamganj Border",
  "Sylhet Sadar",
  "Shahjalal Uposhahar",
  "Other",
];

const EXAMPLE_MESSAGES = [
  {
    label: "Companygonj Roof SOS",
    text: "কোম্পানীগঞ্জ বাজার সংলগ্ন ইসলামপুর স্কুলের ছাদে ৫ জন আটকে আছি, পানি দ্রুত বাড়ছে, শিশুদের খাবার ও বিশুদ্ধ পানি শেষ, জরুরি রেসকিউ বোট পাঠান। যোগাযোগ: 01712345678",
  },
  {
    label: "Jalalabad Riverbank SOS",
    text: "জালালাবাদ ঘাট নদীর পাড় প্লাবিত, ঘরে ৩ জন বৃদ্ধ রোগী ও কোমর সমান পানি। স্যালাইন ও শুকনো খাবার সংকট। কল দিন 01823456789",
  },
  {
    label: "Gowainghat Water Trap",
    text: "Gowainghat Nandirgaon 8 people stranded on high ground. Need emergency boat and clean drinking water immediately. Contact: 01912345670",
  },
];

export default function CrisisHub({ initialTab = "sos" }) {
  const navigate = useNavigate();
  const { user, session, isAdmin, isMember } = useCurrentUser();
  const [searchParams] = useSearchParams();

  // Active Tab: "sos" | "parser" | "ledger"
  const tabFromQuery = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromQuery || initialTab);

  // Data states
  const [tickets, setTickets] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState({
    totalDonations: 0,
    totalExpenses: 0,
    balance: 0,
    donationsCount: 0,
    expensesCount: 0,
  });
  const [donations, setDonations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [systemSetting, setSystemSetting] = useState({
    isCrisisModeActive: true,
    crisisTitle: "Sylhet Regional Flood Relief Operation",
    emergencyHotline: "01792345238",
    reliefCampLocation: "Metropolitan University Student Center, Sylhet",
  });
  const [loading, setLoading] = useState(true);

  // Filters for SOS Board
  const [selectedZone, setSelectedZone] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedUrgency, setSelectedUrgency] = useState("All");

  // Ledger Sub-view: "expenses" | "donations"
  const [ledgerView, setLedgerView] = useState("expenses");

  // AI Parser Form State
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Modals State
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(null);
  const [showFieldNoteModal, setShowFieldNoteModal] = useState(null);
  const [fieldNoteText, setFieldNoteText] = useState("");
  const [showHelplineModal, setShowHelplineModal] = useState(false);

  // Forms
  const [donationForm, setDonationForm] = useState({
    donorName: "",
    donorPhone: "",
    amount: "",
    paymentMethod: "bKash",
    transactionId: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "Food & Water",
    receiptImage: "",
    notes: "",
  });

  // Fetch all initial crisis & ledger data
  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, summaryRes, donationsRes, expensesRes, systemRes] =
        await Promise.allSettled([
          fetch(`${API_BASE}/api/crisis/tickets`),
          fetch(`${API_BASE}/api/ledger/summary`),
          fetch(`${API_BASE}/api/ledger/donations`),
          fetch(`${API_BASE}/api/ledger/expenses`),
          fetch(`${API_BASE}/api/system/mode`),
        ]);

      if (ticketsRes.status === "fulfilled" && ticketsRes.value.ok) {
        const d = await ticketsRes.value.json();
        if (d.success) setTickets(d.tickets || []);
      }

      if (summaryRes.status === "fulfilled" && summaryRes.value.ok) {
        const d = await summaryRes.value.json();
        if (d.success) setLedgerSummary(d.summary);
      }

      if (donationsRes.status === "fulfilled" && donationsRes.value.ok) {
        const d = await donationsRes.value.json();
        if (d.success) setDonations(d.donations || []);
      }

      if (expensesRes.status === "fulfilled" && expensesRes.value.ok) {
        const d = await expensesRes.value.json();
        if (d.success) setExpenses(d.expenses || []);
      }

      if (systemRes.status === "fulfilled" && systemRes.value.ok) {
        const d = await systemRes.value.json();
        if (d.success && d.setting) setSystemSetting(d.setting);
      }
    } catch (err) {
      console.error("Error loading crisis data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update URL search param on tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `/crisis?tab=${tab}`);
  };

  // ──────────────── AI SOS PARSER HANDLERS ────────────────
  const handleParseSos = async () => {
    if (!rawText || !rawText.trim()) {
      showAlert.warning("Input Required", "Please paste or type an emergency rescue message.");
      return;
    }

    setParsing(true);
    try {
      const res = await fetch(`${API_BASE}/api/crisis/parse-sos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      const data = await res.json();
      if (data.success && data.parsed) {
        setParsedData(data.parsed);
        showToast.success("Message parsed successfully by AI!");
      } else {
        showAlert.error("Parsing Failed", data.message || "Could not parse message.");
      }
    } catch {
      showAlert.error("Network Error", "Could not reach server to parse message.");
    } finally {
      setParsing(false);
    }
  };

  const handleApplyPreset = (presetText) => {
    setRawText(presetText);
    setParsedData(null);
  };

  const handleSubmitParsedTicket = async (e) => {
    e.preventDefault();
    if (!parsedData || !parsedData.location || !parsedData.contactInfo) {
      showAlert.warning("Incomplete Fields", "Please make sure location and contact phone are provided.");
      return;
    }

    setSubmittingTicket(true);
    try {
      const res = await fetch(`${API_BASE}/api/crisis/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rawText: rawText || `Emergency at ${parsedData.location}`,
          ...parsedData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showAlert.success(
          "SOS Registered!",
          "Emergency rescue ticket has been dispatched to the live board and volunteer teams."
        );
        setRawText("");
        setParsedData(null);
        loadData();
        handleTabChange("sos");
      } else {
        showAlert.error("Submission Failed", data.message || "Failed to post ticket.");
      }
    } catch {
      showAlert.error("Network Error", "Failed to connect to crisis backend.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  // ──────────────── TICKET STATUS & FIELD NOTE HANDLERS ────────────────
  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    if (!isAdmin && !isMember) {
      showAlert.error("Restricted", "Only verified Member or Admin can update ticket rescue status.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/crisis/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast.success(`Rescue status updated to '${newStatus}'!`);
        loadData();
      } else {
        showAlert.error("Update Failed", data.message || "Failed to change status.");
      }
    } catch {
      showAlert.error("Error", "Network error updating ticket status.");
    }
  };

  const handleAddFieldNote = async () => {
    if (!fieldNoteText || !fieldNoteText.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/crisis/tickets/${showFieldNoteModal}/field-note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ note: fieldNoteText }),
      });
      const data = await res.json();
      if (data.success) {
        showToast.success("Field update note logged.");
        setShowFieldNoteModal(null);
        setFieldNoteText("");
        loadData();
      } else {
        showAlert.error("Failed", data.message || "Could not save field note.");
      }
    } catch {
      showAlert.error("Error", "Error submitting field update.");
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!isAdmin) {
      showAlert.error("Admin Only", "Only administrators can delete crisis tickets.");
      return;
    }

    const confirmed = await showConfirmDelete("this emergency crisis ticket");
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/crisis/tickets/${ticketId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        showToast.success("Ticket deleted.");
        loadData();
      } else {
        showAlert.error("Failed", data.message || "Could not delete ticket.");
      }
    } catch {
      showAlert.error("Error", "Failed to delete ticket.");
    }
  };

  // One-Click Direct Triage / Emergency Rescue Chat Dispatch
  const handleEmergencyChat = async (ticket) => {
    if (!user) {
      showAlert.error("Sign In Required", "Please sign in to start emergency live triage with Admin.");
      navigate("/login");
      return;
    }

    try {
      showToast.info("Connecting to Emergency Rescue Dispatch...");
      const res = await fetch(`${API_BASE}/api/messages/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category: "Flood_Crisis",
          subject: `🌊 [Flood SOS] ${ticket.zone} - ${ticket.location}`,
          initialMessage: `Reporter: ${ticket.reporterName || "SOS Reporter"}\nZone: ${ticket.zone}\nLocation: ${ticket.location}\nPeople Stranded: ${ticket.peopleCount} person(s)\nRequired Needs: ${ticket.needs || "Rescue Boat, Clean Water, Dry Food"}\nContact Phone: ${ticket.contactInfo}\nSituation Details: ${ticket.rawText || "Urgent rescue assistance required."}`,
          urgency: ticket.urgency === "Critical" ? "Critical" : "High",
          emergencyMeta: {
            relatedType: "CrisisTicket",
            relatedId: ticket._id,
            zone: ticket.zone,
            location: ticket.location,
            peopleCount: ticket.peopleCount,
            needs: ticket.needs,
            contactNumber: ticket.contactInfo,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.conversation?._id) {
        showToast.success(
          data.isExisting
            ? "Opening active emergency rescue conversation..."
            : "SOS Request dispatched to Admin command queue."
        );
        navigate(`/messages?id=${data.conversation._id}`, {
          state: { conversationId: data.conversation._id },
        });
      } else {
        showAlert.error("Dispatch Failed", data.message || "Failed to start emergency chat.");
      }
    } catch (err) {
      console.error("Crisis chat dispatch error:", err);
      showAlert.error("Network Error", "Unable to connect to the emergency dispatch desk.");
    }
  };

  // ──────────────── LEDGER DONATION & EXPENSE HANDLERS ────────────────
  const handleSaveDonation = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/ledger/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donationForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowDonateModal(false);
        setDonationForm({
          donorName: "",
          donorPhone: "",
          amount: "",
          paymentMethod: "bKash",
          transactionId: "",
        });
        showAlert.success(
          "Thank you for your support!",
          `Your contribution of ৳${data.donation?.amount} has been added to the public relief ledger.`
        );
        loadData();
      } else {
        showAlert.error("Submission Failed", data.message || "Failed to record donation.");
      }
    } catch {
      showAlert.error("Network Error", "Could not submit donation record.");
    }
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!isAdmin && !isMember) {
      showAlert.error("Restricted", "Only authorized Members or Admins can record relief expenditures.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/ledger/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(expenseForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowExpenseModal(false);
        setExpenseForm({
          title: "",
          amount: "",
          category: "Food & Water",
          receiptImage: "",
          notes: "",
        });
        showAlert.success(
          "Expenditure Logged!",
          `Relief purchase of ৳${data.expense?.amount} verified and recorded on the public ledger.`
        );
        loadData();
      } else {
        showAlert.error("Operation Failed", data.message || "Failed to record expense.");
      }
    } catch {
      showAlert.error("Network Error", "Error recording expenditure.");
    }
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesZone = selectedZone === "All" || t.zone === selectedZone;
    const matchesStatus = selectedStatus === "All" || t.status === selectedStatus;
    const matchesUrgency = selectedUrgency === "All" || t.urgency === selectedUrgency;
    return matchesZone && matchesStatus && matchesUrgency;
  });

  const openTicketsCount = tickets.filter((t) => t.status === "Open").length;
  const inProgressTicketsCount = tickets.filter((t) => t.status === "In Progress").length;
  const resolvedTicketsCount = tickets.filter((t) => t.status === "Resolved").length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-24">
      {/* ──────────────── 1. HERO & EMERGENCY STATUS BANNER ──────────────── */}
      <section className="bg-gradient-to-b from-[#1c131a] via-[#2a1724] to-[#1a1218] text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-rose-900/40 shadow-xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              {/* Emergency High Priority Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold mb-3 backdrop-blur-xs">
                <span className="size-2 rounded-full bg-rose-400 animate-ping" />
                <span>Emergency Crisis & Disaster Hub</span>
                <span className="text-rose-400">·</span>
                <span className="text-white text-[11px] font-semibold">Sylhet Flood Relief Drive</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                <span>Crisis Command & Relief Hub</span>
                <AlertTriangle className="text-rose-500 fill-rose-500/20" size={32} />
              </h1>

              <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Coordinating rapid search and rescue operations, AI-parsed emergency SOS tickets, and 100% transparent public relief fund accounting for Metropolitan University and greater Sylhet.
              </p>
            </div>

            {/* Quick Emergency Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`tel:${systemSetting.emergencyHotline}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white text-rose-900 hover:bg-rose-50 px-4 py-2.5 text-xs font-black shadow-lg shadow-black/30 transition active:scale-95"
              >
                <Phone size={15} className="text-rose-600" />
                <span>Helpline: {systemSetting.emergencyHotline}</span>
              </a>

              <button
                type="button"
                onClick={() => handleTabChange("parser")}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 text-xs font-bold shadow-lg shadow-rose-950/40 transition active:scale-95"
              >
                <Sparkles size={15} />
                <span>Post SOS with AI</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDonateModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-lg shadow-emerald-950/40 transition"
              >
                <DollarSign size={15} />
                <span>Donate to Relief</span>
              </button>
            </div>
          </div>

          {/* KPI Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-rose-900/40">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 sm:p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1">
                <AlertTriangle size={12} /> Active SOS Tickets
              </p>
              <p className="text-2xl font-black text-white mt-1">{openTicketsCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{inProgressTicketsCount} Team Dispatched</p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 sm:p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                <CheckCircle2 size={12} /> Rescued & Resolved
              </p>
              <p className="text-2xl font-black text-white mt-1">{resolvedTicketsCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Verified Safe</p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 sm:p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                Total Relief Raised
              </p>
              <p className="text-2xl font-black text-white mt-1">৳{ledgerSummary.totalDonations.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{ledgerSummary.donationsCount} Contributors</p>
            </div>

            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 sm:p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                Available Relief Fund
              </p>
              <p className="text-2xl font-black text-emerald-300 mt-1">
                ৳{ledgerSummary.balance.toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-400/80 mt-0.5">
                ৳{ledgerSummary.totalExpenses.toLocaleString()} Deployed
              </p>
            </div>
          </div>

          {/* ──────────────── RIVER BASIN & ECO-DISASTER HAZARD WATCH (Theme: Environment & Responsible Living) ──────────────── */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-900/75 border border-teal-500/30 backdrop-blur-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 border border-teal-500/30">
                  <Waves size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-teal-400 animate-ping" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-teal-300">
                      River Basin & Eco-Hazard Watch (Sylhet Catchment)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    Environmental flood monitoring, river basin gauges & safe water hygiene advisory
                  </p>
                </div>
              </div>

              {/* Water Levels & Eco Alert */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10 text-slate-200">
                  <span className="text-slate-400 text-[10px]">Surma:</span>
                  <span className="font-bold text-amber-300">11.45m</span>
                  <span className="text-[9px] text-amber-400 font-semibold">(Warning: 10.80m)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10 text-slate-200">
                  <span className="text-slate-400 text-[10px]">Kushiyara:</span>
                  <span className="font-bold text-emerald-300">12.10m</span>
                  <span className="text-[9px] text-emerald-400 font-semibold">(Normal: 11.50m)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-teal-500/15 text-teal-300 px-2.5 py-1.5 rounded-xl border border-teal-500/30 text-[11px]">
                  <Droplets size={12} className="text-teal-300 shrink-0" />
                  <span>Eco-Hygiene: Boil water 10+ mins</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelplineModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs shrink-0"
                >
                  <PhoneCall size={12} />
                  <span>Civic Helplines</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── 2. MAIN NAVIGATION TABS ──────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleTabChange("sos")}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "sos"
                  ? "bg-rose-700 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <AlertTriangle size={14} className={activeTab === "sos" ? "text-white" : "text-rose-600"} />
              <span>Live SOS Rescue Board</span>
              <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-black">
                {tickets.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("parser")}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "parser"
                  ? "bg-[#173b69] text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Sparkles size={14} className={activeTab === "parser" ? "text-amber-300" : "text-blue-600"} />
              <span>AI SOS Parser Console</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("ledger")}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "ledger"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Receipt size={14} className={activeTab === "ledger" ? "text-white" : "text-emerald-600"} />
              <span>Public Relief Ledger</span>
              <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-black">
                ৳{ledgerSummary.balance.toLocaleString()}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition"
              title="Refresh live data"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ──────────────── TAB 1: LIVE SOS RESCUE BOARD ──────────────── */}
        {activeTab === "sos" && (
          <div className="space-y-5">
            {/* Flood Zone & Status Filter Strip */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-3 shadow-xs">
              {/* Zone Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="font-bold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
                  <Compass size={13} /> Sylhet Zone:
                </span>
                {ZONES.map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setSelectedZone(z)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition shrink-0 ${
                      selectedZone === z
                        ? "bg-slate-800 text-white"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>

              {/* Status and Urgency Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400 text-[11px]">Status:</span>
                  {["All", "Open", "In Progress", "Resolved"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStatus(st)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                        selectedStatus === st
                          ? "bg-rose-700 text-white"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400 text-[11px]">Urgency:</span>
                  {["All", "Critical", "High", "Moderate"].map((urg) => (
                    <button
                      key={urg}
                      type="button"
                      onClick={() => setSelectedUrgency(urg)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                        selectedUrgency === urg
                          ? "bg-slate-900 text-white"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {urg}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tickets Grid */}
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <div className="size-8 mx-auto border-2 border-rose-600 border-t-transparent rounded-full animate-spin mb-3" />
                Loading live disaster response tickets...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
                <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
                <h3 className="font-bold text-slate-700 text-sm">No Active Tickets Under Selected Filter</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  There are currently no rescue requests matching your criteria. Try changing the zone or status filter.
                </p>
                <button
                  type="button"
                  onClick={() => handleTabChange("parser")}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
                >
                  <Sparkles size={14} /> Submit a New SOS Ticket
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTickets.map((t) => (
                  <div
                    key={t._id}
                    className={`rounded-3xl border bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between ${
                      t.urgency === "Critical" && t.status === "Open"
                        ? "border-rose-300 ring-2 ring-rose-500/10"
                        : "border-slate-200"
                    }`}
                  >
                    <div>
                      {/* Card Header: Urgency & Status */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              t.urgency === "Critical"
                                ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                                : t.urgency === "High"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-blue-50 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {t.urgency}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                            {t.zone}
                          </span>
                        </div>

                        <div>
                          {t.status === "Open" ? (
                            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <span className="size-1.5 rounded-full bg-rose-600" />
                              <span>Open</span>
                            </span>
                          ) : t.status === "In Progress" ? (
                            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Clock size={11} className="text-amber-600" />
                              <span>Team Dispatched</span>
                            </span>
                          ) : (
                            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 size={11} className="text-emerald-600" />
                              <span>Rescued</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Location & Needs */}
                      <div className="mt-3.5 space-y-2.5 text-xs">
                        <div>
                          <div className="flex items-start gap-1.5 text-slate-800 font-bold">
                            <MapPin size={14} className="text-rose-500 mt-0.5 shrink-0" />
                            <span className="leading-snug">{t.location}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                          <span className="font-bold text-slate-500 flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                            <Users size={12} /> {t.peopleCount} {t.peopleCount > 1 ? "People" : "Person"} Stranded
                          </span>
                        </div>

                        {t.needs && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                              Required Assistance:
                            </span>
                            <p className="text-slate-700 font-semibold text-[11px] leading-relaxed">
                              {t.needs}
                            </p>
                          </div>
                        )}

                        {t.rawText && (
                          <p className="text-[11px] text-slate-500 italic line-clamp-2">
                            "{t.rawText}"
                          </p>
                        )}

                        {/* Field Updates Log */}
                        {t.fieldNotes && t.fieldNotes.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 space-y-1">
                            <span className="text-[10px] font-black uppercase text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 size={11} /> Latest Field Report:
                            </span>
                            <p className="text-[11px] text-slate-600 bg-emerald-50/70 border border-emerald-100 p-2 rounded-lg">
                              {t.fieldNotes[t.fieldNotes.length - 1].note}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <a
                          href={`tel:${t.contactInfo}`}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white py-2 text-xs font-bold transition shadow-xs truncate"
                        >
                          <Phone size={13} className="shrink-0" /> <span className="truncate">Call: {t.contactInfo}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleEmergencyChat(t)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#173b69] py-2 text-xs font-bold transition shadow-2xs truncate"
                          title="Start emergency live rescue coordination with dispatch admin"
                        >
                          <MessageSquare size={13} className="shrink-0" />
                          <span className="truncate">Live SOS Chat</span>
                        </button>
                      </div>

                      {/* Member & Admin Management Controls */}
                      {(isAdmin || isMember) && (
                        <div className="pt-1 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            {t.status === "Open" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateTicketStatus(t._id, "In Progress")}
                                className="flex-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 py-1.5 text-[11px] font-bold transition"
                              >
                                Dispatch Team
                              </button>
                            )}

                            {t.status === "In Progress" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateTicketStatus(t._id, "Resolved")}
                                className="flex-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-1.5 text-[11px] font-bold transition"
                              >
                                Mark Rescued
                              </button>
                            )}

                            {t.status === "Resolved" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateTicketStatus(t._id, "In Progress")}
                                className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 text-[11px] font-bold transition"
                              >
                                Reopen Ticket
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setShowFieldNoteModal(t._id);
                                setFieldNoteText("");
                              }}
                              className="rounded-xl px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 text-[11px] font-bold transition"
                              title="Add field update note"
                            >
                              + Note
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTicket(t._id)}
                                className="rounded-xl px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 py-1.5 text-[11px] font-bold transition"
                                title="Delete ticket"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────────────── TAB 2: AI SOS PARSER CONSOLE ──────────────── */}
        {activeTab === "parser" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-blue-700 text-xs font-black uppercase tracking-wider mb-1">
                  <Sparkles size={14} />
                  <span>Google Gemini Natural Language Processing</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Emergency SOS Parser Console
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  During floods or sudden crises, messages received on social media or SMS are often unstructured. Paste the raw message below in Bengali, Banglish, or English — our AI will extract location, contacts, and needs in milliseconds.
                </p>
              </div>

              {/* 1-Click Example Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400">Quick Test Examples:</span>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_MESSAGES.map((ex, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(ex.text)}
                      className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Raw Text Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Raw Emergency Message (Bengali / Banglish / English) *
                </label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="e.g. আমারা ৫ জন কোম্পানীগঞ্জ বাজার সংলগ্ন টিনের ছাদে আটকে আছি, চারদিকে পানি, খাবার ও পানি শেষ, দ্রুত বোট পাঠান কল 01712345678"
                  className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-600/10 leading-relaxed font-sans"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={parsing || !rawText.trim()}
                  onClick={handleParseSos}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#173b69] hover:bg-[#122e53] disabled:opacity-50 text-white px-5 py-2.5 text-xs font-bold shadow-xs transition"
                >
                  <Sparkles size={14} className={parsing ? "animate-spin" : ""} />
                  <span>{parsing ? "Parsing with AI..." : "Parse Message with AI"}</span>
                </button>
              </div>

              {/* Parsed Result & Submission Preview */}
              {parsedData && (
                <div className="mt-6 pt-6 border-t border-slate-200 space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 size={16} /> Structured SOS Output
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      Review & Confirm
                    </span>
                  </div>

                  <form onSubmit={handleSubmitParsedTicket} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Detected Location *
                        </label>
                        <input
                          type="text"
                          required
                          value={parsedData.location}
                          onChange={(e) =>
                            setParsedData({ ...parsedData, location: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-rose-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Sylhet Flood Zone *
                        </label>
                        <select
                          value={parsedData.zone || "Other"}
                          onChange={(e) =>
                            setParsedData({ ...parsedData, zone: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-rose-600 bg-white"
                        >
                          {ZONES.filter((z) => z !== "All").map((z) => (
                            <option key={z} value={z}>
                              {z}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Contact Phone Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={parsedData.contactInfo}
                          onChange={(e) =>
                            setParsedData({ ...parsedData, contactInfo: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-rose-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          People Stranded
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={parsedData.peopleCount || 1}
                          onChange={(e) =>
                            setParsedData({
                              ...parsedData,
                              peopleCount: Number(e.target.value) || 1,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-rose-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Urgency Level
                        </label>
                        <select
                          value={parsedData.urgency || "High"}
                          onChange={(e) =>
                            setParsedData({ ...parsedData, urgency: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-rose-600 bg-white"
                        >
                          <option value="Critical">Critical (Immediate danger)</option>
                          <option value="High">High (Food/Water shortage)</option>
                          <option value="Moderate">Moderate (Assistance needed)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Specific Needs Description
                      </label>
                      <input
                        type="text"
                        value={parsedData.needs}
                        onChange={(e) =>
                          setParsedData({ ...parsedData, needs: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-rose-600"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setParsedData(null)}
                        className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                      >
                        Reset
                      </button>

                      <button
                        type="submit"
                        disabled={submittingTicket}
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 text-xs font-bold shadow-xs transition"
                      >
                        <Send size={14} />
                        <span>{submittingTicket ? "Publishing..." : "Submit to Live Rescue Board"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────────── TAB 3: PUBLIC RELIEF LEDGER & TRANSPARENCY ──────────────── */}
        {activeTab === "ledger" && (
          <div className="space-y-6">
            {/* Top Balance Sheet Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Total Relief Donations
                </span>
                <p className="text-2xl font-black text-slate-800 mt-1">
                  ৳{ledgerSummary.totalDonations.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Raised from {ledgerSummary.donationsCount} verified community donors
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1">
                  <Receipt size={13} /> Total Relief Expenditures
                </span>
                <p className="text-2xl font-black text-slate-800 mt-1">
                  ৳{ledgerSummary.totalExpenses.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Across {ledgerSummary.expensesCount} audited field purchases
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <DollarSign size={13} /> Available Relief Fund Balance
                </span>
                <p className="text-2xl font-black text-emerald-900 mt-1">
                  ৳{ledgerSummary.balance.toLocaleString()}
                </p>
                <p className="text-xs text-emerald-700/80 mt-0.5">
                  100% Transparent Student-Led Accounting
                </p>
              </div>
            </div>

            {/* Sub-view Switcher & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLedgerView("expenses")}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                    ledgerView === "expenses"
                      ? "bg-slate-800 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Receipt size={13} />
                  <span>Itemized Expenses & Receipts ({expenses.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLedgerView("donations")}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                    ledgerView === "donations"
                      ? "bg-slate-800 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <DollarSign size={13} />
                  <span>Donation Feed ({donations.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDonateModal(true)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                >
                  <HeartHandshake size={14} />
                  <span>Donate to Relief</span>
                </button>

                {(isAdmin || isMember) && (
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(true)}
                    className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Record Expense</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sub-View 1: Itemized Expenses */}
            {ledgerView === "expenses" && (
              <div className="space-y-4">
                {expenses.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
                    <Receipt size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">No Expenses Recorded Yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expenses.map((exp) => (
                      <div
                        key={exp._id}
                        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <span className="rounded-lg bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 border border-blue-200">
                              {exp.category}
                            </span>
                            <span className="text-base font-black text-rose-700">
                              ৳{exp.amount.toLocaleString()}
                            </span>
                          </div>

                          <div className="mt-3 space-y-2">
                            <h4 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug">
                              {exp.title}
                            </h4>

                            {exp.notes && (
                              <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                {exp.notes}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                              <span>
                                Date: {new Date(exp.spentDate).toLocaleDateString()}
                              </span>
                              {exp.aiVerified && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <ShieldCheck size={11} /> AI Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {exp.receiptImage && (
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setShowReceiptPreview(exp.receiptImage)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Eye size={13} /> View Receipt Image
                            </button>
                            <span className="text-[10px] text-slate-400">
                              Confidence: {Math.round((exp.aiConfidenceScore || 0.95) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-View 2: Donations Feed */}
            {ledgerView === "donations" && (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-black text-slate-800">
                    Verified Relief Contributions
                  </h4>
                  <span className="text-xs text-slate-500">
                    Updated live as supporters donate
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Donor Name</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Transaction ID (TrxID)</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {donations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                            <DollarSign size={28} className="mx-auto text-slate-300 mb-1.5" />
                            <p className="font-bold text-slate-700">No Donations Recorded Yet</p>
                            <p className="text-[11px] mt-0.5">
                              Click "Donate to Relief" to submit the first contribution.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        donations.map((d) => (
                          <tr key={d._id} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-3 font-bold text-slate-800">
                              {d.donorName || "Anonymous Supporter"}
                            </td>
                            <td className="px-4 py-3 font-black text-emerald-700">
                              ৳{d.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                {d.paymentMethod}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                              {d.transactionId}
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-[11px]">
                              {new Date(d.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 w-max">
                                <CheckCircle2 size={10} /> Verified
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ──────────────── MODAL 1: DONATE TO RELIEF ──────────────── */}
      {showDonateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <HeartHandshake size={18} className="text-emerald-600" />
                <span>Contribute to Sylhet Flood Relief</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDonateModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDonation} className="p-6 space-y-4">
              {/* Payment Details Card */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs">
                <p className="font-bold text-slate-700">Official Campus Emergency Accounts:</p>
                <div className="space-y-1 text-[11px] text-slate-600 font-mono">
                  <p>• bKash (Merchant): <strong className="text-slate-900">01792345238</strong></p>
                  <p>• Nagad (Personal): <strong className="text-slate-900">01823673870</strong></p>
                  <p>• Bank: <strong className="text-slate-900">EBL 1022003344 (Metropolitan Fund)</strong></p>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  Send your contribution via your mobile app, then submit the TrxID below to update the public ledger.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Name (or Anonymous)</label>
                <input
                  type="text"
                  placeholder="e.g. Tanvir Ahmed (or leave blank for Anonymous)"
                  value={donationForm.donorName}
                  onChange={(e) => setDonationForm({ ...donationForm, donorName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (BDT ৳) *</label>
                  <input
                    type="number"
                    required
                    min="10"
                    placeholder="e.g. 1000"
                    value={donationForm.amount}
                    onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Method *</label>
                  <select
                    value={donationForm.paymentMethod}
                    onChange={(e) => setDonationForm({ ...donationForm, paymentMethod: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transaction ID (TrxID) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BK99882211"
                  value={donationForm.transactionId}
                  onChange={(e) => setDonationForm({ ...donationForm, transactionId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-600 font-mono uppercase"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDonateModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold shadow-xs transition"
                >
                  Submit Donation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL 2: RECORD EXPENSE (MEMBER/ADMIN) ──────────────── */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Receipt size={18} className="text-slate-700" />
                <span>Record Relief Expenditure</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expenditure Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bought 100 Packets Dry Food & Water"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (BDT ৳) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 15000"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-slate-700 bg-white"
                  >
                    <option value="Food & Water">Food & Water</option>
                    <option value="Medical Supplies">Medical Supplies</option>
                    <option value="Boat & Transport">Boat & Transport</option>
                    <option value="Shelter & Clothes">Shelter & Clothes</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Image URL (or Memo link)</label>
                <input
                  type="url"
                  placeholder="https://... (Receipt image for AI audit)"
                  value={expenseForm.receiptImage}
                  onChange={(e) => setExpenseForm({ ...expenseForm, receiptImage: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item Breakdown Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 50kg Chira, 20kg Gur, 100 saline packets"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-slate-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 text-xs font-bold shadow-xs transition"
                >
                  Save & Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL 3: RECEIPT IMAGE PREVIEW ──────────────── */}
      {showReceiptPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-600" /> Audited Purchase Receipt
              </span>
              <button
                type="button"
                onClick={() => setShowReceiptPreview(null)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-[70vh]">
              <img
                src={showReceiptPreview}
                alt="Receipt Memo"
                className="w-full h-auto object-contain max-h-[65vh]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL 4: ADD FIELD NOTE ──────────────── */}
      {showFieldNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600" /> Add Rescue Field Report
              </h4>
              <button
                type="button"
                onClick={() => setShowFieldNoteModal(null)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <textarea
              rows={3}
              placeholder="e.g. Volunteer team arrived at location with rescue trawler. Evacuation in progress."
              value={fieldNoteText}
              onChange={(e) => setFieldNoteText(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-600"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFieldNoteModal(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddFieldNote}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-xs"
              >
                Save Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── CIVIC SERVICES & LOCAL HELPLINES MODAL ──────────────── */}
      {showHelplineModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-[#173b69] text-white flex items-center justify-center shadow-xs">
                  <PhoneCall size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Civic Services & Emergency Helplines
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Verified local municipal and government disaster hotlines (Sylhet Division)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHelplineModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {[
                {
                  title: "Fire Service & Civil Defence",
                  loc: "Sylhet Sadar Station & Water Rescue",
                  phone: "16163",
                  icon: "🚒",
                  color: "bg-red-50 text-red-700 border-red-200",
                },
                {
                  title: "MAG Osmani Medical College Hospital",
                  loc: "Emergency Patient Ward & Blood Bank Desk",
                  phone: "01712456789",
                  icon: "🏥",
                  color: "bg-blue-50 text-blue-700 border-blue-200",
                },
                {
                  title: "Bangladesh Red Crescent Society",
                  loc: "Sylhet District Disaster Response Unit",
                  phone: "01711987654",
                  icon: "🚑",
                  color: "bg-rose-50 text-rose-700 border-rose-200",
                },
                {
                  title: "District Disaster Control Room",
                  loc: "Sylhet Deputy Commissioner (DC) Office",
                  phone: "01700700800",
                  icon: "🌊",
                  color: "bg-amber-50 text-amber-800 border-amber-200",
                },
                {
                  title: "Electricity & Power Emergency (PDB)",
                  loc: "Substation Waterlogging & Line Break Hotline",
                  phone: "16216",
                  icon: "⚡",
                  color: "bg-yellow-50 text-yellow-800 border-yellow-200",
                },
                {
                  title: "National Emergency Service (BD)",
                  loc: "Police, Ambulance & Rescue Command",
                  phone: "999",
                  icon: "🚨",
                  color: "bg-slate-100 text-slate-800 border-slate-200",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between gap-2 sm:gap-3 ${item.color}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{item.loc}</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${item.phone}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#173b69] hover:bg-[#122e53] text-white text-xs font-bold transition shadow-2xs shrink-0"
                  >
                    <Phone size={11} />
                    <span>Call {item.phone}</span>
                  </a>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 text-center">
              💡 <span className="font-semibold">Local Civic Solution:</span> UnityGrid directly coordinates volunteer trawlers & relief units in sync with these civic desks.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
