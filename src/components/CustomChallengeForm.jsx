import React, { useState } from "react";

/**
 * CustomChallengeForm.jsx
 * Props:
 *  - onCreate({ id, title, target, xp, credits, progress })
 */

export default function CustomChallengeForm({ onCreate = () => {} }) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(3);
  const [xp, setXp] = useState(5);
  const [credits, setCredits] = useState(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("Please give your challenge a short title.");
    onCreate({ id: `custom-${Date.now()}`, title: title.trim(), target, xp, credits, progress: 0 });
    setTitle("");
    setTarget(3);
    setXp(5);
    setCredits(2);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-3 shadow-sm">
      <h4 className="text-sm font-semibold mb-2">Create a weekly challenge</h4>

      <input
        className="border border-gray-200 rounded px-3 py-2 text-sm mb-2"
        placeholder="Challenge title (eg. Create 7 invoices)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="flex gap-2 mb-2">
        <input className="w-1/3 border border-gray-200 rounded px-3 py-2 text-sm" type="number" min={1} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
        <input className="w-1/3 border border-gray-200 rounded px-3 py-2 text-sm" type="number" min={1} value={xp} onChange={(e) => setXp(Number(e.target.value))} />
        <input className="w-1/3 border border-gray-200 rounded px-3 py-2 text-sm" type="number" min={0} value={credits} onChange={(e) => setCredits(Number(e.target.value))} />
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">Create</button>
        <div className="text-xs text-gray-500">Up to 3 active custom challenges. Small rewards only.</div>
      </div>
    </form>
  );
}
