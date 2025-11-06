import React, { useEffect, useState } from "react";
import "../components/goals.css";
import XPBar from "../components/XPBar";
import ChallengeCard from "../components/ChallengeCard";
import BadgePanel from "../components/BadgePanel";
import CustomChallengeForm from "../components/CustomChallengeForm";
import { getBalance, addCredits, getXp, setXp, addXp } from "../lib/creditsClient";

/**
 * Challenges (Goals & Rewards) page shell
 * - Fetches /api/challenges if present, otherwise uses an embedded mock.
 * - Mobile-first layout, matches site tokens (max-w-6xl, cards, shadows).
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

  useEffect(() => {
    let mounted = true;
    setLoading(true);

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
      // ignore localStorage failures
      console.warn("Failed to read persisted balance/xp", e);
    }

    // Try fetching from API if present (safe fallback to mock)
    fetch("/api/challenges")
      .then((res) => {
        if (!res.ok) throw new Error("no api");
        return res.json();
      })
      .then((json) => {
        if (!mounted) return;
        setChallenges(Array.isArray(json.challenges) ? json.challenges : FALLBACK_CHALLENGES);
        setCustomChallenges(Array.isArray(json.custom) ? json.custom : []);
        if (json.user) {
          // merge xp from API with persisted xp (persisted wins)
          setUser((u) => {
            const apiUser = { ...u, ...json.user };
            if (storedXp !== null) {
              apiUser.xp = storedXp;
            }
            return apiUser;
          });
        }
      })
      .catch(() => {
        // API missing or error - use local fallback
        setChallenges(FALLBACK_CHALLENGES);
        setCustomChallenges([]);
        setUser((u) => {
          const merged = { ...FALLBACK_USER };
          if (storedXp !== null) merged.xp = storedXp;
          return merged;
        });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateCustom = (c) => {
    const next = [c, ...customChallenges].slice(0, 3);
    setCustomChallenges(next);
  };

  const handleClaim = (ch) => {
    // Only allow claim when challenge is completed
    const completed = (ch.progress || 0) >= (ch.target || 1);
    if (!completed) {
      alert("This challenge is not yet complete.");
      return;
    }

    // Mock claim flow: persist credits and xp locally
    const added = Number(ch.credits || 0);
    const xpAdded = Number(ch.xp || 0);

    // Update balance and xp via creditsClient
    try {
      const newBal = addCredits(added);
      setBalance(newBal);

      const newXp = addXp(xpAdded);
      setStoredXp(newXp);
      setUser((u) => ({ ...u, xp: newXp }));

      // Optionally mark challenge as claimed in UI — here we set status to 'claimed'
      setChallenges((prev) => prev.map((p) => (p.id === ch.id ? { ...p, status: "claimed" } : p)));
      setCustomChallenges((prev) => prev.map((p) => (p.id === ch.id ? { ...p, status: "claimed" } : p)));

      alert(`Claimed ${ch.title}: +${added} credits added to your balance.`);
    } catch (e) {
      console.error("Claim failed", e);
      alert("Failed to claim reward. See console for details.");
    }
  };

  const handleViewTips = (ch) => {
    alert("Tips:\n\n1) Ensure your pasted message has item and price.\n2) Edit parsed fields to improve accuracy.\n3) Use share to send invoice to your customer.");
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
                <BadgePanel badges={user.badges} />

                <div className="bg-white rounded-lg p-3 shadow-sm card">
                  <h4 className="text-sm font-semibold mb-2">Available Rewards</h4>
                  <div className="text-sm text-gray-600">Credits granted by completing challenges will appear in your balance and can be used for parsing and premium features.</div>
                  <div className="mt-3 text-sm">
                    <div className="flex items-center justify-between"><div>Balance</div><div className="font-semibold">{balance} credits</div></div>
                    <div className="text-xs text-gray-500 mt-1">Some awarded credits may expire — this is a mock view.</div>
                  </div>
                </div>

                <CustomChallengeForm onCreate={handleCreateCustom} />
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
