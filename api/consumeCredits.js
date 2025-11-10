// api/consumeCredits.js
import { createSupabaseServerClient } from "../src/lib/supabaseServer.js";

// Convert BigInt values (from DB) to strings so JSON.stringify won't fail
function convertBigInt(obj) {
  if (Array.isArray(obj)) return obj.map(convertBigInt);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "bigint") out[k] = v.toString();
      else out[k] = convertBigInt(v);
    }
    return out;
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

    if (!userId || !reservationId || typeof delta === "undefined") {
      return res.status(400).json({ error: "Missing required fields: userId, reservationId, delta" });
    }

    const supabaseAdmin = createSupabaseServerClient();

    // Ensure delta is a plain Number (avoid BigInt input serialization issues)
    const deltaNum = Number(delta);
    if (!Number.isFinite(deltaNum) || deltaNum < 0) {
      return res.status(400).json({ error: "Invalid delta value" });
    }

    const { data, error } = await supabaseAdmin.rpc("consume_reserved_credits", {
      _user_id: userId,
      _reservation_id: reservationId,
      _delta: deltaNum,
      _type: type ?? "invoice",
      _reference: reference ?? null,
    });

    console.log("consumeReserved raw RPC data:", data, "error:", error);

    if (error) {
      console.error("consumeCredits RPC error:", error);
      return res.status(500).json({ error: error.message || "consume RPC failed", details: error });
    }

    // Normalize/convert any BigInt in result before returning
    const result = convertBigInt(data ?? null);

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("consumeCredits error:", err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
