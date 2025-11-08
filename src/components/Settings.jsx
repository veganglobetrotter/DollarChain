// src/components/Settings.jsx
import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";

/**
 * Settings page for profile editing.
 * - Fields: full_name, phone
 * - Calls updateProfile() from UserContext which upserts into 'profiles' table.
 *
 * Note: If you do not have 'profiles' table this will return an error and show a message.
 */

export default function Settings() {
  const { user, profile, updateProfile, refreshProfile } = useUser();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    } else if (user) {
      // fallback to auth metadata if profile not present
      setFullName(user.user_metadata?.full_name || user.user_metadata?.name || "");
      setPhone(user.user_metadata?.phone || "");
    }
  }, [profile, user]);

  const handleSave = async (e) => {
    e && e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const { data, error } = await updateProfile({ full_name: fullName, phone });
      if (error) {
        setStatus({ type: "error", message: `Failed to save profile: ${error.message || error}` });
      } else {
        setStatus({ type: "success", message: "Profile saved." });
        // refresh context's profile
        await refreshProfile();
      }
    } catch (err) {
      setStatus({ type: "error", message: err.message || String(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Settings</h1>

      <form onSubmit={handleSave} style={{ maxWidth: 640, background: "white", padding: 16, borderRadius: 8 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6 }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6 }} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            Save
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              // revert to last saved values
              if (profile) {
                setFullName(profile.full_name || "");
                setPhone(profile.phone || "");
              } else if (user) {
                setFullName(user.user_metadata?.full_name || user.user_metadata?.name || "");
                setPhone(user.user_metadata?.phone || "");
              }
            }}
          >
            Reset
          </button>
        </div>

        {status && (
          <div style={{ marginTop: 12 }}>
            <div style={{ color: status.type === "error" ? "#dc2626" : "#16a34a" }}>{status.message}</div>
          </div>
        )}

        <div style={{ marginTop: 16, color: "#555" }}>
          <small>
            Note: Profile updates are written to a `profiles` table (recommended). If you do not have a `profiles` table,
            contact the developer to create one or we can update auth metadata instead.
          </small>
        </div>
      </form>
    </div>
  );
}
