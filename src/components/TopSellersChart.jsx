// src/components/TopSellersChart.jsx
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";

/**
 * Props:
 * - data: [{ name, qty_sold }]
 * - onSelect(name)
 * - highlightName (optional)
 */
export default function TopSellersChart({ data = [], onSelect = () => {}, highlightName = null }) {
  // Build rows: map, coerce numeric, sort desc, take top5 (largest -> smallest)
  const rows = useMemo(() => {
    const arr = (Array.isArray(data) ? data : []).map((d) => ({
      name: d.name || d.label || d.product || "Unknown",
      qty: Number(d.qty_sold ?? d.qty ?? d.count ?? 0) || 0,
    }));
    return arr
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [data]);

  // If no rows, show placeholder
  if (!rows || rows.length === 0) {
    return <div style={{ color: "#9aa3ab", padding: 12 }}>No best sellers yet</div>;
  }

  // Compute max for track background and percentages
  const maxQty = Math.max(...rows.map((r) => r.qty), 1);

  // Prepare data in reversed order so highest appears at top when using vertical layout
  const chartData = rows
    .map((r, i) => ({ ...r, max: maxQty, idx: i + 1 }))
    .slice()
    .reverse();

  // Colors for bars (primary to lighter)
  const colors = ["#16a34a", "#22c55e", "#34d399", "#86efac", "#c7f9d1"];
  const highlightColor = "#065f46";

  // sensible height: base + row spacing
  const height = Math.max(160, chartData.length * 56);

  // Truncate helper for labels shown visually
  const truncate = (s, n = 28) => (typeof s === "string" && s.length > n ? s.slice(0, n - 1) + "…" : s);

  // Custom Y tick renderer (truncated text + full name via <title>)
  const renderYAxisTick = ({ x, y, payload }) => {
    const full = payload?.value ?? "";
    const short = truncate(full, 28);
    return (
      <g transform={`translate(${x},${y})`}>
        <title>{full}</title>
        <text x={6} y={6} fontSize={13} fill="currentColor" style={{ pointerEvents: "none", fontWeight: 700 }}>
          {short}
        </text>
      </g>
    );
  };

  // Tooltip formatter showing qty and percent
  const tooltipFormatter = (value, name, props) => {
    const pct = ((value / maxQty) * 100).toFixed(0);
    return [`${value}`, `${pct}% of top`];
  };

  // Label formatter for right-side numeric label (adds commas)
  const formatNumber = (v) => (typeof v === "number" ? v.toLocaleString() : v);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 6, right: 8, left: 8, bottom: 6 }}
          barCategoryGap="20%"
        >
          {/* horizontal value axis is hidden */}
          <XAxis type="number" hide domain={[0, maxQty]} />

          {/* names on Y axis (we render ticks with truncation) */}
          <YAxis
            type="category"
            dataKey="name"
            width={180}
            tick={renderYAxisTick}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip formatter={tooltipFormatter} />

          {/* Background track (full-length, subtle) */}
          <Bar
            dataKey="max"
            barSize={18}
            isAnimationActive={false}
            fill="#eef2f6"
            radius={[8, 8, 8, 8]}
          />

          {/* Foreground bar representing qty */}
          <Bar dataKey="qty" barSize={18} isAnimationActive={false} radius={[8, 8, 8, 8]}>
            {/* numeric label to the right of the bar */}
            <LabelList
              dataKey="qty"
              position="right"
              formatter={(v) => formatNumber(v)}
              style={{ fontSize: 12, fill: "currentColor", fontWeight: 700, marginLeft: 8 }}
              offset={8}
            />
            {chartData.map((entry, i) => {
              // Because chartData is reversed, original index = rows.length - 1 - i
              const originalIndex = chartData.length - 1 - i;
              const isSelected = highlightName && highlightName === entry.name;
              const fill = isSelected ? highlightColor : colors[originalIndex % colors.length];
              return (
                <Cell
                  key={`cell-${i}`}
                  fill={fill}
                  cursor={onSelect ? "pointer" : "default"}
                  opacity={isSelected ? 1 : 0.98}
                  onClick={() => onSelect?.(entry.name)}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
