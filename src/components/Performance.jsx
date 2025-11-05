// src/components/Performance.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { fetchPerformance } from "../lib/metricsClient";
import PerformanceTopRow from "./PerformanceTopRow";
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
import { formatCurrency, formatNumber } from "../lib/formatters";

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

  // Carousel state for mobile
  const carouselRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.matchMedia("(max-width:640px)").matches : false
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [slidesCount, setSlidesCount] = useState(1);

  // For debouncing and guarding repeated writes
  const lastWidthRef = useRef(0);
  const debounceTimerRef = useRef(null);
  const pendingReflowRef = useRef(false);

  // Fullscreen modal state
  const [fullscreenKey, setFullscreenKey] = useState(null); // 'sales' | null

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
      orders: typeof p.orders === "number" ? p.orders : Number(p.orders || 0),
      revenue: typeof p.revenue === "number" ? p.revenue : Number(p.revenue || 0),
    }));
  }, [metrics]);

  // --- Fullscreen modal helpers ---
  useEffect(() => {
    // prevent body scroll while modal open
    if (fullscreenKey) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev || "";
      };
    }
    return undefined;
  }, [fullscreenKey]);

  const openFullscreen = (key) => setFullscreenKey(key);
  const closeFullscreen = () => setFullscreenKey(null);

  // Render a full-screen modal; small, focused, inline-styled to avoid CSS edits.
  const FullScreenPerformanceModal = ({ onClose, chartDataLocal, metricsLocal }) => {
    // compute augmented data similar to PerformanceTopRow
    const chartDataAug = (() => {
      if (!Array.isArray(chartDataLocal) || chartDataLocal.length === 0) return [];
      const normalized = chartDataLocal.map((p) => ({
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
    })();

    // keyboard: close on Escape
    useEffect(() => {
      const onKey = (e) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const currencyCode = metricsLocal?.currency || "KES";

    return (
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 12000,
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
          background: "rgba(0,0,0,0.46)",
          padding: 20,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1100,
            background: "white",
            borderRadius: 12,
            boxShadow: "0 16px 48px rgba(2,6,23,0.4)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: "100vh",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: 16, alignItems: "center", borderBottom: "1px solid rgba(15,23,42,0.04)" }}>
            <div>
              <h3 style={{ margin: 0 }}>Sales — Detailed view</h3>
              <div style={{ color: "#6b7280", fontSize: 13 }}>
                Orders: <strong>{metricsLocal?.orders_count ?? 0}</strong> — Revenue: <strong>{formatCurrency(metricsLocal?.revenue ?? 0, currencyCode)}</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onClose} className="btn-outline" style={{ alignSelf: "center" }}>Close</button>
            </div>
          </div>

          <div style={{ padding: 16, overflow: "auto" }}>
            {chartDataAug && chartDataAug.length ? (
              <>
                <div style={{ height: 340, marginBottom: 16 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartDataAug}
                      syncId="fsalesSync"
                      margin={{ top: 8, right: 40, left: 0, bottom: 6 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(d) => (d?.slice ? d.slice(5) : d)}
                      />
                      <YAxis tick={{ fontSize: 12 }} label={{ value: "Orders", angle: -90, position: "insideLeft", offset: -6 }} />
                      <Tooltip formatter={(val, name) => (name === "maOrders" ? [Math.round(val), "7d avg"] : [val, name])} />
                      <Bar dataKey="maxOrders" barSize={20} fill="#eef2f6" radius={[8, 8, 8, 8]} />
                      <Bar dataKey="orders" name="Orders" fill="#16a34a" barSize={12} radius={[6, 6, 6, 6]} />
                      <Line type="monotone" dataKey="maOrders" name="7d avg" stroke="#0ea5a4" strokeWidth={2} dot={false} />
                      <Legend verticalAlign="top" align="right" height={24} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartDataAug}
                      syncId="fsalesSync"
                      margin={{ top: 8, right: 40, left: 0, bottom: 6 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} tickFormatter={(d) => (d?.slice ? d.slice(5) : d)} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v)} label={{ value: `Revenue (${currencyCode})`, angle: -90, position: "insideLeft", offset: -6 }} />
                      <Tooltip formatter={(val, name) => (name === "revenue" ? [formatCurrency(val, currencyCode), "Revenue"] : [val, name])} />
                      <Legend verticalAlign="top" align="right" height={24} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" fill="#c7f9d1" stroke="#0f172a" strokeWidth={2} fillOpacity={0.6} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div style={{ padding: 12, color: "#9aa3ab" }}>No timeseries data</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ---- the rest of Performance.jsx is unchanged (carousel logic below) ----

  // small helpers
  const getVisibleWidth = (el) => {
    if (!el) return 0;
    try {
      const rect = el.getBoundingClientRect();
      const w = Math.floor(rect.width || el.clientWidth || document.documentElement.clientWidth || window.innerWidth || 0);
      return Math.max(0, w);
    } catch (err) {
      return el.clientWidth || document.documentElement.clientWidth || window.innerWidth || 0;
    }
  };

  const safeSnapTo = (index = 0, instant = true) => {
    const el = carouselRef.current;
    if (!el) return;
    const width = getVisibleWidth(el);
    const clamped = Math.min(Math.max(0, index), Math.max(0, el.children.length - 1));
    if (width <= 0) {
      el.scrollLeft = clamped * (el.offsetWidth || 0);
      setActiveIndex(clamped);
      return;
    }
    try {
      el.scrollTo({ left: clamped * width, behavior: instant ? "auto" : "smooth" });
      setActiveIndex(clamped);
    } catch {
      el.scrollLeft = clamped * width;
      setActiveIndex(clamped);
    }
  };

  useEffect(() => {
    const mq = window.matchMedia("(max-width:640px)");
    const handle = (ev) => setIsMobile(ev.matches);
    if (mq.addEventListener) mq.addEventListener("change", handle);
    else mq.addListener(handle);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handle);
      else mq.removeListener(handle);
    };
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    if (!isMobile) {
      el.style.height = "";
      return;
    }
    let headerHeight = 56;
    const headerEl = document.querySelector("header") || document.querySelector(".header");
    if (headerEl && typeof headerEl.offsetHeight === "number") headerHeight = headerEl.offsetHeight;
    el.style.height = `calc(100vh - ${headerHeight}px)`;
    el.style.boxSizing = "border-box";
  }, [isMobile]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    let destroyed = false;

    const doReflow = () => {
      if (destroyed) return;
      if (!el) return;

      if (!isMobile) {
        Array.from(el.children).forEach((c) => {
          c.style.flex = "";
          c.style.minWidth = "";
          c.style.boxSizing = "";
          c.style.height = "";
          c.style.scrollSnapAlign = "";
          c.style.margin = "";
        });
        el.style.display = "";
        el.style.overflowX = "";
        el.style.scrollSnapType = "";
        el.style.webkitOverflowScrolling = "";
        el.style.scrollBehavior = "";
        setSlidesCount(el.children.length || 1);
        setActiveIndex(0);
        safeSnapTo(0, true);
        lastWidthRef.current = 0;
        return;
      }

      const visibleWidth = getVisibleWidth(el);
      const last = lastWidthRef.current || 0;
      if (Math.abs(visibleWidth - last) <= 2 && visibleWidth > 0) {
        setSlidesCount(el.children.length || 1);
        const idx = Math.round(el.scrollLeft / Math.max(1, visibleWidth));
        setActiveIndex(Math.min(Math.max(0, idx), Math.max(0, el.children.length - 1)));
        pendingReflowRef.current = false;
        return;
      }

      lastWidthRef.current = visibleWidth;

      el.style.display = "flex";
      el.style.overflowX = "auto";
      el.style.scrollSnapType = "x mandatory";
      el.style.webkitOverflowScrolling = "touch";
      el.style.scrollBehavior = "smooth";

      const slideWidth = Math.max(1, visibleWidth);
      Array.from(el.children).forEach((c) => {
        const desiredFlex = `0 0 ${slideWidth}px`;
        if (c.style.flex !== desiredFlex) c.style.flex = desiredFlex;
        if (c.style.minWidth !== `${slideWidth}px`) c.style.minWidth = `${slideWidth}px`;
        if (c.style.boxSizing !== "border-box") c.style.boxSizing = "border-box";
        if (c.style.height !== "100%") c.style.height = "100%";
        if (c.style.scrollSnapAlign !== "start") c.style.scrollSnapAlign = "start";
        if (c.style.margin !== "0") c.style.margin = "0";
      });

      setSlidesCount(el.children.length || 1);

      const idx = Math.round(el.scrollLeft / Math.max(1, visibleWidth));
      const misaligned = Math.abs(el.scrollLeft - idx * visibleWidth) > Math.max(6, visibleWidth * 0.06);
      if (misaligned) {
        safeSnapTo(idx, true);
      }

      pendingReflowRef.current = false;
    };

    const scheduleReflow = () => {
      if (pendingReflowRef.current) return;
      pendingReflowRef.current = true;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        window.requestAnimationFrame(doReflow);
      }, 120);
    };

    scheduleReflow();

    let ro;
    try {
      ro = new ResizeObserver(() => {
        scheduleReflow();
      });
      ro.observe(el);
      ro.observe(document.documentElement);
    } catch (err) {
      window.addEventListener("resize", scheduleReflow);
    }

    const onOrientation = () => scheduleReflow();
    window.addEventListener("orientationchange", onOrientation);

    return () => {
      destroyed = true;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      pendingReflowRef.current = false;
      try {
        if (ro && typeof ro.disconnect === "function") ro.disconnect();
      } catch {}
      window.removeEventListener("resize", scheduleReflow);
      window.removeEventListener("orientationchange", onOrientation);
    };
  }, [isMobile, metrics]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el || !isMobile) return;
    let raf = null;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const visibleWidth = getVisibleWidth(el);
        const idx = Math.round(el.scrollLeft / Math.max(1, visibleWidth));
        setActiveIndex(idx);
        raf = null;
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isMobile]);

  const scrollToIndex = (index) => {
    const el = carouselRef.current;
    if (!el) return;
    const width = getVisibleWidth(el);
    el.scrollTo({ left: index * width, behavior: "smooth" });
    setActiveIndex(index);
  };

  const handleCarouselKey = (e) => {
    if (!isMobile) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollToIndex(Math.max(0, activeIndex - 1));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollToIndex(Math.min(slidesCount - 1, activeIndex + 1));
    }
  };

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

      <div style={{ position: "relative" }}>
        <div
          ref={carouselRef}
          className="perf-carousel"
          role="region"
          aria-label="Performance cards"
          tabIndex={0}
          onKeyDown={handleCarouselKey}
        >
          <PerformanceTopRow
            metrics={metrics || {}}
            chartData={chartData}
            onSelectItem={(name) => setSelectedItem(name)}
            selectedItem={selectedItem}
            asSlides={isMobile}
            onRequestFullScreen={(key) => {
              // only support 'sales' for now — but generic param is passed
              if (key === "sales") openFullscreen("sales");
            }}
          />
        </div>

        <div className="perf-dots" aria-hidden={!isMobile} style={{ display: isMobile ? "flex" : "none", gap: 6, justifyContent: "center", marginTop: 8 }}>
          {Array.from({ length: slidesCount }).map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className={`perf-dot ${i === activeIndex ? "perf-dot-active" : ""}`}
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                padding: 0,
                border: "none",
                background: i === activeIndex ? "#111827" : "#e5e7eb",
              }}
            />
          ))}
        </div>
      </div>

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

      {/* Fullscreen modal (rendered at top-level of this component so it can access chartData & metrics) */}
      {fullscreenKey === "sales" && (
        <FullScreenPerformanceModal onClose={closeFullscreen} chartDataLocal={chartData} metricsLocal={metrics || {}} />
      )}
    </div>
  );
}
