// src/api/getChallenges.js
import { createSupabaseServerClient, getUserFromBearer } from "../lib/supabaseServer.js";
import { TEMPLATES } from "../lib/challengeTemplates.js";

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

    // If Authorization header present, try to get user-specific data
    const authHeader = (req.headers.authorization || "").replace("Bearer ", "").trim();
    if (!authHeader) {
      return res.status(200).json({ ok: true, challenges: publicChallenges, custom: [], user: null });
    }

    const user = await getUserFromBearer(authHeader);
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
