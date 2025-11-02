// src/components/RepeatCustomersChart.jsx
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

/**
 * Props:
 * - repeatCustomers: [{ buyer, label, buyer_phone, count, orders }]
 * - repeatPct: number (0-100)
 * - onSelect(name) optional callback when a row or slice is clicked
 */
export default function RepeatCustomersChart({ repeatCustomers = [], repeatPct = 0, onSelect = () => {} }) {
  // normalize top repeat buyers (label or buyer or phone)
  const top = useMemo(() => {
    const arr = (Array.isArray(repeatCustomers) ? repeatCustomers : []).map((r) => ({
      label: r.label || r.buyer || r.buyer_phone || r.name || "Customer",
      count: Number(r.count ?? r.orders ?? r.qty ?? 0) || 0,
    }));
    return arr.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [repeatCustomers]);

  // totals for percent of repeat list
  const totalRepeatCount = top.reduce((s, r) => s + r.count, 0) || 1;

  // donut data (share: repeat vs one-time customers)
  const donutData = [
    { name: "Repeat", value: Number(repeatPct || 0) },
    { name: "One-time", value: Math.max(0, 100 - Number(repeatPct || 0)) },
  ];

  const colors = ["#16a34a", "#e6eef1"];
  const rowColors = ["#16a34a", "#22c55e", "#34d399", "#86efac", "#c7f9d1"];
  const highlightColor = "#065f46";

  const truncate = (s, n = 36) => (typeof s === "string" && s.length > n ? s.slice(0, n - 1) + "…" : s);
  const formatNumber = (v) => (typeof v === "number" ? v.toLocaleString() : v);

  const pieTooltipFormatter = (v) => [`${v}%`, "Share"];

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Pie (top) */}
      <div style={{ width: "100%", height: 140, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: "54%", minWidth: 120, height: "100%", position: "relative" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="80%"
                startAngle={90}
                endAngle={-270}
                paddingAngle={4}
                isAnimationActive={false}
              >
                {donutData.map((entry, idx) => (
                  <Cell key={`c-${idx}`} fill={colors[idx % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={pieTooltipFormatter} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center overlay shows repeat percentage clearly */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none",
              width: "70%",
            }}
          >
            <div className="text-muted" style={{ fontSize: 12 }}>Repeat customers</div>
            <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.05, marginTop: 6 }}>
              {Math.round(Number(repeatPct || 0))}%
            </div>
            <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
              of customers
            </div>
          </div>
        </div>
      </div>

      {/* Full list below the pie */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
        {top.length === 0 ? (
          <div className="text-muted" style={{ padding: 8 }}>No repeat buyers yet</div>
        ) : (
          top.map((r, i) => {
            const pct = Math.round((r.count / totalRepeatCount) * 100);
            const fill = rowColors[i % rowColors.length];
            return (
              <div
                key={`row-${i}`}
                role="button"
                tabIndex={0}
                onClick={() => onSelect?.(r.label)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? onSelect?.(r.label) : null)}
                className="list-row"
                style={{
                  background: "transparent",
                }}
                aria-label={`${i + 1}. ${r.label}: ${r.count} orders (${pct}%)`}
              >
                {/* rank */}
                <div style={{ minWidth: 28, fontWeight: 700 }}>{i + 1}.</div>

                {/* color chip */}
                <div style={{ width: 12, height: 12, borderRadius: 4, background: fill, flex: "0 0 12px" }} />

                {/* name & subtext */}
                <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {truncate(r.label, 40)}
                  </div>
                  <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {formatNumber(r.count)} orders • {pct}% of repeat
                  </div>
                </div>

                {/* pct badge */}
                <div style={{ flex: "0 0 auto", fontWeight: 800 }}>{pct}%</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
