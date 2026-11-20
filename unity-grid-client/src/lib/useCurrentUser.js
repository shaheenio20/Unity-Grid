import { useEffect, useState } from "react";
import { authClient } from "./authClient";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const useCurrentUser = () => {
  const { data: session, isPending } = authClient.useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Fetch fresh user data from /api/me to guarantee real-time role accuracy
    fetch(`${API_BASE}/api/me`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(session.user);
        }
      })
      .catch(() => {
        setUser(session.user);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session, isPending]);

  const isAdmin = user?.role === "Admin";
  const isMember = user?.role === "Member" || user?.role === "Admin";

  return {
    session,
    user,
    role: user?.role || "Guest",
    isAdmin,
    isMember,
    loading: isPending || loading,
  };
};

