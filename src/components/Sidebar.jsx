// src/components/Sidebar.jsx
import React, { useEffect } from "react";

/**
 * Sidebar component
 *
 * Props:
 * - id: string (optional) - id attribute for the aside (useful for aria-controls)
 * - sellerName: string - seller display name
 * - onNavigate: function(id) - called when a nav item is activated
 * - active: string - id of the currently active nav item
 * - open: boolean - whether the sidebar is visible (mobile)
 * - onClose: function - optional close handler for mobile/backdrop/Escape
 * - activeChallengesCount: number - optional badge count to show next to Goals & Rewards
 */
export default function Sidebar({
  id,
  sellerName = "Seller Name",
  onNavigate = () => {},
  active = "home",
  open = true,
  onClose = () => {},
  activeChallengesCount = 0,
}) {
  const nav = [
    { id: "home", label: "Dashboard", icon: "home" },
    { id: "performance", label: "Performance", icon: "chart" },
    { id: "invoices", label: "Invoices", icon: "invoice" },
    { id: "goals", label: "Goals & Rewards", icon: "gift" }, // replaced placeholder
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  const handleKeyNav = (e, id) => {
    // Accept Enter and Space to activate; prevent default for Space (avoid page scroll)
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onNavigate(id);
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

  // Small inline style helpers (keeps layout consistent without touching index.css)
  const styles = {
    navButton: {
      all: "unset",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      textAlign: "left",
      padding: "8px 10px",
      borderRadius: 6,
    },
    navIcon: {
      width: 18,
      height: 18,
      display: "inline-block",
      flex: "0 0 18px",
    },
    badge: {
      minWidth: 20,
      height: 20,
      lineHeight: "20px",
      fontSize: 12,
      borderRadius: 999,
      textAlign: "center",
      padding: "0 6px",
      backgroundColor: "#ef4444", // subtle red for visibility
      color: "#fff",
      marginLeft: "auto",
      boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    },
    sellerAvatar: {
      width: 44,
      height: 44,
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      backgroundColor: "#111827",
      color: "#fff",
      marginRight: 10,
      flex: "0 0 44px",
    },
  };

  // Simple inline SVG icons (keeps file self-contained)
  const Icon = ({ name }) => {
    switch (name) {
      case "home":
        return (
          <svg viewBox="0 0 24 24" style={styles.navIcon} aria-hidden>
            <path fill="currentColor" d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5z" />
          </svg>
        );
      case "chart":
        return (
          <svg viewBox="0 0 24 24" style={styles.navIcon} aria-hidden>
            <path fill="currentColor" d="M5 3h2v18H5zM11 8h2v13h-2zM17 13h2v8h-2z" />
          </svg>
        );
      case "invoice":
        return (
          <svg viewBox="0 0 24 24" style={styles.navIcon} aria-hidden>
            <path fill="currentColor" d="M7 3h10v2H7zM5 7h14v14H5zM9 11h6v2H9zM9 15h6v2H9z" />
          </svg>
        );
      case "gift":
        return (
          <svg viewBox="0 0 24 24" style={styles.navIcon} aria-hidden>
            <path fill="currentColor" d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7h16zM12 3l2 2h5v3H5V5h5l2-2zM7 12V9h10v3" />
          </svg>
        );
      case "settings":
        return (
          <svg viewBox="0 0 24 24" style={styles.navIcon} aria-hidden>
            <path fill="currentColor" d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm8.9 3l-1.1-.2-.7-.8.2-1.1-1-1-1.1.2-.7-.8-.3-1.1h-1.3l-.3 1.1-.7.8-1.1-.2-1 1 .2 1.1-.7.8v1.3l.7.8-.2 1.1 1 1 1.1-.2.7.8.3 1.1h1.3l.3-1.1.7-.8 1.1.2 1-1-.2-1.1.7-.8V11z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <aside
      id={id}
      className="sidebar"
      aria-label="Sidebar"
      aria-hidden={!open}
      style={asideStyle}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
          e.stopPropagation();
        }
      }}
    >
      <div
        className="sidebar-card"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: 16,
          width: 280,
          boxSizing: "border-box",
        }}
      >
        <div
          className="sidebar-top"
          style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}
        >
          <div style={styles.sellerAvatar} aria-hidden>
            {(sellerName || "S").charAt(0).toUpperCase()}
          </div>

          <div className="seller-info" style={{ display: "flex", flexDirection: "column" }}>
            <div className="seller-name" style={{ fontWeight: 700, fontSize: 14 }}>
              {sellerName}
            </div>
            <div className="seller-sub" style={{ fontSize: 12, color: "#6b7280" }}>
              Your account
            </div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation" style={{ overflowY: "auto" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {nav.map((n) => (
              <li
                key={n.id}
                className={`nav-item ${active === n.id ? "nav-active" : ""}`}
                style={{ marginBottom: 4 }}
              >
                <button
                  type="button"
                  className="nav-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(n.id);
                    if (typeof onClose === "function") onClose();
                  }}
                  onKeyDown={(e) => handleKeyNav(e, n.id)}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  aria-current={active === n.id ? "page" : undefined}
                  aria-pressed={active === n.id}
                  style={{
                    ...styles.navButton,
                    backgroundColor: active === n.id ? "rgba(17,24,39,0.06)" : "transparent",
                    fontWeight: active === n.id ? 700 : 500,
                  }}
                >
                  <Icon name={n.icon} />
                  <span style={{ fontSize: 14 }}>{n.label}</span>

                  {/* show challenges badge when the nav item is Goals & Rewards */}
                  {n.id === "goals" && activeChallengesCount > 0 ? (
                    <span style={styles.badge} aria-hidden>
                      {activeChallengesCount}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ flex: 1 }} />

        <div className="sidebar-footer" style={{ fontSize: 12, color: "#6b7280", marginTop: 12 }}>
          © {new Date().getFullYear()} DollarChain
        </div>
      </div>
    </aside>
  );
}
