// api/admin/settings.js
import { createSupabaseServerClient, requireSuperAdmin } from "../lib/supabaseServer.js";

export default async function handler(req, res) {
  const supabase = createSupabaseServerClient();

  if (req.method === "GET") {
    // public read of settings (non-sensitive)
    const { data, error } = await supabase.from("system_settings").select("key, value").maybeSingle();
    // safer: return map of all keys
    const { data: rows, error: errRows } = await supabase.from("system_settings").select("key, value");
    if (errRows) return res.status(500).json({ error: errRows.message || errRows });
    const out = {};
    (rows || []).forEach((r) => { out[r.key] = r.value; });
    return res.status(200).json({ settings: out });
  }

  if (req.method === "POST") {
    try {
      const auth = req.headers?.authorization;
      await requireSuperAdmin(auth, res);

      const { key, value } = req.body || {};
      if (!key) return res.status(400).json({ error: "missing_key" });

      // Upsert the setting (value saved as JSONB)
      const { data, error } = await supabase
        .from("system_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() })
        .select()
        .maybeSingle();

      if (error) {
        console.error("admin/settings upsert error:", error);
        return res.status(500).json({ error: error.message || error });
      }

      return res.status(200).json({ setting: data });
    } catch (err) {
      if (!res.headersSent) res.status(500).json({ error: err.message || "internal_error" });
    }
  }

  return res.status(405).json({ error: "method_not_allowed" });
}
