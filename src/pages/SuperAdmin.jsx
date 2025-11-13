// src/pages/SuperAdmin.jsx
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

export default function SuperAdmin() {
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const auth = user?.access_token || (user && user?.token) || null; // adapt to your session shape
  const API_BASE = "http://localhost:5000"; // local proxy for serverless endpoints

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // fetch settings (public GET)
        const s = await fetch(`${API_BASE}/api/admin/settings`);
        const sJson = await s.json();
        setSettings(sJson.settings || {});

        // fetch users (must be admin)
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

  return (
    <div className="admin-page">
      <h1>Super Admin</h1>
      <section>
        <h2>Settings</h2>
        <div>
          <label>
            <input
              type="checkbox"
              checked={!!settings["charts.show7DayMA"]}
              onChange={toggleShow7Day}
            />
            Show 7-day MA on charts
          </label>
        </div>
      </section>

      <section>
        <h2>Users</h2>
        {loading ? <p>Loading…</p> : (
          <table>
            <thead><tr><th>id</th><th>full_name</th><th>is_super_admin</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.full_name || (u.metadata && u.metadata.name) || "-"}</td>
                  <td>{String(u.is_super_admin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
