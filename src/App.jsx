// src/App.jsx
import { useEffect, useState, useCallback } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import PasteBox from "./components/PasteBox";
import InvoiceForm from "./components/InvoiceForm";
import InvoicePreview from "./components/InvoicePreview";
import AuthModal from "./components/AuthModal";
import OrdersList from "./components/OrdersList"; // NEW
import { supabase } from "./lib/supabase";

import generateInvoicePdfBlob from "./lib/pdf";
import { uploadInvoicePdf } from "./lib/storage";
import Performance from "./components/Performance"; // <-- added import

function App() {
  const [parsedData, setParsedData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [currentView, setCurrentView] = useState("home"); // "home" or "orders" etc.

  // Mobile sidebar open state (for small screens)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data?.session?.user ?? null);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && pendingFormData) {
        setPreviewData(pendingFormData);
        setPendingFormData(null);
        setShowForm(false);
        setAuthOpen(false);
        setCurrentView("home");
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [pendingFormData]);

  // close sidebar on Escape for better UX
  useEffect(() => {
    if (!mobileSidebarOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey, { passive: true });
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileSidebarOpen]);

  const handleParse = (data) => {
    setParsedData(data);
    setShowForm(true);
    setPreviewData(null);
    setCurrentView("home");
  };

  const handleBack = () => {
    setShowForm(false);
    setParsedData(null);
    setPreviewData(null);
  };

  const handleGenerate = (formData) => {
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

  const handleSaveInvoice = async (invoice) => {
    if (!user) {
      alert("Please sign in to save invoices.");
      setAuthOpen(true);
      setPendingFormData(invoice);
      return;
    }

    try {
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
        // pdf_path initially null; we'll update after upload
      };

      // Insert invoice row
      const { data, error } = await supabase.from("invoices").insert([payload]).select().maybeSingle();
      if (error) throw error;

      const saved = data; // this has id and created_at
      const invoiceId = saved.id;

      // Generate PDF blob client-side
      const { blob, fileName } = generateInvoicePdfBlob({
        buyerName: payload.buyer_name,
        phone: payload.buyer_phone,
        items: itemsArray,
        total: payload.total,
        paymentNumber: payload.payment_number,
        id: invoiceId, // use DB id for filename
        sellerName: "DollarChain",
      });

      // Upload to Supabase Storage
      const { path, error: uploadError } = await uploadInvoicePdf(user.id, invoiceId, blob);
      if (uploadError) {
        console.error("Upload failed:", uploadError);
        alert("Invoice saved but uploading PDF to storage failed. See console.");
        return;
      }

      // Update invoice row with pdf_path
      const { error: updateErr } = await supabase
        .from("invoices")
        .update({ pdf_path: path })
        .eq("id", invoiceId);
      if (updateErr) {
        console.error("Failed to update invoice with pdf_path:", updateErr);
        alert("Invoice saved but failed to attach PDF path. See console.");
        return;
      }

      alert("✅ Invoice saved and PDF uploaded.");
      console.log("Saved invoice + pdf_path:", saved, path);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save invoice. See console for details.");
    }
  };

  // Called by OrdersList when user clicks "View"
  const handleViewFromOrders = (invoice) => {
    // invoice is already shaped for preview; show preview
    setPreviewData(invoice);
    setShowForm(false);
  };

  // Robust overlay click handler: only close when overlay itself was clicked,
  // and defensively ignore clicks that fall inside the sidebar region (in case overlay overlaps).
  const handleOverlayClick = useCallback((e) => {
    // ensure event is on the overlay element itself
    if (e.target !== e.currentTarget) return;

    // defensive: if the click coordinates are inside the sidebar rect, do not close
    const sidebarEl = document.getElementById("sidebar");
    if (sidebarEl) {
      const rect = sidebarEl.getBoundingClientRect();
      const { clientX: x, clientY: y } = e;
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        // click landed inside sidebar — ignore
        return;
      }
    }

    setMobileSidebarOpen(false);
  }, [setMobileSidebarOpen]);

  return (
    // Add conditional class so CSS can show/hide sidebar on mobile
    <div className={`app-root ${mobileSidebarOpen ? "sidebar-open" : ""}`}>
      <Sidebar
        id="sidebar"
        sellerName={localStorage.getItem("sellerName") || "Seller Name"}
        onNavigate={(view) => {
          // navigate immediately
          setCurrentView(view);

          // On mobile we want to close the sidebar, but delay slightly so the
          // button press / focus state registers on the device before the UI flips.
          // This avoids race conditions where the press is swallowed or the nav
          // visual feedback is not seen.
          if (mobileSidebarOpen) {
            setTimeout(() => setMobileSidebarOpen(false), 120);
          }
        }}
        active={currentView}
        open={mobileSidebarOpen}
        onClose={() => {
          // allow child to ask for close immediately if it wants
          if (mobileSidebarOpen) {
            // small delay to ensure the click animation completes
            setTimeout(() => setMobileSidebarOpen(false), 80);
          }
        }}
      />

      <main className="main-area">
        <Header
          onBuyCredits={handleBuyCredits}
          // header can toggle sidebar on mobile (hamburger)
          onToggleSidebar={() => setMobileSidebarOpen((s) => !s)}
        />

        <section className="content">
          <div className="content-inner">
            {/* Preview takes highest precedence */}
            {previewData && (
              <InvoicePreview
                invoice={previewData}
                onBackEdit={handleEditFromPreview}
                onClose={handleClosePreview}
                onSave={handleSaveInvoice}
              />
            )}

            {/* Performance view */}
            {!previewData && currentView === "performance" && <Performance />}

            {/* Orders view */}
            {!previewData && currentView === "orders" && (
              <OrdersList onView={handleViewFromOrders} />
            )}

            {/* Home / paste / form */}
            {!previewData && currentView === "home" && (
              <>
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

                {showForm && !previewData && (
                  <InvoiceForm parsedData={parsedData} onBack={handleBack} onGenerate={handleGenerate} />
                )}
              </>
            )}

            {/* Fallback small message for other views */}
            {!previewData && !["home", "orders", "performance"].includes(currentView) && (
              <div className="formBox">
                <h3 style={{ marginTop: 0 }}>Coming soon</h3>
                <p style={{ color: "#6b7280" }}>This section ({currentView}) is a placeholder for future features.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Mobile overlay/backdrop — clicking it closes the sidebar.
          Use a robust handler so accidental clicks that fall inside the visible
          sidebar do not close it (defensive for stacking/transform issues). */}
      {mobileSidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={handleOverlayClick}
          role="button"
          aria-label="Close navigation"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              // close overlay on keyboard activation
              setMobileSidebarOpen(false);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 9000, // reduce so sidebar can sit above it
          }}
        />
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuthSuccess={() => setAuthOpen(false)} />
    </div>
  );
}

export default App;
