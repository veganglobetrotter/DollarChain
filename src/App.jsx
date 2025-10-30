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

  // placeholder save handler (Step 3 will persist to localStorage)
  const handleSaveInvoice = (invoice) => {
    alert("Saved (placeholder). Step 3 will implement persistent save.");
    console.log("Invoice to save:", invoice);
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
