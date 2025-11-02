// src/components/SummaryCard.jsx
import React, { useState, useMemo, useEffect } from "react";

/**
 * SummaryCard (controlled-friendly)
 * Props:
 * - title, value, subtitle, delta, deltaDirection, sparklineData, defaultOpen, isOpen, onToggle, children
 *
 * If isOpen is provided, the card becomes *controlled* (parent controls open state).
 * Otherwise internal state is used (defaultOpen controls initial).
 */
export default function SummaryCard({
  title,
  value,
  subtitle,
  delta,
  deltaDirection,
  sparklineData = [],
  defaultOpen = false,
  isOpen,         // optional controlled open state
  onToggle,       // callback(open)
  children,
}) {
  // internal open state, used only if isOpen === undefined
  const [internalOpen, setInternalOpen] = useState(!!defaultOpen);

  // If controlled, derive open from prop; otherwise use internal
  const open = typeof isOpen === "boolean" ? isOpen : internalOpen;

  // If parent controls, keep internal state in sync for accessibility purposes
  useEffect(() => {
    if (typeof isOpen === "boolean") {
      setInternalOpen(isOpen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggle = () => {
    const next = !open;
    if (typeof isOpen !== "boolean") {
      setInternalOpen(next);
    }
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
    <div className={`summary-card ${open ? "expanded" : ""}`} role="region" aria-expanded={open} style={{ background: "var(--card)", borderRadius: 12, padding: 12, boxShadow: "var(--soft-shadow)" }}>
      <div className="summary-card-header" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
        <div className="summary-left" style={{ flex: 1 }}>
          <div className="summary-title" style={{ fontSize: 13, color: "#6b7280" }}>{title}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <div className="summary-value" style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
            {delta ? (
              <div style={{ fontSize: 13, color: deltaDirection === "down" ? "#b91c1c" : "#065f46", fontWeight: 700 }}>
                {deltaDirection === "up" ? "▲ " : deltaDirection === "down" ? "▼ " : ""}{delta}
              </div>
            ) : null}
          </div>
          {subtitle ? <div className="summary-sub" style={{ color: "var(--muted)", marginTop: 6 }}>{subtitle}</div> : null}
        </div>

        <div className="summary-right" style={{ display: "flex", gap: 12, alignItems: "center" }}>
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

          {/* toggle button */}
          <button
            onClick={toggle}
            aria-expanded={open}
            aria-label={`${open ? "Collapse" : "Expand"} ${title}`}
            className="btn-outline"
            style={{ whiteSpace: "nowrap" }}
          >
            {open ? "Hide" : "See more"}
          </button>
        </div>
      </div>

      <div className="summary-card-body" aria-hidden={!open} style={{ marginTop: 12, display: open ? "block" : "none" }}>
        <div className="summary-controls" style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 8 }}>
          {/* space for export / actions */}
        </div>

        <div>
          {children ? children : <div style={{ color: "var(--muted)", padding: 8 }}>Details will appear here.</div>}
        </div>
      </div>
    </div>
  );
}
