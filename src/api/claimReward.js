// src/api/claimReward.js
import { createSupabaseServerClient, getUserFromBearer } from "../lib/supabaseServer.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // require Authorization: Bearer <jwt>
    const authHeader = (req.headers.authorization || "").replace("Bearer ", "").trim();
    if (!authHeader) return res.status(401).json({ ok: false, error: "Missing Authorization" });

    // resolve user from bearer token (helper you've already wired)
    const user = await getUserFromBearer(authHeader);
    if (!user) return res.status(401).json({ ok: false, error: "Invalid token" });

    const body = req.body || {};
    const { challengeId } = body;
    if (!challengeId) return res.status(400).json({ ok: false, error: "challengeId required" });

    // create server supabase client (should use service_role key internally)
    const supabase = createSupabaseServerClient();

    // Call RPC (atomic server-side). The RPC must be installed in your DB.
    // RPC signature: claim_reward(p_user_id UUID, p_challenge_id UUID) -> TABLE(new_balance BIGINT, awarded_xp BIGINT)
    const { data, error } = await supabase.rpc("claim_reward", {
      p_user_id: user.id,
      p_challenge_id: challengeId,
    });

    if (error) {
      // Map common server exceptions raised by the PL/pgSQL function to sensible HTTP codes
      const msg = String(error.message || error);
      console.error("claimReward rpc error:", error);

      if (msg.includes("challenge_not_found")) {
        return res.status(404).json({ ok: false, error: "challenge_not_found" });
      }
      if (msg.includes("not_owner")) {
        return res.status(403).json({ ok: false, error: "not_owner" });
      }
      if (msg.includes("not_complete")) {
        return res.status(409).json({ ok: false, error: "not_complete" });
      }
      if (msg.includes("already_claimed")) {
        return res.status(409).json({ ok: false, error: "already_claimed" });
      }

      // Fallback: return RPC message as bad request so caller can surface it
      return res.status(400).json({ ok: false, error: msg || "Claim failed" });
    }

    // RPC typically returns an array of rows for TABLE(...) results
    const result = Array.isArray(data) ? data[0] : data;

    // normalize returned fields (some variants may return new_balance / awarded_xp or balance / xp)
    const balance = result?.new_balance ?? result?.balance ?? result?.new_balance?.toString?.() ?? null;
    const xp_awarded = result?.awarded_xp ?? result?.xp ?? result?.awarded_xp?.toString?.() ?? null;

    return res.status(200).json({ ok: true, balance, xp_awarded, raw: result });
  } catch (e) {
    console.error("claimReward error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
