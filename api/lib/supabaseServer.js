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
 * Returns the supabase user object or null when token invalid.
 *
 * Note: this uses the service role client to call the Auth API to decode the token.
 */
export async function getUserFromBearer(token) {
  if (!token) return null;
  try {
    // create a client (service role) - we only need auth API to decode token
    const supabase = createSupabaseServerClient();
    // supabase.auth.getUser expects an access token string
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch (e) {
    console.error("getUserFromBearer error:", e);
    return null;
  }
}

/**
 * Require that the incoming request (or a raw token string) belongs to a super-admin.
 *
 * Usage:
 *   // from a serverless handler: await requireSuperAdmin(req, res);
 *   // or with a raw token string: await requireSuperAdmin(token);
 *
 * Behaviour:
 * - If token missing/invalid -> responds with 401 (if res provided) and throws.
 * - If user is not super admin -> responds with 403 (if res provided) and throws.
 * - On success returns the decoded auth user object (from getUserFromBearer).
 */
export async function requireSuperAdmin(reqOrToken, res) {
  // Extract token:
  // - If reqOrToken is a string that starts with "Bearer ", strip it
  // - If it's a request-like object with headers.authorization, read that header
  // - If it's already a raw token, use it as-is
  let token = null;

  if (!reqOrToken) {
    token = null;
  } else if (typeof reqOrToken === "string") {
    token = reqOrToken.startsWith("Bearer ") ? reqOrToken.slice("Bearer ".length) : reqOrToken;
  } else if (typeof reqOrToken === "object" && reqOrToken.headers) {
    const authHeader = reqOrToken.headers.authorization || reqOrToken.headers.Authorization || null;
    token = authHeader ? (authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : authHeader) : null;
  }

  if (!token) {
    if (res && typeof res.status === "function") {
      res.status(401).json({ error: "missing_token" });
    }
    throw new Error("missing_token");
  }

  // decode token to get user
  const user = await getUserFromBearer(token);
  if (!user) {
    if (res && typeof res.status === "function") {
      res.status(401).json({ error: "invalid_token" });
    }
    throw new Error("invalid_token");
  }

  // Check profiles table for is_super_admin flag using service role client
  try {
    const supabase = createSupabaseServerClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, is_super_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("requireSuperAdmin profile lookup failed:", error);
      if (res && typeof res.status === "function") {
        res.status(500).json({ error: "profile_lookup_failed" });
      }
      throw new Error("profile_lookup_failed");
    }

    if (!profile || !profile.is_super_admin) {
      if (res && typeof res.status === "function") {
        res.status(403).json({ error: "forbidden" });
      }
      throw new Error("forbidden");
    }

    // success — return decoded auth user object
    return user;
  } catch (err) {
    // rethrow after logging (ensure caller sees the error)
    console.error("requireSuperAdmin error:", err);
    throw err;
  }
}
