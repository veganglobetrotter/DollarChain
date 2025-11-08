// src/context/UserContext.jsx
/**
 * UserContext.jsx
 *
 * CLEANUP SUMMARY (what I changed and why):
 * - Ensured the auth session is awaited before fetching profile/wallet.
 *   This fixes a race where the UI tried to read profile/wallet while the
 *   Supabase session was still resolving, causing "Not signed in" errors.
 * - Added an auth state change subscription to keep `user` in sync when
 *   sign-in / sign-out events happen and to refresh profile/wallet accordingly.
 *
 * Notes:
 * - Minimal, surgical edits: core refreshProfile/refreshWallet/updateProfile logic unchanged.
 * - This file remains client-side and imports the client `supabase` from ../lib/supabase.
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
      // Explicitly ask Supabase for the current session so we don't race.
      // supabase.auth.getSession() returns { data: { session } } in v2.
      const { data } = await supabase.auth.getSession();
      const sUser = data?.session?.user ?? null;
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

  /* Initial load: user -> profile -> wallet
     Also subscribe to auth state changes to keep context in sync. */
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

    // subscribe to auth state changes so UI reacts immediately to sign-in/out
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUser(u);

      if (!u) {
        // cleared session -> clear profile/wallet
        setProfile(null);
        setWallet(null);
        setTransactions([]);
        return;
      }

      // on sign-in or token refresh, refresh server-backed data
      // fire-and-forget (we don't await here)
      refreshProfile(u).catch((e) => console.warn("refreshProfile after auth change failed:", e));
      refreshWallet(u).catch((e) => console.warn("refreshWallet after auth change failed:", e));
    });

    return () => {
      mounted = false;
      // unsubscribe if possible
      if (authListener && typeof authListener.subscription?.unsubscribe === "function") {
        authListener.subscription.unsubscribe();
      }
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
