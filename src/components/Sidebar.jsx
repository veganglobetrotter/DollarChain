// src/components/Sidebar.jsx
import React, { useEffect } from "react";

export default function Sidebar({
  id, // accept id so parent can pass id="sidebar"
  sellerName = "Seller Name",
  onNavigate = () => {},
  active = "home",
  open = true, // controls mobile visibility; defaults to true for backward compatibility
  onClose = () => {}, // optional close handler used by mobile toggle / Escape key
}) {
  const nav = [
    { id: "home", label: "Dashboard", icon: "🏠" },
    { id: "performance", label: "Performance", icon: "📈" },
    { id: "invoices", label: "Invoices", icon: "🧾" }, // <- replaced item2 with invoices (surgical change)
    { id: "item3", label: "Goals & Rewards", icon: "🎯" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  // translate nav ids to the canonical route id we want the app to receive.
  // keeps the visible label/id the same (avoids breaking other code) but
  // signals a clearer id to the router (eg. 'goals' -> your onNavigate handler can map to /challenges).
  const resolveNavId = (id) => {
    if (id === "item3") return "goals";
    return id;
  };

  const handleKeyNav = (e, id) => {
    // Accept Enter and Space to activate; prevent default for Space (avoid page scroll)
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const target = resolveNavId(id);
      onNavigate(target);
      if (typeof onClose === "function") onClose();
    }
  };

  // Close on Escape when sidebar is open and onClose provided
  useEffect(() => {
    if (!open || typeof onClose !== "function") return undefined;
    const handler = (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Inline style to ensure the sidebar sits above the mobile overlay/backdrop
  // when it is open. This avoids overlay intercepting touch/click events.
  // We keep the style minimal so it doesn't alter the internal layout.
  const asideStyle = open
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        height: "100%",
        zIndex: 10001,
        pointerEvents: "auto",
      }
    : undefined;

  return (
    /* id so Header aria-controls points here; visibility handled by CSS (not inline style)
       Note: stopPropagation on the aside prevents clicks inside the sidebar from
       bubbling to the page overlay/backdrop which would close the sidebar prematurely. */
    <aside
      id={id}
      className="sidebar"
      aria-label="Sidebar"
      aria-hidden={!open}
      style={asideStyle}
      onClick={(e) => {
        // prevent clicks inside sidebar from bubbling out to overlay/backdrop
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        // prevent touch events inside sidebar from bubbling out to overlay/backdrop
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        // ensure keyboard events don't bubble and accidentally trigger other handlers
        // allow typical navigation keys through however (so don't swallow Tab/Arrow etc.)
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
          e.stopPropagation();
        }
      }}
    >
      <div className="sidebar-card" onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
        <div className="sidebar-top">
          <div className="avatar">
            {(sellerName || "S").charAt(0).toUpperCase()}
          </div>

          <div className="seller-info">
            <div className="seller-name">{sellerName}</div>
            <div className="seller-sub">Your account</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <ul>
            {nav.map((n) => (
              <li key={n.id} className={`nav-item ${active === n.id ? "nav-active" : ""}`}>
                <button
                  type="button"
                  className="nav-link"
                  onClick={(e) => {
                    // make click handling robust: prevent bubbling, navigate, close
                    e.stopPropagation();
                    const target = resolveNavId(n.id);
                    onNavigate(target);
                    if (typeof onClose === "function") onClose();
                  }}
                  onKeyDown={(e) => handleKeyNav(e, n.id)}
                  onTouchStart={(e) => {
                    // prevent touch events on the button from bubbling (prevents overlay from closing)
                    e.stopPropagation();
                  }}
                  aria-current={active === n.id ? "page" : undefined}
                  aria-pressed={active === n.id}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 6,
                  }}
                >
                  <span aria-hidden style={{ marginRight: 8 }}>{n.icon}</span>
                  {n.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ flex: 1 }} />

        <div className="sidebar-footer">© {new Date().getFullYear()} DollarChain</div>
      </div>
    </aside>
  );
}
