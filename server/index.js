// server/index.js
// Express adapter that dynamically routes /api/* requests to files under ./api/*
// It supports routes with dynamic segments like /api/admin/users/:id/adjustCredits
// by resolving files with bracketed params like api/admin/users/[id]/adjustCredits.js

const express = require("express");
const fs = require("fs");
const path = require("path");
const url = require("url");
const { pipeline } = require("stream");
const app = express();

const API_ROOT = path.join(__dirname, "..", "api");

// keep raw body for handlers that need it (file uploads / formidable)
app.use((req, res, next) => {
  // parse JSON bodies for convenience
  express.json({ limit: "10mb" })(req, res, (err) => {
    // ignore JSON parse errors; fall back to raw handling in handlers if needed
    next();
  });
});

// Helper: try to resolve handler file and extract params
function findHandlerForSegments(segments, dir = API_ROOT) {
  // segments: array of path segments to match
  // returns { filePath, params } or null
  if (segments.length === 0) {
    // try index.js in dir
    const idx = path.join(dir, "index.js");
    if (fs.existsSync(idx)) return { filePath: idx, params: {} };
    return null;
  }

  const [seg, ...rest] = segments;

  // Try exact match as file.js in dir
  const fileCandidate = path.join(dir, `${seg}.js`);
  if (fs.existsSync(fileCandidate)) {
    if (rest.length === 0) return { filePath: fileCandidate, params: {} };
    // continue matching down the rest as directory under seg
    const nextDir = path.join(dir, seg);
    const deeper = findHandlerForSegments(rest, nextDir);
    if (deeper) return deeper;
    // else maybe there is fileCandidate and rest is something else -> try nested files via rest appended to file path? not standard
  }

  // Try as directory
  const dirCandidate = path.join(dir, seg);
  if (fs.existsSync(dirCandidate) && fs.statSync(dirCandidate).isDirectory()) {
    const deeper = findHandlerForSegments(rest, dirCandidate);
    if (deeper) return deeper;
  }

  // Try matching bracketed param file or dir: find any child that is like [param]
  const entries = fs.readdirSync(dir);
  // first try files like [id].js if rest empty
  for (const e of entries) {
    if (e.startsWith("[") && e.endsWith("].js") && rest.length === 0) {
      const candidate = path.join(dir, e);
      if (fs.existsSync(candidate)) {
        const paramName = e.slice(1, -4); // remove [ ] and .js
        const params = {};
        params[paramName] = seg;
        return { filePath: candidate, params };
      }
    }
  }

  // try directories like [id]/...
  for (const e of entries) {
    if (e.startsWith("[") && e.endsWith("]")) {
      const candidateDir = path.join(dir, e);
      if (fs.existsSync(candidateDir) && fs.statSync(candidateDir).isDirectory()) {
        const deeper = findHandlerForSegments(rest, candidateDir);
        if (deeper) {
          const paramName = e.slice(1, -1);
          return { filePath: deeper.filePath, params: { [paramName]: seg, ...(deeper.params || {}) } };
        }
      }
    }
  }

  // fallback: if dir contains a file named index.js and seg is next segment (rare)
  return null;
}

function resolveHandlerFromReqPath(reqPath) {
  // remove leading /api/
  let p = reqPath.replace(/^\/+/, "");
  if (!p.startsWith("api/")) return null;
  p = p.slice(4); // remove 'api/'
  const segments = p.split("/").filter(Boolean);
  return findHandlerForSegments(segments, API_ROOT);
}

// main router
app.all("/api/*", async (req, res) => {
  try {
    const parsed = url.parse(req.url, true);
    // merge query params
    req.query = Object.assign(req.query || {}, parsed.query || {});

    const match = resolveHandlerFromReqPath(parsed.pathname || req.path);
    if (!match || !match.filePath) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    // attach path params into req.query if not present
    req.params = req.params || {};
    for (const k of Object.keys(match.params || {})) {
      // if name collision with existing query param, we don't overwrite
      if (!req.query[k]) req.query[k] = match.params[k];
      req.params[k] = match.params[k];
    }

    // dynamically require the handler module
    const modPath = match.filePath;
    // clear cache to allow hot-redeploy without restarting container in dev
    delete require.cache[require.resolve(modPath)];
    const handlerMod = require(modPath);

    // handler should be the default export or module.exports
    const handler = handlerMod && (handlerMod.default || handlerMod);

    if (typeof handler !== "function") {
      res.status(500).json({ error: "handler_not_function", path: modPath });
      return;
    }

    // many serverless handlers expect Node's req/res — Express's req/res are compatible for most usages.
    // call handler(req, res) and let it handle response.
    // If the handler returns a value (Promise), we will await it.
    const maybePromise = handler(req, res);
    if (maybePromise && typeof maybePromise.then === "function") {
      await maybePromise.catch((e) => {
        console.error("handler promise rejected:", e);
        if (!res.headersSent) res.status(500).json({ error: "handler_error", message: String(e) });
      });
    }
  } catch (err) {
    console.error("router error:", err);
    if (!res.headersSent) res.status(500).json({ error: err.message || "internal_error" });
  }
});

// fallback - serve 404 for other routes (we expect static site to be served by nginx)
app.use((req, res) => {
  res.status(404).send("Not found");
});

// start server
const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`API adapter listening on port ${PORT}`);
});
