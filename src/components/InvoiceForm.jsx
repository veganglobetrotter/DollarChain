import { useState } from "react";

function InvoiceForm({ parsedData, onBack }) {
  const [formData, setFormData] = useState({
    buyerName: parsedData.buyerName || "",
    phone: parsedData.phone || "",
    items: parsedData.items || "",
    total: parsedData.total || "",
    paymentNumber: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Invoice ready for ${formData.buyerName}! (This will later save or send it.)`);
    console.log("Final invoice data:", formData);
  };

  return (
    <div style={styles.formBox}>
      <h2 style={styles.heading}>🧾 Review & Edit Invoice</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Buyer Name</label>
        <input
          name="buyerName"
          value={formData.buyerName}
          onChange={handleChange}
          style={styles.input}
        />

        <label style={styles.label}>Phone Number</label>
        <input
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          style={styles.input}
        />

        <label style={styles.label}>Items</label>
        <textarea
          name="items"
          value={formData.items}
          onChange={handleChange}
          rows="3"
          style={styles.textarea}
        />

        <label style={styles.label}>Total Amount</label>
        <input
          name="total"
          value={formData.total}
          onChange={handleChange}
          style={styles.input}
        />

        <label style={styles.label}>Payment Number (Account/Paybill/Phone)</label>
        <input
          name="paymentNumber"
          value={formData.paymentNumber}
          onChange={handleChange}
          style={styles.input}
          placeholder="e.g. 254712345678 or 123456 (Paybill)"
        />

        <div style={styles.buttonGroup}>
          <button type="button" onClick={onBack} style={styles.backButton}>
            ⬅ Back
          </button>
          <button type="submit" style={styles.submitButton}>
            Generate Invoice
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  formBox: {
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "1.5rem",
    backgroundColor: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    marginTop: "1.5rem",
    textAlign: "left",
  },
  heading: {
    fontSize: "1.2rem",
    fontWeight: "600",
    marginBottom: "1rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: "0.3rem",
    fontWeight: "500",
  },
  input: {
    padding: "0.6rem",
    border: "1px solid #ccc",
    borderRadius: "8px",
    marginBottom: "1rem",
  },
  textarea: {
    padding: "0.6rem",
    border: "1px solid #ccc",
    borderRadius: "8px",
    marginBottom: "1rem",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "space-between",
  },
  backButton: {
    backgroundColor: "#ccc",
    color: "#000",
    padding: "0.6rem 1.2rem",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  },
  submitButton: {
    backgroundColor: "#1a8917",
    color: "white",
    padding: "0.6rem 1.2rem",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  },
};

export default InvoiceForm;
