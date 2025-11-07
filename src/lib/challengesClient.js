// src/lib/challengesClient.js
import { supabase } from "./supabase";

/**
 * Wrapper for Goals & Rewards server endpoints.
 *
 * Exports:
 *  - fetchChallenges() -> { ok, challenges, custom, user }
 *  - createCustomChallenge({ title, templateId, target }) -> { ok, challenge }
 *  - claimChallenge(challengeId) -> { ok, credits, xp, raw }
 *
 * Each function will attempt to read the current Supabase access token (if any)
 * and send it as Bearer token to the serverless endpoint.
 */

async function getAccessToken() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token ?? null;
  } catch (e) {
    return null;
  }
}

async function request(path, { method = "GET", body = null, accessToken = null } = {}) {
  const token = accessToken || (await getAccessToken());
  const headers = { Accept: "application/json" };
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body,
    credentials: "same-origin",
  });

  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (e) {
    payload = null;
  }

  if (!res.ok) {
    const errMsg = (payload && (payload.error || payload.message)) || `Request failed (${res.status})`;
    const err = new Error(errMsg);
    err.status = res.status;
    err.body = payload;
    throw err;
  }

  return payload;
}

/* Public API */

// GET canonical public + (optionally) user-specific data
export async function fetchChallenges({ accessToken } = {}) {
  return request("/api/getChallenges", { method: "GET", accessToken });
}

/**
 * Create a custom challenge for the signed-in user.
 * title: string (required)
 * templateId: string (required, e.g. 'standard')
 * target: number (optional)
 *
 * Returns server-created challenge in { challenge } or error.
 */
export async function createCustomChallenge({ title, templateId = "standard", target = undefined, accessToken } = {}) {
  if (!title) throw new Error("title is required");
  if (!templateId) throw new Error("templateId is required");

  const body = { title, templateId };
  if (target !== undefined) body.target = Number(target);

  return request("/api/createCustomChallenge", { method: "POST", body: JSON.stringify(body), accessToken });
}

/**
 * Claim a completed challenge (server-authoritative).
 * challengeId: string (required)
 *
 * Returns { ok: true, credits, xp, raw } on success.
 */
export async function claimChallenge(challengeId, { accessToken } = {}) {
  if (!challengeId) throw new Error("challengeId is required");
  return request("/api/claimReward", { method: "POST", body: JSON.stringify({ challengeId }), accessToken });
}

export default {
  fetchChallenges,
  createCustomChallenge,
  claimChallenge,
};
