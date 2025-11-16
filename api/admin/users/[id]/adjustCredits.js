// api/admin/users/[id]/adjustCredits.js
import { createSupabaseServerClient, requireSuperAdmin, getUserFromBearer } from "../../lib/supabaseServer.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

    const auth = req.headers?.authorization;
    await requireSuperAdmin(auth, res);

    const userId = req.query.id;
    if (!userId) return res.status(400).json({ error: "missing_user_id" });

    const body = req.body || {};
    const delta = Number(body.delta);
    const reason = (body.reason || "").slice(0, 1000); // limit reason length
    const idempotencyKey = body.idempotencyKey || null;

    if (!Number.isFinite(delta) || delta === 0) {
      return res.status(400).json({ error: "invalid_delta" });
    }

    const supabase = createSupabaseServerClient();

    // Optional: attempt to prevent double-apply if idempotencyKey provided and admin_audit exists
    if (idempotencyKey) {
      try {
        const { data: found, error: findErr } = await supabase
          .from("admin_audit")
          .select("id")
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();

        if (findErr) {
          console.warn("adjustCredits: admin_audit lookup error", findErr);
        } else if (found) {
          // idempotent response: already applied
          return res.status(200).json({ ok: true, idempotent: true });
        }
      } catch (e) {
        console.warn("adjustCredits: idempotency lookup failed", e);
      }
    }

    // Insert a credits row for this user (assumes credits table has columns: user_id, amount, created_at)
    const insertPayload = { user_id: userId, amount: delta, created_at: new Date().toISOString() };
    const { data: insertData, error: insertErr } = await supabase.from("credits").insert(insertPayload).select().maybeSingle();

    if (insertErr) {
      console.error("adjustCredits insert error:", insertErr);
      return res.status(500).json({ error: insertErr.message || insertErr });
    }

    // Recompute user's credits balance by summing amounts
    let newBalance = 0;
    try {
      const { data: creditRows, error: creditErr } = await supabase
        .from("credits")
        .select("amount")
        .eq("user_id", userId);

      if (creditErr) {
        console.warn("adjustCredits: failed to fetch credit rows", creditErr);
      } else if (creditRows && Array.isArray(creditRows)) {
        newBalance = creditRows.reduce((acc, r) => acc + Number(r.amount || 0), 0);
      }
    } catch (e) {
      console.warn("adjustCredits: credit aggregation error", e);
    }

    // Try to log admin action to admin_audit (non-fatal)
    try {
      // Try to find actor id from bearer token if helper exists
      let actorId = null;
      try {
        const actor = await getUserFromBearer(auth);
        actorId = actor?.id || null;
      } catch (e) {
        // ignore
      }

      const auditPayload = {
        actor_id: actorId,
        action: "adjustCredits",
        target_id: userId,
        detail: JSON.stringify({ delta, reason, idempotencyKey }),
        created_at: new Date().toISOString(),
        idempotency_key: idempotencyKey || null,
      };

      await supabase.from("admin_audit").insert(auditPayload);
    } catch (e) {
      // audit logging is best-effort; do not fail the request if audit table doesn't exist
      console.warn("adjustCredits: failed to write audit row (non-fatal)", e);
    }

    return res.status(200).json({ ok: true, credits_balance: newBalance, inserted: insertData || null });
  } catch (err) {
    if (!res.headersSent) {
      console.error("adjustCredits handler error:", err);
      res.status(500).json({ error: err.message || "internal_error" });
    }
  }
}
