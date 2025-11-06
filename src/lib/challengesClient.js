// src/lib/challengesClient.js
import { supabase } from "./supabase";

/**
 * Simple wrapper for /api/challenges
 *
 * Exports:
 *  - fetchChallenges() -> { challenges, custom, user }
 *  - createCustomChallenge({ title, templateId, target }) -> { custom: ... }
 *  - claimChallenge(challengeId) -> { claimed: true, credits: ... }
 *
 * Each function will attempt to read the current Supabase access token (if any)
 * and send it as Bearer token to the serverless endpoint.
 */

const API_BASE = "/api/challenges";

async function getAccessToken() {
  try {
    // supabase.auth.getSession() returns { data: { session } } in v2
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token ?? null;
  } catch (e) {
    // if anything goes wrong, return null so calls proceed unauthenticated
    return null;
  }
}

async function request(path, { method = "GET", body = null, accessToken = null } = {}) {
  const token = accessToken || (await getAccessToken());
  const headers = { Accept: "application/json" };
  if (body) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

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
    // leave payload null if non-json returned
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

export async function fetchChallenges({ accessToken } = {}) {
  return request(API_BASE, { method: "GET", accessToken });
}

/**
 * Create a custom challenge for the signed-in user.
 * title: string (required)
 * templateId: string (required, e.g. 'standard')
 * target: number (optional)
 */
export async function createCustomChallenge({ title, templateId = "standard", target = undefined, accessToken } = {}) {
  if (!title) throw new Error("title is required");
  const body = { action: "create", title, templateId };
  if (target !== undefined) body.target = Number(target);
  return request(API_BASE, { method: "POST", body: JSON.stringify(body), accessToken });
}

/**
 * Claim a completed custom challenge (must be owned by signed-in user).
 * challengeId: string (required)
 */
export async function claimChallenge(challengeId, { accessToken } = {}) {
  if (!challengeId) throw new Error("challengeId is required");
  return request(API_BASE, { method: "POST", body: JSON.stringify({ action: "claim", challengeId }), accessToken });
}

export default {
  fetchChallenges,
  createCustomChallenge,
  claimChallenge,
};
