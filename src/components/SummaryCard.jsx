// src/components/SummaryCard.jsx
import React, { useState, useMemo, useRef, useEffect } from "react";
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
 * - defaultOpen: boolean (uncontrolled mode)
 * - open: boolean (controlled mode) — optional
 * - isOpen: boolean (alternate controlled prop name — supported for compatibility)
 * - onToggle(open) optional callback (called in both controlled & uncontrolled modes)
 * - children: expanded area (chart/details)
 * - showSparklineInPreview: boolean (optional) - when true, renders the 120x36 sparkline even in preview
 */
export default function SummaryCard({
  title,
  value,
  subtitle,
  delta,
  deltaDirection,
  sparklineData = [],
  defaultOpen = false,
  open: openProp,
  isOpen, // accept both prop names for compatibility
  onToggle,
  children,
  showSparklineInPreview = false, // NEW: control whether sparkline is visible in preview
}) {
  // prefer explicit `openProp` if provided, otherwise fallback to `isOpen`
  const controlledValue =
    typeof openProp !== "undefined"
      ? openProp
      : typeof isOpen !== "undefined"
      ? isOpen
      : undefined;
  const isControlled = typeof controlledValue !== "undefined";

  const [internalOpen, setInternalOpen] = useState(!!defaultOpen);
  const currentOpen = isControlled ? !!controlledValue : internalOpen;

  const bodyRef = useRef(null);
  const idRef = useRef(`summary-body-${Math.random().toString(36).slice(2, 9)}`);
  const gradId = useMemo(() => `g-${Math.random().toString(36).slice(2, 8)}`, []);

  // Build small chart-friendly array (use Number.isFinite for safety)
  const chartData = useMemo(() => {
    if (!Array.isArray(sparklineData) || sparklineData.length === 0) return [];
    return sparklineData.map((v, i) => {
      const n = Number(v);
      return { i, v: Number.isFinite(n) ? n : 0 };
    });
  }, [sparklineData]);

  // Toggle handler (works for both controlled and uncontrolled)
  const toggle = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const next = !currentOpen;
    if (!isControlled) setInternalOpen(next);
    if (typeof onToggle === "function") {
      try {
        onToggle(next);
      } catch (err) {
        // swallow callback errors so UI remains stable
        // eslint-disable-next-line no-console
        console.error("SummaryCard onToggle error:", err);
      }
    }
  };

  // Keyboard handler on header
  const handleHeaderKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(e);
    }
  };

  // Manage smooth expand/collapse using inline maxHeight to avoid requiring extra CSS
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    // force reflow when children change while open
    if (currentOpen) {
      const scroll = el.scrollHeight;
      el.style.maxHeight = `${scroll}px`;
      el.style.opacity = "1";
    } else {
      el.style.maxHeight = "0px";
      el.style.opacity = "0";
    }
    // ensure transition style present
    el.style.transition = "max-height 320ms cubic-bezier(.2,.9,.2,1), opacity 220ms ease";
    el.style.overflow = "hidden";
  }, [currentOpen, children]);

  // Determine whether to render the full sparkline area:
  // show it when the card is expanded or when explicitly requested via prop.
  const showSparklineNow = currentOpen || showSparklineInPreview;

  return (
    // Keep the CSS className for compatibility with existing styles.
    <div
      className={`summary-card ${currentOpen ? "expanded" : ""}`}
      role="region"
      aria-expanded={currentOpen}
    >
      {/* clickable header: clicking anywhere toggles */}
      <div
        className="summary-card-header"
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={handleHeaderKey}
        aria-pressed={currentOpen}
        aria-controls={idRef.current}
        aria-expanded={currentOpen}
      >
        <div className="summary-left">
          <div
            className="summary-title"
            style={{ fontWeight: 700, fontSize: 13, color: "inherit" }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              minWidth: 0,
              flexWrap: "wrap",
              marginTop: 6,
            }}
          >
            <div className="summary-value">{value}</div>

            {delta ? (
              <div
                style={{
                  fontSize: 13,
                  color: deltaDirection === "down" ? "#b91c1c" : "#065f46",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {deltaDirection === "up" ? "▲ " : deltaDirection === "down" ? "▼ " : ""}
                {delta}
              </div>
            ) : null}
          </div>

          {subtitle ? (
            <div className="summary-sub">{subtitle}</div>
          ) : null}
        </div>

        <div
          className="summary-right"
          onClick={(e) => e.stopPropagation()}
        >
          {/* tiny sparkline or compact placeholder depending on state */}
          <div
            className="summary-sparkline"
            aria-hidden
            style={showSparklineNow ? undefined : { width: 36, height: 10, minWidth: 36 }}
            title={Array.isArray(sparklineData) ? sparklineData.join(", ") : undefined}
          >
            {showSparklineNow ? (
              chartData.length ? (
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
              )
            ) : (
              // compact placeholder (no large micro-chart in preview)
              <div style={{ width: 36, height: 10 }} />
            )}
          </div>

          {/* toggle button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggle(e);
            }}
            aria-expanded={currentOpen}
            aria-controls={idRef.current}
            aria-label={`${currentOpen ? "Collapse" : "Expand"} ${title}`}
            className="btn-outline"
          >
            {currentOpen ? "Hide" : "See more"}
          </button>
        </div>
      </div>

      <div
        id={idRef.current}
        ref={bodyRef}
        className="summary-card-body"
        aria-hidden={!currentOpen}
        // let useEffect manage maxHeight/opacity for smooth transitions, but ensure body participates in flex
        style={{
          maxHeight: currentOpen ? undefined : "0px",
          opacity: currentOpen ? 1 : 0,
          flex: "1 1 auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflow: "hidden",
        }}
      >
        {/* small controls placeholder area (can be used for export buttons) */}
        <div className="summary-controls" style={{ justifyContent: "flex-end", display: "flex" }}>
          {/* placeholder for export / actions */}
        </div>

        {/* the expanded children area */}
        <div style={{ flex: "1 1 auto" }}>
          {children ? (
            children
          ) : (
            <div style={{ color: "var(--muted, #9aa3ab)", padding: 8 }}>Details will appear here.</div>
          )}
        </div>
      </div>
    </div>
  );
}
