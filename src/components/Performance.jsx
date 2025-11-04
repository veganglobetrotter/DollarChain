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

  // Robust reflow logic for mobile slides:
  // - compute exact pixel width of carousel container
  // - retry a few times if container isn't measured yet (hidden or layout not settled)
  // - observe layout changes via ResizeObserver and fallback to window resize
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    let destroyed = false;

    // utility to determine if element is visible in layout
    const isVisible = (node) => node && node.offsetParent !== null;

    // compute a safe visible width (prefer el.clientWidth)
    const getVisibleWidth = () => {
      // prefer carousel clientWidth (accounts for padding/scrollbars)
      const cw = el.clientWidth || 0;
      if (cw && cw > 0) return cw;
      // fallback to document or window
      const dw = document.documentElement && document.documentElement.clientWidth ? document.documentElement.clientWidth : 0;
      const ww = typeof window !== "undefined" ? window.innerWidth : 0;
      return Math.max(cw, dw, ww);
    };

    // reflow function with defensive checks and limited retries
    let retryCount = 0;
    const MAX_RETRIES = 6;
    const RETRY_DELAY = 80; // ms

    const resizeAndReflowSlides = () => {
      if (destroyed) return;
      if (!el) return;
      // If not mobile, clear any inline styles we may have set earlier and exit
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

      // Ensure element is visible — if not, retry later
      if (!isVisible(el)) {
        if (retryCount < MAX_RETRIES) {
          retryCount += 1;
          setTimeout(resizeAndReflowSlides, RETRY_DELAY);
        }
        return;
      }

      const visibleWidth = Math.floor(getVisibleWidth());

      // If width looks suspiciously small, retry instead of applying (prevents 0px collapse)
      if (visibleWidth < 96 && retryCount < MAX_RETRIES) {
        retryCount += 1;
        // slightly delay to allow layout to settle (sidebar or auth changes)
        setTimeout(resizeAndReflowSlides, RETRY_DELAY);
        return;
      }

      // Apply mobile carousel container styles (kept here to ensure consistent runtime behavior)
      el.style.display = "flex";
      el.style.overflowX = "auto";
      el.style.scrollSnapType = "x mandatory";
      el.style.webkitOverflowScrolling = "touch";
      el.style.scrollBehavior = "smooth";

      // Apply exact pixel widths to immediate children so snapping is precise
      Array.from(el.children).forEach((c) => {
        c.style.minWidth = `${visibleWidth}px`;
        c.style.flex = `0 0 ${visibleWidth}px`;
        c.style.boxSizing = "border-box";
        c.style.height = "100%"; // ensure children stretch vertically
        c.style.scrollSnapAlign = "start";
      });

      // update pager state
      setSlidesCount(el.children.length || 1);
      const idx = Math.round(el.scrollLeft / Math.max(1, visibleWidth));
      setActiveIndex(Math.min(Math.max(0, idx), Math.max(0, el.children.length - 1)));
    };

    // initial attempt
    resizeAndReflowSlides();

    // Observe layout changes to reflow when sidebar/header toggles happen
    let ro;
    try {
      ro = new ResizeObserver(() => {
        // debounce slightly with rAF
        window.requestAnimationFrame(() => {
          retryCount = 0; // reset retry count on layout change
          resizeAndReflowSlides();
        });
      });
      ro.observe(el);
      ro.observe(document.documentElement);
    } catch (err) {
      // fallback to window resize
      window.addEventListener("resize", resizeAndReflowSlides);
    }

    // respond to orientation changes
    const onOrientation = () => {
      retryCount = 0;
      setTimeout(resizeAndReflowSlides, 80);
    };
    window.addEventListener("orientationchange", onOrientation);

    // cleanup
    return () => {
      destroyed = true;
      try {
        if (ro && typeof ro.disconnect === "function") ro.disconnect();
      } catch (e) {
        // ignore
      }
      window.removeEventListener("resize", resizeAndReflowSlides);
      window.removeEventListener("orientationchange", onOrientation);
    };
    // re-run when mobile toggles or metrics change (children may be different)
  }, [isMobile, metrics]);

  // Scroll handler to update activeIndex (throttled via requestAnimationFrame)
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
