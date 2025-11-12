// src/components/TopNav.jsx
import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import AuthModal from "./AuthModal";

export default function TopNav() {
  const { user, profile } = useUser();
  const [open, setOpen] = useState(false); // auth modal
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.left}>
          <a href="/" style={styles.logoLink}>
            <div style={styles.logo}>DollarChain</div>
          </a>
        </div>

        <div style={styles.center}>
          <a href="#features" style={styles.link}>Features</a>
          <a href="#pricing" style={styles.link}>Pricing</a>
          <a href="#faq" style={styles.link}>FAQ</a>
        </div>

        <div style={styles.right}>
          {user ? (
            <div style={styles.account}>
              <span style={{ fontSize: 14 }}>{profile?.full_name || user.email}</span>
            </div>
          ) : (
            <>
              <button style={styles.textBtn} onClick={() => setOpen(true)}>Sign in</button>
              <button style={styles.primary} onClick={() => setOpen(true)}>Get started — Free</button>
            </>
          )}

          <button
            aria-label="Toggle menu"
            style={styles.hamburger}
            onClick={() => setMobileOpen((v) => !v)}
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={styles.mobileMenu}>
          <a href="#features" style={styles.mobileLink} onClick={() => setMobileOpen(false)}>Features</a>
          <a href="#pricing" style={styles.mobileLink} onClick={() => setMobileOpen(false)}>Pricing</a>
          <a href="#faq" style={styles.mobileLink} onClick={() => setMobileOpen(false)}>FAQ</a>
          {!user && (
            <>
              <button style={{ ...styles.mobileAction, marginTop: 8 }} onClick={() => { setOpen(true); setMobileOpen(false); }}>
                Sign in
              </button>
              <button style={styles.mobilePrimary} onClick={() => { setOpen(true); setMobileOpen(false); }}>
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

const styles = {
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
