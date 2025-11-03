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
    // id so Header aria-controls points here; hide when open === false
    <aside
      id="sidebar"
      className="sidebar"
      aria-label="Sidebar"
      aria-hidden={!open}
      style={{ display: open ? undefined : "none" }}
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
                onClick={() => onNavigate(n.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => handleKeyNav(e, n.id)}
                aria-current={active === n.id ? "page" : undefined}
              >
                {n.label}
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
