// src/pages/SuperAdmin.jsx
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
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

  const auth = user?.access_token || (user && user?.token) || null;
  const API_BASE = "http://localhost:5000"; // local proxy for serverless endpoints

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // fetch settings
        const s = await fetch(`${API_BASE}/api/admin/settings`);
        const sJson = await s.json();
        setSettings(sJson.settings || {});

        // fetch users
        const uRes = await fetch(`${API_BASE}/api/admin/users`, {
          headers: { Authorization: auth ? `Bearer ${auth}` : "" },
        });
        if (uRes.ok) {
          const uJson = await uRes.json();
          setUsers(uJson.users || []);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error("SuperAdmin load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [auth]);

  async function toggleShow7Day() {
    const newVal = !(settings?.["charts.show7DayMA"] || false);
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth}` },
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
      PanelComponent = () => <SettingsPanel settings={settings} toggleShow7Day={toggleShow7Day} />;
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
