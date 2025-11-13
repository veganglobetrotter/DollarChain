// server.js
import express from "express";
import usersHandler from "./src/api/admin/users.js";
import settingsHandler from "./src/api/admin/settings.js";

const app = express();
app.use(express.json());

// Proxy the serverless endpoints
app.all("/api/admin/users", (req, res) => usersHandler(req, res));
app.all("/api/admin/settings", (req, res) => settingsHandler(req, res));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
