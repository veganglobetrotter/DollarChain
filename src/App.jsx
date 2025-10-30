import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import PasteBox from "./components/PasteBox";
import InvoiceForm from "./components/InvoiceForm";

function App() {
  const [parsedData, setParsedData] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleParse = (data) => {
    setParsedData(data);
    setShowForm(true);
  };

  const handleBack = () => {
    setShowForm(false);
    setParsedData(null);
  };

  const handleBuyCredits = () => {
    alert("Buy Credits clicked — payments will be added later.");
  };

  return (
    <div className="app-root">
      <Sidebar sellerName={localStorage.getItem("sellerName") || "Seller Name"} />

      <main className="main-area">
        <Header onBuyCredits={handleBuyCredits} />

        <section className="content">
          <div className="content-inner">
            {!showForm && (
              <>
                <h1 className="content-title">Paste your Order Chat Message</h1>
                <p className="content-sub">
                  Copy and paste your WhatsApp order chat here to automatically generate
                  an invoice. You can edit details before creating the PDF.
                </p>

                <PasteBox onParse={handleParse} />
              </>
            )}

            {showForm && (
              <>
                <InvoiceForm parsedData={parsedData} onBack={handleBack} />
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
