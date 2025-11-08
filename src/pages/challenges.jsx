// src/pages/challenges.jsx
import React, { useEffect, useState, useCallback } from "react";
import "../components/goals.css";
import XPBar from "../components/XPBar";
import ChallengeCard from "../components/ChallengeCard";
// BadgePanel removed from Goals page (moved to profile)
import CustomChallengeForm from "../components/CustomChallengeForm";
import { getBalance, addCredits, getXp, addXp } from "../lib/creditsClient";
import { useToasts } from "../components/ToastProvider";
import {
  fetchChallenges as apiFetchChallenges,
  createCustomChallenge as apiCreateCustomChallenge,
  claimChallenge as apiClaimChallenge,
} from "../lib/challengesClient";
import { supabase } from "../lib/supabase";

/**
 * Challenges (Goals & Rewards) page shell
 * - Fetches /api/challenges if present, otherwise uses an embedded mock.
 * - Mobile-first layout, matches site tokens (max-w-6xl, cards, shadows).
 *
 * Notes:
 * - This version gates create/claim behind authentication.
 * - It listens for Supabase auth changes and refreshes the server data when a user signs in.
 */

const FALLBACK_USER = {
  name: "Amina's Crafts",
  xp: 78,
  level: 1,
  xpForNextLevel: 22,
  badges: ["first_invoice", "speed_demon"],
};

const FALLBACK_CHALLENGES = [
  { id: "first_invoice", title: "First Invoice", description: "Create your first invoice by pasting a WhatsApp message and confirming.", progress: 1, target: 1, xp: 20, credits: 5, status: "completed" },
  { id: "confirm_clean", title: "Confirm & Clean", description: "Edit at least one parsed field or press Confirm after parsing.", progress: 0, target: 1, xp: 15, credits: 3, status: "in_progress" },
  { id: "weekly_hustle", title: "Weekly Hustle", description: "Create 5 invoices in any rolling 7-day window.", progress: 2, target: 5, xp: 30, credits: 10, status: "in_progress" },
];

