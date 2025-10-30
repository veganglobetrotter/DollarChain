import { useState, useEffect } from "react";

/**
 * InvoiceForm
 * Props:
 * - parsedData: object from parser (buyerName, phone, items, total, _confidence)
 * - onBack: function to go back to the paste screen
 * - onGenerate: optional function(formData) to handle generating/previewing the invoice
 */
export default function InvoiceForm({ parsedData = {}, onBack, onGenerate }) {
  const [formData, setFormData] = useState({
    buyerName: "",
    phone: "",
    items: "",
    total: "",
    paymentNumber: "",
  });

  useEffect(() => {
    setFormData({
      buyerName: parsedData.buyerName || "",
      phone: parsedData.phone || "",
      items: parsedData.items || "",
      total: parsedData.total || "",
      paymentNumber: parsedData.paymentNumber || "",
    });
  }, [parsedData]);

  const conf = parsedData._confidence || {};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e && e.preventDefault();
    if (typeof onGenerate === "function") {
      onGenerate(formData);
    } else {
      alert(`Invoice ready for ${formData.buyerName}!\n\n(We will show a preview next step.)`);
      console.log("Final invoice data:", formData);
    }
  };

  const badgeStyle = (level) => {
    if (!level) return { display: "inline-block", marginLeft: 8, fontSize: 12, color: "#6b7280" };
    if (level === "high") return { marginLeft: 8, padding: "2px 8px", borderRadius: 999, background: "#e6f8ea", color: "#0f5132", fontSize: 12 };
    if (level === "medium") return { marginLeft: 8, padding: "2px 8px", borderRadius: 999, background: "#fff7e6", color: "#664d03", fontSize: 12 };
    return { marginLeft: 8, padding: "2px 8px", borderRadius: 999, background: "#fff1f2", color: "#6b1220", fontSize: 12 };
  };

  return (
    <div className="formBox fade-in" role="region" aria-labelledby="invoice-heading">
      <h2 id="invoice-heading" style={{ marginTop: 0, marginBottom: 12 }}>
        🧾 Review & Edit Invoice
      </h2>

