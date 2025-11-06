// src/lib/supabaseServer.js
import { createClient } from "@supabase/supabase-js";

export function createSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server environment.");
  }

  // service_role key gives us rights to bypass RLS on server — use carefully
  return createClient(url, key);
}

/**
 * Attempt to resolve user from an Authorization Bearer token (access token).
 * Returns { id, email, user } or null when token invalid.
 */
export async function getUserFromBearer(token) {
  if (!token) return null;
  try {
    // create a client (service role) - we only need auth API to decode token
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch (e) {
    console.error("getUserFromBearer error:", e);
    return null;
  }
}
