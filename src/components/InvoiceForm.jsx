import { useState, useEffect } from "react";

/**
 * InvoiceForm
 * Props:
 * - parsedData: object from parser (buyerName, phone, items, total)
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

  // initialize from parsedData when component mounts / parsedData changes
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

  const handleSubmit = (e) => {
    e && e.preventDefault();
    // If parent provided a handler (used in Step 2), call it. Otherwise fallback to alert.
    if (typeof onGenerate === "function") {
      onGenerate(formData);
    } else {
      alert(`Invoice ready for ${formData.buyerName}!\n\n(We will show a preview next step.)`);
      console.log("Final invoice data:", formData);
    }
  };

  return (
    <div className="formBox fade-in" role="region" aria-labelledby="invoice-heading">
      <h2 id="invoice-heading" style={{ marginTop: 0, marginBottom: 12 }}>
        🧾 Review & Edit Invoice
      </h2>

      <form onSubmit={handleSubmit}>
        <label style={labelStyle} htmlFor="buyerName">
          Buyer Name
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

        <label style={labelStyle} htmlFor="phone">
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          style={inputStyle}
          placeholder="+254712345678"
        />

        <label style={labelStyle} htmlFor="items">
          Items (comma separated)
        </label>
        <textarea
          id="items"
          name="items"
          value={formData.items}
          onChange={handleChange}
          rows="3"
          style={textareaStyle}
          placeholder="e.g. 2x T-Shirt, 1x Cap"
        />

        <label style={labelStyle} htmlFor="total">
          Total Amount
        </label>
        <input
          id="total"
          name="total"
          value={formData.total}
          onChange={handleChange}
          style={inputStyle}
          placeholder="KES 2,300"
        />

        <label style={labelStyle} htmlFor="paymentNumber">
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

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
          <button type="button" className="btn-outline" onClick={onBack} aria-label="Back to paste">
            ⬅ Back
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn-outline" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(formData)); alert("Form copied to clipboard for easy testing."); }}>
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

/* Inline styles kept minimal — primary visual styling is in App.css (.formBox, .btn-primary, etc.) */
const labelStyle = { display: "block", marginBottom: 6, fontWeight: 600, color: "#114028" };
const inputStyle = {
  width: "100%",
  padding: "0.7rem",
  borderRadius: 10,
  border: "1px solid #e6e9ef",
  marginBottom: 12,
  fontSize: 15,
};

const textareaStyle = {
  width: "100%",
  padding: "0.7rem",
  borderRadius: 10,
  border: "1px solid #e6e9ef",
  marginBottom: 12,
  fontSize: 15,
  resize: "vertical",
};
