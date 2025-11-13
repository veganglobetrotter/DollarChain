// src/components/PasteBox.jsx
import { useState } from "react";
import { supabase } from "../lib/supabase";
import parseOrderText from "../lib/parser";
import { reserveCredits, consumeCredits, releaseCredits } from "../lib/invoicesClient";

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
    return <span style={{ ...style, background: "#16a34a" }}>✓ {Math.round(s * 100)}%</span>;
  } else if (s >= 0.5) {
    return <span style={{ ...style, background: "#f59e0b" }}>~ {Math.round(s * 100)}%</span>;
  } else {
    return <span style={{ ...style, background: "#ef4444" }}>! {Math.round(s * 100)}%</span>;
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

  // wallet/credit UI (kept for logs/debugging but not shown)
  const [walletMessage, setWalletMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setText(e.target.value);

  // doParse now reserves and consumes credits before parsing
  const doParse = async () => {
    setWalletMessage("");
    setLoading(true);

    const creditsPerParse = 10; // adjust as needed
    let userId = null;
    let reservationId = null;

    try {
      // 1) Resolve user ID using Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id;
      if (!userId) throw new Error("User not authenticated");

      // 2) Reserve credits via invoicesClient helper
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

      const { reservation, error: reserveErr } = await reserveCredits(userId, creditsPerParse, idempotencyKey);
      if (reserveErr || !reservation) {
        const serverMsg = reserveErr?.message || (reserveErr && String(reserveErr)) || "Failed to reserve credits";
        throw new Error(serverMsg);
      }

      // extract reservation id robustly (server may return object/array)
      const reservationRaw = reservation;
      if (!reservationRaw) {
        reservationId = null;
      } else if (Array.isArray(reservationRaw)) {
        reservationId =
          reservationRaw[0]?.reservation_id || reservationRaw[0]?.reservationId || reservationRaw[0]?.id || null;
      } else if (typeof reservationRaw === "object") {
        reservationId =
          reservationRaw?.reservation_id || reservationRaw?.reservationId || reservationRaw?.id || reservationRaw?.reservation || null;
      } else {
        reservationId = reservationRaw;
      }

      // last-resort checks
      reservationId = reservationId || (reservation && reservation.reservation_id) || null;
      if (!reservationId) {
        throw new Error(`Failed to parse reservation id from reserve response: ${JSON.stringify(reservation)}`);
      }

      const shortResId = reservationId?.toString?.()?.slice?.(0, 8) ?? reservationId;
      // Keep internal logable state but do NOT surface to the user:
      setWalletMessage(`Reserved ${creditsPerParse} credits (res ${shortResId}).`);

      // 3) Call parser (synchronous or asynchronous)
      let p;
      try {
        p = await Promise.resolve(parseOrderText(text));
      } catch (parseErr) {
        // If parsing fails, attempt to release reservation before rethrowing
        try {
          await releaseCredits(userId, reservationId);
          setWalletMessage("Parsing failed. Reserved credits released.");
        } catch (releaseErr) {
          console.error("Failed to release after parse error:", releaseErr);
          setWalletMessage("Parsing failed. Could not release reservation automatically — contact admin.");
        }
        throw new Error(`Parsing failed: ${parseErr?.message || String(parseErr)}`);
      }

      // 4) Consume credits after successful parse via helper
      const { transaction, error: consumeErr } = await consumeCredits(
        userId,
        reservationId,
        creditsPerParse,
        "parse",
        `parse-${Date.now()}`
      );

      if (consumeErr || !transaction) {
        // Attempt to release then surface error
        try {
          await releaseCredits(userId, reservationId);
          setWalletMessage("Failed to finalize credit consumption. Reserved credits released.");
        } catch (releaseErr) {
          console.error("Release after consume-fail failed:", releaseErr);
          const serverMsg = consumeErr?.message || (consumeErr && String(consumeErr)) || "Consume failed";
          setWalletMessage(`Failed to consume credits and failed to release reservation. ${serverMsg}`);
        }
        throw consumeErr || new Error("Consume credits failed");
      }

      // extract tx id nicely
      const txRaw = transaction;
      let txId = null;
      if (Array.isArray(txRaw)) txId = txRaw[0]?.id || txRaw[0]?.transaction_id || null;
      else if (typeof txRaw === "object") txId = txRaw?.id || txRaw?.transaction_id || null;
      else txId = txRaw;

      const shortTx = txId?.toString?.()?.slice?.(0, 8) ?? null;
      // Keep internal logable state but do NOT surface to the user:
      setWalletMessage(shortTx ? `Credits consumed (tx ${shortTx}). Parsing complete.` : `Credits consumed. Parsing complete.`);

      // 5) Update parsed UI state (same behavior as before)
      setParsed(p);
      setBuyerName(p.buyerName || "");
      setPhone(p.phone || "");
      setItemsStr(
        p.items && p.items.length ? p.items.map((it) => `${it.qty}x ${it.name}`).join(", ") : ""
      );
      setTotal(p.total || "");
    } catch (err) {
      console.error("Parse flow error:", err);

      // If we reserved but later failed before consuming, release reservation (best-effort)
      if (reservationId && userId) {
        try {
          await releaseCredits(userId, reservationId);
          setWalletMessage("Parsing failed. Reserved credits released.");
        } catch (releaseErr) {
          console.error("Failed to release reservation after parse error:", releaseErr);
          setWalletMessage("Parsing failed and credits may be stuck. Admin check required.");
        }
      } else {
        // No reservation created
        const serverMsg = err?.response?.data?.error || err?.message || String(err);
        setWalletMessage(serverMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setParsed(null);
    setBuyerName("");
    setPhone("");
    setItemsStr("");
    setTotal("");
    setWalletMessage("");
  };

  const handleConfirm = () => {
    // If buyerName is missing, require the user to enter it (small prompt behavior)
    if (!buyerName || buyerName.trim().length < 2) {
      if (!confirm("Buyer name was not detected automatically. Do you want to proceed without a buyer name?"))
        return;
    }

    // call parent with a shape matching InvoiceForm expectations
    onParse &&
      onParse({
        buyerName: buyerName.trim(),
        phone: phone.trim(),
        items: itemsStr.trim(),
        total: total.trim(),
        paymentNumber: "", // seller will fill
        rawText: parsed ? parsed.rawText : text,
        confidence: parsed ? parsed.confidence : null,
        notes: parsed ? parsed.notes : [],
      });

    // keep the parse preview visible; parent will open the form/modal
  };

  return (
    <div className="paste-card">
      {/* NOTE: walletMessage is intentionally not shown in the UI for a cleaner UX.
          We keep the state updates for logging and debugging, but hide them from users. */}

      <textarea
        className="paste-textarea"
        placeholder="Paste the WhatsApp order message here. e.g. I want 3 pairs of trousers, 3 caps and 1 tie. Phone +254712345678"
        value={text}
        onChange={handleChange}
      />

      <div className="paste-actions">
        <button className="btn-outline" onClick={handleClear} disabled={loading}>
          Clear
        </button>
        <button className="btn-primary" onClick={doParse} disabled={loading}>
          {loading ? "Parsing..." : "Parse"}
        </button>
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
                <input
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Buyer name (enter if missing)"
                  style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #e6e9ef" }}
                />
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <label style={{ fontWeight: 700 }}>Phone:</label>{" "}
              <ConfidenceBadge score={parsed.confidence.phone} />
              <div style={{ marginTop: 6 }}>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone (normalized)"
                  style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #e6e9ef" }}
                />
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <label style={{ fontWeight: 700 }}>Items:</label>{" "}
              <ConfidenceBadge score={parsed.confidence.items} />
              <div style={{ marginTop: 6 }}>
                <input
                  value={itemsStr}
                  onChange={(e) => setItemsStr(e.target.value)}
                  placeholder="e.g. 3x T-shirt, 1x Cap"
                  style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #e6e9ef" }}
                />
                <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
                  Parsed segments: {parsed.items && parsed.items.length ? parsed.items.map((it) => `${it.qty}x ${it.name}`).join(" • ") : "—"}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <label style={{ fontWeight: 700 }}>Total:</label>{" "}
              <ConfidenceBadge score={parsed.confidence.total} />
              <div style={{ marginTop: 6 }}>
                <input
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  placeholder="e.g. KES 2,300"
                  style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #e6e9ef" }}
                />
              </div>
            </div>

            {parsed.notes && parsed.notes.length > 0 && (
              <div style={{ marginTop: 10, color: "#b45309" }}>
                <strong>Notes:</strong> {parsed.notes.join("; ")}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button className="btn-outline" onClick={() => { setParsed(null); }} disabled={loading}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleConfirm} disabled={loading}>
                Parse & Open Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
