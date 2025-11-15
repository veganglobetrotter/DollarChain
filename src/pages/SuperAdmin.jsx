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

  // Read current Supabase session token once on mount (will re-run if auth changes externally)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token ?? null;
        if (!mounted) return;
        setSessionToken(token);
      } catch (err) {
        console.warn("Could not read supabase session token:", err);
        if (mounted) setSessionToken(null);
      }
    })();

    // subscribe to auth changes so token updates if user signs in/out in-app
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const t = session?.access_token ?? null;
      setSessionToken(t);
    });

    return () => {
      mounted = false;
      // unsubscribe safely
      try {
        listener?.subscription?.unsubscribe?.();
      } catch (e) {
        // ignore unsubscribe errors
      }
    };
  }, []);

  // Debug: log mount/unmount and sessionToken changes so we can see when the component is active
  useEffect(() => {
    console.log("[SuperAdmin] mounted");
    return () => console.log("[SuperAdmin] unmounted");
  }, []);

  useEffect(() => {
    console.log("[SuperAdmin] sessionToken changed ->", sessionToken ? `present (${String(sessionToken).slice(0,16)}...)` : "null");
  }, [sessionToken]);

  // Load settings (public) and users (requires token). Runs initially (sessionToken null)
  // and again if sessionToken changes (so users list can load after login).
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        // public settings (no auth required)
        const s = await fetch(`/api/admin/settings`, { cache: 'no-store' });
        if (!mounted) return;
        if (!s.ok) {
          console.warn('[SuperAdmin] fetch settings failed', s.status);
        }
        const sJson = await s.json();
        if (!mounted) return;
        setSettings(sJson.settings || {});

        // users list (admin-only — include token header if present)
        const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
        const uRes = await fetch(`/api/admin/users`, {
          headers,
          cache: 'no-store',
        });

        if (!mounted) return;
        if (uRes.ok) {
          const uJson = await uRes.json();
          setUsers(uJson.users || []);
          console.log('[SuperAdmin] loaded users (count):', (uJson.users || []).length);
        } else {
          // if unauthorized or other error, clear users array
          console.warn('[SuperAdmin] users fetch not ok', uRes.status);
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

  async function toggleShow7Day() {
    const newVal = !(settings?.["charts.show7DayMA"] || false);
    try {
      const headers = { "Content-Type": "application/json" };
      if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;

      const res = await fetch(`/api/admin/settings`, {
        method: "POST",
        headers,
        body: JSON.stringify({ key: "charts.show7DayMA", value: newVal }),
      });
      const j = await res.json();
      if (res.ok) {
        setSettings((prev) => ({ ...prev, ["charts.show7DayMA"]: newVal }));
      } else {
        console.error("toggleShow7Day failed", j);
      }
    } catch (err) {
      console.error(err);
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

  return (
    <div className="admin-page" style={{ display: "flex" }}>
      <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} />
      <div style={{ flex: 1, padding: "1rem" }}>
        <PanelComponent />
      </div>
    </div>
  );
}
