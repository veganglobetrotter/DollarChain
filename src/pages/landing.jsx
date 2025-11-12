// File: src/pages/landing.jsx
import React from "react";
import TopNav from "../components/TopNav";
import { useUser } from "../context/UserContext";

export default function Landing() {
  const { user } = useUser();

  return (
    <div style={styles.page}>
      <TopNav />

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
            {/* simple mockup box for now */}
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

const styles = {
  page: { fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", color: "#0f1720" },
  hero: { background: "linear-gradient(180deg, #ffffff, #f7fff7)", padding: "48px 20px 80px" },
  heroInner: { maxWidth: 1100, margin: "0 auto", display: "flex", gap: 24, alignItems: "center" },
  heroCopy: { flex: 1, maxWidth: 640 },
  h1: { fontSize: 40, lineHeight: 1.05, margin: "0 0 12px", color: "#0b4f2b" },
  lead: { fontSize: 18, color: "#374151", marginBottom: 18 },
  ctaRow: { display: "flex", gap: 12, alignItems: "center", marginBottom: 12 },
  primaryBtn: { background: "#0FAF5A", color: "#fff", padding: "10px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 700 },
  linkBtn: { color: "#0FAF5A", padding: "8px 12px", textDecoration: "none", fontWeight: 700 },
  microTrust: { marginTop: 12, color: "#6b7280", fontSize: 13 },
  signedInBanner: { marginTop: 12, padding: 8, background: "#ecfdf3", borderRadius: 8, color: "#065f46" },
  heroVisual: { width: 380, display: "flex", justifyContent: "center" },
  mockupBox: { width: 320, height: 220, borderRadius: 12, background: "#fff", boxShadow: "0 12px 30px rgba(15,23,42,0.08)", padding: 18 },
  mockupLine: { height: 8, width: "80%", background: "#f3f4f6", borderRadius: 8, marginBottom: 10 },
  mockupInvoice: { marginTop: 10 },
  main: { maxWidth: 1100, margin: "40px auto", padding: "0 20px" },
  section: { marginBottom: 36 },
  h2: { fontSize: 22, color: "#0b4f2b", marginBottom: 12 },
  cardRow: { display: "flex", gap: 12 },
  card: { flex: 1, padding: 18, borderRadius: 10, background: "#ffffff", boxShadow: "0 6px 18px rgba(15,23,42,0.04)" },
  steps: { listStyle: "decimal", paddingLeft: 18, display: "grid", gap: 12 },
  pricingRow: { display: "flex", gap: 12 },
  pricingCard: { flex: 1, padding: 18, borderRadius: 10, border: "1px solid #e6f4ea" },
  faqItem: { marginBottom: 8 },
  footer: { maxWidth: 1100, margin: "40px auto", padding: "20px", color: "#6b7280" },
};


// File: src/components/TopNav.jsx
import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import AuthModal from "./AuthModal";

export default function TopNav() {
  const { user, profile } = useUser();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav style={navStyles.nav}>
        <div style={navStyles.left}> 
          <div style={navStyles.logo}>DollarChain</div>
        </div>
        <div style={navStyles.center}>
          <a href="#features" style={navStyles.link}>Features</a>
          <a href="#pricing" style={navStyles.link}>Pricing</a>
          <a href="#faq" style={navStyles.link}>FAQ</a>
        </div>
        <div style={navStyles.right}>
          {user ? (
            <div style={navStyles.account}> 
              <span>{profile?.full_name || user.email}</span>
            </div>
          ) : (
            <>
              <button style={navStyles.textBtn} onClick={() => setOpen(true)}>Sign in</button>
              <button style={navStyles.primary} onClick={() => setOpen(true)}>Get started — Free</button>
            </>
          )}
        </div>
      </nav>

      <AuthModal open={open} onClose={() => setOpen(false)} onAuthSuccess={() => setOpen(false)} />
    </>
  );
}

const navStyles = {
  nav: { position: "sticky", top: 0, zIndex: 80, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "rgba(255,255,255,0.9)", borderBottom: "1px solid rgba(15,23,42,0.04)" },
  left: { display: "flex", alignItems: "center" },
  logo: { fontWeight: 800, color: "#0FAF5A" },
  center: { display: "flex", gap: 14 },
  link: { color: "#0f1720", textDecoration: "none", padding: "6px 8px" },
  right: { display: "flex", gap: 8, alignItems: "center" },
  primary: { background: "#0FAF5A", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer" },
  textBtn: { background: "transparent", border: "none", color: "#0FAF5A", cursor: "pointer" },
  account: { padding: "6px 10px", background: "#ecfdf3", borderRadius: 8, color: "#065f46" }
};


// File: src/components/AuthModal.jsx (UPDATED)
import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthModal({ open, onClose, onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" or "signup" or "magic"
  const [message, setMessage] = useState("");

  if (!open) return null;

  const submit = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Account created — check your email for confirmation.");
        onAuthSuccess && onAuthSuccess();
      } else if (mode === "magic") {
        // V2: send magic link / OTP email
        const { data, error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        setMessage("Check your email — we sent a sign-in link.");
        // don't call onAuthSuccess — user must click the email link
      } else {
        // password login
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // If session present on response, call success handler
        if (data?.session) onAuthSuccess && onAuthSuccess(data.session);
      }
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({ provider: "google" });
      // This will redirect to provider; post-redirect the app will have session
    } catch (err) {
      console.error(err);
      setMessage(err.message || "OAuth error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setMessage("");
    onClose && onClose();
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal} role="dialog" aria-modal="true" aria-label="Sign in">
        <h3 style={{ marginTop: 0 }}>{mode === "signup" ? "Create an account" : mode === "magic" ? "Sign in with email" : "Sign in"}</h3>

        <label style={styles.label}>Email</label>
        <input style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />

        {mode !== "magic" && (
          <>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button style={styles.btnOutline} onClick={handleClose}>Cancel</button>
          <button style={styles.btnPrimary} onClick={submit} disabled={loading}>
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : mode === "magic" ? "Send sign-in link" : "Sign in"}
          </button>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button style={styles.oauthBtn} onClick={signInWithGoogle}>Sign in with Google</button>
        </div>

        <div style={{ marginTop: 12, color: "#6b7280", fontSize: 13 }}>
          {message && <div style={{ marginBottom: 8 }}>{message}</div>}
          {mode === "signup" ? "Already have an account?" : "No account?"}{" "}
          <button style={styles.toggle} onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
          {" | "}
          <button style={styles.toggle} onClick={() => setMode(mode === "magic" ? "login" : "magic")}>
            {mode === "magic" ? "Use password" : "Use magic link"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(10,11,12,0.35)",
    zIndex: 60,
  },
  modal: {
    width: 420,
    maxWidth: "94%",
    borderRadius: 12,
    background: "#fff",
    padding: 18,
    boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
  },
  label: { display: "block", marginTop: 8, marginBottom: 6, fontWeight: 600, color: "#114028" },
  input: { width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #e6e9ef" },
  btnPrimary: { background: "linear-gradient(180deg,#36b852,#1a8917)", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer" },
  btnOutline: { background: "transparent", border: "1px solid #e6e9ef", padding: "8px 12px", borderRadius: 8, cursor: "pointer" },
  toggle: { background: "transparent", border: "none", color: "#1a8917", cursor: "pointer", fontWeight: 700 },
  oauthBtn: { background: "#fff", border: "1px solid #e6e9ef", padding: "8px 12px", borderRadius: 8, cursor: "pointer" },
};
