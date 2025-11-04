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
  const outerRef = useRef(null); // the element we render in JSX — may contain wrapper or slides directly
  const scrollContainerRef = useRef(null); // the actual element that will be scrollable (either outerRef or its child)
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
    if (mq.addEventListener) mq.addEventListener("change", handle);
    else mq.addListener(handle);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handle);
      else mq.removeListener(handle);
    };
  }, []);

  // Prepare/update the scrollContainer and slide styles depending on structure
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    // Helper to clear inline styles when leaving mobile mode
    const clearStyles = (container, slides) => {
      if (!container) return;
      container.style.display = "";
      container.style.overflowX = "";
      container.style.scrollSnapType = "";
      container.style.webkitOverflowScrolling = "";
      container.style.scrollBehavior = "";
      Array.from(slides || []).forEach((c) => {
        c.style.flex = "";
        c.style.minWidth = "";
        c.style.scrollSnapAlign = "";
        c.style.height = "";
        c.style.boxSizing = "";
      });
    };

    // If not mobile, remove any inline styles we may have set previously and bail
    if (!isMobile) {
      // if we previously used an inner container, clear that; otherwise clear outer
      const maybeInner = outer.children && outer.children.length === 1 ? outer.children[0] : null;
      if (maybeInner) {
        clearStyles(maybeInner, maybeInner.children);
      } else {
        clearStyles(outer, outer.children);
      }
      scrollContainerRef.current = null;
      setSlidesCount(outer.children ? outer.children.length : 1);
      setActiveIndex(0);
      return;
    }

    // Mobile: choose the correct container to make scrollable.
    // If outer has exactly 1 child (the wrapper), use that child's children as slides.
    // Otherwise, use outer's immediate children as slides.
    let container = outer;
    let slides = Array.from(outer.children);

    if (outer.children.length === 1) {
      // the wrapper contains the real slides
      container = outer.children[0];
      slides = Array.from(container.children);
    }

    // Make the chosen container scrollable horizontally
    container.style.display = "flex";
    container.style.overflowX = "auto";
    container.style.scrollSnapType = "x mandatory";
    container.style.webkitOverflowScrolling = "touch";
    container.style.scrollBehavior = "smooth";
    // Ensure container fills available height for consistent slide sizing (allow CSS to control height)
    container.style.height = "100%";

    // Apply slide styles to each real slide (immediate children of container)
    slides.forEach((c) => {
      c.style.flex = "0 0 100%";
      c.style.minWidth = "100%";
      c.style.scrollSnapAlign = "start";
      c.style.height = "100%";
      c.style.boxSizing = "border-box";
    });

    // Save the scroll container ref for later event handling
    scrollContainerRef.current = container;
    setSlidesCount(slides.length || 1);

    // Calculate initial active index
    setActiveIndex(Math.round(container.scrollLeft / Math.max(1, container.clientWidth)) || 0);
  }, [isMobile, metrics]); // re-run when metrics change (number of cards may change)

  // Scroll handler to update activeIndex (throttled via requestAnimationFrame)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isMobile) return;
    let raf = null;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const idx = Math.round(container.scrollLeft / Math.max(1, container.clientWidth));
        setActiveIndex(idx);
        raf = null;
      });
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isMobile, slidesCount]);

  const scrollToIndex = (index) => {
    const container = scrollContainerRef.current || outerRef.current;
    if (!container) return;
    const width = container.clientWidth || window.innerWidth;
    container.scrollTo({ left: index * width, behavior: "smooth" });
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

      {/* Outer wrapper that may contain the actual wrapper (PerformanceTopRow) */}
      <div style={{ position: "relative" }}>
        <div
          ref={outerRef}
          className="perf-carousel-outer"
          role="region"
          aria-label="Performance cards"
          tabIndex={0}
          onKeyDown={handleCarouselKey}
        >
          {/* PerformanceTopRow renders a wrapper (.performance-top-row) with the summary cards inside.
              Our logic above will detect whether to use outerRef or the inner wrapper as the scroll container. */}
          <PerformanceTopRow
            metrics={metrics || {}}
            chartData={chartData}
            onSelectItem={(name) => setSelectedItem(name)}
            selectedItem={selectedItem}
          />
        </div>

        {/* pager dots (mobile visible only via inline style) */}
        <div
          className="perf-dots"
          aria-hidden={!isMobile}
          style={{
            display: isMobile ? "flex" : "none",
            gap: 6,
            justifyContent: "center",
            marginTop: 8,
          }}
        >
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
    </div>
  );
}
