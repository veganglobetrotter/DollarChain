// src/context/UserContext.jsx
/**
 * UserContext.jsx
 *
 * CLEANUP SUMMARY (what I changed and why):
 * - Renamed to `.jsx` so Vite/JSX tooling will parse JSX normally.
 * - Replaced `React.createElement(...)` with standard JSX at the return (clearer, idiomatic).
 * - Kept the module importing the client-side `supabase` from ../lib/supabase (anon-key).
 * - Kept all original logic (refreshUser, refreshProfile, refreshWallet, updateProfile) intact.
 * - Slightly simplified wallet/transactions result handling for clarity and consistency.
 *
 * NOTE:
 * - This file is client-side only. Do NOT import server-only helpers (supabaseServer.js) here.
 * - If you prefer explicit typing or PropTypes, we can add them; I left the API unchanged.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const UserContext = createContext();

/** Hook convenience */
export function useUser() {
  return useContext(UserContext);
}

/**
 * UserProvider
 * Provides: user, profile, wallet, transactions, loading and helper functions.
 */
export function UserProvider({ children }) {
  const [user, setUser] = useState(null); // supabase auth user
  const [profile, setProfile] = useState(null); // app profile (profiles table)
  const [wallet, setWallet] = useState(null); // dc_user_wallets row
  const [transactions, setTransactions] = useState([]); // recent dc_credit_transactions
  const [loading, setLoading] = useState(true);

  /** Load auth user from Supabase client (client-side) */
  async function refreshUser() {
    try {
      // Preserve existing behavior: some apps still use supabase.auth.user()
      const sUser = supabase.auth && typeof supabase.auth.user === "function" ? supabase.auth.user() : null;
      setUser(sUser || null);
      return sUser || null;
    } catch (err) {
      console.error("refreshUser error", err);
      setUser(null);
      return null;
    }
  }

  /** Load profile row from 'profiles' table if present */
  async function refreshProfile(_user = null) {
    const u = _user || user;
    if (!u) {
      setProfile(null);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, metadata")
        .eq("id", u.id)
        .maybeSingle();

      if (error) {
        // Non-fatal: profiles table may not exist.
        console.warn("refreshProfile warning (profiles table may not exist):", error.message || error);
        setProfile(null);
        return null;
      }

      setProfile(data ?? null);
      return data ?? null;
    } catch (err) {
      console.error("refreshProfile error", err);
      setProfile(null);
      return null;
    }
  }

  /**
   * Load wallet (dc_user_wallets) and recent transactions.
   * Returns { wallet, transactions } or null on error.
   */
  async function refreshWallet(_user = null) {
    const u = _user || user;
    if (!u) {
      setWallet(null);
      setTransactions([]);
      return null;
    }

    try {
      const [{ data: w, error: wErr }, { data: txs, error: txErr }] = await Promise.all([
        supabase.from("dc_user_wallets").select("credits_bigint").eq("user_id", u.id).maybeSingle(),
        supabase
          .from("dc_credit_transactions")
          .select("delta, balance_after, type, reference, created_at")
          .eq("user_id", u.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      // Consolidated handling
      if (wErr) {
        console.warn("refreshWallet warning (dc_user_wallets may not exist):", wErr.message || wErr);
        setWallet(null);
      } else {
        setWallet(w ?? null);
      }

      if (txErr) {
        console.warn("refreshWallet transactions warning (dc_credit_transactions may not exist):", txErr.message || txErr);
        setTransactions([]);
      } else {
        setTransactions(txs || []);
      }

      return { wallet: w ?? null, transactions: txs ?? [] };
    } catch (err) {
      console.error("refreshWallet error", err);
      setWallet(null);
      setTransactions([]);
      return null;
    }
  }

  /**
   * updateProfile(updates)
   * - Upserts into 'profiles' table for the signed-in user.
   * - Returns { data, error } where error is non-null on failure.
   */
  async function updateProfile(updates = {}) {
    if (!user) throw new Error("Not signed in");

    try {
      if (!updates || Object.keys(updates).length === 0) {
        return { data: null, error: new Error("no-updates") };
      }

      const payload = { id: user.id, ...updates };
      const { data, error } = await supabase.from("profiles").upsert(payload).select().maybeSingle();

      if (error) {
        console.warn("updateProfile warning (profiles table may not exist or upsert failed):", error.message || error);
        return { data: null, error };
      }

      setProfile(data ?? null);
      return { data: data ?? null, error: null };
    } catch (err) {
      console.error("updateProfile error", err);
      return { data: null, error: err };
    }
  }

  /* Initial load: user -> profile -> wallet */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const u = await refreshUser();
      if (!mounted) return;
      await refreshProfile(u);
      if (!mounted) return;
      await refreshWallet(u);
      if (!mounted) return;
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    user,
    profile,
    wallet,
    transactions,
    loading,
    refreshUser,
    refreshProfile,
    refreshWallet,
    updateProfile,
  };

  /* Now that this file is .jsx, return JSX directly (clean and idiomatic). */
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
