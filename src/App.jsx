// src/App.jsx
import { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import PasteBox from "./components/PasteBox";
import InvoiceForm from "./components/InvoiceForm";
import InvoicePreview from "./components/InvoicePreview";
import AuthModal from "./components/AuthModal";
import { supabase } from "./lib/supabase";

function App() {
  const [parsedData, setParsedData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    // get initial session
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data?.session?.user ?? null);
    })();

    // subscribe to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // if user just logged in and we have pending form data, continue to preview
      if (session?.user && pendingFormData) {
        setPreviewData(pendingFormData);
        setPendingFormData(null);
        setShowForm(false);
        setAuthOpen(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [pendingFormData]);

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
    // if not logged in, prompt for auth and keep the form data pending
    if (!user) {
      setPendingFormData(formData);
      setAuthOpen(true);
      return;
    }
    setPreviewData(formData);
    setShowForm(false);
  };

  const handleEditFromPreview = () => {
    setShowForm(true);
    setPreviewData(null);
  };

  const handleClosePreview = () => {
    setPreviewData(null);
    setShowForm(false);
    setParsedData(null);
  };

  const handleBuyCredits = () => {
    alert("Buy Credits clicked — payments will be added later.");
  };

  // save invoice to Supabase
  const handleSaveInvoice = async (invoice) => {
    if (!user) {
      alert("Please sign in to save invoices.");
      setAuthOpen(true);
      setPendingFormData(invoice);
      return;
    }

    try {
      // simple item parsing (same logic we used earlier)
      const parseItems = (itemsStr) => {
        if (!itemsStr) return [];
        return itemsStr
          .split(",")
          .map((it) => it.trim())
          .filter(Boolean)
          .map((row) => {
            let qty = 1;
            let name = row;
            const m1 = row.match(/^(\d+)\s*x\s*(.+)$/i);
            if (m1) {
              qty = parseInt(m1[1], 10);
              name = m1[2];
            } else {
              const m2 = row.match(/^(.+?)\s*x\s*(\d+)$/i);
              if (m2) {
                name = m2[1].trim();
                qty = parseInt(m2[2], 10);
              } else {
                qty = 1;
              }
            }
            return { name, qty };
          });
      };

      const itemsArray = parseItems(invoice.items || "");

      const payload = {
        user_id: user.id,
        buyer_name: invoice.buyerName || "",
        buyer_phone: invoice.phone || "",
        items: itemsArray,
        total: invoice.total || "",
        payment_number: invoice.paymentNumber || "",
        status: "pending",
      };

      const { data, error } = await supabase.from("invoices").insert([payload]).select().maybeSingle();
      if (error) throw error;

      alert("✅ Invoice saved to your account.");
      console.log("Saved invoice:", data);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save invoice. See console for details.");
    }
  };

  return (
    <div className="app-root">
      <Sidebar sellerName={localStorage.getItem("sellerName") || "Seller Name"} />

      <main className="main-area">
        <Header onBuyCredits={handleBuyCredits} />

        <section className="content">
          <div className="content-inner">
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

            {showForm && !previewData && (
              <InvoiceForm parsedData={parsedData} onBack={handleBack} onGenerate={handleGenerate} />
            )}

            {previewData && (
              <InvoicePreview invoice={previewData} onBackEdit={handleEditFromPreview} onClose={handleClosePreview} onSave={handleSaveInvoice} />
            )}
          </div>
        </section>
      </main>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuthSuccess={() => setAuthOpen(false)} />
    </div>
  );
}

export default App;
