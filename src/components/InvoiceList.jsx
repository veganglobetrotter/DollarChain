// src/components/InvoiceList.jsx
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";

/**
 * InvoiceList (patched)
 *
 * - Emits markup that matches the invoices CSS in src/index.css
 * - Keeps the original fetch / filter / signed-url behavior
 * - Adds View / Download / Delete buttons wired to expected handlers
 *
 * Props:
 * - onViewInvoice(inv)  => called when user clicks View (or row)
 */
export default function InvoiceList({ onViewInvoice = () => {} }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [signedUrls, setSignedUrls] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, user_id, buyer_name, buyer_phone, items, total, total_amount, payment_number, status, pdf_path, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setInvoices(data || []);
      if (data && data.length && !selectedId) {
        setSelectedId((prev) => prev || (data[0] && data[0].id));
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

  const filtered = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    return (invoices || []).filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(r.buyer_name || "").toLowerCase().includes(q) ||
        String(r.buyer_phone || "").toLowerCase().includes(q) ||
        String(r.payment_number || "").toLowerCase().includes(q) ||
        String(r.id || "").toLowerCase().includes(q)
      );
    });
  }, [invoices, statusFilter, query]);

  // create signed URL for a single pdf_path when user clicks download
  const getSignedUrl = async (pdfPath) => {
    if (!pdfPath) return null;
    if (signedUrls[pdfPath]) return signedUrls[pdfPath];
    try {
      const parts = pdfPath.split("/");
      const maybeBucket = parts.length > 1 ? parts[0] : "invoices";
      const filePath = parts.length > 1 ? parts.slice(1).join("/") : pdfPath;

      const { data: urlData, error } = await supabase.storage
        .from(maybeBucket)
        .createSignedUrl(filePath, 60);

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

  const handleDownloadClick = async (e, inv) => {
    e.stopPropagation();
    if (!inv?.pdf_path) {
      alert("No PDF available for this invoice.");
      return;
    }
    try {
      const url = await getSignedUrl(inv.pdf_path);
      if (url) window.open(url, "_blank");
      else alert("Unable to generate download URL. Check storage bucket and path.");
    } catch (err) {
      console.error("download click error:", err);
      alert("Failed to download. See console for details.");
    }
  };

  const handleViewClick = (e, inv) => {
    e.stopPropagation();
    onViewInvoice(inv);
    setSelectedId(inv.id);
  };

  const handleDeleteClick = async (e, inv) => {
    e.stopPropagation();
    if (!confirm("Delete this invoice? This action cannot be undone.")) return;
    try {
      const { error } = await supabase.from("invoices").delete().eq("id", inv.id);
      if (error) throw error;
      await fetchInvoices();
      // if deleted invoice was selected, clear selection
      setSelectedId((s) => (s === inv.id ? null : s));
      alert("Deleted.");
    } catch (err) {
      console.error("Failed to delete invoice:", err);
      alert("Failed to delete invoice. See console for details.");
    }
  };

  // selected invoice detail (for right column)
  const selectedInvoice = (invoices || []).find((i) => i.id === selectedId) || null;

  return (
    <div className="invoices-container">
      <div className="invoices-header">
        <div>
          <h2 style={{ margin: 0 }}>Invoices</h2>
          <div className="invoices-sub">Recent invoices — shows up to 200 rows</div>
        </div>

        <div className="invoices-controls">
          <div className="search-box" role="search" aria-label="Search invoices">
            <input
              placeholder="Search buyer / phone / invoice or amount"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="btn-ghost"
            style={{ padding: "6px 8px", height: "38px" }}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button className="btn-outline" onClick={() => fetchInvoices()}>
            Refresh
          </button>
        </div>
      </div>

      <div className="invoices-grid">
        {/* Left: list */}
        <div className="invoices-left">
          <div className="list-card">
            {loading ? (
              <div style={{ padding: 16, color: "var(--muted)" }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 16, color: "var(--muted)" }}>No invoices.</div>
            ) : (
              <div className="list-rows">
                {filtered.map((inv) => (
                  <div
                    key={inv.id}
                    className={`invoice-row ${selectedId === inv.id ? "selected" : ""}`}
                    onClick={() => setSelectedId(inv.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setSelectedId(inv.id);
                        onViewInvoice(inv);
                      }
                    }}
                  >
                    <div className="row-left">
                      <div className="row-id" style={{ wordBreak: "break-word" }}>{inv.id}</div>
                      <div className="row-date">{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "—"}</div>
                    </div>

                    <div className="row-mid">
                      <div className="buyer">{inv.buyer_name || "—"}</div>
                      <div className="phone">{inv.buyer_phone || "—"}</div>
                    </div>

                    <div className="row-right">
                      <div className="total">{inv.total_amount ?? inv.total ?? "—"}</div>
                      <div className={`status ${inv.status}`}>{inv.status || "—"}</div>
                    </div>

                    <div className="row-actions">
                      {inv.pdf_path ? (
                        <button
                          className="btn-ghost"
                          onClick={(e) => handleDownloadClick(e, inv)}
                          title="Download PDF"
                        >
                          Download
                        </button>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: 13 }}>No PDF</span>
                      )}

                      <button className="btn-outline" onClick={(e) => handleViewClick(e, inv)} title="View invoice">
                        View
                      </button>

                      <button className="btn-danger" onClick={(e) => handleDeleteClick(e, inv)} title="Delete invoice">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        <aside className="invoices-right">
          <div className="detail-card">
            {selectedInvoice ? (
              <>
                <div className="detail-header">
                  <div>
                    <div className="text-muted" style={{ fontSize: 13 }}>Invoice</div>
                    <div className="detail-id">{selectedInvoice.id}</div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div className="text-muted" style={{ fontSize: 13 }}>Created</div>
                    <div style={{ fontWeight: 600 }}>
                      {selectedInvoice.created_at ? new Date(selectedInvoice.created_at).toLocaleString() : "—"}
                    </div>
                  </div>
                </div>

                <div className="detail-items">
                  {Array.isArray(selectedInvoice.items) && selectedInvoice.items.length ? (
                    selectedInvoice.items.map((it, idx) => (
                      <div key={idx} className="detail-item">
                        <div>{it.qty} × {it.name}</div>
                        <div>{/* price not stored in items rows by default */}KSh -</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted">No item details</div>
                  )}
                </div>

                <div className="detail-total">
                  <div className="text-muted">Total</div>
                  <div className="detail-total-val">KSh {selectedInvoice.total_amount ?? selectedInvoice.total ?? "-"}</div>
                </div>

                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button
                    className="btn-outline"
                    onClick={() => onViewInvoice(selectedInvoice)}
                  >
                    View
                  </button>

                  {selectedInvoice.pdf_path ? (
                    <button
                      className="btn-primary"
                      onClick={async () => {
                        const u = await getSignedUrl(selectedInvoice.pdf_path);
                        if (u) window.open(u, "_blank");
                        else alert("Unable to get download URL.");
                      }}
                    >
                      Download PDF
                    </button>
                  ) : (
                    <button className="btn-primary" onClick={() => alert("No PDF attached")}>Download PDF</button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-muted">Select an invoice to see details here.</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
