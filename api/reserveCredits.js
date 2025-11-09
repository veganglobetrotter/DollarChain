// src/api/reserveCredits.js
import { createSupabaseServerClient } from "../src/lib/supabaseServer.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, amount, idempotencyKey } = req.body || {};
    if (!userId || typeof amount === "undefined" || !idempotencyKey) {
      return res.status(400).json({ error: "Missing required fields: userId, amount, idempotencyKey" });
    }

    const supabaseAdmin = createSupabaseServerClient();

    // Call correct RPC
    const { data, error } = await supabaseAdmin.rpc("reserve_credits_transaction_v2", {
      _user_id: userId,
      _amount: amount,
      _idempotency_key: idempotencyKey,
    });

    if (error) {
      console.error("reserveCredits RPC error:", error);
      return res.status(500).json({ error: error.message || "reserve RPC failed", details: error });
    }

    // Normalize response to single reservation object
    const reservation = data ?? null;

    return res.status(200).json({ success: true, reservation });
  } catch (err) {
    console.error("reserveCredits error:", err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
