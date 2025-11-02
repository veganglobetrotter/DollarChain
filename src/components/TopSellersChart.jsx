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
  // Normalize, sort descending, take top 5 (largest -> smallest)
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

  // max for background track and percent calculations
  const maxQty = Math.max(...rows.map((r) => r.qty), 1);

  // Prepare chart data in reverse so highest appears at the top visually
  // (Recharts draws the first item at the bottom for vertical layout in many contexts,
  //   reversing ensures the largest appears at the top.)
  const chartData = rows
    .map((r, i) => ({ ...r, rank: i + 1, max: maxQty }))
    .slice()
    .reverse();

  // Visual tokens
  const colors = ["#16a34a", "#22c55e", "#34d399", "#86efac", "#c7f9d1"];
  const highlightColor = "#065f46";

  // dimensions
  const height = Math.max(180, chartData.length * 56); // comfortable rows

  // small helpers
  const truncate = (s, n = 32) => (typeof s === "string" && s.length > n ? s.slice(0, n - 1) + "…" : s);
  const formatNumber = (v) => (typeof v === "number" ? v.toLocaleString() : v);

  // Render Y tick: "1. Product name…" with full name in <title>
  const renderYAxisTick = ({ x, y, payload }) => {
    const full = payload?.value ?? "";
    // try to detect rank from payload.payload (our prepared object)
    const rank = payload?.payload?.rank ?? null;
    const label = truncate(full, 32);
    return (
      <g transform={`translate(${x},${y})`}>
        <title>{full}</title>
        <text x={6} y={6} fontSize={13} fill="currentColor" style={{ pointerEvents: "none", fontWeight: 700 }}>
          {rank ? `${rank}. ${label}` : label}
        </text>
      </g>
    );
  };

  // Tooltip shows qty and percent-of-top
  const tooltipFormatter = (value) => {
    const pct = Math.round((value / maxQty) * 100);
    return [`${formatNumber(value)}`, `${pct}% of top`];
  };

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 6, right: 12, left: 8, bottom: 6 }}
          barCategoryGap="22%"
        >
          {/* numeric axis hidden but domain set to maxQty so bars fill proportionally */}
          <XAxis type="number" hide domain={[0, maxQty]} />

          {/* label column — increased width so names have room but not too wide */}
          <YAxis
            type="category"
            dataKey="name"
            width={160} /* tweak this to 180/200 if you have very long product names */
            tick={renderYAxisTick}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip formatter={tooltipFormatter} />

          {/* subtle background track so small values are visible relative to top */}
          <Bar dataKey="max" barSize={20} isAnimationActive={false} fill="#eef2f6" radius={[10, 10, 10, 10]} />

          {/* actual quantity bars */}
          <Bar dataKey="qty" barSize={20} isAnimationActive={false} radius={[10, 10, 10, 10]}>
            {/* numeric label on the right */}
            <LabelList
              dataKey="qty"
              position="right"
              formatter={(v) => formatNumber(v)}
              style={{ fontSize: 12, fill: "currentColor", fontWeight: 700 }}
              offset={8}
            />
            {chartData.map((entry, i) => {
              // because we reversed chartData, original order index = chartData.length - 1 - i
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
