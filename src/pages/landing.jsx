// src/pages/landing.jsx
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

export default function Landing() {
  const { user, loading } = useUser();

  useEffect(() => {
    // If we finished loading and the user is signed in, send them to the app root.
    if (!loading && user) {
      try {
        window.location.replace("/");
      } catch (e) {
        window.location.href = "/";
      }
    }
  }, [user, loading]);

  return (
    <div style={styles.page}>
      <LandingTopNav />

      <header style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroCopy}>
            <h1 style={styles.h1}>Automatic Invoice Parsing & Instant Digital Invoices</h1>
            <p style={styles.lead}>
              Paste or forward invoices from WhatsApp — DollarChain parses, generates and delivers a PDF invoice in
              seconds.
            </p>

            <div style={styles.ctaRow}>
              <a href="#" onClick={(e) => e.preventDefault()} style={styles.primaryBtn}>
                Get started — Free
              </a>
              <a href="#features" style={styles.linkBtn}>
                See a demo
              </a>
            </div>

            <div style={styles.microTrust}>Trusted by 250+ merchants • 150k invoices parsed this month • 99.9% uptime</div>

            {user ? (
              <div style={styles.signedInBanner}>You are signed in as {user.email || user.id}</div>
            ) : null}
          </div>

          <div style={styles.heroVisual} aria-hidden>
            <div style={styles.mockupBox}>
              <div style={styles.mockupLine} />
              <div style={styles.mockupLine} />
              <div style={styles.mockupInvoice}>
                <div style={{ height: 12, width: "60%", background: "#e6f4ea", borderRadius: 6 }} />
                <div style={{ height: 12, width: "80%", marginTop: 8, background: "#e6f4ea", borderRadius: 6 }} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <section id="features" style={styles.section}>
          <h2 style={styles.h2}>Why merchants choose DollarChain</h2>
          <div style={styles.cardRow}>
            <div style={styles.card}>
              <h3>Save time</h3>
              <p>Auto-extract buyer, items, and totals in 2 seconds.</p>
            </div>
            <div style={styles.card}>
              <h3>Reduce errors</h3>
              <p>Normalized line-items and automatic tax calculations.</p>
            </div>
            <div style={styles.card}>
              <h3>Flexible payments</h3>
              <p>Attach M-Pesa, Paybill or account numbers to each invoice.</p>
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>How it works</h2>
          <ol style={styles.steps}>
            <li>
              <strong>Forward or paste</strong>
              <div>Send a WhatsApp message or paste invoice text into DollarChain.</div>
            </li>
            <li>
              <strong>Auto-parse & preview</strong>
              <div>We extract structured line items, taxes and totals — preview before sending.</div>
            </li>
            <li>
              <strong>Send PDF or collect payment</strong>
              <div>Download PDF, attach payment number and send to your customer.</div>
            </li>
          </ol>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Pricing snapshot</h2>
          <div style={styles.pricingRow}>
            <div style={styles.pricingCard}>
              <h3>Free</h3>
              <div>50 parses / month</div>
              <div style={{ marginTop: 12 }}>
                <a href="#" style={styles.primaryBtn} onClick={(e) => e.preventDefault()}>
                  Start free
                </a>
              </div>
            </div>
            <div style={{ ...styles.pricingCard, borderColor: "#bdf5c9" }}>
              <h3>Pro</h3>
              <div>Pay-as-you-go</div>
              <div style={{ marginTop: 12 }}>
                <a href="#" style={styles.linkBtn} onClick={(e) => e.preventDefault()}>
                  Upgrade
                </a>
              </div>
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>FAQ</h2>
          <details style={styles.faqItem}>
            <summary>How do I sign in?</summary>
            <div>Click Sign in on the top-right and use email magic link or Google OAuth.</div>
          </details>
          <details style={styles.faqItem}>
            <summary>What invoice formats do you support?</summary>
            <div>We support plain-text, images (OCR in future), and common PDF structures.</div>
          </details>
        </section>
      </main>

      <footer style={styles.footer}>
        <div>© DollarChain — Automated Invoicing</div>
        <div style={{ marginTop: 8 }}>Terms • Privacy • Contact</div>
      </footer>
    </div>
  );
}

