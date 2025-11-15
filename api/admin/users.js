// api/admin/users.js
import { createSupabaseServerClient, requireSuperAdmin } from "../lib/supabaseServer.js";

export default async function handler(req, res) {
  try {
    // Require super-admin auth
    const auth = req.headers?.authorization;
    await requireSuperAdmin(auth, res);

    const supabase = createSupabaseServerClient();

    // Parse query params
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const search = req.query.q?.toLowerCase() || null;
    const sortParam = req.query.sort || "created_at.desc";

    let [sortField, sortOrder] = sortParam.split(".");
    sortField = sortField || "created_at";
    sortOrder = sortOrder === "asc" ? "asc" : "desc";

    // Fetch profiles joined with auth.users to get provider and last_sign_in
    let query = supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        phone,
        is_super_admin,
        metadata,
        created_at,
        auth_provider:auth.users!inner.provider,
        last_sign_in:auth.users!inner.last_sign_in,
        credits_balance:credits!inner.amount
      `)
      .order(sortField, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike("full_name", `%${search}%`).or(`metadata->>email.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("admin/users read error:", error);
      return res.status(500).json({ error: error.message || error });
    }

    const users = (data || []).map(u => ({
      id: u.id,
      full_name: u.full_name,
      email: u.metadata?.email || null,
      phone: u.phone || null,
      is_super_admin: u.is_super_admin || false,
      provider: u.auth_provider || null,
      last_sign_in: u.last_sign_in || null,
      created_at: u.created_at || null,
      credits_balance: u.credits_balance || 0,
    }));

    return res.status(200).json({ users });
  } catch (err) {
    if (!res.headersSent) {
      console.error("admin/users handler error:", err);
      res.status(500).json({ error: err.message || "internal_error" });
    }
  }
}
