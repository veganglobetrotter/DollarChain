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

  // Load settings (public) and users (requires token). Runs initially (sessionToken null)
  // and again if sessionToken changes (so users list can load after login).
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        console.log("[SuperAdmin] loading settings + users (sessionToken present?)", !!sessionToken);

        // public settings (no auth required)
        const s = await fetch(`/api/admin/settings`, { cache: "no-store" });
        const sJson = await s.json();
        if (!mounted) return;
        setSettings(sJson.settings || {});
        console.log("[SuperAdmin] fetched settings:", Object.keys(sJson.settings || {}));

        // users list (admin-only — include token header if present)
        const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
        const uRes = await fetch(`/api/admin/users`, {
          headers,
          cache: "no-store",
        });

        if (!mounted) return;
        if (uRes.ok) {
          const uJson = await uRes.json();
          setUsers(uJson.users || []);
          console.log("[SuperAdmin] fetched users, count:", (uJson.users || []).length);
        } else {
          const txt = await uRes.text().catch(() => "");
          console.warn("[SuperAdmin] users fetch not ok:", uRes.status, txt);
          setUsers([]);
        }
      } catch (err) {
        console.error("SuperAdmin load error:", err);
        if (mounted) {
          setUsers([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [sessionToken]);

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
      PanelComponent = () => <UsersPanel users={users} loading={loading} />;
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

  // Minimal render, unchanged visually — but now we can confirm the DOM node exists
  return (
    <div className="admin-page" style={{ display: "flex" }} data-superadmin-active={activePanel}>
      <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} />
      <div style={{ flex: 1, padding: "1rem" }}>
        <PanelComponent />
      </div>
    </div>
  );
}
