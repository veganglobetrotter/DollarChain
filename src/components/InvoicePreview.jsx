// src/components/InvoicePreview.jsx
import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import generateInvoicePdfBlob from "../lib/pdf";
import { uploadInvoicePdf, createSignedUrl } from "../lib/storage";
import uploadInvoicePdfToServer from "../lib/uploadClient"; // NEW helper

/**
 * InvoicePreview
 * Props:
 * - invoice (object): { buyerName, phone, items, total, paymentNumber, id, pdf_path, user_id }
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
    pdf_path,
  } = invoice;

  const [savedAt, setSavedAt] = useState(null);
  const [savingCloud, setSavingCloud] = useState(false); // new
  const [cloudMsg, setCloudMsg] = useState(null);
  const invoiceId = invoiceIdProp || `INV-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleString();

  const itemRows = items
    ? (Array.isArray(items) ? items.map(it => `${it.qty}x ${it.name}`) : items.split(",").map((it) => it.trim()).filter(Boolean))
    : [];

  const handleSave = async () => {
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

  // Existing download handler: generates PDF blob and downloads locally. Also tries storage upload if pdf_path exists.
  const handleDownload = async () => {
    try {
      const session = await supabase.auth.getSession();
      const user = session.data?.session?.user;
      if (!user) {
        alert("Please sign in to download invoices.");
        return;
      }

      // If pdf_path exists, open signed url
      if (invoice.pdf_path) {
        const { url, error } = await createSignedUrl(invoice.pdf_path, 60 * 10);
        if (error || !url) throw error || new Error("signed url empty");
        window.open(url, "_blank");
        return;
      }

      // Build payload for PDF generator
      const payload = {
        buyerName: buyerName,
        phone: phone,
        items: Array.isArray(items) ? items : (items || ""),
        total: total,
        paymentNumber: paymentNumber,
        id: invoiceId,
        sellerName: "DollarChain",
      };

      // Generate pdf blob and trigger immediate download for user
      const { blob, fileName } = generateInvoicePdfBlob(payload);

      // Trigger local download
      const urlLocal = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlLocal;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(urlLocal);

      // Optional: still attempt to upload to Supabase storage (existing flow) - but ignore failures here
      try {
        // If you still want to upload via client-side (not recommended), you'd call uploadInvoicePdf here.
        // For cloud-safe server upload use the "Save to Cloud" button below which calls serverless endpoint.
      } catch (err) {
        console.warn("Non-fatal upload attempt failed (ignored):", err);
      }

      alert("Downloaded PDF to your device.");
    } catch (err) {
      console.error("Error generating or downloading PDF:", err);
      alert("Failed to generate or download PDF. See console for details.");
    }
  };

  // NEW: Save PDF to cloud via the serverless endpoint (service-role upload happens server-side)
  const handleSaveToCloud = async () => {
    setCloudMsg(null);
    setSavingCloud(true);
    try {
      const payload = {
        buyerName: buyerName,
        phone: phone,
        items: Array.isArray(items) ? items : (items || ""),
        total: total,
        paymentNumber: paymentNumber,
        id: invoiceId,
        sellerName: "DollarChain",
      };

      // generate pdf blob
      const { blob, fileName } = generateInvoicePdfBlob(payload);

      // call server endpoint to upload and attach pdf_path
      const res = await uploadInvoicePdfToServer(invoiceId, blob);
      setCloudMsg("Saved to cloud.");
      setSavedAt(new Date().toLocaleString());
      console.log("Saved to cloud result:", res);
      alert("Saved invoice PDF to your account.");
    } catch (err) {
      console.error("Save to cloud failed:", err);
      setCloudMsg("Save failed (see console).");
      alert("Failed to save to cloud. See console for details.");
    } finally {
      setSavingCloud(false);
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
          {savedAt && (
            <div style={{ marginTop: 8, color: "#0f5132", fontWeight: 600 }}>
              ✔ Saved at {savedAt}
            </div>
          )}
          {cloudMsg && <div style={{ marginTop: 6, color: savingCloud ? "#6b7280" : "#0f5132" }}>{cloudMsg}</div>}
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

          {/* NEW Save to Cloud button */}
          <button
            className="btn-primary"
            onClick={handleSaveToCloud}
            disabled={savingCloud}
            title="Save a copy of this PDF to your account (cloud)"
            style={{ background: savingCloud ? "linear-gradient(180deg,#9bd39b,#6bbf6b)" : undefined }}
          >
            {savingCloud ? "Saving…" : "Save to Cloud"}
          </button>

          <button className="btn-outline" onClick={() => onClose?.()}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
