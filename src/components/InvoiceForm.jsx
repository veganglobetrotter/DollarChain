import { useState, useEffect } from "react";
import axios from "axios"; // added for calling credit APIs
import { supabase } from "../lib/supabase"; // canonical client

export default function InvoiceForm({ parsedData = {}, onBack = () => {}, onGenerate }) {
  const [formData, setFormData] = useState({
    buyerName: "",
    phone: "",
    items: "",
    total: "",
    paymentNumber: "",
  });

  const [walletMessage, setWalletMessage] = useState(""); // state for wallet feedback

  useEffect(() => {
    setFormData({
      buyerName: parsedData.buyerName || "",
      phone: parsedData.phone || "",
      items: parsedData.items || "",
      total: parsedData.total || "",
      paymentNumber: parsedData.paymentNumber || "",
    });
  }, [parsedData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ---------------------
  // Helpers: parsing utils
  // ---------------------
  const parseNumber = (s) => {
    if (s === null || s === undefined) return NaN;
    const cleaned = String(s).replace(/[^\d.-]/g, "").replace(/,+/g, "");
    return cleaned === "" ? NaN : Number(cleaned);
  };

  // convert a numeric value into { whole, cents } or return empty parts for display
  const formatMoneyParts = (n) => {
    if (isNaN(n)) return { whole: "", cents: "00" };
    const rounded = Math.round(Math.abs(n) * 100) / 100;
    const whole = Math.floor(rounded);
    const cents = Math.round((rounded - whole) * 100).toString().padStart(2, "0");
    return { whole: whole.toLocaleString("en-GB"), cents };
  };

  // Accepts:
  // - array of structured objects -> pass through
  // - array of strings or single string -> try to parse useful patterns
  // Patterns supported: "2x Cotton Shirt @ 1800", "Cotton Shirt | 2 | 1800", "Cotton Shirt,2,1800", "2 Cotton Shirt"
  const buildStructuredItems = (rawItems) => {
    if (!rawItems && rawItems !== 0) return [];

    // if items is already an array of objects with description/qty keys, return normalized objects
    if (Array.isArray(rawItems) && rawItems.length > 0 && typeof rawItems[0] === "object") {
      return rawItems.map((r) => {
        const description = r.description || r.name || r.desc || "";
        const qty = Number(String(r.qty ?? r.quantity ?? r.q ?? 1).replace(/[^\d]/g, "")) || 1;
        const unitPrice = parseNumber(r.unitPrice ?? r.unit ?? r.rate ?? r.price ?? r.priceRaw ?? "");
        const amount = parseNumber(r.amount ?? r.total ?? (isNaN(unitPrice) ? "" : unitPrice * qty));
        const cents = formatMoneyParts(amount).cents;
        return { description, qty, unitPrice: isNaN(unitPrice) ? null : unitPrice, amount: isNaN(amount) ? null : amount, cents };
      });
    }

    // If it's a single string, split into lines by newline or comma separators
    const lines =
      Array.isArray(rawItems) && rawItems.length > 0
        ? rawItems.map((it) => String(it).trim()).filter(Boolean)
        : String(rawItems)
            .split(/[\r\n]+|[,•·]+/)
            .map((it) => String(it).trim())
            .filter(Boolean);

    const out = lines.map((line) => {
      line = String(line).trim();

      // 1) "2x Cotton Shirt @ 1800" -> qty, desc, unitPrice
      let m = line.match(/^(\d+)\s*[x×]\s*(.+?)\s*@\s*([KkEeSs\s]*[\d,\.]+)$/i);
      if (m) {
        const qty = Number(m[1]);
        const description = m[2].trim();
        const unitPrice = parseNumber(m[3]);
        const amount = !isNaN(unitPrice) ? qty * unitPrice : null;
        return { description, qty, unitPrice: isNaN(unitPrice) ? null : unitPrice, amount: isNaN(amount) ? null : amount, cents: formatMoneyParts(amount).cents };
      }

      // 2) "Cotton Shirt @ 1800 x2" or "Cotton Shirt @ 1800, 2"
      m = line.match(/^(.+?)\s*@\s*([KkEeSs\s]*[\d,\.]+)\s*[,\s]+(\d+)$/i);
      if (m) {
        const description = m[1].trim();
        const unitPrice = parseNumber(m[2]);
        const qty = Number(m[3]);
        const amount = !isNaN(unitPrice) ? qty * unitPrice : null;
        return { description, qty, unitPrice: isNaN(unitPrice) ? null : unitPrice, amount: isNaN(amount) ? null : amount, cents: formatMoneyParts(amount).cents };
      }

      // 3) pipe-delimited or pipe-like: desc | qty | unit | total
      let parts = line.split(/\s*\|\s*/);
      if (parts.length >= 2) {
        const description = parts[0].trim();
        const qty = Number(String(parts[1] || "").replace(/[^\d]/g, "")) || 1;
        const unitPrice = parseNumber(parts[2] || "");
        const amount = parseNumber(parts[3] || "") || (!isNaN(unitPrice) && !isNaN(qty) ? unitPrice * qty : null);
        return { description, qty, unitPrice: isNaN(unitPrice) ? null : unitPrice, amount: isNaN(amount) ? null : amount, cents: formatMoneyParts(amount).cents };
      }

      // 4) comma-separated: desc, qty, unit, total
      parts = line.split(/\s*,\s*/);
      if (parts.length >= 2) {
        const description = parts[0].trim();
        const qty = Number(String(parts[1] || "").replace(/[^\d]/g, "")) || 1;
        const unitPrice = parseNumber(parts[2] || "");
        const amount = parseNumber(parts[3] || "") || (!isNaN(unitPrice) && !isNaN(qty) ? unitPrice * qty : null);
        return { description, qty, unitPrice: isNaN(unitPrice) ? null : unitPrice, amount: isNaN(amount) ? null : amount, cents: formatMoneyParts(amount).cents };
      }

      // 5) "2 Cotton Shirt" or "2 Item" fallback
      m = line.match(/^(\d+)\s+[x×]?\s*(.+)$/i);
      if (m) {
        const qty = Number(m[1]);
        const description = m[2].trim();
        return { description, qty, unitPrice: null, amount: null, cents: "00" };
      }

      // final fallback: treat whole line as description, qty=1
      return { description: line, qty: 1, unitPrice: null, amount: null, cents: "00" };
    });

    return out;
  };

  // Confidence badge
  const ConfidenceBadge = ({ score }) => {
    if (score === undefined || score === null) return null;
    const s = Number(score);
    const base = {
      display: "inline-block",
      padding: "4px 8px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      color: "#fff",
      marginLeft: 8,
    };
    if (s >= 0.8) return <span style={{ ...base, background: "#16a34a" }}>✓ {Math.round(s * 100)}%</span>;
    else if (s >= 0.5) return <span style={{ ...base, background: "#f59e0b" }}>~ {Math.round(s * 100)}%</span>;
    else return <span style={{ ...base, background: "#ef4444" }}>! {Math.round(s * 100)}%</span>;
  };

  const confidence = parsedData?.confidence || {};

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

  const handleSubmit = async (e) => {
    e && e.preventDefault();

    const creditsPerInvoice = 10;

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
        serverMsg =
          typeof err.response.data === "string"
            ? err.response.data
            : JSON.stringify(err.response.data);
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
      // Build structured items and final payload BEFORE calling onGenerate
      const structuredItems = buildStructuredItems(formData.items);
      const payload = {
        buyerName: formData.buyerName,
        phone: formData.phone,
        items: structuredItems,
        total: formData.total,
        paymentNumber: formData.paymentNumber,
      };

      if (typeof onGenerate === "function") {
        await onGenerate(payload);
      } else {
        alert(`Invoice ready for ${payload.buyerName}!\n\n(We will show a preview next step.)`);
        console.log("Final invoice data:", payload);
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
        if (consumeErr?.response?.data) {
          msg += ` (${JSON.stringify(consumeErr.response.data)})`;
        }
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
        if (releaseErr?.response?.data) {
          msg += ` (${JSON.stringify(releaseErr.response.data)})`;
        }
        setWalletMessage(msg);
      }
    }
  };

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
          <ConfidenceBadge score={confidence.name} />
        </label>
        <input
          id="buyerName"
          name="buyerName"
          value={formData.buyerName}
          onChange={handleChange}
          style={inputStyle}
          placeholder="Buyer full name"
          required
        />

        <label style={{ ...labelStyle, color: "var(--text)" }} htmlFor="phone">
          Phone Number
          <ConfidenceBadge score={confidence.phone} />
        </label>
        <input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          style={inputStyle}
          placeholder="+254712345678"
        />

        <label style={{ ...labelStyle, color: "var(--text)" }} htmlFor="items">
          Items (comma separated or one per line). You can also use structured lines like:
          <br />
          <small style={{ color: "#6b7280" }}>2x Cotton Shirt @ 1800  — or — Cotton Shirt | 2 | 1800</small>
          <ConfidenceBadge score={confidence.items} />
        </label>
        <textarea
          id="items"
          name="items"
          value={formData.items}
          onChange={handleChange}
          rows="3"
          style={textareaStyle}
          placeholder="e.g. 2x T-Shirt @ 1200, 1x Cap @ 300"
        />

        <label style={{ ...labelStyle, color: "var(--text)" }} htmlFor="total">
          Total Amount
          <ConfidenceBadge score={confidence.total} />
        </label>
        <input
          id="total"
          name="total"
          value={formData.total}
          onChange={handleChange}
          style={inputStyle}
          placeholder="KES 2,300"
        />

        <label style={{ ...labelStyle, color: "var(--text)" }} htmlFor="paymentNumber">
          Payment Number (Account / Paybill / Phone)
        </label>
        <input
          id="paymentNumber"
          name="paymentNumber"
          value={formData.paymentNumber}
          onChange={handleChange}
          style={inputStyle}
          placeholder="e.g. 254712345678 or 123456 (Paybill)"
        />

        {parsedData?.notes?.length > 0 && (
          <div style={{ marginTop: 12, padding: 10, background: "#fffaf0", borderRadius: 8, border: "1px solid #fae6c1" }}>
            <strong style={{ color: "#92400e" }}>Parser notes:</strong>
            <ul style={{ margin: "8px 0 0 16px", color: "#92400e" }}>
              {parsedData.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="form-controls" style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
          <button type="button" className="btn-outline" onClick={() => onBack?.()} aria-label="Back to paste">
            ⬅ Back
          </button>

          <div className="form-actions" style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                // copy the structured payload to clipboard for easy testing
                const structured = { ...formData, items: buildStructuredItems(formData.items) };
                safeCopyToClipboard(JSON.stringify(structured, null, 2));
              }}
              aria-label="Copy form to clipboard"
            >
              Copy
            </button>
            <button type="submit" className="btn-primary" aria-label="Generate invoice">
              Generate
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const labelStyle = { display: "block", marginBottom: 6, fontWeight: 600 };
const inputStyle = { width: "100%", padding: "0.7rem", borderRadius: 10, border: "1px solid #e6e9ef", marginBottom: 12, fontSize: 15 };
const textareaStyle = { width: "100%", padding: "0.7rem", borderRadius: 10, border: "1px solid #e6e9ef", marginBottom: 12, fontSize: 15, resize: "vertical" };
