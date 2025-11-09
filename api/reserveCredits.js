// src/api/reserveCredits.js
// Patched: improved validation, defensive logging, normalized responses.

import { createSupabaseServerClient } from "../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Defensive: log body so we can inspect runtime requests in server logs
    console.log("reserveCredits request body:", req.body);

    const { userId, amount, idempotencyKey } = req.body || {};

    // Validate presence and basic types
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Missing or invalid userId (string required)" });
    }
    if (typeof amount === "undefined" || amount === null) {
      return res.status(400).json({ error: "Missing amount" });
    }

    // coerce numeric amount and validate
    const amt = Number(amount);
    if (!Number.isFinite(amt) || Number.isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error: "Invalid amount (must be a positive number)" });
    }

    if (!idempotencyKey || typeof idempotencyKey !== "string") {
      return res.status(400).json({ error: "Missing or invalid idempotencyKey (string required)" });
    }

    const supabaseAdmin = createSupabaseServerClient();

    // Run RPC with defensive try/catch and timeouts handled by platform
    try {
      const { data, error } = await supabaseAdmin.rpc("reserve_credits_transaction", {
        _user_id: userId,
        _amount: amt,
        _idempotency_key: idempotencyKey,
      });

      if (error) {
        // Log full error object for debugging in server logs
        console.error("reserve_credits_transaction error:", error);

        // Normalize common RPC error shapes to a friendly message
        const message = (error && (error.message || error.msg || JSON.stringify(error))) || "reserve RPC failed";
        return res.status(500).json({ error: message });
      }

      // Some RPCs return arrays, some return single object. Normalize to reservation object.
      const reservation = Array.isArray(data) ? data[0] ?? null : data ?? null;

      if (!reservation) {
        console.warn("reserve_credits_transaction returned no reservation:", data);
        // return success:false so client can handle gracefully
        return res.status(502).json({ error: "RPC returned empty result", data });
      }

      return res.status(200).json({ success: true, reservation });
    } catch (rpcErr) {
      // Catch unexpected RPC/runtime exceptions
      console.error("reserveCredits RPC thrown error:", rpcErr);
      return res.status(500).json({ error: rpcErr?.message || String(rpcErr) });
    }
  } catch (err) {
    console.error("reserveCredits handler error:", err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
