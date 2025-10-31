// src/components/OrdersList.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { createSignedUrl } from "../lib/storage";

/**
 * OrdersList
 * Props:
 * - onView(invoice) -> called when user clicks View (will open preview in App)
 */
export default function OrdersList({ onView }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const user = (await supabase.auth.getSession()).data?.session?.user;
      if (!user) {
        setInvoices([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err) {
      console.error("Failed to load invoices:", err);
      alert("Failed to load orders. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this invoice? This action cannot be undone.")) return;
    try {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
      setInvoices((prev) => prev.filter((r) => r.id !== id));
      alert("Deleted.");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete. See console.");
    }
  };

  const handleExportCSV = (rows) => {
    // rows: array of invoice rows
    const header = ["id", "created_at", "buyer_name", "buyer_phone", "total", "payment_number", "status", "items"];
    const csv = [
      header.join(","),
      ...rows.map((r) => {
        const items = Array.isArray(r.items) ? JSON.stringify(r.items) : (r.items ? JSON.stringify(r.items) : "");
        return [
          r.id,
          r.created_at,
          csvEscape(r.buyer_name),
          csvEscape(r.buyer_phone),
          csvEscape(r.total),
          csvEscape(r.payment_number),
          csvEscape(r.status),
          csvEscape(items),
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dollarchain_invoices_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const csvEscape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };

  const handleChangeStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase.from("invoices").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      setInvoices((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    } catch (err) {
      console.error("Status update failed:", err);
      alert("Failed to update status. See console.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Your Orders</h2>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-outline" onClick={fetchInvoices} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            className="btn-primary"
            onClick={() => handleExportCSV(invoices)}
            disabled={!invoices.length}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="formBox">
        {invoices.length === 0 ? (
          <div style={{ padding: 20, color: "#6b7280" }}>
            No invoices yet. Generate one from the Paste screen.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#6b7280" }}>
                  <th style={th}>Invoice ID</th>
                  <th style={th}>Created</th>
                  <th style={th}>Buyer</th>
                  <th style={th}>Total</th>
                  <th style={th}>Status</th>
                  <th style={th}>Items</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderTop: "1px solid #eef1f3" }}>
                    <td style={td}>{inv.id}</td>
                    <td style={td}>{new Date(inv.created_at).toLocaleString()}</td>
                    <td style={td}>{inv.buyer_name}</td>
                    <td style={td}>{inv.total}</td>
                    <td style={td}>
                      <select
                        value={inv.status || "pending"}
                        onChange={(e) => handleChangeStatus(inv.id, e.target.value)}
                      >
                        <option value="pending">pending</option>
                        <option value="paid">paid</option>
                        <option value="shipped">shipped</option>
                        <option value="refunded">refunded</option>
                      </select>
                    </td>
                    <td style={td}>
                      {Array.isArray(inv.items) ? inv.items.map((it) => `${it.name || "-"} x${it.qty || 1}`).join("; ") : String(inv.items)}
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn-outline" onClick={() => onView({
                          buyerName: inv.buyer_name,
                          phone: inv.buyer_phone,
                          items: Array.isArray(inv.items) ? inv.items.map(i=> `${i.qty}x ${i.name}`).join(", ") : (inv.items || ""),
                          total: inv.total,
                          paymentNumber: inv.payment_number,
                          id: inv.id,
                        })}>
                          View
                        </button>

                        <button className="btn-outline" onClick={() => handleDelete(inv.id)}>Delete</button>

                        <button
                          className="btn-primary"
                          onClick={async () => {
                            try {
                              if (inv.pdf_path) {
                                const { url, error } = await createSignedUrl(inv.pdf_path, 60 * 10); // 10 minutes
                                if (error || !url) throw error || new Error("signed url empty");
                                window.open(url, "_blank");
                              } else {
                                alert("PDF not found for this invoice. Open the invoice via View and click Download to generate and store the PDF.");
                              }
                            } catch (err) {
                              console.error("Download error:", err);
                              alert("Failed to get invoice PDF. See console for details.");
                            }
                          }}
                        >
                          Download
                        </button>
                      </div>
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

const th = { padding: "10px 8px", fontSize: 13 };
const td = { padding: "10px 8px", verticalAlign: "top", fontSize: 13 };
