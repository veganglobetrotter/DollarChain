// src/components/Header.jsx
import React, { useEffect, useState } from "react";

export default function Header({
  onBuyCredits,
  activeRange = "28D",
  onRangeChange,
  onToggleSidebar, // optional handler from App for mobile toggle
}) {
  const ranges = ["7D", "28D", "90D", "365D"];

  // track "narrow screen" so we only show the hamburger on small devices
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }
    const mq = window.matchMedia("(max-width: 720px)");
    const update = () => setIsMobile(mq.matches);
    update();
    // use addEventListener when available
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    } else {
      // fallback for older browsers
      mq.addListener(update);
      return () => mq.removeListener(update);
    }
  }, []);

  return (
    <header
      className="top-header header-row"
      role="banner"
      aria-label="Top header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "0.5rem 0",
        width: "100%", // ensure header fills the main column
      }}
    >
      <div
        className="header-left"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flex: "1 1 auto", // allow left side to shrink/grow before pushing controls
          minWidth: 0,
        }}
      >
        {/* Hamburger — visible only on narrow screens (isMobile) */}
        <button
          type="button"
          className="btn-hamburger btn-outline"
          onClick={() => onToggleSidebar?.()}
          aria-label="Toggle navigation"
          aria-controls="sidebar"
          style={{
            display: isMobile ? "inline-flex" : "none",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px",
            borderRadius: 8,
            lineHeight: 1,
            minWidth: 40,
          }}
        >
          <span aria-hidden>☰</span>
        </button>

        <div className="brand" style={{ fontWeight: 800 }}>
          DollarChain
        </div>
        {/* optional small subtitle — harmless if you don't style it */}
        <div style={{ color: "#6b7280", fontSize: 13 }}>Analytics</div>
      </div>

      <div
        className="header-right"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flex: "0 0 auto",
          flexWrap: "wrap", // allow controls to wrap on narrow screens
        }}
      >
        {/* Optional range controls — rendered only when parent cares to handle them */}
        {typeof onRangeChange === "function" && (
          <div
            className="header-controls"
            role="toolbar"
            aria-label="Date range"
          >
            {ranges.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRangeChange(r)}
                className={`btn-pill ${r === activeRange ? "active" : ""}`}
                aria-pressed={r === activeRange}
                // aria-current is helpful for AT to detect the currently selected item in a small set
                aria-current={r === activeRange ? "true" : undefined}
                title={`Show ${r} data`}
                style={{ marginRight: 6 }}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          className="btn-buy"
          onClick={onBuyCredits}
          aria-label="Buy credits"
        >
          Buy Credits
        </button>
      </div>
    </header>
  );
}
