// src/lib/creditsClient.js
// Very small client-side "wallet" helper that persists to localStorage.
// Safe: runs in browser only. No backend changes.

const KEY_BALANCE = "dollarchain:credits_balance_v1";
const KEY_XP = "dollarchain:xp_v1";

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("creditsClient: failed to parse", key, e);
    return fallback;
  }
}

function writeJSON(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn("creditsClient: write failed", key, e);
  }
}

export function getBalance() {
  const n = readJSON(KEY_BALANCE, 0);
  return Number(n || 0);
}

export function setBalance(n) {
  const v = Math.max(0, Number(n || 0));
  writeJSON(KEY_BALANCE, v);
  return v;
}

export function addCredits(n) {
  const cur = getBalance();
  const next = Math.max(0, cur + Number(n || 0));
  setBalance(next);
  return next;
}

export function resetBalance() {
  writeJSON(KEY_BALANCE, 0);
}

// XP helpers (optional)
export function getXp() {
  const n = readJSON(KEY_XP, null);
  return n === null ? null : Number(n || 0);
}
export function setXp(n) {
  writeJSON(KEY_XP, Number(n || 0));
  return Number(n || 0);
}
export function addXp(n) {
  const cur = getXp() ?? 0;
  const next = Math.max(0, cur + Number(n || 0));
  setXp(next);
  return next;
}
