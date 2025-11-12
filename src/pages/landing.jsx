// src/pages/landing.jsx
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
