// src/lib/challengeTemplates.js
// Canonical challenge templates. Server-authoritative source of truth.
// If you prefer a DB table for templates, you can migrate these values to
// a `challenge_templates` table and have the server read from there.

export const TEMPLATES = {
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

// Helper lookup
export function getTemplate(templateId) {
  return TEMPLATES[templateId] || null;
}
