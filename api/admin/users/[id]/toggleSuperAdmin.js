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

    // Try RPC first (atomic + audited if admin_toggle_superadmin RPC exists)
    try {
      const actor = await (async () => {
        try {
          return await getUserFromBearer(auth);
        } catch (e) {
          return null;
        }
      })();
      const actorId = actor?.id || null;

      // RPC params: p_user_id, p_is_super_admin, p_actor_id
      const { data, error } = await supabase.rpc("admin_toggle_superadmin", {
        p_user_id: userId,
        p_is_super_admin: is_super_admin,
        p_actor_id: actorId,
      });

      if (!error && data) {
        // rpc may return { is_super_admin, audit_id } or similar; handle gracefully
        const row = Array.isArray(data) ? data[0] : data;
        const resulting = typeof row?.is_super_admin === "boolean" ? row.is_super_admin : is_super_admin;
        const auditId = row?.audit_id || null;
        console.log("toggleSuperAdmin: used RPC, result:", { resulting, auditId });
        return res.status(200).json({ ok: true, is_super_admin: !!resulting, audit_id: auditId });
      }

      if (error) {
        // Throw to trigger fallback
        throw error;
      }
    } catch (rpcErr) {
      console.warn("toggleSuperAdmin: RPC failed or not available — falling back to SQL update. Err:", rpcErr && (rpcErr.message || rpcErr));
    }

    // Fallback: update profiles and write admin_audit best-effort
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_super_admin, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .maybeSingle();

      if (error) {
        console.error("toggleSuperAdmin update error (fallback):", error);
        return res.status(500).json({ error: error.message || error });
      }

      // audit log (best-effort)
      try {
        let actorId = null;
        try {
          const actor = await getUserFromBearer(auth);
          actorId = actor?.id || null;
        } catch (e) {}

        const { error: auditErr } = await supabase.from("admin_audit").insert({
          actor_id: actorId,
          action: "toggleSuperAdmin",
          target_id: userId,
          detail: JSON.stringify({ is_super_admin }),
          created_at: new Date().toISOString(),
        });

        if (auditErr) {
          // not fatal — log only
          console.warn("toggleSuperAdmin: admin_audit insert warning (non-fatal):", auditErr);
        }
      } catch (e) {
        console.warn("toggleSuperAdmin: failed to write audit row (non-fatal)", e);
      }

      return res.status(200).json({ ok: true, is_super_admin: !!data?.is_super_admin });
    } catch (err) {
      console.error("toggleSuperAdmin fallback handler error:", err);
      return res.status(500).json({ error: err.message || "internal_error" });
    }
  } catch (err) {
    if (!res.headersSent) {
      console.error("toggleSuperAdmin handler error:", err);
      res.status(500).json({ error: err.message || "internal_error" });
    }
  }
}
