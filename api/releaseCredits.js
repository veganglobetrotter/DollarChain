// api/releaseCredits.js
import { createSupabaseServerClient } from "../src/lib/supabaseServer.js";

const RPC_CANDIDATES = [
  "release_reserved_credits",
  "release_credits",
  "release_credits_transaction",
  "dc_release_reserved_credits"
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { userId, reservationId } = req.body || {};
    if (!userId || !reservationId) {
      return res.status(400).json({ ok: false, error: "Missing required fields: userId, reservationId" });
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = createSupabaseServerClient();
    } catch (err) {
      console.error("releaseCredits: createSupabaseServerClient failed", err);
      return res.status(500).json({ ok: false, error: "Server configuration error" });
    }

    let lastErr = null;
    for (const rpcName of RPC_CANDIDATES) {
      try {
        const { data, error } = await supabaseAdmin.rpc(rpcName, {
          _user_id: userId,
          _reservation_id: reservationId
        });

        if (error) {
          lastErr = { rpc: rpcName, error };
          console.warn("releaseCredits: rpc error", rpcName, error);
          continue;
        }

        const reservation = Array.isArray(data) ? data[0] ?? null : data ?? null;
        return res.status(200).json({ ok: true, reservation, rpc: rpcName });
      } catch (rpcCallErr) {
        lastErr = { rpc: rpcName, error: rpcCallErr };
        console.warn("releaseCredits: rpc call failed", rpcName, rpcCallErr);
        continue;
      }
    }

    console.error("releaseCredits: all RPC candidates failed", lastErr);
    return res.status(500).json({ ok: false, error: "All release RPCs failed", details: lastErr });
  } catch (err) {
    console.error("releaseCredits unexpected error:", err);
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}
