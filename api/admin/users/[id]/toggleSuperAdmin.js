// api/admin/users/[id]/toggleSuperAdmin.js
import { createSupabaseServerClient, requireSuperAdmin, getUserFromBearer } from "../../lib/supabaseServer.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

    const auth = req.headers?.authorization;
    await requireSuperAdmin(auth, res);

    const userId = req.query.id;
    if (!userId) return res.status(400).json({ error: "missing_user_id" });

    const body = req.body || {};
    const is_super_admin = !!body.is_super_admin;

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("profiles")
      .update({ is_super_admin, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("toggleSuperAdmin update error:", error);
      return res.status(500).json({ error: error.message || error });
    }

    // audit log (best-effort)
    try {
      let actorId = null;
      try {
        const actor = await getUserFromBearer(auth);
        actorId = actor?.id || null;
      } catch (e) {}

      await supabase.from("admin_audit").insert({
        actor_id: actorId,
        action: "toggleSuperAdmin",
        target_id: userId,
        detail: JSON.stringify({ is_super_admin }),
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("toggleSuperAdmin: failed to write audit row (non-fatal)", e);
    }

    return res.status(200).json({ ok: true, is_super_admin: !!data?.is_super_admin });
  } catch (err) {
    if (!res.headersSent) {
      console.error("toggleSuperAdmin handler error:", err);
      res.status(500).json({ error: err.message || "internal_error" });
    }
  }
}
