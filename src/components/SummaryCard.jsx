// src/components/SummaryCard.jsx
import React, { useState, useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis } from "recharts";

/**
 * SummaryCard
 * Props:
 * - title (string)
 * - value (string|number)
 * - subtitle (string) optional
 * - delta (string) optional e.g. "+12%"
 * - deltaDirection: "up" | "down" | null
 * - sparklineData: optional array of numbers for the tiny sparkline
 * - defaultOpen: boolean
 * - onToggle(open) optional callback
 * - children: expanded area (chart/details)
 */
export default function SummaryCard({
  title,
  value,
  subtitle,
  delta,
  deltaDirection,
  sparklineData = [],
  defaultOpen = false,
  onToggle,
  children,
}) {
  const [open, setOpen] = useState(!!defaultOpen);

  const toggle = (e) => {
    // stop propagation if called from a button click inside header
    if (e && e.stopPropagation) e.stopPropagation();
    const next = !open;
    setOpen(next);
    if (typeof onToggle === "function") onToggle(next);
  };

  // Build small chart-friendly array
  const chartData = useMemo(() => {
    if (!Array.isArray(sparklineData) || sparklineData.length === 0) return [];
    return sparklineData.map((v, i) => ({ i, v: Number(v || 0) }));
  }, [sparklineData]);

  // unique gradient id for area fill (keeps multiple cards safe)
  const gradId = `g-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className={`summary-card ${open ? "expanded" : ""}`} role="region" aria-expanded={open}>
      {/* clickable header: clicking anywhere on header toggles the card */}
      <div
        className="summary-card-header"
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(e); } }}
        aria-pressed={open}
      >
        <div className="summary-left">
          <div className="summary-title">{title}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <div className="summary-value">{value}</div>
            {delta ? (
              <div style={{ fontSize: 13, color: deltaDirection === "down" ? "#b91c1c" : "#065f46", fontWeight: 700 }}>
                {deltaDirection === "up" ? "▲ " : deltaDirection === "down" ? "▼ " : ""}{delta}
              </div>
            ) : null}
          </div>
          {subtitle ? <div className="summary-sub">{subtitle}</div> : null}
        </div>

        <div className="summary-right" onClick={(e) => e.stopPropagation()} >
          {/* tiny sparkline */}
          <div className="summary-sparkline" aria-hidden>
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16a34a" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="i" hide />
                  <Tooltip formatter={(v) => [v, title]} />
                  <Area type="monotone" dataKey="v" stroke="#16a34a" fill={`url(#${gradId})`} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ width: 120, height: 36 }} />
            )}
          </div>

          {/* toggle button (stops propagation so header keyboard handler remains clean) */}
          <button
            onClick={(e) => { e.stopPropagation(); toggle(e); }}
            aria-expanded={open}
            aria-label={`${open ? "Collapse" : "Expand"} ${title}`}
            className="btn-outline"
            style={{ whiteSpace: "nowrap" }}
          >
            {open ? "Hide" : "See more"}
          </button>
        </div>
      </div>

      <div className="summary-card-body" aria-hidden={!open}>
        {/* small controls placeholder area (can be used for export buttons) */}
        <div className="summary-controls" style={{ justifyContent: "flex-end" }}>
          {/* placeholder for export / actions */}
        </div>

        {/* the expanded children area */}
        <div>
          {children ? children : <div style={{ color: "var(--muted)", padding: 8 }}>Details will appear here.</div>}
        </div>
      </div>
    </div>
  );
}
