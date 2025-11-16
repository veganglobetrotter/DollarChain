// api/admin/users.js
import { createSupabaseServerClient, requireSuperAdmin } from "../lib/supabaseServer.js";

export default async function handler(req, res) {
  try {
    // Require super-admin auth
    const auth = req.headers?.authorization;
    await requireSuperAdmin(auth, res);

    const supabase = createSupabaseServerClient();

    // Parse query params
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || "50"))); // clamp sensible limits
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const offset = (page - 1) * limit;
    const search = req.query.q?.trim() || null;
    const sortParam = req.query.sort || "created_at.desc";

    let [sortField, sortOrder] = sortParam.split(".");
    sortField = sortField || "created_at";
    sortOrder = sortOrder === "asc" ? "asc" : "desc";

    // Basic profiles select (page/range)
    // Use exact count so caller can paginate properly
    let baseQuery = supabase
      .from("profiles")
      .select("id, full_name, phone, is_super_admin, metadata, created_at", { count: "exact" })
      .order(sortField, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    // Apply server-side search for name OR metadata->>email
    if (search) {
      // supabase .or accepts a comma-separated list of conditions
      // use ilike with %search% for case-insensitive partial match
      const escaped = search.replace(/%/g, "\\%"); // minimal escape in case user types %
      baseQuery = baseQuery.or(`full_name.ilike.%${escaped}%,metadata->>email.ilike.%${escaped}%`);
    }

    const { data: profiles, error: profilesError, count } = await baseQuery;

    if (profilesError) {
      console.error("admin/users read error (profiles):", profilesError);
      return res.status(500).json({ error: profilesError.message || profilesError });
    }

    const ids = (profiles || []).map((p) => p.id).filter(Boolean);
    let creditsMap = {};
    let authMap = {};

    // If we have ids, fetch credits aggregates and auth.users rows
    if (ids.length > 0) {
      // Aggregate credits per user_id (sum). If your credits table has different column names adjust below.
      try {
        const { data: creditRows, error: creditErr } = await supabase
          .from("credits")
          .select("user_id, amount")
          .in("user_id", ids);

        if (creditErr) {
          // Not fatal — log and continue with zero balances
          console.warn("admin/users: could not fetch credits rows:", creditErr);
        } else if (creditRows) {
          creditsMap = creditRows.reduce((acc, r) => {
            const uid = r.user_id;
            const amt = Number(r.amount || 0);
            acc[uid] = (acc[uid] || 0) + amt;
            return acc;
          }, {});
        }
      } catch (e) {
        console.warn("admin/users: credits aggregation error:", e);
      }

      // Fetch auth users for provider + last_sign_in if accessible
      try {
        const { data: authRows, error: authErr } = await supabase
          .from("auth.users")
          .select("id, provider, last_sign_in")
          .in("id", ids);

        if (authErr) {
          // not fatal, log and continue
          console.warn("admin/users: could not fetch auth.users:", authErr);
        } else if (authRows) {
          authMap = (authRows || []).reduce((acc, r) => {
            acc[r.id] = { provider: r.provider || null, last_sign_in: r.last_sign_in || null };
            return acc;
          }, {});
        }
      } catch (e) {
        console.warn("admin/users: auth.users query error:", e);
      }
    }

    // Map profiles -> final user objects
    const users = (profiles || []).map((p) => ({
      id: p.id,
      full_name: p.full_name || null,
      email: p.metadata?.email || null,
      phone: p.phone || p.metadata?.phone || null,
      is_super_admin: !!p.is_super_admin,
      provider: authMap[p.id]?.provider || null,
      last_sign_in: authMap[p.id]?.last_sign_in || null,
      created_at: p.created_at || null,
      credits_balance: creditsMap[p.id] || 0,
    }));

    return res.status(200).json({ users, total: typeof count === "number" ? count : undefined });
  } catch (err) {
    if (!res.headersSent) {
      console.error("admin/users handler error:", err);
      res.status(500).json({ error: err.message || "internal_error" });
    }
  }
}
