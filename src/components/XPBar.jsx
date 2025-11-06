import React from "react";

/**
 * XPBar.jsx
 * Props:
 *  - xp (number)
 *  - level (number)
 *  - xpForNextLevel (number)
 */
export default function XPBar({ xp = 0, level = 0, xpForNextLevel = 0 }) {
  const total = xp + xpForNextLevel || 1;
  const pct = Math.min(100, Math.round((xp / total) * 100));

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Level {level} — {xp} XP</div>
          <div className="text-xs text-gray-500">{xpForNextLevel} XP to next level</div>
        </div>
        <div className="text-sm text-gray-600">{pct}%</div>
      </div>

      <div className="w-full bg-gray-100 rounded h-3 mt-2 overflow-hidden">
        <div
          className="h-3 rounded"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#06b6d4,#06b6d4)" }}
          aria-hidden
        />
      </div>
    </div>
  );
}
