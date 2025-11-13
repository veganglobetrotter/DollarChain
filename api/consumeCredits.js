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

function makeErrorPayload(err) {
  return {
    message: err?.message || String(err),
    code: err?.code || null,
    details: err?.details ?? err ?? null,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res
      .status(405)
      .json({ success: false, data: null, error: { message: "Method not allowed", code: "method_not_allowed" } });
  }

  try {
    const { userId, reservationId, delta, type, reference } = req.body || {};

    // Basic validation
    if (!userId || !reservationId || typeof delta === "undefined" || delta === null) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { message: "Missing required fields: userId, reservationId, delta", code: "missing_fields" },
      });
    }

    // Ensure delta is a safe number (don't pass JS BigInt to supabase-js)
    const deltaNum = Number(delta);
    if (!Number.isFinite(deltaNum) || !Number.isInteger(deltaNum)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { message: "delta must be an integer number", code: "invalid_delta" },
      });
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
      return res.status(500).json({
        success: false,
        data: null,
        error: makeErrorPayload(error),
      });
    }

    // Normalize any BigInt in the RPC response
    const result = convertBigInt(data ?? null);

    return res.status(200).json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("consumeCredits error:", err);
    return res.status(500).json({ success: false, data: null, error: makeErrorPayload(err) });
  }
}