/**
 * Inline, self-contained landing nav:
 * - simple logo + actions
 * - responsive: shows inline items on wide screens, hamburger on small screens
 * - does not touch your shared TopNav component used by the app shell
 */
function LandingTopNav() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  return (
    <header style={navStyles.header}>
      <div style={navStyles.inner}>
        <a href="/" style={navStyles.brand}>
          <img src="/logos/dollarchain-logo.png" alt="DollarChain" style={{ height: 28, marginRight: 10 }} onError={(e)=>{e.target.style.display='none'}} />
          <span style={navStyles.brandText}>DollarChain</span>
        </a>

        {/* desktop actions */}
        <nav style={navStyles.actions}>
          <a href="#features" style={navStyles.navLink}>
            Demo
          </a>
          <a href="/landing#pricing" style={navStyles.navLink}>
            Pricing
          </a>
          {!user && (
            <>
              <a href="/#signin" style={navStyles.signIn}>
                Sign in
              </a>
              <a href="#features" onClick={(e)=>e.preventDefault()} style={navStyles.cta}>
                Get started — Free
              </a>
            </>
          )}
          {user && (
            <a href="/" style={navStyles.cta}>
              Go to dashboard
            </a>
          )}
        </nav>

        {/* mobile hamburger */}
        <button
          aria-label="Open menu"
          onClick={() => setOpen((s) => !s)}
          style={navStyles.hamburgerBtn}
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* mobile menu */}
      {open && (
        <div style={navStyles.mobileMenu}>
          <a href="#features" style={navStyles.mobileLink} onClick={() => setOpen(false)}>
            Demo
          </a>
          <a href="/landing#pricing" style={navStyles.mobileLink} onClick={() => setOpen(false)}>
            Pricing
          </a>
          {!user && (
            <>
              <a href="/#signin" style={navStyles.mobileLink} onClick={() => setOpen(false)}>
                Sign in
              </a>
              <a href="#features" style={{ ...navStyles.mobileLink, fontWeight: 800 }} onClick={(e) => { e.preventDefault(); setOpen(false); }}>
                Get started — Free
              </a>
            </>
          )}
          {user && (
            <a href="/" style={{ ...navStyles.mobileLink, fontWeight: 800 }} onClick={() => setOpen(false)}>
              Go to dashboard
            </a>
          )}
        </div>
      )}
    </header>
  );
}

