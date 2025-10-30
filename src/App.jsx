import { useState } from "react";
import "./App.css";

function App() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💵 DollarChain</h1>
      <p style={styles.subtitle}>
        Turn WhatsApp chats into invoices in seconds.
      </p>

      <div style={styles.card}>
        <p>
          🚀 We’re setting things up. Next, you’ll be able to paste your chat
          message here and generate an invoice.
        </p>
      </div>

      <footer style={styles.footer}>
        <p>
          Built with ❤️ for micro-sellers •{" "}
          <a href="https://dollarchain.store" target="_blank" rel="noreferrer">
            dollarchain.store
          </a>
        </p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "2rem",
    textAlign: "center",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "0.5rem",
  },
  subtitle: {
    color: "#555",
    marginBottom: "2rem",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "1.5rem",
    backgroundColor: "#fafafa",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  footer: {
    marginTop: "3rem",
    fontSize: "0.9rem",
    color: "#777",
  },
};

export default App;
