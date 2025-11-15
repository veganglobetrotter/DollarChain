import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import AuthModal from "./AuthModal";

export default function TopNav() {
  const { user, profile } = useUser();
  const [open, setOpen] = useState(false); // auth modal
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogoClick = (e) => {
    // Defensive: if user is viewing the public landing page, don't reload/replace the page
    // (reload can interfere with modal / auth flows). If they truly want to navigate, they
    // can use the browser controls or we'll navigate programmatically.
    if (typeof window !== "undefined") {
      const path = window.location.pathname || "";
      if (path === "/landing") {
        e.preventDefault();
        // optional: scroll to top to mimic click behaviour without navigating
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      // otherwise, perform a normal navigation (keeps back/forward behaviour)
      // Note: using location.assign so it behaves like a normal link.
      e.preventDefault();
      window.location.assign("/");
    }
  };

  return (
    <>
      <nav style={navStyles.nav}>
        <div style={navStyles.left}>
          <a href="/" style={navStyles.logoLink} onClick={handleLogoClick}>
            <div style={navStyles.logo}>DollarChain</div>
          </a>
        </div>

        <div style={navStyles.center}>
          <a href="#features" style={navStyles.link}>Features</a>
          <a href="#pricing" style={navStyles.link}>Pricing</a>
          <a href="#faq" style={navStyles.link}>FAQ</a>
        </div>

        <div style={navStyles.right}>
          {user ? (
            <div style={navStyles.account}>
              <span style={{ fontSize: 14 }}>{profile?.full_name || user.email}</span>
            </div>
          ) : (
            <>
              <button style={navStyles.textBtn} onClick={() => setOpen(true)}>Sign in</button>
              <button style={navStyles.primary} onClick={() => setOpen(true)}>Get started — Free</button>
            </>
          )}

          <button
            aria-label="Toggle menu"
            style={navStyles.hamburger}
            onClick={() => setMobileOpen((v) => !v)}
          >
            ☰
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div style={navStyles.mobileMenu}>
          <a
            href="#features"
            style={navStyles.mobileLink}
            onClick={(e) => {
              e.preventDefault();
              setMobileOpen(false);
              // ensure we scroll to the element
              const el = document.getElementById("features");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Features
          </a>

          <a
            href="#pricing"
            style={navStyles.mobileLink}
            onClick={(e) => {
              e.preventDefault();
              setMobileOpen(false);
              const el = document.getElementById("pricing");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Pricing
          </a>

          <a
            href="#faq"
            style={navStyles.mobileLink}
            onClick={(e) => {
              e.preventDefault();
              setMobileOpen(false);
              const el = document.getElementById("faq");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            FAQ
          </a>

          {!user && (
            <>
              <button
                style={{ ...navStyles.mobileAction, marginTop: 8 }}
                onClick={() => {
                  setOpen(true);
                  setMobileOpen(false);
                }}
              >
                Sign in
              </button>
              <button
                style={navStyles.mobilePrimary}
                onClick={() => {
                  setOpen(true);
                  setMobileOpen(false);
                }}
              >
                Get started — Free
              </button>
            </>
          )}
        </div>
      )}

      <AuthModal open={open} onClose={() => setOpen(false)} onAuthSuccess={() => setOpen(false)} />
    </>
  );
}

const navStyles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    background: "rgba(255,255,255,0.98)",
    borderBottom: "1px solid rgba(15,23,42,0.04)",
  },
  left: { display: "flex", alignItems: "center" },
  logoLink: { textDecoration: "none" },
  logo: { fontWeight: 800, color: "#0FAF5A", fontSize: 18 },
  center: {
    display: "flex",
    gap: 14,
    alignItems: "center",
  },
  link: { color: "#0f1720", textDecoration: "none", padding: "6px 8px", fontSize: 14 },
  right: { display: "flex", gap: 8, alignItems: "center" },
  primary: {
    background: "#0FAF5A",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
  },
  textBtn: { background: "transparent", border: "none", color: "#0FAF5A", cursor: "pointer", fontWeight: 700 },
  account: { padding: "6px 10px", background: "#ecfdf3", borderRadius: 8, color: "#065f46" },

  // mobile
  hamburger: {
    display: "inline-block",
    marginLeft: 8,
    background: "transparent",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
  },
  mobileMenu: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "12px 20px",
    borderBottom: "1px solid rgba(15,23,42,0.04)",
    background: "#fff",
  },
  mobileLink: { textDecoration: "none", color: "#0f1720", padding: "8px 0", fontSize: 16 },
  mobileAction: {
    background: "transparent",
    border: "1px solid #e6f4ea",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
  },
  mobilePrimary: {
    background: "#0FAF5A",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
  },
};
