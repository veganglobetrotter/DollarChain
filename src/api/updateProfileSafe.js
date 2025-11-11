// src/api/updateProfileSafe.js
// POST handler: { userId, full_name?, phone?, metadata? }
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars for updateProfileSafe");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const userId = body.userId || (req.headers["x-user-id"] || null); // convenience
    const full_name = typeof body.full_name !== "undefined" ? body.full_name : undefined;
    const phone = typeof body.phone !== "undefined" ? body.phone : undefined;
    const metadata = typeof body.metadata === "object" ? body.metadata : undefined;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // If metadata contains sellerName, check for existing conflicting store/shop name (case-insensitive)
    const requestedName = metadata && metadata.sellerName ? String(metadata.sellerName).trim() : null;
    if (requestedName) {
      // quick check: are there other profiles with same sellerName (case-insensitive)?
      const { data: conflictData, error: conflictErr } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("metadata->>sellerName", requestedName)
        .limit(1);

      if (conflictErr) {
        console.warn("Conflict check query error:", conflictErr);
        // proceed — we'll still rely on DB index for final enforcement
      } else if (conflictData && conflictData.length > 0) {
        const existingId = conflictData[0].id;
        if (existingId !== userId) {
          return res.status(409).json({ error: "Store/Shop name already taken", conflictWith: existingId });
        }
      }
    }

    // Build upsert payload — include id so upsert updates the correct row
    const payload = { id: userId };
    if (typeof full_name !== "undefined") payload.full_name = full_name;
    if (typeof phone !== "undefined") payload.phone = phone;
    if (typeof metadata !== "undefined") payload.metadata = metadata;

    // Upsert into profiles table
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .upsert(payload, { returning: "representation" })
      .select()
      .maybeSingle();

    if (error) {
      // If DB enforces uniqueness, Postgres will return error code 23505 (unique_violation).
      // Supabase surfaces it in error.message — we'll inspect and map to 409 where applicable.
      const msg = (error && (error.message || JSON.stringify(error))) || "Unknown error";
      if (String(msg).includes("unique") || (error.details && String(error.details).includes("uq_profiles_seller_name_lower"))) {
        return res.status(409).json({ error: "Store/Shop name already taken (unique constraint)" });
      }
      console.error("updateProfileSafe upsert error:", error);
      return res.status(500).json({ error: msg });
    }

    return res.status(200).json({ data });
  } catch (err) {
    console.error("updateProfileSafe unexpected error:", err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
