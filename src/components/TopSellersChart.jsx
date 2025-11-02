// src/components/TopSellersChart.jsx
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
 * - data: [{ name, qty_sold }]
 * - onSelect(name)
 * - highlightName (optional)
 *
 * Renders a donut (pie) for top 5 sellers plus a right-side legend/list.
 */
export default function TopSellersChart({ data = [], onSelect = () => {}, highlightName = null }) {
  // normalize and pick top 5
  const rows = useMemo(() => {
    const arr = (Array.isArray(data) ? data : []).map((d) => ({
      name: d.name || d.label || d.product || "Unknown",
      qty: Number(d.qty_sold ?? d.qty ?? d.count ?? 0) || 0,
    }));
    return arr.sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [data]);

  if (!rows || rows.length === 0) {
    return <div style={{ color: "#9aa3ab", padding: 12 }}>No best sellers yet</div>;
  }

  const total = rows.reduce((s, r) => s + r.qty, 0) || 1;
  const top = rows[0];

  // pie data: compute percent as well
  const pieData = rows.map((r) => ({
    name: r.name,
    value: r.qty,
    pct: r.qty ? Math.round((r.qty / total) * 100) : 0,
  }));

  // color palette (greens)
  const colors = ["#16a34a", "#22c55e", "#34d399", "#86efac", "#c7f9d1"];
  const highlightColor = "#065f46";

  // helpers
  const truncate = (s, n = 28) => (typeof s === "string" && s.length > n ? s.slice(0, n - 1) + "…" : s);
  const formatNumber = (v) => (typeof v === "number" ? v.toLocaleString() : v);

  // small tooltip formatter
  const tooltipFormatter = (value, name, entry) => {
    const pct = entry && entry.payload ? `${Math.round((entry.payload.value / total) * 100)}%` : "";
    return [`${formatNumber(value)}`, `${pct}`];
  };

  // Layout: left = chart, right = list
  // We'll render a flex container so the legend/list sits to the right and the chart uses remaining space.
  // The donut has center overlay showing top product & total.
  return (
    <div style={{ display: "flex", gap: 12, width: "100%", alignItems: "center", height: 220 }}>
      {/* Left: Pie (responsive) */}
      <div style={{ flex: "0 0 52%", minWidth: 180, height: "100%", position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius="56%"
              outerRadius="80%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={4}
              isAnimationActive={false}
            >
              {pieData.map((entry, idx) => {
                const isSelected = highlightName && highlightName === entry.name;
                const fill = isSelected ? highlightColor : colors[idx % colors.length];
                return (
                  <Cell
                    key={`slice-${idx}`}
                    fill={fill}
                    cursor={onSelect ? "pointer" : "default"}
                    onClick={() => onSelect?.(entry.name)}
                  />
                );
              })}
            </Pie>

            <Tooltip formatter={tooltipFormatter} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center overlay: top product name + total */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
            width: "60%",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--muted, #6b7280)" }}>Top seller</div>
          <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.1, marginTop: 6 }}>
            {truncate(top.name, 22)}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted, #6b7280)", marginTop: 4 }}>
            {formatNumber(top.qty)} sold
          </div>
        </div>
      </div>

      {/* Right: compact legend/list */}
      <div style={{ flex: "1 1 48%", minWidth: 140, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
        {pieData.map((row, i) => {
          const isSelected = highlightName && highlightName === row.name;
          const fill = isSelected ? highlightColor : colors[i % colors.length];
          return (
            <div
              key={`row-${i}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelect?.(row.name)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? onSelect?.(row.name) : null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 8px",
                borderRadius: 8,
                cursor: "pointer",
                background: isSelected ? "rgba(6,95,70,0.06)" : "transparent",
              }}
              aria-pressed={!!isSelected}
              aria-label={`${row.name}: ${row.value} sold, ${row.pct}%`}
            >
              {/* color chip */}
              <div style={{ width: 12, height: 12, borderRadius: 4, background: fill, flex: "0 0 12px" }} />

              {/* name + small pct */}
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {truncate(`${i + 1}. ${row.name}`, 28)}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted, #6b7280)", marginTop: 2 }}>
                  {formatNumber(row.value)} sold • {row.pct}% of top
                </div>
              </div>

              {/* percent badge */}
              <div style={{ flex: "0 0 auto", marginLeft: 8, fontWeight: 700, fontSize: 13 }}>
                {row.pct}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
