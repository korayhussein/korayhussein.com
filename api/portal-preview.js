// Serverless Open Graph preview handler for client galleries & proofing suites.
// Handles clean URLs: /client-portal/:shootId, /portal/:shootId, /delivery/:shootId.
// Serves rich og:image (the exact client cover image), og:title, og:description, and Twitter Cards
// so that when links are pasted into Apple Mail, Gmail, WhatsApp, iMessage, Slack, etc.,
// the preview card displays that client's exact cover photo.
// Real human visitors are instantly redirected to the single-page app proofing suite.

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "korayhussein-proofing";
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyD0b76g_32uPjLpeezf3QSlTSbAEbSeXjs";
const SITE_ORIGIN = "https://korayhussein.com";
const DEFAULT_COVER = `${SITE_ORIGIN}/photos/splash/Bree%20Splash.jpg`;

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") return DEFAULT_COVER;
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_COVER;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const cleanPath = trimmed.replace(/^\/+/, "");
  const encodedPath = cleanPath
    .split("/")
    .map((seg) => encodeURIComponent(decodeURIComponent(seg)))
    .join("/");
  return `${SITE_ORIGIN}/${encodedPath}`;
}

export default async function handler(req, res) {
  const rawShootId = Array.isArray(req.query.shootId) ? req.query.shootId[0] : (req.query.shootId || "");
  const rawSub = Array.isArray(req.query.sub) ? req.query.sub[0] : (req.query.sub || "");
  
  // Clean inputs
  const shootId = String(rawShootId).trim();
  const subRoute = String(rawSub).trim().toLowerCase();

  // Reconstruct forwarded query string (preserving things like ?code=ABC123)
  const forwardedParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query || {})) {
    if (key !== "shootId" && key !== "sub" && value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((v) => forwardedParams.append(key, v));
      } else {
        forwardedParams.append(key, value);
      }
    }
  }
  const queryStr = forwardedParams.toString() ? `?${forwardedParams.toString()}` : "";

  // Check for admin / create route
  if (shootId === "create" || shootId === "admin") {
    const targetSpaUrl = `/#/client-portal/${shootId}${queryStr}`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=86400");
    return res.status(200).send(`<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <title>Client Shoot Studio | Koray Hussein</title>
  <meta name="robots" content="noindex, nofollow">
  <script>window.location.replace(${JSON.stringify(targetSpaUrl)});</script>
  <noscript><meta http-equiv="refresh" content="0;url=${escapeHtml(targetSpaUrl)}"></noscript>
</head>
<body style="background:#0a0a0a;color:#d1b48c;font-family:sans-serif;padding:30px;text-align:center;">
  <p>Opening Client Shoot Studio&hellip; <a href="${escapeHtml(targetSpaUrl)}" style="color:#d1b48c;">Click here if not redirected</a></p>
</body>
</html>`);
  }

  const isDelivery = subRoute === "delivery";
  const isAgency = subRoute === "agency";
  const isReview = subRoute === "review";

  let clientName = "";
  let shootTitle = "";
  let coverImage = "";

  // Built-in test shoots
  if (shootId === "asha" || shootId === "test-client") {
    clientName = "Asha";
    shootTitle = "Studio & Location Proofing";
    coverImage = `${SITE_ORIGIN}/proofs/test-client/colour/Asha-001.jpg`;
  } else if (shootId) {
    try {
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/client_shoots/${encodeURIComponent(shootId)}?key=${FIREBASE_API_KEY}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const fsRes = await fetch(firestoreUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (fsRes.ok) {
        const doc = await fsRes.json();
        const fields = doc.fields || {};
        clientName = fields.clientName?.stringValue || "";
        shootTitle = fields.shootTitle?.stringValue || "";

        if (fields.metadataJson?.stringValue) {
          try {
            const meta = JSON.parse(fields.metadataJson.stringValue);
            if (meta.clientName && !clientName) clientName = meta.clientName;
            if (meta.shootTitle && !shootTitle) shootTitle = meta.shootTitle;

            if (isDelivery && meta.deliveryCoverImage) {
              coverImage = meta.deliveryCoverImage;
            }
            if (!coverImage && meta.coverImage) {
              coverImage = meta.coverImage;
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn("Firestore fetch error for shootId:", shootId, err.message);
    }
  }

  // Fallbacks if not found
  if (!clientName) {
    clientName = shootId ? shootId.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Client";
  }

  const fullCoverImage = normalizeImageUrl(coverImage);
  const subSegment = subRoute ? `/${subRoute}` : "";
  const canonicalUrl = `${SITE_ORIGIN}/client-portal/${encodeURIComponent(shootId)}${subSegment}`;
  const targetSpaUrl = `/#/client-portal/${encodeURIComponent(shootId)}${subSegment}${queryStr}`;

  let pageTitle = "";
  let pageDesc = "";

  if (isDelivery) {
    pageTitle = `${clientName}${shootTitle ? " · " + shootTitle : ""} — Final Retouched Delivery | Koray Hussein`;
    pageDesc = `Your final retouched portrait gallery is ready. View and download high-resolution photographs.`;
  } else if (isAgency) {
    pageTitle = `${clientName}${shootTitle ? " · " + shootTitle : ""} — Agency & Casting Showcase | Koray Hussein`;
    pageDesc = `Agency and casting showcase for ${clientName}. View selections, looks, and portrait contact sheets.`;
  } else if (isReview) {
    pageTitle = `${clientName}${shootTitle ? " · " + shootTitle : ""} — Selections Review | Koray Hussein`;
    pageDesc = `Review your selected portraits and retouching notes for ${clientName}.`;
  } else {
    pageTitle = `${clientName}${shootTitle ? " · " + shootTitle : ""} — Private Proofing Suite | Koray Hussein`;
    pageDesc = `Private portrait proofing suite for ${clientName}. View proofs, select favourites, and leave custom retouching notes.`;
  }

  const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(pageDesc)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">

  <!-- Open Graph / WhatsApp / iMessage / Apple Mail / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Koray Hussein Photography">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(pageDesc)}">
  <meta property="og:image" content="${escapeHtml(fullCoverImage)}">
  <meta property="og:image:secure_url" content="${escapeHtml(fullCoverImage)}">
  <meta property="og:image:alt" content="${escapeHtml(clientName)}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(canonicalUrl)}">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(pageDesc)}">
  <meta name="twitter:image" content="${escapeHtml(fullCoverImage)}">
  <meta name="twitter:image:alt" content="${escapeHtml(clientName)}">

  <!-- Instant Browser Redirect to Single Page Proofing Suite -->
  <script>
    window.location.replace(${JSON.stringify(targetSpaUrl)});
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${escapeHtml(targetSpaUrl)}">
  </noscript>

  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #0a0a0a;
      color: #e5e5e5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 24px;
    }
    .preview-card {
      max-width: 440px;
      padding: 28px;
    }
    .preview-brand {
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #888;
      margin-bottom: 14px;
    }
    .preview-title {
      font-size: 19px;
      font-weight: 400;
      letter-spacing: 0.02em;
      color: #fafafa;
      margin: 0 0 16px;
      line-height: 1.4;
    }
    .preview-link {
      display: inline-block;
      color: #d1b48c;
      text-decoration: underline;
      font-size: 13px;
      letter-spacing: 0.04em;
    }
  </style>
</head>
<body>
  <div class="preview-card">
    <div class="preview-brand">Koray Hussein Photography</div>
    <div class="preview-title">Opening ${escapeHtml(clientName)}&rsquo;s Private Gallery&hellip;</div>
    <a href="${escapeHtml(targetSpaUrl)}" class="preview-link">Click here if not redirected automatically &rarr;</a>
  </div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=86400");
  return res.status(200).send(html);
}
