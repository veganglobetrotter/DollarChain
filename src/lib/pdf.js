// src/lib/pdf.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TEMPLATES } from "./templates";

/**
 * generateInvoicePdfBlob(invoice)
 * Returns: { blob: Blob, fileName: string }
 * Now supports optional invoice.templateId for styled layouts.
 */
export default function generateInvoicePdfBlob(invoice = {}) {
  const {
    buyerName = "Buyer",
    phone = "",
    items = "",
    total = "",
    paymentNumber = "",
    id = `INV-${Date.now().toString().slice(-6)}`,
    sellerName = "DollarChain",
    templateId = null,
  } = invoice;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- Template lookup ---
  const tpl = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  const accentColor = tpl?.style?.accentColor || "#2563eb";
  const headerBg = tpl?.style?.headerBg || "#f8fafc";
  const textColor = tpl?.style?.textColor || "#111827";

  // --- Header ---
  doc.setFillColor(headerBg);
  doc.rect(0, 0, pageWidth, 80, "F");

  doc.setFontSize(20);
  doc.setTextColor(accentColor);
  doc.setFont(undefined, "bold");
  doc.text(sellerName, 40, 50);

  doc.setFontSize(10);
  doc.setTextColor(textColor);
  doc.text(`Invoice: ${id}`, pageWidth - 200, 40);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 200, 55);

  // --- Buyer / Payment ---
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(textColor);
  doc.text("Bill To:", 40, 110);
  doc.setFont(undefined, "normal");
  doc.text(buyerName || "-", 40, 126);
  if (phone) doc.text(phone, 40, 142);

  doc.setFont(undefined, "bold");
  doc.text("Payment:", pageWidth - 220, 110);
  doc.setFont(undefined, "normal");
  doc.text(paymentNumber || "-", pageWidth - 220, 126);
  doc.text(String(total || "-"), pageWidth - 220, 142);

  // --- Items Normalization ---
  let itemRows = [];
  if (Array.isArray(items)) {
    itemRows = items.map((it) =>
      typeof it === "string"
        ? [it, "1", ""]
        : [it.name || "", String(it.qty || 1), ""]
    );
  } else if (typeof items === "string") {
    const list = items
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    itemRows = list.map((row) => {
      let qty = "1";
      let name = row;
      const m1 = row.match(/^(\d+)\s*x\s*(.+)$/i);
      if (m1) {
        qty = m1[1];
        name = m1[2];
      } else {
        const m2 = row.match(/^(.+?)\s*x\s*(\d+)$/i);
        if (m2) {
          name = m2[1];
          qty = m2[2];
        }
      }
      return [name, qty, ""];
    });
  }

  // --- Table ---
  try {
    autoTable(doc, {
      startY: 170,
      head: [["Item", "Qty", "Unit Price"]],
      body: itemRows,
      theme: tpl?.tableTheme || "striped",
      headStyles: {
        fillColor: tpl?.style?.headFillColor || [229, 231, 235],
        textColor: 20,
        fontStyle: "bold",
      },
      styles: { fontSize: 10, cellPadding: 6 },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { halign: "right", cellWidth: 60 },
        2: { halign: "right", cellWidth: 80 },
      },
    });
  } catch (err) {
    console.warn("autoTable failed — fallback to plain items", err);
    let y = 170;
    doc.setFontSize(11);
    itemRows.forEach((r) => {
      doc.text(`${r[0]} — ${r[1]}`, 40, y);
      y += 16;
    });
  }

  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 300;

  // --- Total ---
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.setTextColor(accentColor);
  doc.text("Total:", pageWidth - 200, finalY + 20);
  doc.setFont(undefined, "normal");
  doc.setTextColor(textColor);
  doc.text(String(total || "-"), pageWidth - 120, finalY + 20);

  // --- Footer ---
  doc.setFontSize(9);
  doc.setTextColor("#6b7280");
  doc.text(
    "Thank you for your purchase — Powered by DollarChain.",
    40,
    doc.internal.pageSize.getHeight() - 40
  );

  // --- Export ---
  const fileName = `${id}.pdf`;
  const blob = doc.output("blob");

  return { blob, fileName };
}
