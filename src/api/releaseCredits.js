// src/api/releaseCredits.js
import { createSupabaseServerClient } from "../lib/supabaseServer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, reservationId } = req.body || {};

    if (!userId || !reservationId) {
      return res.status(400).json({ error: "Missing required fields: userId, reservationId" });
    }

    const supabaseAdmin = createSupabaseServerClient();

    const { data, error } = await supabaseAdmin.rpc("release_reserved_credits", {
      _user_id: userId,
      _reservation_id: reservationId,
    });

    if (error) {
      console.error("release_reserved_credits error:", error);
      return res.status(500).json({ error: error.message || "release RPC failed" });
    }

    return res.status(200).json({ success: true, reservation: data });
  } catch (err) {
    console.error("releaseCredits error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
