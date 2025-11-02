// src/components/Performance.jsx
import React, { useEffect, useState, useMemo } from "react";
import { fetchPerformance } from "../lib/metricsClient";
import PerformanceTopRow from "./PerformanceTopRow";
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

import PerformanceTopRow from "./PerformanceTopRow";

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

      {/* Top summary row (replaced by PerformanceTopRow) */}
      <PerformanceTopRow
        metrics={metrics || {}}
        chartData={chartData}
        onSelectItem={(name) => setSelectedItem(name)}
        selectedItem={selectedItem}
      />

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

      {/* (If you plan to keep a detailed row below, we can leave it here later) */}
    </div>
  );
}
