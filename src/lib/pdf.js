// src/lib/pdf.js
import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * generateInvoicePdf(invoice, options)
 * invoice: {
 *   buyerName, phone, items (string or array), total, paymentNumber, // plus optional sellerName
 *   id (optional)
 * }
 * Returns: Blob (and triggers download by default)
 */
export default function generateInvoicePdf(invoice = {}, opts = {}) {
  const {
    buyerName = "Buyer",
    phone = "",
    items = "",
    total = "",
    paymentNumber = "",
    id = `INV-${Date.now().toString().slice(-6)}`,
    sellerName = "DollarChain",
  } = invoice;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(sellerName, 40, 60);
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(`Invoice: ${id}`, pageWidth - 200, 60);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 200, 76);

  // Buyer & payment block
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("Bill To:", 40, 110);
  doc.setFont(undefined, "normal");
  doc.text(buyerName || "-", 40, 126);
  if (phone) doc.text(phone, 40, 142);

  doc.setFont(undefined, "bold");
  doc.text("Payment:", pageWidth - 220, 110);
  doc.setFont(undefined, "normal");
  doc.text(paymentNumber || "-", pageWidth - 220, 126);
  doc.text(String(total || "-"), pageWidth - 220, 142);

  // Items: normalize items to array of rows
  let itemRows = [];
  if (Array.isArray(items)) {
    itemRows = items.map((it) => {
      if (typeof it === "string") return [it, "1", ""];
      return [it.name || "", String(it.qty || 1), ""];
    });
  } else if (typeof items === "string") {
    const list = items
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    itemRows = list.map((row) => {
      // try to parse qty
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

  // Table
  doc.autoTable({
    startY: 170,
    head: [["Item", "Qty", "Unit Price"]],
    body: itemRows,
    theme: "striped",
    headStyles: { fillColor: [237, 242, 247], textColor: 20, fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 6 },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right", cellWidth: 60 },
      2: { halign: "right", cellWidth: 80 },
    },
  });

  // Totals area (place near bottom)
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 300;
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("Total:", pageWidth - 200, finalY + 20);
  doc.setFont(undefined, "normal");
  doc.text(String(total || "-"), pageWidth - 120, finalY + 20);

  // Footer - small
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    "Thank you for your purchase — DollarChain. This invoice is auto-generated.",
    40,
    doc.internal.pageSize.getHeight() - 40
  );

  // Save PDF
  const fileName = `${id}.pdf`;
  doc.save(fileName);

  // Return the doc in case caller wants the raw object
  return doc;
}
