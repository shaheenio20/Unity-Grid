import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Swal from "sweetalert2";
import {
  MessageSquare,
  Send,
  PlusCircle,
  Clock,
  CheckCircle2,
  Droplet,
  Waves,
  Building2,
  HelpCircle,
  ArrowLeft,
  X,
  ListTodo,
  CheckSquare,
  Square,
  Sparkles,
  Inbox,
  Check,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useCurrentUser } from "../../../lib/useCurrentUser";
import { showToast, showAlert } from "../../../lib/alerts";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CATEGORIES = [
  {
    id: "Blood_Emergency",
    label: "Emergency Blood Request",
    desc: "Critical blood shortage, donor coordination, hospital emergency.",
    icon: Droplet,
    color: "bg-red-50 text-red-700 border-red-200",
    badge: "bg-red-100 text-red-800",
  },
  {
    id: "Flood_Crisis",
    label: "Flood & Disaster SOS",
    desc: "Rescue boat need, marooned family, food & emergency relief dispatch.",
    icon: Waves,
    color: "bg-rose-50 text-rose-700 border-rose-200",
    badge: "bg-rose-100 text-rose-800",
  },
  {
    id: "Club_Inquiry",
    label: "Club & Campus Activity",
    desc: "Event permissions, club registration, budget or venue assistance.",
    icon: Building2,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    badge: "bg-blue-100 text-blue-800",
  },
  {
    id: "General_Support",
    label: "General University Support",
    desc: "Student verification, account support, platform issues.",
    icon: HelpCircle,
    color: "bg-slate-50 text-slate-700 border-slate-200",
    badge: "bg-slate-100 text-slate-800",
  },
];

