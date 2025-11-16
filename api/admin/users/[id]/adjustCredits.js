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
    const reason = (body.reason || "").slice(0, 1000);
    const idempotencyKey = body.idempotencyKey || body.idempotency_key || null;

    if (!Number.isFinite(delta) || delta === 0) {
      return res.status(400).json({ error: "invalid_delta" });
    }

    const supabase = createSupabaseServerClient();

    // Try to determine actor id (best-effort)
    let actorId = null;
    try {
      const actor = await getUserFromBearer(auth);
      actorId = actor?.id || null;
    } catch (e) {
      // ignore
    }

    // Call the DB function (RPC) that performs idempotent + atomic adjust
    const rpcPayload = {
      p_user_id: userId,
      p_delta: delta,
      p_reason: reason,
      p_idempotency_key: idempotencyKey,
      p_actor_id: actorId,
    };

    // Note: Supabase maps JS keys to function parameter names; use the same names as in SQL function.
    const { data, error } = await supabase.rpc("admin_adjust_credits", {
      p_user_id: userId,
      p_delta: delta,
      p_reason: reason,
      p_idempotency_key: idempotencyKey,
      p_actor_id: actorId,
    });

    if (error) {
      console.error("adjustCredits RPC error:", error);
      // If RPC failed due to unique constraint on idempotency (concurrency), try to read existing audit and return idempotent response
      // But supabase.rpc should return the function's returned row in normal cases.
      return res.status(500).json({ error: error.message || error });
    }

    // supabase.rpc returns an array-like result; take first row
    const row = Array.isArray(data) ? data[0] : data;

    // row fields: new_balance, audit_id, idempotent
    const newBalance = row?.new_balance ?? null;
    const auditId = row?.audit_id ?? null;
    const idempotent = !!row?.idempotent;

    return res.status(200).json({ ok: true, credits_balance: newBalance, audit_id: auditId, idempotent });
  } catch (err) {
    if (!res.headersSent) {
      console.error("adjustCredits handler error:", err);
      res.status(500).json({ error: err.message || "internal_error" });
    }
  }
}
