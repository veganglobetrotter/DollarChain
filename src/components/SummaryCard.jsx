// src/components/SummaryCard.jsx
import React, { useState, useMemo } from "react";

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
    // if called by an actual click event, allow it; if called programmatically, e may be undefined
    if (e && e.stopPropagation) e.stopPropagation();
    const next = !open;
    setOpen(next);
    if (typeof onToggle === "function") onToggle(next);
  };

  // Tiny sparkline path generation (simple)
  const sparkPath = useMemo(() => {
    if (!Array.isArray(sparklineData) || sparklineData.length === 0) return null;
    const w = 120;
    const h = 36;
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    const step = w / (sparklineData.length - 1 || 1);
    return sparklineData
      .map((v, i) => {
        const x = Math.round(i * step);
        const y = Math.round(h - ((v - min) / range) * h);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [sparklineData]);

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

        <div className="summary-right" onClick={(e) => e.stopPropagation()}>
          {/* tiny sparkline */}
          <div className="summary-sparkline" aria-hidden>
            {sparkPath ? (
              <svg width="120" height="36" viewBox="0 0 120 36" preserveAspectRatio="none">
                <path d={sparkPath} stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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
