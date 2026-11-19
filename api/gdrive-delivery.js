// Google Drive Final Delivery Crawler & CORS Streaming Proxy (Edge Runtime)
// Crawls public/anyone-with-link Google Drive folders into Looks, Tones, Sub-Looks & Grid Layouts

export const config = {
  runtime: "edge"
};

function extractFolderId(rawInput) {
  if (!rawInput) return "";
  const str = String(rawInput).trim();
  const folderMatch = str.match(/\/folders\/([a-zA-Z0-9_-]+)/i);
  if (folderMatch && folderMatch[1]) return folderMatch[1];
  const idParamMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];
  if (/^[a-zA-Z0-9_-]{10,80}$/.test(str)) return str;
  return "";
}

function decodeHtmlEntities(str) {
  return String(str || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'");
}

function detectDeliveryTone(rawName) {
  if (!rawName) return null;
  const s = String(rawName).trim().toLowerCase().replace(/[^a-z0-9&+ -]/g, " ");
  if (/\b(bnw[ -]*faded?|faded?[ -]*bnw|bnwfaded|fadedbnw|faded|matte|vintage)\b/i.test(s)) {
    return { key: "bnw-faded", label: "Faded B&W", short: "FADED", order: 3 };
  }
  if (/\b(high[ -]*key|highkey)\b/i.test(s)) {
    return { key: "high-key", label: "High Key", short: "HIGH KEY", order: 4 };
  }
  if (/\b(bnw|b[&/]?w|bw|black[ -]*(and|&)[ -]*white|monochrome|mono|greyscale|grayscale)\b/i.test(s)) {
    return { key: "bnw", label: "Black & White", short: "BNW", order: 2 };
  }
  if (/\b(warm|sepia|golden)\b/i.test(s)) {
    return { key: "warm", label: "Warm Tone", short: "WARM", order: 5 };
  }
  if (/\b(colou?rs?|rgb|original|natural)\b/i.test(s)) {
    return { key: "colour", label: "Colour", short: "COLOUR", order: 1 };
  }
  return null;
}

function isGridFilename(filename) {
  return /(^|[\s_-])grid([\s_.-]|\d|$)/i.test(String(filename || ""));
}

function isSupportedImageFile(filename) {
  const fn = String(filename || "").trim();
  if (!fn || fn.startsWith(".") || /^thumbs\.db$/i.test(fn)) return false;
  if (/\.(zip|rar|7z|pdf|psd|psb|dng|cr2|cr3|nef|arw|raf|orf|rw2|xmp|txt|md)$/i.test(fn)) return false;
  return /\.(jpe?g|png|webp|avif|heic|tiff?|gif)$/i.test(fn) || !fn.includes(".");
}

function naturalSortStrings(a, b) {
  return String(a || "").localeCompare(String(b || ""), undefined, { numeric: true, sensitivity: "base" });
}

async function fetchEmbeddedFolderEntries(folderId) {
  const url = `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folderId)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; KorayHusseinGallery/1.0)"
    }
  });
  if (!res.ok) {
    throw new Error(`Google Drive folder request failed (${res.status}). Ensure folder sharing is set to "Anyone with the link".`);
  }
  const html = await res.text();
  if (/accounts\.google\.com\/ServiceLogin/i.test(html)) {
    throw new Error('This Google Drive folder is private. Change sharing to "Anyone with the link" to preview it.');
  }

  const re = /href="https:\/\/drive\.google\.com\/(drive\/folders\/|file\/d\/)([^"/?]+)[^"]*"[\s\S]*?<div class="flip-entry-title">([^<]+)<\/div>/g;
  const entries = [];
  const seen = new Set();
  let match;
  while ((match = re.exec(html)) !== null) {
    const isFolder = match[1].includes("folders");
    const id = match[2];
    const title = decodeHtmlEntities(match[3]).trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    entries.push({ isFolder, id, title });
  }
  entries.sort((a, b) => {
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
    return naturalSortStrings(a.title, b.title);
  });
  return entries;
}

async function crawlDriveTree(rootFolderId) {
  const collectedFiles = [];
  const queue = [{ folderId: rootFolderId, pathParts: [], depth: 0 }];
  const visited = new Set([rootFolderId]);
  const MAX_DEPTH = 4;
  const CONCURRENCY = 4;

  while (queue.length > 0) {
    const batch = queue.splice(0, CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (node) => {
        const entries = await fetchEmbeddedFolderEntries(node.folderId);
        return { node, entries };
      })
    );

    for (const { node, entries } of results) {
      for (const entry of entries) {
        if (entry.isFolder) {
          if (node.depth < MAX_DEPTH && !visited.has(entry.id)) {
            visited.add(entry.id);
            queue.push({
              folderId: entry.id,
              pathParts: [...node.pathParts, entry.title],
              depth: node.depth + 1
            });
          }
        } else if (isSupportedImageFile(entry.title)) {
          collectedFiles.push({
            fileId: entry.id,
            filename: entry.title,
            pathParts: node.pathParts
          });
        }
      }
    }
  }

  return collectedFiles;
}

function buildDeliveryCatalog(folderId, collectedFiles) {
  const toneCatalogMap = new Map();
  const looksMap = new Map();
  const gridsMap = new Map();

  const registerTone = (toneInfo) => {
    if (!toneCatalogMap.has(toneInfo.key)) {
      toneCatalogMap.set(toneInfo.key, toneInfo);
    }
  };

  for (const file of collectedFiles) {
    const folderParts = file.pathParts || [];
    let detectedTone = null;
    const lookSegments = [];
    let hasExplicitGridFolder = false;

    for (const part of folderParts) {
      const toneMatch = detectDeliveryTone(part);
      if (toneMatch) {
        detectedTone = toneMatch;
      } else if (/^grids?(\s*layouts?)?$/i.test(part.trim())) {
        hasExplicitGridFolder = true;
      } else {
        lookSegments.push(part.trim());
      }
    }

    const effectiveTone = detectedTone || { key: "colour", label: "Colour", short: "COLOUR", order: 1 };
    const lookTitle = lookSegments.length > 0 ? lookSegments.join(" · ") : "Final Edits";
    const lookKey = lookTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "look-1";
    const isGrid = hasExplicitGridFolder || isGridFilename(file.filename);

    registerTone(effectiveTone);

    const proxyOriginalUrl = `/api/gdrive-delivery?fileId=${encodeURIComponent(file.fileId)}&original=1`;
    const fileRecord = {
      fileId: file.fileId,
      filename: file.filename,
      toneKey: effectiveTone.key,
      toneLabel: effectiveTone.label,
      previewUrl: `/api/gdrive-delivery?fileId=${encodeURIComponent(file.fileId)}&sz=w1200`,
      fullPreviewUrl: `/api/gdrive-delivery?fileId=${encodeURIComponent(file.fileId)}&sz=w2000`,
      originalUrl: proxyOriginalUrl,
      downloadUrl: proxyOriginalUrl
    };

    if (isGrid) {
      const scopeTag = detectedTone ? "toned" : "root";
      const gridGroupKey = `${lookKey}::${scopeTag}::${file.filename.toLowerCase()}`;
      if (!gridsMap.has(gridGroupKey)) {
        gridsMap.set(gridGroupKey, {
          id: gridGroupKey,
          filename: file.filename,
          title: file.filename.replace(/\.[^.]+$/, ""),
          lookTitle,
          lookKey,
          tonesMap: new Map(),
          versions: {}
        });
      }
      const gEntry = gridsMap.get(gridGroupKey);
      gEntry.tonesMap.set(effectiveTone.key, effectiveTone);
      gEntry.versions[effectiveTone.key] = fileRecord;
    } else {
      if (!looksMap.has(lookKey)) {
        looksMap.set(lookKey, {
          id: lookKey,
          title: lookTitle,
          tonesMap: new Map(),
          itemsMap: new Map()
        });
      }
      const lookObj = looksMap.get(lookKey);
      lookObj.tonesMap.set(effectiveTone.key, effectiveTone);

      const baseKey = file.filename.toLowerCase();
      if (!lookObj.itemsMap.has(baseKey)) {
        lookObj.itemsMap.set(baseKey, {
          filename: file.filename,
          title: file.filename.replace(/\.[^.]+$/, ""),
          lookTitle,
          versions: {}
        });
      }
      lookObj.itemsMap.get(baseKey).versions[effectiveTone.key] = fileRecord;
    }
  }

  const sortTones = (arr) => arr.sort((a, b) => (a.order - b.order) || naturalSortStrings(a.label, b.label));

  const looks = Array.from(looksMap.values())
    .sort((a, b) => naturalSortStrings(a.title, b.title))
    .map((lookObj, idx) => {
      const lookTones = sortTones(Array.from(lookObj.tonesMap.values()));
      const toneKeysOrder = lookTones.map(t => t.key);
      const items = Array.from(lookObj.itemsMap.values())
        .sort((a, b) => naturalSortStrings(a.filename, b.filename))
        .map(item => {
          const itemToneKeys = toneKeysOrder.filter(k => !!item.versions[k]);
          return {
            filename: item.filename,
            title: item.title,
            lookTitle: item.lookTitle,
            defaultTone: itemToneKeys[0] || Object.keys(item.versions)[0] || "colour",
            toneKeys: itemToneKeys,
            versions: item.versions
          };
        });
      return {
        id: lookObj.id || `look-${idx + 1}`,
        title: lookObj.title,
        tones: lookTones,
        items
      };
    });

  const grids = Array.from(gridsMap.values())
    .sort((a, b) => {
      const lookCmp = naturalSortStrings(a.lookTitle, b.lookTitle);
      if (lookCmp !== 0) return lookCmp;
      return naturalSortStrings(a.filename, b.filename);
    })
    .map(g => {
      const gTones = sortTones(Array.from(g.tonesMap.values()));
      const gToneKeys = gTones.map(t => t.key);
      return {
        id: g.id,
        filename: g.filename,
        title: g.title,
        lookTitle: g.lookTitle,
        lookKey: g.lookKey,
        defaultTone: gToneKeys[0] || Object.keys(g.versions)[0] || "colour",
        toneKeys: gToneKeys,
        tones: gTones,
        versions: g.versions
      };
    });

  const availableTones = sortTones(Array.from(toneCatalogMap.values()));
  const totalPortraits = looks.reduce((sum, l) => sum + l.items.length, 0);

  return {
    folderId,
    folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
    availableTones,
    looks,
    grids,
    totalPortraits,
    totalGrids: grids.length,
    totalFiles: collectedFiles.length
  };
}

function sendJson(res, status, data, cacheControl) {
  if (res && typeof res.status === "function") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (cacheControl) res.setHeader("Cache-Control", cacheControl);
    return res.status(status).json(data);
  }
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      ...(cacheControl ? { "Cache-Control": cacheControl } : {})
    }
  });
}

async function handleProxyImage(req, res, fileId, rawSz, isOriginal) {
  if (!/^[a-zA-Z0-9_-]{10,80}$/.test(fileId)) {
    return sendJson(res, 400, { error: "Invalid fileId" });
  }
  const szMatch = String(rawSz || "w2000").match(/^w(\d{3,4})$/i);
  const clampedW = szMatch ? Math.min(2400, Math.max(400, parseInt(szMatch[1], 10))) : 2000;
  const upstreamUrl = isOriginal
    ? `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`
    : `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${clampedW}`;

  const upstream = await fetch(upstreamUrl, {
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; KorayHusseinGallery/1.0)"
    }
  });
  if (!upstream.ok) {
    return sendJson(res, upstream.status, { error: "Failed to fetch image from Google Drive" });
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  const contentLength = upstream.headers.get("content-length");
  const contentDisposition = upstream.headers.get("content-disposition");
  const cacheControl = isOriginal
    ? "private, max-age=3600, no-transform"
    : "public, max-age=86400, s-maxage=86400";

  const responseHeaders = {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Cache-Control": cacheControl
  };
  if (contentLength) responseHeaders["Content-Length"] = contentLength;
  if (contentDisposition && isOriginal) {
    responseHeaders["Content-Disposition"] = contentDisposition;
  }

  if (res && typeof res.status === "function") {
    Object.entries(responseHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.status(200);
    if (req.method === "HEAD") {
      if (upstream.body && upstream.body.cancel) await upstream.body.cancel();
      return res.end();
    }
    if (upstream.body && typeof upstream.body.getReader === "function") {
      const reader = upstream.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) res.write(value);
      }
      return res.end();
    }
    return res.end();
  }

  if (req.method === "HEAD") {
    if (upstream.body && upstream.body.cancel) await upstream.body.cancel();
    return new Response(null, { status: 200, headers: responseHeaders });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: responseHeaders
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    if (res && typeof res.status === "function") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      return res.status(204).end();
    }
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  try {
    const parsedUrl = new URL(req.url || "/", "https://korayhussein.com");
    const fileId = (parsedUrl.searchParams.get("fileId") || "").trim();
    if (fileId) {
      const sz = parsedUrl.searchParams.get("sz") || "w2000";
      const isOriginal = parsedUrl.searchParams.get("original") === "1";
      return await handleProxyImage(req, res, fileId, sz, isOriginal);
    }

    const rawFolder = parsedUrl.searchParams.get("folderId") || parsedUrl.searchParams.get("url") || "";
    const folderId = extractFolderId(rawFolder);
    if (!folderId) {
      return sendJson(res, 400, { error: "Missing or invalid Google Drive folder URL or folderId" });
    }

    const collectedFiles = await crawlDriveTree(folderId);
    if (!collectedFiles || collectedFiles.length === 0) {
      return sendJson(res, 404, {
        error: "No supported images found in that Google Drive folder. Check that sharing is set to 'Anyone with the link'."
      });
    }

    const catalog = buildDeliveryCatalog(folderId, collectedFiles);
    return sendJson(res, 200, catalog, "public, s-maxage=300, stale-while-revalidate=3600");
  } catch (err) {
    console.error("[gdrive-delivery] Error:", err);
    return sendJson(res, 500, { error: err.message || "Google Drive delivery lookup failed" });
  }
}
