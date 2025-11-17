// api/admin/users/[id]/toggleActive.js
import { createSupabaseServerClient, requireSuperAdmin, getUserFromBearer } from "../../lib/supabaseServer.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

    const auth = req.headers?.authorization;
    await requireSuperAdmin(auth, res);

    const userId = req.query.id;
    if (!userId) return res.status(400).json({ error: "missing_user_id" });

    const body = req.body || {};
    const active = !!body.active;

    const supabase = createSupabaseServerClient();

    // Try RPC first (atomic + audited if admin_toggle_active RPC exists)
    try {
      const actor = await (async () => {
        try {
          return await getUserFromBearer(auth);
        } catch (e) {
          return null;
        }
      })();
      const actorId = actor?.id || null;

      // RPC params: p_user_id, p_active, p_actor_id
      const { data, error } = await supabase.rpc("admin_toggle_active", {
        p_user_id: userId,
        p_active: active,
        p_actor_id: actorId,
      });

      if (!error && data) {
        const row = Array.isArray(data) ? data[0] : data;
        const resultingActive = typeof row?.is_active === "boolean" ? row.is_active : active;
        const auditId = row?.audit_id || null;
        console.log("toggleActive: used RPC, result:", { resultingActive, auditId });
        return res.status(200).json({ ok: true, is_active: !!resultingActive, audit_id: auditId });
      }

      if (error) {
        throw error;
      }
    } catch (rpcErr) {
      console.warn("toggleActive: RPC failed or not available — falling back to SQL update. Err:", rpcErr && (rpcErr.message || rpcErr));
    }

    // Fallback: attempt update on profiles (is_active) or deleted_at, and write admin_audit best-effort
    try {
      const updates = { updated_at: new Date().toISOString() };
      if ("is_active" in body) updates.is_active = active;

      let updated = null;
      let updateErr = null;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", userId)
          .select()
          .maybeSingle();

        updated = data;
        updateErr = error;
      } catch (e) {
        updateErr = e;
      }

      if (updateErr) {
        // fallback to deleted_at toggle
        try {
          if (active) {
            const { data: d2, error: e2 } = await supabase
              .from("profiles")
              .update({ deleted_at: null })
              .eq("id", userId)
              .select()
              .maybeSingle();
            updated = d2;
            updateErr = e2;
          } else {
            const { data: d3, error: e3 } = await supabase
              .from("profiles")
              .update({ deleted_at: new Date().toISOString() })
              .eq("id", userId)
              .select()
              .maybeSingle();
            updated = d3;
            updateErr = e3;
          }
        } catch (e) {
          updateErr = e;
        }
      }

      if (updateErr) {
        console.error("toggleActive update error (fallback):", updateErr);
        return res.status(500).json({ error: updateErr.message || updateErr });
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
          action: "toggleActive",
          target_id: userId,
          detail: JSON.stringify({ active }),
          created_at: new Date().toISOString(),
        });

        if (auditErr) {
          console.warn("toggleActive: admin_audit insert warning (non-fatal):", auditErr);
        }
      } catch (e) {
        console.warn("toggleActive: failed to write audit row (non-fatal)", e);
      }

      const resultingActive = typeof updated?.is_active === "boolean"
        ? updated.is_active
        : !(updated?.deleted_at);

      return res.status(200).json({ ok: true, is_active: resultingActive });
    } catch (fallbackErr) {
      console.error("toggleActive fallback handler error:", fallbackErr);
      return res.status(500).json({ error: fallbackErr.message || "toggle_active_failed" });
    }
  } catch (err) {
    if (!res.headersSent) {
      console.error("toggleActive handler error:", err);
      res.status(500).json({ error: err.message || "internal_error" });
    }
  }
}
