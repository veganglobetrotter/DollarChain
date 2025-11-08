// src/context/UserContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * UserContext
 * Provides:
 * - user: auth user object (from supabase.auth.user())
 * - profile: app profile row (if you have a profiles table) or null
 * - wallet: { credits_bigint } or null (from dc_user_wallets)
 * - transactions: recent transactions array (from dc_credit_transactions)
 * - refreshUser(), refreshProfile(), refreshWallet(), updateProfile(updates)
 *
 * Notes:
 * - updateProfile tries to upsert into 'profiles' table. If that table doesn't exist
 *   the function returns an error message and does not attempt dangerous operations.
 * - The context is intentionally simple and safe.
 */

const UserContext = createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null); // supabase auth user
  const [profile, setProfile] = useState(null); // app profile (profiles table)
  const [wallet, setWallet] = useState(null); // dc_user_wallets row
  const [transactions, setTransactions] = useState([]); // recent dc_credit_transactions
  const [loading, setLoading] = useState(true);

  // load the auth user from supabase client
  async function refreshUser() {
    try {
      // supabase.auth.user() is used elsewhere in your code; keep same for compatibility
      const sUser = supabase.auth.user ? supabase.auth.user() : null;
      setUser(sUser || null);
      return sUser || null;
    } catch (err) {
      console.error("refreshUser error", err);
      setUser(null);
      return null;
    }
  }

  // load app profile from 'profiles' table (if exists)
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
        // If table doesn't exist or another error occurred, log and continue.
        // We intentionally do not throw so the app still works.
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

  // load wallet (dc_user_wallets) and recent transactions
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

  // update profile (surgical, safe): writes to 'profiles' table using upsert.
  // If profiles table is not present this returns a readable error.
  async function updateProfile(updates = {}) {
    if (!user) throw new Error("Not signed in");

    try {
      // Ensure we don't accidentally write an empty object
      if (!updates || Object.keys(updates).length === 0) {
        return { data: null, error: new Error("no-updates") };
      }

      // Try upsert into profiles table
      const payload = { id: user.id, ...updates };
      const { data, error } = await supabase.from("profiles").upsert(payload).select().maybeSingle();

      if (error) {
        console.warn("updateProfile warning (profiles table may not exist or upsert failed):", error.message || error);
        return { data: null, error };
      }

      // refresh local profile state
      setProfile(data ?? null);
      return { data: data ?? null, error: null };
    } catch (err) {
      console.error("updateProfile error", err);
      return { data: null, error: err };
    }
  }

  // initial load
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

  // Expose values and helpers
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

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
