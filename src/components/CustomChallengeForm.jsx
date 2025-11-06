// src/components/CustomChallengeForm.jsx
import React, { useState } from "react";

export default function CustomChallengeForm({ onCreate = () => {} }) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(3);
  const [xp, setXp] = useState(5);
  const [credits, setCredits] = useState(2);
  const [error, setError] = useState("");

  const reset = () => {
    setTitle("");
    setTarget(3);
    setXp(5);
    setCredits(2);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Please give your challenge a short title.");
    if (target < 1 || xp < 0 || credits < 0) return setError("Please enter valid numeric values.");
    onCreate({
      id: `custom-${Date.now()}`,
      title: title.trim(),
      description: `Custom challenge — ${title.trim()}`,
      target,
      xp,
      credits,
      progress: 0,
      status: "in_progress",
      start_at: new Date().toISOString(),
    });
    reset();
    // subtle success toast can be triggered by parent (recommended)
  };

  return (
    <form onSubmit={handleSubmit} className="card card-inner" aria-label="Create weekly challenge">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>Create a weekly goal</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>Up to 3 active</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          className="border border-gray-200 rounded px-3 py-2 text-sm"
          placeholder="Challenge title (eg. Create 7 invoices)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Challenge title"
        />

        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="w-1/3 border border-gray-200 rounded px-3 py-2 text-sm"
            type="number"
            min={1}
            value={target}
            onChange={(e) => setTarget(Math.max(1, Number(e.target.value)))}
            aria-label="Target count"
          />
          <input
            className="w-1/3 border border-gray-200 rounded px-3 py-2 text-sm"
            type="number"
            min={0}
            value={xp}
            onChange={(e) => setXp(Math.max(0, Number(e.target.value)))}
            aria-label="XP reward"
          />
          <input
            className="w-1/3 border border-gray-200 rounded px-3 py-2 text-sm"
            type="number"
            min={0}
            value={credits}
            onChange={(e) => setCredits(Math.max(0, Number(e.target.value)))}
            aria-label="Credits reward"
          />
        </div>

        {error && <div style={{ color: "#ef4444", fontSize: 13 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="submit" className="btn btn-primary">Create</button>
          <button type="button" onClick={reset} className="btn btn-ghost">Reset</button>
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>Small rewards only</div>
        </div>
      </div>
    </form>
  );
}
