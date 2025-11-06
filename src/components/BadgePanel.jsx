// src/components/BadgePanel.jsx
import React from "react";

/**
 * BadgePanel — renders user badges as compact, polished tiles.
 * Props:
 *  - badges: array of badge ids (strings)
 */

const BADGE_META = {
  first_invoice: { title: "First Invoice", hint: "Completed your first invoice", color: "#06b6d4" },
  speed_demon: { title: "Speed Demon", hint: "Fast invoice creation", color: "#f59e0b" },
  confirmed_seller: { title: "Confirmed Seller", hint: "Invoices marked paid", color: "#10b981" },
  repeat_seller: { title: "Repeat Seller", hint: "Multiple repeat customers", color: "#7c3aed" },
};

export default function BadgePanel({ badges = [] }) {
  return (
    <aside className="badge-panel card" aria-labelledby="badges-heading">
      <h4 id="badges-heading" className="badge-panel-title">My Badges</h4>

      {badges.length === 0 ? (
        <div className="badge-panel-empty muted">No badges yet — complete a challenge to earn one.</div>
      ) : (
        <div className="badges-grid" role="list">
          {badges.map((b) => {
            const meta = BADGE_META[b] || { title: b, hint: "" };
            const initial = (meta.title || b).charAt(0).toUpperCase();
            const color = meta.color || "#9ca3af";
            return (
              <div className="badge-tile" key={b} role="listitem" aria-label={`${meta.title}: ${meta.hint}`}>
                <div
                  className="badge-icon"
                  aria-hidden
                  style={{ background: `linear-gradient(135deg, ${lighten(color, 0.35)}, ${color})` }}
                >
                  <span className="badge-initial">{initial}</span>
                </div>

                <div className="badge-meta">
                  <div className="badge-title">{meta.title}</div>
                  {meta.hint && <div className="badge-hint">{meta.hint}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}

// Small inline color utility (no dependency)
function lighten(hex, amount = 0.2) {
  try {
    const c = hex.replace("#", "");
    const num = parseInt(c, 16);
    let r = (num >> 16) + Math.round(255 * amount);
    let g = ((num >> 8) & 0x00ff) + Math.round(255 * amount);
    let b = (num & 0x0000ff) + Math.round(255 * amount);
    r = Math.min(255, r);
    g = Math.min(255, g);
    b = Math.min(255, b);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } catch (e) {
    return hex;
  }
}
