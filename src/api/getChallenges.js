// src/api/getChallenges.js
import { createSupabaseServerClient, getUserFromBearer } from "../lib/supabaseServer.js";
import { TEMPLATES } from "../lib/challengeTemplates.js";

/**
 * getChallenges
 * - Returns public challenges always.
 * - If an access token is provided (Authorization header, cookie, or ?accessToken=),
 *   attempts to resolve the user and return custom challenges & user meta.
 *
 * Small improvement: accept token via Authorization header OR cookies OR query string
 * so clients that set tokens in cookies (or pass as query) will work reliably.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const supabase = createSupabaseServerClient();

    // Build public challenges array from templates (server-side canonical representation)
    const publicChallenges = Object.values(TEMPLATES).map((t) => ({
      id: `tpl-${t.id}`,
      templateId: t.id,
      title: t.name,
      description: t.desc,
      xp: t.xp,
      credits: t.credits,
      suggestedTarget: t.suggestedTarget,
      public: true,
    }));

    // Attempt to locate an access token from multiple common locations:
    // 1) Authorization header (Bearer ...)
    // 2) query param ?accessToken=...
    // 3) common cookie names (sb-access-token, access_token, supabase-auth-token)
    const authHeader = (req.headers.authorization || "").replace("Bearer ", "").trim();
    const queryToken = (req.query && req.query.accessToken) ? String(req.query.accessToken).trim() : "";
    let cookieToken = "";

    const cookieHeader = req.headers?.cookie || "";
    if (cookieHeader) {
      // parse simple cookie header (k=v; k2=v2)
      cookieHeader.split(";").forEach((pair) => {
        const [rawK, ...rawV] = pair.split("=");
        if (!rawK) return;
        const k = rawK.trim();
        const v = rawV.join("=").trim();
        if (!v) return;
        // check several common keys where access token might be stored
        if (k === "sb-access-token" || k === "access_token" || k === "supabase-auth-token" || k === "sb:token") {
          cookieToken = v;
        }
      });
    }

    const authToken = authHeader || queryToken || cookieToken;

    if (!authToken) {
      return res.status(200).json({ ok: true, challenges: publicChallenges, custom: [], user: null });
    }

    const user = await getUserFromBearer(authToken);
    if (!user) {
      // invalid token — return public only
      return res.status(200).json({ ok: true, challenges: publicChallenges, custom: [], user: null });
    }

    // Fetch custom challenges for this user
    const { data: custom, error: customErr } = await supabase
      .from("custom_challenges")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (customErr) {
      console.error("getChallenges: custom fetch error", customErr);
    }

    // Fetch user credits (your table uses `credits` column)
    const { data: creditsData, error: creditsErr } = await supabase
      .from("user_credits")
      .select("credits, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (creditsErr) {
      console.error("getChallenges: credits fetch error", creditsErr);
    }

    // Compute total XP by summing user_claims.xp_awarded (history is authoritative)
    let totalXp = 0;
    try {
      const { data: claims, error: claimsErr } = await supabase
        .from("user_claims")
        .select("xp_awarded")
        .eq("user_id", user.id);

      if (!claimsErr && Array.isArray(claims)) {
        totalXp = claims.reduce((s, r) => s + (Number(r?.xp_awarded || 0)), 0);
      } else if (claimsErr) {
        console.error("getChallenges: user_claims fetch error", claimsErr);
      }
    } catch (e) {
      // unexpected — just leave totalXp as 0
      console.warn("getChallenges: user_claims aggregate failed", e);
    }

    const userMeta = {
      id: user.id,
      email: user.email,
      credits: creditsData?.credits ?? 0,
      xp: totalXp,
    };

    return res.status(200).json({ ok: true, challenges: publicChallenges, custom: custom || [], user: userMeta });
  } catch (e) {
    console.error("getChallenges error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
