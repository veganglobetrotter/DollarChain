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

  // For debouncing and guarding repeated writes
  const lastWidthRef = useRef(0);
  const debounceTimerRef = useRef(null);
  const pendingReflowRef = useRef(false);

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

  // small helpers
  const getVisibleWidth = (el) => {
    if (!el) return 0;
    const cw = el.clientWidth || 0;
    if (cw > 0) return Math.floor(cw);
    const dw = document.documentElement && document.documentElement.clientWidth ? document.documentElement.clientWidth : 0;
    const ww = typeof window !== "undefined" ? window.innerWidth : 0;
    return Math.max(cw, dw, ww);
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

  // Debounced, idempotent reflow: apply percent-based slide sizing but only when width changes
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    let destroyed = false;

    // Only run the actual layout write after debounce interval
    const doReflow = () => {
      if (destroyed) return;
      if (!el) return;

      // Non-mobile cleanup
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

      // Mobile: percent-based slides are safe; measure width and avoid redundant writes
      const visibleWidth = getVisibleWidth(el);
      // If width didn't change meaningfully, skip writing styles
      const last = lastWidthRef.current || 0;
      if (Math.abs(visibleWidth - last) <= 2 && visibleWidth > 0) {
        // update pager count & activeIndex defensively but avoid DOM writes
        setSlidesCount(el.children.length || 1);
        const idx = Math.round(el.scrollLeft / Math.max(1, visibleWidth));
        setActiveIndex(Math.min(Math.max(0, idx), Math.max(0, el.children.length - 1)));
        pendingReflowRef.current = false;
        return;
      }

      // Apply simple percent-based styles only when width changed
      lastWidthRef.current = visibleWidth;

      el.style.display = "flex";
      el.style.overflowX = "auto";
      el.style.scrollSnapType = "x mandatory";
      el.style.webkitOverflowScrolling = "touch";
      el.style.scrollBehavior = "smooth";

      Array.from(el.children).forEach((c) => {
        // only set these properties — minimal writes
        if (c.style.flex !== "0 0 100%") c.style.flex = "0 0 100%";
        if (c.style.minWidth !== "100%") c.style.minWidth = "100%";
        if (c.style.boxSizing !== "border-box") c.style.boxSizing = "border-box";
        if (c.style.height !== "100%") c.style.height = "100%";
        if (c.style.scrollSnapAlign !== "start") c.style.scrollSnapAlign = "start";
        if (c.style.margin !== "0") c.style.margin = "0";
      });

      setSlidesCount(el.children.length || 1);

      // Snap to nearest slide only if current scrollLeft is misaligned.
      // This avoids forcing scroll on every reflow.
      const idx = Math.round(el.scrollLeft / Math.max(1, visibleWidth));
      const misaligned = Math.abs(el.scrollLeft - idx * visibleWidth) > Math.max(6, visibleWidth * 0.06);
      if (misaligned) {
        // snap but let it be instant so no long smooth animation blocks rAF
        safeSnapTo(idx, true);
      }

      pendingReflowRef.current = false;
    };

    const scheduleReflow = () => {
      if (pendingReflowRef.current) return;
      pendingReflowRef.current = true;
      // debounce: if many changes fire, coalesce into one reflow per 120ms
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        // run in rAF but keep work tiny
        window.requestAnimationFrame(doReflow);
      }, 120);
    };

    // initial schedule
    scheduleReflow();

    // Use ResizeObserver to detect layout changes and schedule debounced reflow
    let ro;
    try {
      ro = new ResizeObserver(() => {
        scheduleReflow();
      });
      ro.observe(el);
      ro.observe(document.documentElement);
    } catch (err) {
      // fallback
      window.addEventListener("resize", scheduleReflow);
    }

    // also respond to orientation changes
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

  // Scroll handler to update activeIndex (throttled via rAF)
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
