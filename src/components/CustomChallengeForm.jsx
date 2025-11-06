// src/components/CustomChallengeForm.jsx
import React, { useState } from "react";

/**
 * CustomChallengeForm (template-based)
 *
 * Props:
 * - onCreate({ id, title, description, templateId, target, xp, credits, progress, status, start_at })
 *
 * Notes:
 * - Rewards (xp, credits) are derived from the chosen template on the client.
 * - IMPORTANT: server-side must authoritative-map templateId -> rewards to avoid client tampering.
 */

const TEMPLATES = {
  micro: {
    id: "micro",
    name: "Micro",
    desc: "Quick wins — ideal for busy sellers",
    xp: 5,
    credits: 2,
    suggestedTarget: 3,
  },
  standard: {
    id: "standard",
    name: "Standard",
    desc: "Most popular — steady progress",
    xp: 15,
    credits: 5,
    suggestedTarget: 5,
  },
  stretch: {
    id: "stretch",
    name: "Stretch",
    desc: "Higher reward for more effort",
    xp: 35,
    credits: 15,
    suggestedTarget: 10,
  },
};

export default function CustomChallengeForm({ onCreate = () => {} }) {
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState("standard");
  const [target, setTarget] = useState(TEMPLATES.standard.suggestedTarget);
  const [error, setError] = useState("");

  // When template changes, update the target to the suggested target for UX convenience
  const handleTemplateChange = (id) => {
    setTemplateId(id);
    const suggested = TEMPLATES[id]?.suggestedTarget ?? 3;
    setTarget((prev) => (prev < 1 ? suggested : suggested));
  };

  const reset = () => {
    setTitle("");
    setTemplateId("standard");
    setTarget(TEMPLATES.standard.suggestedTarget);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const trimmed = (title || "").trim();
    if (!trimmed) return setError("Please give your challenge a short title.");
    if (!Number.isFinite(Number(target)) || Number(target) < 1) return setError("Please enter a valid target (≥ 1).");

    const tpl = TEMPLATES[templateId] || TEMPLATES.standard;

    const challenge = {
      id: `custom-${Date.now()}`,
      title: trimmed,
      description: `Custom challenge — ${trimmed}`,
      templateId: tpl.id,
      target: Number(target),
      xp: tpl.xp,
      credits: tpl.credits,
      progress: 0,
      status: "in_progress",
      start_at: new Date().toISOString(),
    };

    onCreate(challenge);
    reset();
  };

  return (
    <form onSubmit={handleSubmit} className="card card-inner" aria-label="Create weekly challenge">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>Create a weekly goal</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>Up to 3 active</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          className="border border-gray-200 rounded px-3 py-2 text-sm"
          placeholder="Challenge title (eg. Create 7 invoices)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Challenge title"
        />

        {/* Template selector */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Choose a reward template</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.values(TEMPLATES).map((tpl) => {
              const active = tpl.id === templateId;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleTemplateChange(tpl.id)}
                  aria-pressed={active}
                  className={active ? "btn-pill active" : "btn-pill"}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 6,
                    minWidth: 120,
                    padding: 10,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{tpl.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{tpl.desc}</div>
                  <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                    <div style={{ fontSize: 12, padding: "4px 8px", borderRadius: 999 }}>{tpl.xp} XP</div>
                    <div style={{ fontSize: 12, padding: "4px 8px", borderRadius: 999 }}>{tpl.credits} credits</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target input (user can choose target only) */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 13, color: "#374151", minWidth: 120 }}>Target</label>
          <input
            className="border border-gray-200 rounded px-3 py-2 text-sm"
            type="number"
            min={1}
            value={target}
            onChange={(e) => setTarget(Math.max(1, Number(e.target.value || 1)))}
            aria-label="Target count"
            style={{ width: 120 }}
          />

          <div style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>Rewards from template (fixed)</div>
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
