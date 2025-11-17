// api/admin/earnings.js
import { createSupabaseServerClient, requireSuperAdmin } from "../../lib/supabaseServer.js";

/**
 * Consolidated earnings endpoint.
 * Query params:
 *  - action: "summary" (default) | "timeseries" | "transactions"
 *  - range: "7d"|"30d"|...
 *  - bucket: "daily"|"hourly" (for timeseries)
 *  - page, limit, from, to, status (for transactions)
 *
 * Defensive: detects source table (payments/invoices/orders/transactions/credits)
 * and returns zeros/empty arrays if none found.
 */

const CANDIDATE_TABLES = ["payments", "invoices", "orders", "transactions", "charges", "credits"];
const AMOUNT_CANDIDATES = ["amount", "total", "gross_amount", "paid_amount", "price"];
const TIME_CANDIDATES = ["paid_at", "paid_on", "created_at", "inserted_at", "updated_at", "timestamp"];
const STATUS_CANDIDATES = ["status", "state", "payment_status", "status_code", "paid"];

async function getTableColumns(supabase, table) {
  const { data: cols } = await supabase
    .from("information_schema.columns")
    .select("column_name")
    .eq("table_schema", "public")
    .eq("table_name", table);
  return (cols || []).map((c) => c.column_name);
}

async function detectSource(supabase) {
  for (const table of CANDIDATE_TABLES) {
    const colNames = await getTableColumns(supabase, table).catch(() => []);
    if (!colNames || colNames.length === 0) continue;
    const amount = AMOUNT_CANDIDATES.find((c) => colNames.includes(c));
    const time = TIME_CANDIDATES.find((c) => colNames.includes(c));
    const status = STATUS_CANDIDATES.find((c) => colNames.includes(c));
    if (amount && time) return { table, amount_col: amount, time_col: time, status_col: status || null, columns: colNames };
  }
  return null;
}

