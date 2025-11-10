// api/consumeCredits.js
import { createSupabaseServerClient } from "../src/lib/supabaseServer.js";

// Recursively convert BigInt values to strings (same helper used for reserveCredits)
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

    // validate inputs
    if (!userId || !reservationId || typeof delta === "undefined" || delta === null || !type) {
      return res.status(400).json({
        error:
          "Missing required fields: userId, reservationId, delta, type (reference optional)",
      });
    }

    // create server supabase client (service role)
    let supabaseAdmin;
    try {
      supabaseAdmin = createSupabaseServerClient();
    } catch (err) {
      console.error("consumeCredits: failed to create supabase server client", err);
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Ensure delta is numeric (use BigInt for rpc if RPC expects bigint)
    let deltaArg;
    try {
      // Accept numeric or string numeric -> convert
      if (typeof delta === "bigint") deltaArg = delta;
      else if (typeof delta === "number") deltaArg = BigInt(Math.trunc(delta));
      else if (typeof delta === "string" && delta.match(/^\d+$/)) deltaArg = BigInt(delta);
      else deltaArg = BigInt(Number(delta));
    } catch (err) {
      console.warn("consumeCredits: delta coercion failed:", err);
      return res.status(400).json({ error: "Invalid delta value" });
    }

    // Call the RPC with all expected parameters (names must match DB function signature)
    try {
      const { data, error } = await supabaseAdmin.rpc("consume_reserved_credits", {
        _user_id: userId,
        _reservation_id: reservationId,
        _delta: deltaArg,
        _type: type,
        _reference: reference ?? null,
      });

      console.log("consumeCredits raw RPC:", { data, error });

      if (error) {
        // Return structured RPC error if present
        console.error("consume_reserved_credits RPC error:", error);
        return res
          .status(500)
          .json({ error: error.message || "consume RPC failed", details: error });
      }

      // Normalize response shape (some RPCs return array or single row)
      const resultRaw = Array.isArray(data) ? data[0] ?? null : data ?? null;
      const result = convertBigInt(resultRaw);

      console.log("consumeCredits sanitized result:", result);
      return res.status(200).json({ success: true, result });
    } catch (rpcErr) {
      console.error("consumeCredits RPC failure:", rpcErr);
      return res.status(500).json({ error: "consume RPC failed", details: String(rpcErr) });
    }
  } catch (err) {
    console.error("consumeCredits error:", err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
