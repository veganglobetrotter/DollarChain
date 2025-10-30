import React from "react";

/**
 * Sidebar component
 *
 * Props:
 * - sellerName (string) default: "Seller Name"
 * - variant (string) "light" (default) or "dark" to enable the dark sidebar CSS variant
 *
 * To enable the dark variant: <Sidebar sellerName="Jane" variant="dark" />
 */
export default function Sidebar({ sellerName = "Seller Name", variant = "light" }) {
  const asideClass = variant === "dark" ? "sidebar sidebar--dark" : "sidebar";
  const initial = (sellerName || "S").charAt(0).toUpperCase();

  return (
    <aside className={asideClass} aria-label="Sidebar">
      <div className="sidebar-card">
        <div className="sidebar-top">
          <div className="avatar" aria-hidden>
            {initial}
          </div>

          <div className="seller-info">
            <div className="seller-name">{sellerName}</div>
            <div className="seller-sub">Your account</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <ul>
            <li className="nav-item">Dashboard</li>
            <li className="nav-item">Item 1</li>
            <li className="nav-item">Item 2</li>
            <li className="nav-item">Item 3</li>
            <li className="nav-item">Settings</li>
          </ul>
        </nav>

        <div style={{ flex: 1 }} />

        <div className="sidebar-footer">© {new Date().getFullYear()} DollarChain</div>
      </div>
    </aside>
  );
}
