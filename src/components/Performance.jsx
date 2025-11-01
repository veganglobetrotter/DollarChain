// src/components/Performance.jsx
import React, { useEffect, useState } from "react";
import { fetchPerformance } from "../lib/metricsClient";

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
  const [selectedItem, setSelectedItem] = useState(null); // NEW: item filter

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

  // Styles for horizontal layout
  const rowStyle = {
    display: "flex",
    gap: 12,
    alignItems: "stretch",
    overflowX: "auto", // allow horizontal scroll on small screens
    paddingBottom: 6,
  };

  const cardStyle = {
    minWidth: 320, // ensures readable card width
    flex: "0 0 320px", // fixed base width, can be adjusted later
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
                <div style={{ height: 80, marginTop: 8, background: "#fbfbfb", borderRadius: 8, padding: 8 }}>
                  {/* Simple textual sparkline (replace with chart later) */}
                  {Array.isArray(metrics.timeseries) && metrics.timeseries.length ? (
                    <div style={{ fontSize: 12 }}>
                      {metrics.timeseries.map((p, idx) => (
                        <span key={idx} style={{ marginRight: 8 }}>
                          {p.day.split("-").slice(1).join("/")}: {p.orders}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "#9aa3ab" }}>No data</div>
                  )}
                </div>
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
