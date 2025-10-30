import React from "react";

/**
 * Sidebar component
 * Props:
 * - sellerName (string)
 * - variant (string) "light" or "dark"
 * - onNavigate (fn) receives view string ('home' | 'orders' | 'settings' etc.)
 * - active (string) currently active view
 */
export default function Sidebar({ sellerName = "Seller Name", variant = "light", onNavigate = () => {}, active = "home" }) {
  const asideClass = variant === "dark" ? "sidebar sidebar--dark" : "sidebar";
  const initial = (sellerName || "S").charAt(0).toUpperCase();

  const NavItem = ({ id, children }) => (
    <li
      className="nav-item"
      onClick={() => onNavigate(id)}
      style={{
        background: active === id ? "#f6faf6" : "transparent",
        fontWeight: active === id ? 700 : 600,
        cursor: "pointer",
      }}
    >
      {children}
    </li>
  );

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
          <ul style={{ padding: 0, margin: 0 }}>
            <NavItem id="home">Dashboard</NavItem>
            <NavItem id="orders">Orders</NavItem>
            <NavItem id="item1">Item 1</NavItem>
            <NavItem id="item2">Item 2</NavItem>
            <NavItem id="settings">Settings</NavItem>
          </ul>
        </nav>

        <div style={{ flex: 1 }} />

        <div className="sidebar-footer">© {new Date().getFullYear()} DollarChain</div>
      </div>
    </aside>
  );
}
