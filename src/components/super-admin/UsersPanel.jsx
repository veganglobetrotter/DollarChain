// src/components/super-admin/UsersPanel.jsx
import React, { useMemo, useState } from "react";

/**
 * Surgical upgrade:
 * - adds columns: Credits, Last login, Provider, Actions
 * - client-side search + pagination (non-invasive)
 * - lightweight admin actions: adjustCredits, toggleSuperAdmin, toggleActive
 * - uses dynamic supabase client import for auth token, fallback to localStorage
 *
 * Preserves props: users (array), loading (bool)
 */

export default function UsersPanel({ users = [], loading = false, pageSize = 25 }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [usersLocal, setUsersLocal] = useState(users || []);
  const [busyUserId, setBusyUserId] = useState(null);
  const [error, setError] = useState(null);

  // keep usersLocal in sync if parent passes new users (simple shallow sync)
  React.useEffect(() => {
    setUsersLocal(users || []);
    setPage(1);
  }, [users]);

  if (loading) return <p>Loading users…</p>;
  if (!usersLocal.length) return <p>No users found.</p>;

  // helper: prefer supabase client session, fallback to localStorage token
  async function getAuthHeader() {
    try {
      const mod = await import("../../lib/supabase");
      const supabase = mod.supabase || mod.default;
      if (supabase && supabase.auth && typeof supabase.auth.getSession === "function") {
        try {
          const { data } = await supabase.auth.getSession();
          const token = data?.session?.access_token;
          if (token) return { Authorization: `Bearer ${token}` };
        } catch (e) {
          // fall through
        }
      }
    } catch (e) {
      // dynamic import failed — fall back
    }

    try {
      const raw = localStorage.getItem("sb-ufwtjymkwlceqzckpnsb-auth-token");
      if (!raw) return {};
      try {
        const parsed = JSON.parse(raw);
        const token = parsed?.access_token || parsed?.accessToken || parsed;
        if (token) return { Authorization: `Bearer ${token}` };
      } catch (e) {
        return { Authorization: `Bearer ${raw}` };
      }
    } catch (e) {
      // ignore
    }
    return {};
  }

  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return usersLocal;
    return usersLocal.filter((u) => {
      const name = (u.full_name || u.metadata?.name || "").toLowerCase();
      const email = (u.email || u.metadata?.email || "").toLowerCase();
      const phone = (u.phone || u.metadata?.phone || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [usersLocal, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageIdx = Math.min(pageCount, Math.max(1, page));
  const visible = filtered.slice((pageIdx - 1) * pageSize, pageIdx * pageSize);

  function fmt(v) {
    if (v === null || typeof v === "undefined" || v === "") return "-";
    return v;
  }

  function fmtDate(ts) {
    if (!ts) return "-";
    try {
      const d = new Date(ts);
      return d.toLocaleString();
    } catch (e) {
      return String(ts);
    }
  }

  // generate an idempotency key: use crypto.randomUUID if available, fallback to a reasonably unique string
  function generateIdempotencyKey() {
    try {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
      }
    } catch (e) {
      // ignore
    }
    // fallback: timestamp + random
    return `key_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
  }

  async function adjustCredits(userId) {
    setError(null);
    const deltaRaw = window.prompt("Enter credit delta (positive to add, negative to subtract):\nExample: 10  OR -5");
    if (deltaRaw === null) return; // cancelled
    const delta = Number(deltaRaw);
    if (!Number.isFinite(delta)) {
      alert("Invalid number");
      return;
    }
    const reason = window.prompt("Reason for adjustment (short):", "Admin adjustment");
    if (reason === null) return;

    // generate idempotency key for this adjustment so retries won't double-apply
    const idempotencyKey = generateIdempotencyKey();
    console.log("[UsersPanel] adjustCredits idempotencyKey:", idempotencyKey);

    setBusyUserId(userId);
    try {
      const authHdr = await getAuthHeader();
      const res = await fetch(`/api/admin/users/${userId}/adjustCredits`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHdr || {}) },
        body: JSON.stringify({ delta, reason, idempotencyKey }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("adjustCredits failed", json);
        setError(json?.error || `adjustCredits failed: ${res.status}`);
        return;
      }

      // update local UI optimistically using returned new balance if present
      setUsersLocal((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, credits_balance: json?.credits_balance ?? (Number(u.credits_balance || 0) + delta) }
            : u
        )
      );
    } catch (err) {
      console.error("adjustCredits error", err);
      setError(String(err));
    } finally {
      setBusyUserId(null);
    }
  }

  async function toggleSuperAdmin(userId, current) {
    setError(null);
    const confirmMsg = current
      ? "Remove Super Admin rights for this user? This is reversible."
      : "Make this user a Super Admin? This grants full privileges.";
    if (!window.confirm(confirmMsg)) return;

    setBusyUserId(userId);
    try {
      const authHdr = await getAuthHeader();
      const res = await fetch(`/api/admin/users/${userId}/toggleSuperAdmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHdr || {}) },
        body: JSON.stringify({ is_super_admin: !current }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("toggleSuperAdmin failed", json);
        setError(json?.error || `toggleSuperAdmin failed: ${res.status}`);
        return;
      }
      setUsersLocal((prev) => prev.map((u) => (u.id === userId ? { ...u, is_super_admin: !!json?.is_super_admin ?? !current } : u)));
    } catch (err) {
      console.error("toggleSuperAdmin error", err);
      setError(String(err));
    } finally {
      setBusyUserId(null);
    }
  }

  async function toggleActive(userId, currentActive) {
    setError(null);
    const confirmMsg = currentActive ? "Deactivate this user?" : "Reactivate this user?";
    if (!window.confirm(confirmMsg)) return;

    setBusyUserId(userId);
    try {
      const authHdr = await getAuthHeader();
      const res = await fetch(`/api/admin/users/${userId}/toggleActive`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHdr || {}) },
        body: JSON.stringify({ active: !currentActive }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("toggleActive failed", json);
        setError(json?.error || `toggleActive failed: ${res.status}`);
        return;
      }
      setUsersLocal((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: !!json?.is_active ?? !currentActive } : u)));
    } catch (err) {
      console.error("toggleActive error", err);
      setError(String(err));
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div>
      <h2>Users</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <input
          placeholder="Search by name, email or phone"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          style={{ padding: "6px 8px", flex: 1 }}
        />
        <div>
          <small>Showing {filtered.length} results</small>
        </div>
      </div>

      {error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>ID</th>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Email</th>
            <th style={{ padding: 8 }}>Phone</th>
            <th style={{ padding: 8 }}>Provider</th>
            <th style={{ padding: 8 }}>Credits</th>
            <th style={{ padding: 8 }}>Last login</th>
            <th style={{ padding: 8 }}>Super Admin</th>
            <th style={{ padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((u) => (
            <tr key={u.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: 8, fontFamily: "monospace", fontSize: 12 }}>{fmt(u.id)}</td>
              <td style={{ padding: 8 }}>{fmt(u.full_name || u.metadata?.name)}</td>
              <td style={{ padding: 8 }}>{fmt(u.email || u.metadata?.email)}</td>
              <td style={{ padding: 8 }}>{fmt(u.phone || u.metadata?.phone)}</td>
              <td style={{ padding: 8 }}>{fmt(u.provider || u.metadata?.provider)}</td>
              <td style={{ padding: 8 }}>{fmt(u.credits_balance ?? u.credits ?? 0)}</td>
              <td style={{ padding: 8 }}>{fmtDate(u.last_sign_in || u.last_active)}</td>
              <td style={{ padding: 8 }}>{String(!!u.is_super_admin)}</td>
              <td style={{ padding: 8 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button disabled={busyUserId === u.id} onClick={() => adjustCredits(u.id)}>Adjust</button>
                  <button disabled={busyUserId === u.id} onClick={() => toggleSuperAdmin(u.id, !!u.is_super_admin)}>
                    {u.is_super_admin ? "Unmake" : "Make"}
                  </button>
                  <button disabled={busyUserId === u.id} onClick={() => toggleActive(u.id, !!u.is_active)}>
                    {u.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => setPage(1)} disabled={pageIdx === 1}>First</button>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageIdx === 1}>Prev</button>
        <span>Page {pageIdx} / {pageCount}</span>
        <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={pageIdx === pageCount}>Next</button>
        <button onClick={() => setPage(pageCount)} disabled={pageIdx === pageCount}>Last</button>
      </div>
    </div>
  );
}
