// src/api/consumeCredits.js
import { createSupabaseServerClient } from "../src/lib/supabaseServer.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { reservationId } = req.body || {};
    if (!reservationId) {
      return res.status(400).json({ error: "Missing required field: reservationId" });
    }

    const supabaseAdmin = createSupabaseServerClient();

    const { data, error } = await supabaseAdmin.rpc("consume_reserved_credits", {
      _reservation_id: reservationId,
    });

    if (error) {
      console.error("consumeCredits RPC error:", error);
      return res.status(500).json({ error: error.message || "consume RPC failed", details: error });
    }

    const result = data ?? null;

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("consumeCredits error:", err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
