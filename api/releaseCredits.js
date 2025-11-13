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
    const { reservationId } = req.body || {};
    if (!reservationId) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { message: "Missing required field: reservationId", code: "missing_fields" },
      });
    }

    const supabaseAdmin = createSupabaseServerClient();

    const { data, error } = await supabaseAdmin.rpc("release_reserved_credits", {
      _reservation_id: reservationId,
    });

    if (error) {
      console.error("releaseCredits RPC error:", error);
      return res.status(500).json({
        success: false,
        data: null,
        error: makeErrorPayload(error),
      });
    }

    const result = convertBigInt(data ?? null);

    return res.status(200).json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("releaseCredits error:", err);
    return res.status(500).json({ success: false, data: null, error: makeErrorPayload(err) });
  }
}
