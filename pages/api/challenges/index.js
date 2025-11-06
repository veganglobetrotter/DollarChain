// pages/api/challenges/index.js
// Read-only API stub for Goals & Rewards (Step 4Vol1)
// Serves the mock challenges and custom challenges from src/data/mock_challenges.js

import { MOCK_CHALLENGES, MOCK_CUSTOM_CHALLENGES } from "../../../src/data/mock_challenges";

export default function handler(req, res) {
  // Only allow GET for safety
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Simple payload: challenges, custom, and an example user object (client can override)
  const payload = {
    challenges: MOCK_CHALLENGES,
    custom: MOCK_CUSTOM_CHALLENGES,
    user: {
      name: "Amina's Crafts",
      xp: 78,
      level: 1,
      xpForNextLevel: 22,
      badges: ["first_invoice", "speed_demon"],
    },
  };

  return res.status(200).json(payload);
}