function parseRangeParam(range, defaultDays = 30) {
  if (!range) return { days: defaultDays, label: `${defaultDays}d` };
  const v = String(range).toLowerCase();
  if (v.endsWith("d")) {
    const n = Number(v.slice(0, -1));
    if (Number.isFinite(n)) return { days: n, label: v };
  }
  if (v === "30" || v === "30d") return { days: 30, label: "30d" };
  if (v === "7" || v === "7d") return { days: 7, label: "7d" };
  if (v === "90" || v === "90d") return { days: 90, label: "90d" };
  return { days: defaultDays, label: `${defaultDays}d` };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

    const auth = req.headers?.authorization;
    await requireSuperAdmin(auth, res);

    const supabase = createSupabaseServerClient();

    const action = (req.query.action || "summary").toLowerCase();

    if (action === "summary") {
      const { days, label } = parseRangeParam(req.query.range, 30);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

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
      const { data: rows, error } = await supabase
        .from(table)
        .select(`${amount_col}, ${time_col}${status_col ? `, ${status_col}` : ""}`)
        .gte(time_col, since)
        .order(time_col, { ascending: true })
        .limit(10000);

      if (error) {
        console.error("earnings summary fetch error:", error);
        return res.status(500).json({ error: error.message || error });
      }

      let gross = 0, net = 0, count = 0;
      (rows || []).forEach((r) => {
        const amt = Number(r?.[amount_col] ?? 0);
        if (!Number.isFinite(amt) || amt === 0) return;
        if (status_col) {
          const st = String(r[status_col] ?? "").toLowerCase();
          const paidKeywords = ["paid", "succeeded", "completed", "ok", "success"];
          const isPaid = paidKeywords.some((k) => st.includes(k)) || st === "true" || Number(st) > 0;
          if (!isPaid) return;
        }
        gross += amt;
        net += amt;
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
    }

    if (action === "timeseries") {
      const bucket = (req.query.bucket || "daily").toLowerCase();
      const { days, label } = parseRangeParam(req.query.range, 30);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const source = await detectSource(supabase);
      if (!source) {
        return res.status(200).json({ range: label, bucket, points: [], source: null });
      }

      const { table, amount_col, time_col, status_col } = source;
      const { data: rows, error } = await supabase
        .from(table)
        .select(`${amount_col}, ${time_col}${status_col ? `, ${status_col}` : ""}`)
        .gte(time_col, since)
        .order(time_col, { ascending: true })
        .limit(20000);

      if (error) {
        console.error("earnings timeseries fetch error:", error);
        return res.status(500).json({ error: error.message || error });
      }

      const pointsMap = new Map();
      (rows || []).forEach((r) => {
        const amt = Number(r?.[amount_col] ?? 0);
        if (!Number.isFinite(amt) || amt === 0) return;
        if (status_col) {
          const st = String(r[status_col] ?? "").toLowerCase();
          const paidKeywords = ["paid", "succeeded", "completed", "ok", "success"];
          const isPaid = paidKeywords.some((k) => st.includes(k)) || st === "true" || Number(st) > 0;
          if (!isPaid) return;
        }
        const ts = new Date(r[time_col]);
        if (Number.isNaN(ts.getTime())) return;
        let key;
        if (bucket === "hourly") {
          key = `${ts.getUTCFullYear()}-${String(ts.getUTCMonth() + 1).padStart(2,"0")}-${String(ts.getUTCDate()).padStart(2,"0")} ${String(ts.getUTCHours()).padStart(2,"0")}:00`;
        } else {
          key = `${ts.getUTCFullYear()}-${String(ts.getUTCMonth() + 1).padStart(2,"0")}-${String(ts.getUTCDate()).padStart(2,"0")}`;
        }
        const existing = pointsMap.get(key) || { gross:0, net:0, count:0 };
        existing.gross += amt;
        existing.net += amt;
        existing.count += 1;
        pointsMap.set(key, existing);
      });

      const points = Array.from(pointsMap.entries())
        .map(([ts, v]) => ({ ts, gross: Number(v.gross.toFixed(2)), net: Number(v.net.toFixed(2)), count: v.count }))
        .sort((a,b) => (a.ts > b.ts ? 1 : -1));

      return res.status(200).json({ range: label, bucket, points, source: { table: source.table, amount_col: source.amount_col, time_col: source.time_col, status_col: source.status_col } });
    }

    if (action === "transactions") {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(200, Number(req.query.limit) || 50);
      const offset = (page - 1) * limit;
      const fromIso = req.query.from || null;
      const toIso = req.query.to || null;
      const statusFilter = req.query.status || null;

      const source = await detectSource(supabase);
      if (!source) {
        return res.status(200).json({ page, limit, total: 0, transactions: [], source: null });
      }

      const { table, time_col, status_col, columns } = source;
      let query = supabase.from(table).select(columns.join(",")).order(time_col, { ascending: false }).range(offset, offset + limit - 1);
      if (fromIso) query = query.gte(time_col, fromIso);
      if (toIso) query = query.lte(time_col, toIso);
      if (statusFilter && status_col) query = query.eq(status_col, statusFilter);

      const { data, error } = await query;
      if (error) {
        console.error("transactions fetch error:", error);
        return res.status(500).json({ error: error.message || error });
      }

      let total = null;
      try {
        const countRes = await supabase.from(table).select("id", { count: "exact", head: false }).maybeSingle();
        total = countRes?.count ?? null;
      } catch (e) { /* ignore */ }

      return res.status(200).json({ page, limit, total, transactions: data || [], source: { table: source.table, amount_col: source.amount_col, time_col: source.time_col, status_col: source.status_col } });
    }

    return res.status(400).json({ error: "unknown_action" });
  } catch (err) {
    console.error("earnings handler error:", err);
    return res.status(500).json({ error: err.message || "internal_error" });
  }
}