/* landing page styles (kept from your previous file, unchanged except small padding adjust) */
const styles = {
  page: {
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    color: "#0f1720",
    overflowX: "hidden",
    WebkitFontSmoothing: "antialiased",
  },

  hero: {
    background: "linear-gradient(180deg, #ffffff, #f7fff7)",
    padding: "48px 16px 80px",
  },

  heroInner: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    gap: 24,
    alignItems: "center",
    flexWrap: "wrap",
    padding: "0 16px",
    boxSizing: "border-box",
  },

  heroCopy: {
    flex: "1 1 320px",
    minWidth: 220,
    maxWidth: 640,
    boxSizing: "border-box",
  },

  h1: {
    fontSize: "clamp(20px, 6vw, 40px)",
    lineHeight: 1.05,
    margin: "0 0 12px",
    color: "#0b4f2b",
  },

  lead: {
    fontSize: "clamp(14px, 3.2vw, 18px)",
    color: "#374151",
    marginBottom: 18,
  },

  ctaRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },

  primaryBtn: {
    background: "#0FAF5A",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: 700,
    display: "inline-block",
    whiteSpace: "nowrap",
  },

  linkBtn: {
    color: "#0FAF5A",
    padding: "8px 12px",
    textDecoration: "none",
    fontWeight: 700,
    display: "inline-block",
  },

  microTrust: { marginTop: 12, color: "#6b7280", fontSize: 13 },

  signedInBanner: { marginTop: 12, padding: 8, background: "#ecfdf3", borderRadius: 8, color: "#065f46" },

  heroVisual: {
    flex: "0 0 380px",
    minWidth: 240,
    display: "flex",
    justifyContent: "center",
    maxWidth: "100%",
    boxSizing: "border-box",
  },

  mockupBox: {
    width: "100%",
    maxWidth: 320,
    height: 220,
    borderRadius: 12,
    background: "#fff",
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
    padding: 18,
    boxSizing: "border-box",
  },

  mockupLine: { height: 8, width: "80%", background: "#f3f4f6", borderRadius: 8, marginBottom: 10 },
  mockupInvoice: { marginTop: 10 },

  main: { maxWidth: 1100, margin: "40px auto", padding: "0 16px", boxSizing: "border-box" },
  section: { marginBottom: 36 },
  h2: { fontSize: 22, color: "#0b4f2b", marginBottom: 12 },

  cardRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  card: {
    flex: "1 1 220px",
    minWidth: 220,
    padding: 18,
    borderRadius: 10,
    background: "#ffffff",
    boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
    boxSizing: "border-box",
  },

  steps: { listStyle: "decimal", paddingLeft: 18, display: "grid", gap: 12 },

  pricingRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  pricingCard: {
    flex: "1 1 220px",
    minWidth: 220,
    padding: 18,
    borderRadius: 10,
    border: "1px solid #e6f4ea",
    boxSizing: "border-box",
  },

  faqItem: { marginBottom: 8 },

  footer: { maxWidth: 1100, margin: "40px auto", padding: "20px", color: "#6b7280", boxSizing: "border-box" },
};

/* landing-topnav specific styles */
const navStyles = {
  header: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 16px",
    background: "transparent",
    position: "relative",
    zIndex: 40,
    borderBottom: "1px solid rgba(15,23,42,0.04)",
  },
  inner: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "0 8px",
    boxSizing: "border-box",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    color: "inherit",
    fontWeight: 800,
  },
  brandText: { fontSize: 16, letterSpacing: "-0.01em" },

  actions: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  navLink: {
    textDecoration: "none",
    color: "#374151",
    padding: "6px 8px",
    fontWeight: 600,
  },
  signIn: {
    textDecoration: "none",
    padding: "6px 8px",
    borderRadius: 8,
    border: "1px solid transparent",
    color: "#065f46",
    fontWeight: 700,
  },
  cta: {
    background: "#0FAF5A",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: 800,
  },
  hamburgerBtn: {
    display: "none",
    background: "transparent",
    border: "none",
    padding: 6,
    cursor: "pointer",
    color: "#0f1720",
  },

  mobileMenu: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    position: "absolute",
    left: 0,
    right: 0,
    margin: "6px auto 0",
    background: "#fff",
    padding: 12,
    borderRadius: 8,
    boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
    maxWidth: 520,
    boxSizing: "border-box",
    zIndex: 40,
    top: "56px",
  },
  mobileLink: {
    textDecoration: "none",
    color: "#0f1720",
    padding: "8px 6px",
    fontWeight: 700,
  },
};

/* small-screen adjustments via JS-friendly detection: show hamburger on small widths */
(function applyHamburgerVisibility() {
  try {
    const setVisibility = () => {
      const isSmall = typeof window !== "undefined" && window.innerWidth <= 820;
      if (!document) return;
      const styleSheetId = "__landing_nav_responsive_styles";
      if (!document.getElementById(styleSheetId)) {
        const s = document.createElement("style");
        s.id = styleSheetId;
        s.innerHTML = `
          @media (max-width: 820px) {
            /* hide desktop actions, show hamburger */
            header[style] nav { display: none !important; }
            header[style] button[aria-label="Open menu"] { display: inline-flex !important; }
          }
          @media (min-width: 821px) {
            header[style] div[style*="mobileMenu"] { display: none !important; }
          }
        `;
        document.head.appendChild(s);
      }
    };
    if (typeof window !== "undefined") {
      setVisibility();
      window.addEventListener("resize", setVisibility);
    }
  } catch (e) {
    /* ignore; best-effort only */
  }
})();
