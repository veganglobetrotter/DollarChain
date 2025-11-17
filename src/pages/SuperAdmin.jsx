// src/pages/SuperAdmin.jsx
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { supabase } from "../lib/supabase";
import Sidebar from "../components/super-admin/Sidebar";
import UsersPanel from "../components/super-admin/UsersPanel";
import SettingsPanel from "../components/super-admin/SettingsPanel";
import PostsPanel from "../components/super-admin/PostsPanel";
import EarningsPanel from "../components/super-admin/EarningsPanel";

export default function SuperAdmin() {
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState("Users");

  // sessionToken comes from supabase client session (null if not signed in)
  const [sessionToken, setSessionToken] = useState(null);

  // server-side paging state
  const [serverPage, setServerPage] = useState(1);
  const [serverLimit, setServerLimit] = useState(25);
  const [serverTotal, setServerTotal] = useState(undefined);

  // Debug flag: set window marker so we can confirm mount from Console quickly.
  useEffect(() => {
    window.__SUPERADMIN_COMPONENT__ = window.__SUPERADMIN_COMPONENT__ || {};
    window.__SUPERADMIN_COMPONENT__.mounted = true;
    // also set attribute for DOM inspection
    document.documentElement.setAttribute("data-superadmin-mounted", "1");
    console.log("[SuperAdmin] component registered (debug marker set).");

    return () => {
      window.__SUPERADMIN_COMPONENT__.mounted = false;
      document.documentElement.removeAttribute("data-superadmin-mounted");
      console.log("[SuperAdmin] component unmounted.");
    };
  }, []);

  // Log sessionToken changes for debugging
  useEffect(() => {
    console.log("[SuperAdmin] sessionToken changed:", sessionToken ? `${sessionToken.slice(0,24)}…` : null);
    window.__SUPERADMIN_COMPONENT__ = window.__SUPERADMIN_COMPONENT__ || {};
    window.__SUPERADMIN_COMPONENT__.sessionToken = sessionToken || null;
  }, [sessionToken]);

  // Read current Supabase session token once on mount (will re-run if auth changes externally)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token ?? null;
        if (!mounted) return;
        setSessionToken(token);
        console.log("[SuperAdmin] initial supabase.getSession token present:", !!token);
      } catch (err) {
        console.warn("Could not read supabase session token:", err);
        if (mounted) setSessionToken(null);
      }
    })();

    // subscribe to auth changes so token updates if user signs in/out in-app
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const t = session?.access_token ?? null;
      setSessionToken(t);
      console.log("[SuperAdmin] onAuthStateChange -> token present?", !!t);
    });

    return () => {
      mounted = false;
      try {
        listener?.subscription?.unsubscribe?.();
      } catch (e) {
        // ignore unsubscribe errors
      }
    };
  }, []);

  // Load settings (public). Stays the same.
  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const s = await fetch(`/api/admin/settings`, { cache: "no-store" });
        const sJson = await s.json();
        if (!mounted) return;
        setSettings(sJson.settings || {});
        console.log("[SuperAdmin] fetched settings:", Object.keys(sJson.settings || {}));
      } catch (err) {
        console.error("SuperAdmin loadSettings error:", err);
        if (mounted) setSettings({});
      }
    }

    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  // Load users (server-side paging). Runs on mount and whenever sessionToken, serverPage, serverLimit, or activePanel changes.
  useEffect(() => {
    let mounted = true;

    async function loadUsers() {
      // Only fetch users when Users panel is active
      if (activePanel !== "Users") return;

      setLoading(true);
      try {
        console.log("[SuperAdmin] loading users (serverPage,serverLimit):", serverPage, serverLimit, "token?", !!sessionToken);

        const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
        const q = `?page=${encodeURIComponent(serverPage)}&limit=${encodeURIComponent(serverLimit)}`;
        const res = await fetch(`/api/admin/users${q}`, {
          headers,
          cache: "no-store",
        });

        if (!mounted) return;

        if (res.ok) {
          const json = await res.json();
          setUsers(json.users || []);
          setServerTotal(typeof json.total === "number" ? json.total : undefined);
          console.log("[SuperAdmin] fetched users count:", (json.users || []).length, "total:", json.total);
        } else {
          const txt = await res.text().catch(() => "");
          console.warn("[SuperAdmin] users fetch not ok:", res.status, txt);
          setUsers([]);
          setServerTotal(undefined);
        }
      } catch (err) {
        console.error("SuperAdmin loadUsers error:", err);
        if (mounted) {
          setUsers([]);
          setServerTotal(undefined);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUsers();
    return () => {
      mounted = false;
    };
  }, [sessionToken, serverPage, serverLimit, activePanel]);

  // NOTE: surgical change here:
  // - toggleShow7Day now accepts an optional `next` boolean and only updates local state.
  // - the SettingsPanel component performs the actual API POST; this avoids duplicate writes.
  async function toggleShow7Day(next) {
    try {
      const newVal = typeof next === "boolean" ? next : !(settings?.["charts.show7DayMA"] || false);
      setSettings((prev) => ({ ...prev, ["charts.show7DayMA"]: newVal }));
      console.log("[SuperAdmin] updated local charts.show7DayMA ->", newVal);
    } catch (err) {
      console.error("toggleShow7Day update error:", err);
    }
  }

  // determine which panel component to render
  let PanelComponent;
  switch (activePanel) {
    case "Users":
      PanelComponent = () => (
        <UsersPanel
          users={users}
          loading={loading}
          pageSize={serverLimit}
        />
      );
      break;
    case "Settings":
      PanelComponent = () => (
        <SettingsPanel settings={settings} toggleShow7Day={toggleShow7Day} />
      );
      break;
    case "Posts":
      PanelComponent = PostsPanel;
      break;
    case "Earnings":
      PanelComponent = EarningsPanel;
      break;
    default:
      PanelComponent = () => <div>Unknown Panel</div>;
  }

  // Minimal render, unchanged visually — but now includes simple server-side paging controls for Users
  return (
    <div className="admin-page" style={{ display: "flex" }} data-superadmin-active={activePanel}>
      <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} />

      <div style={{ flex: 1, padding: "1rem" }}>
        <div style={{ marginBottom: 12, display: activePanel === "Users" ? "flex" : "none", gap: 8, alignItems: "center" }}>
          {/* Only show server-side paging controls when Users panel is active */}
          <div>
            <button onClick={() => setServerPage(1)} disabled={serverPage === 1}>First</button>
            <button onClick={() => setServerPage((p) => Math.max(1, p - 1))} disabled={serverPage === 1}>Prev</button>
            <span style={{ margin: "0 8px" }}>Page {serverPage}{serverTotal ? ` / ${Math.max(1, Math.ceil(serverTotal / serverLimit))}` : ""}</span>
            <button onClick={() => setServerPage((p) => p + 1)} disabled={serverTotal && serverPage >= Math.ceil(serverTotal / serverLimit)}>Next</button>
            <button onClick={() => setServerPage((p) => Math.max(1, Math.ceil((serverTotal || 1) / serverLimit)))} disabled={serverTotal && serverPage >= Math.ceil(serverTotal / serverLimit)}>Last</button>
          </div>

          <div style={{ marginLeft: "auto" }}>
            <label>
              Page size:
              <select value={serverLimit} onChange={(e) => { setServerLimit(Number(e.target.value)); setServerPage(1); }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>
        </div>

        <PanelComponent />
      </div>
    </div>
  );
}
