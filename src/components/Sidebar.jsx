// src/components/Sidebar.jsx
import React, { useEffect } from "react";

export default function Sidebar({
  sellerName = "Seller Name",
  onNavigate = () => {},
  active = "home",
  open = true, // controls mobile visibility; defaults to true for backward compatibility
  onClose = () => {}, // optional close handler used by mobile toggle / Escape key
}) {
  const nav = [
    { id: "home", label: "Dashboard" },
    { id: "performance", label: "Performance" }, // <-- replaced Item 1
    { id: "item2", label: "Item 2" },
    { id: "item3", label: "Item 3" },
    { id: "settings", label: "Settings" },
  ];

  const handleKeyNav = (e, id) => {
    // Accept Enter and Space to activate; prevent default for Space (avoid page scroll)
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onNavigate(id);
      // allow parent to close if needed
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

  return (
    // id so Header aria-controls points here; visibility handled by CSS (not inline style)
    <aside
      id="sidebar"
      className="sidebar"
      aria-label="Sidebar"
      aria-hidden={!open}
    >
      <div className="sidebar-card">
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
              <li
                key={n.id}
                className={`nav-item ${active === n.id ? "nav-active" : ""}`}
              >
                {/* semantic button improves touch/keyboard reliability */}
                <button
                  type="button"
                  className="nav-link"
                  onClick={(e) => {
                    // prevent overlay/backdrop from reacting to the same click
                    e.stopPropagation();
                    onNavigate(n.id);
                    // tell parent to close the mobile sidebar (parent can close immediately or delay new)
                    if (typeof onClose === "function") onClose();
                  }}
                  onKeyDown={(e) => handleKeyNav(e, n.id)}
                  aria-current={active === n.id ? "page" : undefined}
                  aria-pressed={active === n.id}
                  style={{ all: "unset", cursor: "pointer", display: "inline-block", width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 6 }}
                >
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
