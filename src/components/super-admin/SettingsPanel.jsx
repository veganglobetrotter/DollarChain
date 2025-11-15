// src/components/super-admin/SettingsPanel.jsx
import React, { useEffect, useState } from "react";

/**
 * Surgical patch:
 * - prefers supabase.auth.getSession() by dynamically importing src/lib/supabase
 * - falls back to parsing localStorage key 'sb-ufwtjymkwlceqzckpnsb-auth-token'
 * - preserves props: settings, toggleShow7Day
 * - minimal UI changes (optimistic toggle, saving state, inline error)
 *
 * Note: dynamic import path '../../lib/supabase' assumes this file is at:
 * src/components/super-admin/SettingsPanel.jsx -> ../../lib/supabase
 * If your lib path differs, adjust the string in import(...) accordingly.
 */

export default function SettingsPanel({ settings = {}, toggleShow7Day }) {
  const key = "charts.show7DayMA";

  const [checked, setChecked] = useState(!!settings[key]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setChecked(!!settings[key]);
  }, [settings, key]);

  // Try to obtain a bearer token using supabase client (preferred)
  async function getAuthHeader() {
    // 1) Try dynamic import of client-side supabase (preferred).
    try {
      // dynamic import so we don't break server-side or environments without the module
      // adjust path if your supabase client is located elsewhere
      // from: src/components/super-admin -> ../../lib/supabase
      const mod = await import("../../lib/supabase");
      const supabase = mod.supabase || mod.default;
      if (supabase && supabase.auth && typeof supabase.auth.getSession === "function") {
        try {
          const { data } = await supabase.auth.getSession();
          const token = data?.session?.access_token;
          if (token) return { Authorization: `Bearer ${token}` };
        } catch (e) {
          // fall through to fallback below
          // Some supabase clients may throw if session not initialized; ignore
        }
      }
    } catch (e) {
      // dynamic import failed (module not present or bundler path differs) — fall back
    }

    // 2) Fallback: parse known localStorage key (legacy, brittle)
    try {
      const raw = localStorage.getItem("sb-ufwtjymkwlceqzckpnsb-auth-token");
      if (!raw) return {};
      try {
        const parsed = JSON.parse(raw);
        const token = parsed?.access_token || parsed?.accessToken || parsed;
        if (token) return { Authorization: `Bearer ${token}` };
      } catch (e) {
        // raw could be token string
        return { Authorization: `Bearer ${raw}` };
      }
    } catch (e) {
      // localStorage not available or error; silently return empty
    }

    return {};
  }

  async function handleToggle(e) {
    const next = e.target.checked;
    setChecked(next); // optimistic
    setSaving(true);
    setError(null);

    // call optional parent handler (don't await; keep optimistic)
    if (typeof toggleShow7Day === "function") {
      try {
        toggleShow7Day(next);
      } catch (inner) {
        console.warn("toggleShow7Day callback error:", inner);
      }
    }

    try {
      const authHeader = await getAuthHeader();
      const headers = {
        "Content-Type": "application/json",
        ...(authHeader || {}),
      };

      const resp = await fetch("/api/admin/settings", {
        method: "POST",
        headers,
        body: JSON.stringify({ key, value: next }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(`Request failed: ${resp.status} ${txt}`);
      }

      const json = await resp.json();
      if (json.action && json.action !== "upsert") {
        // This isn't a fatal error; log it for debugging.
        console.warn("Unexpected action from settings API:", json);
      }
    } catch (err) {
      console.error("Failed to persist setting:", err);
      setError("Failed to save setting. See console for details.");
      // revert optimistic change
      setChecked((prev) => !prev);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2>Settings</h2>

      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={handleToggle}
            disabled={saving}
          />
          <span>Show 7-day MA on charts</span>
        </label>
      </div>

      {error && (
        <div style={{ marginTop: 8, color: "var(--color-danger, #c0392b)" }}>
          {error}
        </div>
      )}

      {/* Add more settings controls here as needed */}
    </div>
  );
}
