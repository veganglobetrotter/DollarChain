// src/api/getChallenges.js
import { createSupabaseServerClient, getUserFromBearer } from "../lib/supabaseServer.js";
import { TEMPLATES } from "../lib/challengeTemplates.js";

/**
 * getChallenges
 * - Returns public challenges always.
 * - If an access token is provided (Authorization header, cookie, or ?accessToken=),
 *   attempts to resolve the user and return custom challenges & user meta.
 *
 * Defensive: this version returns informative 500s when server config is missing
 * or when the server-side supabase client fails to initialize.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // defensive - ensure server-side supabase can be created
  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (err) {
    console.error("getChallenges: createSupabaseServerClient failed:", err?.message || err);
    // Clear, actionable error so you can check Vercel envs
    return res.status(500).json({ ok: false, error: "server-missing-config", message: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing or invalid on server." });
  }

  try {
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
      cookieHeader.split(";").forEach((pair) => {
        const [rawK, ...rawV] = pair.split("=");
        if (!rawK) return;
        const k = rawK.trim();
        const v = rawV.join("=").trim();
        if (!v) return;
        // check several common keys where access token might be stored
        if (["sb-access-token", "access_token", "supabase-auth-token", "sb:token"].includes(k)) {
          cookieToken = v;
        }
      });
    }

    const authToken = authHeader || queryToken || cookieToken;

    // no token -> public response
    if (!authToken) {
      return res.status(200).json({ ok: true, challenges: publicChallenges, custom: [], user: null });
    }

    // decode token -> user; defend against getUserFromBearer throwing
    let user;
    try {
      user = await getUserFromBearer(authToken);
    } catch (err) {
      console.error("getChallenges: getUserFromBearer threw:", err);
      // treat as invalid token
      return res.status(200).json({ ok: true, challenges: publicChallenges, custom: [], user: null });
    }

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
