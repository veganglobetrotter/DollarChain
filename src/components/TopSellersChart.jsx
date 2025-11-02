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
  // Normalize, sort descending, take top 5
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

  // Compute max for the background track and to compute percent if needed
  const maxQty = Math.max(...rows.map((r) => r.qty), 1);

  // Prepare chart data with rank (1 = top)
  const chartData = rows.map((r, i) => ({ ...r, rank: i + 1, max: maxQty }));

  // Visual tokens
  const colors = ["#16a34a", "#22c55e", "#34d399", "#86efac", "#c7f9d1"];
  const highlightColor = "#065f46";

  // Height: comfortable row spacing (about 52-56px per row)
  const height = Math.max(160, chartData.length * 56);

  // Truncate helper for label rendering
  const truncate = (s, n = 28) => (typeof s === "string" && s.length > n ? s.slice(0, n - 1) + "…" : s);

  // Custom Y tick renderer: show "1. Product name…" truncated, full name in <title>
  const renderYAxisTick = ({ x, y, payload }) => {
    const { name, rank } = payload.payload || { name: payload.value, rank: null };
    const short = truncate(name, 28);
    return (
      <g transform={`translate(${x},${y})`}>
        <title>{name}</title>
        <text x={6} y={6} fontSize={13} fill="currentColor" style={{ pointerEvents: "none", fontWeight: 700 }}>
          {rank ? `${rank}. ${short}` : short}
        </text>
      </g>
    );
  };

  // Tooltip shows qty and percent of top
  const tooltipFormatter = (value) => {
    const pct = Math.round((value / maxQty) * 100);
    return [`${value}`, `${pct}% of top`];
  };

  // number formatting
  const formatNumber = (v) => (typeof v === "number" ? v.toLocaleString() : v);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 6, right: 8, left: 8, bottom: 6 }}
          barCategoryGap="24%"
        >
          {/* hide numeric X axis */}
          <XAxis type="number" hide domain={[0, maxQty]} />

          {/* Y axis shows rank + truncated name */}
          <YAxis
            type="category"
            dataKey="name"
            width={200}
            tick={renderYAxisTick}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip formatter={tooltipFormatter} />

          {/* background full-length track to provide context for small bars nice */}
          <Bar dataKey="max" barSize={18} isAnimationActive={false} fill="#eef2f6" radius={[8, 8, 8, 8]} />

          {/* foreground bar showing quantity; LabelList places numeric label to the right */}
          <Bar dataKey="qty" barSize={18} isAnimationActive={false} radius={[8, 8, 8, 8]}>
            <LabelList
              dataKey="qty"
              position="right"
              formatter={(v) => formatNumber(v)}
              style={{ fontSize: 12, fill: "currentColor", fontWeight: 700 }}
              offset={8}
            />
            {chartData.map((entry, i) => {
              const isSelected = highlightName && highlightName === entry.name;
              const fill = isSelected ? highlightColor : colors[i % colors.length];
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
