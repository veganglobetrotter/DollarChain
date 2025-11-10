// api/consumeCredits.js
import { createSupabaseServerClient } from "../src/lib/supabaseServer.js";

// Recursively convert BigInt values to strings
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

    if (!userId || !reservationId || typeof delta === "undefined" || delta === null || !type) {
      return res.status(400).json({
        error: "Missing required fields: userId, reservationId, delta, type (reference optional)",
      });
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = createSupabaseServerClient();
    } catch (err) {
      console.error("consumeCredits: failed to create supabase server client", err);
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Coerce delta to a plain Number (avoid BigInt to prevent JSON serialization errors)
    let deltaArg;
    try {
      if (typeof delta === "number") deltaArg = Math.trunc(delta);
      else if (typeof delta === "string" && /^\d+$/.test(delta)) deltaArg = Number(delta);
      else deltaArg = Math.trunc(Number(delta));
      if (!Number.isFinite(deltaArg) || deltaArg < 0) throw new Error("invalid delta");
    } catch (err) {
      console.warn("consumeCredits: delta coercion failed:", err);
      return res.status(400).json({ error: "Invalid delta value" });
    }

    try {
      // Pass plain Number for _delta to avoid BigInt serialization issues
      const { data, error } = await supabaseAdmin.rpc("consume_reserved_credits", {
        _user_id: userId,
        _reservation_id: reservationId,
        _delta: deltaArg,
        _type: type,
        _reference: reference ?? null,
      });

      console.log("consumeCredits raw RPC:", { data, error });

      if (error) {
        console.error("consume_reserved_credits RPC error:", error);
        return res.status(500).json({ error: error.message || "consume RPC failed", details: error });
      }

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
