// pages/api/user/xp.js
// Small endpoint returning the current user's XP/level (Step 4Vol1).
// For the stub we return the same mock values used elsewhere.

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const xpObj = {
    xp: 78,
    level: 1,
    xpForNextLevel: 22,
  };

  return res.status(200).json(xpObj);
}
