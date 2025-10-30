import { useState } from "react";
import "./App.css";
import PasteBox from "./components/PasteBox";

function App() {
  const [parsedData, setParsedData] = useState(null);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💵 DollarChain</h1>
      <p style={styles.subtitle}>
        Turn WhatsApp chats into invoices in seconds.
      </p>

      <PasteBox onParse={setParsedData} />

      {parsedData && (
        <div style={styles.card}>
          <h3>Parsed Result (Preview)</h3>
          <p>
            <strong>Buyer:</strong> {parsedData.buyerName}
          </p>
          <p>
            <strong>Phone:</strong> {parsedData.phone}
          </p>
          <p>
            <strong>Items:</strong> {parsedData.items}
          </p>
          <p>
            <strong>Total:</strong> {parsedData.total}
          </p>
        </div>
      )}

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
    marginTop: "1.5rem",
    textAlign: "left",
  },
  footer: {
    marginTop: "3rem",
    fontSize: "0.9rem",
    color: "#777",
  },
};

export default App;
