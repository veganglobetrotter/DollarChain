// src/components/InvoicePreview.jsx
import React, { useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import generateInvoicePdfBlob from "../lib/pdf";
import { uploadInvoicePdf, createSignedUrl } from "../lib/storage";
import uploadInvoicePdfToServer from "../lib/uploadClient"; // NEW helper

import { getTemplateById } from "../lib/templates";

/**
 * InvoicePreview
 * Props:
 * - invoice (object): { buyerName, phone, items, total, paymentNumber, id, pdf_path, user_id }
 * - templateId (string|null): optional template to render
 * - onBackEdit () => called when user wants to go back and edit
 * - onClose () => optional, goes back to paste screen
 * - onSave (invoice) => optional, will be used to persist the invoice
 */
export default function InvoicePreview({ invoice = {}, templateId = null, onBackEdit, onClose, onSave }) {
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
  const [savingCloud, setSavingCloud] = useState(false);
  const [cloudMsg, setCloudMsg] = useState(null);
  const invoiceId = invoiceIdProp || `INV-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleString();

  // --- IMPORTANT: keep structured arrays as-is. If items is an array of objects, we keep objects.
  // If items is a string, split into lines (legacy).
  const itemRows = useMemo(() => {
    if (!items) return [];
    if (Array.isArray(items)) return items; // keep objects or strings
    if (typeof items === "string") {
      return items.split(",").map((it) => it.trim()).filter(Boolean);
    }
    return [];
  }, [items]);

  // Save handler unchanged
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
        await onSave(invoiceObj);
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

  // Download handler unchanged (keeps templateId in payload)
  const handleDownload = async () => {
    try {
      const session = await supabase.auth.getSession();
      const user = session.data?.session?.user;
      if (!user) {
        alert("Please sign in to download invoices.");
        return;
      }

      if (invoice.pdf_path) {
        const { url, error } = await createSignedUrl(invoice.pdf_path, 60 * 10);
        if (error || !url) throw error || new Error("signed url empty");
        window.open(url, "_blank");
        return;
      }

      const payload = {
        buyerName: buyerName,
        phone: phone,
        items: Array.isArray(items) ? items : (items || ""),
        total: total,
        paymentNumber: paymentNumber,
        id: invoiceId,
        sellerName: "DollarChain",
        templateId: templateId || null,
      };

      const { blob, fileName } = generateInvoicePdfBlob(payload);

      const urlLocal = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlLocal;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(urlLocal);

      alert("Downloaded PDF to your device.");
    } catch (err) {
      console.error("Error generating or downloading PDF:", err);
      alert("Failed to generate or download PDF. See console for details.");
    }
  };

  // Save to cloud unchanged
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
        templateId: templateId || null,
      };

      const { blob, fileName } = generateInvoicePdfBlob(payload);
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

  // Template selection
  const selectedTemplate = useMemo(() => {
    if (!templateId) return null;
    try {
      return getTemplateById(templateId);
    } catch (err) {
      return null;
    }
  }, [templateId]);

  // ----- helpers for parsing and formatting -----
  const escapeHtml = (str) => {
    if (typeof str !== "string") return str;
    return str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  };

  function parseNumber(s) {
    if (s === null || s === undefined) return NaN;
    const cleaned = String(s).replace(/[^\d.-]/g, "").replace(/,+/g, "");
    return cleaned === "" ? NaN : Number(cleaned);
  }
  function formatMoneyParts(n) {
    if (isNaN(n)) return { whole: "", cents: "00" };
    const rounded = Math.round(Math.abs(n) * 100) / 100;
    const whole = Math.floor(rounded);
    const cents = Math.round((rounded - whole) * 100).toString().padStart(2, "0");
    return { whole: whole.toLocaleString("en-GB"), cents };
  }

  // ----- build rows: accept object lines (structured) or string lines (legacy) -----
  const buildItemsRowsHtml = (rows) => {
    if (!rows || rows.length === 0) return "<tr><td colspan='2' style='color:#6b7280;padding:8px 6px'>No items</td></tr>";
    const tplId = selectedTemplate?.id || "";

    const normalized = rows.map((r) => {
      if (r && typeof r === "object") {
        // support multiple possible field names
        const qty = ("qty" in r && r.qty != null) ? r.qty : (r.quantity ?? r.count ?? "");
        const name = ("name" in r && r.name != null) ? r.name : (r.description ?? r.desc ?? "");
        const unitPrice = ("unitPrice" in r && r.unitPrice != null) ? r.unitPrice : (r.rate ?? r.price ?? r.unit ?? "");
        const amount = ("total" in r && r.total != null) ? r.total : (r.amount ?? r.ksh ?? "");
        const cents = ("cents" in r && r.cents != null) ? r.cents : "";
        return { type: "obj", qty, name, unitPrice, amount, cents };
      } else {
        // string
        const s = String(r || "").trim();
        return { type: "str", raw: s };
      }
    });

    const out = normalized.map((item) => {
      // If it's a structured object, render directly
      if (item.type === "obj") {
        const qtyRaw = item.qty ?? "";
        const qtyNum = parseNumber(qtyRaw);
        const qtyDisplay = qtyRaw === "" ? "" : (typeof qtyRaw === "number" ? `${qtyRaw}x` : (String(qtyRaw).toString().endsWith("x") ? String(qtyRaw) : `${String(qtyRaw)}x`));
        const desc = item.name ?? "";
        const unitNum = parseNumber(item.unitPrice);
        const totalNum = parseNumber(item.amount);
        const computedTotal = (isNaN(totalNum) && !isNaN(unitNum) && !isNaN(qtyNum)) ? (unitNum * qtyNum) : totalNum;
        const mp = formatMoneyParts(computedTotal);

        if (tplId === "local-1") {
          return `<tr>
            <td class="qtyCol">${escapeHtml(qtyDisplay)}</td>
            <td class="descCol">${escapeHtml(desc)}</td>
            <td class="unitCol" style="text-align:right">${isNaN(unitNum) ? escapeHtml(item.unitPrice || "") : Math.round(unitNum).toLocaleString("en-GB")}</td>
            <td class="kshCol" style="text-align:right">${mp.whole || (item.amount ? escapeHtml(String(item.amount)) : "")}</td>
            <td class="ctsCol" style="text-align:right">${mp.cents || (item.cents ? escapeHtml(String(item.cents)) : "00")}</td>
          </tr>`;
        } else if (tplId === "local-2") {
          const amountDisplay = isNaN(computedTotal) ? (item.amount ? escapeHtml(String(item.amount)) : "") : Math.round(computedTotal).toLocaleString("en-GB");
          const rateDisplay = isNaN(unitNum) ? (item.unitPrice ? escapeHtml(String(item.unitPrice)) : "") : Math.round(unitNum).toLocaleString("en-GB");
          return `<tr>
            <td>${escapeHtml(desc)}</td>
            <td class="right">${rateDisplay}</td>
            <td class="right">${escapeHtml(qtyDisplay)}</td>
            <td class="right">${amountDisplay}</td>
          </tr>`;
        } else {
          // generic fallback: two-col representation
          return `<tr style="border-top:1px solid #f1f5f9"><td style="padding:8px 6px">${escapeHtml(qtyDisplay)} ${escapeHtml(desc)}</td><td style="padding:8px 6px; text-align:right">${escapeHtml(item.amount || "")}</td></tr>`;
        }
      }

      // For strings (legacy), attempt robust parsing similar to previous approach
      const line = item.raw || "";

      // pattern "2x Item @ 1800"
      let m = line.match(/^(\d+)\s*[x×]\s*(.+?)\s*@\s*([KkEeSs\s]*[\d,\.]+)$/i);
      if (m) {
        const qty = m[1], desc = m[2].trim(), unitNum = parseNumber(m[3]);
        const totalNum = isNaN(unitNum) ? NaN : (Number(qty) * unitNum);
        if (tplId === "local-1") {
          const mp = formatMoneyParts(totalNum);
          return `<tr>
            <td class="qtyCol">${escapeHtml(qty + "x")}</td>
            <td class="descCol">${escapeHtml(desc)}</td>
            <td class="unitCol" style="text-align:right">${isNaN(unitNum) ? "" : Math.round(unitNum).toLocaleString("en-GB")}</td>
            <td class="kshCol" style="text-align:right">${mp.whole}</td>
            <td class="ctsCol" style="text-align:right">${mp.cents}</td>
          </tr>`;
        } else if (tplId === "local-2") {
          const amount = isNaN(totalNum) ? "" : Math.round(totalNum).toLocaleString("en-GB");
          return `<tr>
            <td>${escapeHtml(desc)}</td>
            <td class="right">${isNaN(unitNum) ? "" : Math.round(unitNum).toLocaleString("en-GB")}</td>
            <td class="right">${escapeHtml(qty + "x")}</td>
            <td class="right">${amount}</td>
          </tr>`;
        }
      }

      // other fallbacks: pipe/comma/leading-count patterns
      let parts = line.split(/\s*\|\s*/);
      if (parts.length >= 2) {
        const desc = parts[0].trim(), p1 = parts[1] || "", p2 = parts[2] || "", p3 = parts[3] || "";
        const p1Num = parseNumber(p1), p2Num = parseNumber(p2), p3Num = parseNumber(p3);

        if (tplId === "local-1") {
          const qty = p1, unit = !isNaN(p2Num) ? p2Num : p2;
          const total = !isNaN(p3Num) ? p3Num : (!isNaN(p2Num) && !isNaN(Number(qty)) ? p2Num * Number(qty) : NaN);
          const mp = formatMoneyParts(total);
          return `<tr>
            <td class="qtyCol">${escapeHtml(qty)}</td>
            <td class="descCol">${escapeHtml(desc)}</td>
            <td class="unitCol" style="text-align:right">${isNaN(unit) ? escapeHtml(unit) : Math.round(unit).toLocaleString("en-GB")}</td>
            <td class="kshCol" style="text-align:right">${mp.whole}</td>
            <td class="ctsCol" style="text-align:right">${mp.cents}</td>
          </tr>`;
        } else if (tplId === "local-2") {
          const rate = !isNaN(p1Num) && parts.length === 4 ? p1Num : (!isNaN(p2Num) && parts.length >= 3 ? p2Num : NaN);
          const qty = parts.length === 4 ? parts[2] : (parts[1] && isNaN(p1Num) ? parts[1] : "");
          const amount = !isNaN(p3Num) ? p3Num : (!isNaN(rate) && qty ? rate * Number(String(qty).replace(/[^\d]/g,'')) : NaN);
          return `<tr>
            <td>${escapeHtml(desc)}</td>
            <td class="right">${isNaN(rate) ? "" : Math.round(rate).toLocaleString("en-GB")}</td>
            <td class="right">${escapeHtml(qty)}</td>
            <td class="right">${isNaN(amount) ? "" : Math.round(amount).toLocaleString("en-GB")}</td>
          </tr>`;
        }
      }

      // comma-separated
      parts = line.split(/\s*,\s*/);
      if (parts.length >= 2) {
        if (tplId === "local-1") {
          const desc = parts[0].trim(), qty = parts[1].trim(), unit = parts[2] ? parts[2].trim() : "", total = parts[3] ? parseNumber(parts[3]) : NaN;
          const mp = formatMoneyParts(total);
          return `<tr>
            <td class="qtyCol">${escapeHtml(qty)}</td>
            <td class="descCol">${escapeHtml(desc)}</td>
            <td class="unitCol" style="text-align:right">${isNaN(parseNumber(unit)) ? escapeHtml(unit) : Math.round(parseNumber(unit)).toLocaleString("en-GB")}</td>
            <td class="kshCol" style="text-align:right">${mp.whole}</td>
            <td class="ctsCol" style="text-align:right">${mp.cents}</td>
          </tr>`;
        } else if (tplId === "local-2") {
          const desc = parts[0].trim(), qty = parts[1].trim(), rate = parts[2] ? parseNumber(parts[2]) : NaN, amount = parts[3] ? parseNumber(parts[3]) : ( (!isNaN(rate) && qty) ? rate * Number(String(qty).replace(/[^\d]/g,'')) : NaN );
          return `<tr>
            <td>${escapeHtml(desc)}</td>
            <td class="right">${isNaN(rate) ? "" : Math.round(rate).toLocaleString("en-GB")}</td>
            <td class="right">${escapeHtml(qty)}</td>
            <td class="right">${isNaN(amount) ? "" : Math.round(amount).toLocaleString("en-GB")}</td>
          </tr>`;
        }
      }

      // "2 Something" fallback
      const m2 = line.match(/^(\d+)\s+[x×]?\s*(.+)$/i);
      if (m2) {
        const qty = m2[1], desc = m2[2].trim();
        if (tplId === "local-1") {
          return `<tr>
            <td class="qtyCol">${escapeHtml(qty + "x")}</td>
            <td class="descCol">${escapeHtml(desc)}</td>
            <td class="unitCol" style="text-align:right"></td>
            <td class="kshCol" style="text-align:right"></td>
            <td class="ctsCol" style="text-align:right">00</td>
          </tr>`;
        } else if (tplId === "local-2") {
          return `<tr>
            <td>${escapeHtml(desc)}</td>
            <td class="right"></td>
            <td class="right">${escapeHtml(qty + "x")}</td>
            <td class="right"></td>
          </tr>`;
        }
      }

      // final fallback
      if (tplId === "local-1") {
        return `<tr>
          <td class="qtyCol"></td>
          <td class="descCol">${escapeHtml(line)}</td>
          <td class="unitCol" style="text-align:right"></td>
          <td class="kshCol" style="text-align:right"></td>
          <td class="ctsCol" style="text-align:right">00</td>
        </tr>`;
      } else if (tplId === "local-2") {
        return `<tr><td>${escapeHtml(line)}</td><td class="right"></td><td class="right"></td><td class="right"></td></tr>`;
      } else {
        const idx = line.indexOf(" ");
        const first = idx === -1 ? line : line.slice(0, idx);
        const rest = idx === -1 ? "" : line.slice(idx + 1);
        return `<tr style="border-top:1px solid #f1f5f9"><td style="padding:8px 6px">${escapeHtml(first)}</td><td style="padding:8px 6px; text-align:right">${escapeHtml(rest)}</td></tr>`;
      }
    });

    return out.join("");
  };

  const buildTemplateHtml = () => {
    if (!selectedTemplate) return null;
    let html = selectedTemplate.html || "";

    // remove simple handlebars-style conditional blocks for qrDataUrl when we don't provide qrDataUrl
    html = html.replace(/\{\{#if qrDataUrl\}\}[\s\S]*?\{\{\/if\}\}/g, "");

    const replacements = {
      sellerName: escapeHtml(localStorage.getItem("sellerName") || "Seller Name"),
      sellerLogoUrl: escapeHtml(localStorage.getItem("sellerLogoUrl") || "/favicon.ico"),
      sellerPhone: escapeHtml(localStorage.getItem("sellerPhone") || ""),
      sellerEmail: escapeHtml(localStorage.getItem("sellerEmail") || ""),
      sellerAddress: escapeHtml(localStorage.getItem("sellerAddress") || ""),
      sellerTagline: escapeHtml(localStorage.getItem("sellerTagline") || ""),
      invoiceNumber: escapeHtml(invoiceId),
      date: escapeHtml(dateStr),
      dueDate: escapeHtml(dateStr),
      buyerName: escapeHtml(buyerName || "Buyer"),
      buyerPhone: escapeHtml(phone || ""),
      subtotal: escapeHtml(total || ""),
      total: escapeHtml(total || ""),
      paymentNumber: escapeHtml(paymentNumber || ""),
      paymentLabel: escapeHtml("M-Pesa"),
      notesLine: escapeHtml((invoice && invoice.notes && invoice.notes.join(", ")) || "Thank you"),
      vatPercent: "0",
      vatAmount: "0",
      payLink: "#",
      qrDataUrl: "",
    };

    // Generate items rows HTML based on structured rows or strings
    const itemsRowsHtml = buildItemsRowsHtml(itemRows);
    html = html.replace(/{{\s*itemsRows\s*}}/g, itemsRowsHtml);

    Object.keys(replacements).forEach((k) => {
      const re = new RegExp(`{{\\s*${k}\\s*}}`, "g");
      html = html.replace(re, replacements[k]);
    });

    html = html.replace(/\{\{[^}]+\}\}/g, "");

    return html;
  };

  const renderedTemplateHtml = useMemo(() => buildTemplateHtml(), [selectedTemplate, buyerName, phone, items, total, paymentNumber, invoiceId, dateStr]);

  // Render
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

      {renderedTemplateHtml ? (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: "#374151", fontWeight: 700, marginBottom: 8 }}>Template preview</div>
          <div style={{ border: "1px solid #eef1f3", borderRadius: 10, overflow: "hidden" }}>
            <iframe
              title="invoice-template-preview"
              srcDoc={renderedTemplateHtml}
              style={{ width: "100%", minHeight: 420, border: 0 }}
              // restore safer sandbox: no allow-scripts
              sandbox="allow-same-origin allow-popups allow-forms"
            />
          </div>
        </div>
      ) : (
        <>
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

                    if (row && typeof row === "object") {
                      qty = row.qty ?? row.quantity ?? row.count ?? "1";
                      name = row.name ?? row.description ?? row.desc ?? "";
                      unit = row.unitPrice ?? row.rate ?? row.price ?? "";
                    } else {
                      const m1 = String(row).match(/^(\d+)\s*x\s*(.+)$/i);
                      if (m1) {
                        qty = m1[1];
                        name = m1[2];
                      } else {
                        const m2 = String(row).match(/^(.+?)\s*x\s*(\d+)$/i);
                        if (m2) {
                          name = m2[1];
                          qty = m2[2];
                        } else {
                          qty = "1";
                          name = String(row);
                        }
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
        </>
      )}

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
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              try {
                onBackEdit?.();
              } catch (err) {
                console.warn("onBackEdit threw:", err);
              }
            }}
            aria-label="Back to edit"
            style={{ minWidth: 120 }}
          >
            ⬅ Back to edit
          </button>

          <button type="button" className="btn-primary" onClick={handleDownload} aria-label="Download PDF">
            Download PDF
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={handleSaveToCloud}
            disabled={savingCloud}
            aria-busy={savingCloud ? "true" : "false"}
            title="Save a copy of this PDF to your account (cloud)"
            style={savingCloud ? { opacity: 0.85 } : undefined}
          >
            {savingCloud ? "Saving…" : "Save to Cloud"}
          </button>

          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              try {
                onClose?.();
              } catch (err) {
                console.warn("onClose threw:", err);
              }
            }}
            aria-label="Close preview"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
