// src/components/Performance.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { fetchPerformance } from "../lib/metricsClient";
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

  // Carousel state for mobile
  const carouselRef = useRef(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.matchMedia("(max-width:640px)").matches : false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slidesCount, setSlidesCount] = useState(1);

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

  // Update isMobile on resize / orientation changes
  useEffect(() => {
    const mq = window.matchMedia("(max-width:640px)");
    const handle = (ev) => setIsMobile(ev.matches);
    // Some browsers fire change on addListener vs addEventListener; use addEventListener if available
    if (mq.addEventListener) mq.addEventListener("change", handle);
    else mq.addListener(handle);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handle);
      else mq.removeListener(handle);
    };
  }, []);

  // Ensure carousel fills visible area under header on mobile.
  // This is defensive: we try to find a header element and subtract its height from 100vh.
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    if (!isMobile) {
      // clear inline height when leaving mobile
      el.style.height = "";
      return;
    }

    // Try to detect header height
    let headerHeight = 56; // sensible default
    const headerEl = document.querySelector("header") || document.querySelector(".header");
    if (headerEl && typeof headerEl.offsetHeight === "number") {
      headerHeight = headerEl.offsetHeight;
    }

    // Set carousel height to fill remaining viewport under header
    el.style.height = `calc(100vh - ${headerHeight}px)`;
    // Ensure the element uses box-sizing to include padding if any
    el.style.boxSizing = "border-box";
  }, [isMobile]);

  // When mobile, convert immediate children of carouselRef into full-width slides.
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    // If not mobile, remove any inline slide styles we previously set
    if (!isMobile) {
      setSlidesCount(el.children.length || 1);
      setActiveIndex(0);
      Array.from(el.children).forEach((c) => {
        c.style.flex = "";
        c.style.minWidth = "";
        c.style.scrollSnapAlign = "";
        c.style.height = "";
        c.style.boxSizing = "";
      });
      el.style.display = "";
      el.style.overflowX = "";
      el.style.scrollSnapType = "";
      el.style.webkitOverflowScrolling = "";
      el.style.scrollBehavior = "";
      return;
    }

    // Mobile behavior: horizontal carousel
    el.style.display = "flex";
    el.style.overflowX = "auto";
    el.style.scrollSnapType = "x mandatory";
    el.style.webkitOverflowScrolling = "touch";
    // performance: smooth snapping
    el.style.scrollBehavior = "smooth";

    // Apply slide styles to immediate children
    Array.from(el.children).forEach((c) => {
      // ensure each immediate child fills the carousel viewport
      c.style.flex = "0 0 100%";
      c.style.minWidth = "100%";
      c.style.scrollSnapAlign = "start";
      // ensure child uses full height of carousel (carousel height set by other effect)
      c.style.height = "100%";
      c.style.boxSizing = "border-box";
    });

    // initial slide count and index
    setSlidesCount(el.children.length || 1);
    setActiveIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)) || 0);
  }, [isMobile, metrics /* re-run when metrics may change number of children */]);

  // Scroll handler to update activeIndex (throttled via requestAnimationFrame)
  useEffect(() => {
    const el = carouselRef.current;
    if (!el || !isMobile) return;
    let raf = null;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const idx = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
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
    const width = el.clientWidth || window.innerWidth;
    el.scrollTo({ left: index * width, behavior: "smooth" });
    setActiveIndex(index);
  };

  // Keyboard left/right navigation when the carousel is focused (mobile or keyboard users)
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

      {/* Carousel wrapper — on mobile this becomes a swipeable area where each child takes full width */}
      <div style={{ position: "relative" }}>
        <div
          ref={carouselRef}
          className="perf-carousel"
          role="region"
          aria-label="Performance cards"
          tabIndex={0}
          onKeyDown={handleCarouselKey}
        >
          {/* PerformanceTopRow should render the individual summary cards as immediate children.
              If it renders a single wrapper element containing multiple cards, we may need to
              patch that component instead — test this first. */}
          <PerformanceTopRow
            metrics={metrics || {}}
            chartData={chartData}
            onSelectItem={(name) => setSelectedItem(name)}
            selectedItem={selectedItem}
            asSlides={isMobile}
          />
        </div>

        {/* pager dots (mobile visible only via CSS) */}
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
