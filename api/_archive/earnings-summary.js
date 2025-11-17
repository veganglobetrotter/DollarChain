// api/admin/earnings/summary.js
import { createSupabaseServerClient, requireSuperAdmin } from "../../lib/supabaseServer.js";

/**
 * GET /api/admin/earnings/summary?range=7d|30d|90d|365d
 *
 * Returns simple KPIs for the requested range:
 * { range, gross_revenue, net_revenue, sales_count, avg_order_value, source }
 *
 * Defensive: detects a candidate data table (payments/invoices/orders/transactions/credits)
 * and aggregates in JS. If nothing found, returns zeros.
 */

const CANDIDATE_TABLES = ["payments", "invoices", "orders", "transactions", "charges", "credits"];

const AMOUNT_CANDIDATES = ["amount", "total", "gross_amount", "paid_amount", "price"];
const TIME_CANDIDATES = ["paid_at", "paid_on", "created_at", "inserted_at", "updated_at", "timestamp"];
const STATUS_CANDIDATES = ["status", "state", "payment_status", "status_code", "paid"];

async function detectSource(supabase) {
  for (const table of CANDIDATE_TABLES) {
    // check table exists in public schema by querying information_schema.columns
    const { data: cols, error: colsErr } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_schema", "public")
      .eq("table_name", table);

    if (colsErr) {
      // ignore and continue
      continue;
    }
    if (!cols || cols.length === 0) continue;

    const colNames = cols.map((c) => c.column_name);

    const amount = AMOUNT_CANDIDATES.find((c) => colNames.includes(c));
    const time = TIME_CANDIDATES.find((c) => colNames.includes(c));
    const status = STATUS_CANDIDATES.find((c) => colNames.includes(c));

    if (amount && time) {
      return { table, amount_col: amount, time_col: time, status_col: status || null };
    }
  }
  return null;
}

function parseRangeParam(range) {
  if (!range) return { days: 7, label: "7d" };
  const v = String(range).toLowerCase();
  if (v.endsWith("d")) {
    const n = Number(v.slice(0, -1));
    if (Number.isFinite(n)) return { days: n, label: v };
  }
  if (v === "30" || v === "30d") return { days: 30, label: "30d" };
  if (v === "90" || v === "90d") return { days: 90, label: "90d" };
  return { days: 7, label: "7d" };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

    const auth = req.headers?.authorization;
    await requireSuperAdmin(auth, res);

    const supabase = createSupabaseServerClient();

    const { days, label } = parseRangeParam(req.query.range);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // detect source
    const source = await detectSource(supabase);
    if (!source) {
      return res.status(200).json({
        range: label,
        gross_revenue: 0,
        net_revenue: 0,
        sales_count: 0,
        avg_order_value: 0,
        source: null,
      });
    }

    const { table, amount_col, time_col, status_col } = source;

    // fetch candidate rows in range, limit to reasonable size (e.g., 10000)
    const q = supabase
      .from(table)
      .select(`${amount_col}, ${time_col}${status_col ? `, ${status_col}` : ""}`)
      .gte(time_col, since)
      .order(time_col, { ascending: true })
      .limit(10000);

    const { data: rows, error } = await q;
    if (error) {
      console.error("earnings/summary: fetch error:", error);
      return res.status(500).json({ error: error.message || error });
    }

    let gross = 0;
    let net = 0;
    let count = 0;

    (rows || []).forEach((r) => {
      const amt = Number(r?.[amount_col] ?? 0);
      if (!Number.isFinite(amt) || amt === 0) return;
      // consider 'paid' detection: if status_col exists and value implies not paid, skip
      if (status_col) {
        const st = String(r[status_col] ?? "").toLowerCase();
        // allowed paid indicators
        const paidKeywords = ["paid", "succeeded", "completed", "ok", "success"];
        const isPaid = paidKeywords.some((k) => st.includes(k)) || st === "true" || Number(st) > 0;
        if (!isPaid) return;
      }
      gross += amt;
      net += amt; // placeholder: if refunds/fees columns exist you can subtract them later
      count += 1;
    });

    const avg = count > 0 ? gross / count : 0;

    return res.status(200).json({
      range: label,
      gross_revenue: Number(gross.toFixed(2)),
      net_revenue: Number(net.toFixed(2)),
      sales_count: count,
      avg_order_value: Number(avg.toFixed(2)),
      source: { table, amount_col, time_col, status_col },
    });
  } catch (err) {
    console.error("earnings/summary handler error:", err);
    return res.status(500).json({ error: err.message || "internal_error" });
  }
}
