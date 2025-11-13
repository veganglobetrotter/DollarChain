// src/components/InvoiceForm.jsx
import { useState, useEffect } from "react";
import axios from "axios"; // for credit APIs
import { supabase } from "../lib/supabase";

export default function InvoiceForm({ parsedData = {}, onBack = () => {}, onGenerate }) {
  const [formData, setFormData] = useState({
    buyerName: "",
    phone: "",
    items: [], // structured rows: { description, qty, unitPrice, amount, cents }
    total: "",
    paymentNumber: "",
  });

  const [walletMessage, setWalletMessage] = useState("");

  useEffect(() => {
    // initialise basic fields
    setFormData((prev) => ({
      ...prev,
      buyerName: parsedData.buyerName || "",
      phone: parsedData.phone || "",
      paymentNumber: parsedData.paymentNumber || "",
    }));

    // Normalise parsedData.items into structured rows
    const rawItems = parsedData.items ?? parsedData.lines ?? parsedData.itemsText ?? "";
    const structured = normalizeIncomingItems(rawItems);
    if (structured.length) {
      const total = sumAmounts(structured);
      setFormData((prev) => ({ ...prev, items: structured, total }));
    }
  }, [parsedData]);

  // ---------- helpers ----------
  function parseNumber(s) {
    if (s === null || s === undefined) return NaN;
    const cleaned = String(s).replace(/[^\d.-]/g, "").replace(/,+/g, "");
    return cleaned === "" ? NaN : Number(cleaned);
  }

  function moneyParts(n) {
    if (isNaN(n)) return { whole: "", cents: "00" };
    const rounded = Math.round(Math.abs(n) * 100) / 100;
    const whole = Math.floor(rounded);
    const cents = Math.round((rounded - whole) * 100).toString().padStart(2, "0");
    return { whole: whole.toLocaleString("en-GB"), cents };
  }

  function toFixedAmount(n) {
    if (isNaN(n)) return "";
    return Math.round(n).toString();
  }

  function safeNum(v) {
    const n = parseNumber(v);
    return isNaN(n) ? null : n;
  }

  function sumAmounts(rows) {
    return rows.reduce((acc, r) => {
      const a = safeNum(r.amount);
      return acc + (a === null ? 0 : a);
    }, 0);
  }

  // Try to parse many common textual item formats into structured rows
  function parseItemLine(line) {
    line = String(line || "").trim();
    if (!line) return null;

    // 1) "2x Cotton Shirt @ 1800"
    let m = line.match(/^(\d+)\s*[x×]\s*(.+?)\s*@\s*([KkEeSs\s]*[\d,\.]+)$/i);
    if (m) {
      const qty = Number(m[1]);
      const desc = m[2].trim();
      const unit = parseNumber(m[3]);
      const amount = !isNaN(unit) && !isNaN(qty) ? unit * qty : "";
      const cents = amount !== "" ? moneyParts(amount).cents : "00";
      return { description: desc, qty, unitPrice: unit || "", amount: amount || "", cents };
    }

    // 2) "Desc | qty | unit | total" or comma-separated "Desc, qty, unit, total"
    m = line.split(/\s*\|\s*/);
    if (m.length >= 2) {
      const desc = m[0].trim();
      const qty = Number(String(m[1] || "").replace(/[^\d]/g, "")) || "";
      const unit = parseNumber(m[2] || "") || "";
      const amount = parseNumber(m[3] || "") || (unit && qty ? unit * qty : "");
      const cents = amount ? moneyParts(amount).cents : "00";
      return { description: desc, qty: qty || "", unitPrice: unit || "", amount: amount || "", cents };
    }
    // comma separated fallback
    m = line.split(/\s*,\s*/);
    if (m.length >= 2) {
      const desc = m[0].trim();
      const qty = Number(String(m[1] || "").replace(/[^\d]/g, "")) || "";
      const unit = parseNumber(m[2] || "") || "";
      const amount = parseNumber(m[3] || "") || (unit && qty ? unit * qty : "");
      const cents = amount ? moneyParts(amount).cents : "00";
      return { description: desc, qty: qty || "", unitPrice: unit || "", amount: amount || "", cents };
    }

    // 3) "Desc 2 1800" (desc qty unit)
    m = line.match(/^(.+?)\s+(\d+)\s+([KkEeSs\s]*[\d,\.]+)$/i);
    if (m) {
      const desc = m[1].trim();
      const qty = Number(m[2]);
      const unit = parseNumber(m[3]);
      const amount = !isNaN(unit) && !isNaN(qty) ? unit * qty : "";
      const cents = amount ? moneyParts(amount).cents : "00";
      return { description: desc, qty, unitPrice: unit || "", amount: amount || "", cents };
    }

    // 4) "2 Cotton Shirt" -> qty + desc
    m = line.match(/^(\d+)\s+[x×]?\s*(.+)$/i);
    if (m) {
      const qty = Number(m[1]);
      const desc = m[2].trim();
      return { description: desc, qty, unitPrice: "", amount: "", cents: "00" };
    }

    // fallback: everything as description
    return { description: line, qty: "", unitPrice: "", amount: "", cents: "00" };
  }

  function normalizeIncomingItems(raw) {
    // Accept structured array
    if (Array.isArray(raw) && raw.length && typeof raw[0] === "object") {
      // Ensure each row has expected fields
      return raw.map((r) => {
        const description = r.description || r.name || r.desc || "";
        const qty = r.qty ?? r.quantity ?? r.q ?? "";
        const unitPrice = r.unitPrice ?? r.unit ?? r.rate ?? r.price ?? "";
        const amount = r.amount ?? r.total ?? (unitPrice && qty ? parseNumber(unitPrice) * Number(qty) : "");
        const cents = amount ? moneyParts(amount).cents : "00";
        return { description: String(description), qty: qty === "" ? "" : Number(qty), unitPrice: unitPrice || "", amount: amount || "", cents };
      });
    }

    // Accept string: split by commas/newlines
    const str = Array.isArray(raw) ? raw.join(", ") : String(raw || "");
    if (!str.trim()) return [];

    const lines = str.split(/[\r\n]+|[,•·]+/).map((l) => l.trim()).filter(Boolean);
    const out = lines.map((line) => parseItemLine(line)).filter(Boolean);
    return out;
  }

  // ---------- row manipulation ----------
  function addRow() {
    setFormData((prev) => {
      const items = [...prev.items, { description: "", qty: "", unitPrice: "", amount: "", cents: "00" }];
      return { ...prev, items, total: sumAmounts(items) };
    });
  }

  function removeRow(idx) {
    setFormData((prev) => {
      const items = prev.items.slice();
      items.splice(idx, 1);
      return { ...prev, items, total: sumAmounts(items) };
    });
  }

  function updateRow(idx, key, value) {
    setFormData((prev) => {
      const items = prev.items.slice();
      const row = { ...(items[idx] || {}) };
      row[key] = value;

      // auto-calc amount when qty or unitPrice changes
      const qtyNum = safeNum(row.qty);
      const unitNum = safeNum(row.unitPrice);
      if (!isNaN(qtyNum) && !isNaN(unitNum)) {
        const amount = Number(qtyNum) * Number(unitNum);
        row.amount = Math.round(amount);
        row.cents = moneyParts(amount).cents;
      } else if (key === "amount") {
        // if user typed amount directly, try to fill cents
        const amt = safeNum(row.amount);
        row.cents = amt === null ? "00" : moneyParts(amt).cents;
      }

      items[idx] = row;
      return { ...prev, items, total: sumAmounts(items) };
    });
  }

  // ---------- wallet / credits and submit ----------
  const handleSubmit = async (e) => {
    e && e.preventDefault();

    const creditsPerInvoice = 10;

    // ensure formData.total based on rows
    const totalValue = sumAmounts(formData.items);
    const normalizedForm = { ...formData, total: totalValue };

    // 1) Resolve user ID properly
    let userId;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id;
      if (!userId) throw new Error("User not authenticated");
    } catch (err) {
      console.error("Failed to get user:", err);
      setWalletMessage("Failed to get user session. Cannot generate invoice.");
      return;
    }

    // 2) Reserve credits
    let reservationId = null;
    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await axios.post("/api/reserveCredits", {
        userId,
        amount: creditsPerInvoice,
        idempotencyKey,
      });
      reservationId = res.data?.reservation?.id || res.data?.reservation_id;
      setWalletMessage(`Reserved ${creditsPerInvoice} credits.`);
    } catch (err) {
      console.error("Reserve credits failed:", err);
      let serverMsg = "Unknown error";
      if (err?.response?.data) {
        serverMsg = typeof err.response.data === "string" ? err.response.data : JSON.stringify(err.response.data);
      } else if (err?.message) {
        serverMsg = err.message;
      } else {
        serverMsg = String(err);
      }
      setWalletMessage(`Failed to reserve credits. ${serverMsg}`);
      return;
    }

    // 3) Attempt invoice generation
    try {
      if (typeof onGenerate === "function") {
        await onGenerate(normalizedForm);
      } else {
        alert(`Invoice ready for ${normalizedForm.buyerName}!`);
        console.log("Final invoice data:", normalizedForm);
      }

      // 4) Consume credits after successful generation
      try {
        await axios.post("/api/consumeCredits", {
          userId,
          reservationId,
          delta: creditsPerInvoice,
          type: "invoice",
          reference: `invoice-${Date.now()}`,
        });
        setWalletMessage(`Consumed ${creditsPerInvoice} credits.`);
      } catch (consumeErr) {
        console.error("Consume credits failed:", consumeErr);
        let msg = "Invoice generated, but failed to consume credits. Admin may need to adjust.";
        if (consumeErr?.response?.data) msg += ` (${JSON.stringify(consumeErr.response.data)})`;
        setWalletMessage(msg);
      }
    } catch (generateErr) {
      console.error("Invoice generation failed:", generateErr);
      // 5) Release reserved credits if generation fails
      try {
        await axios.post("/api/releaseCredits", {
          userId,
          reservationId,
        });
        setWalletMessage("Invoice failed. Reserved credits released.");
      } catch (releaseErr) {
        console.error("Release credits failed:", releaseErr);
        let msg = "Invoice failed and credits may be stuck. Admin check required.";
        if (releaseErr?.response?.data) msg += ` (${JSON.stringify(releaseErr.response.data)})`;
        setWalletMessage(msg);
      }
    }
  };

  // Copy structured form to clipboard
  const safeCopyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        alert("Form copied to clipboard for easy testing.");
      } else {
        window.prompt("Copy the form data (Ctrl+C / Cmd+C, Enter):", text);
      }
    } catch (err) {
      console.warn("Clipboard write failed, falling back to prompt:", err);
      window.prompt("Copy the form data:", text);
    }
  };

  // ---------- UI ----------
  return (
    <div className="formBox fade-in invoice-form" role="region" aria-labelledby="invoice-heading">
      <h2 id="invoice-heading" style={{ marginTop: 0, marginBottom: 12 }}>
        🧾 Review & Edit Invoice
      </h2>

      {walletMessage && (
        <div style={{ marginBottom: 12, padding: 8, background: "#f0fdfa", color: "#065f46", borderRadius: 6 }}>
          {walletMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label style={{ ...labelStyle, color: "var(--text)" }} htmlFor="buyerName">
          Buyer Name
        </label>
        <input id="buyerName" name="buyerName" value={formData.buyerName} onChange={(e) => setFormData((p) => ({ ...p, buyerName: e.target.value }))} style={inputStyle} placeholder="Buyer full name" required />

        <label style={{ ...labelStyle, color: "var(--text)" }} htmlFor="phone">
          Phone Number
        </label>
        <input id="phone" name="phone" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} style={inputStyle} placeholder="+254712345678" />

        <label style={{ ...labelStyle, color: "var(--text)" }} htmlFor="items">
          Items
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Add rows; qty and unit price will auto-calc amount.</div>
        </label>

        <div style={{ border: "1px solid #eef2f6", borderRadius: 8, padding: 8, marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 90px 36px 40px", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontWeight: 700 }}>Description</div>
            <div style={{ fontWeight: 700 }}>Qty</div>
            <div style={{ fontWeight: 700 }}>Unit (KSH)</div>
            <div style={{ fontWeight: 700 }}>Amount</div>
            <div style={{ fontWeight: 700 }}>Cts</div>
            <div />
          </div>

          {formData.items.map((row, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 90px 36px 40px", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <input
                type="text"
                value={row.description || ""}
                onChange={(e) => updateRow(idx, "description", e.target.value)}
                placeholder="Item description"
                style={{ padding: 8, borderRadius: 8, border: "1px solid #e6e9ef" }}
              />
              <input
                type="number"
                value={row.qty ?? ""}
                min="0"
                onChange={(e) => updateRow(idx, "qty", e.target.value)}
                style={{ padding: 8, borderRadius: 8, border: "1px solid #e6e9ef" }}
              />
              <input
                type="text"
                value={row.unitPrice ?? ""}
                onChange={(e) => updateRow(idx, "unitPrice", e.target.value)}
                placeholder="e.g. 1,800"
                style={{ padding: 8, borderRadius: 8, border: "1px solid #e6e9ef", textAlign: "right" }}
              />
              <input
                type="text"
                value={row.amount ?? ""}
                onChange={(e) => updateRow(idx, "amount", e.target.value)}
                placeholder=""
                style={{ padding: 8, borderRadius: 8, border: "1px solid #e6e9ef", textAlign: "right" }}
              />
              <input type="text" value={row.cents ?? ""} onChange={(e) => updateRow(idx, "cents", e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #e6e9ef", textAlign: "right" }} />
              <div>
                <button type="button" onClick={() => removeRow(idx)} className="btn-outline" aria-label="Remove row" style={{ padding: "6px 8px" }}>
                  ✕
                </button>
              </div>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="button" className="btn-outline" onClick={addRow}>
              + Add row
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                // quick parse from plain textarea-like examples in parsedData.items if any
                const examples = parsedData.items || parsedData.itemsText || "";
                const parsed = normalizeIncomingItems(examples);
                if (parsed.length) {
                  setFormData((prev) => ({ ...prev, items: parsed, total: sumAmounts(parsed) }));
                  return;
                }
                addRow();
              }}
            >
              Try parse sample
            </button>
          </div>
        </div>

        <label style={{ ...labelStyle, color: "var(--text)" }} htmlFor="total">
          Total Amount
        </label>
        <input id="total" name="total" value={formData.total || ""} onChange={(e) => setFormData((p) => ({ ...p, total: e.target.value }))} style={inputStyle} placeholder="KES 2,300" />

        <label style={{ ...labelStyle, color: "var(--text)" }} htmlFor="paymentNumber">
          Payment Number (Account / Paybill / Phone)
        </label>
        <input id="paymentNumber" name="paymentNumber" value={formData.paymentNumber} onChange={(e) => setFormData((p) => ({ ...p, paymentNumber: e.target.value }))} style={inputStyle} placeholder="e.g. 254712345678 or 123456 (Paybill)" />

        {parsedData?.notes?.length > 0 && (
          <div style={{ marginTop: 12, padding: 10, background: "#fffaf0", borderRadius: 8, border: "1px solid #fae6c1" }}>
            <strong style={{ color: "#92400e" }}>Parser notes:</strong>
            <ul style={{ margin: "8px 0 0 16px", color: "#92400e" }}>{parsedData.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </div>
        )}

        <div className="form-controls" style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
          <button type="button" className="btn-outline" onClick={() => onBack?.()}>
            ⬅ Back
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn-outline" onClick={() => safeCopyToClipboard(JSON.stringify(formData))}>
              Copy
            </button>
            <button type="submit" className="btn-primary">
              Generate
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  // copy helper reused locally
  async function safeCopyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        alert("Form copied to clipboard for easy testing.");
      } else {
        window.prompt("Copy the form data (Ctrl+C / Cmd+C, Enter):", text);
      }
    } catch (err) {
      console.warn("Clipboard write failed, falling back to prompt:", err);
      window.prompt("Copy the form data:", text);
    }
  }
}

const labelStyle = { display: "block", marginBottom: 6, fontWeight: 600 };
const inputStyle = { width: "100%", padding: "0.7rem", borderRadius: 10, border: "1px solid #e6e9ef", marginBottom: 12, fontSize: 15 };
