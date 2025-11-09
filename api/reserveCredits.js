// src/api/reserveCredits.js
// (patched) - use explicit path to the server helper that matches Vercel's lambda layout
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

    // create admin client (service role)
    let supabaseAdmin;
    try {
      supabaseAdmin = createSupabaseServerClient();
    } catch (err) {
      console.error("reserveCredits: failed to create supabase server client", err);
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Call Postgres RPC (reserve_credits_transaction)
    try {
      const { data, error } = await supabaseAdmin.rpc(
        "reserve_credits_transaction",
        { _user_id: userId, _amount: amount, _idempotency_key: idempotencyKey }
      );

      if (error) {
        console.error("reserve_credits_transaction error:", error);
        // prefer structured error if Supabase provided one
        return res.status(500).json({ error: error.message || "reserve RPC failed", details: error });
      }

      // Some RPCs return an array or single row — normalize to single reservation object
      const reservation = Array.isArray(data) ? data[0] ?? null : data ?? null;

      return res.status(200).json({ success: true, reservation });
    } catch (rpcErr) {
      console.error("reserveCredits RPC failure:", rpcErr);
      return res.status(500).json({ error: "reserve RPC failed", details: String(rpcErr) });
    }
  } catch (err) {
    console.error("reserveCredits error:", err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
