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

    // Fetch custom challenges and user balances for this user
    // NOTE: adapt table/column names to your DB schema
    const { data: custom, error: customErr } = await supabase
      .from("custom_challenges")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (customErr) {
      console.error("getChallenges: custom fetch error", customErr);
    }

    // Fetch user credits/xp if you have a user_credits or user_profiles table
    const { data: creditsData, error: creditsErr } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (creditsErr) {
      console.error("getChallenges: credits fetch error", creditsErr);
    }

    const userMeta = {
      id: user.id,
      email: user.email,
      balance: creditsData?.balance ?? 0,
      // xp may be stored in a separate table (adjust as needed)
    };

    return res.status(200).json({ ok: true, challenges: publicChallenges, custom: custom || [], user: userMeta });
  } catch (e) {
    console.error("getChallenges error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
