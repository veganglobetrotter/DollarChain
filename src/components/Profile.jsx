// src/components/Profile.jsx
import React from "react";
import { useUser } from "../context/UserContext";

/**
 * Simple Profile page.
 * - Shows basic user info and wallet balance
 * - Shows recent transactions (if available)
 * - Edit button navigates to /settings (your router should map that)
 *
 * Usage: render this component on your /profile route
 */

export default function Profile() {
  const { user, profile, wallet, transactions, loading, refreshWallet } = useUser();

  const fullName = (profile && profile.full_name) || (user && (user.user_metadata?.full_name || user.user_metadata?.name)) || user?.email || "Your account";

  return (
    <div className="page-container">
      <h1 className="page-title">Your Profile</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
          <section style={{ background: "white", padding: 16, borderRadius: 8 }}>
            <h2 style={{ marginTop: 0 }}>{fullName}</h2>
            <p style={{ margin: "6px 0" }}>
              <strong>Email:</strong> {user?.email || "-"}
            </p>
            <p style={{ margin: "6px 0" }}>
              <strong>Phone:</strong> {(profile && profile.phone) || user?.user_metadata?.phone || "-"}
            </p>

            <div style={{ marginTop: 12 }}>
              <button
                className="btn-outline"
                onClick={() => {
                  // Navigate to settings page — adapt to your router
                  window.location.href = "/settings";
                }}
              >
                Edit profile
              </button>
            </div>
          </section>

          <aside style={{ background: "white", padding: 16, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Wallet</h3>
            <p style={{ fontSize: 20, fontWeight: 700 }}>
              {wallet?.credits_bigint != null ? `${wallet.credits_bigint} credits` : "Wallet not found"}
            </p>

            <div style={{ marginTop: 8 }}>
              <button
                className="btn-primary"
                onClick={() => {
                  // adapt or change to your buy credits flow (e.g. navigate to /buy)
                  window.location.href = "/buy";
                }}
              >
                Buy Credits
              </button>

              <button
                className="btn-outline"
                style={{ marginLeft: 8 }}
                onClick={() => {
                  refreshWallet();
                }}
              >
                Refresh
              </button>
            </div>

            <div style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 8 }}>Recent activity</h4>
              {transactions && transactions.length ? (
                <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                  {transactions.slice(0, 6).map((t, i) => (
                    <li key={i} style={{ padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                      <div style={{ fontSize: 13 }}>
                        <strong style={{ color: t.delta < 0 ? "#dc2626" : "#16a34a" }}>{t.delta}</strong>{" "}
                        <span style={{ color: "#666", marginLeft: 6 }}>{t.type}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#888" }}>{new Date(t.created_at).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#666" }}>No recent wallet activity</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
