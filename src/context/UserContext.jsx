// src/context/UserContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const UserContext = createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState({ credits_bigint: 0 }); // default 0
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const { data } = await supabase.auth.getSession();
      const sUser = data?.session?.user ?? null;
      setUser(sUser);
      return sUser;
    } catch (err) {
      console.error("refreshUser error", err);
      setUser(null);
      return null;
    }
  }

  async function refreshProfile(_user = null) {
    const u = _user || user;
    if (!u) {
      setProfile(null);
      return null;
    }
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, metadata, is_super_admin")
        .eq("id", u.id)
        .maybeSingle();
      if (error) {
        console.warn("refreshProfile warning:", error.message || error);
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

  async function refreshWallet(_user = null) {
    const u = _user || user;
    if (!u) {
      setWallet({ credits_bigint: 0 });
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
      setWallet(w ?? { credits_bigint: 0 });
      setTransactions(txs || []);
      if (wErr) console.warn("refreshWallet warning:", wErr.message || wErr);
      if (txErr) console.warn("refreshWallet transactions warning:", txErr.message || txErr);
      return { wallet: w ?? { credits_bigint: 0 }, transactions: txs ?? [] };
    } catch (err) {
      console.error("refreshWallet error", err);
      setWallet({ credits_bigint: 0 });
      setTransactions([]);
      return null;
    }
  }

  async function updateProfile(updates = {}) {
    if (!user) throw new Error("Not signed in");
    if (!updates || Object.keys(updates).length === 0)
      return { data: null, error: new Error("no-updates") };

    try {
      const payload = { id: user.id, ...updates };
      const { data, error } = await supabase.from("profiles").upsert(payload).select().maybeSingle();
      if (error) {
        console.warn("updateProfile warning:", error.message || error);
        return { data: null, error };
      }
      setProfile(data ?? null);
      return { data: data ?? null, error: null };
    } catch (err) {
      console.error("updateProfile error", err);
      return { data: null, error: err };
    }
  }

  useEffect(() => {
    let mounted = true;
    let cleanupListener = null;

    (async () => {
      setLoading(true);

      // 1) Read current session synchronously
      const u = await refreshUser();
      if (!mounted) return;

      // 2) If signed in, fetch profile and wallet
      if (u?.id) {
        await refreshProfile(u);
        if (!mounted) return;
        await refreshWallet(u);
        if (!mounted) return;
      }

      setLoading(false);

      // 3) If this page load looks like an OAuth/magic-link redirect (contains access_token or type query),
      // re-check session once more to ensure we capture the post-redirect session.
      try {
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          const hasAuthFragment = window.location.hash.includes("access_token") || url.searchParams.has("type") || url.searchParams.has("provider");
          if (hasAuthFragment) {
            const { data } = await supabase.auth.getSession();
            const postUser = data?.session?.user ?? null;
            if (postUser) {
              setUser(postUser);
              await refreshProfile(postUser);
              await refreshWallet(postUser);

              // Clean the URL to remove auth fragments so future refreshes are clean
              try {
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
              } catch (e) {
                // ignore
              }
            }
          }
        }
      } catch (e) {
        console.warn("post-redirect session check failed:", e);
      }

      // 4) Subscribe to auth changes
      try {
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
          const u = session?.user ?? null;
          setUser(u);
          if (!u) {
            setProfile(null);
            setWallet({ credits_bigint: 0 });
            setTransactions([]);
            return;
          }
          refreshProfile(u).catch((e) => console.warn("refreshProfile after auth change failed:", e));
          refreshWallet(u).catch((e) => console.warn("refreshWallet after auth change failed:", e));
        });

        cleanupListener = listener;
      } catch (e) {
        console.warn("failed to attach auth listener:", e);
      }
    })();

    return () => {
      mounted = false;
      if (cleanupListener && typeof cleanupListener.subscription?.unsubscribe === "function") {
        cleanupListener.subscription.unsubscribe();
      }
    };
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

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