export default function ChallengesPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(FALLBACK_USER);
  const [challenges, setChallenges] = useState([]);
  const [customChallenges, setCustomChallenges] = useState([]);
  const [balance, setBalance] = useState(0);
  const [storedXp, setStoredXp] = useState(null);

  // small modal state for detailed tips
  const [openTips, setOpenTips] = useState(null);

  // Toasts
  const { addToast } = useToasts();

  // whether current client session is authenticated (set from server payload or supabase)
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // helper to fetch challenges from API (used on mount and after sign-in)
  const reloadChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await apiFetchChallenges();
      setChallenges(Array.isArray(payload?.challenges) ? payload.challenges : FALLBACK_CHALLENGES);
      setCustomChallenges(Array.isArray(payload?.custom) ? payload.custom : []);
      if (payload?.user) {
        setUser((u) => {
          const apiUser = { ...u, ...payload.user };
          if (storedXp !== null) apiUser.xp = storedXp;
          return apiUser;
        });
        setIsAuthenticated(Boolean(payload.user && payload.user.id));
      } else {
        setIsAuthenticated(false);
      }

      // server-canonical credits (if provided) — NOTE: server returns `user.credits`
      if (payload?.user?.credits != null) {
        setBalance(Number(payload.user.credits));
      }
    } catch (err) {
      console.warn("fetchChallenges failed, using fallback:", err?.message || err);
      setChallenges(FALLBACK_CHALLENGES);
      setCustomChallenges([]);
      setUser((u) => {
        const merged = { ...FALLBACK_USER };
        if (storedXp !== null) merged.xp = storedXp;
        return merged;
      });
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [storedXp]);

  useEffect(() => {
    let mounted = true;

    // Initialize persisted balance & xp (from localStorage via creditsClient)
    try {
      const b = getBalance();
      const xpVal = getXp();
      if (mounted) {
        setBalance(b);
        if (xpVal !== null) {
          setStoredXp(xpVal);
          setUser((u) => ({ ...u, xp: xpVal }));
        }
      }
    } catch (e) {
      console.warn("Failed to read persisted balance/xp", e);
    }

    // NOTE: initial challenge fetch is deferred until we know the session (see auth effect).
    // This prevents a race that shows "Sign in to create goals" when the user is actually signed in.

    return () => {
      mounted = false;
    };
  }, [reloadChallenges]);

  // Listen for Supabase auth changes so we can refresh server-backed content
  useEffect(() => {
    let mounted = true;
    (async () => {
      // get initial session
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session ?? null;
        if (!mounted) return;

        setIsAuthenticated(Boolean(session?.user));
        if (session?.user) {
          // attach minimal user info for display
          setUser((u) => ({ ...u, id: session.user.id, email: session.user.email ?? u.email }));
        }

        // We now know the auth state — safe to load challenges (works for both signed-in and anonymous)
        await reloadChallenges();
      } catch (e) {
        console.warn("auth.getSession failed", e);
        // still attempt to load challenges (fallback handling inside reloadChallenges)
        await reloadChallenges();
      }

      // subscribe to auth changes
      const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        setIsAuthenticated(Boolean(session?.user));
        if (session?.user) {
          setUser((u) => ({ ...u, id: session.user.id, email: session.user.email ?? u.email }));
        } else {
          // signed out — revert to fallback or public view
          setUser(FALLBACK_USER);
          setIsAuthenticated(false);
          // keep local persisted balance/xp if present
          const b = getBalance();
          const xpVal = getXp();
          if (b != null) setBalance(b);
          if (xpVal != null) setStoredXp(xpVal);
        }

        // refresh server data (fetch custom challenges, balance) after auth change
        try {
          await reloadChallenges();
        } catch (e) {
          console.warn("reloadChallenges after auth change failed:", e);
        }
      });

      return () => {
        mounted = false;
        try {
          sub?.subscription?.unsubscribe?.();
        } catch (e) {
          // older supabase client surfaces unsubscribe differently; ignore if unavailable
          if (sub?.unsubscribe) sub.unsubscribe();
        }
      };
    })();
  }, [reloadChallenges]);

  // Create custom challenge: require authentication (server-authoritative)
  const handleCreateCustom = async (c) => {
    if (!isAuthenticated) {
      addToast({
        type: "info",
        title: "Sign in to create goals",
        message: "Please sign in to create and sync custom goals with your account.",
        durationMs: 5000,
      });
      return;
    }

    // local optimistic update for UI snappiness
    const nextLocal = [c, ...customChallenges].slice(0, 3);
    setCustomChallenges(nextLocal);

    try {
      const res = await apiCreateCustomChallenge({
        title: c.title,
        templateId: c.templateId,
        target: c.target,
      });

      const created = res?.custom || res?.challenge || null;
      if (created) {
        setCustomChallenges((prev) => [created, ...prev.filter((p) => p.id !== c.id)].slice(0, 3));
      }

      addToast({
        type: "success",
        title: "Custom goal created",
        message: `${c.title} — small rewards available`,
        durationMs: 4200,
      });
    } catch (err) {
      console.warn("createCustomChallenge failed:", err);
      addToast({
        type: "warning",
        title: "Saved locally",
        message: "Custom goal saved locally. Server sync failed.",
        durationMs: 4500,
      });
    }
  };

  // Claim challenge: require authentication and call server; surface helpful toasts
  const handleClaim = async (ch) => {
    // Only allow claim when challenge is completed
    const completed = (ch.progress || 0) >= (ch.target || 1);
    if (!completed) {
      addToast({
        type: "warning",
        title: "Not ready yet",
        message: "This challenge is not yet complete — keep going!",
        durationMs: 4000,
      });
      return;
    }

    if (!isAuthenticated) {
      addToast({
        type: "info",
        title: "Sign in to claim",
        message: "Please sign in to claim rewards and sync them with your account.",
        durationMs: 5000,
      });
      return;
    }

    // values to apply locally if API response doesn't include them
    const localCredits = Number(ch.credits || 0);
    const localXp = Number(ch.xp || 0);

    try {
      // Attempt server claim (requires signed-in user)
      const res = await apiClaimChallenge(ch.id);

      // prefer server-returned fields; check several possible keys
      const credited = Number(res?.credits ?? res?.balance ?? res?.new_balance ?? localCredits);
      const xpCredited = Number(res?.xp ?? res?.xp_awarded ?? res?.awarded_xp ?? localXp);

      // Update client-side persisted balances using creditsClient
      const newBal = addCredits(credited);
      setBalance(newBal);

      const newXp = addXp(xpCredited);
      setStoredXp(newXp);
      setUser((u) => ({ ...u, xp: newXp }));

      // mark claimed in UI
      setChallenges((prev) => prev.map((p) => (p.id === ch.id ? { ...p, status: "claimed" } : p)));
      setCustomChallenges((prev) => prev.map((p) => (p.id === ch.id ? { ...p, status: "claimed" } : p)));

      addToast({
        type: "success",
        title: `Claimed — ${ch.title}`,
        message: `${credited} credits added to your balance.`,
        actionLabel: "View balance",
        onAction: () => {
          const el = document.querySelector(".card");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        },
        durationMs: 6000,
      });
    } catch (err) {
      // If API claim fails due to network or server error (not auth), surface helpful message
      console.warn("apiClaimChallenge failed:", err);

      addToast({
        type: "error",
        title: "Claim failed",
        message: "Unable to claim reward. If you're signed in, try again or check network.",
        durationMs: 6000,
      });
    }
  };

  const handleViewTips = (ch) => {
    // Show an info toast with action to open a small modal containing detailed tips
    addToast({
      type: "info",
      title: `Tips — ${ch.title}`,
      message: "Edit parsed fields to improve accuracy.",
      actionLabel: "View tips",
      onAction: () => {
        setOpenTips(ch);
      },
      durationMs: 8000,
    });
  };

  return (
    <div className="goals-root container p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="frame">
          <header className="mb-6">
            <h1 className="text-2xl font-bold">Goals & Rewards</h1>
            <p className="text-sm text-gray-600 mt-1">
              Complete goals, earn credits and level up. Credits will be added to your balance (mock view).
            </p>
          </header>

          {/* Sign-in CTA banner when unauthenticated */}
          {!isAuthenticated && (
            <div className="mb-4 card" style={{ padding: 12, borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, color: "#374151" }}>
                  <strong>Sign in to claim rewards</strong>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>You must be signed in to create or claim goals — this keeps rewards secure and tied to your account.</div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      // best-effort: trigger a custom event so App-level auth modal can open
                      window.dispatchEvent(new CustomEvent("open-auth-modal"));
                      addToast({ type: "info", title: "Sign in", message: "Open the sign-in dialog from the header.", durationMs: 3000 });
                    }}
                    className="btn btn-primary"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading Goals & Rewards…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <main className="md:col-span-2">
                <div className="mb-4">
                  <XPBar xp={user.xp} level={user.level} xpForNextLevel={user.xpForNextLevel} />
                </div>

                <section className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">Active Challenges</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {challenges.map((c) => (
                      <ChallengeCard key={c.id} challenge={c} onClaim={handleClaim} onViewTips={handleViewTips} />
                    ))}
                  </div>
                </section>

                <section className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">My Weekly Goals</h2>
                  <div className="space-y-3">
                    {customChallenges.length === 0 ? (
                      <div className="text-sm text-gray-500">No custom goals yet — create one to get started.</div>
                    ) : (
                      <div className="grid gap-3">
                        {customChallenges.map((cc) => (
                          <ChallengeCard key={cc.id} challenge={cc} onClaim={handleClaim} onViewTips={handleViewTips} />
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3">Completed History (mock)</h2>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li>First Invoice — completed Nov 1, 2025</li>
                      <li>Confirm & Clean — in progress</li>
                    </ul>
                  </div>
                </section>
              </main>

              <aside className="md:col-span-1 space-y-4">
                {/* BadgePanel removed from Goals & Rewards (moved to profile). */}
                <div className="card">
                  <div className="card-inner">
                    <h4 className="text-sm font-semibold mb-2">Available Rewards</h4>
                    <div className="text-sm text-gray-600">Credits granted by completing challenges will appear in your balance and can be used for parsing and premium features.</div>
                    <div className="mt-3 text-sm">
                      <div className="flex items-center justify-between"><div>Balance</div><div className="font-semibold">{balance} credits</div></div>
                      <div className="text-xs text-gray-500 mt-1">Some awarded credits may expire — this is a mock view.</div>
                    </div>
                  </div>
                </div>

                <CustomChallengeForm onCreate={handleCreateCustom} disabled={!isAuthenticated} />
              </aside>
            </div>
          )}
        </div>
      </div>

      {/* Lightweight Tips Modal (in-page) */}
      {openTips && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Tips for ${openTips.title}`}
          onClick={() => setOpenTips(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,23,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 16000,
          }}
        >
          <div
            className="formBox"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, 94%)",
              maxHeight: "84vh",
              overflow: "auto",
              padding: 18,
              borderRadius: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 8 }}>
              <div>
                <h3 style={{ margin: 0 }}>{openTips.title} — Tips</h3>
                <div style={{ fontSize: 13, color: "#6b7280" }}>Helpful steps to complete this challenge</div>
              </div>
              <button
                onClick={() => setOpenTips(null)}
                className="btn btn-ghost"
                aria-label="Close tips"
              >
                Close
              </button>
            </div>

            <div style={{ marginTop: 8 }}>
              <ol style={{ paddingLeft: 18, color: "#374151" }}>
                <li>Ensure each item line contains a name and a price (e.g., "2 x Bread @ 40").</li>
                <li>Edit parsed fields after pasting to correct quantities or names.</li>
                <li>Use consistent payment numbers (M-PESA paybill / phone) so buyers can confirm quickly.</li>
                <li>After you send invoice, mark it as paid in the app to help confirmers and unlock reputation rewards.</li>
              </ol>

              <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button onClick={() => setOpenTips(null)} className="btn btn-primary">Got it</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
