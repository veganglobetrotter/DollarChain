import { useState } from "react";

export default function PasteBox({ onParse }) {
  const [chatText, setChatText] = useState("");

  const handleGenerate = () => {
    if (!chatText.trim()) {
      alert("Please paste a WhatsApp chat message first!");
      return;
    }

    // Temporary mock parse — later we will replace with real parser
    const mockData = {
      buyerName: "John Doe",
      phone: "+254712345678",
      items: "2x T-Shirts, 1x Cap",
      total: "KES 2,300",
    };

    onParse(mockData);
  };

  return (
    <div className="paste-card fade-in">
      <label className="sr-only" htmlFor="chat-input">WhatsApp chat input</label>
      <textarea
        id="chat-input"
        className="paste-textarea"
        placeholder="Paste the WhatsApp order chat here..."
        value={chatText}
        onChange={(e) => setChatText(e.target.value)}
        rows={6}
      />

      <div className="paste-actions">
        <button className="btn-outline" onClick={() => setChatText("")}>
          Clear
        </button>
        <button className="btn-primary" onClick={handleGenerate}>
          Generate
        </button>
      </div>
    </div>
  );
}
