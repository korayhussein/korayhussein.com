// Photographer passkey verification (server-side).
// The passkey lives ONLY in the PHOTOGRAPHER_PASSKEY environment variable (Vercel → Settings → Environment Variables).
// POST { passkey: "..." } -> 200 { ok: true } | 401 { ok: false } | 503 { error: "not-configured" }

import crypto from "node:crypto";

function sha256(value) {
  return crypto.createHash("sha256").update(String(value), "utf8").digest();
}

// Constant-time comparison (hashing first makes both buffers the same length).
export function passkeysMatch(supplied, expected) {
  return crypto.timingSafeEqual(sha256(supplied), sha256(expected));
}

function send(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json");
  return res.status(status).json(body);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { ok: false, error: "Method not allowed" });
  }

  const expected = process.env.PHOTOGRAPHER_PASSKEY;
  if (!expected) {
    // Not set up yet: the site falls back to its previous behaviour so nobody is locked out.
    return send(res, 503, { ok: false, error: "not-configured" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  const supplied = body && typeof body.passkey === "string" ? body.passkey.trim() : "";

  if (supplied && supplied.length <= 200 && passkeysMatch(supplied, expected.trim())) {
    return send(res, 200, { ok: true });
  }

  // Small delay on failures to slow down guessing.
  await sleep(600);
  return send(res, 401, { ok: false });
}
