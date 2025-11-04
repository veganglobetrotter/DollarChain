// src/components/InvoiceList.jsx
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";

/**
 * InvoiceList (visual / functional replacement)
 * - Left column: filters + list (click row to select)
 * - Right column: detail pane (sticky on desktop)
 * - Actions: View (open preview via callback), Download (signed URL), Delete (with confirm)
 *
 * Props:
 * - onViewInvoice(invoice)  -- called when the user chooses "View"
 */
export default function InvoiceList({ onViewInvoice = () => {} }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [signedUrls, setSignedUrls] = useState({});
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      // fetch recent invoices (server rules apply)
      const { data, error } = await supabase
        .from("invoices")
        .select("id, user_id, buyer_name, buyer_phone, items, total, total_amount, payment_number, status, pdf_path, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setInvoices(data || []);
      if (!selectedId && (data || []).length) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error("fetchInvoices error:", err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derived / filtered list
  const filtered = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    return invoices.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (onlyOverdue && r.status !== "overdue") return false;
      if (!q) return true;
      return (
        String(r.buyer_name || "").toLowerCase().includes(q) ||
        String(r.buyer_phone || "").toLowerCase().includes(q) ||
        String(r.payment_number || "").toLowerCase().includes(q) ||
        String(r.id || "").toLowerCase().includes(q) ||
        String(r.total ?? r.total_amount ?? "").toLowerCase().includes(q)
      );
    });
  }, [invoices, query, statusFilter, onlyOverdue]);

  const selected = invoices.find((i) => i.id === selectedId) || filtered[0] || null;

  // create signed URL for download (caches result for brief time)
  const getSignedUrl = async (pdfPath) => {
    if (!pdfPath) return null;
    if (signedUrls[pdfPath]) return signedUrls[pdfPath];

    try {
      const parts = pdfPath.split("/");
      const maybeBucket = parts.length > 1 ? parts[0] : "invoices";
      const filePath = parts.length > 1 ? parts.slice(1).join("/") : pdfPath;

      const { data: urlData, error } = await supabase.storage.from(maybeBucket).createSignedUrl(filePath, 60);
      if (error) {
        console.warn("createSignedUrl failed:", error.message || error);
        return null;
      }
      const url = urlData?.signedUrl || urlData?.signed_url || urlData?.url || null;
      if (url) setSignedUrls((s) => ({ ...s, [pdfPath]: url }));
      return url;
    } catch (err) {
      console.error("getSignedUrl error:", err);
      return null;
    }
  };

  // Download handler (opens signed url)
  const handleDownload = async (inv) => {
    try {
      if (!inv.pdf_path) {
        alert("No PDF attached for this invoice.");
        return;
      }
      const url = await getSignedUrl(inv.pdf_path);
      if (!url) {
        alert("Unable to generate download URL. Check bucket/path or permissions.");
        return;
      }
      window.open(url, "_blank");
    } catch (err) {
      console.error("download error:", err);
      alert("Download failed. See console for details.");
    }
  };

  // Delete handler (with confirm)
  const handleDelete = async (inv) => {
    if (!confirm(`Delete invoice ${inv.id}? This action cannot be undone.`)) return;
    try {
      const { error } = await supabase.from("invoices").delete().eq("id", inv.id);
      if (error) throw error;
      // if deleted, refetch and clear selection if necessary
      await fetchInvoices();
      if (selectedId === inv.id) setSelectedId(null);
      alert("Invoice deleted.");
    } catch (err) {
      console.error("delete error:", err);
      alert("Failed to delete invoice. See console for details.");
    }
  };

  return (
    <div className="invoices-container">
      <div className="invoices-header">
        <div className="invoices-title">
          <h2>Invoices</h2>
          <div className="invoices-sub">Manage invoices, download PDFs, and reconcile payments.</div>
        </div>

        <div className="invoices-controls">
          <div className="search-box">
            <input
              placeholder="Search by name, phone, invoice or amount"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <button className="btn-ghost" onClick={() => setOnlyOverdue((s) => !s)}>{onlyOverdue ? "All" : "Only Overdue"}</button>
          <button className="btn-primary" onClick={() => alert("Create invoice (not implemented)")} title="Create invoice">Create</button>
        </div>
      </div>

      <div className="invoices-grid">
        {/* LEFT: Filters + list */}
        <div className="invoices-left">
          <div className="invoices-toolbar">
            <div className="status-chips">
              {[
                { key: "all", label: "All" },
                { key: "paid", label: "Paid" },
                { key: "pending", label: "Pending" },
                { key: "overdue", label: "Overdue" },
              ].map((f) => (
                <button
                  key={f.key}
                  className={`chip ${statusFilter === f.key ? "chip-active" : ""}`}
                  onClick={() => setStatusFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="toolbar-right">
              <div className="count">Showing <strong>{filtered.length}</strong></div>
              <button className="btn-ghost" onClick={() => fetchInvoices()}>Refresh</button>
            </div>
          </div>

          <div className="list-card">
            {loading ? (
              <div className="muted">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="muted">No invoices.</div>
            ) : (
              <div className="list-rows">
                {filtered.map((inv) => (
                  <div
                    key={inv.id}
                    className={`invoice-row ${selectedId === inv.id ? "selected" : ""}`}
                    onClick={() => setSelectedId(inv.id)}
                  >
                    <div className="row-left">
                      <div className="row-id">{inv.id}</div>
                      <div className="row-date">{(inv.created_at ? new Date(inv.created_at).toLocaleString() : "").split(",")[0]}</div>
                    </div>

                    <div className="row-mid">
                      <div className="buyer">{inv.buyer_name || "—"}</div>
                      <div className="phone">{inv.buyer_phone || inv.payment_number || "—"}</div>
                    </div>

                    <div className="row-right">
                      <div className="total">KSh {inv.total_amount ?? inv.total ?? "—"}</div>
                      <div className={`status ${inv.status || "pending"}`}>{inv.status || "pending"}</div>
                    </div>

                    <div className="row-actions">
                      <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); onViewInvoice(inv); }}>View</button>
                      <button className="btn-ghost" onClick={async (e) => { e.stopPropagation(); await handleDownload(inv); }}>Download</button>
                      <button className="btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(inv); }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Detail / sticky panel */}
        <aside className="invoices-right" aria-hidden={!selected}>
          <div className="detail-card">
            {selected ? (
              <>
                <div className="detail-header">
                  <div>
                    <div className="muted">Invoice</div>
                    <div className="detail-id">{selected.id}</div>
                  </div>

                  <div className="detail-right">
                    <div className="muted">Created</div>
                    <div>{new Date(selected.created_at).toLocaleString()}</div>
                  </div>
                </div>

                <div className="detail-items">
                  {(Array.isArray(selected.items) ? selected.items : []).map((it, idx) => (
                    <div key={idx} className="detail-item">
                      <div>{it.qty} × {it.name}</div>
                      <div>KSh {it.price ? it.qty * it.price : "-"}</div>
                    </div>
                  ))}
                </div>

                <div className="detail-total">
                  <div className="muted">Total</div>
                  <div className="detail-total-val">KSh {selected.total_amount ?? selected.total ?? "—"}</div>
                </div>

                <div className="detail-actions">
                  <button className="btn-ghost" onClick={() => onViewInvoice(selected)}>View</button>
                  <button className="btn-primary" onClick={() => handleDownload(selected)}>Download PDF</button>
                </div>
              </>
            ) : (
              <div className="muted">Select an invoice to see details here.</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
