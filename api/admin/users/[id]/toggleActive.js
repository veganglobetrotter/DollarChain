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

    // Try to update profiles.is_active (if column exists). If it doesn't exist, fall back to updating a deleted_at column.
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

    // If the first attempt failed because column doesn't exist, try toggling deleted_at as fallback
    if (updateErr) {
      try {
        if (active) {
          // Reactivate: set deleted_at = null
          const { data: d2, error: e2 } = await supabase
            .from("profiles")
            .update({ deleted_at: null })
            .eq("id", userId)
            .select()
            .maybeSingle();
          updated = d2;
          updateErr = e2;
        } else {
          // Deactivate: set deleted_at = now()
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
      console.error("toggleActive update error:", updateErr);
      return res.status(500).json({ error: updateErr.message || updateErr });
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
        action: "toggleActive",
        target_id: userId,
        detail: JSON.stringify({ active }),
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("toggleActive: failed to write audit row (non-fatal)", e);
    }

    // Determine resulting active flag (try to read updated.is_active or infer from deleted_at)
    const resultingActive = typeof updated?.is_active === "boolean"
      ? updated.is_active
      : !(updated?.deleted_at); // if deleted_at exists, active=false

    return res.status(200).json({ ok: true, is_active: resultingActive });
  } catch (err) {
    if (!res.headersSent) {
      console.error("toggleActive handler error:", err);
      res.status(500).json({ error: err.message || "internal_error" });
    }
  }
}
