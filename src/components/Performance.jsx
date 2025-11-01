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

  // Styles for horizontal layout
  const rowStyle = {
    display: "flex",
    gap: 12,
    alignItems: "stretch",
    overflowX: "auto",
    paddingBottom: 6,
  };

  const cardStyle = {
    minWidth: 320,
    flex: "0 0 320px",
  };

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

      {/* Filter pill */}
      {selectedItem && (
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "#e7f7ec", color: "#0e6b2e", padding: "6px 10px", borderRadius: 999, fontWeight: 700 }}>
            Filtering: {selectedItem}
          </div>
          <button className="btn-outline" onClick={() => setSelectedItem(null)}>
            Clear
          </button>
        </div>
      )}

      {/* Horizontal cards row */}
      <div style={rowStyle}>
        {/* Sales card */}
        <div className="formBox" style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Sales</h3>
          {loading ? (
            <div>Loading…</div>
          ) : error ? (
            <div style={{ color: "red" }}>{error}</div>
          ) : metrics ? (
            <>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{metrics.orders_count ?? 0}</div>
              <div style={{ color: "#6b7280" }}>
                Revenue: {metrics.revenue ?? 0}
              </div>

              <div style={{ marginTop: 12 }}>
                <small style={{ color: "#6b7280" }}>Sales time series</small>

                {chartData.length ? (
                  <div style={{ width: "100%", height: 140, marginTop: 8 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 8, right: 40, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(d) => {
                            // show MM-DD for compactness
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
                  </div>
                ) : (
                  <div style={{ marginTop: 8, color: "#9aa3ab" }}>No timeseries data</div>
                )}
              </div>
            </>
          ) : (
            <div>No data</div>
          )}
        </div>

        {/* Best sellers */}
        <div className="formBox" style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Best sellers</h3>
          {loading ? (
            <div>Loading…</div>
          ) : error ? (
            <div style={{ color: "red" }}>{error}</div>
          ) : metrics ? (
            <>
              <ul style={{ paddingLeft: 18 }}>
                {(metrics.best_sellers && metrics.best_sellers.length) ? metrics.best_sellers.map((it, idx) => (
                  <li
                    key={idx}
                    style={{
                      marginBottom: 6,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 6px",
                      borderRadius: 8,
                      background: selectedItem === it.name ? "#f0fbf3" : "transparent"
                    }}
                    onClick={() => setSelectedItem(it.name)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedItem(it.name); }}
                  >
                    <span><strong>{it.name}</strong> — {it.qty_sold}</span>
                    <button className="btn-outline" onClick={(ev) => { ev.stopPropagation(); setSelectedItem(it.name); }}>
                      Filter
                    </button>
                  </li>
                )) : <li style={{ color: "#9aa3ab" }}>No data</li>}
              </ul>
            </>
          ) : null}
        </div>

        {/* Repeat customers */}
        <div className="formBox" style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Repeat customers</h3>
          {loading ? (
            <div>Loading…</div>
          ) : error ? (
            <div style={{ color: "red" }}>{error}</div>
          ) : metrics ? (
            <>
              <div style={{ fontSize: 24, fontWeight: 700 }}>
                {metrics.repeat_stats?.repeat_pct ?? 0}% 
              </div>
              <div style={{ color: "#6b7280" }}>
                {metrics.repeat_stats?.repeat_count ?? 0} repeat buyers — {metrics.repeat_stats?.unique_customers ?? 0} unique buyers
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
