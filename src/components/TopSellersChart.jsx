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
 * Renders a donut (pie) for top 5 sellers, pie on top and a full legend/list below.
 */
export default function TopSellersChart({ data = [], onSelect = () => {}, highlightName = null }) {
  // normalize and pick top 5 (sorted desc)
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

  // pie data with percent
  const pieData = rows.map((r) => ({
    name: r.name,
    value: r.qty,
    pct: r.qty ? Math.round((r.qty / total) * 100) : 0,
  }));

  // color palette & highlight color
  const colors = ["#16a34a", "#22c55e", "#34d399", "#86efac", "#c7f9d1"];
  const highlightColor = "#065f46";

  // helpers
  const truncate = (s, n = 36) => (typeof s === "string" && s.length > n ? s.slice(0, n - 1) + "…" : s);
  const formatNumber = (v) => (typeof v === "number" ? v.toLocaleString() : v);

  const tooltipFormatter = (value, name, entry) => {
    const pct = entry && entry.payload ? `${Math.round((entry.payload.value / total) * 100)}%` : "";
    return [`${formatNumber(value)}`, `${pct}`];
  };

  // Layout: column — pie on top, full legend list below
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Pie area (top) */}
      <div style={{ width: "100%", height: 180, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: "60%", height: "100%", minWidth: 160, minHeight: 120, position: "relative" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius="54%"
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

          {/* center overlay (top item + sold) */}
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
            <div style={{ fontSize: 12, color: "var(--muted, #6b7280)" }}>Top seller</div>
            <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.1, marginTop: 6 }}>
              {truncate(top.name, 22)}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted, #6b7280)", marginTop: 4 }}>
              {formatNumber(top.qty)} sold
            </div>
          </div>
        </div>
      </div>

      {/* Full list below the pie (always shows all rows) */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
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
                gap: 12,
                padding: "8px 10px",
                borderRadius: 8,
                cursor: "pointer",
                background: isSelected ? "rgba(6,95,70,0.06)" : "transparent",
              }}
              aria-pressed={!!isSelected}
              aria-label={`${i + 1}. ${row.name}: ${row.value} sold (${row.pct}%)`}
            >
              {/* rank & chip */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 36 }}>
                <div style={{ fontWeight: 700, width: 20 }}>{i + 1}.</div>
                <div style={{ width: 12, height: 12, borderRadius: 4, background: fill, flex: "0 0 12px" }} />
              </div>

              {/* name + subtext */}
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {truncate(row.name, 40)}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted, #6b7280)", marginTop: 4 }}>
                  {formatNumber(row.value)} sold • {row.pct}% of top
                </div>
              </div>

              {/* pct badge on right */}
              <div style={{ flex: "0 0 auto", marginLeft: 8, fontWeight: 800 }}>
                {row.pct}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
