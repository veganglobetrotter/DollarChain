// src/components/Header.jsx
import React from "react";

export default function Header({ onBuyCredits, activeRange = "28D", onRangeChange }) {
  const ranges = ["7D", "28D", "90D", "365D"];

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
          <div className="header-controls" role="toolbar" aria-label="Date range">
            {ranges.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRangeChange(r)}
                className={`btn-pill ${r === activeRange ? "active" : ""}`}
                aria-pressed={r === activeRange}
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
