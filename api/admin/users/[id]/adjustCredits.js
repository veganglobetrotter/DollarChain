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

    // 1) Preferred path: call RPC admin_adjust_credits (atomic + idempotent)
    try {
      const { data, error } = await supabase.rpc("admin_adjust_credits", {
        p_user_id: userId,
        p_delta: delta,
        p_reason: reason,
        p_idempotency_key: idempotencyKey,
        p_actor_id: actorId,
      });

      if (error) {
        // If RPC returned an error (permission, missing function, etc.) throw to trigger fallback
        throw error;
      }

      const row = Array.isArray(data) ? data[0] : data;
      const newBalance = row?.new_balance ?? null;
      const auditId = row?.audit_id ?? null;
      const idempotent = !!row?.idempotent;

      return res.status(200).json({ ok: true, credits_balance: newBalance, audit_id: auditId, idempotent });
    } catch (rpcErr) {
      // RPC failed — fall back to legacy safe path.
      console.warn("adjustCredits: RPC call failed, falling back to legacy logic:", rpcErr && (rpcErr.message || rpcErr));
    }

    // 2) Fallback path: legacy behavior (idempotency check via admin_audit, insert credits row, recompute)
    try {
      // If idempotencyKey is provided, try to find an existing audit row
      if (idempotencyKey) {
        try {
          const { data: existingAudit, error: findErr } = await supabase
            .from("admin_audit")
            .select("id")
            .eq("idempotency_key", idempotencyKey)
            .maybeSingle();

          if (findErr) {
            console.warn("adjustCredits: admin_audit lookup error:", findErr);
          } else if (existingAudit) {
            // Already applied
            // Recompute balance to return canonical value
            const { data: creditRows, error: creditErr } = await supabase
              .from("credits")
              .select("amount")
              .eq("user_id", userId);

            let balance = 0;
            if (!creditErr && Array.isArray(creditRows)) {
              balance = creditRows.reduce((acc, r) => acc + Number(r.amount || 0), 0);
            } else if (creditErr) {
              console.warn("adjustCredits: failed to fetch credit rows during idempotent return:", creditErr);
            }

            return res.status(200).json({ ok: true, credits_balance: balance, audit_id: existingAudit.id, idempotent: true });
          }
        } catch (e) {
          console.warn("adjustCredits: idempotency check error (non-fatal):", e);
        }
      }

      // Insert a credits row
      const insertPayload = { user_id: userId, amount: delta, created_at: new Date().toISOString() };
      const { data: insertData, error: insertErr } = await supabase.from("credits").insert(insertPayload).select().maybeSingle();

      if (insertErr) {
        console.error("adjustCredits insert error:", insertErr);
        return res.status(500).json({ error: insertErr.message || insertErr });
      }

      // Recompute user's credits balance
      let newBalance = 0;
      try {
        const { data: creditRows, error: creditErr } = await supabase
          .from("credits")
          .select("amount")
          .eq("user_id", userId);

        if (creditErr) {
          console.warn("adjustCredits: failed to fetch credit rows for balance computation:", creditErr);
        } else if (Array.isArray(creditRows)) {
          newBalance = creditRows.reduce((acc, r) => acc + Number(r.amount || 0), 0);
        }
      } catch (e) {
        console.warn("adjustCredits: credit aggregation error:", e);
      }

      // Try to write an admin_audit row (best-effort). If idempotencyKey present, include it.
      let auditId = null;
      try {
        const auditPayload = {
          actor_id: actorId,
          action: "adjustCredits",
          target_id: userId,
          detail: JSON.stringify({ delta, reason, idempotencyKey }),
          idempotency_key: idempotencyKey || null,
          created_at: new Date().toISOString(),
        };

        const { data: auditInsert, error: auditErr } = await supabase.from("admin_audit").insert(auditPayload).select().maybeSingle();

        if (auditErr) {
          // Possibly unique constraint on idempotency_key — try to fetch existing audit
          console.warn("adjustCredits: admin_audit insert error (non-fatal):", auditErr);
          if (idempotencyKey) {
            try {
              const { data: existingAudit2, error: findErr2 } = await supabase
                .from("admin_audit")
                .select("id")
                .eq("idempotency_key", idempotencyKey)
                .maybeSingle();

              if (!findErr2 && existingAudit2) {
                auditId = existingAudit2.id;
              }
            } catch (e) {
              console.warn("adjustCredits: fallback admin_audit lookup failed:", e);
            }
          }
        } else if (auditInsert) {
          auditId = auditInsert.id;
        }
      } catch (e) {
        console.warn("adjustCredits: admin_audit write failed (non-fatal):", e);
      }

      return res.status(200).json({
        ok: true,
        credits_balance: newBalance,
        inserted: insertData || null,
        audit_id: auditId,
        idempotent: false,
      });
    } catch (fallbackErr) {
      console.error("adjustCredits fallback handler error:", fallbackErr);
      return res.status(500).json({ error: fallbackErr.message || "adjust_credits_failed" });
    }
  } catch (err) {
    if (!res.headersSent) {
      console.error("adjustCredits handler error:", err);
      res.status(500).json({ error: err.message || "internal_error" });
    }
  }
}