export default function MessagesPage() {
  const { user, isAdmin, loading: authLoading } = useCurrentUser();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Conversations state
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);

  // Filters & Counts
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState({
    pendingCount: 0,
    activeCount: 0,
    resolvedCount: 0,
    totalCount: 0,
  });

  // Chat message input
  const [inputText, setInputText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  // Modals & Panels
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showChecklistPanel, setShowChecklistPanel] = useState(false);
  const [newTaskInput, setNewTaskInput] = useState("");

  // New Request Form
  const [requestForm, setRequestForm] = useState({
    category: "General_Support",
    subject: "",
    initialMessage: "",
    urgency: "Medium",
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Mobile navigation view toggle
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Socket reference
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectedConversationRef = useRef(selectedConversation);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  // Initialize Socket.io connection once per authenticated user
  useEffect(() => {
    const socket = io(API_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      const myId = user?.id || user?._id;
      if (myId) {
        socket.emit("join_user", myId);
      }
      if (isAdmin) {
        socket.emit("join_admin");
      }
      if (selectedConversationRef.current?._id) {
        socket.emit("join_conversation", selectedConversationRef.current._id);
      }
    });

    // Real-time: New message received in room or personal alert
    socket.on("new_message", (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        if (selectedConversationRef.current?._id === newMsg.conversationId) {
          return [...prev, newMsg];
        }
        return prev;
      });

      // Update last message in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c._id === newMsg.conversationId
            ? {
              ...c,
              lastMessage: {
                text: newMsg.text,
                senderId: newMsg.senderId,
                senderName: newMsg.senderName,
                createdAt: newMsg.createdAt,
              },
            }
            : c
        )
      );
    });

    // Real-time: Request accepted
    socket.on("request_accepted", ({ conversation, systemNotice }) => {
      setConversations((prev) =>
        prev.map((c) => (c._id === conversation._id ? conversation : c))
      );
      if (selectedConversationRef.current?._id === conversation._id) {
        setSelectedConversation(conversation);
        if (systemNotice) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === systemNotice._id)) return prev;
            return [...prev, systemNotice];
          });
        }
      }
      showToast.success("Request accepted! Live coordination channel is now active.");
    });

    // Real-time: New support request submitted (for Admins)
    socket.on("new_support_request", ({ conversation }) => {
      if (isAdmin) {
        setConversations((prev) => [conversation, ...prev]);
        setCounts((prev) => ({
          ...prev,
          pendingCount: prev.pendingCount + 1,
          totalCount: prev.totalCount + 1,
        }));
        showToast.success(`New Support Request: ${conversation.subject}`);
      }
    });

    // Real-time: Checklist updated
    socket.on("checklist_updated", (updatedChecklist) => {
      setSelectedConversation((prev) =>
        prev ? { ...prev, actionChecklist: updatedChecklist } : prev
      );
      setConversations((prev) =>
        prev.map((c) =>
          c._id === selectedConversationRef.current?._id
            ? { ...c, actionChecklist: updatedChecklist }
            : c
        )
      );
    });

    // Real-time: Issue resolved
    socket.on("issue_resolved", ({ conversation, systemNotice }) => {
      setConversations((prev) =>
        prev.map((c) => (c._id === conversation._id ? conversation : c))
      );
      if (selectedConversationRef.current?._id === conversation._id) {
        setSelectedConversation(conversation);
        if (systemNotice) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === systemNotice._id)) return prev;
            return [...prev, systemNotice];
          });
        }
      }
      showToast.success("This issue has been marked as Resolved.");
    });

    // Real-time: Conversation deleted
    socket.on("conversation_deleted", ({ conversationId }) => {
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (selectedConversationRef.current?._id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
        setMobileShowChat(false);
      }
    });

    // Real-time: Typing indicator
    socket.on("user_typing", ({ conversationId, userName, userRole }) => {
      if (selectedConversationRef.current?._id === conversationId) {
        setTypingUser({ userName, userRole });
      }
    });

    socket.on("user_stop_typing", ({ conversationId }) => {
      if (selectedConversationRef.current?._id === conversationId) {
        setTypingUser(null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, user?._id, isAdmin]);

  // When selectedConversation changes, join its socket room
  useEffect(() => {
    if (socketRef.current && selectedConversation?._id) {
      socketRef.current.emit("join_conversation", selectedConversation._id);
    }
  }, [selectedConversation?._id]);

  // Smart polling sync for Active conversation messages (every 3 seconds)
  useEffect(() => {
    if (!selectedConversation?._id || selectedConversation.status !== "Active") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/messages/conversations/${selectedConversation._id}/messages`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setMessages((prev) => {
            if (data.messages.length !== prev.length) {
              return data.messages;
            }
            return prev;
          });
        }
      } catch {
        // silent fallback
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedConversation?._id, selectedConversation?.status]);

  // Auto-sync for Pending request (detects immediately when Admin clicks Accept)
  useEffect(() => {
    if (!selectedConversation?._id || selectedConversation.status !== "Pending") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/messages/conversations/${selectedConversation._id}/messages`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (data.success && data.conversation?.status === "Active") {
          setSelectedConversation(data.conversation);
          setMessages(data.messages || []);
          setConversations((prev) =>
            prev.map((c) =>
              c._id === data.conversation._id ? data.conversation : c
            )
          );
        }
      } catch {
        // silent
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedConversation?._id, selectedConversation?.status]);

  // Fetch Conversation List
  const fetchConversations = async () => {
    try {
      setLoadingList(true);
      const endpoint = isAdmin
        ? `${API_BASE}/api/messages/admin/queue${statusFilter !== "All" ? `?status=${statusFilter}` : ""
        }`
        : `${API_BASE}/api/messages/my-requests`;

      const res = await fetch(endpoint, { credentials: "include" });
      const data = await res.json();

      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
        if (isAdmin && data.counts) {
          setCounts(data.counts);
        }

        // Deep link auto-selection (from BloodBank or CrisisHub)
        const targetId = searchParams.get("id") || location.state?.conversationId;
        if (targetId) {
          const matched = data.conversations.find(
            (c) => String(c._id) === String(targetId)
          );
          if (matched) {
            loadConversation(matched);
            setMobileShowChat(true);
            return;
          }
        }

        // Auto-select first conversation ONLY on desktop/tablet (width >= 768)
        if (
          !selectedConversation &&
          data.conversations.length > 0 &&
          typeof window !== "undefined" &&
          window.innerWidth >= 768
        ) {
          loadConversation(data.conversations[0], false);
        }
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      showToast.error("Failed to load conversations");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, isAdmin, statusFilter]);

  // Load a single conversation messages
  const loadConversation = async (conv, showMobileChat = true) => {
    try {
      setSelectedConversation(conv);
      setLoadingChat(true);
      if (showMobileChat) {
        setMobileShowChat(true);
      }

      // Join socket room
      if (socketRef.current) {
        socketRef.current.emit("join_conversation", conv._id);
      }

      const res = await fetch(
        `${API_BASE}/api/messages/conversations/${conv._id}/messages`,
        { credentials: "include" }
      );
      const data = await res.json();

      if (data.success) {
        setMessages(data.messages || []);
        if (data.conversation) {
          setSelectedConversation(data.conversation);
        }
      } else {
        showToast.error(data.message || "Failed to load chat history");
      }
    } catch (err) {
      console.error("Error loading chat messages:", err);
      showToast.error("Error connecting to conversation");
    } finally {
      setLoadingChat(false);
    }
  };

  // Send a message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedConversation) return;

    const text = inputText.trim();
    setInputText("");

    // Emit stop typing
    if (socketRef.current) {
      socketRef.current.emit("stop_typing", {
        conversationId: selectedConversation._id,
      });
    }

    try {
      setSendingMessage(true);
      const res = await fetch(
        `${API_BASE}/api/messages/conversations/${selectedConversation._id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ text }),
        }
      );

      const data = await res.json();
      if (data.success && data.message) {
        // Instantly append to local messages state
        setMessages((prev) => {
          if (prev.some((m) => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });

        // Update last message in conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c._id === selectedConversation._id
              ? {
                ...c,
                lastMessage: {
                  text: data.message.text,
                  senderId: data.message.senderId,
                  senderName: data.message.senderName,
                  createdAt: data.message.createdAt,
                },
              }
              : c
          )
        );
      } else {
        showToast.error(data.message || "Could not deliver message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      showToast.error("Failed to send message. Please retry.");
    } finally {
      setSendingMessage(false);
    }
  };

  // Typing handler
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (socketRef.current && selectedConversation) {
      socketRef.current.emit("typing", {
        conversationId: selectedConversation._id,
        userName: user?.name || "Participant",
        userRole: user?.role || "Student",
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit("stop_typing", {
          conversationId: selectedConversation._id,
        });
      }, 2000);
    }
  };

  // Admin Accept Request
  const handleAcceptRequest = async (convId) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/messages/requests/${convId}/accept`,
        {
          method: "PUT",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.success && data.conversation) {
        showToast.success("Request accepted! Live channel is now open.");
        setSelectedConversation(data.conversation);
        setConversations((prev) =>
          prev.map((c) => (c._id === convId ? data.conversation : c))
        );
        // Immediately reload conversation messages & socket room
        loadConversation(data.conversation);
        fetchConversations();
      } else {
        showAlert.error("Failed to Accept", data.message);
      }
    } catch {
      showAlert.error("Error", "Could not accept request.");
    }
  };

  // Admin Decline Request
  const handleDeclineRequest = async (convId) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/messages/requests/${convId}/decline`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ note: "Request not feasible or out of scope." }),
        }
      );
      const data = await res.json();
      if (data.success) {
        showToast.success("Request marked as Declined.");
        setSelectedConversation(data.conversation);
        fetchConversations();
      }
    } catch {
      showAlert.error("Error", "Could not decline request.");
    }
  };

  // Admin Resolve Request
  const handleResolveIssue = async () => {
    if (!selectedConversation) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/messages/conversations/${selectedConversation._id}/resolve`,
        {
          method: "PUT",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.success) {
        showToast.success("Issue successfully resolved and closed!");
        setSelectedConversation(data.conversation);
        fetchConversations();
      }
    } catch {
      showAlert.error("Error", "Could not resolve issue.");
    }
  };

  // Admin Delete Conversation Permanently
  const handleDeleteConversation = async (convId) => {
    const result = await Swal.fire({
      title: "Delete Conversation?",
      text: "This will permanently remove this support ticket and all its messages from the database.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-3xl p-6 font-sans text-xs",
        title: "text-base font-black text-slate-800",
        confirmButton: "rounded-xl px-4 py-2 font-bold text-xs",
        cancelButton: "rounded-xl px-4 py-2 font-bold text-xs",
      },
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/messages/conversations/${convId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.success) {
        showToast.success("Conversation permanently deleted.");
        setConversations((prev) => prev.filter((c) => c._id !== convId));
        if (selectedConversation?._id === convId) {
          setSelectedConversation(null);
          setMessages([]);
          setMobileShowChat(false);
        }
        fetchConversations();
      } else {
        showAlert.error("Delete Failed", data.message);
      }
    } catch {
      showAlert.error("Error", "Could not delete conversation.");
    }
  };

  // Submit New Request
  const handleSubmitNewRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.subject.trim() || !requestForm.initialMessage.trim()) {
      showToast.error("Subject and detailed message are required.");
      return;
    }

    try {
      setSubmittingRequest(true);
      const res = await fetch(`${API_BASE}/api/messages/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestForm),
      });

      const data = await res.json();
      if (data.success) {
        showAlert.success(
          "Request Submitted",
          "Your request has been routed to Admin Dispatch. You will be notified once accepted."
        );
        setShowNewRequestModal(false);
        setRequestForm({
          category: "General_Support",
          subject: "",
          initialMessage: "",
          urgency: "Medium",
        });
        fetchConversations();
        if (data.conversation) {
          loadConversation(data.conversation);
        }
      } else {
        showAlert.error("Submission Failed", data.message);
      }
    } catch {
      showAlert.error("Error", "Unable to submit support request.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Action Checklist management
  const handleAddChecklistTask = async (e) => {
    e.preventDefault();
    if (!newTaskInput.trim() || !selectedConversation) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/messages/conversations/${selectedConversation._id}/checklist`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "add", task: newTaskInput.trim() }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setSelectedConversation((prev) => ({
          ...prev,
          actionChecklist: data.actionChecklist,
        }));
        setNewTaskInput("");
        showToast.success("Action step added to checklist!");
      }
    } catch {
      showToast.error("Failed to add task.");
    }
  };

  const handleToggleTask = async (taskId) => {
    if (!selectedConversation) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/messages/conversations/${selectedConversation._id}/checklist`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "toggle", taskId }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setSelectedConversation((prev) => ({
          ...prev,
          actionChecklist: data.actionChecklist,
        }));
      }
    } catch {
      showToast.error("Failed to update task.");
    }
  };

  // Helper: Category metadata
  const getCategoryMeta = (catId) => {
    return (
      CATEGORIES.find((c) => c.id === catId) || {
        label: "General Support",
        icon: HelpCircle,
        color: "bg-slate-50 text-slate-700 border-slate-200",
        badge: "bg-slate-100 text-slate-800",
      }
    );
  };

  // Filtered conversations by search query
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.subject?.toLowerCase().includes(q) ||
      c.requesterName?.toLowerCase().includes(q) ||
      c.initialMessage?.toLowerCase().includes(q)
    );
  });

  // Not Logged In View
  if (!authLoading && !user) {
    return (
      <main className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
          <div className="size-16 rounded-2xl bg-[#173b69]/10 text-[#173b69] flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={32} />
          </div>
          <h1 className="text-xl font-black text-slate-800">
            Messages & Admin Dispatch
          </h1>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Please sign in to request direct support, coordinate blood matches,
            or communicate with campus emergency admins.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-[#173b69] text-white text-xs font-bold hover:bg-[#122e53] transition shadow-xs"
            >
              Sign In to Continue
            </Link>
            <Link
              to="/register"
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
            >
              Create Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-[calc(100vh-68px)] max-h-[calc(100vh-68px)] max-[760px]:h-[calc(100vh-62px)] flex flex-col bg-slate-100 overflow-hidden w-full min-w-0">
      {/* ──────────────── TOP CONTROL BAR ──────────────── */}
      <div className="border-b border-slate-200 bg-white px-2.5 py-2 sm:px-6 sm:py-3 flex items-center justify-between shrink-0 shadow-xs gap-1.5 sm:gap-2 w-full min-w-0">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <div className="size-8 sm:size-10 rounded-xl bg-[#173b69] text-white flex items-center justify-center shadow-xs shrink-0">
            <MessageSquare size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-base font-black text-slate-900 truncate">
                {isAdmin ? "Admin Dispatch Desk" : "Support & Coordination"}
              </h1>
              {isAdmin && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block truncate">
              {isAdmin
                ? "Review pending message requests, activate live coordination, and guide student resolutions."
                : "Submit requests to central admin, receive action steps, and chat in real-time."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isAdmin && (
            <button
              onClick={() => setShowNewRequestModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#173b69] hover:bg-[#122e53] text-white text-xs font-bold transition shadow-xs shrink-0"
            >
              <PlusCircle size={13} />
              <span className="hidden sm:inline">New Request</span>
              <span className="sm:hidden">Request</span>
            </button>
          )}

          <button
            onClick={fetchConversations}
            title="Refresh queue"
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition shrink-0"
          >
            <RefreshCw size={14} className={loadingList ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ──────────────── MAIN WORKSPACE (SPLIT SCREEN) ──────────────── */}
      <div className="flex-1 flex overflow-hidden w-full min-w-0">
        {/* ──────── LEFT SIDEBAR: INBOX / REQUEST LIST ──────── */}
        <aside
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0 ${mobileShowChat ? "hidden md:flex" : "flex"
            }`}
        >
          {/* Admin Queue Counters / Filter Tabs */}
          {isAdmin ? (
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/60 rounded-xl text-[10px] font-black">
                {["All", "Pending", "Active", "Resolved"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`py-1.5 rounded-lg transition ${statusFilter === tab
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    {tab}
                    {tab === "Pending" && counts.pendingCount > 0 && (
                      <span className="ml-1 px-1 rounded-full bg-red-600 text-white text-[9px]">
                        {counts.pendingCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                My Support Threads
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {conversations.length} Requests
              </span>
            </div>
          )}

          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-100">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-2.5 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search subject or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 border-none text-xs text-slate-800 focus:ring-1 focus:ring-[#173b69] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Conversation List Stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingList ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-slate-300" />
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <Inbox size={32} className="mx-auto text-slate-300" />
                <p className="font-bold text-slate-600">No requests in this queue</p>
                <p className="text-[11px]">
                  {isAdmin
                    ? "Pending requests from students will arrive here in real-time."
                    : "You haven't submitted any support requests yet."}
                </p>
                {!isAdmin && (
                  <button
                    onClick={() => setShowNewRequestModal(true)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#173b69] text-white text-xs font-bold shadow-xs"
                  >
                    <PlusCircle size={13} />
                    Create First Request
                  </button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const meta = getCategoryMeta(conv.category);
                const IconComponent = meta.icon;
                const isSelected = selectedConversation?._id === conv._id;

                return (
                  <button
                    key={conv._id}
                    onClick={() => loadConversation(conv)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 relative ${isSelected
                      ? "bg-slate-100 border-l-4 border-[#173b69]"
                      : "hover:bg-slate-50/80 bg-white"
                      }`}
                  >
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center shrink-0 border ${meta.color}`}
                    >
                      <IconComponent size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-black text-slate-900 truncate flex-1">
                          {conv.subject}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase ${conv.status === "Pending"
                              ? "bg-amber-100 text-amber-800 animate-pulse"
                              : conv.status === "Active"
                                ? "bg-emerald-100 text-emerald-800"
                                : conv.status === "Resolved"
                                  ? "bg-slate-200 text-slate-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                          >
                            {conv.status}
                          </span>
                          {isAdmin && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(conv._id);
                              }}
                              title="Delete from database"
                              className="p-1 rounded-md text-slate-300 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mb-1">
                        {conv.lastMessage?.text || conv.initialMessage}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-600 truncate max-w-[120px]">
                          {conv.requesterName} ({conv.requesterRole})
                        </span>
                        <span>
                          {conv.updatedAt
                            ? new Date(conv.updatedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : ""}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ──────── RIGHT MAIN PANEL: LIVE CHAT & DISPATCH ACTIONS ──────── */}
        <section
          className={`flex-1 min-w-0 w-full flex flex-col bg-slate-50/50 overflow-hidden ${
            mobileShowChat ? "flex" : "hidden md:flex"
          }`}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-slate-200 bg-white p-2.5 sm:px-4 sm:py-3 shrink-0 shadow-2xs w-full min-w-0 overflow-hidden">
                {/* Row 1: Back Button + Subject Title + Status Badge */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
                    <button
                      onClick={() => setMobileShowChat(false)}
                      className="md:hidden p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 shrink-0"
                    >
                      <ArrowLeft size={15} />
                    </button>
                    <h2 className="text-xs sm:text-sm md:text-base font-black text-slate-900 truncate flex-1 min-w-0">
                      {selectedConversation.subject}
                    </h2>
                  </div>

                  {/* Status Badge - ALWAYS visible and never squeezed */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shrink-0 ml-1.5 ${
                      selectedConversation.status === "Pending"
                        ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                        : selectedConversation.status === "Active"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : selectedConversation.status === "Resolved"
                        ? "bg-slate-100 text-slate-700 border border-slate-200"
                        : "bg-red-100 text-red-700 border border-red-200"
                    }`}
                  >
                    {selectedConversation.status}
                  </span>
                </div>

                {/* Row 2: Subtitle + Action Buttons */}
                <div className="mt-1.5 sm:mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 pt-1.5 border-t border-slate-100 sm:border-none sm:pt-0 w-full min-w-0">
                  <p className="text-[10px] sm:text-[11px] text-slate-500 truncate w-full sm:w-auto sm:flex-1 min-w-0">
                    <span className="font-bold text-slate-700">{selectedConversation.requesterName}</span> ·{" "}
                    <span className="font-semibold text-slate-600">{selectedConversation.category.replace("_", " ")}</span> ·{" "}
                    <span className="text-slate-400">Urgency: {selectedConversation.urgency}</span>
                  </p>

                  {/* Action Buttons: Accept / Resolve / Delete / Checklist */}
                  <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-start sm:justify-end shrink-0">
                    {/* Action Checklist Toggle */}
                    <button
                      onClick={() => setShowChecklistPanel(!showChecklistPanel)}
                      title="Toggle Action Checklist"
                      className={`inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold border transition ${showChecklistPanel
                        ? "bg-[#173b69] text-white border-[#173b69]"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                      <ListTodo size={14} />
                      <span className="hidden sm:inline">Checklist</span>
                      {selectedConversation.actionChecklist?.length > 0 && (
                        <span
                          className={`size-4 rounded-full text-[9px] flex items-center justify-center font-bold ${showChecklistPanel
                            ? "bg-white text-[#173b69]"
                            : "bg-slate-100 text-slate-700"
                            }`}
                        >
                          {
                            selectedConversation.actionChecklist.filter(
                              (t) => t.completed
                            ).length
                          }
                          /{selectedConversation.actionChecklist.length}
                        </span>
                      )}
                    </button>

                    {/* Admin Accept Button (if Pending) */}
                    {isAdmin && selectedConversation.status === "Pending" && (
                      <button
                        onClick={() => handleAcceptRequest(selectedConversation._id)}
                        className="inline-flex items-center gap-1 px-3 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                      >
                        <Check size={14} />
                        <span>Accept</span>
                      </button>
                    )}

                    {/* Admin Resolve Button (if Active) */}
                    {isAdmin && selectedConversation.status === "Active" && (
                      <button
                        onClick={handleResolveIssue}
                        title="Mark as Resolved"
                        className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                      >
                        <CheckCircle2 size={14} />
                        <span>Resolve</span>
                      </button>
                    )}

                    {/* Admin Delete Button */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteConversation(selectedConversation._id)}
                        title="Delete ticket permanently from database"
                        className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Incident HUD Ribbon (Blood or Flood Crisis) */}
              {(selectedConversation.category === "Blood_Emergency" ||
                selectedConversation.category === "Flood_Crisis" ||
                selectedConversation.emergencyMeta?.relatedType) && (
                <div
                  className={`px-3 py-2 border-b text-xs shrink-0 w-full min-w-0 transition ${
                    selectedConversation.category === "Blood_Emergency"
                      ? "bg-red-50/90 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-950 dark:text-red-200"
                      : "bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50 text-blue-950 dark:text-blue-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                      {selectedConversation.category === "Blood_Emergency" ? (
                        <>
                          <span className="inline-flex items-center gap-1 font-black bg-red-600 text-white px-2 py-0.5 rounded-md text-[10px] tracking-wide uppercase shadow-2xs shrink-0">
                            <Droplet size={11} className="fill-white" />
                            Blood Alert
                          </span>
                          {selectedConversation.emergencyMeta?.bloodGroup && (
                            <span className="font-black bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs shrink-0 shadow-2xs">
                              🩸 {selectedConversation.emergencyMeta.bloodGroup}
                            </span>
                          )}
                          {selectedConversation.emergencyMeta?.hospital && (
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[200px] sm:max-w-none">
                              🏥 {selectedConversation.emergencyMeta.hospital}
                            </span>
                          )}
                          {selectedConversation.emergencyMeta?.unitsNeeded && (
                            <span className="text-slate-600 dark:text-slate-400 font-semibold text-xs shrink-0">
                              ({selectedConversation.emergencyMeta.unitsNeeded} Bag{selectedConversation.emergencyMeta.unitsNeeded > 1 ? "s" : ""})
                            </span>
                          )}
                          {selectedConversation.emergencyMeta?.contactNumber && (
                            <a
                              href={`tel:${selectedConversation.emergencyMeta.contactNumber}`}
                              className="font-mono text-red-700 dark:text-red-300 font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-900/50 text-xs shrink-0 hover:underline"
                            >
                              📞 {selectedConversation.emergencyMeta.contactNumber}
                            </a>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 font-black bg-[#173b69] dark:bg-blue-600 text-white px-2 py-0.5 rounded-md text-[10px] tracking-wide uppercase shadow-2xs shrink-0">
                            <Waves size={11} />
                            Flood SOS
                          </span>
                          {selectedConversation.emergencyMeta?.zone && (
                            <span className="font-black bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/50 text-[#173b69] dark:text-blue-300 text-xs shrink-0 shadow-2xs">
                              Zone: {selectedConversation.emergencyMeta.zone}
                            </span>
                          )}
                          {selectedConversation.emergencyMeta?.location && (
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[180px] sm:max-w-none">
                              📍 {selectedConversation.emergencyMeta.location}
                            </span>
                          )}
                          {selectedConversation.emergencyMeta?.peopleCount > 0 && (
                            <span className="text-blue-900 dark:text-blue-300 font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/50 text-xs shrink-0">
                              👥 {selectedConversation.emergencyMeta.peopleCount} Stranded
                            </span>
                          )}
                          {selectedConversation.emergencyMeta?.needs && (
                            <span className="text-blue-800 dark:text-blue-300 font-medium text-xs truncate max-w-full">
                              📦 {selectedConversation.emergencyMeta.needs}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {selectedConversation.emergencyMeta?.relatedType === "BloodRequest" && (
                      <Link
                        to="/blood"
                        className="text-xs font-bold text-red-700 dark:text-red-300 hover:underline inline-flex items-center gap-1 shrink-0 self-start sm:self-auto"
                      >
                        View Blood Bank &rarr;
                      </Link>
                    )}
                    {selectedConversation.emergencyMeta?.relatedType === "CrisisTicket" && (
                      <Link
                        to="/crisis"
                        className="text-xs font-bold text-blue-700 dark:text-blue-300 hover:underline inline-flex items-center gap-1 shrink-0 self-start sm:self-auto"
                      >
                        View Crisis Hub &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Action Checklist Drawer/Panel (when toggled) */}
              {showChecklistPanel && (
                <div className="border-b border-slate-200 bg-white p-4 shadow-sm animate-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                    <div className="flex items-center gap-2">
                      <ListTodo size={16} className="text-[#173b69]" />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Assigned Action Tasks ("Admin Guidelines")
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowChecklistPanel(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Task List */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedConversation.actionChecklist?.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2 text-center">
                        No action checklist tasks assigned yet.
                      </p>
                    ) : (
                      selectedConversation.actionChecklist?.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleToggleTask(task.id)}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${task.completed
                            ? "bg-emerald-50/60 border-emerald-200 text-emerald-800 line-through"
                            : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {task.completed ? (
                              <CheckSquare size={16} className="text-emerald-600 shrink-0" />
                            ) : (
                              <Square size={16} className="text-slate-400 shrink-0" />
                            )}
                            <span className="font-semibold">{task.task}</span>
                          </div>
                          {task.completed && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Done
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Admin Add Task Input */}
                  {isAdmin && selectedConversation.status === "Active" && (
                    <form
                      onSubmit={handleAddChecklistTask}
                      className="mt-3 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Assign a new action task (e.g. Go to Room 302, Collect Donor card)..."
                        value={newTaskInput}
                        onChange={(e) => setNewTaskInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-[#173b69] focus:outline-hidden"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 rounded-xl bg-[#173b69] hover:bg-[#122e53] text-white text-xs font-bold transition shrink-0"
                      >
                        Add Task
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* ──────── TICKET CONTENT AREA: PENDING BRIEFING vs ACTIVE CHATBOARD ──────── */}
              {selectedConversation.status === "Pending" ? (
                <div className="flex-1 overflow-y-auto p-3 sm:p-6 w-full min-w-0">
                  <div className="max-w-2xl w-full mx-auto space-y-4">
                    {/* Status Progress Stepper */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
                      <div className="grid grid-cols-3 gap-2 text-center relative">
                        {/* Step 1: Submitted */}
                        <div className="flex flex-col items-center">
                          <div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center font-bold text-xs mb-1.5 shadow-2xs">
                            <Check size={14} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            1. রিকোয়েস্ট জমা
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            সম্পন্ন
                          </span>
                        </div>

                        {/* Step 2: Under Review */}
                        <div className="flex flex-col items-center">
                          <div className="size-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center justify-center font-bold text-xs mb-1.5 shadow-2xs animate-pulse">
                            <Clock size={14} />
                          </div>
                          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
                            2. পর্যালোচনায়
                          </span>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold animate-pulse">
                            চলমান
                          </span>
                        </div>

                        {/* Step 3: Live Dispatch */}
                        <div className="flex flex-col items-center opacity-70">
                          <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs mb-1.5 shadow-2xs">
                            <MessageSquare size={13} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            3. লাইভ চ্যাট
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            অ্যাক্টিভেশনের অপেক্ষায়
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ticket Details Container */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs sm:shadow-sm space-y-4">
                      {/* Header Details */}
                      <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
                          <Clock size={12} />
                          Pending Admin Review
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-2">
                          {selectedConversation.subject}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Submitted by <span className="font-bold text-slate-700 dark:text-slate-300">{selectedConversation.requesterName}</span> ({selectedConversation.requesterRole}) · {new Date(selectedConversation.createdAt).toLocaleString()}
                        </p>
                      </div>

                      {/* Submitted Problem Description Card */}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                          Submitted Problem Description
                        </span>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                          {selectedConversation.initialMessage}
                        </div>
                      </div>

                      {/* Metadata summary */}
                      <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block">Category</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{selectedConversation.category.replace("_", " ")}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block">Urgency Level</span>
                          <span className={`font-bold ${selectedConversation.urgency === 'Critical' ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {selectedConversation.urgency}
                          </span>
                        </div>
                      </div>

                      {/* Emergency Meta Details if linked */}
                      {selectedConversation.emergencyMeta?.relatedType && (
                        <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs space-y-2">
                          <span className="text-[10px] font-black uppercase text-red-700 dark:text-red-400 tracking-wider flex items-center gap-1.5">
                            <Droplet size={12} className="text-red-600 dark:text-red-400" />
                            Emergency Dispatch Details
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-slate-800 dark:text-slate-200">
                            {selectedConversation.emergencyMeta.bloodGroup && (
                              <div>
                                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Blood Group</span>
                                <span className="font-black text-red-600 dark:text-red-400 text-sm">{selectedConversation.emergencyMeta.bloodGroup}</span>
                              </div>
                            )}
                            {selectedConversation.emergencyMeta.hospital && (
                              <div>
                                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Hospital</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedConversation.emergencyMeta.hospital}</span>
                              </div>
                            )}
                            {selectedConversation.emergencyMeta.unitsNeeded && (
                              <div>
                                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Units Needed</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedConversation.emergencyMeta.unitsNeeded} Bag(s)</span>
                              </div>
                            )}
                            {selectedConversation.emergencyMeta.contactNumber && (
                              <div>
                                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Contact Phone</span>
                                <span className="font-bold font-mono text-red-700 dark:text-red-400">{selectedConversation.emergencyMeta.contactNumber}</span>
                              </div>
                            )}
                            {selectedConversation.emergencyMeta.zone && (
                              <div>
                                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Flood Zone</span>
                                <span className="font-black text-[#173b69] dark:text-blue-400">{selectedConversation.emergencyMeta.zone}</span>
                              </div>
                            )}
                            {selectedConversation.emergencyMeta.location && (
                              <div>
                                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Specific Location</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedConversation.emergencyMeta.location}</span>
                              </div>
                            )}
                            {selectedConversation.emergencyMeta.peopleCount > 0 && (
                              <div>
                                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Stranded Count</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedConversation.emergencyMeta.peopleCount} People</span>
                              </div>
                            )}
                            {selectedConversation.emergencyMeta.needs && (
                              <div className="col-span-2">
                                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Emergency Needs</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedConversation.emergencyMeta.needs}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Admin Action Box vs Student Waiting Box */}
                      {isAdmin ? (
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
                          <p className="text-xs text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed">
                            স্টুডেন্টের সমস্যা পর্যালোচনা করুন। আপনি <b>"Accept Request & Open Chatboard"</b> বাটনে ক্লিক করার পরই এটি লাইভ চ্যাটবোর্ডে ট্রান্সফার হবে এবং উভয় পক্ষ সরাসরি মেসেজ আদান-প্রদান করতে পারবে।
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleAcceptRequest(selectedConversation._id)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                            >
                              <Check size={14} />
                              Accept Request & Open Chatboard
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(selectedConversation._id)}
                              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-3">
                          <div className="flex items-center gap-2.5">
                            <div className="size-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                              <Clock size={18} className="animate-pulse" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                অ্যাডমিন পর্যালোচনার অপেক্ষায় আছে
                              </p>
                              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                                আপনার রিকোয়েস্টটি সেন্ট্রাল অ্যাডমিন টিমে জমা হয়েছে। দ্রুত অ্যাক্সেপ্ট করে চ্যাটবক্স উন্মুক্ত করা হবে।
                              </p>
                            </div>
                          </div>

                          {/* Quick Emergency Assistance While Waiting */}
                          <div className="pt-2.5 border-t border-amber-200/60 dark:border-amber-800/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="text-[11px] text-amber-900 dark:text-amber-300 flex items-center gap-1">
                              <span>🚨 জরুরি উদ্ধার প্রয়োজন?</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href="tel:999"
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 transition"
                              >
                                📞 999
                              </a>
                              <a
                                href="tel:01712409199"
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#173b69] dark:bg-blue-600 text-white text-[11px] font-bold transition"
                              >
                                📞 কন্ট্রোল রুম
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ──────── LIVE CHATBOARD STREAM (Active / Resolved) ──────── */
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {loadingChat ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-slate-300" />
                      Loading message history...
                    </div>
                  ) : (
                    messages.map((msg) => {
                      if (msg.isSystemNotice) {
                        return (
                          <div
                            key={msg._id}
                            className="flex justify-center my-3"
                          >
                            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold">
                              <Sparkles size={12} className="text-[#173b69]" />
                              <span>{msg.text}</span>
                            </div>
                          </div>
                        );
                      }

                      const isMe =
                        String(msg.senderId) === String(user?.id || user?._id);

                      return (
                        <div
                          key={msg._id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"
                            }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                            <span className="font-bold text-slate-700">
                              {isMe ? "You" : msg.senderName}
                            </span>
                            <span>·</span>
                            <span className="uppercase text-[9px] font-black px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {msg.senderRole}
                            </span>
                            <span>·</span>
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div
                            className={`max-w-[85%] sm:max-w-lg p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${isMe
                              ? "bg-[#173b69] text-white rounded-tr-none shadow-xs"
                              : "bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs"
                              }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Live Typing indicator */}
                  {typingUser && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1 animate-pulse">
                      <span className="size-2 rounded-full bg-slate-400" />
                      <span>
                        {typingUser.userName} ({typingUser.userRole}) is typing...
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Input Bar */}
              <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
                {selectedConversation.status === "Active" ? (
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-2 max-w-4xl mx-auto"
                  >
                    <input
                      type="text"
                      placeholder="Type your message or reply (press Enter to send)..."
                      value={inputText}
                      onChange={handleInputChange}
                      disabled={sendingMessage}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 border-none text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-[#173b69] focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || sendingMessage}
                      className="size-10 rounded-xl bg-[#173b69] hover:bg-[#122e53] text-white flex items-center justify-center transition shadow-xs disabled:opacity-50 shrink-0"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                ) : (
                  <div className="text-center text-xs text-slate-500 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl max-w-4xl mx-auto px-3">
                    {selectedConversation.status === "Pending" ? (
                      isAdmin ? (
                        <p className="text-[11px] font-bold text-amber-800">
                          ⚠️ রিপ্লাই দেওয়ার জন্য অনুগ্রহ করে উপরে{" "}
                          <span className="text-emerald-700 underline font-black">
                            "Accept"
                          </span>{" "}
                          বাটনে ক্লিক করুন।
                        </p>
                      ) : (
                        <p className="text-[11px] font-bold text-amber-800">
                          ⏳ আপনার রিকোয়েস্টটি অ্যাডমিন পর্যালোচনার অপেক্ষায় আছে (Pending)।
                        </p>
                      )
                    ) : selectedConversation.status === "Resolved" ? (
                      <p className="text-[11px] font-bold text-slate-600">
                        ✅ এই সমস্যার সমাধান হয়ে যাওয়ায় কথোপকথনটি বন্ধ (Resolved) করা হয়েছে।
                      </p>
                    ) : (
                      <p className="text-[11px] font-bold text-red-700">
                        ❌ এই রিকোয়েস্টটি বাতিল (Declined) করা হয়েছে।
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="size-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs mb-3 text-slate-300">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-base font-black text-slate-700">
                Select a Support Conversation
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Pick a request from the left list to review details, direct action tasks, or chat in real-time.
              </p>
            </div>
          )
          }
        </section >
      </div >

      {/* ──────────────── NEW REQUEST MODAL ──────────────── */}
      {
        showNewRequestModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-[#173b69] text-white flex items-center justify-center">
                    <PlusCircle size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Create New Support Request
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Submit your issue for central admin triage & guidance
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewRequestModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitNewRequest} className="mt-4 space-y-4">
                {/* Category Picker */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1.5">
                    Select Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((cat) => {
                      const CatIcon = cat.icon;
                      const isSelected = requestForm.category === cat.id;
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() =>
                            setRequestForm({ ...requestForm, category: cat.id })
                          }
                          className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${isSelected
                            ? "bg-[#173b69] text-white border-[#173b69] shadow-xs"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                            }`}
                        >
                          <CatIcon size={16} className="shrink-0" />
                          <span className="text-xs font-bold truncate">
                            {cat.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Urgency Level
                  </label>
                  <select
                    value={requestForm.urgency}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, urgency: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-[#173b69] focus:outline-hidden"
                  >
                    <option value="Low">Low - General query</option>
                    <option value="Medium">Medium - Regular priority</option>
                    <option value="High">High - Urgent campus concern</option>
                    <option value="Critical">Critical - Immediate Emergency (Blood/Disaster)</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Subject / Summary
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Urgent O+ blood coordinator assistance needed"
                    value={requestForm.subject}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, subject: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-1 focus:ring-[#173b69] focus:outline-hidden"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Detailed Description of Problem
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Explain what happened, your location or contact number, and what help is required from admin..."
                    value={requestForm.initialMessage}
                    onChange={(e) =>
                      setRequestForm({
                        ...requestForm,
                        initialMessage: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-1 focus:ring-[#173b69] focus:outline-hidden resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewRequestModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="px-5 py-2 rounded-xl bg-[#173b69] hover:bg-[#122e53] text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                  >
                    {submittingRequest ? "Submitting..." : "Send to Admin"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </main >
  );
}
