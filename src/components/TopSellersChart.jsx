// src/components/TopSellersChart.jsx
import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

/**
 * Props:
 * - data: [{ name, qty_sold }]
 * - onSelect(name)
 * - highlightName (optional)
 */
export default function TopSellersChart({ data = [], onSelect = () => {}, highlightName = null }) {
  const top5 = (Array.isArray(data) ? data : []).slice(0, 5);

  // Ensure numeric
  const chartData = top5.map((d) => ({ name: d.name, value: Number(d.qty_sold || 0) }));

  const colors = ["#16a34a", "#22c55e", "#60a5fa", "#93c5fd", "#c7f9d8"];

  return (
    <div style={{ width: "100%", height: 160 }}>
      {chartData.length === 0 ? (
        <div style={{ color: "#9aa3ab", padding: 12 }}>No best sellers yet</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
          >
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => [v, "Qty"]} />
            <Bar dataKey="value" onClick={(d) => onSelect(d.name)} isAnimationActive={true}>
              {chartData.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={entry.name === highlightName ? "#14532d" : colors[i % colors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
