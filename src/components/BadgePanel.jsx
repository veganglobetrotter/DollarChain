import React from "react";

/**
 * BadgePanel.jsx
 * Props:
 *  - badges: string[] (badge slugs)
 */

const BADGE_META = {
  first_invoice: { title: "First Invoice", hint: "Completed your first invoice" },
  speed_demon: { title: "Speed Demon", hint: "Fast invoice creation" },
  confirmed_seller: { title: "Confirmed Seller", hint: "Invoices marked paid" },
  repeat_seller: { title: "Repeat Seller", hint: "Multiple repeat buyers" },
};

export default function BadgePanel({ badges = [] }) {
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm">
      <h4 className="text-sm font-semibold mb-2">My Badges</h4>

      {badges.length === 0 ? (
        <div className="text-xs text-gray-500">No badges yet — complete a challenge to earn one.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <div key={b} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded px-3 py-2 text-xs">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-200 text-gray-700 font-semibold">
                {BADGE_META[b]?.title?.charAt(0) || "B"}
              </div>
              <div>
                <div className="font-medium text-xs">{BADGE_META[b]?.title || b}</div>
                <div className="text-[11px] text-gray-500">{BADGE_META[b]?.hint}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
