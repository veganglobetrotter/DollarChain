import React, { useState } from "react";
import generateInvoicePdf from "../lib/pdf"; // ensure this file exists at src/lib/pdf.js

/**
 * InvoicePreview
 * Props:
 * - invoice (object): { buyerName, phone, items, total, paymentNumber }
 * - onBackEdit () => called when user wants to go back and edit
 * - onClose () => optional, goes back to paste screen
 * - onSave (invoice) => optional, will be used to persist the invoice
 */
export default function InvoicePreview({ invoice = {}, onBackEdit, onClose, onSave }) {
  const {
    buyerName = "",
    phone = "",
    items = "",
    total = "",
    paymentNumber = "",
    id: invoiceIdProp,
  } = invoice;

  const [savedAt, setSavedAt] = useState(null);
  const invoiceId = invoiceIdProp || `INV-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleString();

  // Simple items parsing: split by comma and trim
  const itemRows = items
    ? items.split(",").map((it) => it.trim()).filter(Boolean)
    : [];

  const handleSave = () => {
    try {
      const invoiceObj = {
        buyerName,
        phone,
        items,
        total,
        paymentNumber,
        savedPreviewAt: new Date().toISOString(),
      };

      if (typeof onSave === "function") {
        onSave(invoiceObj);
        setSavedAt(new Date().toLocaleString());
        console.log("InvoicePreview: onSave called with", invoiceObj);
      } else {
        console.warn("InvoicePreview: onSave not provided — no server save performed.");
        setSavedAt(new Date().toLocaleString());
      }
    } catch (err) {
      console.error("InvoicePreview.save error:", err);
      alert("Error saving invoice — see console for details.");
    }
  };

  const handleDownload = () => {
    try {
      if (typeof generateInvoicePdf !== "function") {
        console.error("generateInvoicePdf is not available. Did you create src/lib/pdf.js?");
        alert("PDF generator not available. See console for details.");
        return;
      }

      // build a clean payload for the PDF generator
      const payload = {
        buyerName,
        phone,
        items,
        total,
        paymentNumber,
        id: invoiceId,
        sellerName: "DollarChain",
      };

      generateInvoicePdf(payload);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF — see console for details.");
    }
  };

  return (
    <div className="formBox fade-in" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#07131a" }}>DollarChain</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>Invoice preview</div>
        </div>

        <div style={{ textAlign: "right", color: "#374151" }}>
          <div style={{ fontSize: 13 }}>{invoiceId}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{dateStr}</div>
        </div>
      </div>

      <hr style={{ margin: "12px 0", borderColor: "#eef1f3" }} />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ minWidth: 220 }}>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>BILL TO</div>
          <div style={{ fontWeight: 700, color: "#07131a" }}>{buyerName || "—"}</div>
          <div style={{ color: "#374151", marginTop: 6 }}>{phone || "—"}</div>
        </div>

        <div style={{ minWidth: 220 }}>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>PAYMENT</div>
          <div style={{ fontWeight: 700, color: "#07131a" }}>{paymentNumber || "No number provided"}</div>
          <div style={{ color: "#6b7280", marginTop: 6, fontSize: 13 }}>{total || "—"}</div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#6b7280" }}>
              <th style={{ padding: "8px 6px" }}>Item</th>
              <th style={{ padding: "8px 6px", width: 120 }}>Qty</th>
              <th style={{ padding: "8px 6px", width: 140 }}>Unit</th>
            </tr>
          </thead>
          <tbody>
            {itemRows.length ? (
              itemRows.map((row, idx) => {
                let qty = "";
                let name = row;
                let unit = "";

                const m1 = row.match(/^(\d+)\s*x\s*(.+)$/i);
                if (m1) {
                  qty = m1[1];
                  name = m1[2];
                } else {
                  const m2 = row.match(/^(.+?)\s*x\s*(\d+)$/i);
                  if (m2) {
                    name = m2[1];
                    qty = m2[2];
                  } else {
                    qty = "1";
                  }
                }

                return (
                  <tr key={idx} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 6px" }}>{name}</td>
                    <td style={{ padding: "10px 6px" }}>{qty}</td>
                    <td style={{ padding: "10px 6px" }}>{unit}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td style={{ padding: "10px 6px", color: "#6b7280" }} colSpan={3}>
                  No items detected
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, alignItems: "center", gap: 12 }}>
        <div style={{ color: "#6b7280", fontSize: 13 }}>
          <div>Notes</div>
          <div style={{ marginTop: 6, maxWidth: 420 }}>This is a preview. You can edit details before generating the final PDF.</div>
          {savedAt && (
            <div style={{ marginTop: 8, color: "#0f5132", fontWeight: 600 }}>
              ✔ Saved at {savedAt}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-outline" onClick={() => onBackEdit?.()}>
            ⬅ Back to edit
          </button>

          <button className="btn-outline" onClick={handleSave}>
            Save
          </button>

          <button className="btn-primary" onClick={handleDownload}>
            Download PDF
          </button>

          <button className="btn-outline" onClick={() => onClose?.()}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
