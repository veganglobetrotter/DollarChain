import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import PasteBox from "./components/PasteBox";
import InvoiceForm from "./components/InvoiceForm";
import InvoicePreview from "./components/InvoicePreview";

function App() {
  const [parsedData, setParsedData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [previewData, setPreviewData] = useState(null); // holds the invoice data to preview

  const handleParse = (data) => {
    setParsedData(data);
    setShowForm(true);
    setPreviewData(null);
  };

  const handleBack = () => {
    setShowForm(false);
    setParsedData(null);
    setPreviewData(null);
  };

  // called by InvoiceForm when user clicks Generate
  const handleGenerate = (formData) => {
    console.log("DEBUG App.handleGenerate called with:", formData);
    setPreviewData(formData);
    setShowForm(false);
  };

  // when user clicks "Back to edit" inside preview
  const handleEditFromPreview = () => {
    setShowForm(true);
    // keep parsedData so form is prefilled — also set previewData to null
    setPreviewData(null);
  };

  // close preview and go back to paste screen
  const handleClosePreview = () => {
    setPreviewData(null);
    setShowForm(false);
    setParsedData(null);
  };

  const handleBuyCredits = () => {
    alert("Buy Credits clicked — payments will be added later.");
  };

  // --- New: save handler — persists invoice to localStorage under 'dollarchain_orders'
  const handleSaveInvoice = (invoice) => {
    try {
      // Helper: parse items string into array of { name, qty }
      const parseItems = (itemsStr) => {
        if (!itemsStr) return [];
        return itemsStr
          .split(",")
          .map((it) => it.trim())
          .filter(Boolean)
          .map((row) => {
            let qty = 1;
            let name = row;

            // matches "2x T-Shirt" or "2 x T-Shirt"
            const m1 = row.match(/^(\d+)\s*x\s*(.+)$/i);
            if (m1) {
              qty = parseInt(m1[1], 10);
              name = m1[2];
            } else {
              // matches "T-Shirt x2"
              const m2 = row.match(/^(.+?)\s*x\s*(\d+)$/i);
              if (m2) {
                name = m2[1].trim();
                qty = parseInt(m2[2], 10);
              } else {
                // no quantity found, keep name and qty = 1
                qty = 1;
              }
            }

            return { name, qty };
          });
      };

      const id = `inv_${Date.now()}`;
      const created_at = new Date().toISOString();
      const itemsArray = parseItems(invoice.items || "");

      const record = {
        id,
        created_at,
        buyerName: invoice.buyerName || "",
        phone: invoice.phone || "",
        items: itemsArray,
        total: invoice.total || "",
        paymentNumber: invoice.paymentNumber || "",
        status: "pending",
      };

      // load existing, prepend new record
      const raw = localStorage.getItem("dollarchain_orders");
      const existing = raw ? JSON.parse(raw) : [];
      existing.unshift(record);
      localStorage.setItem("dollarchain_orders", JSON.stringify(existing));

      alert("✅ Invoice saved locally (dollarchain_orders).");
      console.log("DollarChain: saved invoice", record);

      // (optional) keep preview open — developer can decide whether to close preview.
      // For now we keep preview visible so user can click Download PDF or Save again.
    } catch (err) {
      console.error("Error saving invoice:", err);
      alert("Error saving invoice. See console for details.");
    }
  };

  return (
    <div className="app-root">
      <Sidebar sellerName={localStorage.getItem("sellerName") || "Seller Name"} />

      <main className="main-area">
        <Header onBuyCredits={handleBuyCredits} />

        <section className="content">
          <div className="content-inner">
            {/* Paste screen */}
            {!showForm && !previewData && (
              <>
                <h1 className="content-title">Paste your Order Chat Message</h1>
                <p className="content-sub">
                  Copy and paste your WhatsApp order chat here to automatically generate
                  an invoice. You can edit details before creating the PDF.
                </p>

                <PasteBox onParse={handleParse} />
              </>
            )}

            {/* Edit form */}
            {showForm && !previewData && (
              <InvoiceForm
                parsedData={parsedData}
                onBack={handleBack}
                onGenerate={handleGenerate}
              />
            )}

            {/* Preview */}
            {previewData && (
              <InvoicePreview
                invoice={previewData}
                onBackEdit={handleEditFromPreview}
                onClose={handleClosePreview}
                onSave={handleSaveInvoice}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
