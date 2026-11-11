
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type MembershipRequest = {
  user_id: string;
  email: string;
  anonymous_alias: string;
  status: string;
  created_at: string;
};

export default function AdminDashboard() {
  const router = useRouter();

  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!supabase) {
      setMessage("Supabase is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/");
        return;
      }

      // The database checks whether the logged-in user is an admin.
      const { data, error } = await supabase.rpc(
        "admin_list_membership_requests"
      );

      if (error) {
        throw error;
      }

      setRequests((data || []) as MembershipRequest[]);
      setIsAdmin(true);

    } catch (error) {
      setIsAdmin(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load administrator dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function reviewRequest(
    userId: string,
    status: "approved" | "rejected"
  ) {
    if (!supabase) return;

    const action = status === "approved" ? "approve" : "reject";

    if (!window.confirm(`Are you sure you want to ${action} this member?`)) {
      return;
    }

    setWorkingId(userId);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "admin_review_membership_request",
        {
          p_user_id: userId,
          p_status: status
        }
      );

      if (error) throw error;

      setMessage(
        status === "approved"
          ? "Member approved successfully."
          : "Membership request rejected."
      );

      await loadRequests();

    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update membership."
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function signOut() {
    if (!supabase) return;

    await supabase.auth.signOut();
    router.replace("/");
  }

  const pending = requests.filter(
    request => request.status === "pending"
  );

  const approved = requests.filter(
    request => request.status === "approved"
  );

  if (loading) {
    return (
      <main style={{ padding: 30 }}>
        Loading administrator dashboard...
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <h1>Administrator access denied</h1>
          <p>{message}</p>
          <button onClick={() => router.replace("/")}>
            Return to homepage
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={{ margin: 0 }}>Anonymous Hub</h1>
          <p style={styles.muted}>Administrator Dashboard</p>
        </div>

        <button style={styles.secondary} onClick={signOut}>
          Sign out
        </button>
      </header>

      <section style={styles.stats}>
        <div style={styles.statCard}>
          <h2>{pending.length}</h2>
          <p>Pending requests</p>
        </div>

        <div style={styles.statCard}>
          <h2>{approved.length}</h2>
          <p>Approved members</p>
        </div>

        <div style={styles.statCard}>
          <h2>{requests.length}</h2>
          <p>Total requests</p>
        </div>
      </section>

      {message && (
        <div role="status" style={styles.notice}>
          {message}
        </div>
      )}

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <h2>Membership requests</h2>

          <button
            style={styles.secondary}
            onClick={loadRequests}
          >
            Refresh
          </button>
        </div>

        {pending.length === 0 ? (
          <p style={styles.muted}>
            There are no pending membership requests.
          </p>
        ) : (
          pending.map(request => (
            <article key={request.user_id} style={styles.member}>
              <div>
                <h3>{request.anonymous_alias}</h3>
                <p>{request.email}</p>
                <small style={styles.muted}>
                  {new Date(request.created_at).toLocaleString()}
                </small>
                <p style={{ color: "#d69e36" }}>
                  Pending approval
                </p>
              </div>

              <div style={styles.actions}>
                <button
                  style={styles.approve}
                  disabled={workingId === request.user_id}
                  onClick={() =>
                    reviewRequest(request.user_id, "approved")
                  }
                >
                  {workingId === request.user_id
                    ? "Working..."
                    : "Approve"}
                </button>

                <button
                  style={styles.reject}
                  disabled={workingId === request.user_id}
                  onClick={() =>
                    reviewRequest(request.user_id, "rejected")
                  }
                >
                  Reject
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      <section style={styles.card}>
        <h2>Approved members</h2>

        {approved.length === 0 ? (
          <p style={styles.muted}>No approved members yet.</p>
        ) : (
          approved.map(request => (
            <div key={request.user_id} style={styles.member}>
              <div>
                <strong>{request.anonymous_alias}</strong>
                <p>{request.email}</p>
              </div>
              <span style={{ color: "#20c997" }}>Approved</span>
            </div>
          ))
        )}
      </section>

      <footer style={styles.footer}>
        Anonymous Hub Administration © 2026
      </footer>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#080e18",
    color: "#f4f7fb",
    padding: "24px 16px",
    fontFamily: "Arial, sans-serif"
  },
  header: {
    maxWidth: 1000,
    margin: "0 auto 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  muted: {
    color: "#a5b1c2"
  },
  stats: {
    maxWidth: 1000,
    margin: "0 auto 20px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: 12
  },
  statCard: {
    background: "#101a29",
    padding: 18,
    borderRadius: 12,
    border: "1px solid #26364b"
  },
  card: {
    maxWidth: 1000,
    margin: "0 auto 20px",
    padding: 22,
    background: "#101a29",
    border: "1px solid #26364b",
    borderRadius: 14
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  member: {
    padding: "18px 0",
    borderTop: "1px solid #26364b",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    flexWrap: "wrap"
  },
  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap"
  },
  approve: {
    background: "#20c997",
    color: "#06251e",
    border: 0,
    borderRadius: 8,
    padding: "11px 16px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  reject: {
    background: "#7f2935",
    color: "white",
    border: 0,
    borderRadius: 8,
    padding: "11px 16px",
    cursor: "pointer"
  },
  secondary: {
    background: "#182538",
    color: "white",
    border: "1px solid #26364b",
    borderRadius: 8,
    padding: "11px 15px",
    cursor: "pointer"
  },
  notice: {
    maxWidth: 1000,
    margin: "0 auto 20px",
    padding: 14,
    background: "#182538",
    borderRadius: 8
  },
  footer: {
    textAlign: "center",
    color: "#a5b1c2",
    padding: 30
  }
};
