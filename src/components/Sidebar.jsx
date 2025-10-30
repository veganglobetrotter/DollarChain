import React from "react";

export default function Sidebar({ sellerName = "Seller Name" }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="avatar">{(sellerName || "S").charAt(0).toUpperCase()}</div>
        <div className="seller-info">
          <div className="seller-name">{sellerName}</div>
          <div className="seller-sub">Your account</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li className="nav-item">Dashboard</li>
          <li className="nav-item">Item 1</li>
          <li className="nav-item">Item 2</li>
          <li className="nav-item">Item 3</li>
          <li className="nav-item">Settings</li>
        </ul>
      </nav>

      <div className="sidebar-footer">© {new Date().getFullYear()} DollarChain</div>
    </aside>
  );
}
