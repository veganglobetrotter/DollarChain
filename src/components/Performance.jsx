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
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.matchMedia("(max-width:640px)").matches : false
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [slidesCount, setSlidesCount] = useState(1);

  const load = async (d, itemName = null) => {
    setLoading(true);
    setError(null);
    try {
      // fetchPerformance should accept (days, itemName)
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

  // Prepare chart data (safe numeric coercion)
  const chartData = useMemo(() => {
    if (!metrics?.timeseries || !Array.isArray(metrics.timeseries)) return [];
    return metrics.timeseries.map((p) => ({
      day: p.day,
      orders: typeof p.orders === "number" ? p.orders : Number(p.orders || 0),
      revenue: typeof p.revenue === "number" ? p.revenue : Number(p.revenue || 0),
    }));
  }, [metrics]);

  // Build small sparkline arrays for summary cards
  const sparkRevenue = useMemo(() => {
    if (!chartData || !chartData.length) return [];
    return chartData.map((d) => d.revenue || 0).slice(-12);
  }, [chartData]);

  const sparkOrders = useMemo(() => {
    if (!chartData || !chartData.length) return [];
    return chartData.map((d) => d.orders || 0).slice(-12);
  }, [chartData]);

  const topSeller = (metrics?.best_sellers && metrics.best_sellers.length) ? metrics.best_sellers[0] : null;

  // Update isMobile on resize / orientation changes
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

  // Ensure carousel fills visible area under header on mobile (height)
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

  // Reflow slides to exact pixel widths whenever layout changes (fixes login/sidebar shifts)
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    // compute visible width of carousel container and apply to children
    const resizeAndReflowSlides = () => {
      if (!el) return;
      // prefer clientWidth of carousel (excludes scrollbars and paddings)
      const visibleWidth = el.clientWidth || Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);

      Array.from(el.children).forEach((c) => {
        // apply exact pixel width to avoid percent/padding mismatch
        c.style.minWidth = `${visibleWidth}px`;
        c.style.flex = `0 0 ${visibleWidth}px`;
        c.style.boxSizing = "border-box";
      });

      setSlidesCount(el.children.length || 1);
      const idx = Math.round(el.scrollLeft / Math.max(1, visibleWidth));
      setActiveIndex(Math.min(Math.max(0, idx), Math.max(0, el.children.length - 1)));
    };

    // If not mobile, clear inline sizing and exit
    if (!isMobile) {
      Array.from(el.children).forEach((c) => {
        c.style.minWidth = "";
        c.style.flex = "";
        c.style.boxSizing = "";
        c.style.height = "";
      });
      el.style.display = "";
      el.style.overflowX = "";
      el.style.scrollSnapType = "";
      el.style.webkitOverflowScrolling = "";
      el.style.scrollBehavior = "";
      setSlidesCount(el.children.length || 1);
      setActiveIndex(0);
      return;
    }

    // Initial reflow
    resizeAndReflowSlides();

    // Use ResizeObserver to detect layout changes (sidebar toggles, header size change, etc.)
    let ro;
    try {
      ro = new ResizeObserver(() => {
        // Slight timeout to let layout settle when many changes happen
        window.requestAnimationFrame(resizeAndReflowSlides);
      });
      ro.observe(el);
      ro.observe(document.documentElement);
    } catch (err) {
      // fallback: window resize
      window.addEventListener("resize", resizeAndReflowSlides);
    }

    // Also respond to orientation changes
    const onOrientation = () => setTimeout(resizeAndReflowSlides, 60);
    window.addEventListener("orientationchange", onOrientation);

    return () => {
      if (ro && typeof ro.disconnect === "function") ro.disconnect();
      window.removeEventListener("orientationchange", onOrientation);
      window.removeEventListener("resize", resizeAndReflowSlides);
    };
  }, [isMobile, metrics]);

  // Scroll handler to update activeIndex (throttled via rAF)
  useEffect(() => {
    const el = carouselRef.current;
    if (!el || !isMobile) return;
    let raf = null;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const visibleWidth = el.clientWidth || Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
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
    const width = el.clientWidth || Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
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

  // Layout styles (unused variable preserved in case other code uses it)
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

      {/* Carousel wrapper */}
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
          />
        </div>

        {/* pager dots */}
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

      {/* Filter pill */}
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
