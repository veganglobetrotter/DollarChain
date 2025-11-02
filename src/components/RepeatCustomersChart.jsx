// src/components/RepeatCustomersChart.jsx
import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

/**
 * Props:
 * - repeatCustomers: [{ buyer, label, buyer_phone, count, orders }]
 * - repeatPct: number (0-100)
 */
export default function RepeatCustomersChart({ repeatCustomers = [], repeatPct = 0 }) {
  // normalize top repeat buyers (label or buyer or phone)
  const top = useMemo(() => {
    const arr = (Array.isArray(repeatCustomers) ? repeatCustomers : []).map((r) => ({
      label: r.label || r.buyer || r.buyer_phone || r.name || "Customer",
      count: Number(r.count ?? r.orders ?? r.qty ?? 0),
    }));
    return arr.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [repeatCustomers]);

  const barData = top.map((r) => ({ buyer: r.label, orders: r.count }));

  const donutData = [
    { name: "Repeat", value: Number(repeatPct || 0) },
    { name: "One-time", value: Math.max(0, 100 - Number(repeatPct || 0)) },
  ];

  const colors = ["#16a34a", "#e6eef1"];

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", width: "100%" }}>
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
              paddingAngle={2}
              isAnimationActive={true}
            >
              {donutData.map((entry, idx) => (
                <Cell key={idx} fill={colors[idx % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v, name) => [`${v}%`, name]} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ textAlign: "center", fontSize: 12, color: "#6b7280", marginTop: 6 }}>
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
              <Bar dataKey="orders" fill="#60a5fa" barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: "#9aa3ab", paddingTop: 10 }}>No repeat buyers yet</div>
        )}
      </div>
    </div>
  );
}
