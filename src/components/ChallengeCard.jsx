import React from "react";

/**
 * ChallengeCard.jsx
 * Props:
 *  - challenge { id, title, description, progress, target, xp, credits, status }
 *  - onViewTips(challenge)
 *  - onClaim(challenge)
 */
export default function ChallengeCard({ challenge, onViewTips = () => {}, onClaim = () => {} }) {
  const { title, description, progress = 0, target = 1, xp = 0, credits = 0, status } = challenge;
  const pct = Math.min(100, Math.round((progress / Math.max(1, target)) * 100));
  const completed = progress >= target;

  const rawStatus = typeof status === "string" ? status : "in_progress";
  const statusText = rawStatus.replace(/_/g, " ");

  return (
    <article className="bg-white shadow-sm rounded-lg p-4 flex flex-col h-full">
      <header className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-600">{xp} XP</div>
          <div className="text-xs text-gray-600">{credits} credits</div>
        </div>
      </header>

      <div className="mt-4 flex-1">
        <div className="w-full bg-gray-100 rounded h-2 overflow-hidden">
          <div className="h-2 rounded" style={{ width: `${pct}%`, background: "#60a5fa" }} />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <div>{progress} / {target}</div>
          <div className="capitalize">{statusText}</div>
        </div>
      </div>

      <footer className="mt-4 flex items-center gap-2">
        <button
          className={`px-3 py-1 rounded text-sm font-medium ${completed ? "bg-green-600 text-white" : "bg-gray-100 text-gray-800"}`}
          onClick={() => onClaim(challenge)}
          disabled={!completed}
          aria-disabled={!completed}
        >
          {completed ? "Claim" : "In progress"}
        </button>

        <button
          className="text-sm px-2 py-1 rounded bg-white border border-gray-200 text-gray-700"
          onClick={() => onViewTips(challenge)}
        >
          View tips
        </button>

        <div className="ml-auto text-xs text-gray-500">{completed ? "Ready" : "Keep going"}</div>
      </footer>
    </article>
  );
}
