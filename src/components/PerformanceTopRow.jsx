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

/**
 * PerformanceTopRow
 * Props:
 * - metrics: object returned from RPC (orders_count, revenue, timeseries, best_sellers, repeat_stats, repeat_customers)
 * - chartData: prepared timeseries array [{day, orders, revenue}, ...]
 * - onSelectItem(name) -> called when best-seller clicked
 * - selectedItem -> currently selected item name
 */
export default function PerformanceTopRow({
  metrics = {},
  chartData = [],
  onSelectItem = () => {},
  selectedItem,
}) {
  const [expandedKey, setExpandedKey] = useState(null); // "sales" | "sellers" | "repeat" | null

  // stable toggle handler (keeps logic same as before)
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

  // Currency formatting helper (supports metrics.currency when provided).
  // Uses simple prefix like "KES 1,234" for now — this keeps it consistent across markets.
  const currencyCode = metrics?.currency || "KES";
  const formatCurrency = (v) => {
    if (v == null || Number.isNaN(Number(v))) return `${currencyCode} 0`;
    return `${currencyCode} ${Number(v).toLocaleString()}`;
  };

  // Build augmented chart data (add max and 7-day moving average for orders).
  const chartDataAug = useMemo(() => {
    if (!Array.isArray(chartData) || chartData.length === 0) return [];

    // Ensure numeric coercion and stable sort by day order (assumes chartData is already ordered by day).
    const normalized = chartData.map((p) => ({
      day: p.day,
      orders: typeof p.orders === "number" ? p.orders : Number(p.orders || 0),
      revenue: typeof p.revenue === "number" ? p.revenue : Number(p.revenue || 0),
    }));

    // compute max orders for the background track
    const maxOrders = Math.max(...normalized.map((r) => r.orders), 1);

    // compute 7-day simple moving average for orders
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

  // Root uses the CSS grid helper .performance-top-row (defined in src/index.css).
  // Each immediate child keeps minWidth:0 so it can shrink safely in the grid.
  return (
    <div className="performance-top-row">
      {/* Sales (grid cell) */}
      <div style={{ minWidth: 0 }}>
        <SummaryCard
          title="Sales"
          value={metrics?.orders_count ?? 0}
          subtitle={`Revenue: ${formatCurrency(metrics?.revenue ?? 0)}`}
          open={expandedKey === "sales"}
          onToggle={(open) => toggleKey(open ? "sales" : null)}
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
                        tickFormatter={(v) => Number(v).toLocaleString()}
                        label={{ value: `Revenue (${currencyCode})`, angle: -90, position: "insideLeft", offset: -6 }}
                      />
                      <Tooltip
                        formatter={(val, name) => {
                          if (name === "revenue") return [formatCurrency(val), "Revenue"];
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
      </div>

      {/* Best sellers (grid cell) */}
      <div style={{ minWidth: 0 }}>
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
                // keep the sellers card open when selecting
                setExpandedKey("sellers");
              }}
              highlightName={selectedItem}
            />
          </div>
        </SummaryCard>
      </div>

      {/* Repeat customers (grid cell) */}
      <div style={{ minWidth: 0 }}>
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
                // forward selection to parent handler and keep card open
                onSelectItem?.(name);
                setExpandedKey("repeat");
              }}
            />
          </div>
        </SummaryCard>
      </div>
    </div>
  );
}
