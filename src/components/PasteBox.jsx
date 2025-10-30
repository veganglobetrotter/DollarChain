// src/components/PasteBox.jsx
import { useState } from "react";
import parseOrderText from "../lib/parser";

/* Small visual badge */
function ConfidenceBadge({ score }) {
  const s = Number(score || 0);
  const style = {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
  };
  if (s >= 0.8) {
    return <span style={{ ...style, background: "#16a34a" }}>✓ {Math.round(s*100)}%</span>;
  } else if (s >= 0.5) {
    return <span style={{ ...style, background: "#f59e0b" }}>~ {Math.round(s*100)}%</span>;
  } else {
    return <span style={{ ...style, background: "#ef4444" }}>! {Math.round(s*100)}%</span>;
  }
}

export default function PasteBox({ onParse }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState(null);
  // editable fields for user correction before invoking onParse
  const [buyerName, setBuyerName] = useState("");
  const [phone, setPhone] = useState("");
  const [itemsStr, setItemsStr] = useState("");
  const [total, setTotal] = useState("");

  const handleChange = (e) => setText(e.target.value);

  const doParse = () => {
    const p = parseOrderText(text);
    setParsed(p);
    setBuyerName(p.buyerName || "");
    setPhone(p.phone || "");
    setItemsStr(p.items && p.items.length ? p.items.map(it => `${it.qty}x ${it.name}`).join(", ") : "");
    setTotal(p.total || "");
  };

  const handleClear = () => {
    setText("");
    setParsed(null);
    setBuyerName("");
    setPhone("");
    setItemsStr("");
    setTotal("");
  };

  const handleConfirm = () => {
    // If buyerName is missing, require the user to enter it (small prompt behavior)
    if (!buyerName || buyerName.trim().length < 2) {
      if (!confirm("Buyer name was not detected automatically. Do you want to proceed without a buyer name?")) return;
    }

    // call parent with a shape matching InvoiceForm expectations
    onParse && onParse({
      buyerName: buyerName.trim(),
      phone: phone.trim(),
      items: itemsStr.trim(),
      total: total.trim(),
      paymentNumber: "", // seller will fill
      rawText: parsed ? parsed.rawText : text,
      confidence: parsed ? parsed.confidence : null,
      notes: parsed ? parsed.notes : []
    });

    // keep the parse preview visible; parent will open the form/modal
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
        <button className="btn-primary" onClick={doParse}>Parse</button>
      </div>

      {parsed && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ fontWeight: 800 }}>Parsed Result (Preview)</div>
            <div style={{ color: "#6b7280", fontSize: 13 }}>
              Overall confidence: <ConfidenceBadge score={parsed.confidence.overall} />
            </div>
          </div>

          <div style={{ marginTop: 10, borderRadius: 10, padding: 12, background: "#fbfdfb", border: "1px solid #eef6ee" }}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 700 }}>Buyer:</label>{" "}
              <ConfidenceBadge score={parsed.confidence.name} />
              <div style={{ marginTop: 6 }}>
                <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Buyer name (enter if missing)" style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #e6e9ef" }} />
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <label style={{ fontWeight: 700 }}>Phone:</label>{" "}
              <ConfidenceBadge score={parsed.confidence.phone} />
              <div style={{ marginTop: 6 }}>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (normalized)" style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #e6e9ef" }} />
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <label style={{ fontWeight: 700 }}>Items:</label>{" "}
              <ConfidenceBadge score={parsed.confidence.items} />
              <div style={{ marginTop: 6 }}>
                <input value={itemsStr} onChange={(e) => setItemsStr(e.target.value)} placeholder="e.g. 3x T-shirt, 1x Cap" style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #e6e9ef" }} />
                <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
                  Parsed segments: {parsed.items && parsed.items.length ? parsed.items.map(it => `${it.qty}x ${it.name}`).join(" • ") : "—"}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <label style={{ fontWeight: 700 }}>Total:</label>{" "}
              <ConfidenceBadge score={parsed.confidence.total} />
              <div style={{ marginTop: 6 }}>
                <input value={total} onChange={(e) => setTotal(e.target.value)} placeholder="e.g. KES 2,300" style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #e6e9ef" }} />
              </div>
            </div>

            {parsed.notes && parsed.notes.length > 0 && (
              <div style={{ marginTop: 10, color: "#b45309" }}>
                <strong>Notes:</strong> {parsed.notes.join("; ")}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button className="btn-outline" onClick={() => { setParsed(null); }}>Cancel</button>
              <button className="btn-primary" onClick={handleConfirm}>Parse & Open Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
