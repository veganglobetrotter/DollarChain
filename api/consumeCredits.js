// src/api/consumeCredits.js
import { createSupabaseServerClient } from "../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, reservationId, delta, type, reference } = req.body || {};

    if (!userId || !reservationId || typeof delta === "undefined" || !type) {
      return res.status(400).json({ error: "Missing required fields: userId, reservationId, delta, type" });
    }

    const supabaseAdmin = createSupabaseServerClient();

    const { data, error } = await supabaseAdmin.rpc("consume_reserved_credits", {
      _user_id: userId,
      _reservation_id: reservationId,
      _delta: delta,
      _type: type,
      _reference: reference ?? null,
    });

    if (error) {
      console.error("consume_reserved_credits error:", error);
      return res.status(500).json({ error: error.message || "consume RPC failed" });
    }

    return res.status(200).json({ success: true, transaction: data });
  } catch (err) {
    console.error("consumeCredits error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
