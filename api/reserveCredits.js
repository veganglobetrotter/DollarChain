// src/api/reserveCredits.js
import { createSupabaseServerClient } from "../src/lib/supabaseServer.js";

// Recursively convert BigInt values to string
function convertBigInt(obj) {
  if (Array.isArray(obj)) return obj.map(convertBigInt);
  if (obj && typeof obj === "object") {
    const res = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "bigint") {
        res[k] = v.toString();
      } else {
        res[k] = convertBigInt(v);
      }
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
    const { userId, amount, idempotencyKey } = req.body || {};
    if (!userId || typeof amount === "undefined" || !idempotencyKey) {
      return res
        .status(400)
        .json({ error: "Missing required fields: userId, amount, idempotencyKey" });
    }

    const supabaseAdmin = createSupabaseServerClient();

    // Call RPC with BigInt
    const { data, error } = await supabaseAdmin.rpc("reserve_credits_transaction_v2", {
      _user_id: userId,
      _amount: BigInt(amount),
      _idempotency_key: idempotencyKey,
    });

    // Log raw RPC response for debugging
    console.log("reserveCredits raw RPC data:", data, "error:", error);

    if (error) {
      console.error("reserveCredits RPC error:", error);
      return res
        .status(500)
        .json({ error: error.message || "reserve RPC failed", details: error });
    }

    // Convert all BigInt in the data before returning
    const reservation = convertBigInt(data ?? null);

    // Log sanitized reservation
    console.log("reserveCredits sanitized reservation:", reservation);

    return res.status(200).json({ success: true, reservation });
  } catch (err) {
    console.error("reserveCredits error:", err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
