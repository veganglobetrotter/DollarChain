// src/components/TopSellersChart.jsx
import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

/**
 * Props:
 * - data: [{ name, qty_sold }]
 * - onSelect(name)
 * - highlightName (optional)
 */
export default function TopSellersChart({ data = [], onSelect = () => {}, highlightName = null }) {
  // Build rows: map, coerce numeric, sort desc, take top5, then reverse so smallest appears at top
  const rows = useMemo(() => {
    const arr = (Array.isArray(data) ? data : []).map((d) => ({
      name: d.name || d.label || d.product || "Unknown",
      qty: Number(d.qty_sold ?? d.qty ?? d.count ?? 0),
    }));
    return arr
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
      .reverse();
  }, [data]);

  const colors = ["#16a34a", "#22c55e", "#34d399", "#86efac", "#c7f9d1"];

  const height = Math.max(160, rows.length * 40);

  return (
    <div style={{ width: "100%", height }}>
      {rows.length === 0 ? (
        <div style={{ color: "#9aa3ab", padding: 12 }}>No best sellers yet</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 6, right: 8, left: 8, bottom: 6 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip formatter={(v) => [v, "Sold"]} />
            <Bar
              dataKey="qty"
              barSize={14}
              isAnimationActive={true}
              onClick={(payload) => onSelect?.(payload?.name)}
            >
              {rows.map((entry, i) => {
                const isSelected = highlightName && highlightName === entry.name;
                return (
                  <Cell
                    key={`cell-${i}`}
                    fill={isSelected ? "#065f46" : colors[i % colors.length]}
                    cursor={onSelect ? "pointer" : "default"}
                    opacity={isSelected ? 1 : 0.95}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
