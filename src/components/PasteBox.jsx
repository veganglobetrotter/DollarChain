// src/components/PasteBox.jsx
import { useState } from "react";
import parseOrderText from "../lib/parser";

export default function PasteBox({ onParse }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    setText(e.target.value);
  };

  const handleParseClick = () => {
    const parsed = parseOrderText(text);
    setPreview(parsed);
    // call parent handler (App) with parsed object
    onParse && onParse({
      // match shape expected by InvoiceForm / InvoicePreview
      buyerName: parsed.buyerName || "",
      phone: parsed.phone || "",
      items: parsed.items.length ? parsed.items.map(it => `${it.qty}x ${it.name}`).join(", ") : "",
      total: parsed.total || "",
      paymentNumber: "", // keep empty for seller to fill or prefill later
      rawText: parsed.rawText,
    });
  };

  const handleClear = () => {
    setText("");
    setPreview(null);
  };

  return (
    <div className="paste-card">
      <textarea
        className="paste-textarea"
        placeholder="Paste the WhatsApp order message here. e.g. I want 3 pairs of trousers, 3 caps and 1 tie. Phone +254712345678"
        value={text}
        onChange={handleChange}
      />

      <div className="paste-actions">
        <button className="btn-outline" onClick={handleClear}>Clear</button>
        <button className="btn-primary" onClick={handleParseClick}>Parse & Open Invoice</button>
      </div>

      {preview && (
        <div style={{ marginTop: 12, borderRadius: 10, padding: 12, background: "#fbfdfb", border: "1px solid #eef6ee" }}>
          <div style={{ fontWeight: 700 }}>Parsed Result (Preview)</div>
          <div style={{ color: "#374151", marginTop: 6 }}>
            <div><strong>Buyer:</strong> {preview.buyerName || "—"}</div>
            <div><strong>Phone:</strong> {preview.phone || "—"}</div>
            <div><strong>Items:</strong> {preview.items.length ? preview.items.map(i => `${i.qty}x ${i.name}`).join(", ") : "—"}</div>
            <div><strong>Total:</strong> {preview.total || "—"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
