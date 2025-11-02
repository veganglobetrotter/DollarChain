// src/components/Performance.jsx
import React, { useEffect, useState, useMemo } from "react";
import { fetchPerformance } from "../lib/metricsClient";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

import TopSellersChart from "./TopSellersChart";
import RepeatCustomersChart from "./RepeatCustomersChart";
import SummaryCard from "./SummaryCard";

const TIMEFRAMES = [
  { label: "7D", days: 7 },
  { label: "28D", days: 28 },
  { label: "90D", days: 90 },
  { label: "365D", days: 365 },
];

export default function Performance() {
  const [days, setDays] = useState(28);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const load = async (d, itemName = null) => {
    setLoading(true);
    setError(null);
    try {
      // fetchPerformance should accept (days, itemName) — RPC updated to accept item_name
      const res = await fetchPerformance(d, itemName);
      setMetrics(res);
    } catch (err) {
      console.error("fetchPerformance error:", err);
      setError(err.message || String(err));
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(days, selectedItem);
  }, [days, selectedItem]);

  // Prepare chart data (safely convert strings to numbers)
  const chartData = useMemo(() => {
    if (!metrics?.timeseries || !Array.isArray(metrics.timeseries)) return [];
    return metrics.timeseries.map((p) => ({
      day: p.day,
      // ensure numeric values
      orders: typeof p.orders === "number" ? p.orders : Number(p.orders || 0),
      revenue: typeof p.revenue === "number" ? p.revenue : Number(p.revenue || 0),
    }));
  }, [metrics]);

  // Build small sparkline arrays for summary cards (take revenue)
  const sparkRevenue = useMemo(() => {
    if (!chartData || !chartData.length) return [];
    return chartData.map((d) => d.revenue || 0).slice(-12);
  }, [chartData]);

  const sparkOrders = useMemo(() => {
    if (!chartData || !chartData.length) return [];
    return chartData.map((d) => d.orders || 0).slice(-12);
  }, [chartData]);

  // Extract best seller top item for summary value
  const topSeller = (metrics?.best_sellers && metrics.best_sellers.length) ? metrics.best_sellers[0] : null;

  // Layout styles (kept inline here so CSS remains the single source of visual truth)
  const summaryCardStyle = { flex: "1 1 0", minWidth: 260 };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Performance</h2>
          <div style={{ color: "#6b7280", fontSize: 13 }}>Overview of store performance</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {TIMEFRAMES.map((t) => (
            <button
              key={t.days}
              className={t.days === days ? "btn-primary" : "btn-outline"}
              onClick={() => setDays(t.days)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top summary row (expandable cards) */}
      <div className="summary-row" style={{ marginBottom: 12 }}>
        <div style={summaryCardStyle}>
          <SummaryCard
            title="Sales"
            value={metrics?.orders_count ?? 0}
            subtitle={`Revenue: ${metrics?.revenue ?? 0}`}
            delta={null}
            sparklineData={sparkRevenue.length ? sparkRevenue : sparkOrders}
          >
            {/* Expanded content: full sales chart */}
            <div style={{ width: "100%", height: 260 }}>
              {chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 12, right: 40, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(d) => {
                        try {
                          return d.slice(5);
                        } catch {
                          return d;
                        }
                      }}
                    />
                    <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "revenue") return [value, "Revenue"];
                        if (name === "orders") return [value, "Orders"];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend verticalAlign="top" align="right" height={24} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="orders"
                      stroke="#1a8917"
                      strokeWidth={2}
                      dot={false}
                      name="Orders"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#64748b"
                      strokeWidth={2}
                      dot={false}
                      name="Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: 12, color: "#9aa3ab" }}>No timeseries data</div>
              )}
            </div>
          </SummaryCard>
        </div>

        <div style={{ ...summaryCardStyle, maxWidth: 420 }}>
          <SummaryCard
            title="Best sellers (top 5)"
            value={topSeller ? topSeller.name : "—"}
            subtitle={topSeller ? `${topSeller.qty_sold} sold` : "No sales"}
            sparklineData={metrics?.best_sellers?.slice(0,5).map(b => Number(b.qty_sold || 0)) || []}
          >
            {/* Expanded content: top sellers chart (bar/horizontal) */}
            <div style={{ paddingTop: 6 }}>
              <TopSellersChart
                data={metrics?.best_sellers ?? []}
                onSelect={(name) => setSelectedItem(name)}
                highlightName={selectedItem}
              />
            </div>
          </SummaryCard>
        </div>

        <div style={{ ...summaryCardStyle, maxWidth: 360 }}>
          <SummaryCard
            title="Repeat customers"
            value={`${metrics?.repeat_stats?.repeat_pct ?? 0}%`}
            subtitle={`${metrics?.repeat_stats?.repeat_count ?? 0} repeat / ${metrics?.repeat_stats?.unique_customers ?? 0} unique`}
            sparklineData={metrics?.repeat_customers?.slice(0,8).map(r => Number(r.count || 0)) || []}
          >
            <div style={{ paddingTop: 6 }}>
              <RepeatCustomersChart
                repeatCustomers={metrics?.repeat_customers ?? []}
                repeatPct={metrics?.repeat_stats?.repeat_pct ?? 0}
              />
            </div>
          </SummaryCard>
        </div>
      </div>

      {/* Filter pill (kept for item filtering) */}
      {selectedItem && (
        <div style={{ marginTop: 6, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "#e7f7ec", color: "#0e6b2e", padding: "6px 10px", borderRadius: 999, fontWeight: 700 }}>
            Filtering: {selectedItem}
          </div>
          <button className="btn-outline" onClick={() => setSelectedItem(null)}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
