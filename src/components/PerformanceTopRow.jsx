// src/components/PerformanceTopRow.jsx
import React, { useState, useCallback, useMemo } from "react";
import SummaryCard from "./SummaryCard";
import TopSellersChart from "./TopSellersChart";
import RepeatCustomersChart from "./RepeatCustomersChart";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Line,
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

  // Helper to format currency for tooltip / axis
  const formatKES = (v) => {
    if (v == null || Number.isNaN(Number(v))) return "KES 0";
    return "KES " + Number(v).toLocaleString("en-KE");
  };

  // Container uses flex-wrap so cards will wrap on small screens.
  // Each card cell uses minWidth: 0 so it can shrink safely (avoids overflow).
  return (
    <div
      className="performance-top-row"
      style={{
        display: "flex",
        gap: 12,
        marginBottom: 12,
        alignItems: "stretch",
        flexWrap: "wrap",
        width: "100%",
      }}
    >
      {/* Sales (prefer larger/growable) */}
      <div
        style={{
          flex: "2 1 360px", // allow this one to grow more, but still shrink
          minWidth: 0,
        }}
      >
        <SummaryCard
          title="Sales"
          value={metrics?.orders_count ?? 0}
          subtitle={`Revenue: ${metrics?.revenue ?? 0}`}
          /* preview sparkline intentionally removed to keep header metric-first */
          open={expandedKey === "sales"}
          onToggle={(open) => toggleKey(open ? "sales" : null)}
        >
          {/* Expanded content: stacked & synchronized charts */}
          <div style={{ width: "100%", height: 360 }}>
            {chartData && chartData.length ? (
              <>
                {/* Top chart: Orders (bars) */}
                <div style={{ height: 180, marginBottom: 8 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      syncId="salesSync"
                      margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(d) => (d?.slice ? d.slice(5) : d)}
                      />
                      <YAxis tick={{ fontSize: 11 }} label={{ value: "Orders", angle: -90, position: "insideLeft", offset: -6 }} />
                      <Tooltip formatter={(val, name) => [val, name]} />
                      <Bar dataKey="orders" name="Orders" fill="#16a34a" barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Bottom chart: Revenue (line) */}
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      syncId="salesSync"
                      margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(d) => (d?.slice ? d.slice(5) : d)}
                      />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => Number(v).toLocaleString()} label={{ value: "Revenue (KES)", angle: -90, position: "insideLeft", offset: -6 }} />
                      <Tooltip
                        formatter={(val, name) => {
                          if (name === "revenue") return [formatKES(val), "Revenue"];
                          return [val, name];
                        }}
                      />
                      <Legend verticalAlign="top" align="right" height={24} />
                      <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#0f172a" strokeWidth={2} dot={false} />
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

      {/* Best sellers */}
      <div
        style={{
          flex: "1 1 280px",
          minWidth: 0,
        }}
      >
        <SummaryCard
          title="Best sellers (top 5)"
          value={topSeller ? topSeller.name : "—"}
          subtitle={topSeller ? `${topSeller.qty_sold} sold` : "No sales"}
          /* preview sparkline intentionally removed to keep header metric-first */
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

      {/* Repeat customers */}
      <div
        style={{
          flex: "1 1 260px",
          minWidth: 0,
        }}
      >
        <SummaryCard
          title="Repeat customers"
          value={`${metrics?.repeat_stats?.repeat_pct ?? 0}%`}
          subtitle={`${metrics?.repeat_stats?.repeat_count ?? 0} repeat / ${metrics?.repeat_stats?.unique_customers ?? 0} unique`}
          /* preview sparkline intentionally removed to keep header metric-first */
          open={expandedKey === "repeat"}
          onToggle={(open) => toggleKey(open ? "repeat" : null)}
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
  );
}
