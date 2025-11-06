// src/components/ChallengeCard.jsx
import React from "react";

/**
 * ChallengeCard
 * Props:
 * - challenge: { id, title, description, progress, target, xp, credits, status }
 * - onClaim(challenge)
 * - onViewTips(challenge)
 */
export default function ChallengeCard({ challenge = {}, onClaim = () => {}, onViewTips = () => {} }) {
  const {
    title = "Untitled",
    description = "",
    progress = 0,
    target = 1,
    xp = 0,
    credits = 0,
    status = "locked",
  } = challenge;

  const pct = Math.min(100, Math.round((progress / Math.max(1, target)) * 100));
  const completed = progress >= target || status === "completed";
  const claimed = status === "claimed";
  const locked = status === "locked";

  return (
    <article className="challenge-card" tabIndex={0} aria-labelledby={`ch-${challenge.id}-title`}>
      <div className="challenge-left">
        <div className="title-row">
          <h3 id={`ch-${challenge.id}-title`} className="challenge-title">{title}</h3>

          <div className="reward-chips" aria-hidden>
            <div className="reward-chip xp" title={`${xp} XP`}>{xp} XP</div>
            <div className="reward-chip credit" title={`${credits} credits`}>{credits} cr</div>
          </div>
        </div>

        {description ? <p className="challenge-desc">{description}</p> : null}

        <div className="meta-row">
          <div className="progress-wrap" aria-hidden>
            <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="progress-meta">
            <div className="progress-count">{progress} / {target}</div>
            <div className={`status-pill status-${status.replaceAll("_", "-")}`}>{claimed ? "Claimed" : status.replaceAll("_", " ")}</div>
          </div>
        </div>
      </div>

      <div className="challenge-right" aria-hidden>
        <div className="actions">
          {claimed ? (
            <button className="btn btn-disabled" disabled aria-disabled>
              Claimed
            </button>
          ) : completed ? (
            <button
              className="btn btn-claim"
              onClick={() => onClaim(challenge)}
              aria-label={`Claim reward for ${title}`}
            >
              Claim
            </button>
          ) : locked ? (
            <button className="btn btn-disabled" disabled aria-disabled>
              Locked
            </button>
          ) : (
            <button className="btn btn-disabled" disabled aria-disabled>
              In progress
            </button>
          )}

          <button className="btn btn-ghost" onClick={() => onViewTips(challenge)} aria-label={`View tips for ${title}`}>
            View tips
          </button>
        </div>

        <div className="small-meta">
          <div className="small-line muted">Rewards</div>
          <div className="small-line muted">{xp} XP • {credits} credits</div>
        </div>
      </div>
    </article>
  );
}
