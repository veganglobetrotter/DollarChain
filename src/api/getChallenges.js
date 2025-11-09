// api/getChallenges.js
import { createSupabaseServerClient, getUserFromBearer } from "../src/lib/supabaseServer.js";
import { TEMPLATES } from "../src/lib/challengeTemplates.js";

/**
 * Root-level getChallenges for Vercel (/api/getChallenges).
 * Defensive: returns helpful 500 message if server config missing.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // defensive: createSupabaseServerClient may throw if envs are missing
    let supabase;
    try {
      supabase = createSupabaseServerClient();
    } catch (e) {
      console.error("getChallenges: createSupabaseServerClient failed:", e?.message || e);
      return res.status(500).json({ ok: false, error: "server-missing-config" });
    }

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

    // try header -> query -> cookies
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
        if (["sb-access-token", "access_token", "supabase-auth-token", "sb:token"].includes(k)) {
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
      return res.status(200).json({ ok: true, challenges: publicChallenges, custom: [], user: null });
    }

    const { data: custom, error: customErr } = await supabase
      .from("custom_challenges")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (customErr) console.error("getChallenges: custom fetch error", customErr);

    const { data: creditsData, error: creditsErr } = await supabase
      .from("user_credits")
      .select("credits, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (creditsErr) console.error("getChallenges: credits fetch error", creditsErr);

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
