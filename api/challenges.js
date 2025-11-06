// api/challenges.js
import { createClient } from "@supabase/supabase-js";

/**
 * Simple serverless API for Goals & Rewards (Step I)
 * - GET:  returns { challenges, custom, user }
 * - POST(action=create): create custom challenge (auth required)
 * - POST(action=claim): claim a user's custom challenge (auth required)
 *
 * Expects:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * Authentication:
 * - Supply "Authorization: Bearer <access_token>" to identify user for create/claim.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — API will fail if used without env vars.");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Local fallback (keeps API resilient if DB tables are not present yet)
const FALLBACK_CHALLENGES = [
  { id: "first_invoice", title: "First Invoice", description: "Create your first invoice by pasting a WhatsApp message and confirming.", progress: 1, target: 1, xp: 20, credits: 5, status: "completed" },
  { id: "confirm_clean", title: "Confirm & Clean", description: "Edit at least one parsed field or press Confirm after parsing.", progress: 0, target: 1, xp: 15, credits: 3, status: "in_progress" },
  { id: "weekly_hustle", title: "Weekly Hustle", description: "Create 5 invoices in any rolling 7-day window.", progress: 2, target: 5, xp: 30, credits: 10, status: "in_progress" },
];

// Server-side template map (authoritative rewards mapping)
const TPL_MAP = {
  micro: { xp: 5, credits: 2 },
  standard: { xp: 15, credits: 5 },
  stretch: { xp: 35, credits: 15 },
};

export default async function handler(req, res) {
  try {
    const method = req.method?.toUpperCase();

    // Helper: get user from Bearer token (returns user object or null)
    const getUserFromBearer = async () => {
      const authHeader = req.headers?.authorization || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
      if (!token) return null;

      // supabaseAdmin.auth.getUser accepts an access_token param
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data?.user) return null;
      return data.user;
    };

    if (method === "GET") {
      const user = await getUserFromBearer();

      // Try to fetch canonical "challenges" table; fallback to static list if table missing
      let challenges = null;
      try {
        const { data, error } = await supabaseAdmin.from("challenges").select("*").order("created_at", { ascending: true }).limit(100);
        if (!error && Array.isArray(data)) challenges = data;
      } catch (e) {
        // ignore — we'll use fallback
      }

      // If authenticated, try fetching the user's custom challenges from user_challenges
      let custom = [];
      if (user) {
        try {
          const { data, error } = await supabaseAdmin.from("user_challenges").select("*").eq("user_id", user.id).order("start_at", { ascending: false }).limit(100);
          if (!error && Array.isArray(data)) custom = data;
        } catch (e) {
          // ignore — custom stays []
        }
      }

      return res.status(200).json({
        challenges: challenges ?? FALLBACK_CHALLENGES,
        custom,
        user: user ? { id: user.id, email: user.email } : null,
      });
    }

    if (method === "POST") {
      const body = req.body || (await new Promise((r) => {
        // when deployed on some platforms, req.body may not be parsed — defensively parse
        let data = "";
        req.on("data", (chunk) => (data += chunk));
        req.on("end", () => r(data ? JSON.parse(data) : {}));
      }));

      const action = (body.action || "create").toString();

      // All mutations require auth
      const user = await getUserFromBearer();
      if (!user) return res.status(401).json({ error: "authentication required" });

      if (action === "create") {
        const { title, templateId, target } = body;
        if (!title || !templateId) return res.status(400).json({ error: "missing fields: title and templateId required" });

        const tpl = TPL_MAP[templateId] ?? TPL_MAP.standard;
        const record = {
          user_id: user.id,
          title: title.toString().slice(0, 200),
          template_id: templateId,
          target: Number(target) || tpl.suggestedTarget || 3,
          xp: tpl.xp,
          credits: tpl.credits,
          progress: 0,
          status: "in_progress",
          start_at: new Date().toISOString(),
        };

        // Insert into user_challenges; if table missing, return a fallback object instead of crashing
        try {
          const { data, error } = await supabaseAdmin.from("user_challenges").insert([record]).select().maybeSingle();
          if (error) throw error;
          return res.status(201).json({ custom: data });
        } catch (err) {
          // Table might not exist yet — return created mock object for local development
          const mock = { id: `mock-${Date.now()}`, ...record };
          return res.status(201).json({ custom: mock, warning: "DB insert failed; returning mock (make sure user_challenges table exists)." });
        }
      } else if (action === "claim") {
        const { challengeId } = body;
        if (!challengeId) return res.status(400).json({ error: "missing challengeId" });

        // Fetch challenge and verify ownership
        const { data: ch, error: chErr } = await supabaseAdmin.from("user_challenges").select("*").eq("id", challengeId).maybeSingle();
        if (chErr) return res.status(500).json({ error: chErr.message });
        if (!ch) return res.status(404).json({ error: "challenge not found" });
        if (ch.user_id !== user.id) return res.status(403).json({ error: "forbidden" });

        if ((ch.progress || 0) < (ch.target || 1)) {
          return res.status(400).json({ error: "challenge not complete" });
        }
        if (ch.status === "claimed") {
          return res.status(400).json({ error: "already claimed" });
        }

        // Mark claimed and insert a user_credits entry
        try {
          const { data: updated, error: updErr } = await supabaseAdmin.from("user_challenges").update({ status: "claimed" }).eq("id", challengeId).select().maybeSingle();
          if (updErr) throw updErr;

          const creditRecord = {
            user_id: user.id,
            amount: ch.credits || 0,
            reason: `Claim: ${ch.title}`,
            created_at: new Date().toISOString(),
          };
          const { data: creditData, error: creditErr } = await supabaseAdmin.from("user_credits").insert([creditRecord]).select().maybeSingle();
          if (creditErr) throw creditErr;

          return res.status(200).json({ claimed: true, credits: creditData });
        } catch (err) {
          // Attempt minimal recovery: if mark-as-claimed succeeded but credits insert failed,
          // you could roll back — for now return error and include details.
          return res.status(500).json({ error: err.message || "claim failed" });
        }
      } else {
        return res.status(400).json({ error: "unknown action" });
      }
    }

    res.setHeader("Allow", "GET,POST");
    return res.status(405).end("Method Not Allowed");
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: err?.message || "server error" });
  }
}
