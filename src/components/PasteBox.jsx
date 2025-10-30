import { useState } from "react";

function PasteBox({ onParse }) {
  const [chatText, setChatText] = useState("");

  const handleParse = () => {
    if (!chatText.trim()) {
      alert("Please paste a WhatsApp chat message first!");
      return;
    }

    // Mock parse result for now
    const mockData = {
      buyerName: "John Doe",
      phone: "+254712345678",
      items: "2x T-Shirts, 1x Cap",
      total: "KES 2,300",
    };

    onParse(mockData);
  };

  return (
    <div style={styles.box}>
      <h2 style={styles.heading}>Paste WhatsApp Chat</h2>
      <textarea
        placeholder="Paste a chat message here..."
        value={chatText}
        onChange={(e) => setChatText(e.target.value)}
        style={styles.textarea}
        rows={5}
      />
      <button onClick={handleParse} style={styles.button}>
        Parse Chat
      </button>
    </div>
  );
}

const styles = {
  box: {
    textAlign: "left",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "1rem",
    marginTop: "1.5rem",
    backgroundColor: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  },
  heading: {
    fontSize: "1.1rem",
    fontWeight: "600",
    marginBottom: "0.5rem",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "1rem",
    resize: "vertical",
    marginBottom: "0.75rem",
  },
  button: {
    backgroundColor: "#1a8917",
    color: "white",
    padding: "0.6rem 1.2rem",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  },
};

export default PasteBox;
