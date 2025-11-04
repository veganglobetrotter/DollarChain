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

  // Build small sparkline arrays for summary cards (take revenue)
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

  // Ensure carousel fills visible area under header on mobile.
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

  // Helper: safe snap to an index (used after applying styles)
  const safeSnapTo = (index = 0, instant = true) => {
    const el = carouselRef.current;
    if (!el) return;
    const width = el.clientWidth || Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const clamped = Math.min(Math.max(0, index), Math.max(0, el.children.length - 1));
    try {
      el.scrollTo({ left: clamped * width, behavior: instant ? "auto" : "smooth" });
      setActiveIndex(clamped);
    } catch (e) {
      // fallback: set scrollLeft directly
      el.scrollLeft = clamped * width;
      setActiveIndex(clamped);
    }
  };

  // Safer carousel sizing & reflow:
  // - Primary strategy: apply percent-based slide sizing (resilient)
  // - Clear any leftover pixel min-widths that might cause overflow
  // - Re-snap to a sane slide (usually the first) after applying styles
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    let destroyed = false;

    const clearLegacyPixelWidths = (child) => {
      // remove explicit pixel minWidth/flex that may have been applied earlier
      if (!child) return;
      const mw = child.style.minWidth || "";
      if (mw && mw.trim().endsWith("px")) {
        child.style.minWidth = "";
      }
      const flex = child.style.flex || "";
      if (flex && flex.includes("px")) {
        child.style.flex = "";
      }
    };

    const applyPercentSlideStyles = () => {
      if (destroyed) return;
      if (!el) return;
      // if leaving mobile, clear inline styles
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
        // snap to first just to be safe
        safeSnapTo(0, true);
        return;
      }

      // Clean legacy pixel widths which cause overflow
      Array.from(el.children).forEach((c) => {
        clearLegacyPixelWidths(c);
        c.style.margin = "0"; // make sure no centering margin interferes
      });

      // Apply percent-based styles — robust during layout transitions
      el.style.display = "flex";
      el.style.overflowX = "auto";
      el.style.scrollSnapType = "x mandatory";
      el.style.webkitOverflowScrolling = "touch";
      el.style.scrollBehavior = "smooth";

      Array.from(el.children).forEach((c) => {
        c.style.flex = "0 0 100%";
        c.style.minWidth = "100%";
        c.style.boxSizing = "border-box";
        c.style.height = "100%";
        c.style.scrollSnapAlign = "start";
        c.style.margin = "0";
      });

      // update pager data
      setSlidesCount(el.children.length || 1);

      // If the carousel currently has a non-zero scrollLeft (i.e., user landed mid-slide),
      // re-snap to the nearest full slide to avoid partially-offscreen content.
      const visibleWidth = el.clientWidth || Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const idx = Math.round(el.scrollLeft / Math.max(1, visibleWidth));
      // ensure we snap to a valid index; prefer 0 for first render
      const target = Math.min(Math.max(0, idx), Math.max(0, el.children.length - 1));
      // small delay to let the browser settle and then snap
      setTimeout(() => {
        if (!destroyed) safeSnapTo(target, true);
      }, 40);
    };

    // initial apply
    applyPercentSlideStyles();

    // Re-apply on layout changes via ResizeObserver (with fallback to window resize)
    let ro;
    try {
      ro = new ResizeObserver(() => {
        if (destroyed) return;
        window.requestAnimationFrame(() => {
          applyPercentSlideStyles();
        });
      });
      ro.observe(el);
      ro.observe(document.documentElement);
    } catch (err) {
      window.addEventListener("resize", applyPercentSlideStyles);
    }

    // orientation change handling
    const onOrientation = () => setTimeout(applyPercentSlideStyles, 60);
    window.addEventListener("orientationchange", onOrientation);

    return () => {
      destroyed = true;
      try {
        if (ro && typeof ro.disconnect === "function") ro.disconnect();
      } catch (e) {}
      window.removeEventListener("resize", applyPercentSlideStyles);
      window.removeEventListener("orientationchange", onOrientation);
    };
  }, [isMobile, metrics]); // re-run when mobile toggles or data/children change

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
          <PerformanceTopRow
            metrics={metrics || {}}
            chartData={chartData}
            onSelectItem={(name) => setSelectedItem(name)}
            selectedItem={selectedItem}
            asSlides={isMobile}
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
