// api/consumeCredits.js
// resilient server wrapper for consuming reserved credits
import { createSupabaseServerClient } from "../src/lib/supabaseServer.js";

const RPC_CANDIDATES = [
  "consume_reserved_credits",
  "consume_credits",
  "consume_credits_transaction",
  "consume_credits_transaction_v2",
  "dc_consume_reserved_credits"
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { userId, reservationId, delta, type, reference } = req.body || {};
    if (!userId || !reservationId || typeof delta === "undefined" || !type) {
      return res.status(400).json({ ok: false, error: "Missing required fields: userId, reservationId, delta, type" });
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = createSupabaseServerClient();
    } catch (err) {
      console.error("consumeCredits: createSupabaseServerClient failed", err);
      return res.status(500).json({ ok: false, error: "Server configuration error" });
    }

    // try candidates in order until one succeeds
    let lastErr = null;
    for (const rpcName of RPC_CANDIDATES) {
      try {
        const { data, error } = await supabaseAdmin.rpc(rpcName, {
          _user_id: userId,
          _reservation_id: reservationId,
          _delta: delta,
          _type: type,
          _reference: reference ?? null
        });

        if (error) {
          // some RPCs return structured error; record and try next
          lastErr = { rpc: rpcName, error };
          console.warn("consumeCredits: rpc error", rpcName, error);
          continue;
        }

        // normalize return: prefer transaction or object
        const transaction = Array.isArray(data) ? data[0] ?? null : data ?? null;
        return res.status(200).json({ ok: true, transaction, rpc: rpcName });
      } catch (rpcCallErr) {
        lastErr = { rpc: rpcName, error: rpcCallErr };
        console.warn("consumeCredits: rpc call failed", rpcName, rpcCallErr);
        continue;
      }
    }

    // none worked
    console.error("consumeCredits: all RPC candidates failed", lastErr);
    return res.status(500).json({ ok: false, error: "All consume RPCs failed", details: lastErr });
  } catch (err) {
    console.error("consumeCredits unexpected error:", err);
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}
