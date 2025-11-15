// api/admin/settings.js
import { createSupabaseServerClient, requireSuperAdmin } from "../lib/supabaseServer.js";

export default async function handler(req, res) {
  const supabase = createSupabaseServerClient();

  if (req.method === "GET") {
    try {
      // safer: return map of all keys n
      const { data: rows, error } = await supabase
        .from("system_settings")
        .select("key, value");

      if (error) {
        console.error("admin/settings read error:", error);
        return res.status(500).json({ error: error.message || error });
      }

      const settings = {};
      (rows || []).forEach((r) => {
        settings[r.key] = r.value;
      });

      return res.status(200).json({ settings });
    } catch (err) {
      console.error("admin/settings GET handler error:", err);
      return res.status(500).json({ error: err.message || "internal_error" });
    }
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
      if (!res.headersSent) {
        console.error("admin/settings POST handler error:", err);
        res.status(500).json({ error: err.message || "internal_error" });
      }
    }
  } else {
    return res.status(405).json({ error: "method_not_allowed" });
  }
}
