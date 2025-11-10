// api/consumeCredits.js
import { createSupabaseServerClient } from "../src/lib/supabaseServer.js";

/**
 * Helper - recursively convert BigInt -> string so JSON.stringify doesn't throw.
 */
function convertBigInt(obj) {
  if (Array.isArray(obj)) return obj.map(convertBigInt);
  if (obj && typeof obj === "object") {
    const res = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "bigint") res[k] = v.toString();
      else res[k] = convertBigInt(v);
    }
    return res;
  }
  return obj;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, reservationId, delta, type, reference } = req.body || {};

    // Basic validation
    if (!userId || !reservationId || typeof delta === "undefined" || delta === null) {
      return res.status(400).json({ error: "Missing required fields: userId, reservationId, delta" });
    }

    // Ensure delta is a safe number (don't pass JS BigInt to supabase-js)
    const deltaNum = Number(delta);
    if (!Number.isFinite(deltaNum) || !Number.isInteger(deltaNum)) {
      return res.status(400).json({ error: "delta must be an integer number" });
    }

    const supabaseAdmin = createSupabaseServerClient();

    // Call RPC with the full signature expected by the DB
    const { data, error } = await supabaseAdmin.rpc("consume_reserved_credits", {
      _user_id: userId,
      _reservation_id: reservationId,
      _delta: deltaNum, // pass as number (not BigInt)
      _type: type ?? null,
      _reference: reference ?? null,
    });

    if (error) {
      console.error("consume_reserved_credits RPC error:", error);
      // return structured server-side error if available
      return res.status(500).json({
        error: error.message || "consume RPC failed",
        details: error,
      });
    }

    // Normalize any BigInt in the RPC response
    const result = convertBigInt(data ?? null);

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("consumeCredits error:", err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
