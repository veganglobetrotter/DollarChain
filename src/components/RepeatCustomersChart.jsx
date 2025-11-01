// src/components/RepeatCustomersChart.jsx
import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

/**
 * Props:
 * - repeatCustomers: [{ buyer, orders }]
 * - repeatPct: number (0-100)
 */
export default function RepeatCustomersChart({ repeatCustomers = [], repeatPct = 0 }) {
  const top = (Array.isArray(repeatCustomers) ? repeatCustomers : []).slice(0, 5);
  const barData = top.map((r) => ({ buyer: r.buyer, orders: Number(r.orders || 0) }));

  const donutData = [
    { name: "Repeat", value: Number(repeatPct || 0) },
    { name: "Unique", value: Math.max(0, 100 - Number(repeatPct || 0)) },
  ];

  const colors = ["#16a34a", "#e6eef1"];

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ flex: "0 0 110px", height: 110 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={donutData}
              dataKey="value"
              innerRadius={28}
              outerRadius={44}
              startAngle={90}
              endAngle={-270}
            >
              {donutData.map((entry, idx) => (
                <Cell key={idx} fill={colors[idx % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{ textAlign: "center", fontSize: 12, color: "#6b7280" }}>
          Repeat {String(repeatPct ?? 0)}%
        </div>
      </div>

      <div style={{ flex: 1, height: 110 }}>
        {barData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="buyer" type="category" width={120} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [v, "Orders"]} />
              <Bar dataKey="orders" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: "#9aa3ab", paddingTop: 10 }}>No repeat buyers yet</div>
        )}
      </div>
    </div>
  );
}
