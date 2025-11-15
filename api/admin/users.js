// api/admin/users.js
import { createSupabaseServerClient, requireSuperAdmin } from "../lib/supabaseServer.js";

export default async function handler(req, res) {
  try {
    // require the request's Authorization header to be present
    const auth = req.headers?.authorization;
    await requireSuperAdmin(auth, res);

    // list users from profiles (joined with auth.users if needed)
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, is_super_admin, metadata")
      .limit(100)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("admin/users read error:", error);
      return res.status(500).json({ error: error.message || error });
    }

    // map email out of metadata n
    const users = (data || []).map(u => ({
      ...u,
      email: u.metadata?.email || null
    }));

    return res.status(200).json({ users });
  } catch (err) {
    // requireSuperAdmin already responded on common errors — fallback:
    if (!res.headersSent) {
      console.error("admin/users handler error:", err);
      res.status(500).json({ error: err.message || "internal_error" });
    }
  }
}
