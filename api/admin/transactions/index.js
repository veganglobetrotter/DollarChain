// api/admin/transactions/index.js
import { createSupabaseServerClient, requireSuperAdmin } from "../../../lib/supabaseServer.js";

/**
 * GET /api/admin/transactions?page=1&limit=50&from=ISO&to=ISO&status=paid
 *
 * Returns paginated list of transaction-like rows from a detected source table.
 * Defensive: returns empty list if no data source detected.
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
    if (amount && time) return { table, amount_col: amount, time_col: time, status_col: status || null, columns: colNames };
  }
  return null;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

    const auth = req.headers?.authorization;
    await requireSuperAdmin(auth, res);

    const supabase = createSupabaseServerClient();

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

    const { table, amount_col, time_col, status_col, columns } = source;

    let query = supabase.from(table).select(columns.join(",")).order(time_col, { ascending: false }).range(offset, offset + limit - 1);

    if (fromIso) query = query.gte(time_col, fromIso);
    if (toIso) query = query.lte(time_col, toIso);
    if (statusFilter && status_col) query = query.eq(status_col, statusFilter);

    const { data, error } = await query;
    if (error) {
      console.error("transactions list error:", error);
      return res.status(500).json({ error: error.message || error });
    }

    // try to fetch total count (best-effort)
    let total = null;
    try {
      const countRes = await supabase.from(table).select("id", { count: "exact", head: false }).maybeSingle();
      total = countRes?.count ?? null;
    } catch (e) {
      // ignore
    }

    return res.status(200).json({ page, limit, total, transactions: data || [], source: { table, amount_col, time_col, status_col } });
  } catch (err) {
    console.error("transactions handler error:", err);
    return res.status(500).json({ error: err.message || "internal_error" });
  }
}
