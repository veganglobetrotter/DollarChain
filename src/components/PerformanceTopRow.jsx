// src/components/PerformanceTopRow.jsx
import React, { useState, useCallback, useMemo } from "react";
import SummaryCard from "./SummaryCard";
import TopSellersChart from "./TopSellersChart";
import RepeatCustomersChart from "./RepeatCustomersChart";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

// use centralized formatters
import { formatCurrency, formatNumber } from "../lib/formatters";

/**
 * PerformanceTopRow
 * Props:
 * - metrics, chartData, onSelectItem, selectedItem, asSlides
 * - NEW: onRequestFullScreen (fn) — passed down from parent to open modal for a key
 */
export default function PerformanceTopRow({
  metrics = {},
  chartData = [],
  onSelectItem = () => {},
  selectedItem,
  asSlides = false,
  onRequestFullScreen = null, // new optional
}) {
  const [expandedKey, setExpandedKey] = useState(null); // "sales" | "sellers" | "repeat" | null

  const toggleKey = useCallback((key) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  const topSeller = useMemo(
    () =>
      metrics?.best_sellers && metrics.best_sellers.length
        ? metrics.best_sellers[0]
        : null,
    [metrics]
  );

  const currencyCode = metrics?.currency || "KES";

  // Build augmented chart data (add max and 7-day moving average for orders).
  const chartDataAug = useMemo(() => {
    if (!Array.isArray(chartData) || chartData.length === 0) return [];

    const normalized = chartData.map((p) => ({
      day: p.day,
      orders: typeof p.orders === "number" ? p.orders : Number(p.orders || 0),
      revenue: typeof p.revenue === "number" ? p.revenue : Number(p.revenue || 0),
    }));

    const maxOrders = Math.max(...normalized.map((r) => r.orders), 1);

    const window = 7;
    const ma = [];
    for (let i = 0; i < normalized.length; i += 1) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - (window - 1)); j <= i; j += 1) {
        sum += normalized[j].orders;
        count += 1;
      }
      ma.push(count > 0 ? sum / count : 0);
    }

    return normalized.map((row, idx) => ({
      ...row,
      maxOrders,
      maOrders: Number.isFinite(ma[idx]) ? +ma[idx].toFixed(2) : 0,
    }));
  }, [chartData]);

  // --- Normalized combined series for small preview (percent-of-max per series) ---
  const combinedNormalized = useMemo(() => {
    if (!Array.isArray(chartDataAug) || chartDataAug.length === 0) return [];

    const maxOrders = Math.max(...chartDataAug.map((r) => r.orders), 1);
    const maxRevenue = Math.max(...chartDataAug.map((r) => r.revenue), 1);

    return chartDataAug.map((r) => ({
      day: r.day,
      scaledOrders: (r.orders / maxOrders) * 100,
      scaledRevenue: (r.revenue / maxRevenue) * 100,
      orders: r.orders,
      revenue: r.revenue,
    }));
  }, [chartDataAug]);

  // Build compact preview chart node for sales card (0..100 domain).
  const salesPreviewChart = useMemo(() => {
    if (!combinedNormalized || combinedNormalized.length === 0) {
      // tiny placeholder equal to the default summary-sparkline size
      return <div style={{ width: 36, height: 10 }} />;
    }

    // Use a small composited line chart (no dots) — 36px tall is the container in CSS
    return (
      <div style={{ width: 120, height: 36 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combinedNormalized} margin={{ top: 2, right: 6, left: 0, bottom: 2 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" hide />
            <YAxis domain={[0, 100]} hide />
            <Tooltip
              formatter={(val, name, payload) => {
                // Map normalized values back to original absolute values for tooltip
                if (!payload || !payload.payload) return [val, name];
                const p = payload.payload;
                if (name === "Scaled Orders") return [Math.round(p.orders), "Orders"];
                if (name === "Scaled Revenue") return [formatCurrency(p.revenue, currencyCode), "Revenue"];
                return [val, name];
              }}
            />
            <Line
              type="monotone"
              dataKey="scaledOrders"
              name="Scaled Orders"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
              strokeOpacity={0.95}
            />
            <Line
              type="monotone"
              dataKey="scaledRevenue"
              name="Scaled Revenue"
              stroke="#0ea5a4"
              strokeWidth={2}
              dot={false}
              strokeOpacity={0.9}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }, [combinedNormalized, currencyCode]);

  // Helper: render the three card cells as an array of elements (keeps code DRY)
  const renderCells = () => {
    return [
      /* Sales (grid cell / slide) */
      <div key="sales" style={{ minWidth: 0 }} className="perf-slide">
        <SummaryCard
          title="Sales"
          value={metrics?.orders_count ?? 0}
          subtitle={`${formatCurrency(metrics?.revenue ?? 0, currencyCode)}`}
          open={expandedKey === "sales"}
          onToggle={(open) => toggleKey(open ? "sales" : null)}
          previewChart={salesPreviewChart}
          onRequestFullScreen={() => {
            if (typeof onRequestFullScreen === "function") onRequestFullScreen("sales");
          }}
        >
          {/* Expanded content: stacked & synchronized charts (Orders top, Revenue bottom) */}
          <div className="chart-wrap" style={{ height: 380 }}>
            {chartDataAug && chartDataAug.length ? (
              <>
                {/* Top chart: Orders (background track, bars + 7-day MA line) */}
                <div className="chart-wrap" style={{ height: 200, marginBottom: 8 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartDataAug}
                      syncId="salesSync"
                      margin={{ top: 8, right: 40, left: 0, bottom: 6 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(d) => (d?.slice ? d.slice(5) : d)}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        label={{ value: "Orders", angle: -90, position: "insideLeft", offset: -6 }}
                      />
                      <Tooltip
                        formatter={(val, name) => {
                          if (name === "maOrders") return [Math.round(val), "7d avg"];
                          return [val, name];
                        }}
                      />

                      {/* background full-width track */}
                      <Bar dataKey="maxOrders" barSize={20} fill="#eef2f6" radius={[8, 8, 8, 8]} />

                      {/* actual orders bar */}
                      <Bar dataKey="orders" name="Orders" fill="#16a34a" barSize={12} radius={[6, 6, 6, 6]} />

                      {/* moving average line */}
                      <Line
                        type="monotone"
                        dataKey="maOrders"
                        name="7d avg"
                        stroke="#0ea5a4"
                        strokeWidth={2}
                        dot={false}
                      />

                      <Legend verticalAlign="top" align="right" height={24} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Bottom chart: Revenue (area) */}
                <div className="chart-wrap" style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartDataAug}
                      syncId="salesSync"
                      margin={{ top: 8, right: 40, left: 0, bottom: 6 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(d) => (d?.slice ? d.slice(5) : d)}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => formatNumber(v)}
                        label={{ value: `Revenue (${currencyCode})`, angle: -90, position: "insideLeft", offset: -6 }}
                      />
                      <Tooltip
                        formatter={(val, name) => {
                          if (name === "revenue") return [formatCurrency(val, currencyCode), "Revenue"];
                          return [val, name];
                        }}
                      />
                      <Legend verticalAlign="top" align="right" height={24} />

                      {/* revenue area (stronger visual weight) */}
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        fill="#c7f9d1"
                        stroke="#0f172a"
                        strokeWidth={2}
                        fillOpacity={0.6}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div style={{ padding: 12, color: "#9aa3ab" }}>No timeseries data</div>
            )}
          </div>
        </SummaryCard>
      </div>,

      /* Best sellers (grid cell / slide) */
      <div key="sellers" style={{ minWidth: 0 }} className="perf-slide">
        <SummaryCard
          title="Best sellers (top 5)"
          value={topSeller ? topSeller.name : "—"}
          subtitle={topSeller ? `${topSeller.qty_sold} sold` : "No sales"}
          open={expandedKey === "sellers"}
          onToggle={(open) => toggleKey(open ? "sellers" : null)}
        >
          <div style={{ paddingTop: 6 }}>
            <TopSellersChart
              data={metrics?.best_sellers ?? []}
              onSelect={(name) => {
                onSelectItem?.(name);
                setExpandedKey("sellers");
              }}
              highlightName={selectedItem}
            />
          </div>
        </SummaryCard>
      </div>,

      /* Repeat customers (grid cell / slide) */
      <div key="repeat" style={{ minWidth: 0 }} className="perf-slide">
        <SummaryCard
          title="Repeat customers"
          value={`${metrics?.repeat_stats?.repeat_pct ?? 0}%`}
          subtitle={`${metrics?.repeat_stats?.repeat_count ?? 0} repeat / ${metrics?.repeat_stats?.unique_customers ?? 0} unique`}
          open={expandedKey === "repeat"}
          onToggle={(open) => toggleKey(open ? "repeat" : null)}
        >
          <div style={{ paddingTop: 6 }}>
            <RepeatCustomersChart
              repeatCustomers={metrics?.repeat_customers ?? []}
              repeatPct={metrics?.repeat_stats?.repeat_pct ?? 0}
              onSelect={(name) => {
                onSelectItem?.(name);
                setExpandedKey("repeat");
              }}
            />
          </div>
        </SummaryCard>
      </div>,
    ];
  };

  if (asSlides) {
    return <>{renderCells()}</>;
  }

  return <div className="performance-top-row">{renderCells()}</div>;
}
