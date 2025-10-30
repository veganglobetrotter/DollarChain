import React from "react";

/**
 * InvoicePreview
 * Props:
 * - invoice (object): { buyerName, phone, items, total, paymentNumber }
 * - onBackEdit () => called when user wants to go back and edit
 * - onClose () => optional, goes back to paste screen
 * - onSave (invoice) => optional, will be used in Step 3 for saving
 */
export default function InvoicePreview({ invoice = {}, onBackEdit, onClose, onSave }) {
  const {
    buyerName = "",
    phone = "",
    items = "",
    total = "",
    paymentNumber = "",
  } = invoice;

  const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleString();

  // Simple items parsing: split by comma and trim
  const itemRows = items
    ? items.split(",").map((it) => it.trim()).filter(Boolean)
    : [];

  const handleSave = () => {
    if (typeof onSave === "function") {
      onSave(invoice);
    } else {
      alert("Saved (placeholder). Step 3 will implement persistent save.");
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
                // Try to parse "2x T-Shirt" style strings vs "T-Shirt x2"
                let qty = "";
                let name = row;
                let unit = "";

                // common pattern: "2x T-Shirt" or "2 x T-Shirt"
                const m1 = row.match(/^(\d+)\s*x\s*(.+)$/i);
                if (m1) {
                  qty = m1[1];
                  name = m1[2];
                } else {
                  // pattern "T-Shirt x2"
                  const m2 = row.match(/^(.+?)\s*x\s*(\d+)$/i);
                  if (m2) {
                    name = m2[1];
                    qty = m2[2];
                  } else {
                    // fallback: no qty found
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
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-outline" onClick={() => onBackEdit?.()}>
            ⬅ Back to edit
          </button>

          <button className="btn-outline" onClick={handleSave}>
            Save
          </button>

          import generateInvoicePdf from "../lib/pdf"; // add at top of file

          // ... later in the button area ...
          <button
            className="btn-primary"
            onClick={() => generateInvoicePdf({
              buyerName, phone, items, total, paymentNumber,
              id: invoice.id || `INV-${Date.now().toString().slice(-6)}`,
              sellerName: "DollarChain"
            })}
          >
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
