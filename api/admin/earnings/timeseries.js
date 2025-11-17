// api/admin/earnings/timeseries.js
import { createSupabaseServerClient, requireSuperAdmin } from "../../lib/supabaseServer.js";

/**
 * GET /api/admin/earnings/timeseries?range=30d&bucket=daily|hourly
 *
 * Detects a data source table (payments/invoices/etc) and returns timeseries points:
 * { range, bucket, points: [{ ts: "2025-11-01", gross, net, count }], source }
 *
 * Aggregation done in JS after fetching rows within range. Defensive for no-data case.
 */

const CANDIDATE_TABLES = ["payments", "invoices", "orders", "transactions", "charges", "credits"];
const AMOUNT_CANDIDATES = ["amount", "total", "gross_amount", "paid_amount", "price"];
const TIME_CANDIDATES = ["paid_at", "paid_on", "created_at", "inserted_at", "updated_at", "timestamp"];
const STATUS_CANDIDATES = ["status", "state", "payment_status", "status_code", "paid"];

async function detectSource(supabase) {
  for (const table of CANDIDATE_TABLES) {
    const { data: cols } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_schema", "public")
      .eq("table_name", table);

    if (!cols || cols.length === 0) continue;

    const colNames = cols.map((c) => c.column_name);
    const amount = AMOUNT_CANDIDATES.find((c) => colNames.includes(c));
    const time = TIME_CANDIDATES.find((c) => colNames.includes(c));
    const status = STATUS_CANDIDATES.find((c) => colNames.includes(c));
    if (amount && time) return { table, amount_col: amount, time_col: time, status_col: status || null };
  }
  return null;
}

function parseRange(range) {
  if (!range) return { days: 30, label: "30d" };
  const v = String(range).toLowerCase();
  if (v.endsWith("d")) {
    const n = Number(v.slice(0, -1));
    if (Number.isFinite(n)) return { days: n, label: v };
  }
  if (v === "7" || v === "7d") return { days: 7, label: "7d" };
  if (v === "90" || v === "90d") return { days: 90, label: "90d" };
  return { days: 30, label: "30d" };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

    const auth = req.headers?.authorization;
    await requireSuperAdmin(auth, res);

    const supabase = createSupabaseServerClient();
    const bucket = (req.query.bucket || "daily").toLowerCase();
    const { days, label } = parseRange(req.query.range);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const source = await detectSource(supabase);
    if (!source) {
      return res.status(200).json({
        range: label,
        bucket,
        points: [],
        source: null,
      });
    }

    const { table, amount_col, time_col, status_col } = source;

    const { data: rows, error } = await supabase
      .from(table)
      .select(`${amount_col}, ${time_col}${status_col ? `, ${status_col}` : ""}`)
      .gte(time_col, since)
      .order(time_col, { ascending: true })
      .limit(20000);

    if (error) {
      console.error("earnings/timeseries fetch error:", error);
      return res.status(500).json({ error: error.message || error });
    }

    // aggregate into buckets
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
        key = `${ts.getUTCFullYear()}-${String(ts.getUTCMonth() + 1).padStart(2, "0")}-${String(ts.getUTCDate()).padStart(2, "0")} ${String(ts.getUTCHours()).padStart(2, "0")}:00`;
      } else {
        // daily
        key = `${ts.getUTCFullYear()}-${String(ts.getUTCMonth() + 1).padStart(2, "0")}-${String(ts.getUTCDate()).padStart(2, "0")}`;
      }

      const existing = pointsMap.get(key) || { gross: 0, net: 0, count: 0 };
      existing.gross += amt;
      existing.net += amt; // placeholder (no refunds handling yet)
      existing.count += 1;
      pointsMap.set(key, existing);
    });

    // convert to sorted points array
    const points = Array.from(pointsMap.entries())
      .map(([ts, v]) => ({ ts, gross: Number(v.gross.toFixed(2)), net: Number(v.net.toFixed(2)), count: v.count }))
      .sort((a, b) => (a.ts > b.ts ? 1 : -1));

    return res.status(200).json({
      range: label,
      bucket,
      points,
      source: { table, amount_col, time_col, status_col },
    });
  } catch (err) {
    console.error("earnings/timeseries handler error:", err);
    return res.status(500).json({ error: err.message || "internal_error" });
  }
}
