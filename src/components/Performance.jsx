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

  const load = async (d) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPerformance(d);
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
    load(days);
  }, [days]);

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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
        {/* Sales card */}
        <div className="formBox">
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
        <div className="formBox">
          <h3 style={{ marginTop: 0 }}>Best sellers</h3>
          {loading ? (
            <div>Loading…</div>
          ) : error ? (
            <div style={{ color: "red" }}>{error}</div>
          ) : metrics ? (
            <>
              <ul style={{ paddingLeft: 18 }}>
                {(metrics.best_sellers && metrics.best_sellers.length) ? metrics.best_sellers.map((it, idx) => (
                  <li key={idx}>
                    <strong>{it.name}</strong> — {it.qty_sold}
                  </li>
                )) : <li style={{ color: "#9aa3ab" }}>No data</li>}
              </ul>
            </>
          ) : null}
        </div>

        {/* Repeat customers */}
        <div className="formBox">
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
