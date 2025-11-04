// src/components/InvoiceList.jsx
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";

/**
 * InvoiceList
 * - Fetches invoices from public.invoices (subject to your RLS)
 * - Shows simple list + client-side filter by status / buyer name
 * - Shows "Download PDF" button when pdf_path exists (creates a signed URL)
 *
 * Note: If your Supabase project enforces RLS, run this as an authenticated user
 * or use a server-side endpoint with the service_role key for admin-only listing.
 */
export default function InvoiceList({ onViewInvoice = () => {} }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [signedUrls, setSignedUrls] = useState({});

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

  // memoized filtered list
  const filtered = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    return invoices.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(r.buyer_name || "").toLowerCase().includes(q) ||
        String(r.buyer_phone || "").toLowerCase().includes(q) ||
        String(r.payment_number || "").toLowerCase().includes(q)
      );
    });
  }, [invoices, statusFilter, query]);

  // create signed URL for a single pdf_path when user clicks download
  const getSignedUrl = async (pdfPath) => {
    if (!pdfPath) return null;
    if (signedUrls[pdfPath]) return signedUrls[pdfPath];
    try {
      // assumes pdf_path is "bucket/path/to/file.pdf" or only "path"
      // adjust bucket name if you store in a specific bucket; here we try to split bucket/path
      const parts = pdfPath.split("/");
      const maybeBucket = parts.length > 1 ? parts[0] : "invoices";
      const filePath = parts.length > 1 ? parts.slice(1).join("/") : pdfPath;

      // IMPORTANT: public buckets can simply use from(bucket).getPublicUrl
      // Here we attempt to create a temporary signed URL (60s). If your RLS/storage rules disallow it
      // this call may fail; handle as best-effort.
      const { data: urlData, error } = await supabase.storage
        .from(maybeBucket)
        .createSignedUrl(filePath, 60); // 60 seconds signed url

      if (error) {
        // fallback: maybe pdfPath is already a public path or full URL
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

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>Invoices</h2>
          <div style={{ color: "#6b7280", fontSize: 13 }}>Recent invoices — shows up to 200 rows</div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <input
            placeholder="Search buyer / phone / payment #"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #e6e9ee" }}
          />
          <button className="btn-outline" onClick={() => fetchInvoices()}>Refresh</button>
        </div>
      </div>

      <div style={{ borderRadius: 10, padding: 12, background: "transparent" }}>
        {loading ? (
          <div style={{ color: "#6b7280" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: "#6b7280" }}>No invoices.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ textAlign: "left", color: "#6b7280", fontSize: 13 }}>
                <tr>
                  <th style={{ padding: "8px 10px" }}>Created</th>
                  <th style={{ padding: "8px 10px" }}>Buyer</th>
                  <th style={{ padding: "8px 10px" }}>Phone</th>
                  <th style={{ padding: "8px 10px" }}>Total</th>
                  <th style={{ padding: "8px 10px" }}>Status</th>
                  <th style={{ padding: "8px 10px" }}>PDF</th>
                  <th style={{ padding: "8px 10px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                    <td style={{ padding: "10px" }}>{new Date(inv.created_at).toLocaleString()}</td>
                    <td style={{ padding: "10px" }}>{inv.buyer_name || "—"}</td>
                    <td style={{ padding: "10px" }}>{inv.buyer_phone || "—"}</td>
                    <td style={{ padding: "10px" }}>{inv.total_amount ?? inv.total ?? "—"}</td>
                    <td style={{ padding: "10px" }}>{inv.status}</td>
                    <td style={{ padding: "10px" }}>
                      {inv.pdf_path ? (
                        <button
                          className="btn-outline"
                          onClick={async () => {
                            const url = await getSignedUrl(inv.pdf_path);
                            if (url) window.open(url, "_blank");
                            else alert("Unable to generate download URL. Check storage bucket name and file path.");
                          }}
                        >
                          Download
                        </button>
                      ) : (
                        <span style={{ color: "#9aa3ab" }}>No PDF</span>
                      )}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <button
                        className="btn-outline"
                        onClick={() => onViewInvoice(inv)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
