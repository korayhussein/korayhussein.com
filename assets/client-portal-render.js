/* ==========================================================
   Client Portal Dynamic Renderer — Proofing & Multi-Version Selection
   - Clean minimalist cards: Heart in bottom-right corner
   - Slide-out "Leave note" button when liked
   - Bottom bar devoted to filename and version toggle [ COL | B&W | FADED ]
   - No clutter, no "Select" text
   - Quick note modal on card or Fullscreen Lightbox
   - Review drawer with dual clipboard copy (Detailed with notes vs Deduplicated filenames)
   ========================================================== */

(function() {
  "use strict";

  let activeShootId = null;
  let portalViewMode = "client"; // "client" | "agency"
  let globalTone = "colour"; // "colour" | "bw" | "faded-bw"
  let itemTones = {}; // filename -> "colour" | "bw" | "faded-bw"
  let itemNotes = {}; // filename -> note string
  let selectedMap = new Map(); // key `${filename}::${tone}` -> { id, filename, tone, src }
  let agencySelectedMap = new Map(); // key `${filename}::${tone}` -> { id, filename, tone, src }
  let agencyItemNotes = {}; // filename -> agency note string
  let agencyMeta = { bookerName: "", agencyNotes: "", savedAt: 0 };
  let rejectedSet = new Set(); // Set of rejected filenames
  let filterMode = "all"; // "all" | "selected" | "rejected" | "client-picks" | "agency-picks" | "matched"
  let hideRejected = false; // Toggle to hide rejected images from "all" view
  let showSelectedOnly = false;
  let isReviewModalOpen = false;
  let noteModalFilename = null;

  function isAgencyView() {
    return portalViewMode === "agency";
  }

  function getShootAgencyCode(shoot) {
    if (!shoot) return "AGENCY";
    if (shoot.agencyCode && String(shoot.agencyCode).trim()) {
      return String(shoot.agencyCode).trim().toUpperCase();
    }
    const base = (shoot.code || shoot.id || "SHOOT").trim().toUpperCase();
    return `${base}-AGENCY`;
  }

  function getShootUnlockedMode(shootId) {
    if (!shootId || typeof sessionStorage === "undefined") return "";
    try {
      const m = sessionStorage.getItem(`kh_shoot_unlock_${shootId}`);
      return (m === "client" || m === "agency") ? m : "";
    } catch (e) {
      return "";
    }
  }

  function setShootUnlockedMode(shootId, mode) {
    if (!shootId || typeof sessionStorage === "undefined") return;
    try {
      if (mode === "client" || mode === "agency") {
        sessionStorage.setItem(`kh_shoot_unlock_${shootId}`, mode);
      } else {
        sessionStorage.removeItem(`kh_shoot_unlock_${shootId}`);
      }
    } catch (e) {}
  }

  function clearShootUnlockedMode(shootId) {
    if (!shootId || typeof sessionStorage === "undefined") return;
    try {
      sessionStorage.removeItem(`kh_shoot_unlock_${shootId}`);
    } catch (e) {}
  }

  function buildPortalRouteHash(subPath) {
    const cleanSub = (subPath || "").replace(/^\/+/, "");
    if (typeof window !== "undefined" && typeof window.getCustomPageHref === "function") {
      return window.getCustomPageHref("client-portal", cleanSub);
    }
    return cleanSub ? `#/client-portal/${cleanSub}` : "#/client-portal";
  }

  function buildShootSplashUrl(shootId) {
    if (typeof window === "undefined" || !window.location) {
      return `https://korayhussein.com/client-portal/${encodeURIComponent(shootId || "")}`;
    }
    const origin = window.location.origin || `${window.location.protocol}//${window.location.host}`;
    return `${origin}/client-portal/${encodeURIComponent(shootId || "")}`;
  }

  function buildShootDeliveryUrl(shootId) {
    if (typeof window === "undefined" || !window.location) {
      return `https://korayhussein.com/client-portal/${encodeURIComponent(shootId || "")}/delivery`;
    }
    const origin = window.location.origin || `${window.location.protocol}//${window.location.host}`;
    return `${origin}/client-portal/${encodeURIComponent(shootId || "")}/delivery`;
  }

  function naturalSortFilenames(a, b) {
    const rawA = (typeof a === "string" ? a : (a && (a.filename || a.name || a.src || ""))).trim();
    const rawB = (typeof b === "string" ? b : (b && (b.filename || b.name || b.src || ""))).trim();
    const nameA = rawA.replace(/^.*[\\\/]/, "").toLowerCase();
    const nameB = rawB.replace(/^.*[\\\/]/, "").toLowerCase();
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
  }

  const TONE_DICTIONARY = {
    "colour": { label: "Colour", short: "COLOUR" },
    "color": { label: "Colour", short: "COLOUR" },
    "selects-colour": { label: "Colour", short: "COLOUR" },
    "selects-color": { label: "Colour", short: "COLOUR" },
    "selectscolour": { label: "Colour", short: "COLOUR" },
    "selectscolor": { label: "Colour", short: "COLOUR" },
    "selects_colour": { label: "Colour", short: "COLOUR" },
    "selects_color": { label: "Colour", short: "COLOUR" },
    "selects colour": { label: "Colour", short: "COLOUR" },
    "selects color": { label: "Colour", short: "COLOUR" },
    "selects-bnw": { label: "BNW", short: "BNW" },
    "selects-bw": { label: "BNW", short: "BNW" },
    "selectsbnw": { label: "BNW", short: "BNW" },
    "selects_bnw": { label: "BNW", short: "BNW" },
    "selects-faded": { label: "BNW Faded", short: "FADED" },
    "selects-bnw-faded": { label: "BNW Faded", short: "FADED" },
    "bnw": { label: "BNW", short: "BNW" },
    "bw": { label: "BNW", short: "BNW" },
    "black-and-white": { label: "BNW", short: "BNW" },
    "black-white": { label: "BNW", short: "BNW" },
    "bnw-faded": { label: "BNW Faded", short: "FADED" },
    "bnwfaded": { label: "BNW Faded", short: "FADED" },
    "faded-bnw": { label: "BNW Faded", short: "FADED" },
    "fadedbnw": { label: "BNW Faded", short: "FADED" },
    "faded-bw": { label: "BNW Faded", short: "FADED" },
    "faded": { label: "BNW Faded", short: "FADED" },
    "high-key": { label: "High Key", short: "HIGH KEY" },
    "matte": { label: "Matte", short: "MATTE" },
    "warm": { label: "Warm Tone", short: "WARM" },
    "sepia": { label: "Sepia", short: "SEPIA" }
  };

  function getToneLabel(toneKey, contextShoot) {
    if (!toneKey) return "Standard";
    const k = toneKey.toLowerCase().trim();

    // Check shoot or section customToneLabels first!
    const shoot = contextShoot || (activeShootId ? getShootById(activeShootId) : null);
    if (shoot) {
      if (shoot.customToneLabels && shoot.customToneLabels[k]) {
        return shoot.customToneLabels[k];
      }
      if (shoot.sections && Array.isArray(shoot.sections)) {
        for (const sec of shoot.sections) {
          if (sec.customToneLabels && sec.customToneLabels[k]) {
            return sec.customToneLabels[k];
          }
        }
      }
    }

    if (TONE_DICTIONARY[k]) return TONE_DICTIONARY[k].label;
    if (k.includes("faded")) return "BNW Faded";
    if (k.includes("bnw") || k.includes("b&w") || k.includes("bw") || k.includes("black")) return "BNW";
    if (k.includes("colou") || k.includes("color")) return "Colour";
    return toneKey.replace(/[_-]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  function getToneShort(toneKey, contextShoot) {
    if (!toneKey) return "STD";
    const k = toneKey.toLowerCase().trim();

    const shoot = contextShoot || (activeShootId ? getShootById(activeShootId) : null);
    if (shoot && shoot.customToneLabels && shoot.customToneLabels[k]) {
      const custom = shoot.customToneLabels[k].replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      return custom.length <= 6 ? custom : custom.substring(0, 5);
    }

    if (TONE_DICTIONARY[k]) return TONE_DICTIONARY[k].short;
    if (k.includes("faded")) return "FADED";
    if (k.includes("bnw") || k.includes("b&w") || k.includes("bw") || k.includes("black")) return "BNW";
    if (k.includes("colou") || k.includes("color")) return "COLOUR";
    const clean = toneKey.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return clean.length <= 6 ? clean : clean.substring(0, 5);
  }

  window.getClientPortalToneLabel = getToneLabel;
  window.getClientPortalToneShort = getToneShort;

  function makeKey(filename, tone) {
    return `${filename}::${tone}`;
  }

  function isToneSelected(filename, tone) {
    return selectedMap.has(makeKey(filename, tone));
  }

  function getSelectedTonesForFile(filename) {
    const tones = [];
    selectedMap.forEach((val, key) => {
      if (key.startsWith(`${filename}::`)) {
        tones.push(val.tone);
      }
    });
    return tones;
  }

  function isFileSelected(filename) {
    return getSelectedTonesForFile(filename).length > 0;
  }

  function getImageNote(filename) {
    return itemNotes[filename] || "";
  }

  function markLocalProofActivity(shootId, ts) {
    if (!shootId) return;
    try {
      localStorage.setItem(`kh_local_sync_ts_${shootId}`, String(ts || Date.now()));
    } catch (e) {}
  }

  function getLocalProofActivity(shootId) {
    if (!shootId) return 0;
    try {
      return parseInt(localStorage.getItem(`kh_local_sync_ts_${shootId}`) || "0", 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  function formatClientQuotaSummary(selectedCount, packageQuota) {
    const quota = Math.max(1, parseInt(packageQuota, 10) || 15);
    const count = Math.max(0, parseInt(selectedCount, 10) || 0);
    if (count <= quota) {
      return `${count} / ${quota} Package Picks${count === quota ? " \u2713" : ""}`;
    }
    const extras = count - quota;
    const cost = extras * 30;
    return `${quota} Package + ${extras} Extra${extras > 1 ? "s" : ""} (+\u00a3${cost}${extras >= 5 ? " \u00b7 Discount Eligible" : ""})`;
  }

  const DEFAULT_TFP_FAV_LIMIT = 10;
  const DEFAULT_TFP_GUIDE_TEXT = "Please mark your absolute favourite 10 images to definitely edit and then select others you like that I can go through and pick the best ones from.";

  function getTfpFavLimit(shoot) {
    return Math.max(1, parseInt(shoot && shoot.tfpFavouriteLimit, 10) || DEFAULT_TFP_FAV_LIMIT);
  }

  function getSelectionTier(filename, tone, map = selectedMap) {
    if (!map) return null;
    const item = map.get(makeKey(filename, tone));
    if (!item) return null;
    return item.tier === "like" ? "like" : "favourite";
  }

  function getFileSelectionTiers(filename, map = selectedMap) {
    let hasFavourite = false;
    let hasLike = false;
    if (map && typeof map.forEach === "function") {
      const prefix = `${filename}::`;
      map.forEach((val, key) => {
        if ((val && val.filename === filename) || String(key).startsWith(prefix)) {
          if (val && val.tier === "like") hasLike = true;
          else hasFavourite = true;
        }
      });
    }
    return { hasFavourite, hasLike, any: hasFavourite || hasLike };
  }

  function getTfpCounts(map = selectedMap) {
    let favourites = 0;
    let likes = 0;
    if (map && typeof map.forEach === "function") {
      map.forEach(item => {
        if (item && item.tier === "like") likes += 1;
        else favourites += 1;
      });
    }
    return { favourites, likes, total: favourites + likes };
  }

  function formatShootSelectionSummary(shoot, map = selectedMap) {
    if (shoot && shoot.isTfp) {
      const limit = getTfpFavLimit(shoot);
      const { favourites, likes } = getTfpCounts(map);
      return `\u2665 ${favourites}/${limit} Favourites \u00b7 \u2713 ${likes} ${likes === 1 ? "Like" : "Likes"}`;
    }
    return formatClientQuotaSummary(map ? map.size : 0, shoot && shoot.packageQuota);
  }

  function setImageNote(filename, note) {
    if (note && note.trim()) {
      itemNotes[filename] = note.trim();
    } else {
      delete itemNotes[filename];
    }
    saveNotes(activeShootId, itemNotes);
    if (activeShootId) autoSyncSelectionsToCloud(activeShootId);
  }

  // Retrieve stored selections & notes from localStorage
  function loadSelections(shootId) {
    try {
      const stored = localStorage.getItem(`kh_selections_multi_${shootId}`);
      if (stored) {
        const arr = JSON.parse(stored);
        const map = new Map();
        arr.forEach(item => map.set(item.id || makeKey(item.filename, item.tone), item));
        return map;
      }
    } catch (e) {}
    return new Map();
  }

  function saveSelections(shootId, map, fromCloud = false) {
    try {
      const arr = Array.from(map.values());
      localStorage.setItem(`kh_selections_multi_${shootId}`, JSON.stringify(arr));
      if (!fromCloud) markLocalProofActivity(shootId);
    } catch (e) {}
  }

  function loadRejected(shootId) {
    try {
      const stored = localStorage.getItem(`kh_rejected_${shootId}`);
      if (stored) return new Set(JSON.parse(stored));
    } catch (e) {}
    return new Set();
  }

  function saveRejected(shootId, set, fromCloud = false) {
    try {
      localStorage.setItem(`kh_rejected_${shootId}`, JSON.stringify(Array.from(set)));
      if (!fromCloud) markLocalProofActivity(shootId);
    } catch (e) {}
  }

  function isImageRejected(filename) {
    return rejectedSet.has(filename);
  }

  function toggleReject(filename) {
    if (rejectedSet.has(filename)) {
      rejectedSet.delete(filename);
    } else {
      rejectedSet.add(filename);
      // Remove any liked selections on this photo
      const keysToDelete = [];
      selectedMap.forEach((val, k) => {
        if (val.filename === filename) keysToDelete.push(k);
      });
      keysToDelete.forEach(k => selectedMap.delete(k));
      saveSelections(activeShootId, selectedMap);
    }
    saveRejected(activeShootId, rejectedSet);
    if (activeShootId) autoSyncSelectionsToCloud(activeShootId);
    return rejectedSet.has(filename);
  }

  function loadNotes(shootId) {
    try {
      const stored = localStorage.getItem(`kh_notes_${shootId}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  }

  function saveNotes(shootId, notes, fromCloud = false) {
    try {
      localStorage.setItem(`kh_notes_${shootId}`, JSON.stringify(notes));
      if (!fromCloud) markLocalProofActivity(shootId);
    } catch (e) {}
  }

  function loadSubmissionStatus(shootId) {
    try {
      const stored = localStorage.getItem(`kh_submission_${shootId}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  }

  function saveSubmissionStatus(shootId, status) {
    try {
      if (status) {
        localStorage.setItem(`kh_submission_${shootId}`, JSON.stringify(status));
      } else {
        localStorage.removeItem(`kh_submission_${shootId}`);
      }
    } catch (e) {}
  }

  function loadGeneralNotes(shootId) {
    try {
      return localStorage.getItem(`kh_general_notes_${shootId}`) || "";
    } catch (e) {}
    return "";
  }

  function saveGeneralNotes(shootId, notes) {
    try {
      if (notes && notes.trim()) {
        localStorage.setItem(`kh_general_notes_${shootId}`, notes.trim());
      } else {
        localStorage.removeItem(`kh_general_notes_${shootId}`);
      }
    } catch (e) {}
  }

  function loadClientNotifyEmail(shootId) {
    try {
      return (localStorage.getItem(`kh_notify_email_${shootId}`) || "").trim();
    } catch (e) {}
    return "";
  }

  function saveClientNotifyEmail(shootId, email, fromCloud = false) {
    try {
      const clean = String(email || "").trim();
      if (clean) {
        localStorage.setItem(`kh_notify_email_${shootId}`, clean);
      } else {
        localStorage.removeItem(`kh_notify_email_${shootId}`);
      }
      if (!fromCloud) markLocalProofActivity(shootId);
    } catch (e) {}
  }

  function isValidEmailAddress(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  // Agency / Casting Showcase helpers
  function isAgencyToneSelected(filename, tone) {
    return agencySelectedMap.has(makeKey(filename, tone));
  }

  function getAgencySelectedTonesForFile(filename) {
    const tones = [];
    agencySelectedMap.forEach((val, key) => {
      if (key.startsWith(`${filename}::`)) {
        tones.push(val.tone);
      }
    });
    return tones;
  }

  function isFileAgencySelected(filename) {
    return getAgencySelectedTonesForFile(filename).length > 0;
  }

  function getAgencyImageNote(filename) {
    return agencyItemNotes[filename] || "";
  }

  function setAgencyImageNote(filename, note) {
    if (note && note.trim()) {
      agencyItemNotes[filename] = note.trim();
    } else {
      delete agencyItemNotes[filename];
    }
    saveAgencyNotes(activeShootId, agencyItemNotes);
  }

  function loadAgencySelections(shootId) {
    try {
      const stored = localStorage.getItem(`kh_agency_selections_${shootId}`);
      if (stored) {
        const arr = JSON.parse(stored);
        const map = new Map();
        arr.forEach(item => map.set(item.id || makeKey(item.filename, item.tone), item));
        return map;
      }
    } catch (e) {}
    return new Map();
  }

  function saveAgencySelections(shootId, map) {
    try {
      const arr = Array.from(map.values());
      localStorage.setItem(`kh_agency_selections_${shootId}`, JSON.stringify(arr));
    } catch (e) {}
  }

  function loadAgencyNotes(shootId) {
    try {
      const stored = localStorage.getItem(`kh_agency_notes_${shootId}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  }

  function saveAgencyNotes(shootId, notes) {
    try {
      localStorage.setItem(`kh_agency_notes_${shootId}`, JSON.stringify(notes || {}));
    } catch (e) {}
  }

  function loadAgencyMeta(shootId) {
    try {
      const stored = localStorage.getItem(`kh_agency_meta_${shootId}`);
      if (stored) return { bookerName: "", agencyNotes: "", savedAt: 0, ...JSON.parse(stored) };
    } catch (e) {}
    return { bookerName: "", agencyNotes: "", savedAt: 0 };
  }

  function saveAgencyMeta(shootId, meta) {
    try {
      const clean = {
        bookerName: (meta && meta.bookerName ? String(meta.bookerName) : "").trim(),
        agencyNotes: (meta && meta.agencyNotes ? String(meta.agencyNotes) : "").trim(),
        savedAt: (meta && meta.savedAt) || 0
      };
      localStorage.setItem(`kh_agency_meta_${shootId}`, JSON.stringify(clean));
    } catch (e) {}
  }

  // Master Passkey Authentication (Verified server-side via /api/auth)
  async function verifyPhotographerPasskey(input) {
    const supplied = String(input || "").trim();
    if (!supplied) return false;
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey: supplied })
      });
      if (!res.ok) return false;
      const json = await res.json().catch(() => ({}));
      return !!json.ok;
    } catch (e) {
      return false;
    }
  }

  function isPhotographerAuth() {
    try {
      return localStorage.getItem("kh_photographer_auth") === "true";
    } catch (e) {}
    return false;
  }

  function setPhotographerAuth(authed) {
    try {
      if (authed) {
        localStorage.setItem("kh_photographer_auth", "true");
      } else {
        localStorage.removeItem("kh_photographer_auth");
      }
    } catch (e) {}
  }

  // Direct Review Link (Option 2 — Zero-Backend Link Sync)
  function encodeSelectionsPayload(shootId) {
    const selectedList = Array.from(selectedMap.values()).map(item => ({
      f: item.filename,
      t: item.tone,
      ...(item.tier === "like" ? { r: "like" } : {})
    }));
    const payload = {
      s: shootId,
      v: selectedList,
      n: itemNotes,
      g: loadGeneralNotes(shootId),
      ts: Date.now()
    };
    try {
      return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));
    } catch (e) {
      return "";
    }
  }

  function decodeAndImportSelectionsPayload(base64Str) {
    try {
      const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(base64Str))));
      const payload = JSON.parse(jsonStr);
      if (!payload || !payload.s) return null;
      const shootId = payload.s;
      const shoot = getShootById(shootId);
      if (!shoot) return null;

      const map = new Map();
      if (Array.isArray(payload.v)) {
        payload.v.forEach(item => {
          const k = makeKey(item.f, item.t);
          const imgObj = shoot.images.find(img => img.filename === item.f);
          map.set(k, {
            id: k,
            filename: item.f,
            tone: item.t,
            tier: item.r === "like" ? "like" : "favourite",
            src: imgObj ? resolveImageSrc(imgObj, item.t) : ""
          });
        });
      }
      saveSelections(shootId, map);

      if (payload.n && typeof payload.n === "object") {
        saveNotes(shootId, payload.n);
      }
      if (payload.g) {
        saveGeneralNotes(shootId, payload.g);
      }

      saveSubmissionStatus(shootId, {
        submitted: true,
        savedAt: payload.ts || Date.now(),
        count: map.size
      });

      return shootId;
    } catch (e) {
      return null;
    }
  }

  function buildSelectionShareUrl(shootId) {
    const payload = encodeSelectionsPayload(shootId);
    if (typeof window === "undefined" || !window.location) return "";
    const loc = window.location;
    const base = `${loc.protocol}//${loc.host}${loc.pathname}`;
    const portalHref = buildPortalRouteHash(`${shootId}/review?sel=${payload}`);
    return `${base}${portalHref}`;
  }

  function buildAgencyShareUrl(shootId) {
    if (typeof window === "undefined" || !window.location) return "";
    const loc = window.location;
    const base = `${loc.protocol}//${loc.host}${loc.pathname}`;
    const agencyHref = buildPortalRouteHash(`${shootId}/agency`);
    return `${base}${agencyHref}`;
  }

  // ==========================================================
  // Firebase Firestore Real-Time Cloud Sync (Option 1)
  // ==========================================================
  const FIREBASE_CONFIG = {
    apiKey: (typeof window !== "undefined" && window.SETTINGS && window.SETTINGS.firebase && window.SETTINGS.firebase.apiKey) || "AIzaSyD0b76g_32uPjLpeezf3QSlTSbAEbSeXjs",
    projectId: (typeof window !== "undefined" && window.SETTINGS && window.SETTINGS.firebase && window.SETTINGS.firebase.projectId) || "korayhussein-proofing"
  };

  function getFirestoreDocUrl(shootId) {
    const base = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/client_proofs`;
    return shootId ? `${base}/${encodeURIComponent(shootId)}?key=${FIREBASE_CONFIG.apiKey}` : `${base}?key=${FIREBASE_CONFIG.apiKey}`;
  }

  async function fetchRemoteProofPayload(shootId) {
    try {
      const res = await fetch(getFirestoreDocUrl(shootId), { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !data.fields) return null;
      const f = data.fields;
      const parsed = f.payloadJson && f.payloadJson.stringValue ? JSON.parse(f.payloadJson.stringValue) : {};
      return {
        submitted: f.submitted ? !!f.submitted.booleanValue : false,
        savedAt: f.savedAt ? parseInt(f.savedAt.integerValue, 10) : 0,
        clientNotes: f.clientNotes ? f.clientNotes.stringValue : "",
        parsed: parsed || {}
      };
    } catch (e) {
      return null;
    }
  }

  function serializeSelectionMapForCloud(map, notes) {
    return Array.from((map || new Map()).values()).map(item => ({
      id: item.id || makeKey(item.filename, item.tone),
      filename: item.filename,
      tone: item.tone,
      tier: item.tier === "like" ? "like" : "favourite",
      section: item.section || "",
      note: (notes && notes[item.filename]) || ""
    }));
  }

  // Save client shoot selections to Firebase Cloud (preserving agency data)
  async function saveSelectionsToCloud(shootId, map, notes, generalNotes, isSubmittedOverride) {
    try {
      const arr = serializeSelectionMapForCloud(map, notes);
      const localAgencyMap = loadAgencySelections(shootId);
      const localAgencyNotes = loadAgencyNotes(shootId);
      const localAgencyMeta = loadAgencyMeta(shootId);
      let agencyArr = serializeSelectionMapForCloud(localAgencyMap, localAgencyNotes);
      let agNotes = localAgencyNotes || {};
      let agMeta = localAgencyMeta || { bookerName: "", agencyNotes: "", savedAt: 0 };

      if (agencyArr.length === 0 && (!agMeta || !agMeta.savedAt)) {
        const remote = await fetchRemoteProofPayload(shootId);
        if (remote && remote.parsed) {
          if (Array.isArray(remote.parsed.agencySelections) && remote.parsed.agencySelections.length > 0) {
            agencyArr = remote.parsed.agencySelections;
          }
          if (remote.parsed.agencyNotes) agNotes = remote.parsed.agencyNotes;
          if (remote.parsed.agencyMeta) agMeta = remote.parsed.agencyMeta;
        }
      }

      const curSub = loadSubmissionStatus(shootId);
      const submittedVal = typeof isSubmittedOverride === "boolean"
        ? isSubmittedOverride
        : !!(curSub && curSub.submitted);
      const rejectedArr = Array.from(loadRejected(shootId));

      const nowTs = Date.now();
      const clientNotifyEmail = loadClientNotifyEmail(shootId);
      const payload = {
        selections: arr,
        notes: notes || {},
        generalNotes: generalNotes || "",
        clientNotifyEmail: clientNotifyEmail,
        rejected: rejectedArr,
        savedAt: nowTs,
        agencySelections: agencyArr,
        agencyNotes: agNotes,
        agencyMeta: agMeta
      };

      const docBody = {
        fields: {
          shootId: { stringValue: shootId },
          submitted: { booleanValue: submittedVal },
          count: { integerValue: String(arr.length) },
          savedAt: { integerValue: String(nowTs) },
          clientNotes: { stringValue: generalNotes || "" },
          clientNotifyEmail: { stringValue: clientNotifyEmail },
          agencyCount: { integerValue: String(agencyArr.length) },
          agencySavedAt: { integerValue: String((agMeta && agMeta.savedAt) || 0) },
          agencyBooker: { stringValue: (agMeta && agMeta.bookerName) || "" },
          payloadJson: { stringValue: JSON.stringify(payload) }
        }
      };

      const res = await fetch(getFirestoreDocUrl(shootId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docBody)
      });

      if (res.ok) {
        markLocalProofActivity(shootId, nowTs);
      }

      return res.ok;
    } catch (e) {
      console.warn("Firestore save error:", e);
      return false;
    }
  }

  // Save Agency View picks & casting notes to Firebase Cloud (preserving client selections)
  async function saveAgencySelectionsToCloud(shootId, agMap, agNotes, meta) {
    try {
      const agencyArr = serializeSelectionMapForCloud(agMap, agNotes);
      const savedTs = Date.now();
      const cleanMeta = {
        bookerName: (meta && meta.bookerName ? String(meta.bookerName) : "").trim(),
        agencyNotes: (meta && meta.agencyNotes ? String(meta.agencyNotes) : "").trim(),
        savedAt: savedTs
      };

      const localClientMap = loadSelections(shootId);
      const localClientNotes = loadNotes(shootId);
      const localGeneralNotes = loadGeneralNotes(shootId);
      const localSub = loadSubmissionStatus(shootId);

      let clientArr = serializeSelectionMapForCloud(localClientMap, localClientNotes);
      let cNotes = localClientNotes || {};
      let cGeneral = localGeneralNotes || "";
      let cSubmitted = !!(localSub && localSub.submitted);
      let cSavedAt = (localSub && localSub.savedAt) || 0;
      let cNotifyEmail = loadClientNotifyEmail(shootId);

      if (clientArr.length === 0 || !cNotifyEmail) {
        const remote = await fetchRemoteProofPayload(shootId);
        if (remote && remote.parsed) {
          if (clientArr.length === 0) {
            if (Array.isArray(remote.parsed.selections)) clientArr = remote.parsed.selections;
            if (remote.parsed.notes) cNotes = remote.parsed.notes;
            if (remote.parsed.generalNotes) cGeneral = remote.parsed.generalNotes;
            if (remote.submitted) cSubmitted = true;
            if (remote.savedAt) cSavedAt = remote.savedAt;
          }
          if (!cNotifyEmail && remote.parsed.clientNotifyEmail) {
            cNotifyEmail = String(remote.parsed.clientNotifyEmail).trim();
          }
        }
      }

      const payload = {
        selections: clientArr,
        notes: cNotes,
        generalNotes: cGeneral,
        clientNotifyEmail: cNotifyEmail,
        savedAt: cSavedAt || savedTs,
        agencySelections: agencyArr,
        agencyNotes: agNotes || {},
        agencyMeta: cleanMeta
      };

      const docBody = {
        fields: {
          shootId: { stringValue: shootId },
          submitted: { booleanValue: cSubmitted },
          count: { integerValue: String(clientArr.length) },
          savedAt: { integerValue: String(cSavedAt || savedTs) },
          clientNotes: { stringValue: cGeneral || "" },
          clientNotifyEmail: { stringValue: cNotifyEmail },
          agencyCount: { integerValue: String(agencyArr.length) },
          agencySavedAt: { integerValue: String(savedTs) },
          agencyBooker: { stringValue: cleanMeta.bookerName },
          payloadJson: { stringValue: JSON.stringify(payload) }
        }
      };

      const res = await fetch(getFirestoreDocUrl(shootId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docBody)
      });

      return res.ok;
    } catch (e) {
      console.warn("Firestore agency save error:", e);
      return false;
    }
  }

  function setCloudSyncIndicator(state, text) {
    if (typeof document === "undefined") return;
    document.querySelectorAll("#portal-cloud-sync-status").forEach(el => {
      el.classList.remove("is-syncing", "is-synced", "is-error");
      if (state) el.classList.add(state);
      el.textContent = text;
    });
  }

  let autoSyncSelectionsTimer = null;
  function autoSyncSelectionsToCloud(shootId) {
    if (!shootId) return;
    setCloudSyncIndicator("is-syncing", "Syncing...");
    if (autoSyncSelectionsTimer) clearTimeout(autoSyncSelectionsTimer);
    autoSyncSelectionsTimer = setTimeout(async () => {
      const ok = await saveSelectionsToCloud(shootId, selectedMap, itemNotes, loadGeneralNotes(shootId));
      setCloudSyncIndicator(ok ? "is-synced" : "is-error", ok ? "Saved to cloud \u2713" : "Saved locally");
    }, 750);
  }

  async function sendClientSelectionsEmailAlert(shoot, map, notesObj, generalNotes, isUpdate) {
    if (!shoot || !map) return false;
    const list = Array.from(map.values()).sort(naturalSortFilenames);
    const isTfp = !!shoot.isTfp;
    const favLimit = getTfpFavLimit(shoot);
    const quota = Math.max(1, parseInt(shoot.packageQuota, 10) || 15);
    const quotaSummary = isTfp
      ? formatShootSelectionSummary(shoot, map)
      : formatClientQuotaSummary(list.length, quota);
    const baseOrigin = (typeof window !== "undefined" && window.location && /^https?:/.test(window.location.origin))
      ? `${window.location.origin}/`
      : "https://korayhussein.com/";
    const portalBaseSlug = (typeof window !== "undefined" && typeof window.getCustomPageSlug === "function")
      ? window.getCustomPageSlug("client-portal")
      : "client-portal";
    const reviewUrl = `${baseOrigin}#/${portalBaseSlug}/${shoot.id}/review`;

    const formatLine = (item, idx) => {
      const toneLab = getToneLabel(item.tone, shoot);
      const imgNote = (notesObj && notesObj[item.filename]) ? ` — Note: "${notesObj[item.filename]}"` : "";
      return `${idx + 1}. ${item.filename} (${toneLab})${imgNote}`;
    };

    const notifyEmail = loadClientNotifyEmail(shoot.id) || shoot.clientNotifyEmail || "";
    let msgParts;
    let subject;

    if (isTfp) {
      const favs = list.filter(item => item.tier !== "like");
      const likes = list.filter(item => item.tier === "like");
      const favLines = favs.map(formatLine);
      const likeLines = likes.map(formatLine);
      subject = `${isUpdate ? "Updated" : "New"} TFP Selections: ${shoot.clientName} (${favs.length} ♥ Favourites + ${likes.length} ✓ Likes)`;
      msgParts = [
        `Shoot: ${shoot.clientName} — ${shoot.shootTitle || shoot.id} (TFP Shoot)`,
        `Selection Summary: ${quotaSummary}`,
        notifyEmail ? `Client Notification Email: ${notifyEmail}` : "",
        generalNotes ? `\nOverall Session Notes:\n${generalNotes}` : "",
        `\n\u2665 Top ${favLimit} Favourites \u2014 Definitely Edit (${favs.length}):\n${favLines.length ? favLines.join("\n") : "(None marked yet)"}`,
        `\n\u2713 Other Liked Images \u2014 Pick Best From (${likes.length}):\n${likeLines.length ? likeLines.join("\n") : "(None selected yet)"}`,
        `\nOpen Selected Proofs:\n${reviewUrl}`
      ].filter(Boolean);
    } else {
      const lines = list.map(formatLine);
      subject = `${isUpdate ? "Updated" : "New"} Client Selections: ${shoot.clientName} (${list.length} picks)`;
      msgParts = [
        `Shoot: ${shoot.clientName} — ${shoot.shootTitle || shoot.id}`,
        `Package Quota Summary: ${quotaSummary}`,
        notifyEmail ? `Client Notification Email: ${notifyEmail}` : "",
        generalNotes ? `\nOverall Session Notes:\n${generalNotes}` : "",
        `\nSelected Deliverable Files (${list.length}):\n${lines.join("\n")}`,
        `\nOpen Selected Proofs:\n${reviewUrl}`
      ].filter(Boolean);
    }

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: "client-portal",
          subject: subject,
          name: shoot.clientName || "Client",
          email: notifyEmail,
          review_url: reviewUrl,
          "Shoot Session": shoot.shootTitle || shoot.id,
          "Selections Total": quotaSummary,
          ...(notifyEmail ? { "Client Notification Email": notifyEmail } : {}),
          "Access Code": shoot.code || "",
          "Review Gallery": reviewUrl,
          message: msgParts.join("\n")
        })
      });
      return res.ok;
    } catch (e) {
      console.warn("Selection alert email failed:", e);
      return false;
    }
  }

  async function sendClientDeliveryReadyEmail(shoot, recipientEmail) {
    const cleanEmail = String(recipientEmail || "").trim();
    if (!shoot || !isValidEmailAddress(cleanEmail)) {
      return { ok: false, error: "Please enter a valid client e-mail address." };
    }
    const baseOrigin = (typeof window !== "undefined" && window.location && /^https?:/.test(window.location.origin))
      ? `${window.location.origin}/`
      : "https://korayhussein.com/";
    const portalBaseSlug = (typeof window !== "undefined" && typeof window.getCustomPageSlug === "function")
      ? window.getCustomPageSlug("client-portal")
      : "client-portal";
    const codeQuery = shoot.code ? `?code=${encodeURIComponent(shoot.code)}` : "";
    const deliveryUrl = `${baseOrigin}${portalBaseSlug}/${encodeURIComponent(shoot.id)}/delivery${codeQuery}`;

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "delivery-ready",
          client_email: cleanEmail,
          name: shoot.clientName || "there",
          shoot_title: shoot.shootTitle || shoot.deliveryHeading || "your shoot",
          access_code: shoot.code || "",
          delivery_url: deliveryUrl,
          ...(shoot.deliveryEmailSubject ? { subject: shoot.deliveryEmailSubject } : {}),
          ...(shoot.deliveryEmailHeading ? { email_heading: shoot.deliveryEmailHeading } : {}),
          ...(shoot.deliveryEmailBody ? { custom_message: shoot.deliveryEmailBody } : {}),
          ...(shoot.deliveryEmailFooter ? { footer_note: shoot.deliveryEmailFooter } : {})
        })
      });
      const json = await res.json().catch(() => ({}));
      return { ok: res.ok && !!json.success, ...json };
    } catch (e) {
      return { ok: false, error: e.message || "Network error sending email" };
    }
  }

  let autoSyncAgencyTimer = null;
  function autoSyncAgencyToCloud(shootId) {
    if (!shootId) return;
    if (autoSyncAgencyTimer) clearTimeout(autoSyncAgencyTimer);
    autoSyncAgencyTimer = setTimeout(() => {
      saveAgencySelectionsToCloud(shootId, agencySelectedMap, agencyItemNotes, agencyMeta);
    }, 450);
  }

  function hydrateCloudSelectionMap(shootId, arr) {
    const shoot = getShootById(shootId);
    const map = new Map();
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        const imgObj = shoot ? shoot.images.find(img => img.filename === item.filename) : null;
        const k = item.id || makeKey(item.filename, item.tone);
        map.set(k, {
          id: k,
          filename: item.filename,
          tone: item.tone,
          tier: item.tier === "like" ? "like" : "favourite",
          section: item.section || (imgObj ? imgObj.section || "" : ""),
          src: imgObj ? resolveImageSrc(imgObj, item.tone) : ""
        });
      });
    }
    return map;
  }

  // Load single shoot selections from Firebase Cloud
  async function loadShootFromCloud(shootId) {
    try {
      const res = await fetch(getFirestoreDocUrl(shootId));
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !data.fields) return null;

      const f = data.fields;
      const isSubmitted = f.submitted ? f.submitted.booleanValue : false;
      const count = f.count ? parseInt(f.count.integerValue, 10) : 0;
      const savedAt = f.savedAt ? parseInt(f.savedAt.integerValue, 10) : Date.now();
      const clientNotes = f.clientNotes ? f.clientNotes.stringValue : "";
      const agencyCount = f.agencyCount ? parseInt(f.agencyCount.integerValue, 10) : 0;
      const jsonStr = f.payloadJson ? f.payloadJson.stringValue : "";

      let hasAgencyData = false;
      let hasClientData = false;
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        const cloudTs = (parsed && parsed.savedAt) ? parsed.savedAt : savedAt;
        const localTs = getLocalProofActivity(shootId);
        const shouldHydrateClient = !localTs || cloudTs >= localTs;

        if (shouldHydrateClient) {
          if (parsed.selections && Array.isArray(parsed.selections)) {
            const map = hydrateCloudSelectionMap(shootId, parsed.selections);
            saveSelections(shootId, map, true);
            if (map.size > 0) hasClientData = true;
          }
          if (parsed.notes) {
            saveNotes(shootId, parsed.notes, true);
            if (Object.keys(parsed.notes).length > 0) hasClientData = true;
          }
          if (parsed.generalNotes !== undefined) {
            saveGeneralNotes(shootId, parsed.generalNotes);
            if (parsed.generalNotes) hasClientData = true;
          }
          const cloudNotify = (parsed.clientNotifyEmail !== undefined ? parsed.clientNotifyEmail : (f.clientNotifyEmail ? f.clientNotifyEmail.stringValue : "")) || "";
          if (cloudNotify) {
            saveClientNotifyEmail(shootId, cloudNotify, true);
            hasClientData = true;
          }
          if (Array.isArray(parsed.rejected)) {
            saveRejected(shootId, new Set(parsed.rejected), true);
            if (parsed.rejected.length > 0) hasClientData = true;
          }
        }

        if (parsed.agencySelections && Array.isArray(parsed.agencySelections)) {
          const agMap = hydrateCloudSelectionMap(shootId, parsed.agencySelections);
          saveAgencySelections(shootId, agMap);
          hasAgencyData = agMap.size > 0;
        }
        if (parsed.agencyNotes && typeof parsed.agencyNotes === "object") {
          saveAgencyNotes(shootId, parsed.agencyNotes);
        }
        if (parsed.agencyMeta && typeof parsed.agencyMeta === "object") {
          saveAgencyMeta(shootId, parsed.agencyMeta);
          if (parsed.agencyMeta.savedAt) hasAgencyData = true;
        }
      }

      if (isSubmitted) {
        saveSubmissionStatus(shootId, {
          submitted: true,
          savedAt: savedAt,
          count: count
        });
      }

      return { isSubmitted, count, savedAt, clientNotes, agencyCount, hasAgencyData, hasClientData };
    } catch (e) {
      console.warn("Firestore load shoot error:", e);
      return null;
    }
  }

  // Fetch all shoots from Firebase Cloud (Photographer Dashboard sync)
  async function syncAllShootsFromCloud(onUpdated) {
    try {
      const res = await fetch(getFirestoreDocUrl());
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !Array.isArray(data.documents)) return;

      let anyChanged = false;
      data.documents.forEach(doc => {
        if (!doc.fields) return;
        const f = doc.fields;
        const shootId = f.shootId ? f.shootId.stringValue : null;
        if (!shootId) return;

        const isSubmitted = f.submitted ? f.submitted.booleanValue : false;
        const count = f.count ? parseInt(f.count.integerValue, 10) : 0;
        const savedAt = f.savedAt ? parseInt(f.savedAt.integerValue, 10) : Date.now();
        const jsonStr = f.payloadJson ? f.payloadJson.stringValue : "";

        if (jsonStr) {
          try {
            const parsed = JSON.parse(jsonStr);
            const cloudTs = (parsed && parsed.savedAt) ? parsed.savedAt : savedAt;
            const localTs = getLocalProofActivity(shootId);
            if (!localTs || cloudTs >= localTs) {
              if (parsed.selections && Array.isArray(parsed.selections)) {
                const map = hydrateCloudSelectionMap(shootId, parsed.selections);
                saveSelections(shootId, map, true);
              }
              if (parsed.notes) saveNotes(shootId, parsed.notes, true);
              if (parsed.generalNotes !== undefined) saveGeneralNotes(shootId, parsed.generalNotes);
              const syncNotify = (parsed.clientNotifyEmail !== undefined ? parsed.clientNotifyEmail : (f.clientNotifyEmail ? f.clientNotifyEmail.stringValue : "")) || "";
              if (syncNotify) saveClientNotifyEmail(shootId, syncNotify, true);
              if (Array.isArray(parsed.rejected)) saveRejected(shootId, new Set(parsed.rejected), true);
            }

            if (parsed.agencySelections && Array.isArray(parsed.agencySelections)) {
              const agMap = hydrateCloudSelectionMap(shootId, parsed.agencySelections);
              saveAgencySelections(shootId, agMap);
              if (agMap.size > 0) anyChanged = true;
            }
            if (parsed.agencyNotes && typeof parsed.agencyNotes === "object") {
              saveAgencyNotes(shootId, parsed.agencyNotes);
            }
            if (parsed.agencyMeta && typeof parsed.agencyMeta === "object") {
              saveAgencyMeta(shootId, parsed.agencyMeta);
              if (parsed.agencyMeta.savedAt) anyChanged = true;
            }
          } catch (e) {}
        }

        if (isSubmitted) {
          saveSubmissionStatus(shootId, {
            submitted: true,
            savedAt: savedAt,
            count: count
          });
          anyChanged = true;
        }
      });

      if (anyChanged && typeof onUpdated === "function") {
        onUpdated();
      }
    } catch (e) {
      console.warn("Firestore syncAllShoots error:", e);
    }
  }

  /* ---------------------------------------------------------
     0. IndexedDB & Local/Cloud Storage for Custom Client Galleries
     --------------------------------------------------------- */
  const IDB_NAME = "KH_ClientPortal_DB";
  const IDB_STORE = "images_store";
  const CUSTOM_SHOOTS_KEY = "portal_custom_shoots_list";
  const blobUrlCache = {};
  let idbInstance = null;

  function openIndexedDb() {
    if (idbInstance) return Promise.resolve(idbInstance);
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        return resolve(null);
      }
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = (e) => {
        idbInstance = e.target.result;
        resolve(idbInstance);
      };
      req.onerror = () => resolve(null);
    });
  }

  async function saveImageBlob(key, blob) {
    const db = await openIndexedDb();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, "readwrite");
        const store = tx.objectStore(IDB_STORE);
        const req = store.put(blob, key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => {
          // Fallback if putting File directly failed (e.g. Safari WebKit DataCloneError)
          try {
            if (blob && typeof blob.slice === "function") {
              const pureBlob = blob.slice(0, blob.size, blob.type || "image/jpeg");
              const tx2 = db.transaction(IDB_STORE, "readwrite");
              const req2 = tx2.objectStore(IDB_STORE).put(pureBlob, key);
              req2.onsuccess = () => resolve(true);
              req2.onerror = () => resolve(false);
            } else {
              resolve(false);
            }
          } catch (e) {
            resolve(false);
          }
        };
      } catch (e) {
        resolve(false);
      }
    });
  }

  async function getImageBlob(key) {
    const db = await openIndexedDb();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, "readonly");
        const req = tx.objectStore(IDB_STORE).get(key);
        req.onsuccess = () => {
          const res = req.result;
          if (!res) return resolve(null);
          if (res instanceof Blob) return resolve(res);
          if (res instanceof ArrayBuffer) return resolve(new Blob([res], { type: "image/jpeg" }));
          resolve(res);
        };
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  // Reactive DOM updater: as soon as any image blob is decoded from IndexedDB, immediately push live URL to DOM
  function updateDomImagesForBlobKey(blobKey, blobUrl) {
    if (!blobKey || !blobUrl) return;
    if (typeof document === "undefined") return;

    // 1. Proof cards in shoot gallery
    document.querySelectorAll(`img.portal-proof-img[data-blob-key="${blobKey}"]`).forEach(img => {
      if (!img.src || img.src.includes("blobKey:") || img.src !== blobUrl) {
        img.src = blobUrl;
      }
    });

    // 2. Thumbnails in gallery builder
    document.querySelectorAll(`img.portal-thumb-img[data-blob-key="${blobKey}"]`).forEach(img => {
      if (!img.src || img.src.includes("blobKey:") || img.src !== blobUrl) {
        img.src = blobUrl;
      }
    });

    // 3. Shoot cover card on master dashboard / landing screen
    document.querySelectorAll(`.portal-shoot-cover-img[data-blob-key="${blobKey}"]`).forEach(img => {
      if (!img.src || img.src.includes("blobKey:") || img.src !== blobUrl) {
        img.src = blobUrl;
      }
    });

    // 4. Review cards
    document.querySelectorAll(`img.portal-review-img[data-blob-key="${blobKey}"]`).forEach(img => {
      if (!img.src || img.src.includes("blobKey:") || img.src !== blobUrl) {
        img.src = blobUrl;
      }
    });
  }

  function getBlobKeyForImage(imgObj, tone) {
    if (!imgObj) return "";
    if (tone && imgObj.versions && imgObj.versions[tone]) {
      const v = imgObj.versions[tone];
      if (typeof v === "string" && v.startsWith("blobKey:")) return v.replace("blobKey:", "");
    }
    if (imgObj.versions && typeof imgObj.versions === "object") {
      for (const t of Object.keys(imgObj.versions)) {
        const v = imgObj.versions[t];
        if (typeof v === "string" && v.startsWith("blobKey:")) return v.replace("blobKey:", "");
      }
    }
    if (imgObj.blobKey) return imgObj.blobKey;
    return "";
  }

  function getShootCoverBlobKey(shoot) {
    if (!shoot) return "";
    if (shoot.coverBlobKey) return shoot.coverBlobKey;
    if (shoot.sections && Array.isArray(shoot.sections)) {
      for (const sec of shoot.sections) {
        if (sec.images && sec.images.length > 0) {
          const firstImg = sec.images[0];
          const k = getBlobKeyForImage(firstImg);
          if (k) return k;
        }
      }
    }
    if (shoot.images && shoot.images.length > 0) {
      const k = getBlobKeyForImage(shoot.images[0]);
      if (k) return k;
    }
    return "";
  }

  async function fileToCompressedDataUrl(file, maxDim = 2400, quality = 0.90) {
    if (!file) return "";

    // 1. Modern createImageBitmap (Hardware accelerated, auto-oriented, decodes HEIC on iOS 17+)
    if (typeof createImageBitmap === "function") {
      try {
        const bmp = await createImageBitmap(file);
        let w = bmp.width;
        let h = bmp.height;
        if (w > maxDim || h > maxDim) {
          if (w >= h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(bmp, 0, 0, w, h);
          if (typeof bmp.close === "function") bmp.close();
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          if (dataUrl && dataUrl.length > 50) return dataUrl;
        }
      } catch (bmpErr) {}
    }

    // 2. Image element with URL.createObjectURL
    return new Promise((resolve) => {
      let objectUrl = "";
      try {
        objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          try {
            let w = img.naturalWidth || img.width;
            let h = img.naturalHeight || img.height;
            if (w > maxDim || h > maxDim) {
              if (w >= h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
              URL.revokeObjectURL(objectUrl);
              resolve(canvas.toDataURL("image/jpeg", quality));
              return;
            }
          } catch (e2) {}
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          resolve("");
        };
        img.onerror = () => {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          // 3. Fallback FileReader
          try {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img2 = new Image();
              img2.onload = () => {
                const canvas = document.createElement("canvas");
                let w = img2.width;
                let h = img2.height;
                if (w > maxDim || h > maxDim) {
                  if (w >= h) { h = Math.round((h * maxDim) / w); w = maxDim; }
                  else { w = Math.round((w * maxDim) / h); h = maxDim; }
                }
                canvas.width = w;
                canvas.height = h;
                const ctx2 = canvas.getContext("2d");
                if (ctx2) {
                  ctx2.drawImage(img2, 0, 0, w, h);
                  resolve(canvas.toDataURL("image/jpeg", quality));
                  return;
                }
                resolve("");
              };
              img2.onerror = () => resolve("");
              img2.src = e.target.result;
            };
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
          } catch (e3) {
            resolve("");
          }
        };
        img.src = objectUrl;
      } catch (err) {
        if (objectUrl) {
          try { URL.revokeObjectURL(objectUrl); } catch(e4) {}
        }
        resolve("");
      }
    });
  }

  function getShootCoverSrc(shoot) {
    if (!shoot) return "proofs/test-client/colour/Asha-001.jpg";
    // 1. Permanent image URL (server path or cross-device base64 data URL) — guaranteed identical on desktop & mobile
    if (shoot.coverImage && 
        !shoot.coverImage.startsWith("blob:") && 
        !shoot.coverImage.startsWith("blobKey:") && 
        shoot.coverImage !== "photos/sets/bree/001_hero.jpg") {
      return shoot.coverImage;
    }

    // 2. Extract real filename & tone from coverFilename or coverBlobKey
    let filename = shoot.coverFilename || "";
    let tone = shoot.coverTone || "colour";
    if (!filename && shoot.coverBlobKey) {
      const m = String(shoot.coverBlobKey).match(/([A-Za-z0-9_\-]+\.(jpg|jpeg|png|webp))$/i);
      if (m) filename = m[1];
      if (shoot.coverBlobKey.includes("bnw") || shoot.coverBlobKey.includes("bw")) {
        tone = shoot.coverBlobKey.includes("faded") ? "faded-bw" : "bw";
      }
    }

    // 3. Extract from first photo in shoot
    if (!filename) {
      if (shoot.sections && Array.isArray(shoot.sections)) {
        for (const sec of shoot.sections) {
          if (sec.images && sec.images.length > 0) {
            const first = sec.images[0];
            filename = first.filename || "";
            break;
          }
        }
      }
      if (!filename && shoot.images && shoot.images.length > 0) {
        filename = shoot.images[0].filename || "";
      }
    }

    if (filename) {
      const toneFolder = (tone === "faded-bw" || tone === "bnw-faded" || tone === "faded") 
        ? "faded-bw" 
        : ((tone === "bw" || tone === "bnw" || tone === "selects-bnw") ? "bw" : "colour");
      return `proofs/test-client/${toneFolder}/${filename}`;
    }

    // 4. In-session blob cache
    const k = getShootCoverBlobKey(shoot);
    if (k && blobUrlCache[k]) return blobUrlCache[k];

    return "proofs/test-client/colour/Asha-001.jpg";
  }

  // Preload all blob URLs for a shoot concurrently from IndexedDB
  async function preloadShootBlobUrls(shoot) {
    if (!shoot) return;
    const db = await openIndexedDb();
    if (!db) return;

    const allImages = [];
    if (shoot.sections) {
      shoot.sections.forEach(sec => (sec.images || []).forEach(img => allImages.push(img)));
    }
    if (shoot.images) {
      shoot.images.forEach(img => allImages.push(img));
    }

    const neededKeys = new Set();
    const coverKey = getShootCoverBlobKey(shoot);
    if (coverKey && !blobUrlCache[coverKey]) neededKeys.add(coverKey);

    allImages.forEach(img => {
      if (img.blobKey && !blobUrlCache[img.blobKey]) {
        neededKeys.add(img.blobKey);
      }
      if (img.versions && typeof img.versions === "object") {
        for (const toneKey of Object.keys(img.versions)) {
          const val = img.versions[toneKey];
          if (typeof val === "string" && val.startsWith("blobKey:")) {
            const k = val.replace("blobKey:", "");
            if (!blobUrlCache[k]) {
              neededKeys.add(k);
            }
          }
        }
      }
    });

    if (neededKeys.size === 0) {
      if (coverKey && blobUrlCache[coverKey]) {
        shoot.coverImage = blobUrlCache[coverKey];
      }
      return;
    }

    // Fetch all keys concurrently in a single read transaction (with 1.5s max timeout to prevent UI freeze)
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 1500);
      try {
        const tx = db.transaction(IDB_STORE, "readonly");
        const store = tx.objectStore(IDB_STORE);
        let pending = neededKeys.size;

        const finish = () => {
          clearTimeout(timer);
          resolve();
        };

        neededKeys.forEach(k => {
          try {
            const req = store.get(k);
            req.onsuccess = () => {
              if (req.result) {
                const url = URL.createObjectURL(req.result);
                blobUrlCache[k] = url;
                updateDomImagesForBlobKey(k, url);
              }
              pending--;
              if (pending <= 0) finish();
            };
            req.onerror = () => {
              pending--;
              if (pending <= 0) finish();
            };
          } catch (e) {
            pending--;
            if (pending <= 0) finish();
          }
        });

        tx.oncomplete = () => finish();
        tx.onerror = () => finish();
      } catch (e) {
        clearTimeout(timer);
        resolve();
      }
    });

  }

  const PORTAL_SCHEMA_VERSION = "20261104_v7";
  try {
    if (localStorage.getItem("portal_schema_v") !== PORTAL_SCHEMA_VERSION) {
      localStorage.removeItem(CUSTOM_SHOOTS_KEY);
      localStorage.removeItem(DELETED_SHOOTS_KEY);
      localStorage.setItem("portal_schema_v", PORTAL_SCHEMA_VERSION);
    }
  } catch (e) {}

  function isLegacyDemoShoot(s) {
    if (!s || !s.id) return false;
    const id = String(s.id).toLowerCase();
    return id === "test-client" || id === "bree-colter" || id === "demo";
  }

  function isPhantomShoot(s) {
    return isLegacyDemoShoot(s);
  }

  function loadCustomShoots() {
    try {
      const raw = localStorage.getItem(CUSTOM_SHOOTS_KEY);
      let list = raw ? JSON.parse(raw) : [];
      // Only filter out old static demo IDs
      list = list.filter(s => !isLegacyDemoShoot(s));
      const seenIds = new Set();
      const seenCodes = new Set();
      const deduped = [];

      // Sort newest updated/created first
      list.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

      list.forEach(s => {
        delete s.__prepared;
        const idKey = (s.id || "").trim().toLowerCase();
        const codeKey = (s.code || "").trim().toUpperCase();

        if (idKey && seenIds.has(idKey)) return;
        if (codeKey && seenCodes.has(codeKey)) return;

        if (idKey) seenIds.add(idKey);
        if (codeKey) seenCodes.add(codeKey);

        if (s.sections && Array.isArray(s.sections)) {
          s.sections.forEach(sec => {
            if (sec.images && Array.isArray(sec.images)) {
              sec.images.sort(naturalSortFilenames);
            }
          });
        }
        if (s.images && Array.isArray(s.images)) {
          s.images.sort(naturalSortFilenames);
        }
        if (s.coverImage === "photos/sets/bree/001_hero.jpg") {
          const tone = s.coverTone || "colour";
          const fn = s.coverFilename || (s.images && s.images[0] ? s.images[0].filename : "Asha-001.jpg");
          s.coverImage = `proofs/test-client/${tone}/${fn}`;
        }
        deduped.push(s);
      });
      return deduped;
    } catch (e) {
      return [];
    }
  }

  async function saveCustomShoot(shoot) {
    try {
      delete shoot.__prepared;
      if (shoot.sections && Array.isArray(shoot.sections)) {
        shoot.sections.forEach(sec => {
          if (sec.images && Array.isArray(sec.images)) {
            sec.images.sort(naturalSortFilenames);
          }
        });
      }
      if (shoot.images && Array.isArray(shoot.images)) {
        shoot.images.sort(naturalSortFilenames);
      }

      // If this shoot ID was in deleted set, remove it locally and in cloud so it displays immediately
      const deletedSet = getDeletedShootIds();
      if (deletedSet.has(shoot.id)) {
        deletedSet.delete(shoot.id);
        localStorage.setItem(DELETED_SHOOTS_KEY, JSON.stringify(Array.from(deletedSet)));
        unmarkDeletedShootInCloud(shoot.id);
      }

      const list = loadCustomShoots();
      const targetCode = (shoot.code || "").trim().toUpperCase();
      const existingIdx = list.findIndex(s => s.id === shoot.id || (targetCode && s.code && s.code.toUpperCase() === targetCode));
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...shoot };
      } else {
        list.unshift(shoot);
      }
      localStorage.setItem(CUSTOM_SHOOTS_KEY, JSON.stringify(list));
      await syncCustomShootToCloud(shoot);
      return true;
    } catch (e) {
      console.warn("Failed to save custom shoot:", e);
      return false;
    }
  }

  const DELETED_SHOOTS_KEY = "portal_deleted_shoots_set";
  const DEFAULT_DELETED_SHOOTS = ["test-client", "bree-colter", "demo"];

  function getDeletedShootIds() {
    try {
      const raw = localStorage.getItem(DELETED_SHOOTS_KEY);
      const set = new Set(raw ? JSON.parse(raw) : []);
      // Permanently filter out the original two demo shoots on all devices
      DEFAULT_DELETED_SHOOTS.forEach(id => set.add(id));
      return set;
    } catch (e) {
      return new Set(DEFAULT_DELETED_SHOOTS);
    }
  }

  function deleteCustomShoot(shootId) {
    try {
      let list = loadCustomShoots();
      list = list.filter(s => s.id !== shootId);
      localStorage.setItem(CUSTOM_SHOOTS_KEY, JSON.stringify(list));

      const deletedSet = getDeletedShootIds();
      deletedSet.add(shootId);
      localStorage.setItem(DELETED_SHOOTS_KEY, JSON.stringify(Array.from(deletedSet)));

      // Delete from Firestore Cloud as well so it never resurrects on refresh
      fetch(getFirestoreShootDocUrl(shootId), {
        method: "DELETE"
      }).catch(() => {});

      // Record deletion in cloud deleted_shoots doc
      syncDeletedShootToCloud(shootId);

      // Permanently remove all shoot photos from Cloudflare R2 bucket
      fetch("/api/r2-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shootId })
      }).catch(err => console.warn("R2 deletion error:", err));

      return true;
    } catch (e) {
      return false;
    }
  }

  async function syncDeletedShootsFromCloud() {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/client_shoots/deleted_shoots?key=${FIREBASE_CONFIG.apiKey}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.fields || !data.fields.deletedIds || !data.fields.deletedIds.arrayValue) return;
      const values = data.fields.deletedIds.arrayValue.values || [];
      const set = getDeletedShootIds();
      let changed = false;
      values.forEach(v => {
        const id = v.stringValue;
        if (id && !set.has(id)) {
          set.add(id);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(DELETED_SHOOTS_KEY, JSON.stringify(Array.from(set)));
      }
    } catch (e) {}
  }

  async function syncDeletedShootToCloud(shootId) {
    try {
      const set = getDeletedShootIds();
      set.add(shootId);
      const values = Array.from(set).map(id => ({ stringValue: id }));
      const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/client_shoots/deleted_shoots?key=${FIREBASE_CONFIG.apiKey}`;
      await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            deletedIds: { arrayValue: { values } },
            updatedAt: { integerValue: String(Date.now()) }
          }
        })
      });
    } catch (e) {}
  }

  async function unmarkDeletedShootInCloud(shootId) {
    try {
      const set = getDeletedShootIds();
      if (set.has(shootId)) {
        set.delete(shootId);
        localStorage.setItem(DELETED_SHOOTS_KEY, JSON.stringify(Array.from(set)));
      }
      const values = Array.from(set).map(id => ({ stringValue: id }));
      const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/client_shoots/deleted_shoots?key=${FIREBASE_CONFIG.apiKey}`;
      await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            deletedIds: { arrayValue: { values } },
            updatedAt: { integerValue: String(Date.now()) }
          }
        })
      });
    } catch (e) {}
  }

  function getFirestoreShootDocUrl(shootId) {
    const base = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/client_shoots`;
    return shootId ? `${base}/${encodeURIComponent(shootId)}?key=${FIREBASE_CONFIG.apiKey}` : `${base}?key=${FIREBASE_CONFIG.apiKey}`;
  }

  async function syncCustomShootToCloud(shoot) {
    try {
      const cleanShoot = JSON.parse(JSON.stringify(shoot));
      delete cleanShoot.__prepared;

      // Sanitize coverImage: prevent base64 blobs or temporary blob URLs from bloating Firestore
      if (!cleanShoot.coverImage || cleanShoot.coverImage.startsWith("blob:") || cleanShoot.coverImage.startsWith("blobKey:") || cleanShoot.coverImage.startsWith("data:") || cleanShoot.coverImage === "photos/sets/bree/001_hero.jpg") {
        const tone = cleanShoot.coverTone || "colour";
        const coverFn = cleanShoot.coverFilename || (cleanShoot.images && cleanShoot.images[0] ? cleanShoot.images[0].filename : "Asha-001.jpg");
        cleanShoot.coverImage = `proofs/test-client/${tone}/${coverFn}`;
      }

      const docBody = {
        fields: {
          shootId: { stringValue: cleanShoot.id },
          code: { stringValue: cleanShoot.code },
          clientName: { stringValue: cleanShoot.clientName },
          shootTitle: { stringValue: cleanShoot.shootTitle },
          createdAt: { integerValue: String(cleanShoot.createdAt || Date.now()) },
          updatedAt: { integerValue: String(cleanShoot.updatedAt || Date.now()) },
          metadataJson: { stringValue: JSON.stringify(cleanShoot) }
        }
      };
      await fetch(getFirestoreShootDocUrl(cleanShoot.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docBody)
      });
    } catch (e) {
      console.warn("Error syncing custom shoot to cloud:", e);
    }
  }

  // Fetch all custom client galleries from Firebase Cloud (Cross-device desktop <-> mobile sync)
  async function syncAllCustomGalleriesFromCloud(onUpdated) {
    try {
      await syncDeletedShootsFromCloud();
      
      let allDocs = [];
      let pageToken = "";
      do {
        const url = `${getFirestoreShootDocUrl()}&pageSize=50${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) break;
        const data = await res.json();
        if (data && Array.isArray(data.documents)) {
          allDocs = allDocs.concat(data.documents);
        }
        pageToken = data.nextPageToken || "";
      } while (pageToken);

      if (allDocs.length === 0) return;

      const cloudList = [];
      const deletedSet = getDeletedShootIds();

      allDocs.forEach(doc => {
        if (!doc.fields) return;
        const f = doc.fields;
        const metaStr = f.metadataJson ? f.metadataJson.stringValue : "";
        if (!metaStr) return;
        try {
          const shootMeta = JSON.parse(metaStr);
          if (shootMeta && shootMeta.id) {
            delete shootMeta.__prepared;

            // Reject legacy test shoots and deleted shoots
            if (isLegacyDemoShoot(shootMeta) || deletedSet.has(shootMeta.id)) {
              return;
            }

            // Ensure cover image isn't a dead device-local blob: URL or placeholder
            if (!shootMeta.coverImage || shootMeta.coverImage.startsWith("blob:") || shootMeta.coverImage.startsWith("blobKey:") || shootMeta.coverImage === "photos/sets/bree/001_hero.jpg") {
              const tone = shootMeta.coverTone || "colour";
              const coverFn = shootMeta.coverFilename || (shootMeta.images && shootMeta.images[0] ? shootMeta.images[0].filename : "Asha-001.jpg");
              shootMeta.coverImage = `proofs/test-client/${tone}/${coverFn}`;
            }

            cloudList.push(shootMeta);
          }
        } catch (e) {}
      });

      // The cloud is the single source of truth across all devices
      localStorage.setItem(CUSTOM_SHOOTS_KEY, JSON.stringify(cloudList));
      if (typeof onUpdated === "function") {
        onUpdated();
      }
    } catch (e) {
      console.warn("Cloud custom galleries sync error:", e);
    }
  }

  function getAllShoots() {
    const staticShoots = (window.CLIENT_PORTAL_DATA && window.CLIENT_PORTAL_DATA.shoots) || [];
    const customShoots = loadCustomShoots();
    const deletedIds = getDeletedShootIds();
    
    const seenCodes = new Set();
    const seenIds = new Set();
    const combined = [];

    // Custom shoots take precedence — sort by updatedAt / createdAt descending so latest version wins
    const sortedCustom = [...customShoots].sort((a, b) => {
      const timeA = a.updatedAt || a.createdAt || 0;
      const timeB = b.updatedAt || b.createdAt || 0;
      return timeB - timeA;
    });

    sortedCustom.forEach(s => {
      if (isLegacyDemoShoot(s) || deletedIds.has(s.id)) return;
      const codeKey = (s.code || "").trim().toUpperCase();
      const idKey = (s.id || "").trim().toLowerCase();
      // Deduplicate both by ID and by Access Code so multiple versions of test gallery never show!
      if (idKey && seenIds.has(idKey)) return;
      if (codeKey && seenCodes.has(codeKey)) return;
      if (idKey) seenIds.add(idKey);
      if (codeKey) seenCodes.add(codeKey);
      combined.push(s);
    });

    // Only include static demo shoot if its code or ID hasn't been replaced by a custom shoot and wasn't deleted
    staticShoots.forEach(s => {
      if (isLegacyDemoShoot(s) || deletedIds.has(s.id)) return;
      const codeKey = (s.code || "").trim().toUpperCase();
      const idKey = (s.id || "").trim().toLowerCase();
      if ((!codeKey || !seenCodes.has(codeKey)) && (!idKey || !seenIds.has(idKey))) {
        combined.push(s);
      }
    });

    combined.forEach(prepareShootData);
    return combined;
  }
  if (typeof window !== "undefined") {
    window.getAllClientShoots = getAllShoots;
  }

  function prepareShootData(shoot) {
    if (!shoot) return null;

    if (shoot.sections && Array.isArray(shoot.sections) && shoot.sections.length > 0) {
      const flat = [];
      shoot.sections.forEach((sec, idx) => {
        if (!sec.id) sec.id = `look-${idx + 1}`;
        if (!sec.title) sec.title = `Look ${idx + 1}`;
        if (!sec.images) sec.images = [];
        sec.images.sort(naturalSortFilenames);
        sec.images.forEach(img => {
          img.section = sec.title;
          img.sectionId = sec.id;
          flat.push(img);
        });
      });
      flat.sort(naturalSortFilenames);
      shoot.images = flat;
    } else if (shoot.images && Array.isArray(shoot.images)) {
      shoot.images.sort(naturalSortFilenames);
      const hasAnySection = shoot.images.some(img => img.section);
      if (hasAnySection) {
        const map = new Map();
        shoot.images.forEach(img => {
          const title = img.section || "General";
          if (!map.has(title)) {
            map.set(title, {
              id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              title: title,
              description: img.sectionDescription || "",
              images: []
            });
          }
          map.get(title).images.push(img);
        });
        shoot.sections = Array.from(map.values());
        shoot.sections.forEach(sec => (sec.images || []).sort(naturalSortFilenames));
      } else {
        shoot.sections = [
          {
            id: "all",
            title: "",
            description: "",
            images: shoot.images
          }
        ];
      }
    }
    if (shoot.images && Array.isArray(shoot.images)) {
      shoot.images.sort(naturalSortFilenames);
    }
    return shoot;
  }

  function getShootById(id) {
    if (!id) return null;
    const shoots = getAllShoots();
    const target = id.toLowerCase();
    const shoot = shoots.find(s => (s.id && s.id.toLowerCase() === target) || (s.code && s.code.toLowerCase() === target));
    if (shoot) preloadShootBlobUrls(shoot);
    return prepareShootData(shoot);
  }

  // Get available tone versions for a specific image
  function getAvailableTonesForImage(imgObj) {
    if (!imgObj) return ["colour"];
    if (imgObj.versions && typeof imgObj.versions === "object") {
      const keys = Object.keys(imgObj.versions).filter(k => !!imgObj.versions[k]);
      if (keys.length > 0) return keys;
    }
    return ["colour"];
  }

  // Resolve image source based on active tone & blob cache
  function resolveImageSrc(imgObj, tone) {
    if (!imgObj) return "";

    function resolveValue(val) {
      if (!val) return "";
      if (typeof val === "string") {
        if (val.startsWith("blobKey:")) {
          const k = val.replace("blobKey:", "");
          if (blobUrlCache[k]) return blobUrlCache[k];
          // Background fetch if not cached yet
          getImageBlob(k).then(blob => {
            if (blob && !blobUrlCache[k]) {
              const url = URL.createObjectURL(blob);
              blobUrlCache[k] = url;
              updateDomImagesForBlobKey(k, url);
            }
          });
          // Cross-device fallback for mobile/external devices: load from server proofs folder
          if (imgObj && imgObj.filename) {
            const toneSub = (tone && (tone.includes("faded") || tone === "faded-bw" || tone === "selects-bnw-faded")) 
              ? "faded-bw" 
              : ((tone && (tone.includes("bw") || tone.includes("bnw") || tone === "selects-bnw")) ? "bw" : "colour");
            return `proofs/test-client/${toneSub}/${imgObj.filename}`;
          }
          return "";
        }
        return val;
      }
      return "";
    }

    // Tone alias resolution helper
    function getToneVersion(versions, requestedTone) {
      if (!versions || !requestedTone) return null;
      if (versions[requestedTone]) return versions[requestedTone];
      if (requestedTone === "bw" || requestedTone === "bnw" || requestedTone === "black-and-white") {
        return versions["bnw"] || versions["bw"] || versions["black-and-white"] || null;
      }
      if (requestedTone === "faded-bw" || requestedTone === "bnw-faded" || requestedTone === "faded" || requestedTone === "faded-bnw") {
        return versions["bnw-faded"] || versions["faded-bw"] || versions["faded-bnw"] || versions["faded"] || null;
      }
      if (requestedTone === "colour" || requestedTone === "color") {
        return versions["colour"] || versions["color"] || null;
      }
      return null;
    }

    // 1. Check requested tone in versions first (with alias fallback)!
    if (tone && imgObj.versions) {
      const matchVal = getToneVersion(imgObj.versions, tone);
      if (matchVal) {
        const src = resolveValue(matchVal);
        if (src) return src;
      }
    }

    // 2. Fallback to first available version in imgObj.versions
    if (imgObj.versions && typeof imgObj.versions === "object") {
      const keys = Object.keys(imgObj.versions).filter(k => !!imgObj.versions[k]);
      if (keys.length > 0) {
        const prefKey = (tone && keys.includes(tone)) ? tone : (keys.includes("bnw") ? "bnw" : (keys.includes("colour") ? "colour" : keys[0]));
        const src = resolveValue(imgObj.versions[prefKey]);
        if (src) return src;
        for (const k of keys) {
          const s = resolveValue(imgObj.versions[k]);
          if (s) return s;
        }
      }
    }

    // 3. Fallback to image-level blobKey
    if (imgObj.blobKey && blobUrlCache[imgObj.blobKey]) {
      return blobUrlCache[imgObj.blobKey];
    } else if (imgObj.blobKey) {
      getImageBlob(imgObj.blobKey).then(blob => {
        if (blob && !blobUrlCache[imgObj.blobKey]) {
          const url = URL.createObjectURL(blob);
          blobUrlCache[imgObj.blobKey] = url;
          updateDomImagesForBlobKey(imgObj.blobKey, url);
        }
      });
    }

    if (imgObj.src && !imgObj.src.startsWith("blobKey:") && !imgObj.src.startsWith("blob:")) {
      return imgObj.src;
    }

    return "";
  }

  window.resolveClientPortalImageSrc = resolveImageSrc;

  // Get currently viewed tone for an image (respecting available tones)
  function getImageActiveTone(filename, shoot) {
    let imgObj = null;
    if (shoot && shoot.images) {
      imgObj = shoot.images.find(i => i.filename === filename);
    } else if (activeShootId) {
      const s = getShootById(activeShootId);
      if (s && s.images) imgObj = s.images.find(i => i.filename === filename);
    }
    const available = getAvailableTonesForImage(imgObj);

    const custom = itemTones[filename];
    if (custom && available.includes(custom)) {
      return custom;
    }
    if (available.includes(globalTone)) {
      return globalTone;
    }
    return available[0] || "colour";
  }

  function syncShootStateInBackground(container, shootObj, activeSubRoute) {
    if (!shootObj || !container) return;
    loadShootFromCloud(shootObj.id).then(res => {
      if (!res) return;
      selectedMap = loadSelections(shootObj.id);
      itemNotes = loadNotes(shootObj.id);
      rejectedSet = loadRejected(shootObj.id);
      agencySelectedMap = loadAgencySelections(shootObj.id);
      agencyItemNotes = loadAgencyNotes(shootObj.id);
      agencyMeta = loadAgencyMeta(shootObj.id);

      if (isAgencyView()) {
        if (activeSubRoute !== "review") {
          const clientCount = getSelectedFilenameCount(selectedMap);
          const agCount = agencySelectedMap.size;
          const matchedCount = getMatchedFilenameCount();
          const topPill = container.querySelector(".portal-shoot-tag-pill");
          if (topPill) {
            topPill.classList.toggle("is-submitted", agCount > 0);
            topPill.innerHTML = `<span class="portal-status-dot"></span>Agency &amp; Casting View &middot; ${agCount} Agency Picks`;
          }
          const tabClientCount = container.querySelector("#tab-client-picks-count");
          if (tabClientCount) tabClientCount.textContent = clientCount;
          const tabAgCount = container.querySelector("#tab-agency-picks-count");
          if (tabAgCount) tabAgCount.textContent = agCount;
          const tabMatchCount = container.querySelector("#tab-matched-count");
          if (tabMatchCount) tabMatchCount.textContent = matchedCount;
          const sumClient = container.querySelector("#agency-summary-client-count");
          if (sumClient) sumClient.textContent = clientCount;
          const sumAg = container.querySelector("#agency-summary-ag-count");
          if (sumAg) sumAg.textContent = agCount;
          const pillClient = container.querySelector("#agency-pill-client-count");
          if (pillClient) pillClient.textContent = clientCount;
          const pillAg = container.querySelector("#agency-pill-ag-count");
          if (pillAg) pillAg.textContent = agCount;
          const pillMatched = container.querySelector("#agency-pill-matched-count");
          if (pillMatched) pillMatched.textContent = matchedCount;
          const agCtrlBtn = container.querySelector("#agency-controls-save-btn");
          if (agCtrlBtn) agCtrlBtn.innerHTML = `Save Agency Picks (${agCount}) &rarr;`;

          const sectionsWrap = container.querySelector("#portal-sections-container");
          if (sectionsWrap) {
            const rendered = renderAllSectionsHtml(shootObj);
            if (rendered.hasContent) sectionsWrap.innerHTML = rendered.html;
          }
        }
        return;
      }

      if (res.isSubmitted) {
        const topPill = container.querySelector(".portal-shoot-tag-pill");
        if (topPill) {
          topPill.classList.add("is-submitted");
          topPill.innerHTML = `<span class="portal-status-dot"></span>Client Selected (${selectedMap.size})`;
        }
        const saveBtn = container.querySelector("#save-selections-btn");
        if (saveBtn) {
          saveBtn.classList.add("is-saved");
          saveBtn.innerHTML = `&#10003; Update Saved Selections (${selectedMap.size})`;
        }
      }

      if (res.hasClientData || res.hasAgencyData || res.isSubmitted) {
        const notifyInputEl = container.querySelector("#portal-client-notify-email");
        const notifySaveBtnEl = container.querySelector("#portal-client-notify-save-btn");
        const syncedEmail = loadClientNotifyEmail(shootObj.id);
        if (notifyInputEl && syncedEmail && !notifyInputEl.value && document.activeElement !== notifyInputEl) {
          notifyInputEl.value = syncedEmail;
          if (notifySaveBtnEl) {
            notifySaveBtnEl.classList.add("is-saved");
            notifySaveBtnEl.innerHTML = "Saved &#10003;";
          }
        }
        const floatingCountEl = container.querySelector("#floating-count");
        const quotaSummary = formatShootSelectionSummary(shootObj, selectedMap);
        if (floatingCountEl) {
          floatingCountEl.textContent = quotaSummary;
        }
        const controlsQuotaPill = container.querySelector("#portal-controls-quota-pill");
        if (controlsQuotaPill) {
          controlsQuotaPill.textContent = quotaSummary;
          controlsQuotaPill.classList.toggle("is-extra-quota", !shootObj.isTfp && selectedMap.size > (parseInt(shootObj.packageQuota, 10) || 15));
        }
        const openReviewBtn = container.querySelector("#open-review-btn");
        if (openReviewBtn) {
          openReviewBtn.textContent = `Review (${selectedMap.size}) \u2192`;
        }
        const tabSelCountEl = container.querySelector("#tab-selected-count");
        if (tabSelCountEl) tabSelCountEl.textContent = selectedMap.size;
        const tabTfpFavsEl = container.querySelector("#tab-tfp-favs-count");
        const tabTfpLikesEl = container.querySelector("#tab-tfp-likes-count");
        if (tabTfpFavsEl || tabTfpLikesEl) {
          const tfpC = getTfpCounts(selectedMap);
          if (tabTfpFavsEl) tabTfpFavsEl.textContent = `${tfpC.favourites}/${getTfpFavLimit(shootObj)}`;
          if (tabTfpLikesEl) tabTfpLikesEl.textContent = tfpC.likes;
        }
        const tabRejCountEl = container.querySelector("#tab-rejected-count");
        if (tabRejCountEl) tabRejCountEl.textContent = rejectedSet.size;
        const reviewQuotaEl = container.querySelector("#review-quota-text");
        if (reviewQuotaEl) {
          reviewQuotaEl.textContent = res.isSubmitted
            ? `Saved \u00b7 ${quotaSummary}`
            : quotaSummary;
        }

        if (activeSubRoute === "review") {
          const lbOpen = typeof document !== "undefined" && document.querySelector("#lightbox.is-open");
          if (!lbOpen) {
            renderShootReviewPage(container, shootObj);
          }
        } else {
          const sectionsWrap = container.querySelector("#portal-sections-container");
          if (sectionsWrap) {
            const rendered = renderAllSectionsHtml(shootObj);
            if (rendered.hasContent) sectionsWrap.innerHTML = rendered.html;
          }
        }
        setCloudSyncIndicator("is-synced", "Synced with cloud \u2713");
      }
    });
  }

  async function openShootWithMode(container, shoot, mode, activeSubRoute = null) {
    if (!shoot || !container) return;
    activeShootId = shoot.id;
    const resolvedMode = mode === "agency" ? "agency" : "client";
    setShootUnlockedMode(shoot.id, resolvedMode);
    portalViewMode = resolvedMode;
    filterMode = "all";
    showSelectedOnly = false;

    const targetHash = resolvedMode === "agency"
      ? buildPortalRouteHash(`${shoot.id}/agency`)
      : buildPortalRouteHash(shoot.id);

    if (typeof window !== "undefined" && window.location.hash !== targetHash) {
      window.location.hash = targetHash;
      return;
    }

    try {
      if (shoot.isCustom) {
        await preloadShootBlobUrls(shoot);
      }
      selectedMap = loadSelections(shoot.id);
      itemNotes = loadNotes(shoot.id);
      agencySelectedMap = loadAgencySelections(shoot.id);
      agencyItemNotes = loadAgencyNotes(shoot.id);
      agencyMeta = loadAgencyMeta(shoot.id);

      syncShootStateInBackground(container, shoot, activeSubRoute);
      renderShootGallery(container, shoot);
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    } catch (err) {
      console.error("Error opening gallery:", err);
      renderShootGallery(container, shoot);
    }
  }

  // Main Entry Point
  window.renderClientPortalEdition = async function(container, paramShootId, subRoute) {
    // Check if there is an import payload in location.hash or location.search (Option 2 Link Sync)
    let searchStr = "";
    if (typeof window !== "undefined") {
      if (window.location.hash && window.location.hash.includes("?")) {
        searchStr = window.location.hash.split("?")[1] || "";
      } else if (window.location.search) {
        searchStr = window.location.search.replace(/^\?/, "");
      }
    }
    if (searchStr) {
      const params = new URLSearchParams(searchStr);
      const selPayload = params.get("sel");
      if (selPayload) {
        const importedShootId = decodeAndImportSelectionsPayload(selPayload);
        if (importedShootId) {
          paramShootId = importedShootId;
          subRoute = "review";
          // Immediately clean up ?sel= from browser history so back button is never trapped
          if (typeof window !== "undefined" && window.history && window.history.replaceState) {
            const cleanHash = (window.location.hash ? window.location.hash.split("?")[0] : `#/client-portal/${importedShootId}/review`);
            window.history.replaceState(null, "", window.location.pathname + cleanHash);
          }
        }
      }
    }

    if (subRoute && subRoute.includes("?")) {
      subRoute = subRoute.split("?")[0];
    }
    if (paramShootId && paramShootId.includes("?")) {
      paramShootId = paramShootId.split("?")[0];
    }

    if (paramShootId) {
      activeShootId = paramShootId;
    }

    // Route: Create Gallery Page (Full-page experience)
    if (paramShootId === "create" || (typeof window !== "undefined" && window.location.hash.includes("/client-portal/create"))) {
      if (!isPhotographerAuth()) {
        activeShootId = null;
        renderLandingScreen(container);
        return;
      }
      activeShootId = null;
      renderGalleryBuilderPage(container);
      return;
    }

    // Route: Edit Gallery Setup Page
    if (subRoute === "edit" || (typeof window !== "undefined" && window.location.hash.includes("/edit"))) {
      if (!isPhotographerAuth()) {
        activeShootId = null;
        renderLandingScreen(container);
        return;
      }
      await renderGalleryBuilderPage(container, paramShootId);
      return;
    }

    if (paramShootId === "test-delivery") {
      activeShootId = "test-delivery";
      portalViewMode = "client";
      await renderShootDeliveryPage(container, TEST_DELIVERY_SHOOT);
      return;
    }

    let shoot = activeShootId ? getShootById(activeShootId) : null;
    if (!shoot && (paramShootId || activeShootId)) {
      const targetId = paramShootId || activeShootId;
      try {
        await syncAllCustomGalleriesFromCloud();
        shoot = getShootById(targetId);
        if (shoot) activeShootId = shoot.id;
      } catch (e) {}
    }

    if (shoot) {
      // Preload all custom shoot blobs from IndexedDB before rendering proofs
      if (shoot.isCustom) {
        await preloadShootBlobUrls(shoot);
      }

      const rawHashStr = typeof window !== "undefined" ? (window.location.hash || "") : "";
      const codeParamMatch = rawHashStr.match(/[?&]code=([^&]+)/i);
      const urlPasscode = codeParamMatch && codeParamMatch[1] ? decodeURIComponent(codeParamMatch[1]).trim().toUpperCase() : "";
      if (urlPasscode && shoot.code && urlPasscode === shoot.code.trim().toUpperCase()) {
        setShootUnlockedMode(shoot.id, "client");
      }

      const sessionUnlocked = getShootUnlockedMode(shoot.id);
      if (subRoute === "splash" || (subRoute !== "review" && subRoute !== "delivery" && !sessionUnlocked)) {
        portalViewMode = "client";
        renderShootSplashPage(container, shoot);
        return;
      }
      if (subRoute === "delivery" && !sessionUnlocked && !isPhotographerAuth()) {
        portalViewMode = "client";
        renderShootSplashPage(container, shoot);
        return;
      }

      const hashStr = typeof window !== "undefined" ? (window.location.hash || "") : "";
      const hasQueryAgency = hashStr.includes("view=agency");
      portalViewMode = (sessionUnlocked === "agency" || ((subRoute === "agency" || hasQueryAgency) && isPhotographerAuth()))
        ? "agency"
        : "client";
      filterMode = "all";
      showSelectedOnly = false;

      selectedMap = loadSelections(shoot.id);
      itemNotes = loadNotes(shoot.id);
      rejectedSet = loadRejected(shoot.id);
      agencySelectedMap = loadAgencySelections(shoot.id);
      agencyItemNotes = loadAgencyNotes(shoot.id);
      agencyMeta = loadAgencyMeta(shoot.id);

      const hasDeliveryFolder = Boolean(shoot.deliveryDriveUrl || shoot.deliveryFolderId);
      if (subRoute === "delivery" || (shoot.deliveryReady && hasDeliveryFolder && subRoute !== "review" && subRoute !== "agency" && subRoute !== "proofs")) {
        await renderShootDeliveryPage(container, shoot);
        return;
      }

      if (subRoute === "review") {
        try {
          await loadShootFromCloud(shoot.id);
          selectedMap = loadSelections(shoot.id);
          itemNotes = loadNotes(shoot.id);
          rejectedSet = loadRejected(shoot.id);
        } catch (e) {}
        renderShootReviewPage(container, shoot);
      } else {
        syncShootStateInBackground(container, shoot, subRoute);
        renderShootGallery(container, shoot);
      }
    } else {
      portalViewMode = "client";
      activeShootId = null;
      renderLandingScreen(container);
    }
  };

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getClientPortalHeaderConfig() {
    let H = (window.CLIENT_PORTAL_DATA && window.CLIENT_PORTAL_DATA.header) || {};
    try {
      const dedicated = localStorage.getItem("kh_header_client-portal");
      if (dedicated) {
        H = JSON.parse(dedicated) || {};
      } else {
        const raw = localStorage.getItem("kh_custom_headers");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed["client-portal"]) {
            const cp = parsed["client-portal"];
            if (cp.title !== "book a studio shoot" && !cp.bookingTicker && cp.slug !== "book-me") {
              H = { ...H, ...cp };
            }
          }
        }
      }
    } catch (e) {}
    if (window._KH_HEADERS && window._KH_HEADERS["client-portal"]) {
      H = { ...H, ...window._KH_HEADERS["client-portal"] };
    }
    return {
      heroImage: "photos/contact/2.jpg",
      title: "client proofing & portal",
      intro: "Private proofing suites, client selection reviews, and custom shoots.",
      tag: "exclusive client area",
      extraEditsBannerEnabled: true,
      extraEditsBannerTag: "Extra Retouched Edits",
      extraEditsBannerText: "You can pick more images than your package includes. Any extra picks will be £30 per extra edit. For five or more extras, we can discuss a discount.",
      ...H
    };
  }

  function renderExtraEditsBannerHtml() {
    const H = getClientPortalHeaderConfig();
    if (H.extraEditsBannerEnabled === false) return "";
    const tag = (H.extraEditsBannerTag || "Extra Retouched Edits").trim();
    const text = (H.extraEditsBannerText || "You can pick more images than your package includes. Any extra picks will be £30 per extra edit. For five or more extras, we can discuss a discount.").trim();
    if (!text) return "";
    return `
      <div class="portal-extra-edits-banner" id="portal-extra-edits-banner" role="note">
        ${tag ? `<span class="portal-extra-edits-badge">${escapeHtml(tag)}</span>` : ""}
        <p class="portal-extra-edits-copy">${escapeHtml(text)}</p>
      </div>
    `;
  }

  function renderTfpGuideBannerHtml(shoot) {
    const limit = getTfpFavLimit(shoot);
    const customText = (shoot && typeof shoot.tfpNotice === "string" && shoot.tfpNotice.trim())
      ? shoot.tfpNotice.trim()
      : DEFAULT_TFP_GUIDE_TEXT;
    return `
      <div class="portal-tfp-guide-banner" id="portal-tfp-guide-banner" role="note">
        <div class="portal-tfp-guide-head">
          <span class="portal-extra-edits-badge">TFP Selection Guide</span>
          <p class="portal-tfp-guide-copy">${escapeHtml(customText)}</p>
        </div>
        <div class="portal-tfp-symbol-legend" aria-label="Selection symbol key">
          <span class="portal-tfp-legend-item">
            <span class="portal-tfp-icon-badge is-fav" aria-hidden="true">&#9829;</span>
            <span><strong>Top ${limit} Favourites</strong> &mdash; tap the heart for your absolute favourites to definitely edit (limit ${limit})</span>
          </span>
          <span class="portal-tfp-legend-item">
            <span class="portal-tfp-icon-badge is-like" aria-hidden="true">&#10003;</span>
            <span><strong>Other Likes</strong> &mdash; tap the tick on any other images you like (unlimited)</span>
          </span>
        </div>
      </div>
    `;
  }

  function getSelectedFilenameCount(map) {
    const names = new Set();
    if (map && typeof map.forEach === "function") {
      map.forEach(item => {
        if (item && item.filename) names.add(item.filename);
      });
    }
    return names.size;
  }

  function getMatchedFilenameCount() {
    const clientNames = new Set();
    selectedMap.forEach(item => {
      if (item && item.filename) clientNames.add(item.filename);
    });
    let matched = 0;
    const seen = new Set();
    agencySelectedMap.forEach(item => {
      if (item && item.filename && !seen.has(item.filename)) {
        seen.add(item.filename);
        if (clientNames.has(item.filename)) matched++;
      }
    });
    return matched;
  }

  /* ---------------------------------------------------------
     0.5. Per-Shoot Private Splash & Passcode Gate
     --------------------------------------------------------- */
  function getShootSplashFeatures(shoot) {
    if (!shoot) return [];

    // 1. Explicit custom splash features override if set on shoot
    if (Array.isArray(shoot.splashFeatures)) {
      const cleanCustom = shoot.splashFeatures.map(f => String(f || "").trim()).filter(Boolean);
      if (cleanCustom.length > 0) return cleanCustom;
    }

    const features = [];

    // 2. Dynamically detect all distinct variation tones in this shoot
    const toneKeys = new Set();
    const allImages = [];
    if (shoot.sections && Array.isArray(shoot.sections)) {
      shoot.sections.forEach(sec => {
        if (Array.isArray(sec.toneKeys) && sec.toneKeys.length > 0) {
          sec.toneKeys.forEach(k => toneKeys.add(k));
        }
        if (Array.isArray(sec.images)) {
          sec.images.forEach(img => allImages.push(img));
        }
      });
    }
    if (shoot.images && Array.isArray(shoot.images)) {
      shoot.images.forEach(img => allImages.push(img));
    }
    allImages.forEach(img => {
      const avail = getAvailableTonesForImage(img);
      avail.forEach(t => toneKeys.add(t));
    });

    if (toneKeys.size === 0) {
      if (shoot.toneMode) toneKeys.add(shoot.toneMode);
      else toneKeys.add("colour");
    }

    const toneLabels = [];
    toneKeys.forEach(k => {
      const raw = getToneLabel(k, shoot) || k;
      let clean = String(raw).trim();
      const lower = clean.toLowerCase();
      if (lower === "bnw" || lower === "black & white" || lower === "black and white" || lower === "bw" || lower === "selects-bnw") {
        clean = "B&W";
      } else if (lower === "bnw faded" || lower === "faded b&w" || lower === "faded bnw" || lower === "faded" || lower === "selects-faded") {
        clean = "Faded";
      } else if (lower === "color" || lower === "colour" || lower === "selects-colour") {
        clean = "Colour";
      }
      if (!toneLabels.includes(clean)) toneLabels.push(clean);
    });

    // Sort tone labels in classic photography order: Colour, B&W, Faded, High Key, Warm, etc.
    const priorityOrder = ["Colour", "B&W", "Faded", "High Key", "Warm", "Sepia", "Matte"];
    toneLabels.sort((a, b) => {
      const idxA = priorityOrder.indexOf(a);
      const idxB = priorityOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    // Feature 1: Variations (or single-tone collection)
    if (toneLabels.length > 2) {
      features.push(`Variations per portrait (${toneLabels.join(", ")})`);
    } else if (toneLabels.length === 2) {
      features.push(`Variations per portrait (${toneLabels.join(" & ")})`);
    } else if (toneLabels.length === 1) {
      const single = toneLabels[0];
      if (single === "B&W") {
        features.push("Curated Black & White portrait collection");
      } else if (single === "Colour") {
        features.push("Curated full colour portrait collection");
      } else {
        features.push(`Curated ${single} portrait collection`);
      }
    } else {
      features.push("Curated portrait collection");
    }

    // Feature 2: Looks & Compare Tool
    const sectionCount = (shoot.sections && Array.isArray(shoot.sections) && shoot.sections.length > 1) 
      ? shoot.sections.length 
      : 0;
    if (sectionCount > 1) {
      features.push(`${sectionCount} curated looks & side-by-side compare`);
    } else {
      features.push("Compare any 2 photos side-by-side or full-screen");
    }

    // Feature 3: Selections Quota & Notes (or TFP mode)
    const quota = parseInt(shoot.packageQuota, 10);
    if (shoot && shoot.isTfp) {
      const tfpLimit = getTfpFavLimit(shoot);
      features.push(`Mark your top ${tfpLimit} favourites (\u2665) plus unlimited other likes (\u2713)`);
    } else if (quota > 0) {
      features.push(`Select your favourite ${quota} portraits with custom editing notes`);
    } else {
      features.push("Leave custom editing & crop notes per portrait");
    }

    return features;
  }

  function renderShootSplashPage(container, shoot) {
    if (!container || !shoot) return;
    const isPhotographer = isPhotographerAuth();
    let coverSrc = getShootCoverSrc(shoot);
    if (coverSrc && coverSrc.startsWith("proofs/test-client/") && shoot.isCustom) {
      let firstImg = null;
      if (Array.isArray(shoot.sections)) {
        for (const sec of shoot.sections) {
          if (sec && Array.isArray(sec.images) && sec.images.length > 0) {
            firstImg = sec.images[0];
            break;
          }
        }
      }
      if (!firstImg && Array.isArray(shoot.images) && shoot.images.length > 0) {
        firstImg = shoot.images[0];
      }
      if (firstImg) {
        const altSrc = resolveImageSrc(firstImg, getDefaultToneForImage(firstImg, "colour"));
        if (altSrc) coverSrc = altSrc;
      }
    }

    const metaParts = [];
    if (shoot.shootDate) metaParts.push(shoot.shootDate);
    if (shoot.location) metaParts.push(shoot.location);
    const metaLine = metaParts.join(" · ");

    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }

    const splashFeatures = getShootSplashFeatures(shoot);
    const hasVariations = splashFeatures.some(f => /variation/i.test(f));
    const hintText = hasVariations
      ? "Enter your private Client Passcode or Agency Code to review, compare variations, and select your photos."
      : "Enter your private Client Passcode or Agency Code to review your photos and make your selections.";

    container.innerHTML = `
      <div class="portal-shoot-splash" id="portal-shoot-splash" data-shoot-id="${escapeHtml(shoot.id)}">
        <div class="portal-shoot-splash__backdrop" aria-hidden="true">
          ${coverSrc ? `<img src="${escapeHtml(coverSrc)}" alt="" decoding="async">` : ""}
        </div>
        <div class="portal-shoot-splash__vignette" aria-hidden="true"></div>

        <div class="portal-shoot-splash__inner">
          <div class="portal-shoot-splash__brand">Koray Hussein Photography</div>

          <div class="portal-shoot-splash__split-card ${coverSrc ? "" : "is-single-col"}">
            <div class="portal-shoot-splash__hero-copy">
              <span class="portal-shoot-splash__kicker">PRIVATE PROOFING SUITE</span>
              <h1 class="portal-shoot-splash__client">${escapeHtml(shoot.clientName || "Client Gallery")}</h1>
              ${shoot.shootTitle ? `<p class="portal-shoot-splash__subtitle">${escapeHtml(shoot.shootTitle)}</p>` : ""}
              ${metaLine ? `<p class="portal-shoot-splash__meta">${escapeHtml(metaLine)}</p>` : ""}

              <form class="portal-shoot-splash__form" id="shoot-splash-form" autocomplete="off">
                <label for="shoot-splash-code-input" class="portal-shoot-splash__label">Enter Your Passcode</label>
                <div class="portal-shoot-splash__input-row">
                  <input
                    type="text"
                    id="shoot-splash-code-input"
                    class="portal-shoot-splash__input"
                    placeholder="Client or Agency access code..."
                    autocomplete="off"
                    autocapitalize="characters"
                    spellcheck="false"
                    autofocus
                  >
                  <button type="submit" id="shoot-splash-enter-btn" class="portal-shoot-splash__btn">Enter Gallery &rarr;</button>
                </div>
                <p class="portal-shoot-splash__error" id="shoot-splash-error" style="display:none;"></p>
                <p class="portal-shoot-splash__hint">${escapeHtml(hintText)}</p>
              </form>

              ${splashFeatures.length > 0 ? `
                <div class="portal-shoot-splash__features">
                  ${splashFeatures.map(feat => `
                    <div class="portal-shoot-splash__feat"><span class="portal-shoot-splash__feat-dot">&#10022;</span><span>${escapeHtml(feat)}</span></div>
                  `).join("")}
                </div>
              ` : ""}

              ${isPhotographer ? `
                <div class="portal-shoot-splash__admin-bar">
                  <button type="button" class="portal-shoot-splash__admin-btn" id="shoot-splash-dashboard-btn">&larr; Master Dashboard</button>
                  <a href="#/client-portal/${escapeHtml(shoot.id)}/edit" class="portal-shoot-splash__admin-btn">&#9998; Edit Shoot Setup</a>
                  <span class="portal-shoot-splash__admin-codes">
                    Client: <code>${escapeHtml(shoot.code || "")}</code> &middot; Agency: <code>${escapeHtml(getShootAgencyCode(shoot))}</code>
                  </span>
                </div>
              ` : ""}
            </div>

            ${coverSrc ? `
              <div class="portal-shoot-splash__hero-media" id="shoot-splash-hero-media" title="Click to view cover portrait full-screen">
                <img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(shoot.clientName || "Client Gallery")}" class="portal-shoot-splash__hero-img" loading="eager" decoding="async">
                <span class="portal-shoot-splash__hero-caption">${escapeHtml(shoot.clientName || "Proofing")} &middot; Selection Suite</span>
              </div>
            ` : ""}
          </div>
        </div>
      </div>
    `;

    const form = container.querySelector("#shoot-splash-form");
    const codeInput = container.querySelector("#shoot-splash-code-input");
    const enterBtn = container.querySelector("#shoot-splash-enter-btn");
    const errorEl = container.querySelector("#shoot-splash-error");
    const dashboardBtn = container.querySelector("#shoot-splash-dashboard-btn");
    const heroMediaTrigger = container.querySelector("#shoot-splash-hero-media");

    if (heroMediaTrigger && coverSrc && typeof window.openLightbox === "function") {
      heroMediaTrigger.addEventListener("click", () => {
        window.openLightbox([{
          src: coverSrc,
          model: shoot.clientName || "Selection Suite",
          movie: `${shoot.shootTitle || "Proofing"} (Cover Portrait)`
        }], 0);
      });
    }

    const showSplashError = (msg) => {
      if (!errorEl) return;
      errorEl.textContent = msg;
      errorEl.style.display = "block";
      if (codeInput) {
        codeInput.classList.remove("has-error");
        void codeInput.offsetWidth;
        codeInput.classList.add("has-error");
      }
    };

    if (form && codeInput) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const entered = (codeInput.value || "").trim().toLowerCase();
        if (!entered) {
          showSplashError("Please enter your access passcode.");
          return;
        }
        const clientCode = (shoot.code || "").trim().toLowerCase();
        const agencyCode = (getShootAgencyCode(shoot) || "").trim().toLowerCase();

        if (agencyCode && entered === agencyCode) {
          if (errorEl) errorEl.style.display = "none";
          if (enterBtn) enterBtn.textContent = "Opening Agency View...";
          await openShootWithMode(container, shoot, "agency");
          return;
        }
        if (clientCode && entered === clientCode) {
          if (errorEl) errorEl.style.display = "none";
          if (enterBtn) enterBtn.textContent = "Opening Gallery...";
          await openShootWithMode(container, shoot, "client");
          return;
        }
        showSplashError("Access code not recognised for this gallery. Please check your passcode or contact Koray.");
      });
    }

    if (dashboardBtn) {
      dashboardBtn.addEventListener("click", () => {
        activeShootId = null;
        portalViewMode = "client";
        if (typeof window !== "undefined") {
          window.location.hash = buildPortalRouteHash("");
        }
        renderLandingScreen(container);
      });
    }
  }

  /* ---------------------------------------------------------
     Cloudflare R2 Storage Live Counter
     --------------------------------------------------------- */
  function renderStorageGaugeHtml(data, isRefreshing = false) {
    if (!data) {
      return `
        <div class="portal-storage-gauge" id="portal-storage-gauge">
          <div class="portal-storage-header">
            <div class="portal-storage-title-wrap">
              <span class="portal-storage-icon">&#9729;</span>
              <span class="portal-storage-title">Cloudflare R2 Image Storage</span>
              <span class="portal-storage-status-pill">Connecting&hellip;</span>
            </div>
            <div class="portal-storage-actions">
              <span class="portal-storage-summary">Checking live storage&hellip;</span>
              <button type="button" class="portal-storage-refresh-btn" data-action="refresh-storage" title="Refresh live storage metrics from Cloudflare">&#8635; Refresh</button>
            </div>
          </div>
          <div class="portal-storage-bar-track">
            <div class="portal-storage-bar-fill" style="width: 3%;"></div>
          </div>
          <div class="portal-storage-meta-row">
            <span>Loading storage metrics from Cloudflare R2&hellip;</span>
            <span>10 GB Free Tier</span>
          </div>
        </div>
      `;
    }

    const {
      totalMB = 0,
      totalGB = 0,
      freeTierGB = 10,
      percentUsed = 0,
      remainingGB = 10,
      totalObjects = 0,
      isOverLimit = false,
      overageGB = 0,
      estimatedMonthlyOverageCost = 0
    } = data;

    const statusClass = isOverLimit ? "is-overage" : (percentUsed > 80 ? "is-warning" : "is-free-active");
    const statusLabel = isOverLimit
      ? `Overage Active (+${overageGB} GB · ~£${(estimatedMonthlyOverageCost * 0.8).toFixed(2)}/mo)`
      : (percentUsed > 80 ? `${percentUsed}% Used (Approaching 10 GB Free Tier)` : `10 GB Free Tier Active (No Charges)`);

    const displayUsage = totalGB >= 1 ? `${totalGB} GB` : `${totalMB} MB`;

    return `
      <div class="portal-storage-gauge" id="portal-storage-gauge">
        <div class="portal-storage-header">
          <div class="portal-storage-title-wrap">
            <span class="portal-storage-icon">&#9729;</span>
            <span class="portal-storage-title">Cloudflare R2 Image Storage</span>
            <span class="portal-storage-status-pill ${statusClass}">${statusLabel}</span>
          </div>
          <div class="portal-storage-actions">
            <span class="portal-storage-summary">${displayUsage} / ${freeTierGB} GB (${percentUsed}% used)</span>
            <button type="button" class="portal-storage-refresh-btn" data-action="refresh-storage" title="Refresh live storage metrics from Cloudflare">
              ${isRefreshing ? "&#8635; Refreshing&hellip;" : "&#8635; Refresh"}
            </button>
          </div>
        </div>
        <div class="portal-storage-bar-track">
          <div class="portal-storage-bar-fill ${statusClass}" style="width: ${Math.min(100, Math.max(2, percentUsed))}%;"></div>
        </div>
        <div class="portal-storage-meta-row">
          <span>${isOverLimit ? `<strong>${overageGB} GB</strong> over 10 GB free tier` : `<strong>${remainingGB} GB</strong> free allowance remaining`}</span>
          <span>${totalObjects.toLocaleString()} photos stored across galleries</span>
        </div>
      </div>
    `;
  }

  function updateStorageGaugesInDOM(data, isRefreshing = false) {
    const html = renderStorageGaugeHtml(data, isRefreshing);
    document.querySelectorAll("#portal-storage-gauge-wrap, #studio-portal-storage-gauge-wrap").forEach(el => {
      el.innerHTML = html;
    });

    if (data && data.folderBreakdownMB) {
      document.querySelectorAll("[data-shoot-id]").forEach(card => {
        const shootId = card.dataset.shootId;
        if (!shootId) return;
        const mb = data.folderBreakdownMB[shootId];
        if (mb != null) {
          let pill = card.querySelector(".portal-shoot-storage-pill");
          if (!pill) {
            const coverWrap = card.querySelector(".portal-shoot-cover-wrap");
            if (coverWrap) {
              pill = document.createElement("span");
              pill.className = "portal-shoot-storage-pill";
              pill.title = "Cloudflare R2 Storage";
              coverWrap.appendChild(pill);
            }
          }
          if (pill) {
            pill.textContent = `${mb} MB`;
            pill.style.display = "inline-block";
          }
        }
      });
    }
  }

  async function fetchCloudflareStorageMetrics(forceRefresh = false) {
    if (forceRefresh) {
      updateStorageGaugesInDOM(window._KH_R2_STORAGE, true);
    }
    try {
      const url = forceRefresh ? "/api/r2-storage?fresh=1" : "/api/r2-storage";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Storage fetch failed");
      const data = await res.json();
      if (data && data.ok) {
        window._KH_R2_STORAGE = data;
        updateStorageGaugesInDOM(data, false);
        return data;
      }
    } catch (e) {
      console.warn("Storage check failed:", e);
      updateStorageGaugesInDOM(window._KH_R2_STORAGE, false);
    }
    return null;
  }

  window.renderStorageGaugeHtml = renderStorageGaugeHtml;
  window.fetchCloudflareStorageMetrics = fetchCloudflareStorageMetrics;
  window.updateStorageGaugesInDOM = updateStorageGaugesInDOM;

  if (typeof document !== "undefined") {
    document.addEventListener("click", (e) => {
      const refreshBtn = e.target.closest("[data-action='refresh-storage']");
      if (refreshBtn) {
        e.stopPropagation();
        fetchCloudflareStorageMetrics(true);
      }
    });
  }

  /* ---------------------------------------------------------
     1. Portal Landing & Access Code Entry Screen
     --------------------------------------------------------- */
  function renderLandingScreen(container) {
    const allShoots = getAllShoots();
    const isPhotographer = isPhotographerAuth();
    const H = getClientPortalHeaderConfig();

    const bannerTag = H.tag || (isPhotographer ? "photographer control centre" : "exclusive client area");
    const bannerTitle = H.title || (isPhotographer ? "client management" : "client proofing & portal");
    const bannerLead = H.intro || (isPhotographer 
      ? "Photographer master dashboard. Review live client shoot selections synced via Firebase Cloud." 
      : "Welcome to your private proofing gallery. Please enter your shoot access code to review, toggle tone variations, add editing notes, and select your favourite versions for final retouching.");
    const bannerImg = H.heroImage || "https://pub-c64c2ecfb504495cb6e4b8d1dde437c0.r2.dev/headers/client-portal_desktop/headers_client-portal_desktop_1794623028408.jpg";
    const bannerImgMobile = H.heroImageMobile || H.heroMobileImage || H.heroImage || bannerImg || "https://pub-c64c2ecfb504495cb6e4b8d1dde437c0.r2.dev/headers/client-portal_mobile/headers_client-portal_mobile_1794623039182.jpg";
    const heroMobileAspect = H.heroMobileAspect || '4 / 5';
    const mobileSrcset = (window.safeHeroUrl ? window.safeHeroUrl(bannerImgMobile) : (bannerImgMobile.startsWith("data:") ? bannerImgMobile : encodeURI(bannerImgMobile)));
    const initialHeroImgSrc = (window.safeHeroUrl ? window.safeHeroUrl(bannerImg) : bannerImg);

    const cardLabel = H.accessCardLabel || (isPhotographer ? "Shoot Access Code or Master Passkey" : "Private Shoot Access Code");
    const placeholderText = H.accessPlaceholder || (isPhotographer ? "Enter client shoot code..." : "Enter your shoot access code...");
    const buttonText = H.accessBtnText || "Enter Gallery &rarr;";
    const hintText = H.accessHint || "";

    const guideTitle1 = H.guideTitle1 || "Tone Variations";
    const guideDesc1 = H.guideDesc1 || "Every photo is available in Colour, Black & White, and Faded B&W. Switch baseline at the top or toggle below each photo.";
    const guideTitle2 = H.guideTitle2 || "Pick Multiple Versions";
    const guideDesc2 = H.guideDesc2 || "Tap the heart to select. You can choose both Colour and Black & White versions of any photo.";
    const guideTitle3 = H.guideTitle3 || "Leave Editing Notes";
    const guideDesc3 = H.guideDesc3 || "When you like an image, tap the note icon next to the heart to leave specific retouching requests.";

    container.innerHTML = `
      <div class="portal-landing-wrap">
        <!-- Unified Cinematic Hero Banner -->
        <header class="cinematic-hero-banner">
          <div class="cinematic-hero-banner__img-box" style="--hero-mobile-aspect: ${heroMobileAspect};">
            <picture>
              <source media="(max-width: 768px)" srcset="${escapeHtml(mobileSrcset)}">
              <img src="${escapeHtml(initialHeroImgSrc)}" alt="${escapeHtml(bannerTitle)}" loading="eager">
            </picture>
            <div class="cinematic-hero-banner__scrim"></div>
          </div>
          <div class="cinematic-hero-banner__content">
            <div class="cinematic-hero-tag-row">
              <span class="cinematic-hero-tag">${escapeHtml(bannerTag)}</span>
            </div>
            <h1 class="cinematic-hero-title">${escapeHtml(bannerTitle)}</h1>
            <p class="cinematic-hero-lead">${escapeHtml(bannerLead)}</p>
          </div>
        </header>

        <!-- Access Code Entry Form -->
        <div class="portal-access-card">
          <label for="portal-code-input" class="portal-input-label">
            ${escapeHtml(cardLabel)}
          </label>
          <div class="portal-input-group">
            <input 
              type="text" 
              id="portal-code-input" 
              class="portal-text-input" 
              placeholder="${escapeHtml(placeholderText)}" 
              autocomplete="off" 
              spellcheck="false"
            />
            <button type="button" id="portal-enter-btn" class="portal-enter-btn">
              ${escapeHtml(buttonText).replace(/&amp;rarr;/g, "&rarr;")}
            </button>
          </div>
          ${hintText ? `<p class="portal-access-hint" style="font-size:13.5px; color:var(--text-muted); margin:12px 0 0 0; line-height:1.5;">${escapeHtml(hintText)}</p>` : ''}
          <div id="portal-error-msg" class="portal-error-msg" style="display: none;"></div>
        </div>

        ${isPhotographer ? `
          <!-- Available Shoots Section (Photographer Master View Only) -->
          <div class="portal-shoots-section">
            <div class="portal-admin-toolbar">
              <div class="portal-admin-status">
                <span class="portal-admin-badge">&#9679; Photographer Dashboard &middot; Cloud Live</span>
                <span class="portal-admin-sub">${allShoots.length} active client shoot galleries &middot; Real-time Firebase Sync</span>
              </div>
              <div class="portal-admin-actions">
                <button type="button" class="portal-admin-create-btn" id="portal-admin-create-gallery">
                  + Create New Gallery
                </button>
                <a href="#/photographer-dashboard" class="portal-admin-action-btn" id="portal-admin-studio-btn" title="Master Photographer Studio: Sets, Splash &amp; Testimonials">
                  &#9881; Master Studio &rarr;
                </a>
                <button type="button" class="portal-admin-sync-btn" id="portal-admin-sync" title="Refresh client selections from Cloud">
                  Sync Cloud &#8635;
                </button>
                <button type="button" class="portal-admin-logout-btn" id="portal-admin-logout">
                  Lock Dashboard &times;
                </button>
              </div>
            </div>

            <!-- Live Cloudflare R2 Storage Gauge -->
            <div id="portal-storage-gauge-wrap">
              ${renderStorageGaugeHtml(window._KH_R2_STORAGE)}
            </div>

            <div class="portal-shoots-grid">
              ${allShoots.map(s => {
                const status = loadSubmissionStatus(s.id);
                const curSelections = loadSelections(s.id);
                const agSelections = loadAgencySelections(s.id);
                const count = status && status.count != null ? status.count : curSelections.size;
                const isSubmitted = status && status.submitted && count > 0;
                const agCount = agSelections.size;
                return `
                <div class="portal-shoot-card ${isSubmitted ? "has-submitted-selections" : ""}" data-shoot-id="${s.id}">
                  <div class="portal-shoot-cover-wrap">
                    <img 
                      src="${getShootCoverSrc(s)}" 
                      alt="${s.clientName}" 
                      class="portal-shoot-cover-img" 
                      data-shoot-id="${s.id}" 
                      data-blob-key="${getShootCoverBlobKey(s)}"
                      loading="lazy"
                    >
                    ${isSubmitted ? `
                      <span class="portal-shoot-badge portal-shoot-status-badge is-submitted">
                        <span class="status-dot"></span> Client Selected (${count})
                      </span>
                    ` : curSelections.size > 0 ? `
                      <span class="portal-shoot-badge portal-shoot-status-badge in-progress">
                        <span class="status-dot"></span> ${curSelections.size} Selected
                      </span>
                    ` : `
                      <span class="portal-shoot-badge">${s.images.length} Proofs</span>
                    `}
                    ${(window._KH_R2_STORAGE && window._KH_R2_STORAGE.folderBreakdownMB && window._KH_R2_STORAGE.folderBreakdownMB[s.id]) ? `
                      <span class="portal-shoot-storage-pill" title="Cloudflare R2 Storage">${window._KH_R2_STORAGE.folderBreakdownMB[s.id]} MB</span>
                    ` : ""}
                    ${agCount > 0 ? `
                      <span class="portal-shoot-badge portal-shoot-agency-badge">&#9733; Agency (${agCount})</span>
                    ` : ""}
                    ${s.hasVariants ? `<span class="portal-shoot-variant-badge">Multi-Tone Options</span>` : ""}
                  </div>
                  <div class="portal-shoot-details">
                    <span class="portal-shoot-meta">${s.shootDate} &middot; ${s.location}${s.isTfp ? ` <span class="portal-shoot-tfp-badge">TFP</span>` : ""}</span>
                    <h3 class="portal-shoot-client">${s.clientName}</h3>
                    <p class="portal-shoot-desc">${s.shootTitle}</p>
                    <div class="portal-shoot-footer">
                      <!-- Passcodes & Admin Toolbar -->
                      <div class="portal-shoot-meta-toolbar">
                        <div class="portal-shoot-codes-block">
                          <button type="button" class="portal-code-pill portal-copy-code-btn" data-code="${escapeHtml(s.code)}" title="Click to copy Client Access Code">
                            <span class="portal-code-type">Client:</span>
                            <span class="portal-code-val">${escapeHtml(s.code)}</span>
                            <span class="portal-code-copy-tag">Copy</span>
                          </button>
                          <button type="button" class="portal-code-pill is-agency portal-copy-code-btn" data-code="${escapeHtml(getShootAgencyCode(s))}" title="Click to copy Agency Access Code">
                            <span class="portal-code-type">Agency:</span>
                            <span class="portal-code-val">${escapeHtml(getShootAgencyCode(s))}</span>
                            <span class="portal-code-copy-tag">Copy</span>
                          </button>
                        </div>

                        <div class="portal-shoot-admin-tools">
                          ${s.isCustom ? `
                            <button type="button" class="portal-admin-tool-btn portal-edit-gallery-btn" data-shoot-id="${s.id}" title="Edit gallery setup">&#9998; Edit Setup</button>
                            <button type="button" class="portal-admin-tool-btn portal-export-code-btn" data-shoot-id="${s.id}" title="Export JavaScript code">Export</button>
                          ` : ""}
                          <button type="button" class="portal-admin-tool-btn is-delete portal-delete-gallery-btn" data-shoot-id="${s.id}" title="Delete gallery">&times;</button>
                        </div>
                      </div>

                      <!-- Gallery Action Buttons Grid -->
                      <div class="portal-card-actions-grid">
                        ${isSubmitted ? `
                          <button type="button" class="portal-card-btn is-review-btn" data-action="review" data-shoot-id="${s.id}">Review Picks (${count}) &rarr;</button>
                        ` : `
                          <button type="button" class="portal-card-btn is-primary-btn" data-action="gallery" data-shoot-id="${s.id}">Open &rarr;</button>
                        `}
                        <button type="button" class="portal-card-btn is-agency-btn" data-action="agency" data-shoot-id="${s.id}" title="Open Agency &amp; Casting Showcase View">&#9733; Agency View${agCount > 0 ? ` (${agCount})` : ""}</button>
                        <button type="button" class="portal-card-btn is-secondary-btn" data-action="copy-splash" data-shoot-id="${s.id}" title="Copy shareable Client Splash Page URL">Copy Link &#128279;</button>
                        <button type="button" class="portal-card-btn is-subtle-btn" data-action="splash" data-shoot-id="${s.id}" title="Preview Client Splash Passcode Screen">Splash</button>
                        ${(s.deliveryDriveUrl || s.deliveryFolderId) ? `
                          <button type="button" class="portal-card-btn is-delivery-btn" data-action="delivery" data-shoot-id="${s.id}" title="Open Final Retouched Delivery Page">&#10022; Final Delivery &rarr;</button>
                          <button type="button" class="portal-card-btn is-secondary-btn" data-action="copy-delivery" data-shoot-id="${s.id}" title="Copy shareable Final Delivery URL">Copy Delivery Link &#128279;</button>
                        ` : ""}
                      </div>
                    </div>
                  </div>
                </div>
              `;
              }).join("")}
            </div>
          </div>
        ` : ""}

        <!-- Help & Instructions (Visible to clients) -->
        <div class="portal-guide-card">
          <div class="portal-guide-col">
            <span class="portal-step-num">01</span>
            <h4>${escapeHtml(guideTitle1)}</h4>
            <p>${escapeHtml(guideDesc1)}</p>
          </div>
          <div class="portal-guide-col">
            <span class="portal-step-num">02</span>
            <h4>${escapeHtml(guideTitle2)}</h4>
            <p>${escapeHtml(guideDesc2)}</p>
          </div>
          <div class="portal-guide-col">
            <span class="portal-step-num">03</span>
            <h4>${escapeHtml(guideTitle3)}</h4>
            <p>${escapeHtml(guideDesc3)}</p>
          </div>
        </div>
      </div>
    `;

    // Bind Access Code Submission
    const input = container.querySelector("#portal-code-input");
    const enterBtn = container.querySelector("#portal-enter-btn");
    const errorMsg = container.querySelector("#portal-error-msg");

    async function handleEnter() {
      const rawInput = (input.value || "").trim();
      const code = rawInput.toLowerCase();
      if (!rawInput) {
        showError("Please enter your shoot access code.");
        return;
      }

      // Master Passkey Authentication for Koray (verified server-side).
      // Codes that exactly match a shoot already on this device skip the check, so clients see no extra delay.
      const isExactLocalShootCode = allShoots.some(s =>
        (s.code && s.code.trim().toLowerCase() === code) ||
        (s.id && s.id.toLowerCase() === code) ||
        getShootAgencyCode(s).toLowerCase() === code
      );
      if (!isExactLocalShootCode) {
        enterBtn.textContent = "Checking...";
        const isMaster = await verifyPhotographerPasskey(rawInput);
        enterBtn.textContent = "Enter Gallery →";
        if (isMaster) {
          setPhotographerAuth(true);
          errorMsg.style.display = "none";
          enterBtn.textContent = "Loading Dashboard...";
          try {
            await Promise.allSettled([
              syncAllCustomGalleriesFromCloud(),
              syncAllShootsFromCloud()
            ]);
          } catch (e) {}
          renderLandingScreen(container);
          return;
        }
      }

      const findCodeMatch = (list) => {
        let m = list.find(s => getShootAgencyCode(s).toLowerCase() === code);
        if (m) return { shoot: m, mode: "agency" };
        m = list.find(s =>
          (s.code && s.code.trim().toLowerCase() === code) ||
          (s.id && s.id.toLowerCase() === code) ||
          (s.clientName && s.clientName.toLowerCase().includes(code))
        );
        return m ? { shoot: m, mode: "client" } : null;
      };

      // Client or Agency Code Lookup
      let resolved = findCodeMatch(allShoots);

      // If not found locally, try quick cloud sync in case it was created on desktop
      if (!resolved) {
        enterBtn.textContent = "Checking...";
        await syncAllCustomGalleriesFromCloud();
        resolved = findCodeMatch(getAllShoots());
        enterBtn.textContent = "Enter Gallery →";
      }

      if (resolved && resolved.shoot) {
        errorMsg.style.display = "none";
        await openShootWithMode(container, resolved.shoot, resolved.mode);
        return;
      } else {
        showError("Access code not found. Please verify your code or contact Koray.");
      }
    }

    function showError(msg) {
      errorMsg.textContent = msg;
      errorMsg.style.display = "block";
    }

    enterBtn.addEventListener("click", handleEnter);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleEnter();
    });

    // Helper: copy text to clipboard with fallback
    async function copyTextToClipboard(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (e) {}
      }
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const res = document.execCommand("copy");
        document.body.removeChild(ta);
        return res;
      } catch (e) {
        return false;
      }
    }

    // Bind Copy Access Code Buttons
    container.querySelectorAll(".portal-copy-code-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const code = btn.dataset.code;
        if (!code) return;
        const ok = await copyTextToClipboard(code);
        if (ok) {
          const copyTag = btn.querySelector(".portal-code-copy-tag");
          if (copyTag) {
            const originalTagText = copyTag.textContent;
            btn.classList.add("is-copied");
            copyTag.textContent = "Copied ✓";
            setTimeout(() => {
              btn.classList.remove("is-copied");
              copyTag.textContent = originalTagText;
            }, 2000);
          } else {
            const originalHtml = btn.innerHTML;
            btn.classList.add("is-copied");
            btn.innerHTML = `<span>Copied ✓</span>`;
            setTimeout(() => {
              btn.classList.remove("is-copied");
              btn.innerHTML = originalHtml;
            }, 2000);
          }
        }
      });
    });

    // Bind Logout Button (if in photographer mode)
    const logoutBtn = container.querySelector("#portal-admin-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        setPhotographerAuth(false);
        renderLandingScreen(container);
      });
    }

    // Helper: show floating toast notification
    function showPortalToast(msg) {
      let t = document.getElementById("portal-toast-msg");
      if (!t) {
        t = document.createElement("div");
        t.id = "portal-toast-msg";
        t.className = "splash-customiser-toast";
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.classList.add("is-visible");
      setTimeout(() => {
        t.classList.remove("is-visible");
      }, 2800);
    }

    // Bind Cloud Sync Button (Photographer Dashboard: sync custom galleries + client selections)
    const syncBtn = container.querySelector("#portal-admin-sync");
    if (syncBtn) {
      syncBtn.addEventListener("click", async () => {
        syncBtn.textContent = "Syncing Cloud...";
        syncBtn.disabled = true;
        try {
          await Promise.allSettled([
            syncAllCustomGalleriesFromCloud(),
            syncAllShootsFromCloud()
          ]);
          renderLandingScreen(container);
          showPortalToast("Cloud Sync Complete ✓ Galleries & Selections updated.");
        } catch (e) {
          syncBtn.textContent = "Sync Failed";
          setTimeout(() => {
            syncBtn.disabled = false;
            syncBtn.innerHTML = "Sync Cloud &#8635;";
          }, 2000);
        }
      });
    }

    // Auto-sync custom galleries & selections in background on opening
    if (!container.__hasSyncedCloud) {
      container.__hasSyncedCloud = true;
      Promise.allSettled([
        syncAllCustomGalleriesFromCloud(),
        syncAllShootsFromCloud()
      ]).then(() => {
        if (isPhotographer) {
          if (typeof window !== "undefined" && (window.location.hash.includes("/create") || window.location.hash.includes("/edit"))) {
            return;
          }
          if (container.querySelector(".portal-builder-page-wrap")) {
            return;
          }
          renderLandingScreen(container);
        }
      });
    }

    // Bind "+ Create New Gallery" Button
    const createBtn = container.querySelector("#portal-admin-create-gallery");
    if (createBtn) {
      createBtn.addEventListener("click", () => {
        if (typeof window !== "undefined") {
          window.location.hash = "#/client-portal/create";
        }
        renderGalleryBuilderPage(container);
      });
    }

    // Bind Storage Refresh Buttons
    container.querySelectorAll("[data-action='refresh-storage']").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        fetchCloudflareStorageMetrics(true);
      });
    });

    if (isPhotographer) {
      fetchCloudflareStorageMetrics();
    }



    // Bind Edit Gallery Buttons
    container.querySelectorAll(".portal-edit-gallery-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.shootId;
        if (typeof window !== "undefined") {
          window.location.hash = `#/client-portal/${id}/edit`;
        } else {
          renderGalleryBuilderPage(container, id);
        }
      });
    });

    // Bind Export Code Buttons
    container.querySelectorAll(".portal-export-code-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.shootId;
        openExportModal(id);
      });
    });

    // Bind Delete Gallery Buttons
    container.querySelectorAll(".portal-delete-gallery-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.shootId;
        if (confirm("Are you sure you want to delete this gallery? This will permanently remove the gallery and its photos from Cloudflare R2 storage.")) {
          deleteCustomShoot(id);
          renderLandingScreen(container);
        }
      });
    });

    // Bind card clicks & Open gallery buttons
    container.querySelectorAll(".portal-shoot-card").forEach(card => {
      card.addEventListener("click", async (e) => {
        // Ignore if clicking action buttons that have their own listeners
        if (e.target.closest(".portal-custom-action-btn") || e.target.closest(".portal-copy-code-btn") || e.target.closest(".portal-admin-tool-btn")) {
          return;
        }

        const id = card.dataset.shootId;
        if (!id) return;
        activeShootId = id;

        const copySplashBtn = e.target.closest("[data-action='copy-splash']");
        if (copySplashBtn) {
          e.stopPropagation();
          const splashUrl = buildShootSplashUrl(id);
          const ok = await copyTextToClipboard(splashUrl);
          if (ok) {
            const orig = copySplashBtn.innerHTML;
            copySplashBtn.textContent = "Link Copied ✓";
            setTimeout(() => {
              copySplashBtn.innerHTML = orig;
            }, 2200);
          }
          return;
        }

        const copyDeliveryBtn = e.target.closest("[data-action='copy-delivery']");
        if (copyDeliveryBtn) {
          e.stopPropagation();
          const deliveryUrl = buildShootDeliveryUrl(id);
          const ok = await copyTextToClipboard(deliveryUrl);
          if (ok) {
            const orig = copyDeliveryBtn.innerHTML;
            copyDeliveryBtn.textContent = "Delivery Link Copied ✓";
            setTimeout(() => {
              copyDeliveryBtn.innerHTML = orig;
            }, 2200);
          }
          return;
        }

        const splashBtn = e.target.closest("[data-action='splash']");
        if (splashBtn) {
          e.stopPropagation();
          const targetHash = buildPortalRouteHash(`${id}/splash`);
          if (typeof window !== "undefined" && window.location.hash !== targetHash) {
            window.location.hash = targetHash;
          } else {
            renderClientPortalEdition(container, id, "splash");
          }
          return;
        }

        const agencyBtn = e.target.closest("[data-action='agency']");
        if (agencyBtn) {
          e.stopPropagation();
          const shootObj = getShootById(id);
          if (shootObj) {
            await openShootWithMode(container, shootObj, "agency");
          } else {
            setShootUnlockedMode(id, "agency");
            const targetHash = buildPortalRouteHash(`${id}/agency`);
            if (typeof window !== "undefined") window.location.hash = targetHash;
          }
          return;
        }

        const deliveryBtn = e.target.closest("[data-action='delivery']");
        if (deliveryBtn) {
          e.stopPropagation();
          setShootUnlockedMode(id, "client");
          const targetHash = buildPortalRouteHash(`${id}/delivery`);
          if (typeof window !== "undefined" && window.location.hash !== targetHash) {
            window.location.hash = targetHash;
            return;
          }
          const shootObj = getShootById(id);
          if (shootObj) {
            await renderShootDeliveryPage(container, shootObj);
          }
          return;
        }

        const reviewBtn = e.target.closest("[data-action='review']");
        if (reviewBtn) {
          e.stopPropagation();
          setShootUnlockedMode(id, "client");
          const targetHash = buildPortalRouteHash(`${id}/review`);
          if (typeof window !== "undefined" && window.location.hash !== targetHash) {
            window.location.hash = targetHash;
            return;
          }
          const shoot = getShootById(id);
          if (shoot) {
            if (shoot.isCustom) {
              await preloadShootBlobUrls(shoot);
            }
            selectedMap = loadSelections(shoot.id);
            itemNotes = loadNotes(shoot.id);
            renderShootReviewPage(container, shoot);
          }
          return;
        }

        const shoot = getShootById(id);
        if (shoot) {
          await openShootWithMode(container, shoot, "client");
        } else {
          setShootUnlockedMode(id, "client");
          const targetHash = buildPortalRouteHash(id);
          if (typeof window !== "undefined" && window.location.hash !== targetHash) {
            window.location.hash = targetHash;
          } else {
            renderClientPortalEdition(container, id, null);
          }
        }
      });
    });

    // Concurrently preload cover blobs for custom shoots in background
    allShoots.forEach(s => {
      if (s.isCustom) {
        preloadShootBlobUrls(s);
      }
    });

    // In photographer dashboard mode, automatically sync latest client selections from Cloud
    if (isPhotographer) {
      syncAllShootsFromCloud(() => {
        container.querySelectorAll(".portal-shoot-card").forEach(card => {
          const sId = card.dataset.shootId;
          if (!sId) return;
          const status = loadSubmissionStatus(sId);
          const curSelections = loadSelections(sId);
          const count = status && status.count != null ? status.count : curSelections.size;
          const isSubmitted = status && status.submitted && count > 0;
          
          const statusBadge = card.querySelector(".portal-shoot-status-badge");
          if (statusBadge) {
            if (isSubmitted) {
              statusBadge.className = "portal-shoot-badge portal-shoot-status-badge is-submitted";
              statusBadge.innerHTML = `<span class="status-dot"></span> Client Selected (${count})`;
            } else if (curSelections.size > 0) {
              statusBadge.className = "portal-shoot-badge portal-shoot-status-badge in-progress";
              statusBadge.innerHTML = `<span class="status-dot"></span> ${curSelections.size} Selected`;
            }
          }
          const reviewBtn = card.querySelector("[data-action='review']");
          if (reviewBtn) {
            reviewBtn.textContent = `Review (${count}) \u2192`;
          }
        });
      });
    }
  }


  /* ---------------------------------------------------------
     1b. Interactive Client Gallery Creator & Code Exporter
     --------------------------------------------------------- */
  function generateAccessCode(clientName) {
    if (!clientName) return "CLIENT" + new Date().getFullYear();
    const first = clientName.trim().split(/\s+/)[0] || clientName;
    const clean = first.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return (clean.substring(0, 8) || "CLIENT") + new Date().getFullYear();
  }

  // Detect Tone variants from folder name or filename
  function detectTone(str) {
    if (!str) return null;
    const s = str.trim().toLowerCase().replace(/[^a-z0-9&+ -]/g, " ");
    // BNW Faded / Faded B&W / Matte variants (checked first so "bnw faded" isn't caught as pure bnw)
    if (/\b(bnw[ -]*faded?|faded?[ -]*bnw|bnwfaded|fadedbnw|faded?([ -]*b&?w)?|matte|vintage|film)\b/i.test(s) || /faded/i.test(s)) {
      return { key: "bnw-faded", label: "BNW Faded", short: "FADED", order: 3 };
    }
    // BNW / Black & White variants (including BNW, B&W, BW, Black and White)
    if (/\b(bnw|b[&/]?w|black[ -]*(and|&)[ -]*white|monochrome|mono|greyscale|grayscale|grey|gray)\b/i.test(s)) {
      return { key: "bnw", label: "BNW", short: "BNW", order: 2 };
    }
    // Warm / Sepia variants
    if (/\b(warm|sepia|golden)\b/i.test(s)) {
      return { key: "warm", label: "Warm Tone", short: "WARM", order: 4 };
    }
    // Colour / Color variants
    if (/\b(colou?rs?|rgb|original|full[ -]*colou?r|natural)\b/i.test(s)) {
      return { key: "colour", label: "Colour", short: "COLOUR", order: 1 };
    }
    return null;
  }

  // Strip tone suffixes from filenames to link matching photos (e.g. 001_colour.jpg -> 001.jpg)
  function cleanBaseFilename(filename) {
    return filename.replace(/[-_ .]+(colou?rs?|bnw[ -]*faded?|faded?[ -]*bnw|bnwfaded|fadedbnw|bnw|bw|b&w|black[ -]*(and|&)[ -]*white|faded?([ -]*(b&?w|bnw))?|warm|sepia)(\.[a-z0-9]+)$/i, "$2");
  }

  function getToneInfo(rawName) {
    if (!rawName) return { key: "standard", label: "Standard", short: "STD" };
    const rawClean = rawName.trim();
    const slug = rawClean.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    if (TONE_DICTIONARY[slug]) {
      return { key: slug, label: TONE_DICTIONARY[slug].label, short: TONE_DICTIONARY[slug].short };
    }

    const detected = detectTone(rawClean);
    if (detected) {
      return { key: slug || detected.key, label: detected.label, short: detected.short };
    }

    if (/^(bnw|b[&/]?w|black[ -]*(and|&)[ -]*white)$/i.test(rawClean)) {
      return { key: "bnw", label: "BNW", short: "BNW" };
    }
    if (/^(bnw[ -]*faded?|faded?[ -]*bnw|bnwfaded|fadedbnw|faded?([ -]*b&?w)?)$/i.test(rawClean) || /faded/i.test(rawClean)) {
      return { key: "bnw-faded", label: "BNW Faded", short: "FADED" };
    }
    if (/^(colou?rs?|rgb|original)$/i.test(rawClean) || /colou?r/i.test(rawClean)) {
      return { key: "colour", label: "Colour", short: "COLOUR" };
    }

    // Default: use the photographer's exact folder name in British English!
    const displayLabel = rawClean.replace(/^[0-9]+[_\-.]\s*/, "").replace(/[_-]/g, " ").trim();
    const words = displayLabel.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    const shortLabel = displayLabel.toUpperCase().substring(0, 6);
    return { key: slug || "ver", label: words || rawClean, short: shortLabel };
  }

  // Parse files recursively from a folder import (FileList or Drag-and-Drop)
  function parseFolderFilesIntoLooks(fileList) {
    const images = Array.from(fileList).filter(f => {
      if (f.name.startsWith(".") || f.name.startsWith("._") || f.name === ".DS_Store" || f.name === "Thumbs.db") {
        return false;
      }
      return f.type.startsWith("image/") || /\.(jpe?g|png|webp|avif|heic|tiff?)$/i.test(f.name);
    });

    if (images.length === 0) return null;

    // Check if there is a common root directory across the uploaded files
    const rootDirs = new Set();
    images.forEach(f => {
      const relPath = f.customRelativePath || f.webkitRelativePath || f.name;
      const parts = relPath.split("/").map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) rootDirs.add(parts[0]);
    });
    const hasCommonRoot = rootDirs.size === 1;
    const commonRoot = hasCommonRoot ? Array.from(rootDirs)[0] : "";

    // Check if filename overlap exists across immediate subfolders
    const subfolderFiles = new Map();
    images.forEach(f => {
      const relPath = f.customRelativePath || f.webkitRelativePath || f.name;
      const parts = relPath.split("/").map(p => p.trim()).filter(Boolean);
      const fn = cleanBaseFilename(parts[parts.length - 1] || f.name);
      if (parts.length === 3) {
        const sub = parts[1];
        if (!subfolderFiles.has(sub)) subfolderFiles.set(sub, new Set());
        subfolderFiles.get(sub).add(fn);
      }
    });

    let hasSubfolderFilenameOverlap = false;
    if (subfolderFiles.size > 1) {
      const subEntries = Array.from(subfolderFiles.values());
      for (let i = 0; i < subEntries.length; i++) {
        for (let j = i + 1; j < subEntries.length; j++) {
          for (const fn of subEntries[i]) {
            if (subEntries[j].has(fn)) {
              hasSubfolderFilenameOverlap = true;
              break;
            }
          }
          if (hasSubfolderFilenameOverlap) break;
        }
        if (hasSubfolderFilenameOverlap) break;
      }
    }

    const looksMap = new Map();
    let detectedShootTitle = commonRoot ? commonRoot.replace(/[_-]+/g, " ") : "";
    let orderCounter = 0;

    images.forEach(file => {
      const relPath = file.customRelativePath || file.webkitRelativePath || file.name;
      const parts = relPath.split("/").map(p => p.trim()).filter(Boolean);
      const rawFilename = parts[parts.length - 1] || file.name;
      const baseFilename = cleanBaseFilename(rawFilename);

      let lookName = "Look 1";
      let toneRaw = "";

      if (parts.length <= 1) {
        lookName = "Look 1 · Session";
        toneRaw = "Standard";
      } else if (parts.length === 2) {
        // e.g. Root / file.jpg
        lookName = "Look 1 · " + (commonRoot.replace(/[_-]+/g, " ").trim() || "Session");
        toneRaw = "Standard";
      } else if (parts.length === 3) {
        // e.g. Root / Subfolder / file.jpg
        const sub = parts[1];
        const isToneSub = hasSubfolderFilenameOverlap || detectTone(sub) !== null;
        if (isToneSub) {
          lookName = "Look 1 · " + (commonRoot.replace(/[_-]+/g, " ").trim() || "Session");
          toneRaw = sub;
        } else {
          lookName = sub;
          toneRaw = "Standard";
        }
      } else {
        // parts.length >= 4: Support both Root/Look/Tone/file.jpg and Root/Tone/Look/file.jpg
        const outer = parts[parts.length - 3];
        const inner = parts[parts.length - 2];
        if (detectTone(outer) !== null && detectTone(inner) === null) {
          lookName = inner;
          toneRaw = outer;
        } else {
          lookName = outer;
          toneRaw = inner;
        }
      }

      // Format tone key and label dynamically from whatever is in the folder
      const toneInfo = getToneInfo(toneRaw);
      const toneKey = toneInfo.key;

      // Clean up look name formatting
      lookName = lookName.replace(/^[0-9]+[_\-.]\s*/, "").replace(/_+/g, " ").trim();
      if (!lookName) lookName = "Look 1";

      if (!looksMap.has(lookName)) {
        looksMap.set(lookName, {
          id: `look-${orderCounter + 1}`,
          title: lookName,
          order: orderCounter++,
          toneKeys: new Set(),
          toneLabels: new Map(),
          itemsMap: new Map()
        });
      }

      const lookObj = looksMap.get(lookName);
      lookObj.toneKeys.add(toneKey);
      lookObj.toneLabels.set(toneKey, toneInfo.label);

      if (!lookObj.itemsMap.has(baseFilename)) {
        lookObj.itemsMap.set(baseFilename, {
          name: baseFilename,
          previewUrl: URL.createObjectURL(file),
          aspect: "2/3",
          versionFiles: {},
          versionUrls: {}
        });
      }

      const item = lookObj.itemsMap.get(baseFilename);
      item.versionFiles[toneKey] = file;
      item.versionUrls[toneKey] = URL.createObjectURL(file);
      // Prioritize colour preview if available, otherwise bnw or whatever is available
      if (!item.previewUrl || toneKey === "colour") {
        item.previewUrl = item.versionUrls[toneKey];
      } else if (!item.versionUrls["colour"] && (toneKey === "bnw" || toneKey === "bw")) {
        item.previewUrl = item.versionUrls[toneKey];
      }
    });

    // Build Looks array dynamically
    const constructedLooks = Array.from(looksMap.values()).map((l, idx) => {
      const toneKeysArr = Array.from(l.toneKeys);
      const toneLabelsArr = Array.from(l.toneLabels.values());

      let tonesNote = toneLabelsArr.length > 1
        ? `${toneLabelsArr.length} Versions: ${toneLabelsArr.join(" & ")}`
        : (toneLabelsArr[0] || "Standard Version");

      const files = Array.from(l.itemsMap.values());
      files.sort(naturalSortFilenames);

      return {
        id: `look-${idx + 1}`,
        title: l.title.charAt(0).toUpperCase() + l.title.slice(1),
        description: tonesNote,
        toneKeys: toneKeysArr,
        toneLabels: toneLabelsArr,
        files: files
      };
    });

    let clientSuggestion = "";
    if (detectedShootTitle) {
      const cleanShoot = detectedShootTitle.replace(/(shoot|session|editorial|proofing|gallery)/gi, "").trim();
      clientSuggestion = cleanShoot.split(/[-–—_]/)[0].trim();
    }

    return {
      shootTitle: detectedShootTitle,
      clientName: clientSuggestion,
      looks: constructedLooks
    };
  }

  // Recursive directory reader for drag-and-drop folders
  async function getFilesFromDataTransfer(items) {
    const files = [];
    async function traverse(entry, path = "") {
      if (entry.isFile) {
        await new Promise(resolve => {
          entry.file(f => {
            f.customRelativePath = (path ? path + "/" : "") + f.name;
            files.push(f);
            resolve();
          }, () => resolve());
        });
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const entries = await new Promise(resolve => {
          const batch = [];
          function readNext() {
            reader.readEntries(res => {
              if (!res || res.length === 0) resolve(batch);
              else {
                batch.push(...res);
                readNext();
              }
            }, () => resolve(batch));
          }
          readNext();
        });
        for (const child of entries) {
          await traverse(child, (path ? path + "/" : "") + entry.name);
        }
      }
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry) await traverse(entry);
      } else if (item.getAsFile) {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    return files;
  }

  async function renderGalleryBuilderPage(container, editShootId) {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    const existingShoot = editShootId ? getShootById(editShootId) : null;
    if (editShootId && !existingShoot) {
      activeShootId = null;
      portalViewMode = "client";
      renderLandingScreen(container);
      return;
    }
    const isEditMode = Boolean(editShootId && existingShoot);
    if (existingShoot && existingShoot.isCustom) {
      await preloadShootBlobUrls(existingShoot);
    }

    let initialLooks = [
      {
        id: "look-1",
        title: "Look 1 · Studio Tailored",
        description: "Studio portraits in warm minimal lighting",
        toneMode: "colour",
        toneKeys: ["colour"],
        customToneLabels: {},
        toneLabels: ["Colour"],
        files: []
      }
    ];

    if (existingShoot && existingShoot.sections && existingShoot.sections.length > 0) {
      initialLooks = existingShoot.sections.map((sec, idx) => {
        const toneKeysSet = new Set();
        const toneLabelsMap = { ...(existingShoot.customToneLabels || {}), ...(sec.customToneLabels || {}) };
        
        const files = (sec.images || []).map(img => {
          const vUrls = {};
          let primaryBlobKey = "";
          if (img.versions && typeof img.versions === "object") {
            Object.keys(img.versions).forEach(tKey => {
              toneKeysSet.add(tKey);
              const val = img.versions[tKey];
              let url = "";
              if (typeof val === "string" && val.startsWith("blobKey:")) {
                const bk = val.replace("blobKey:", "");
                if (!primaryBlobKey) primaryBlobKey = bk;
                url = blobUrlCache[bk] || "";
              } else if (typeof val === "string") {
                url = val;
              }
              vUrls[tKey] = url;
            });
          }
          const primaryTone = Array.from(toneKeysSet)[0] || "colour";
          let pUrl = resolveImageSrc(img, primaryTone) || img.src || "";
          if (typeof pUrl === "string" && (pUrl.startsWith("blobKey:") || pUrl.startsWith("blob:"))) {
            if (primaryBlobKey && blobUrlCache[primaryBlobKey]) {
              pUrl = blobUrlCache[primaryBlobKey];
            } else {
              pUrl = "";
            }
          }
          return {
            name: img.filename,
            previewUrl: pUrl,
            aspect: img.aspect || "2/3",
            existingBlobKey: primaryBlobKey || img.blobKey,
            existingVersions: img.versions,
            versionFiles: {},
            versionUrls: vUrls
          };
        });

        files.sort(naturalSortFilenames);

        const toneKeysArr = Array.from(toneKeysSet);
        if (toneKeysArr.length === 0) toneKeysArr.push("colour");

        return {
          id: sec.id || `look-${idx + 1}`,
          title: sec.title || `Look ${idx + 1}`,
          description: sec.description || "",
          toneKeys: toneKeysArr,
          customToneLabels: toneLabelsMap,
          toneLabels: toneKeysArr.map(k => toneLabelsMap[k] || getToneLabel(k, existingShoot)),
          files: files
        };
      });
    }

    const builderState = {
      isEditMode: isEditMode,
      editShootId: editShootId,
      clientName: existingShoot ? (existingShoot.clientName || "") : "",
      shootTitle: existingShoot ? (existingShoot.shootTitle || "") : "",
      accessCode: existingShoot ? (existingShoot.code || "") : "",
      agencyCode: existingShoot ? (existingShoot.agencyCode || getShootAgencyCode(existingShoot)) : "",
      shootDate: existingShoot ? (existingShoot.shootDate || "November 2026") : "November 2026",
      location: existingShoot ? (existingShoot.location || "London, England") : "London, England",
      packageQuota: existingShoot ? (existingShoot.packageQuota || 15) : 15,
      isTfp: existingShoot ? !!existingShoot.isTfp : false,
      tfpFavouriteLimit: existingShoot ? (parseInt(existingShoot.tfpFavouriteLimit, 10) || DEFAULT_TFP_FAV_LIMIT) : DEFAULT_TFP_FAV_LIMIT,
      deliveryDriveUrl: existingShoot ? (existingShoot.deliveryDriveUrl || "") : "",
      deliveryReady: existingShoot ? !!existingShoot.deliveryReady : false,
      deliveryHeading: existingShoot ? (existingShoot.deliveryHeading || "") : "",
      deliveryHeroFileId: existingShoot ? (existingShoot.deliveryHeroFileId || "") : "",
      clientNotifyEmail: (existingShoot && existingShoot.clientNotifyEmail) || (editShootId ? loadClientNotifyEmail(editShootId) : "") || "",
      sendDeliveryEmailOnSave: !(existingShoot && existingShoot.deliveryEmailSentAt),
      ...(() => {
        let defTpl = {};
        try {
          const rawTpl = localStorage.getItem("kh_default_delivery_email_tpl");
          if (rawTpl) defTpl = JSON.parse(rawTpl) || {};
        } catch (e) {}
        return {
          deliveryEmailSubject: (existingShoot && existingShoot.deliveryEmailSubject) || defTpl.subject || "Your Final Images Are Ready — Koray Hussein Photography",
          deliveryEmailHeading: (existingShoot && existingShoot.deliveryEmailHeading) || defTpl.heading || "Your images are ready",
          deliveryEmailBody: (existingShoot && existingShoot.deliveryEmailBody) || defTpl.body || "Your final retouched images are ready to view and download on your private delivery page.",
          deliveryEmailFooter: (existingShoot && existingShoot.deliveryEmailFooter) || defTpl.footer || "This is an auto-generated email. Please email contact@korayhussein.com for any follow ups."
        };
      })(),
      notes: existingShoot ? (existingShoot.notes || "") : "",
      coverBlobKey: existingShoot ? (existingShoot.coverBlobKey || "") : "",
      coverImage: existingShoot ? getShootCoverSrc(existingShoot) : "",
      coverFilename: existingShoot ? (existingShoot.coverFilename || "") : "",
      coverTone: existingShoot ? (existingShoot.coverTone || "colour") : "colour",
      coverCustomFile: null,
      splashFeatures: (existingShoot && Array.isArray(existingShoot.splashFeatures)) ? [...existingShoot.splashFeatures] : [],
      importSummary: isEditMode ? `Editing setup for ${existingShoot.clientName} (${initialLooks.length} looks)` : null,
      customToneLabels: existingShoot && existingShoot.customToneLabels ? { ...existingShoot.customToneLabels } : {},
      looks: initialLooks
    };

    function renderPageHtml() {
      container.innerHTML = `
        <div class="portal-builder-page-wrap">
          <!-- Top Navigation -->
          <div class="portal-builder-top-nav">
            <button type="button" class="portal-builder-back-btn" id="builder-back-btn">
              ${isEditMode ? "&larr; Back to Gallery" : "&larr; Back to Dashboard"}
            </button>
            <div class="portal-builder-breadcrumbs">
              <span>Photographer Control Centre</span>
              <span class="sep">/</span>
              <span class="active">${isEditMode ? "Edit Gallery Setup" : "Create Proofing Gallery"}</span>
            </div>
          </div>

          <!-- Page Header -->
          <div class="portal-builder-page-header">
            <span class="portal-meta-tag">${isEditMode ? "Gallery Setup Editor &middot; Live Configuration" : "Gallery Studio &middot; Multi-Look Proofing"}</span>
            <h1 class="portal-builder-page-title">${isEditMode ? `edit gallery setup &middot; ${builderState.clientName}` : "create client gallery"}</h1>
            <p class="portal-builder-page-lead">
              ${isEditMode 
                ? "Update client details, rename tone variations for client display, adjust looks, or add new photos." 
                : "Configure client access, import looks directly from your Google Drive shoot folder, and launch private client proofing with multiple versions and custom look sections."}
            </p>
          </div>

          <form id="portal-builder-form" class="portal-builder-form" onsubmit="return false;" style="padding: 0;">
            <!-- Step 1: Shoot & Client Info -->
            <div class="portal-builder-section" style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px;">
              <h3 class="portal-builder-section-title">01 &middot; Client & Shoot Information</h3>
              <div class="portal-builder-grid-2">
                <div class="portal-form-group">
                  <label class="portal-form-label">Client Name <span class="required">*</span></label>
                  <input type="text" id="builder-client-name" class="portal-form-input" placeholder="e.g. Elena Rostova" value="${builderState.clientName}" required autocomplete="off">
                </div>
                <div class="portal-form-group">
                  <label class="portal-form-label">Shoot Title <span class="required">*</span></label>
                  <input type="text" id="builder-shoot-title" class="portal-form-input" placeholder="e.g. Autumn Studio & Location Session" value="${builderState.shootTitle}" required>
                </div>
              </div>

              <div class="portal-builder-grid-2">
                <div class="portal-form-group">
                  <label class="portal-form-label">Client Login Code <span class="required">*</span></label>
                  <div class="portal-code-input-wrap">
                    <input type="text" id="builder-access-code" class="portal-form-input is-code" placeholder="e.g. ELENA2026" value="${escapeHtml(builderState.accessCode)}" required autocomplete="off">
                    <button type="button" id="builder-code-gen-btn" class="portal-code-gen-btn" title="Generate Client Access Code">&#127922;</button>
                  </div>
                  <span class="portal-form-help">Client enters this private passcode to open their standard gallery.</span>
                </div>
                <div class="portal-form-group">
                  <label class="portal-form-label">Agency Access Code</label>
                  <div class="portal-code-input-wrap">
                    <input type="text" id="builder-agency-code" class="portal-form-input is-code" placeholder="e.g. ELENA2026-AGENCY" value="${escapeHtml(builderState.agencyCode)}" autocomplete="off">
                    <button type="button" id="builder-agency-code-gen-btn" class="portal-code-gen-btn" title="Generate Agency Access Code">&#127922;</button>
                  </div>
                  <span class="portal-form-help">Agencies enter this separate passcode on the splash page to open Agency View.</span>
                </div>
              </div>

              <div class="portal-builder-grid-2" style="margin-top: 14px;">
                <div class="portal-form-group">
                  <label class="portal-form-label">Shoot Date</label>
                  <input type="text" id="builder-shoot-date" class="portal-form-input" placeholder="e.g. November 2026" value="${escapeHtml(builderState.shootDate)}">
                </div>
                <div class="portal-form-group">
                  <label class="portal-form-label">Location</label>
                  <input type="text" id="builder-shoot-location" class="portal-form-input" placeholder="e.g. London, England" value="${escapeHtml(builderState.location)}">
                </div>
              </div>

              <div class="portal-builder-quota-tfp-row">
                <div class="portal-form-group">
                  <label class="portal-form-label">Shoot Type &mdash; TFP Mode</label>
                  <button type="button" id="builder-tfp-toggle-btn" class="portal-tfp-toggle-btn ${builderState.isTfp ? "is-active" : ""}" aria-pressed="${builderState.isTfp ? "true" : "false"}">
                    <span>&#10022; TFP Shoot Mode: <strong>${builderState.isTfp ? "ON (No Quota \u00b7 Top 10 \u2665 + Unlimited \u2713)" : "OFF (Standard Paid Package)"}</strong></span>
                  </button>
                  <span class="portal-form-help">Tap to switch between a paid quota gallery and a TFP shoot (top 10 \u2665 favourites + unlimited \u2713 likes).</span>
                </div>
                <div class="portal-form-group ${builderState.isTfp ? "is-disabled" : ""}" id="builder-package-quota-group">
                  <label class="portal-form-label" for="builder-package-quota">Package Selections Quota (Included Edits)</label>
                  <input type="number" id="builder-package-quota" class="portal-form-input" min="1" max="500" step="1" placeholder="15" value="${parseInt(builderState.packageQuota, 10) || 15}" ${builderState.isTfp ? "disabled" : ""}>
                  <span class="portal-form-help" id="builder-package-quota-help">${builderState.isTfp ? "Disabled in TFP Shoot Mode \u2014 no selection quota or \u00a330 extra edits charge applies." : "Sets how many edits are included in their package before the extra edits counter (\u00a330/extra) kicks in."}</span>
                </div>
              </div>

              <div class="portal-builder-delivery-box" style="margin-top: 18px; padding: 16px; border: 1px solid rgba(223, 196, 155, 0.28); border-radius: 10px; background: rgba(223, 196, 155, 0.04);">
                <div class="portal-form-group" style="margin-bottom: 12px;">
                  <label class="portal-form-label" for="builder-delivery-drive-url">Final Delivery &mdash; Google Drive Folder Link (Optional)</label>
                  <input type="url" id="builder-delivery-drive-url" class="portal-form-input" placeholder="https://drive.google.com/drive/folders/... (set sharing to Anyone with the link)" value="${escapeHtml(builderState.deliveryDriveUrl || "")}">
                  <span class="portal-form-help">Automatically organises Looks, Tones (Colour, BNW, Faded, High Key), Close Ups &amp; Grid Layouts into Design 01 Split-Hero Final Delivery on korayhussein.com — uses zero R2 storage.</span>
                </div>
                <div class="portal-form-group" style="margin-bottom: 12px;">
                  <label class="portal-form-label" for="builder-delivery-heading">Delivery Page Heading (Replaces &ldquo;Final Collection&rdquo;)</label>
                  <input type="text" id="builder-delivery-heading" class="portal-form-input" placeholder="final collection (or client name / custom title)" value="${escapeHtml(builderState.deliveryHeading || "")}">
                </div>
                <div class="portal-form-group" id="builder-delivery-hero-wrap" style="margin-bottom: 12px;">
                  <label class="portal-form-label">Top Split-Hero Image (Optional)</label>
                  <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px;">
                    <button type="button" class="portal-btn-secondary" id="builder-load-drive-hero-btn" style="padding: 8px 14px; font-size: 12px;">Load Drive Photos to Pick Top Image</button>
                    <button type="button" class="portal-btn-secondary" id="builder-clear-drive-hero-btn" style="padding: 8px 12px; font-size: 12px; ${builderState.deliveryHeroFileId ? "" : "display: none;"}">Use Default (First Image)</button>
                    <span id="builder-drive-hero-status" style="font-size: 12px; color: var(--text-muted);">${builderState.deliveryHeroFileId ? "Custom top hero image selected ✓" : "Defaults to the first portrait in Look 1"}</span>
                  </div>
                  <div id="builder-drive-hero-grid" class="portal-builder-hero-grid" style="display: none;"></div>
                </div>
                <label style="display: inline-flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text); cursor: pointer;">
                  <input type="checkbox" id="builder-delivery-ready" ${builderState.deliveryReady ? "checked" : ""} style="accent-color: #dfc49b; width: 16px; height: 16px;">
                  <span><strong>Final Edits Ready</strong> &mdash; Open clients directly into their Final Delivery collection after entering their passcode</span>
                </label>

                <div class="portal-form-group" style="margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(223, 196, 155, 0.2);">
                  <label class="portal-form-label" for="builder-client-notify-email">Client Delivery Notification E-mail (Optional)</label>
                  <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px;">
                    <input type="email" id="builder-client-notify-email" class="portal-form-input" style="flex: 1 1 240px;" placeholder="Auto-filled if client added email on selection screen" value="${escapeHtml(builderState.clientNotifyEmail || "")}">
                    <button type="button" class="portal-btn-secondary" id="builder-send-ready-email-btn" style="padding: 9px 14px; font-size: 12px; white-space: nowrap;">Send Ready Email Now</button>
                  </div>
                  <span id="builder-notify-email-status" style="display: block; margin-top: 5px; font-size: 12px; color: var(--text-muted);">
                    ${(existingShoot && existingShoot.deliveryEmailSentAt) ? `Delivery email sent previously (${new Date(existingShoot.deliveryEmailSentAt).toLocaleDateString()}) &middot; ` : ""}Automatically pre-filled if the client entered their email while selecting proofs.
                  </span>
                  <label style="display: inline-flex; align-items: center; gap: 10px; font-size: 12.5px; color: var(--text); cursor: pointer; margin-top: 8px;">
                    <input type="checkbox" id="builder-send-delivery-email-chk" ${builderState.sendDeliveryEmailOnSave ? "checked" : ""} style="accent-color: #dfc49b; width: 15px; height: 15px;">
                    <span>Automatically email client &ldquo;Your images are ready&rdquo; when saving Final Delivery</span>
                  </label>

                  <details style="margin-top: 12px; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(223, 196, 155, 0.22); background: rgba(0, 0, 0, 0.16);">
                    <summary style="cursor: pointer; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; color: #dfc49b; text-transform: uppercase;">&#9998; Edit Notification E-mail Wording</summary>
                    <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 10px;">
                      <div>
                        <label class="portal-form-label" for="builder-delivery-email-subject" style="font-size: 11px;">E-mail Subject Line</label>
                        <input type="text" id="builder-delivery-email-subject" class="portal-form-input" value="${escapeHtml(builderState.deliveryEmailSubject || "")}">
                      </div>
                      <div>
                        <label class="portal-form-label" for="builder-delivery-email-heading" style="font-size: 11px;">E-mail Heading</label>
                        <input type="text" id="builder-delivery-email-heading" class="portal-form-input" value="${escapeHtml(builderState.deliveryEmailHeading || "")}">
                      </div>
                      <div>
                        <label class="portal-form-label" for="builder-delivery-email-body" style="font-size: 11px;">E-mail Message Body <span style="font-weight: 400; color: var(--text-muted);">(Added right after &ldquo;Hi [Client Name],&rdquo; &amp; above the gallery button)</span></label>
                        <textarea id="builder-delivery-email-body" class="portal-form-textarea" rows="3">${escapeHtml(builderState.deliveryEmailBody || "")}</textarea>
                      </div>
                      <div>
                        <label class="portal-form-label" for="builder-delivery-email-footer" style="font-size: 11px;">E-mail Footer Note</label>
                        <input type="text" id="builder-delivery-email-footer" class="portal-form-input" value="${escapeHtml(builderState.deliveryEmailFooter || "")}">
                      </div>
                      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <button type="button" class="portal-btn-secondary" id="builder-save-email-tpl-default-btn" style="padding: 7px 13px; font-size: 11.5px;">Save Wording as Default for Future Shoots</button>
                        <span id="builder-email-tpl-default-status" style="font-size: 11.5px; color: var(--text-muted);"></span>
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              <div class="portal-form-group">
                <label class="portal-form-label">Welcome Message & Retouching Guidance (Optional)</label>
                <textarea id="builder-shoot-notes" class="portal-form-textarea" rows="2" placeholder="Welcome! Please review your proofs below. You can toggle tones and leave editing notes before making your final selections.">${builderState.notes}</textarea>
              </div>

              <div class="portal-form-group" style="margin-top: 14px;">
                <label class="portal-form-label">Sign-In Highlights &amp; Features (Optional)</label>
                <span class="portal-form-help">Customise the 3 bullet points shown on the client passcode sign-in card. Leave blank to automatically generate from your shoot's looks and variations.</span>
                <div style="display: grid; gap: 8px; margin-top: 6px;">
                  <input type="text" id="builder-splash-feat-1" class="portal-form-input" placeholder="Bullet 1 (defaults to shoot variations, e.g. Variations per portrait...)" value="${escapeHtml((builderState.splashFeatures && builderState.splashFeatures[0]) || "")}">
                  <input type="text" id="builder-splash-feat-2" class="portal-form-input" placeholder="Bullet 2 (defaults to looks &amp; compare tool)" value="${escapeHtml((builderState.splashFeatures && builderState.splashFeatures[1]) || "")}">
                  <input type="text" id="builder-splash-feat-3" class="portal-form-input" placeholder="Bullet 3 (defaults to package selections &amp; editing notes)" value="${escapeHtml((builderState.splashFeatures && builderState.splashFeatures[2]) || "")}">
                </div>
              </div>

              <!-- Gallery Cover Photo Section -->
              <div class="portal-form-group portal-builder-cover-group" style="margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--border);">
                <label class="portal-form-label">Gallery Cover Photo (Dashboard & Invitation Hero)</label>
                <div class="portal-cover-card-container">
                  <div class="portal-cover-card-preview" id="portal-cover-preview-card" style="${(builderState.coverImage || builderState.coverBlobKey) ? "display: flex;" : "display: none;"}">
                    <div class="portal-cover-preview-img-wrap">
                      <img id="portal-cover-preview-img" src="${builderState.coverImage || ""}" class="portal-cover-preview-img" alt="Gallery cover preview" data-blob-key="${builderState.coverBlobKey || ""}">
                      <span class="portal-cover-active-tag">★ Cover</span>
                    </div>
                    <div class="portal-cover-card-meta">
                      <h4 class="portal-cover-card-title">Custom Gallery Cover Selected</h4>
                      <p class="portal-cover-meta-note">This image is used as the primary showcase cover on your client dashboard and for client invitation links.</p>
                      <div class="portal-cover-action-btns">
                        <button type="button" class="portal-cover-action-btn" id="portal-upload-cover-trigger-btn">&#128193; Upload New Cover Photo...</button>
                        <button type="button" class="portal-cover-action-btn is-danger" id="portal-remove-cover-btn">&times; Reset Cover</button>
                      </div>
                    </div>
                  </div>

                  <div class="portal-cover-card-empty" id="portal-cover-empty-dropzone" style="${(builderState.coverImage || builderState.coverBlobKey) ? "display: none;" : "display: flex;"}">
                    <div class="portal-cover-empty-icon">&#128247;</div>
                    <div class="portal-cover-empty-text-wrap">
                      <h4 class="portal-cover-empty-title">Upload Gallery Cover Photo</h4>
                      <p class="portal-cover-empty-desc">Choose any photo from your computer (Colour, Black &amp; White, or Faded) to represent this gallery, or select from the thumbnails below.</p>
                    </div>
                    <button type="button" class="portal-cover-upload-btn" id="portal-upload-cover-btn">&#128193; Upload Cover Image...</button>
                  </div>
                  <input type="file" id="portal-cover-file-input" accept="image/jpeg,image/png,image/webp,image/heic,image/*" style="position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; z-index: -1;">
                </div>
              </div>
            </div>

            <!-- Step 2: Smart Google Drive / Folder Importer -->
            <div class="portal-builder-section">
              <h3 class="portal-builder-section-title">02 &middot; Import from Google Drive / Local Folder</h3>
              <div class="portal-folder-import-card" id="portal-folder-import-dropzone">
                <div class="portal-folder-import-icon-wrap">&#128193;</div>
                <div class="portal-folder-import-info">
                  <h4 class="portal-folder-import-title">Import Shoot Folder (Google Drive / Mac)</h4>
                  <p class="portal-folder-import-desc">
                    Point directly to your shoot folder. The builder will automatically use your subfolder names for <strong>Look Sections</strong> (e.g. <em>Look 1 &middot; Studio</em>, <em>Look 2 &middot; Silk</em>) and link your <strong>Colour, Black &amp; White, and Faded</strong> versions!
                  </p>
                  <div class="portal-folder-import-actions">
                    <button type="button" class="portal-folder-select-btn" id="portal-choose-folder-btn">
                      &#128193; Choose Shoot Folder...
                    </button>
                    <span class="portal-folder-or-text">or drag &amp; drop your shoot folder directly here</span>
                  </div>
                  <input type="file" id="portal-folder-input" webkitdirectory directory multiple style="display: none;">
                </div>
              </div>

              <div id="portal-folder-success-banner" style="display: ${builderState.importSummary ? "flex" : "none"};">
                <span class="portal-folder-success-banner">&#10003; ${builderState.importSummary || ""}</span>
              </div>
            </div>

            <!-- Step 3: Looks & Sections -->
            <div class="portal-builder-section">
              <div class="portal-builder-section-header">
                <div>
                  <h3 class="portal-builder-section-title">03 &middot; Gallery Sections & Looks</h3>
                  <p class="portal-builder-section-desc">Fine-tune your sections below. Each look can have its own title, description, and tone versions (Colour only, Colour + B&W, or 3 Tones).</p>
                </div>
                <button type="button" class="portal-add-look-btn" id="builder-add-look-btn">+ Add Another Look</button>
              </div>

              <div class="portal-builder-looks-list" id="builder-looks-list">
                ${renderLooksListHtml()}
              </div>
            </div>

            <!-- Page Sticky Footer Actions -->
            <div class="portal-builder-page-footer">
              <div class="portal-builder-summary" id="builder-summary-text">
                ${builderState.looks.length} ${builderState.looks.length === 1 ? "Look" : "Looks"} &middot; ${getTotalFilesCount()} photos selected
              </div>
              <div class="portal-builder-footer-actions">
                <button type="button" class="portal-builder-cancel-btn" id="builder-cancel-btn">Cancel &amp; Return</button>
                <button type="submit" class="portal-builder-submit-btn" id="builder-submit-btn">
                  ${builderState.isEditMode ? "Save Changes &amp; Update Gallery &rarr;" : "Publish &amp; Launch Gallery &rarr;"}
                </button>
              </div>
            </div>
          </form>
        </div>
      `;

      bindBuilderEvents();
    }

    function getTotalFilesCount() {
      return builderState.looks.reduce((sum, l) => sum + (l.files ? l.files.length : 0), 0);
    }

    function renderLooksListHtml() {
      return builderState.looks.map((look, idx) => `
        <div class="portal-look-card" data-look-idx="${idx}">
          <div class="portal-look-card-header">
            <div class="portal-look-card-title-wrap">
              <span class="portal-look-badge">LOOK 0${idx + 1}</span>
              <input type="text" class="portal-look-name-input" data-look-idx="${idx}" value="${look.title}" placeholder="Look Title (e.g. Look ${idx + 1} · Studio Tailored)" required>
            </div>
            <div class="portal-look-header-actions">
              <div class="portal-look-order-controls">
                <button type="button" class="portal-move-look-btn portal-move-up-btn" data-look-idx="${idx}" ${idx === 0 ? "disabled" : ""} title="Move look up">&#8593; Up</button>
                <button type="button" class="portal-move-look-btn portal-move-down-btn" data-look-idx="${idx}" ${idx === builderState.looks.length - 1 ? "disabled" : ""} title="Move look down">&#8595; Down</button>
              </div>
              ${builderState.looks.length > 1 ? `
                <button type="button" class="portal-remove-look-btn" data-look-idx="${idx}" title="Remove this look">&times; Remove</button>
              ` : ""}
            </div>
          </div>

          <div class="portal-look-card-body">
            <div class="portal-builder-grid-2">
              <div class="portal-form-group">
                <label class="portal-form-label">Look Description / Tone Note</label>
                <input type="text" class="portal-look-desc-input" data-look-idx="${idx}" value="${look.description}" placeholder="e.g. Studio lighting · Curated in Colour">
              </div>
              <div class="portal-form-group">
                <div class="portal-tone-label-row">
                  <label class="portal-form-label">Detected Tone Versions</label>
                  <span class="portal-form-sublabel">Click to rename for client display:</span>
                </div>
                <div class="portal-detected-versions-wrap">
                  ${(() => {
                    const keys = (look.toneKeys && look.toneKeys.length > 0) ? look.toneKeys : ["colour"];
                    return keys.map(k => {
                      const curLabel = (look.customToneLabels && look.customToneLabels[k])
                        || (builderState.customToneLabels && builderState.customToneLabels[k])
                        || getToneLabel(k, existingShoot);
                      const shortTag = getToneShort(k, existingShoot);
                      return `
                        <div class="portal-version-rename-tag" title="Click to rename version for client proofing">
                          <span class="portal-version-dot"></span>
                          <span class="portal-version-key-badge">${shortTag}</span>
                          <input 
                            type="text" 
                            class="portal-version-rename-input" 
                            data-look-idx="${idx}" 
                            data-tone-key="${k}" 
                            value="${curLabel}" 
                            placeholder="${getToneLabel(k)}" 
                            title="Click to rename this version"
                            aria-label="Rename ${shortTag} version"
                          />
                        </div>
                      `;
                    }).join("");
                  })()}
                </div>
              </div>
            </div>

            <!-- Upload Photos Dropzone -->
            <div class="portal-look-upload-area">
              <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/*" class="portal-look-file-input" id="look-file-input-${idx}" data-look-idx="${idx}" style="position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; z-index: -1;">
              <div class="portal-look-dropzone" data-look-idx="${idx}">
                <div class="portal-dropzone-inner">
                  <span class="portal-dropzone-icon">&#128247;</span>
                  <p class="portal-dropzone-text">Drag &amp; drop photos here, or <button type="button" class="portal-browse-link" data-look-idx="${idx}">browse files</button></p>
                  <span class="portal-dropzone-sub">Supports JPEG, PNG, WebP photos</span>
                </div>
              </div>

              <!-- Thumbnails Grid -->
              <div class="portal-look-thumbs-wrap ${look.files && look.files.length > 0 ? "has-files" : ""}">
                <div class="portal-look-thumbs-header">
                  <span class="portal-look-thumbs-count">
                    ${look.files ? look.files.length : 0} photos uploaded
                    ${(look.files && look.files.length > 20 && !look.isExpanded) ? ` &middot; <span style="color: var(--text-muted); font-weight: normal;">showing first 20</span>` : ""}
                  </span>
                  <div class="portal-look-thumbs-actions">
                    ${(look.files && look.files.length > 20) ? `
                      <button type="button" class="portal-toggle-thumbs-btn" data-look-idx="${idx}">
                        ${look.isExpanded ? "Show First 20" : `Show All (${look.files.length})`}
                      </button>
                    ` : ""}
                    ${look.files && look.files.length > 0 ? `
                      <button type="button" class="portal-clear-look-files-btn" data-look-idx="${idx}">Clear all photos</button>
                    ` : ""}
                  </div>
                </div>
                <div class="portal-look-thumbs-grid">
                  ${(() => {
                    const allFiles = look.files || [];
                    const limit = 20;
                    const isExpanded = Boolean(look.isExpanded);
                    const visible = isExpanded ? allFiles : allFiles.slice(0, limit);
                    const remaining = allFiles.length - limit;

                    let html = visible.map((f, fIdx) => {
                      const versionKeys = f.versionFiles && Object.keys(f.versionFiles).length > 0 
                        ? Object.keys(f.versionFiles) 
                        : (f.existingVersions && Object.keys(f.existingVersions).length > 0 ? Object.keys(f.existingVersions) : ["colour"]);

                      let toneBadgeText = "";
                      if (versionKeys.length > 1) {
                        toneBadgeText = versionKeys.map(k => getToneShort(k)).join(" + ");
                      } else if (versionKeys.length === 1 && versionKeys[0] !== "standard" && versionKeys[0] !== "colour") {
                        toneBadgeText = getToneShort(versionKeys[0]);
                      }

                      const isCoverFile = (builderState.coverFilename && builderState.coverFilename === f.name) ||
                        (builderState.coverBlobKey && f.existingBlobKey && builderState.coverBlobKey === f.existingBlobKey) ||
                        (!builderState.coverFilename && !builderState.coverBlobKey && !builderState.coverCustomFile && idx === 0 && fIdx === 0);

                      let coverBtnHtml = "";
                      if (versionKeys.length > 1) {
                        coverBtnHtml = `
                          <div class="portal-thumb-cover-tone-row">
                            ${versionKeys.map(tKey => {
                              const isThisTone = isCoverFile && (builderState.coverTone ? builderState.coverTone === tKey : tKey === "colour");
                              return `
                                <button 
                                  type="button" 
                                  class="portal-thumb-cover-btn ${isThisTone ? "is-cover" : ""}" 
                                  data-look-idx="${idx}" 
                                  data-file-idx="${fIdx}" 
                                  data-tone="${tKey}" 
                                  title="Set ${getToneLabel(tKey)} version as Cover Photo"
                                >
                                  ${isThisTone ? "★" : "☆"} ${getToneShort(tKey)}
                                </button>
                              `;
                            }).join("")}
                          </div>
                        `;
                      } else {
                        coverBtnHtml = `
                          <button 
                            type="button" 
                            class="portal-thumb-cover-btn ${isCoverFile ? "is-cover" : ""}" 
                            data-look-idx="${idx}" 
                            data-file-idx="${fIdx}" 
                            data-tone="${versionKeys[0] || "colour"}" 
                            title="${isCoverFile ? "Selected as Gallery Cover Photo" : "Set as Gallery Cover Photo"}"
                          >
                            ${isCoverFile ? "★ Cover" : "☆ Cover"}
                          </button>
                        `;
                      }

                      const displayPreview = (f.versionUrls && f.versionUrls["colour"]) || f.previewUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='160' viewBox='0 0 120 160'%3E%3Crect width='120' height='160' fill='%231a1a1a'/%3E%3C/svg%3E";

                      return `
                        <div class="portal-thumb-item ${isCoverFile ? "is-active-cover" : ""}" title="${f.name}">
                          <img 
                            src="${displayPreview}" 
                            alt="${f.name}" 
                            class="portal-thumb-img"
                            data-filename="${f.name}"
                            data-blob-key="${f.existingBlobKey || ""}"
                            loading="lazy"
                          >
                          <button type="button" class="portal-thumb-del" data-look-idx="${idx}" data-file-idx="${fIdx}" aria-label="Remove photo">&times;</button>
                          ${coverBtnHtml}
                          ${toneBadgeText ? `<span class="portal-thumb-tone-badge">${toneBadgeText}</span>` : ""}
                        </div>
                      `;
                    }).join("");

                    if (!isExpanded && remaining > 0) {
                      html += `
                        <div class="portal-thumb-item portal-thumb-more" data-look-idx="${idx}" title="Click to view all ${allFiles.length} photos">
                          <div class="portal-thumb-more-content">
                            <span class="portal-thumb-more-plus">+${remaining}</span>
                            <span class="portal-thumb-more-text">more</span>
                          </div>
                        </div>
                      `;
                    }
                    return html;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      `).join("");
    }

    function bindBuilderEvents() {
      // Back & Cancel Button
      const backBtn = container.querySelector("#builder-back-btn");
      const cancelBtn = container.querySelector("#builder-cancel-btn");
      const goBack = () => {
        if (builderState.isEditMode && builderState.editShootId) {
          const shoot = getShootById(builderState.editShootId);
          setShootUnlockedMode(builderState.editShootId, "client");
          if (typeof window !== "undefined") {
            window.location.hash = `#/client-portal/${builderState.editShootId}`;
          }
          if (shoot) {
            renderShootGallery(container, shoot);
            return;
          }
        }
        if (typeof window !== "undefined") {
          window.location.hash = "#/client-portal";
        }
        renderLandingScreen(container);
      };
      if (backBtn) backBtn.addEventListener("click", goBack);
      if (cancelBtn) cancelBtn.addEventListener("click", goBack);

      // Client name auto-suggests access code
      const nameInput = container.querySelector("#builder-client-name");
      const codeInput = container.querySelector("#builder-access-code");
      const agencyCodeInput = container.querySelector("#builder-agency-code");
      const syncSuggestedAgencyCode = () => {
        if (agencyCodeInput && !agencyCodeInput.dataset.userEdited && builderState.accessCode) {
          builderState.agencyCode = `${builderState.accessCode}-AGENCY`;
          agencyCodeInput.value = builderState.agencyCode;
        }
      };

      if (nameInput) {
        nameInput.addEventListener("input", () => {
          builderState.clientName = nameInput.value;
          if (!codeInput.dataset.userEdited) {
            builderState.accessCode = generateAccessCode(nameInput.value);
            codeInput.value = builderState.accessCode;
            syncSuggestedAgencyCode();
          }
        });
      }

      if (codeInput) {
        codeInput.addEventListener("input", () => {
          codeInput.dataset.userEdited = "true";
          builderState.accessCode = codeInput.value.toUpperCase();
          syncSuggestedAgencyCode();
        });
      }

      if (agencyCodeInput) {
        if (builderState.isEditMode && existingShoot && existingShoot.agencyCode) {
          agencyCodeInput.dataset.userEdited = "true";
        }
        agencyCodeInput.addEventListener("input", () => {
          agencyCodeInput.dataset.userEdited = "true";
          builderState.agencyCode = agencyCodeInput.value.toUpperCase();
        });
      }

      // 🎲 Dice random access code button
      const diceBtn = container.querySelector("#builder-code-gen-btn");
      if (diceBtn && codeInput) {
        diceBtn.addEventListener("click", () => {
          builderState.accessCode = generateAccessCode(nameInput ? nameInput.value : "");
          codeInput.value = builderState.accessCode;
          codeInput.dataset.userEdited = "true";
          syncSuggestedAgencyCode();
        });
      }

      const agencyDiceBtn = container.querySelector("#builder-agency-code-gen-btn");
      if (agencyDiceBtn && agencyCodeInput) {
        agencyDiceBtn.addEventListener("click", () => {
          const base = (builderState.accessCode || generateAccessCode(nameInput ? nameInput.value : "")).replace(/-AGENCY.*$/i, "");
          const suffix = Math.floor(10 + Math.random() * 89);
          builderState.agencyCode = `${base}-AG${suffix}`;
          agencyCodeInput.value = builderState.agencyCode;
          agencyCodeInput.dataset.userEdited = "true";
        });
      }

      // Shoot title, date, location, notes
      const titleInput = container.querySelector("#builder-shoot-title");
      if (titleInput) titleInput.addEventListener("input", () => builderState.shootTitle = titleInput.value);
      const dateInput = container.querySelector("#builder-shoot-date");
      if (dateInput) dateInput.addEventListener("input", () => builderState.shootDate = dateInput.value);
      const locInput = container.querySelector("#builder-shoot-location");
      if (locInput) locInput.addEventListener("input", () => builderState.location = locInput.value);
      const notesInput = container.querySelector("#builder-shoot-notes");
      if (notesInput) notesInput.addEventListener("input", () => builderState.notes = notesInput.value);
      const tfpToggleBtn = container.querySelector("#builder-tfp-toggle-btn");
      const quotaGroup = container.querySelector("#builder-package-quota-group");
      const quotaHelp = container.querySelector("#builder-package-quota-help");
      const quotaInput = container.querySelector("#builder-package-quota");
      if (tfpToggleBtn) {
        tfpToggleBtn.addEventListener("click", () => {
          builderState.isTfp = !builderState.isTfp;
          tfpToggleBtn.classList.toggle("is-active", builderState.isTfp);
          tfpToggleBtn.setAttribute("aria-pressed", builderState.isTfp ? "true" : "false");
          tfpToggleBtn.innerHTML = `<span>&#10022; TFP Shoot Mode: <strong>${builderState.isTfp ? "ON (No Quota \u00b7 Top 10 \u2665 + Unlimited \u2713)" : "OFF (Standard Paid Package)"}</strong></span>`;
          if (quotaGroup) quotaGroup.classList.toggle("is-disabled", builderState.isTfp);
          if (quotaInput) quotaInput.disabled = builderState.isTfp;
          if (quotaHelp) {
            quotaHelp.textContent = builderState.isTfp
              ? "Disabled in TFP Shoot Mode \u2014 no selection quota or \u00a330 extra edits charge applies."
              : "Sets how many edits are included in their package before the extra edits counter (\u00a330/extra) kicks in.";
          }
        });
      }
      if (quotaInput) {
        quotaInput.addEventListener("input", () => {
          const val = parseInt(quotaInput.value, 10);
          builderState.packageQuota = val > 0 ? val : 15;
        });
      }
      const deliveryUrlInput = container.querySelector("#builder-delivery-drive-url");
      const deliveryHeadingInput = container.querySelector("#builder-delivery-heading");
      const loadDriveHeroBtn = container.querySelector("#builder-load-drive-hero-btn");
      const clearDriveHeroBtn = container.querySelector("#builder-clear-drive-hero-btn");
      const driveHeroStatus = container.querySelector("#builder-drive-hero-status");
      const driveHeroGrid = container.querySelector("#builder-drive-hero-grid");

      async function loadDriveHeroPicker() {
        const folderId = extractDriveFolderId(builderState.deliveryDriveUrl || "");
        if (!folderId) {
          if (driveHeroStatus) driveHeroStatus.textContent = "Paste a public Google Drive folder link above first.";
          return;
        }
        if (driveHeroStatus) driveHeroStatus.textContent = "Loading Drive portraits...";
        if (loadDriveHeroBtn) loadDriveHeroBtn.disabled = true;
        try {
          let data = deliveryCatalogCache[folderId];
          if (!data) {
            const res = await fetch(`/api/gdrive-delivery?folderId=${encodeURIComponent(folderId)}`);
            data = await res.json();
            if (!res.ok) throw new Error(data.error || "Unable to read Drive folder.");
            deliveryCatalogCache[folderId] = data;
          }
          const portraits = [];
          (data.looks || []).forEach(look => {
            (look.items || []).forEach(item => {
              const v = item.versions[item.defaultTone] || item.versions[Object.keys(item.versions)[0]];
              if (v && v.fileId) {
                portraits.push({
                  fileId: v.fileId,
                  previewUrl: v.previewUrl,
                  label: `${look.title} · ${item.title}`
                });
              }
            });
          });
          if (!portraits.length) {
            if (driveHeroStatus) driveHeroStatus.textContent = "No portrait photos found in that folder.";
            return;
          }
          if (!builderState.deliveryHeroFileId && portraits[0]) {
            builderState.deliveryHeroFileId = portraits[0].fileId;
          }
          if (driveHeroGrid) {
            driveHeroGrid.style.display = "grid";
            driveHeroGrid.innerHTML = portraits.map(p => `
              <button type="button" class="portal-builder-hero-option ${builderState.deliveryHeroFileId === p.fileId ? "is-selected" : ""}" data-drive-hero-id="${escapeHtml(p.fileId)}" title="${escapeHtml(p.label)}">
                <img src="${escapeHtml(p.previewUrl)}" alt="${escapeHtml(p.label)}" loading="lazy">
                <span>${escapeHtml(p.label)}</span>
              </button>
            `).join("");
            driveHeroGrid.querySelectorAll("[data-drive-hero-id]").forEach(btn => {
              btn.addEventListener("click", () => {
                builderState.deliveryHeroFileId = btn.dataset.driveHeroId || "";
                driveHeroGrid.querySelectorAll("[data-drive-hero-id]").forEach(b => b.classList.toggle("is-selected", b === btn));
                if (clearDriveHeroBtn) clearDriveHeroBtn.style.display = builderState.deliveryHeroFileId ? "" : "none";
                if (driveHeroStatus) driveHeroStatus.textContent = `Selected: ${btn.title} ✓`;
              });
            });
          }
          if (driveHeroStatus) driveHeroStatus.textContent = `Showing ${portraits.length} portraits — tap one to set as the top Hero image.`;
          if (clearDriveHeroBtn) clearDriveHeroBtn.style.display = builderState.deliveryHeroFileId ? "" : "none";
        } catch (err) {
          if (driveHeroStatus) driveHeroStatus.textContent = err.message || "Failed to load Drive folder.";
        } finally {
          if (loadDriveHeroBtn) loadDriveHeroBtn.disabled = false;
        }
      }

      if (deliveryUrlInput) {
        deliveryUrlInput.addEventListener("input", () => {
          builderState.deliveryDriveUrl = deliveryUrlInput.value.trim();
        });
        deliveryUrlInput.addEventListener("change", () => {
          if (extractDriveFolderId(builderState.deliveryDriveUrl)) loadDriveHeroPicker();
        });
      }
      if (deliveryHeadingInput) {
        deliveryHeadingInput.addEventListener("input", () => {
          builderState.deliveryHeading = deliveryHeadingInput.value;
        });
      }
      if (loadDriveHeroBtn) {
        loadDriveHeroBtn.addEventListener("click", loadDriveHeroPicker);
      }
      if (clearDriveHeroBtn) {
        clearDriveHeroBtn.addEventListener("click", () => {
          builderState.deliveryHeroFileId = "";
          if (driveHeroGrid) driveHeroGrid.querySelectorAll("[data-drive-hero-id]").forEach(b => b.classList.remove("is-selected"));
          clearDriveHeroBtn.style.display = "none";
          if (driveHeroStatus) driveHeroStatus.textContent = "Using default (first portrait in Look 1)";
        });
      }
      if (extractDriveFolderId(builderState.deliveryDriveUrl)) {
        loadDriveHeroPicker();
      }
      const deliveryReadyInput = container.querySelector("#builder-delivery-ready");
      if (deliveryReadyInput) {
        deliveryReadyInput.addEventListener("change", () => {
          builderState.deliveryReady = !!deliveryReadyInput.checked;
        });
      }

      const builderNotifyEmailInput = container.querySelector("#builder-client-notify-email");
      const builderSendReadyChk = container.querySelector("#builder-send-delivery-email-chk");
      const builderSendReadyBtn = container.querySelector("#builder-send-ready-email-btn");
      const builderNotifyStatus = container.querySelector("#builder-notify-email-status");
      const emailSubjectInput = container.querySelector("#builder-delivery-email-subject");
      const emailHeadingInput = container.querySelector("#builder-delivery-email-heading");
      const emailBodyInput = container.querySelector("#builder-delivery-email-body");
      const emailFooterInput = container.querySelector("#builder-delivery-email-footer");
      const saveEmailDefaultBtn = container.querySelector("#builder-save-email-tpl-default-btn");
      const saveEmailDefaultStatus = container.querySelector("#builder-email-tpl-default-status");

      if (emailSubjectInput) emailSubjectInput.addEventListener("input", () => { builderState.deliveryEmailSubject = emailSubjectInput.value; });
      if (emailHeadingInput) emailHeadingInput.addEventListener("input", () => { builderState.deliveryEmailHeading = emailHeadingInput.value; });
      if (emailBodyInput) emailBodyInput.addEventListener("input", () => { builderState.deliveryEmailBody = emailBodyInput.value; });
      if (emailFooterInput) emailFooterInput.addEventListener("input", () => { builderState.deliveryEmailFooter = emailFooterInput.value; });
      if (saveEmailDefaultBtn) {
        saveEmailDefaultBtn.addEventListener("click", () => {
          try {
            localStorage.setItem("kh_default_delivery_email_tpl", JSON.stringify({
              subject: (builderState.deliveryEmailSubject || "").trim(),
              heading: (builderState.deliveryEmailHeading || "").trim(),
              body: (builderState.deliveryEmailBody || "").trim(),
              footer: (builderState.deliveryEmailFooter || "").trim()
            }));
            if (saveEmailDefaultStatus) saveEmailDefaultStatus.textContent = "Saved as default wording ✓";
          } catch (e) {}
        });
      }

      if (builderNotifyEmailInput) {
        builderNotifyEmailInput.addEventListener("input", () => {
          builderState.clientNotifyEmail = builderNotifyEmailInput.value.trim();
        });
      }
      if (builderSendReadyChk) {
        builderSendReadyChk.addEventListener("change", () => {
          builderState.sendDeliveryEmailOnSave = !!builderSendReadyChk.checked;
        });
      }
      if (builderSendReadyBtn) {
        builderSendReadyBtn.addEventListener("click", async () => {
          const emailTarget = (builderNotifyEmailInput ? builderNotifyEmailInput.value : builderState.clientNotifyEmail).trim();
          if (!isValidEmailAddress(emailTarget)) {
            if (builderNotifyStatus) builderNotifyStatus.textContent = "Please enter a valid client e-mail address first.";
            return;
          }
          const folderIdCheck = extractDriveFolderId(builderState.deliveryDriveUrl || "");
          if (!folderIdCheck) {
            if (builderNotifyStatus) builderNotifyStatus.textContent = "Please paste the Google Drive delivery folder link above first.";
            return;
          }
          const draftId = (builderState.editShootId || (builderState.clientName || "shoot").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"));
          const draftCode = (builderState.accessCode || "ACCESS").trim().toUpperCase();
          builderSendReadyBtn.disabled = true;
          builderSendReadyBtn.textContent = "Sending...";
          const res = await sendClientDeliveryReadyEmail({
            id: draftId,
            clientName: (builderState.clientName || "").trim() || "Client",
            shootTitle: (builderState.shootTitle || "").trim(),
            deliveryHeading: (builderState.deliveryHeading || "").trim(),
            deliveryEmailSubject: (builderState.deliveryEmailSubject || "").trim(),
            deliveryEmailHeading: (builderState.deliveryEmailHeading || "").trim(),
            deliveryEmailBody: (builderState.deliveryEmailBody || "").trim(),
            deliveryEmailFooter: (builderState.deliveryEmailFooter || "").trim(),
            code: draftCode
          }, emailTarget);
          builderSendReadyBtn.disabled = false;
          builderSendReadyBtn.textContent = res.ok ? "Sent ✓" : "Send Ready Email Now";
          if (builderNotifyStatus) {
            builderNotifyStatus.textContent = res.ok
              ? (res.sandboxFallback
                  ? `Email queued (Resend domain check needed to deliver externally — copy forwarded to contact@korayhussein.com for ${emailTarget}).`
                  : `Ready notification e-mail sent to ${emailTarget} ✓`)
              : `Email error: ${res.error || "Could not send"}`;
          }
        });
      }
      if (isEditMode && editShootId) {
        loadShootFromCloud(editShootId).then(() => {
          const syncedEmail = loadClientNotifyEmail(editShootId);
          if (syncedEmail && !builderState.clientNotifyEmail && builderNotifyEmailInput) {
            builderState.clientNotifyEmail = syncedEmail;
            builderNotifyEmailInput.value = syncedEmail;
            if (builderNotifyStatus) builderNotifyStatus.textContent = `Client notification e-mail synced from gallery: ${syncedEmail} ✓`;
          }
        }).catch(() => {});
      }

      // Dedicated Gallery Cover Photo Upload
      const coverFileInput = container.querySelector("#portal-cover-file-input");
      const uploadCoverBtn = container.querySelector("#portal-upload-cover-btn");
      const changeCoverBtn = container.querySelector("#portal-upload-cover-trigger-btn");
      const removeCoverBtn = container.querySelector("#portal-remove-cover-btn");
      const coverEmptyZone = container.querySelector("#portal-cover-empty-dropzone");
      const coverPreviewCard = container.querySelector("#portal-cover-preview-card");
      const coverPreviewImg = container.querySelector("#portal-cover-preview-img");

      async function handleCoverFileSelect(file) {
        if (!file || (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|avif|heic|heif|tiff?)$/i.test(file.name))) return;
        const previewUrl = URL.createObjectURL(file);
        if (coverPreviewImg) coverPreviewImg.src = previewUrl;
        if (coverPreviewCard) coverPreviewCard.style.display = "flex";
        if (coverEmptyZone) coverEmptyZone.style.display = "none";

        builderState.coverCustomFile = file;
        builderState.coverFilename = file.name;
        builderState.coverBlobKey = "";
        builderState.coverTone = "custom";

        // Convert to compressed cross-device Base64 data URL for instant cloud sync
        const dataUrl = await fileToCompressedDataUrl(file);
        builderState.coverImage = dataUrl || previewUrl;
      }

      if (uploadCoverBtn && coverFileInput) {
        uploadCoverBtn.addEventListener("click", () => {
          coverFileInput.value = "";
          coverFileInput.click();
        });
      }
      if (changeCoverBtn && coverFileInput) {
        changeCoverBtn.addEventListener("click", () => {
          coverFileInput.value = "";
          coverFileInput.click();
        });
      }
      if (coverFileInput) {
        coverFileInput.addEventListener("change", (e) => {
          if (e.target.files && e.target.files[0]) {
            handleCoverFileSelect(e.target.files[0]);
          }
        });
      }
      if (removeCoverBtn) {
        removeCoverBtn.addEventListener("click", () => {
          builderState.coverImage = "";
          builderState.coverCustomFile = null;
          builderState.coverFilename = "";
          builderState.coverBlobKey = "";
          builderState.coverTone = "colour";
          if (coverPreviewCard) coverPreviewCard.style.display = "none";
          if (coverEmptyZone) coverEmptyZone.style.display = "flex";
          if (coverFileInput) coverFileInput.value = "";
        });
      }
      if (coverEmptyZone) {
        coverEmptyZone.addEventListener("dragover", (e) => {
          e.preventDefault();
          coverEmptyZone.classList.add("is-dragover");
        });
        coverEmptyZone.addEventListener("dragleave", () => {
          coverEmptyZone.classList.remove("is-dragover");
        });
        coverEmptyZone.addEventListener("drop", (e) => {
          e.preventDefault();
          coverEmptyZone.classList.remove("is-dragover");
          if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleCoverFileSelect(e.dataTransfer.files[0]);
          }
        });
      }

      // Google Drive / Folder Importer
      const chooseFolderBtn = container.querySelector("#portal-choose-folder-btn");
      const folderInput = container.querySelector("#portal-folder-input");
      const folderDropzone = container.querySelector("#portal-folder-import-dropzone");

      if (chooseFolderBtn && folderInput) {
        chooseFolderBtn.addEventListener("click", () => folderInput.click());
        folderInput.addEventListener("change", (e) => {
          if (e.target.files && e.target.files.length > 0) {
            processImportedFiles(e.target.files);
          }
        });
      }

      if (folderDropzone) {
        folderDropzone.addEventListener("click", (e) => {
          if (e.target !== chooseFolderBtn && folderInput) {
            folderInput.click();
          }
        });
        folderDropzone.addEventListener("dragover", (e) => {
          e.preventDefault();
          folderDropzone.classList.add("is-dragover");
        });
        folderDropzone.addEventListener("dragleave", () => {
          folderDropzone.classList.remove("is-dragover");
        });
        folderDropzone.addEventListener("drop", async (e) => {
          e.preventDefault();
          folderDropzone.classList.remove("is-dragover");
          if (e.dataTransfer && e.dataTransfer.items) {
            const files = await getFilesFromDataTransfer(e.dataTransfer.items);
            if (files && files.length > 0) {
              processImportedFiles(files);
            }
          } else if (e.dataTransfer && e.dataTransfer.files) {
            processImportedFiles(e.dataTransfer.files);
          }
        });
      }

      // Add Look button
      const addLookBtn = container.querySelector("#builder-add-look-btn");
      if (addLookBtn) {
        addLookBtn.addEventListener("click", () => {
          const num = builderState.looks.length + 1;
          builderState.looks.push({
            id: `look-${num}`,
            title: `Look ${num} · Editorial`,
            description: "",
            toneMode: "colour",
            files: []
          });
          const listEl = container.querySelector("#builder-looks-list");
          if (listEl) {
            listEl.innerHTML = renderLooksListHtml();
            bindLookCardsEvents();
          }
          updateSummaryText();
        });
      }

      bindLookCardsEvents();

      // Submit Form
      const form = container.querySelector("#portal-builder-form");
      const submitBtn = container.querySelector("#builder-submit-btn");
      if (form) {
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          handlePublishGallery(submitBtn);
        });
      }
    }

    async function processImportedFiles(filesList) {
      if (!filesList || filesList.length === 0) return;
      const parsed = parseFolderFilesIntoLooks(filesList);
      if (!parsed || !parsed.looks || parsed.looks.length === 0) {
        alert("No photos were found in the selected folder. Please ensure the folder contains image files (JPG, PNG, WebP).");
        return;
      }

      // Auto-populate shoot title & client name if empty
      if (parsed.shootTitle && !builderState.shootTitle) {
        builderState.shootTitle = parsed.shootTitle;
        const titleInput = container.querySelector("#builder-shoot-title");
        if (titleInput) titleInput.value = parsed.shootTitle;
      }
      if (parsed.clientName && !builderState.clientName) {
        builderState.clientName = parsed.clientName;
        const nameInput = container.querySelector("#builder-client-name");
        if (nameInput) nameInput.value = parsed.clientName;
        if (!builderState.accessCode) {
          builderState.accessCode = generateAccessCode(parsed.clientName);
          const codeInput = container.querySelector("#builder-access-code");
          if (codeInput) codeInput.value = builderState.accessCode;
        }
        if (!builderState.agencyCode && builderState.accessCode) {
          builderState.agencyCode = `${builderState.accessCode}-AGENCY`;
          const agencyCodeInput = container.querySelector("#builder-agency-code");
          if (agencyCodeInput && !agencyCodeInput.dataset.userEdited) {
            agencyCodeInput.value = builderState.agencyCode;
          }
        }
      }

      // Preserve existing custom tone renames if photographer already entered them
      if (builderState.customToneLabels && Object.keys(builderState.customToneLabels).length > 0) {
        parsed.looks.forEach(l => {
          if (!l.customToneLabels) l.customToneLabels = {};
          Object.keys(builderState.customToneLabels).forEach(k => {
            l.customToneLabels[k] = builderState.customToneLabels[k];
          });
          l.toneLabels = l.toneKeys.map(k => l.customToneLabels[k] || builderState.customToneLabels[k] || getToneLabel(k));
        });
      }

      builderState.looks = parsed.looks;
      const totalPhotos = parsed.looks.reduce((sum, l) => sum + (l.files ? l.files.length : 0), 0);
      builderState.importSummary = `Imported ${parsed.looks.length} ${parsed.looks.length === 1 ? "Section" : "Sections/Looks"} with ${totalPhotos} photos and tone versions from your folder!`;

      const listEl = container.querySelector("#builder-looks-list");
      if (listEl) {
        listEl.innerHTML = renderLooksListHtml();
        bindLookCardsEvents();
      }
      updateSummaryText();

      const bannerWrap = container.querySelector("#portal-folder-success-banner");
      if (bannerWrap) {
        bannerWrap.style.display = "flex";
        bannerWrap.innerHTML = `<span class="portal-folder-success-banner">&#10003; ${builderState.importSummary}</span>`;
      }
    }

    function bindLookCardsEvents() {
      // Look Title & Description inputs
      container.querySelectorAll(".portal-look-name-input").forEach(input => {
        input.addEventListener("input", () => {
          const idx = parseInt(input.dataset.lookIdx, 10);
          if (builderState.looks[idx]) builderState.looks[idx].title = input.value;
        });
      });
      container.querySelectorAll(".portal-look-desc-input").forEach(input => {
        input.addEventListener("input", () => {
          const idx = parseInt(input.dataset.lookIdx, 10);
          if (builderState.looks[idx]) builderState.looks[idx].description = input.value;
        });
      });

      // Tone version rename inputs
      container.querySelectorAll(".portal-version-rename-input").forEach(input => {
        input.addEventListener("input", () => {
          const lIdx = parseInt(input.dataset.lookIdx, 10);
          const toneKey = input.dataset.toneKey;
          const val = input.value.trim();
          const newLab = val || getToneLabel(toneKey);
          if (!builderState.customToneLabels) builderState.customToneLabels = {};
          builderState.customToneLabels[toneKey] = newLab;
          if (builderState.looks[lIdx]) {
            if (!builderState.looks[lIdx].customToneLabels) builderState.looks[lIdx].customToneLabels = {};
            builderState.looks[lIdx].customToneLabels[toneKey] = newLab;
            builderState.looks[lIdx].toneLabels = (builderState.looks[lIdx].toneKeys || []).map(k => builderState.looks[lIdx].customToneLabels[k] || builderState.customToneLabels[k] || getToneLabel(k));
          }
        });
      });

      // Tone radio inputs
      container.querySelectorAll(".portal-tone-selector-pills input[type='radio']").forEach(radio => {
        radio.addEventListener("change", () => {
          const idx = parseInt(radio.dataset.lookIdx, 10);
          if (builderState.looks[idx]) builderState.looks[idx].toneMode = radio.value;
        });
      });

      // Re-order looks: Move Up & Move Down
      container.querySelectorAll(".portal-move-up-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.lookIdx, 10);
          if (idx > 0) {
            const temp = builderState.looks[idx];
            builderState.looks[idx] = builderState.looks[idx - 1];
            builderState.looks[idx - 1] = temp;
            const listEl = container.querySelector("#builder-looks-list");
            if (listEl) {
              listEl.innerHTML = renderLooksListHtml();
              bindLookCardsEvents();
            }
          }
        });
      });

      container.querySelectorAll(".portal-move-down-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.lookIdx, 10);
          if (idx < builderState.looks.length - 1) {
            const temp = builderState.looks[idx];
            builderState.looks[idx] = builderState.looks[idx + 1];
            builderState.looks[idx + 1] = temp;
            const listEl = container.querySelector("#builder-looks-list");
            if (listEl) {
              listEl.innerHTML = renderLooksListHtml();
              bindLookCardsEvents();
            }
          }
        });
      });

      // Select Cover Photo from thumbnail (Supports specific Colour, BNW, or Faded tone!)
      container.querySelectorAll(".portal-thumb-cover-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const lIdx = parseInt(btn.dataset.lookIdx, 10);
          const fIdx = parseInt(btn.dataset.fileIdx, 10);
          const tone = btn.dataset.tone || "colour";
          const targetFile = builderState.looks[lIdx] && builderState.looks[lIdx].files && builderState.looks[lIdx].files[fIdx];
          if (targetFile) {
            builderState.coverFilename = targetFile.name;
            builderState.coverTone = tone;
            builderState.coverCustomFile = null;

            // Resolve tone-specific URL & BlobKey
            const toneUrl = (targetFile.versionUrls && targetFile.versionUrls[tone]) || targetFile.previewUrl;
            let toneBlobKey = targetFile.existingBlobKey || "";
            if (targetFile.existingVersions && targetFile.existingVersions[tone]) {
              const v = targetFile.existingVersions[tone];
              if (typeof v === "string" && v.startsWith("blobKey:")) {
                toneBlobKey = v.replace("blobKey:", "");
              }
            } else if (targetFile.versionFiles && targetFile.versionFiles[tone]) {
              builderState.coverVersionFile = targetFile.versionFiles[tone];
            }
            builderState.coverBlobKey = toneBlobKey;
            builderState.coverImage = toneUrl || "";

            // Update top cover preview card
            const coverPreviewCard = container.querySelector("#portal-cover-preview-card");
            const coverEmptyZone = container.querySelector("#portal-cover-empty-dropzone");
            const coverPreviewImg = container.querySelector("#portal-cover-preview-img");
            if (coverPreviewImg && toneUrl) coverPreviewImg.src = toneUrl;
            if (coverPreviewCard) coverPreviewCard.style.display = "flex";
            if (coverEmptyZone) coverEmptyZone.style.display = "none";

            const listEl = container.querySelector("#builder-looks-list");
            if (listEl) {
              listEl.innerHTML = renderLooksListHtml();
              bindLookCardsEvents();
            }
          }
        });
      });

      // Remove look buttons
      container.querySelectorAll(".portal-remove-look-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.lookIdx, 10);
          if (builderState.looks.length > 1) {
            builderState.looks.splice(idx, 1);
            const listEl = container.querySelector("#builder-looks-list");
            if (listEl) {
              listEl.innerHTML = renderLooksListHtml();
              bindLookCardsEvents();
            }
            updateSummaryText();
          }
        });
      });

      // Browse file links
      container.querySelectorAll(".portal-browse-link").forEach(link => {
        link.addEventListener("click", () => {
          const idx = link.dataset.lookIdx;
          const fileInput = container.querySelector(`#look-file-input-${idx}`);
          if (fileInput) {
            fileInput.value = "";
            fileInput.click();
          }
        });
      });

      // File input changes
      container.querySelectorAll(".portal-look-file-input").forEach(input => {
        input.addEventListener("change", (e) => {
          const idx = parseInt(input.dataset.lookIdx, 10);
          if (e.target.files && e.target.files.length > 0) {
            addFilesToLook(idx, e.target.files);
          }
        });
      });

      // Drag and drop dropzone
      container.querySelectorAll(".portal-look-dropzone").forEach(dropzone => {
        const idx = parseInt(dropzone.dataset.lookIdx, 10);
        dropzone.addEventListener("dragover", (e) => {
          e.preventDefault();
          dropzone.classList.add("is-dragover");
        });
        dropzone.addEventListener("dragleave", () => {
          dropzone.classList.remove("is-dragover");
        });
        dropzone.addEventListener("drop", (e) => {
          e.preventDefault();
          dropzone.classList.remove("is-dragover");
          if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFilesToLook(idx, e.dataTransfer.files);
          }
        });
      });

      // Delete individual photo thumbnail
      container.querySelectorAll(".portal-thumb-del").forEach(btn => {
        btn.addEventListener("click", () => {
          const lookIdx = parseInt(btn.dataset.lookIdx, 10);
          const fileIdx = parseInt(btn.dataset.fileIdx, 10);
          if (builderState.looks[lookIdx] && builderState.looks[lookIdx].files) {
            builderState.looks[lookIdx].files.splice(fileIdx, 1);
            const listEl = container.querySelector("#builder-looks-list");
            if (listEl) {
              listEl.innerHTML = renderLooksListHtml();
              bindLookCardsEvents();
            }
            updateSummaryText();
          }
        });
      });

      // Clear all photos in a look
      container.querySelectorAll(".portal-clear-look-files-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.lookIdx, 10);
          if (builderState.looks[idx]) {
            builderState.looks[idx].files = [];
            const listEl = container.querySelector("#builder-looks-list");
            if (listEl) {
              listEl.innerHTML = renderLooksListHtml();
              bindLookCardsEvents();
            }
            updateSummaryText();
          }
        });
      });

      // Toggle expand / collapse for 20+ photos
      container.querySelectorAll(".portal-thumb-more, .portal-toggle-thumbs-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.lookIdx, 10);
          if (builderState.looks[idx]) {
            builderState.looks[idx].isExpanded = !builderState.looks[idx].isExpanded;
            const listEl = container.querySelector("#builder-looks-list");
            if (listEl) {
              listEl.innerHTML = renderLooksListHtml();
              bindLookCardsEvents();
            }
          }
        });
      });
    }

    function addFilesToLook(lookIdx, filesList) {
      const look = builderState.looks[lookIdx];
      if (!look) return;
      const valid = Array.from(filesList).filter(f => f.type.startsWith("image/") || /\.(jpe?g|png|webp|avif|heic|heif|tiff?)$/i.test(f.name));
      valid.forEach(f => {
        const previewUrl = URL.createObjectURL(f);
        look.files.push({
          file: f,
          name: f.name,
          previewUrl: previewUrl,
          aspect: "2/3",
          versionFiles: { colour: f },
          versionUrls: { colour: previewUrl }
        });
      });
      look.files.sort(naturalSortFilenames);
      const listEl = container.querySelector("#builder-looks-list");
      if (listEl) {
        listEl.innerHTML = renderLooksListHtml();
        bindLookCardsEvents();
      }
      updateSummaryText();
    }

    function updateSummaryText() {
      const summaryEl = container.querySelector("#builder-summary-text");
      if (summaryEl) {
        summaryEl.textContent = `${builderState.looks.length} ${builderState.looks.length === 1 ? "Look" : "Looks"} · ${getTotalFilesCount()} photos selected`;
      }
    }

    async function handlePublishGallery(submitBtn) {
      const name = (builderState.clientName || "").trim();
      const title = (builderState.shootTitle || "").trim();
      const code = (builderState.accessCode || "").trim().toUpperCase();

      if (!name) {
        alert("Please enter a Client Name.");
        return;
      }
      if (!title) {
        alert("Please enter a Shoot Title.");
        return;
      }
      if (!code) {
        alert("Please enter an Access Code for the client.");
        return;
      }

      const totalFiles = getTotalFilesCount();
      const hasDriveDelivery = Boolean(extractDriveFolderId(builderState.deliveryDriveUrl));
      if (totalFiles === 0 && !hasDriveDelivery) {
        alert("Please upload/import at least 1 photo OR paste a Google Drive Final Delivery folder link.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = builderState.isEditMode ? "Saving Changes & Photos..." : "Publishing Gallery & Saving Photos...";

      const allExistingCustomShoots = loadCustomShoots();
      const existingShootByCode = allExistingCustomShoots.find(s => s.code && s.code.toUpperCase() === code);
      const slugBase = (name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "gallery");
      const shootId = (builderState.isEditMode && builderState.editShootId) 
        ? builderState.editShootId 
        : (existingShootByCode ? existingShootByCode.id : `${slugBase}-${Date.now().toString(36)}`);
      let firstCover = "";
      let firstCoverBlobKey = "";

      // Build upload queue for Cloudflare R2
      const r2UploadQueue = [];

      if (builderState.coverCustomFile) {
        r2UploadQueue.push({
          file: builderState.coverCustomFile,
          filename: builderState.coverCustomFile.name || "custom_cover.jpg",
          tone: "cover",
          contentType: builderState.coverCustomFile.type || "image/jpeg",
          isCustomCover: true
        });
      }

      for (let lIdx = 0; lIdx < builderState.looks.length; lIdx++) {
        const look = builderState.looks[lIdx];
        if (look.files && Array.isArray(look.files)) {
          look.files.forEach((item, fIdx) => {
            if (item.versionFiles && Object.keys(item.versionFiles).length > 0) {
              Object.keys(item.versionFiles).forEach(toneKey => {
                const vFile = item.versionFiles[toneKey];
                if (vFile && (vFile instanceof File || vFile instanceof Blob)) {
                  r2UploadQueue.push({
                    file: vFile,
                    filename: item.name || `photo-${fIdx + 1}.jpg`,
                    tone: toneKey,
                    contentType: vFile.type || "image/jpeg",
                    itemRef: item,
                    toneKey: toneKey
                  });
                }
              });
            } else if (item.file && (item.file instanceof File || item.file instanceof Blob)) {
              r2UploadQueue.push({
                file: item.file,
                filename: item.name || `photo-${fIdx + 1}.jpg`,
                tone: "colour",
                contentType: item.file.type || "image/jpeg",
                itemRef: item,
                toneKey: "colour"
              });
            }
          });
        }
      }

      // Upload directly to Cloudflare R2 via Presigned URLs
      if (r2UploadQueue.length > 0) {
        try {
          submitBtn.textContent = `Connecting to Cloudflare R2 storage...`;
          const presignRes = await fetch("/api/r2-presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              shootId: shootId,
              files: r2UploadQueue.map(q => ({
                filename: q.filename,
                tone: q.tone,
                contentType: q.contentType
              }))
            })
          });

          if (presignRes.ok) {
            const presignData = await presignRes.json();
            const presignedItems = presignData.items || [];

            for (let i = 0; i < r2UploadQueue.length; i++) {
              const q = r2UploadQueue[i];
              const pInfo = presignedItems[i];
              const pct = Math.round(((i + 1) / r2UploadQueue.length) * 100);
              submitBtn.textContent = `Uploading photo ${i + 1} of ${r2UploadQueue.length} (${pct}%) to Cloudflare R2...`;

              if (pInfo && pInfo.uploadUrl) {
                try {
                  const uploadRes = await fetch(pInfo.uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Type": q.contentType },
                    body: q.file
                  });
                  if (uploadRes.ok) {
                    if (q.isCustomCover) {
                      builderState.coverImage = pInfo.publicUrl;
                    } else if (q.itemRef) {
                      if (!q.itemRef.r2Versions) q.itemRef.r2Versions = {};
                      q.itemRef.r2Versions[q.toneKey] = pInfo.publicUrl;
                    }
                  }
                } catch (upErr) {
                  console.warn("Direct R2 upload error for item:", q.filename, upErr);
                }
              }
            }
          }
        } catch (r2Err) {
          console.warn("Cloudflare R2 presign/upload error:", r2Err);
        }
      }

      if (builderState.coverCustomFile) {
        const customCoverKey = `blob_${shootId}_custom_cover`;
        await saveImageBlob(customCoverKey, builderState.coverCustomFile);
        builderState.coverBlobKey = customCoverKey;
        if (!builderState.coverImage || builderState.coverImage.startsWith("blob:")) {
          const dataUrl = await fileToCompressedDataUrl(builderState.coverCustomFile);
          if (dataUrl) builderState.coverImage = dataUrl;
        }
        if (builderState.coverImage) {
          blobUrlCache[customCoverKey] = builderState.coverImage;
        }
      }

      const constructedSections = [];

      for (let lIdx = 0; lIdx < builderState.looks.length; lIdx++) {
        const look = builderState.looks[lIdx];
        if (look.files && Array.isArray(look.files)) {
          look.files.sort(naturalSortFilenames);
        }
        const lookId = look.id || `look-${lIdx + 1}`;
        const secImages = [];

        let tonesNote = look.toneLabels && look.toneLabels.length > 0
          ? (look.toneLabels.length > 1 ? `${look.toneLabels.length} Versions: ${look.toneLabels.join(" & ")}` : look.toneLabels[0])
          : (look.toneMode === "colour-bw" ? "2 Versions: Colour & B&W" : (look.toneMode === "all" ? "3 Versions: Colour, B&W, Faded" : "Single Version"));

        for (let fIdx = 0; fIdx < look.files.length; fIdx++) {
          const item = look.files[fIdx];
          const baseVersions = {};

          if (item.versionFiles && Object.keys(item.versionFiles).length > 0) {
            for (const toneKey of Object.keys(item.versionFiles)) {
              const vFile = item.versionFiles[toneKey];
              const blobKey = `blob_${shootId}_${lookId}_${fIdx}_${toneKey}_${item.name}`;
              await saveImageBlob(blobKey, vFile);
              const vUrl = item.versionUrls && item.versionUrls[toneKey] ? item.versionUrls[toneKey] : URL.createObjectURL(vFile);
              blobUrlCache[blobKey] = vUrl;
              const r2Url = item.r2Versions && item.r2Versions[toneKey];
              baseVersions[toneKey] = r2Url || ("blobKey:" + blobKey);
            }
          } else if (item.existingVersions) {
            Object.assign(baseVersions, item.existingVersions);
          } else if (item.file) {
            const blobKey = `blob_${shootId}_${lookId}_${fIdx}_${item.name}`;
            await saveImageBlob(blobKey, item.file);
            blobUrlCache[blobKey] = item.previewUrl;
            const r2Url = item.r2Versions && (item.r2Versions["colour"] || item.r2Versions["standard"]);
            baseVersions["standard"] = r2Url || ("blobKey:" + blobKey);
            baseVersions["colour"] = r2Url || ("blobKey:" + blobKey);
          }

          const firstToneKey = Object.keys(baseVersions)[0];
          const firstBlobKey = firstToneKey ? String(baseVersions[firstToneKey]).replace("blobKey:", "") : "";
          const primaryUrl = (firstToneKey && baseVersions[firstToneKey] && !String(baseVersions[firstToneKey]).startsWith("blobKey:"))
            ? baseVersions[firstToneKey]
            : ((firstBlobKey && blobUrlCache[firstBlobKey]) || item.previewUrl);

          if (!firstCover && primaryUrl && !primaryUrl.startsWith("blobKey:")) firstCover = primaryUrl;
          if (!firstCoverBlobKey && firstBlobKey) firstCoverBlobKey = firstBlobKey;

          secImages.push({
            filename: item.name || `Photo-${fIdx + 1}.jpg`,
            aspect: item.aspect || "2/3",
            blobKey: firstBlobKey || item.existingBlobKey || `blob_${shootId}_${lookId}_${fIdx}_${item.name}`,
            versions: baseVersions
          });
        }

        secImages.sort(naturalSortFilenames);

        constructedSections.push({
          id: lookId,
          title: look.title || `Look ${lIdx + 1}`,
          description: look.description || tonesNote,
          tonesNote: tonesNote,
          customToneLabels: look.customToneLabels || builderState.customToneLabels || {},
          toneMode: look.toneMode,
          images: secImages
        });
      }

      const allFlatImages = [];
      constructedSections.forEach(sec => (sec.images || []).forEach(img => allFlatImages.push(img)));
      allFlatImages.sort(naturalSortFilenames);

      const feat1 = (container.querySelector("#builder-splash-feat-1") ? container.querySelector("#builder-splash-feat-1").value : "").trim();
      const feat2 = (container.querySelector("#builder-splash-feat-2") ? container.querySelector("#builder-splash-feat-2").value : "").trim();
      const feat3 = (container.querySelector("#builder-splash-feat-3") ? container.querySelector("#builder-splash-feat-3").value : "").trim();
      builderState.splashFeatures = [feat1, feat2, feat3].filter(Boolean);

      const updatedShoot = {
        ...(existingShoot || {}),
        id: shootId,
        code: code,
        agencyCode: (builderState.agencyCode || `${code}-AGENCY`).trim().toUpperCase(),
        clientName: name,
        shootTitle: title,
        shootDate: builderState.shootDate || "November 2026",
        location: builderState.location || "London, England",
        packageQuota: parseInt(builderState.packageQuota, 10) || 15,
        isTfp: !!builderState.isTfp,
        tfpFavouriteLimit: parseInt(builderState.tfpFavouriteLimit, 10) || DEFAULT_TFP_FAV_LIMIT,
        splashFeatures: builderState.splashFeatures || [],
        deliveryDriveUrl: (builderState.deliveryDriveUrl || "").trim(),
        deliveryFolderId: extractDriveFolderId(builderState.deliveryDriveUrl || ""),
        deliveryReady: !!builderState.deliveryReady,
        deliveryHeading: (builderState.deliveryHeading || "").trim(),
        deliveryHeroFileId: (builderState.deliveryHeroFileId || "").trim(),
        clientNotifyEmail: (builderState.clientNotifyEmail || "").trim(),
        deliveryEmailSubject: (builderState.deliveryEmailSubject || "").trim(),
        deliveryEmailHeading: (builderState.deliveryEmailHeading || "").trim(),
        deliveryEmailBody: (builderState.deliveryEmailBody || "").trim(),
        deliveryEmailFooter: (builderState.deliveryEmailFooter || "").trim(),
        coverBlobKey: builderState.coverBlobKey || firstCoverBlobKey || (existingShoot && existingShoot.coverBlobKey) || "",
        coverImage: (builderState.coverImage && !builderState.coverImage.startsWith("blob:") && builderState.coverImage !== "photos/sets/bree/001_hero.jpg")
          ? builderState.coverImage
          : ((firstCover && !firstCover.startsWith("blob:") && !firstCover.startsWith("blobKey:") && firstCover !== "photos/sets/bree/001_hero.jpg")
              ? firstCover
              : `proofs/test-client/${builderState.coverTone || "colour"}/${builderState.coverFilename || (allFlatImages[0] ? allFlatImages[0].filename : "Asha-001.jpg")}`),
        coverFilename: builderState.coverFilename || (existingShoot && existingShoot.coverFilename) || "",
        coverTone: builderState.coverTone || "colour",
        notes: builderState.notes || `Welcome ${name}! Please review your proofs below.`,
        hasVariants: builderState.looks.some(l => (l.toneKeys && l.toneKeys.length > 1) || l.toneMode !== "colour"),
        customToneLabels: builderState.customToneLabels || {},
        sections: constructedSections,
        images: allFlatImages,
        isCustom: true,
        updatedAt: Date.now()
      };
      delete updatedShoot.__prepared;
      if (!updatedShoot.createdAt) updatedShoot.createdAt = Date.now();

      const notifyTargetEmail = (builderState.clientNotifyEmail || loadClientNotifyEmail(shootId) || "").trim();
      if (notifyTargetEmail) {
        saveClientNotifyEmail(shootId, notifyTargetEmail);
      }

      if (hasDriveDelivery && updatedShoot.deliveryReady && isValidEmailAddress(notifyTargetEmail) && builderState.sendDeliveryEmailOnSave) {
        submitBtn.textContent = "Emailing Client...";
        const emailRes = await sendClientDeliveryReadyEmail(updatedShoot, notifyTargetEmail);
        if (emailRes && emailRes.ok) {
          updatedShoot.deliveryEmailSentAt = Date.now();
        }
      }

      await saveCustomShoot(updatedShoot);
      try { localStorage.removeItem(`kh_delivery_custom_${shootId}`); } catch (e) {}

      submitBtn.textContent = builderState.isEditMode ? "Setup Saved ✓" : "Gallery Published ✓";
      setShootUnlockedMode(updatedShoot.id, "client");
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.hash = `#/client-portal/${updatedShoot.id}`;
        }
        renderClientPortalEdition(container, updatedShoot.id, null);
      }, 400);
    }

    renderPageHtml();
  }

  function openGalleryBuilderModal(container) {
    renderGalleryBuilderPage(container);
  }

  function openExportModal(shootId) {
    const shoot = getShootById(shootId);
    if (!shoot) return;

    const cleanShoot = {
      id: shoot.id,
      code: shoot.code,
      agencyCode: getShootAgencyCode(shoot),
      clientName: shoot.clientName,
      shootTitle: shoot.shootTitle,
      shootDate: shoot.shootDate,
      location: shoot.location,
      packageQuota: shoot.packageQuota,
      ...(shoot.isTfp ? { isTfp: true, tfpFavouriteLimit: getTfpFavLimit(shoot) } : {}),
      coverImage: `proofs/${shoot.id}/colour/${shoot.images && shoot.images[0] ? shoot.images[0].filename : "001.jpg"}`,
      notes: shoot.notes,
      hasVariants: shoot.hasVariants,
      sections: (shoot.sections || []).map(sec => ({
        id: sec.id,
        title: sec.title,
        description: sec.description,
        tonesNote: sec.tonesNote,
        images: (sec.images || []).map(img => {
          const v = {};
          if (img.versions) {
            Object.keys(img.versions).forEach(t => {
              v[t] = `proofs/${shoot.id}/${t}/${img.filename}`;
            });
          }
          return {
            filename: img.filename,
            aspect: img.aspect || "2/3",
            versions: v
          };
        })
      }))
    };

    const jsCode = JSON.stringify(cleanShoot, null, 2);

    let modal = document.getElementById("portal-export-modal");
    if (modal) modal.remove();

    modal = document.createElement("div");
    modal.id = "portal-export-modal";
    modal.className = "portal-builder-modal-backdrop";
    modal.innerHTML = `
      <div class="portal-builder-card" style="max-width: 720px;">
        <div class="portal-builder-header">
          <div>
            <span class="portal-builder-kicker">Gallery Export</span>
            <h2 class="portal-builder-title">${shoot.clientName} &middot; JavaScript Code</h2>
            <p class="portal-builder-sub">Copy this object to permanently embed this shoot into <code>assets/client-portal-data.js</code>.</p>
          </div>
          <button type="button" class="portal-builder-close" id="export-close-btn">&times;</button>
        </div>
        <div style="padding: 24px;">
          <textarea readonly class="portal-form-textarea" style="font-family: monospace; font-size: 11px; height: 320px; white-space: pre;">${jsCode}</textarea>
          <div style="margin-top: 16px; display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" class="portal-builder-cancel-btn" id="export-dismiss-btn">Close</button>
            <button type="button" class="portal-builder-submit-btn" id="export-copy-btn">Copy to Clipboard</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector("#export-close-btn").addEventListener("click", close);
    modal.querySelector("#export-dismiss-btn").addEventListener("click", close);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });

    const copyBtn = modal.querySelector("#export-copy-btn");
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(jsCode).then(() => {
        copyBtn.textContent = "Copied ✓";
        setTimeout(() => copyBtn.textContent = "Copy to Clipboard", 2000);
      });
    });
  }

  /* ---------------------------------------------------------
     2. Shoot Proofing Gallery View (Clean Minimalist UI)
     --------------------------------------------------------- */
  function renderShootGallery(container, shoot) {
    showSelectedOnly = false;
    filterMode = "all";
    hideRejected = false;
    isReviewModalOpen = false;

    rejectedSet = loadRejected(shoot.id);

    const submissionStatus = loadSubmissionStatus(shoot.id);
    const isSubmitted = submissionStatus && submissionStatus.submitted && selectedMap.size > 0;

    // Dynamically compute all distinct tone keys present in this shoot
    const distinctTones = [];
    (shoot.images || []).forEach(img => {
      const avail = getAvailableTonesForImage(img);
      avail.forEach(t => {
        if (!distinctTones.includes(t)) distinctTones.push(t);
      });
    });
    if (distinctTones.length === 0) distinctTones.push("colour");
    if (!distinctTones.includes(globalTone)) {
      globalTone = distinctTones[0];
    }

    const isAgency = isAgencyView();
    const isTfp = !!shoot.isTfp;
    const tfpFavLimit = getTfpFavLimit(shoot);
    const tfpCounts = getTfpCounts(selectedMap);
    const selectionSummary = formatShootSelectionSummary(shoot, selectedMap);
    const clientFileCount = getSelectedFilenameCount(selectedMap);
    const agencyCount = agencySelectedMap.size;
    const matchedCount = getMatchedFilenameCount();

    container.innerHTML = `
      <div class="portal-gallery-wrap ${isAgency ? "is-agency-showcase-mode" : ""}">
        <!-- Top Navigation Bar -->
        <div class="portal-top-nav">
          <button type="button" class="portal-back-btn" id="portal-back-btn">
            &larr; ${isPhotographerAuth() ? "Master Dashboard" : "Lock Gallery"}
          </button>
          <div class="portal-top-nav-right" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            ${(!isAgency && shoot.isCustom && isPhotographerAuth()) ? `
              <button type="button" class="portal-edit-setup-nav-btn" id="portal-edit-setup-btn" title="Edit gallery setup and tone names">&#9998; Edit Setup</button>
            ` : ""}
            <div class="portal-shoot-tag-pill ${isAgency ? "is-agency-mode" : ""} ${(isAgency ? agencyCount > 0 : isSubmitted) ? "is-submitted" : ""}">
              <span class="portal-status-dot"></span>
              ${isAgency
                ? `Agency &amp; Casting View &middot; ${agencyCount} Agency Picks`
                : (isSubmitted ? `Client Selected (${selectedMap.size})` : "Private Proofing Active")}
            </div>
          </div>
        </div>

        <!-- Editorial Monograph Shoot Header -->
        <header class="portal-shoot-header">
          <div class="portal-header-meta">
            <span>${shoot.shootDate}</span>
            <span class="portal-meta-sep">&middot;</span>
            <span>${shoot.location}</span>
            <span class="portal-meta-sep">&middot;</span>
            <span>${shoot.images.length} Proofs</span>
            ${isTfp ? `<span class="portal-meta-sep">&middot;</span><span>TFP Shoot</span>` : ""}
            ${isAgency ? `<span class="portal-meta-sep">&middot;</span><span>Agency &amp; Casting Showcase</span>` : ""}
          </div>
          <h1 class="portal-client-title">${shoot.clientName}</h1>
          <p class="portal-session-subtitle">${shoot.shootTitle}</p>
          ${shoot.notes ? `<p class="portal-client-notes">${shoot.notes}</p>` : ""}
        </header>

        ${!isAgency ? `
          ${isTfp ? renderTfpGuideBannerHtml(shoot) : renderExtraEditsBannerHtml()}
          <div class="portal-notify-email-bar" id="portal-notify-email-bar">
            <div class="portal-notify-email-copy">
              <span class="portal-notify-email-icon">&#9993;</span>
              <label for="portal-client-notify-email" class="portal-notify-email-label">
                Add e-mail address to receive instant notification when your images are ready <span class="portal-notify-optional">(Optional)</span>
              </label>
            </div>
            <div class="portal-notify-email-form">
              <input type="email" id="portal-client-notify-email" class="portal-notify-email-input" placeholder="Enter your e-mail address..." value="${escapeHtml(loadClientNotifyEmail(shoot.id) || shoot.clientNotifyEmail || "")}" autocomplete="email">
              <button type="button" id="portal-client-notify-save-btn" class="portal-notify-email-btn ${(loadClientNotifyEmail(shoot.id) || shoot.clientNotifyEmail) ? "is-saved" : ""}">
                ${(loadClientNotifyEmail(shoot.id) || shoot.clientNotifyEmail) ? "Saved &#10003;" : "Notify Me"}
              </button>
            </div>
          </div>
        ` : `
          <div class="portal-agency-panel" id="portal-agency-panel">
            <div class="portal-agency-panel-top">
              <div>
                <span class="portal-agency-panel-kicker">&#9733; Agency &amp; Casting Showcase</span>
                <p class="portal-agency-panel-desc">
                  Review proofs alongside ${escapeHtml(shoot.clientName)}'s client selections (<span id="agency-summary-client-count">${clientFileCount}</span>), filter matched favourites, star your top picks (<span id="agency-summary-ag-count">${agencyCount}</span>), and leave photo casting notes synced live with Koray.
                </p>
              </div>
              <div class="portal-agency-stats-pills">
                <span class="portal-agency-stat-pill">&#9829; <span id="agency-pill-client-count">${clientFileCount}</span> Client Picks</span>
                <span class="portal-agency-stat-pill is-gold">&#9733; <span id="agency-pill-ag-count">${agencyCount}</span> Agency Picks</span>
                <span class="portal-agency-stat-pill">&#10022; <span id="agency-pill-matched-count">${matchedCount}</span> Matched</span>
              </div>
            </div>
          </div>
        `}

        ${distinctTones.length > 1 ? `
          <!-- Global Tone Switcher Header Bar -->
          <div class="portal-tone-bar">
            <div class="portal-tone-bar-left">
              <span class="portal-tone-label">Baseline Tone:</span>
              <div class="portal-tone-pill-group" id="global-tone-group">
                ${distinctTones.map(tKey => `
                  <button type="button" class="portal-tone-btn ${globalTone === tKey ? "is-active" : ""}" data-tone="${tKey}">
                    ${getToneLabel(tKey, shoot)}
                  </button>
                `).join("")}
              </div>
            </div>
            <div class="portal-tone-bar-right">
              <span class="portal-tone-hint">${isAgency
                ? "Tip: Tap ★ on any photo to star Agency Picks, compare with Client Picks, and tap the pencil for casting notes."
                : (isTfp
                    ? `Tip: Tap \u2665 for your Top ${tfpFavLimit} favourites (max ${tfpFavLimit}), \u2713 for other images you like, \u00d7 to reject, and \u270e for notes.`
                    : "Tip: Tap the heart to like, the &times; to reject, and the pencil to add editing notes.")}</span>
            </div>
          </div>
        ` : ""}

        <!-- Sticky Controls Bar -->
        <div class="portal-controls-bar">
          <div class="portal-controls-left">
            <button type="button" class="portal-filter-tab ${filterMode === "all" ? "is-active" : ""}" id="tab-show-all">
              All <span class="portal-tab-count">${shoot.images.length}</span>
            </button>
            ${isAgency ? `
              <button type="button" class="portal-filter-tab ${filterMode === "client-picks" ? "is-active" : ""}" id="tab-show-client-picks">
                &#9829; Client Picks <span class="portal-tab-count" id="tab-client-picks-count">${clientFileCount}</span>
              </button>
              <button type="button" class="portal-filter-tab ${filterMode === "agency-picks" ? "is-active" : ""}" id="tab-show-agency-picks">
                &#9733; Agency Picks <span class="portal-tab-count" id="tab-agency-picks-count">${agencyCount}</span>
              </button>
              <button type="button" class="portal-filter-tab ${filterMode === "matched" ? "is-active" : ""}" id="tab-show-matched">
                &#10022; Matched <span class="portal-tab-count" id="tab-matched-count">${matchedCount}</span>
              </button>
            ` : `
              ${isTfp ? `
                <button type="button" class="portal-filter-tab ${filterMode === "tfp-favs" ? "is-active" : ""}" id="tab-show-tfp-favs">
                  &#9829; Favourites <span class="portal-tab-count" id="tab-tfp-favs-count">${tfpCounts.favourites}/${tfpFavLimit}</span>
                </button>
                <button type="button" class="portal-filter-tab ${filterMode === "tfp-likes" ? "is-active" : ""}" id="tab-show-tfp-likes">
                  &#10003; Likes <span class="portal-tab-count" id="tab-tfp-likes-count">${tfpCounts.likes}</span>
                </button>
              ` : `
                <button type="button" class="portal-filter-tab ${filterMode === "selected" ? "is-active" : ""}" id="tab-show-selected">
                  Selected <span class="portal-tab-count" id="tab-selected-count">${selectedMap.size}</span>
                </button>
              `}
              ${agencyCount > 0 ? `
                <button type="button" class="portal-filter-tab ${filterMode === "agency-picks" ? "is-active" : ""}" id="tab-show-agency-picks">
                  &#9733; Agency Picks <span class="portal-tab-count" id="tab-agency-picks-count">${agencyCount}</span>
                </button>
              ` : ""}
              <button type="button" class="portal-filter-tab ${filterMode === "rejected" ? "is-active" : ""}" id="tab-show-rejected">
                Rejected <span class="portal-tab-count" id="tab-rejected-count">${rejectedSet.size}</span>
              </button>
              <button type="button" class="portal-filter-toggle-btn ${hideRejected ? "is-active" : ""}" id="toggle-hide-rejected" title="${hideRejected ? "Click to show rejected photos" : "Click to hide rejected photos from view"}">
                <span class="toggle-reject-icon">&times;</span> ${hideRejected ? "Rejected Hidden" : "Hide Rejected"}
              </button>
            `}
          </div>

          <div class="portal-controls-right">
            ${isAgency ? `
              <button type="button" class="portal-submit-pill-btn portal-agency-pill-btn" id="agency-controls-save-btn">
                Save Agency Picks (${agencyCount}) &rarr;
              </button>
            ` : `
              <span class="portal-cloud-sync-status" id="portal-cloud-sync-status">Cloud ready</span>
              <span class="portal-quota-indicator ${(!isTfp && selectedMap.size > (parseInt(shoot.packageQuota, 10) || 15)) ? "is-extra-quota" : ""}" id="portal-controls-quota-pill">${selectionSummary}</span>
              <button type="button" class="portal-submit-pill-btn" id="open-review-btn">
                Review (${selectedMap.size}) &rarr;
              </button>
            `}
          </div>
        </div>

        <!-- Look / Section Quick Jump Navigation (Visible when multiple looks exist) -->
        ${(shoot.sections && shoot.sections.length > 1) ? `
          <nav class="portal-look-nav" aria-label="Shoot Sections">
            <div class="portal-look-nav-inner">
              <span class="portal-look-nav-label">Jump to:</span>
              <div class="portal-look-nav-pills">
                ${shoot.sections.map((sec, idx) => `
                  <a href="#look-anchor-${sec.id}" class="portal-look-nav-pill" data-sec-id="${sec.id}">
                    <span class="look-nav-num">0${idx + 1}</span>
                    <span class="look-nav-title">${sec.title}</span>
                    <span class="look-nav-count">(${sec.images ? sec.images.length : 0})</span>
                  </a>
                `).join("")}
              </div>
            </div>
          </nav>
        ` : ""}

        <!-- Sections & Proofs Grid Container -->
        <div class="portal-sections-container" id="portal-sections-container">
          ${renderAllSectionsHtml(shoot).html}
        </div>

        <!-- Empty State for Selected Filter -->
        <div class="portal-empty-state" id="portal-empty-state" style="display: none;">
          <p class="portal-empty-title">No images selected yet.</p>
          <p class="portal-empty-desc">${isTfp
            ? `Tap the heart (\u2665) for your Top ${tfpFavLimit} favourites or the tick (\u2713) for any other images you like.`
            : "Tap the heart on any photo to add it to your shortlist."}</p>
          <button type="button" class="portal-enter-btn" id="empty-show-all-btn">Show All Proofs</button>
        </div>

        <!-- Floating Mobile Selection Bar -->
        <div class="portal-floating-bar" id="portal-floating-bar">
          <div class="portal-floating-info">
            <span class="portal-floating-count" id="floating-count">${isAgency ? `${agencyCount} Agency Picks` : selectionSummary}</span>
          </div>
          <div class="portal-floating-actions">
            <button type="button" class="portal-floating-filter-btn" id="floating-toggle-filter">
              ${isAgency ? (filterMode === "agency-picks" ? "Show All" : "Agency Picks") : (showSelectedOnly ? "Show All" : "View Selected")}
            </button>
            ${isAgency ? `
              <button type="button" class="portal-floating-submit-btn" id="floating-agency-save-btn">
                Save Picks &rarr;
              </button>
            ` : `
              <button type="button" class="portal-floating-submit-btn" id="floating-review-btn">
                Review Picks &rarr;
              </button>
            `}
          </div>
        </div>

        <!-- Quick Editing Note Modal Dialog -->
        <div class="portal-quick-note-modal" id="portal-quick-note-modal" style="display: none;">
          <div class="portal-quick-note-box">
            <div class="portal-quick-note-header">
              <span class="portal-quick-note-title" id="quick-note-title">Editing Note</span>
              <button type="button" class="portal-quick-note-close" id="quick-note-close">&times;</button>
            </div>
            <textarea 
              id="quick-note-textarea" 
              class="portal-quick-note-input" 
              rows="3" 
              placeholder="e.g. skin retouch, crop closer, remove flyaways..."
            ></textarea>
            <div class="portal-quick-note-actions">
              <button type="button" class="portal-quick-note-save" id="quick-note-save">Save Note</button>
              <button type="button" class="portal-quick-note-clear" id="quick-note-clear">Clear Note</button>
            </div>
          </div>
        </div>
      </div>
    `;

    bindGalleryEvents(container, shoot);
  }

  function renderAllSectionsHtml(shoot) {
    if (shoot && shoot.images && Array.isArray(shoot.images)) {
      shoot.images.sort(naturalSortFilenames);
    }
    const sections = (shoot.sections && shoot.sections.length > 0)
      ? shoot.sections
      : [{ id: "all", title: "", description: "", images: shoot.images || [] }];

    const hasMultipleSections = sections.length > 1;
    let anyContent = false;

    const html = sections.map((sec, secIdx) => {
      const secImages = (sec.images || []);
      secImages.sort(naturalSortFilenames);
      const filtered = secImages.filter(img => {
        if (filterMode === "selected") {
          return isFileSelected(img.filename);
        }
        if (filterMode === "tfp-favs") {
          return getFileSelectionTiers(img.filename).hasFavourite;
        }
        if (filterMode === "tfp-likes") {
          return getFileSelectionTiers(img.filename).hasLike;
        }
        if (filterMode === "client-picks") {
          return isFileSelected(img.filename);
        }
        if (filterMode === "agency-picks") {
          return isFileAgencySelected(img.filename);
        }
        if (filterMode === "matched") {
          return isFileSelected(img.filename) && isFileAgencySelected(img.filename);
        }
        if (filterMode === "rejected") {
          return isImageRejected(img.filename);
        }
        // filterMode === "all"
        if (!isAgencyView() && hideRejected && isImageRejected(img.filename)) {
          return false;
        }
        return true;
      });
      filtered.sort(naturalSortFilenames);

      if (filtered.length === 0) {
        return "";
      }

      anyContent = true;

      // Calculate tone availability summary badge for this section
      let tonesBadge = sec.tonesNote || "";
      if (!tonesBadge) {
        const tonesSet = new Set();
        secImages.forEach(img => {
          getAvailableTonesForImage(img).forEach(t => tonesSet.add(t));
        });
        if (tonesSet.size === 1) tonesBadge = "Colour only";
        else if (tonesSet.size === 2) tonesBadge = "2 Versions";
        else tonesBadge = "Multi-Tone";
      }

      return `
        <section class="portal-look-section" id="look-anchor-${sec.id}" data-section-id="${sec.id}">
          ${hasMultipleSections ? `
            <div class="portal-look-header">
              <div class="portal-look-header-left">
                <span class="portal-look-kicker">LOOK 0${secIdx + 1}</span>
                <h2 class="portal-look-title">${sec.title}</h2>
                ${sec.description ? `<p class="portal-look-desc">${sec.description}</p>` : ""}
              </div>
              <div class="portal-look-header-right">
                <span class="portal-look-tone-badge">${tonesBadge}</span>
                <span class="portal-look-count">${filtered.length} ${filtered.length === 1 ? "Proof" : "Proofs"}</span>
              </div>
            </div>
          ` : ""}

          <div class="portal-proofs-grid">
            ${filtered.map(img => renderSingleProofCardHtml(img, shoot)).join("")}
          </div>
        </section>
      `;
    }).join("");

    return {
      html: html,
      hasContent: anyContent
    };
  }

  function renderProofCardsHtml(shoot) {
    return renderAllSectionsHtml(shoot).html;
  }

  function renderSingleProofCardHtml(img, shoot) {
    const isAgency = isAgencyView();
    const isTfp = !!(shoot && shoot.isTfp);
    const activeTone = getImageActiveTone(img.filename, shoot);
    const isCurrentClientToneSelected = isToneSelected(img.filename, activeTone);
    const hasAnyClientSelected = getSelectedTonesForFile(img.filename).length > 0;
    const isCurrentAgencyToneSelected = isAgencyToneSelected(img.filename, activeTone);
    const hasAnyAgencySelected = getAgencySelectedTonesForFile(img.filename).length > 0;
    const isCurrentToneSelected = isAgency ? isCurrentAgencyToneSelected : isCurrentClientToneSelected;
    const hasAnySelected = isAgency ? hasAnyAgencySelected : hasAnyClientSelected;
    const isRejected = isAgency ? false : isImageRejected(img.filename);
    const imgSrc = resolveImageSrc(img, activeTone);
    const clientNoteText = getImageNote(img.filename);
    const agencyNoteText = getAgencyImageNote(img.filename);
    const noteText = isAgency ? agencyNoteText : clientNoteText;
    const availableTones = getAvailableTonesForImage(img);
    const blobKey = getBlobKeyForImage(img, activeTone);

    const tfpFavLimit = isTfp ? getTfpFavLimit(shoot) : DEFAULT_TFP_FAV_LIMIT;
    const currentTier = (isTfp && !isAgency) ? getSelectionTier(img.filename, activeTone) : null;
    const fileTiers = (isTfp && !isAgency) ? getFileSelectionTiers(img.filename) : { hasFavourite: false, hasLike: false, any: false };
    const isHeartActive = (isTfp && !isAgency) ? (currentTier === "favourite") : isCurrentToneSelected;
    const isLikeActive = !!(isTfp && !isAgency && currentTier === "like");
    const tfpFavLimitReached = !!(isTfp && !isAgency && currentTier !== "favourite" && getTfpCounts(selectedMap).favourites >= tfpFavLimit);
    const cardTfpClass = (isTfp && !isAgency)
      ? `${fileTiers.hasFavourite ? "is-tfp-fav" : ""} ${fileTiers.hasLike ? "is-tfp-like" : ""}`
      : "";

    return `
      <div class="portal-proof-card ${hasAnySelected ? "is-selected" : ""} ${cardTfpClass} ${hasAnyAgencySelected ? "is-agency-selected" : ""} ${hasAnyClientSelected ? "is-client-pick" : ""} ${isRejected ? "is-rejected" : ""}" data-filename="${img.filename}">
        <div class="portal-proof-img-wrap">
          <img 
            src="${imgSrc || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400' viewBox='0 0 300 400'%3E%3Crect width='300' height='400' fill='%23161616'/%3E%3C/svg%3E"}" 
            alt="${img.filename}" 
            class="portal-proof-img" 
            id="proof-img-${img.filename.replace(/[^a-zA-Z0-9]/g, '_')}"
            data-filename="${img.filename}"
            data-blob-key="${blobKey}"
            loading="lazy"
            decoding="async"
          >
          
          ${isRejected ? `<span class="portal-card-rejected-banner">&times; Rejected</span>` : ""}

          ${(hasAnyClientSelected || hasAnyAgencySelected) ? `
            <div class="portal-card-role-badges">
              ${(isAgency && hasAnyClientSelected) ? `<span class="portal-card-client-badge" title="Selected by client">&#9829; Client Pick</span>` : ""}
              ${(!isAgency && isTfp && fileTiers.hasFavourite) ? `<span class="portal-card-tfp-fav-badge" title="Top ${tfpFavLimit} Favourite to definitely edit">&#9829; Top ${tfpFavLimit}</span>` : ""}
              ${(!isAgency && isTfp && !fileTiers.hasFavourite && fileTiers.hasLike) ? `<span class="portal-card-tfp-like-badge" title="Other image you like">&#10003; Liked</span>` : ""}
              ${hasAnyAgencySelected ? `<span class="portal-card-agency-badge" title="Starred in Agency View">&#9733; Agency Pick</span>` : ""}
            </div>
          ` : ""}

          <!-- Bottom-Right Corner Action Cluster -->
          <div class="portal-card-action-cluster">
            ${(!isAgency && isPhotographerAuth()) ? `
              <!-- Set as Gallery Cover Photo (Photographer only) -->
              <button 
                type="button" 
                class="portal-card-cover-btn ${(shoot.coverFilename === img.filename || (shoot.coverBlobKey && img.blobKey && shoot.coverBlobKey === img.blobKey)) ? "is-active-cover" : ""}" 
                data-filename="${img.filename}"
                title="${(shoot.coverFilename === img.filename || (shoot.coverBlobKey && img.blobKey && shoot.coverBlobKey === img.blobKey)) ? "Current gallery cover photo" : "Set as gallery cover photo"}"
                aria-label="Set as cover photo"
              >
                ${(shoot.coverFilename === img.filename || (shoot.coverBlobKey && img.blobKey && shoot.coverBlobKey === img.blobKey)) ? "★" : "☆"}
              </button>
            ` : ""}

            ${!isAgency ? `
              <!-- Reject Button (Cross / X) -->
              <button 
                type="button" 
                class="portal-reject-btn ${isRejected ? "is-active" : ""}" 
                data-filename="${img.filename}"
                title="${isRejected ? "Rejected (click to restore photo)" : "Reject photo"}"
                aria-label="${isRejected ? "Restore photo" : "Reject photo"}"
              >
                <svg class="reject-icon" viewBox="0 0 24 24" width="14" height="14">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></line>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></line>
                </svg>
              </button>
            ` : ""}

            <!-- Slide-out Note Button (slides out smoothly when photo is picked or has a note) -->
            <button 
              type="button" 
              class="portal-note-slide-btn ${(hasAnySelected || noteText) ? "is-visible" : ""} ${noteText ? "has-note" : ""}" 
              data-filename="${img.filename}"
              title="${noteText ? `${isAgency ? "Agency note" : "Note"}: \"${noteText}\" (tap to edit)` : (isAgency ? "Add casting / agency note (optional)" : "Leave editing note (optional)")}"
              aria-label="${isAgency ? "Leave casting note" : "Leave editing note"}"
            >
              <span class="note-pencil-icon">&#9998;</span>
              <span class="note-slide-label">${noteText ? "Note added" : (isAgency ? "Agency note" : "Leave note")}</span>
            </button>

            ${isAgency ? `
              <!-- Agency Star Button (Toggles star pick for current tone) -->
              <button 
                type="button" 
                class="portal-agency-star-btn ${isCurrentToneSelected ? "is-active" : ""}" 
                data-filename="${img.filename}"
                data-tone="${activeTone}"
                title="${isCurrentToneSelected ? "Remove from Agency Picks" : "Star as Agency Pick"}"
                aria-label="${isCurrentToneSelected ? "Remove from Agency Picks" : "Star as Agency Pick"}"
              >
                <svg class="star-icon" viewBox="0 0 24 24" width="16" height="16">
                  <polygon fill="${isCurrentToneSelected ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linejoin="round" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </button>
            ` : `
              ${isTfp ? `
                <!-- TFP Other Likes Tick Button (unlimited) -->
                <button 
                  type="button" 
                  class="portal-select-like ${isLikeActive ? "is-active" : ""}" 
                  data-filename="${img.filename}"
                  data-tone="${activeTone}"
                  title="${isLikeActive ? "Remove from other likes (\u2713)" : "Select as other image you like (\u2713)"}"
                  aria-label="${isLikeActive ? "Remove from other likes" : "Add to other likes"}"
                >
                  <svg class="like-check-icon" viewBox="0 0 24 24" width="15" height="15">
                    <polyline fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
              ` : ""}
              <!-- Heart Button (Toggles like / Top 10 favourite for current tone) -->
              <button 
                type="button" 
                class="portal-select-heart ${isHeartActive ? "is-active" : ""} ${tfpFavLimitReached ? "is-limit-reached" : ""}" 
                data-filename="${img.filename}"
                data-tone="${activeTone}"
                title="${isTfp ? (isHeartActive ? `Remove from Top ${tfpFavLimit} favourites (\u2665)` : (tfpFavLimitReached ? `${tfpFavLimit}/${tfpFavLimit} favourites full \u2014 unheart one to swap, or tap \u2713` : `Mark as Top ${tfpFavLimit} favourite (\u2665)`)) : (isHeartActive ? "Remove from selections" : "Select photo")}"
                aria-label="${isTfp ? (isHeartActive ? "Remove from Top 10 favourites" : "Mark as Top 10 favourite") : (isHeartActive ? "Remove from selections" : "Select photo")}"
              >
                <svg class="heart-icon" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="${isHeartActive ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                </svg>
              </button>
            `}
          </div>
        </div>

        <!-- Pure Clean Footer: Filename on Left + Version Toggle Pills on Right -->
        <div class="portal-proof-footer">
          <span class="portal-proof-filename">${img.filename}</span>

          ${availableTones.length > 1 ? `
            <div class="portal-card-tone-pill" data-filename="${img.filename}">
              ${availableTones.map(toneKey => {
                const isSel = isAgency ? isAgencyToneSelected(img.filename, toneKey) : isToneSelected(img.filename, toneKey);
                const shortLab = getToneShort(toneKey, shoot);
                const fullLab = getToneLabel(toneKey, shoot);
                return `
                  <button 
                    type="button" 
                    class="card-tone-btn ${activeTone === toneKey ? "is-active" : ""} ${isSel ? "is-selected-version" : ""}" 
                    data-tone="${toneKey}" 
                    title="${fullLab} ${isSel ? "(Selected)" : ""}"
                  >
                    ${shortLab}${isSel ? " &#10003;" : ""}
                  </button>
                `;
              }).join("")}
            </div>
          ` : `
            <span class="portal-card-single-tone-tag">${getToneLabel(availableTones[0], shoot)}</span>
          `}
        </div>
      </div>
    `;
  }

  /* ---------------------------------------------------------
     3. Bind Interactive Gallery Events
     --------------------------------------------------------- */
  function bindGalleryEvents(container, shoot) {
    const isAgency = isAgencyView();
    const sectionsContainer = container.querySelector("#portal-sections-container");
    const emptyState = container.querySelector("#portal-empty-state");
    const tabAll = container.querySelector("#tab-show-all");
    const tabSel = container.querySelector("#tab-show-selected");
    const tabClientPicks = container.querySelector("#tab-show-client-picks");
    const tabAgencyPicks = container.querySelector("#tab-show-agency-picks");
    const tabMatched = container.querySelector("#tab-show-matched");
    const selCountEl = container.querySelector("#tab-selected-count");
    const quotaCountEl = container.querySelector("#quota-selected-count");
    const openReviewBtn = container.querySelector("#open-review-btn");
    const floatingCount = container.querySelector("#floating-count");
    const floatingToggle = container.querySelector("#floating-toggle-filter");
    const floatingReview = container.querySelector("#floating-review-btn");
    const floatingAgencySave = container.querySelector("#floating-agency-save-btn");
    const backBtn = container.querySelector("#portal-back-btn");
    const editSetupBtn = container.querySelector("#portal-edit-setup-btn");
    const agencyControlsSaveBtn = container.querySelector("#agency-controls-save-btn");

    function showGalleryToast(msg) {
      let t = document.getElementById("portal-toast-msg");
      if (!t) {
        t = document.createElement("div");
        t.id = "portal-toast-msg";
        t.className = "splash-customiser-toast";
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.classList.add("is-visible");
      setTimeout(() => {
        t.classList.remove("is-visible");
      }, 2600);
    }

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        if (isPhotographerAuth()) {
          activeShootId = null;
          portalViewMode = "client";
          if (typeof window !== "undefined") {
            window.location.hash = buildPortalRouteHash("");
          }
          renderLandingScreen(container);
        } else {
          clearShootUnlockedMode(shoot.id);
          portalViewMode = "client";
          filterMode = "all";
          if (typeof window !== "undefined") {
            const splashHash = buildPortalRouteHash(shoot.id);
            if (window.location.hash !== splashHash && window.history && window.history.replaceState) {
              window.history.replaceState(null, "", splashHash);
            }
          }
          renderShootSplashPage(container, shoot);
        }
      });
    }

    if (editSetupBtn) {
      editSetupBtn.addEventListener("click", () => {
        if (typeof window !== "undefined") {
          window.location.hash = buildPortalRouteHash(`${shoot.id}/edit`);
        } else {
          renderGalleryBuilderPage(container, shoot.id);
        }
      });
    }

    function renderGalleryContent() {
      const result = renderAllSectionsHtml(shoot);
      if (sectionsContainer) {
        sectionsContainer.innerHTML = result.html;
      }
      if (!result.hasContent) {
        if (emptyState) {
          emptyState.style.display = "block";
          const title = emptyState.querySelector(".portal-empty-title");
          const desc = emptyState.querySelector(".portal-empty-desc");
          if (filterMode === "selected") {
            if (title) title.textContent = "No images selected yet.";
            if (desc) desc.textContent = "Tap the heart on any photo to add it to your shortlist.";
          } else if (filterMode === "client-picks") {
            if (title) title.textContent = "No client picks saved yet.";
            if (desc) desc.textContent = "Client selections will appear here once chosen or synced from the cloud.";
          } else if (filterMode === "agency-picks") {
            if (title) title.textContent = "No agency picks starred yet.";
            if (desc) desc.textContent = isAgency ? "Tap the ★ button on any photo to star your Agency Picks." : "No agency picks have been starred for this gallery yet.";
          } else if (filterMode === "matched") {
            if (title) title.textContent = "No matched picks yet.";
            if (desc) desc.textContent = "Photos chosen by both the client and starred in Agency View appear here.";
          } else if (filterMode === "rejected") {
            if (title) title.textContent = "No rejected images.";
            if (desc) desc.textContent = "Tap the \u00d7 button on any photo to reject it.";
          } else {
            if (title) title.textContent = "No photos visible.";
            if (desc) desc.textContent = "All photos in this view have been hidden.";
          }
        }
        if (sectionsContainer) sectionsContainer.style.display = "none";
      } else {
        if (emptyState) emptyState.style.display = "none";
        if (sectionsContainer) sectionsContainer.style.display = "block";
      }
    }

    // Quick Note Modal elements (always attached to document.body so transform on #main-content never traps or clips it)
    let noteModal = container.querySelector("#portal-quick-note-modal");
    if (noteModal && noteModal.parentNode !== document.body) {
      document.body.appendChild(noteModal);
    }
    const noteTitle = noteModal ? noteModal.querySelector("#quick-note-title") : null;
    const noteTextarea = noteModal ? noteModal.querySelector("#quick-note-textarea") : null;
    const noteClose = noteModal ? noteModal.querySelector("#quick-note-close") : null;
    const noteSave = noteModal ? noteModal.querySelector("#quick-note-save") : null;
    const noteClear = noteModal ? noteModal.querySelector("#quick-note-clear") : null;

    let noteModalOnSaveCallback = null;

    function openNoteModal(filename, onSave) {
      noteModalFilename = filename;
      noteModalOnSaveCallback = onSave || null;
      if (noteTitle) noteTitle.textContent = `${isAgency ? "Agency Note" : "Editing Note"} · ${filename}`;
      if (noteTextarea) {
        noteTextarea.value = isAgency ? getAgencyImageNote(filename) : getImageNote(filename);
        noteTextarea.placeholder = isAgency
          ? "e.g. Great for showcard lead, crop 4x5, check skin tone..."
          : "e.g. skin retouch, crop closer, remove flyaways...";
      }
      if (noteModal) {
        if (noteModal.parentNode !== document.body) {
          document.body.appendChild(noteModal);
        }
        noteModal.style.display = "flex";
      }
      if (noteTextarea) {
        setTimeout(() => {
          noteTextarea.focus();
        }, 80);
      }
    }

    function closeNoteModal() {
      if (noteTextarea) noteTextarea.blur();
      noteModalFilename = null;
      noteModalOnSaveCallback = null;
      if (noteModal) noteModal.style.display = "none";
    }

    if (noteClose) {
      noteClose.addEventListener("click", closeNoteModal);
      noteClose.addEventListener("touchend", (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeNoteModal();
      });
    }
    if (noteModal) {
      noteModal.addEventListener("click", (e) => {
        if (e.target === noteModal) closeNoteModal();
      });
    }

    if (noteSave) {
      noteSave.addEventListener("click", () => {
        if (!noteModalFilename) return;
        const val = noteTextarea ? noteTextarea.value : "";
        if (isAgency) {
          setAgencyImageNote(noteModalFilename, val);
          autoSyncAgencyToCloud(shoot.id);
        } else {
          setImageNote(noteModalFilename, val);
        }
        updateCardNoteButton(noteModalFilename);
        const cb = noteModalOnSaveCallback;
        closeNoteModal();
        if (cb) cb();
      });
    }

    if (noteClear) {
      noteClear.addEventListener("click", () => {
        if (!noteModalFilename) return;
        if (isAgency) {
          setAgencyImageNote(noteModalFilename, "");
          autoSyncAgencyToCloud(shoot.id);
        } else {
          setImageNote(noteModalFilename, "");
        }
        updateCardNoteButton(noteModalFilename);
        const cb = noteModalOnSaveCallback;
        closeNoteModal();
        if (cb) cb();
      });
    }

    function updateCardNoteButton(filename) {
      const card = container.querySelector(`.portal-proof-card[data-filename="${filename}"]`);
      if (card) {
        const slideBtn = card.querySelector(".portal-note-slide-btn");
        const note = isAgency ? getAgencyImageNote(filename) : getImageNote(filename);
        const hasAny = isAgency ? getAgencySelectedTonesForFile(filename).length > 0 : getSelectedTonesForFile(filename).length > 0;
        if (slideBtn) {
          slideBtn.classList.toggle("is-visible", hasAny || !!note);
          slideBtn.classList.toggle("has-note", !!note);
          const label = slideBtn.querySelector(".note-slide-label");
          if (label) label.textContent = note ? "Note added" : (isAgency ? "Agency note" : "Leave note");
          slideBtn.title = note
            ? `${isAgency ? "Agency note" : "Note"}: \"${note}\" (tap to edit)`
            : (isAgency ? "Add casting / agency note (optional)" : "Leave editing note (optional)");
        }
      }
    }

    const tabRej = container.querySelector("#tab-show-rejected");
    const tabRejCountEl = container.querySelector("#tab-rejected-count");
    const toggleHideRejBtn = container.querySelector("#toggle-hide-rejected");
    const tabTfpFavs = container.querySelector("#tab-show-tfp-favs");
    const tabTfpLikes = container.querySelector("#tab-show-tfp-likes");
    const tabTfpFavsCountEl = container.querySelector("#tab-tfp-favs-count");
    const tabTfpLikesCountEl = container.querySelector("#tab-tfp-likes-count");
    const isTfp = !!shoot.isTfp;
    const tfpFavLimit = getTfpFavLimit(shoot);

    function updateTfpLimitStates() {
      if (!isTfp || isAgency) return;
      const full = getTfpCounts(selectedMap).favourites >= tfpFavLimit;
      container.querySelectorAll(".portal-select-heart").forEach(heartEl => {
        const isHeartOn = heartEl.classList.contains("is-active");
        const blocked = full && !isHeartOn;
        heartEl.classList.toggle("is-limit-reached", blocked);
        heartEl.title = isHeartOn
          ? `Remove from Top ${tfpFavLimit} favourites (\u2665)`
          : (blocked
              ? `${tfpFavLimit}/${tfpFavLimit} favourites full \u2014 unheart one to swap, or tap \u2713`
              : `Mark as Top ${tfpFavLimit} favourite (\u2665)`);
      });
    }

    function updateUiCounters() {
      const count = selectedMap.size;
      const agCount = agencySelectedMap.size;
      const clientFiles = getSelectedFilenameCount(selectedMap);
      const matched = getMatchedFilenameCount();
      const rejCount = rejectedSet.size;
      const tfpC = getTfpCounts(selectedMap);

      if (selCountEl) selCountEl.textContent = count;
      if (quotaCountEl) quotaCountEl.textContent = count;
      if (tabRejCountEl) tabRejCountEl.textContent = rejCount;
      if (tabTfpFavsCountEl) tabTfpFavsCountEl.textContent = `${tfpC.favourites}/${tfpFavLimit}`;
      if (tabTfpLikesCountEl) tabTfpLikesCountEl.textContent = tfpC.likes;
      const quotaSummary = formatShootSelectionSummary(shoot, selectedMap);
      const controlsQuotaPill = container.querySelector("#portal-controls-quota-pill");
      if (controlsQuotaPill) {
        controlsQuotaPill.textContent = quotaSummary;
        controlsQuotaPill.classList.toggle("is-extra-quota", !isTfp && count > (parseInt(shoot.packageQuota, 10) || 15));
      }
      if (floatingCount) floatingCount.textContent = isAgency ? `${agCount} Agency Picks` : quotaSummary;
      if (openReviewBtn) openReviewBtn.textContent = `Review (${count}) \u2192`;

      const tabClientCount = container.querySelector("#tab-client-picks-count");
      if (tabClientCount) tabClientCount.textContent = clientFiles;
      const tabAgCount = container.querySelector("#tab-agency-picks-count");
      if (tabAgCount) tabAgCount.textContent = agCount;
      const tabMatchedCount = container.querySelector("#tab-matched-count");
      if (tabMatchedCount) tabMatchedCount.textContent = matched;

      const sumClient = container.querySelector("#agency-summary-client-count");
      const sumAg = container.querySelector("#agency-summary-ag-count");
      const pillClient = container.querySelector("#agency-pill-client-count");
      const pillAg = container.querySelector("#agency-pill-ag-count");
      const pillMatched = container.querySelector("#agency-pill-matched-count");
      if (sumClient) sumClient.textContent = clientFiles;
      if (sumAg) sumAg.textContent = agCount;
      if (pillClient) pillClient.textContent = clientFiles;
      if (pillAg) pillAg.textContent = agCount;
      if (pillMatched) pillMatched.textContent = matched;

      if (agencyControlsSaveBtn) agencyControlsSaveBtn.innerHTML = `Save Agency Picks (${agCount}) &rarr;`;

      if (isAgency) {
        const topPill = container.querySelector(".portal-shoot-tag-pill");
        if (topPill) {
          topPill.classList.toggle("is-submitted", agCount > 0);
          topPill.innerHTML = `<span class="portal-status-dot"></span>Agency &amp; Casting View &middot; ${agCount} Agency Picks`;
        }
      }
    }

    // Toggle Reject for a file
    function onToggleReject(filename) {
      const isNowRejected = toggleReject(filename);
      if (isNowRejected) {
        // If rejected, remove any selections for this file from shortlist
        let changed = false;
        for (const k of Array.from(selectedMap.keys())) {
          if (k.startsWith(filename + "::")) {
            selectedMap.delete(k);
            changed = true;
          }
        }
        if (changed) {
          saveSelections(shoot.id, selectedMap);
        }
      }
      updateProofCard(filename);
      updateTfpLimitStates();
      updateUiCounters();

      if (hideRejected || filterMode !== "all") {
        renderGalleryContent();
      }
      return isNowRejected;
    }

    // Toggle TFP Two-Tier Client Selection ("favourite" capped at 10, "like" unlimited)
    function toggleTfpSelection(filename, tone, targetTier) {
      const imgObj = shoot.images ? shoot.images.find(i => i.filename === filename) : null;
      if (!imgObj) return;

      const activeTone = tone || getImageActiveTone(filename, shoot);
      const key = makeKey(filename, activeTone);
      const existing = selectedMap.get(key);
      const existingTier = existing ? (existing.tier === "like" ? "like" : "favourite") : null;
      const tier = targetTier === "like" ? "like" : "favourite";

      if (existingTier === tier) {
        selectedMap.delete(key);
      } else {
        if (tier === "favourite") {
          const favCount = getTfpCounts(selectedMap).favourites;
          if (favCount >= tfpFavLimit) {
            showGalleryToast(`All ${tfpFavLimit} \u2665 favourites used \u2014 unheart one to swap, or tap \u2713 to add more likes.`);
            return false;
          }
        }
        if (isImageRejected(filename)) {
          rejectedSet.delete(filename);
          saveRejected(shoot.id, rejectedSet);
        }
        selectedMap.set(key, {
          id: key,
          filename: filename,
          tone: activeTone,
          tier: tier,
          section: imgObj.section || "",
          src: resolveImageSrc(imgObj, activeTone)
        });
      }

      saveSelections(shoot.id, selectedMap);
      updateProofCard(filename);
      updateTfpLimitStates();
      updateUiCounters();

      const curStatus = loadSubmissionStatus(shoot.id);
      if (curStatus && curStatus.submitted) {
        saveSubmissionStatus(shoot.id, {
          submitted: true,
          savedAt: Date.now(),
          count: selectedMap.size
        });
      }
      autoSyncSelectionsToCloud(shoot.id);

      if (filterMode === "tfp-favs" || filterMode === "tfp-likes" || filterMode === "selected" || filterMode === "rejected" || filterMode === "client-picks" || filterMode === "matched" || hideRejected) {
        renderGalleryContent();
      }
      return true;
    }

    // Toggle Client Selection for a specific (filename, tone) version
    function toggleSelect(filename, tone) {
      if (isTfp && !isAgency) {
        return toggleTfpSelection(filename, tone, "favourite");
      }
      const imgObj = shoot.images ? shoot.images.find(i => i.filename === filename) : null;
      if (!imgObj) return;

      const activeTone = tone || getImageActiveTone(filename, shoot);
      const key = makeKey(filename, activeTone);

      if (selectedMap.has(key)) {
        selectedMap.delete(key);
      } else {
        // If photo was rejected, un-reject it when selected
        if (isImageRejected(filename)) {
          rejectedSet.delete(filename);
          saveRejected(shoot.id, rejectedSet);
        }
        selectedMap.set(key, {
          id: key,
          filename: filename,
          tone: activeTone,
          section: imgObj.section || "",
          src: resolveImageSrc(imgObj, activeTone)
        });
      }

      saveSelections(shoot.id, selectedMap);
      updateProofCard(filename);
      updateUiCounters();

      // Auto-sync every selection tap to Cloud so picks follow the client across devices
      const curStatus = loadSubmissionStatus(shoot.id);
      if (curStatus && curStatus.submitted) {
        saveSubmissionStatus(shoot.id, {
          submitted: true,
          savedAt: Date.now(),
          count: selectedMap.size
        });
      }
      autoSyncSelectionsToCloud(shoot.id);

      if (filterMode === "selected" || filterMode === "rejected" || filterMode === "client-picks" || filterMode === "matched" || hideRejected) {
        renderGalleryContent();
      }
    }

    // Toggle Agency Star Selection for a specific (filename, tone) version
    function toggleAgencySelect(filename, tone) {
      const imgObj = shoot.images ? shoot.images.find(i => i.filename === filename) : null;
      if (!imgObj) return;

      const activeTone = tone || getImageActiveTone(filename, shoot);
      const key = makeKey(filename, activeTone);

      if (agencySelectedMap.has(key)) {
        agencySelectedMap.delete(key);
      } else {
        agencySelectedMap.set(key, {
          id: key,
          filename: filename,
          tone: activeTone,
          section: imgObj.section || "",
          src: resolveImageSrc(imgObj, activeTone)
        });
      }

      saveAgencySelections(shoot.id, agencySelectedMap);
      updateProofCard(filename);
      updateUiCounters();
      autoSyncAgencyToCloud(shoot.id);

      if (filterMode === "agency-picks" || filterMode === "matched") {
        renderGalleryContent();
      }
    }

    // Update card appearance after selection, agency star, reject, or tone change
    function updateProofCard(filename) {
      const card = container.querySelector(`.portal-proof-card[data-filename="${filename}"]`);
      if (card) {
        const currentTone = getImageActiveTone(filename, shoot);
        const isClientToneSel = isToneSelected(filename, currentTone);
        const clientTones = getSelectedTonesForFile(filename);
        const hasAnyClient = clientTones.length > 0;
        const isAgToneSel = isAgencyToneSelected(filename, currentTone);
        const agTones = getAgencySelectedTonesForFile(filename);
        const hasAnyAgency = agTones.length > 0;
        const isCurrentToneSel = isAgency ? isAgToneSel : isClientToneSel;
        const hasAny = isAgency ? hasAnyAgency : hasAnyClient;
        const isRej = isAgency ? false : isImageRejected(filename);
        const activeNote = isAgency ? getAgencyImageNote(filename) : getImageNote(filename);

        card.classList.toggle("is-selected", hasAny);
        card.classList.toggle("is-agency-selected", hasAnyAgency);
        card.classList.toggle("is-client-pick", hasAnyClient);
        card.classList.toggle("is-rejected", isRej);

        const currentTier = (isTfp && !isAgency) ? getSelectionTier(filename, currentTone) : null;
        const fileTiers = (isTfp && !isAgency) ? getFileSelectionTiers(filename) : { hasFavourite: false, hasLike: false, any: false };
        card.classList.toggle("is-tfp-fav", !!(isTfp && !isAgency && fileTiers.hasFavourite));
        card.classList.toggle("is-tfp-like", !!(isTfp && !isAgency && fileTiers.hasLike));

        const heart = card.querySelector(".portal-select-heart");
        if (heart) {
          const isHeartActive = (isTfp && !isAgency) ? (currentTier === "favourite") : isClientToneSel;
          const favBlocked = !!(isTfp && !isAgency && !isHeartActive && getTfpCounts(selectedMap).favourites >= tfpFavLimit);
          heart.classList.toggle("is-active", isHeartActive);
          heart.classList.toggle("is-limit-reached", favBlocked);
          const path = heart.querySelector("path");
          if (path) path.setAttribute("fill", isHeartActive ? "currentColor" : "none");
        }

        const likeBtn = card.querySelector(".portal-select-like");
        if (likeBtn) {
          const isLikeActive = !!(isTfp && !isAgency && currentTier === "like");
          likeBtn.classList.toggle("is-active", isLikeActive);
          likeBtn.title = isLikeActive ? "Remove from other likes (\u2713)" : "Select as other image you like (\u2713)";
          likeBtn.setAttribute("aria-label", isLikeActive ? "Remove from other likes" : "Add to other likes");
        }

        const starBtn = card.querySelector(".portal-agency-star-btn");
        if (starBtn) {
          starBtn.classList.toggle("is-active", isAgToneSel);
          const poly = starBtn.querySelector("polygon");
          if (poly) poly.setAttribute("fill", isAgToneSel ? "currentColor" : "none");
          starBtn.title = isAgToneSel ? "Remove from Agency Picks" : "Star as Agency Pick";
        }

        const rejBtn = card.querySelector(".portal-reject-btn");
        if (rejBtn) {
          rejBtn.classList.toggle("is-active", isRej);
          rejBtn.title = isRej ? "Rejected (click to restore photo)" : "Reject photo";
          rejBtn.setAttribute("aria-label", isRej ? "Restore photo" : "Reject photo");
        }

        const imgWrap = card.querySelector(".portal-proof-img-wrap");
        if (imgWrap) {
          let banner = imgWrap.querySelector(".portal-card-rejected-banner");
          if (isRej) {
            if (!banner) {
              banner = document.createElement("span");
              banner.className = "portal-card-rejected-banner";
              banner.innerHTML = "&times; Rejected";
              imgWrap.insertBefore(banner, imgWrap.firstElementChild.nextSibling);
            }
          } else if (banner) {
            banner.remove();
          }

          let roleWrap = imgWrap.querySelector(".portal-card-role-badges");
          const showClientBadge = isAgency && hasAnyClient;
          const showTfpFavBadge = !isAgency && isTfp && fileTiers.hasFavourite;
          const showTfpLikeBadge = !isAgency && isTfp && !fileTiers.hasFavourite && fileTiers.hasLike;
          const showAgencyBadge = hasAnyAgency;
          if (showClientBadge || showTfpFavBadge || showTfpLikeBadge || showAgencyBadge) {
            if (!roleWrap) {
              roleWrap = document.createElement("div");
              roleWrap.className = "portal-card-role-badges";
              imgWrap.appendChild(roleWrap);
            }
            roleWrap.innerHTML =
              (showClientBadge ? `<span class="portal-card-client-badge" title="Selected by client">&#9829; Client Pick</span>` : "") +
              (showTfpFavBadge ? `<span class="portal-card-tfp-fav-badge" title="Top ${tfpFavLimit} Favourite to definitely edit">&#9829; Top ${tfpFavLimit}</span>` : "") +
              (showTfpLikeBadge ? `<span class="portal-card-tfp-like-badge" title="Other image you like">&#10003; Liked</span>` : "") +
              (showAgencyBadge ? `<span class="portal-card-agency-badge" title="Starred in Agency View">&#9733; Agency Pick</span>` : "");
          } else if (roleWrap) {
            roleWrap.remove();
          }
        }

        // Toggle slide-out note button smoothly!
        const slideBtn = card.querySelector(".portal-note-slide-btn");
        if (slideBtn) {
          slideBtn.classList.toggle("is-visible", hasAny || !!activeNote);
        }

        // Update tone buttons checkmarks
        card.querySelectorAll(".card-tone-btn").forEach(btn => {
          const t = btn.dataset.tone;
          const isTSelected = isAgency ? isAgencyToneSelected(filename, t) : isToneSelected(filename, t);
          btn.classList.toggle("is-selected-version", isTSelected);
          btn.innerHTML = `${getToneShort(t, shoot)}${isTSelected ? " &#10003;" : ""}`;
        });
      }
    }

    // Change tone for a single image preview
    function setItemTone(filename, tone) {
      itemTones[filename] = tone;
      const imgObj = shoot.images ? shoot.images.find(i => i.filename === filename) : null;
      if (!imgObj) return;

      const card = container.querySelector(`.portal-proof-card[data-filename="${filename}"]`);
      if (card) {
        const imgEl = card.querySelector(".portal-proof-img");
        if (imgEl) {
          const newBlobKey = getBlobKeyForImage(imgObj, tone);
          imgEl.dataset.blobKey = newBlobKey;
          imgEl.src = resolveImageSrc(imgObj, tone) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400' viewBox='0 0 300 400'%3E%3Crect width='300' height='400' fill='%23161616'/%3E%3C/svg%3E";
        }

        // Update active tone button styling
        card.querySelectorAll(".card-tone-btn").forEach(btn => {
          btn.classList.toggle("is-active", btn.dataset.tone === tone);
        });

        // Update heart, like, or star state for the newly viewed tone
        const currentTier = (isTfp && !isAgency) ? getSelectionTier(filename, tone) : null;
        const heart = card.querySelector(".portal-select-heart");
        if (heart) {
          const isHeartActive = (isTfp && !isAgency) ? (currentTier === "favourite") : isToneSelected(filename, tone);
          const favBlocked = !!(isTfp && !isAgency && !isHeartActive && getTfpCounts(selectedMap).favourites >= tfpFavLimit);
          heart.dataset.tone = tone;
          heart.classList.toggle("is-active", isHeartActive);
          heart.classList.toggle("is-limit-reached", favBlocked);
          const path = heart.querySelector("path");
          if (path) path.setAttribute("fill", isHeartActive ? "currentColor" : "none");
        }
        const likeBtn = card.querySelector(".portal-select-like");
        if (likeBtn) {
          const isLikeActive = !!(isTfp && !isAgency && currentTier === "like");
          likeBtn.dataset.tone = tone;
          likeBtn.classList.toggle("is-active", isLikeActive);
        }
        const starBtn = card.querySelector(".portal-agency-star-btn");
        if (starBtn) {
          const isCurrentAgToneSel = isAgencyToneSelected(filename, tone);
          starBtn.dataset.tone = tone;
          starBtn.classList.toggle("is-active", isCurrentAgToneSel);
          const poly = starBtn.querySelector("polygon");
          if (poly) poly.setAttribute("fill", isCurrentAgToneSel ? "currentColor" : "none");
        }
      }
    }

    // Set Global Baseline Tone
    function setGlobalTone(tone) {
      globalTone = tone;
      container.querySelectorAll("#global-tone-group .portal-tone-btn").forEach(btn => {
        btn.classList.toggle("is-active", btn.dataset.tone === tone);
      });

      // Clear per-item overrides so all items inherit the global baseline
      itemTones = {};
      renderGalleryContent();
    }

    // Bind Global Tone Buttons
    container.querySelectorAll("#global-tone-group .portal-tone-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tone = btn.dataset.tone;
        setGlobalTone(tone);
      });
    });

    // Toggle filter mode
    function setFilterMode(mode) {
      filterMode = mode;
      showSelectedOnly = (filterMode === "selected" || filterMode === "tfp-favs" || filterMode === "tfp-likes" || filterMode === "agency-picks");
      if (tabAll) tabAll.classList.toggle("is-active", filterMode === "all");
      if (tabSel) tabSel.classList.toggle("is-active", filterMode === "selected");
      if (tabTfpFavs) tabTfpFavs.classList.toggle("is-active", filterMode === "tfp-favs");
      if (tabTfpLikes) tabTfpLikes.classList.toggle("is-active", filterMode === "tfp-likes");
      if (tabClientPicks) tabClientPicks.classList.toggle("is-active", filterMode === "client-picks");
      if (tabAgencyPicks) tabAgencyPicks.classList.toggle("is-active", filterMode === "agency-picks");
      if (tabMatched) tabMatched.classList.toggle("is-active", filterMode === "matched");
      if (tabRej) tabRej.classList.toggle("is-active", filterMode === "rejected");
      if (floatingToggle) {
        if (isAgency) {
          floatingToggle.textContent = filterMode === "agency-picks" ? "Show All" : "Agency Picks";
        } else if (isTfp) {
          floatingToggle.textContent = filterMode === "tfp-favs" ? "Show All" : `Top ${tfpFavLimit} \u2665`;
        } else {
          floatingToggle.textContent = filterMode === "selected" ? "Show All" : "View Selected";
        }
      }
      renderGalleryContent();
    }

    if (tabAll) tabAll.addEventListener("click", () => setFilterMode("all"));
    if (tabSel) tabSel.addEventListener("click", () => setFilterMode("selected"));
    if (tabTfpFavs) tabTfpFavs.addEventListener("click", () => setFilterMode("tfp-favs"));
    if (tabTfpLikes) tabTfpLikes.addEventListener("click", () => setFilterMode("tfp-likes"));
    if (tabClientPicks) tabClientPicks.addEventListener("click", () => setFilterMode("client-picks"));
    if (tabAgencyPicks) tabAgencyPicks.addEventListener("click", () => setFilterMode("agency-picks"));
    if (tabMatched) tabMatched.addEventListener("click", () => setFilterMode("matched"));
    if (tabRej) tabRej.addEventListener("click", () => setFilterMode("rejected"));
    if (floatingToggle) floatingToggle.addEventListener("click", () => {
      if (isAgency) {
        setFilterMode(filterMode === "agency-picks" ? "all" : "agency-picks");
      } else if (isTfp) {
        setFilterMode(filterMode === "tfp-favs" ? "all" : "tfp-favs");
      } else {
        setFilterMode(filterMode === "selected" ? "all" : "selected");
      }
    });

    if (toggleHideRejBtn) {
      toggleHideRejBtn.addEventListener("click", () => {
        hideRejected = !hideRejected;
        toggleHideRejBtn.classList.toggle("is-active", hideRejected);
        toggleHideRejBtn.title = hideRejected ? "Click to show rejected photos" : "Click to hide rejected photos from view";
        toggleHideRejBtn.innerHTML = `<span class="toggle-reject-icon">&times;</span> ${hideRejected ? "Rejected Hidden" : "Hide Rejected"}`;
        renderGalleryContent();
      });
    }

    const emptyShowAll = container.querySelector("#empty-show-all-btn");
    if (emptyShowAll) emptyShowAll.addEventListener("click", () => setFilterMode("all"));

    async function handleSaveAgencyCloud(triggerBtn) {
      const origHtml = triggerBtn ? triggerBtn.innerHTML : "";
      if (triggerBtn) {
        triggerBtn.disabled = true;
        triggerBtn.textContent = "Saving to Cloud...";
      }
      agencyMeta = {
        ...agencyMeta,
        savedAt: Date.now()
      };
      saveAgencyMeta(shoot.id, agencyMeta);
      const ok = await saveAgencySelectionsToCloud(shoot.id, agencySelectedMap, agencyItemNotes, agencyMeta);
      if (triggerBtn) {
        triggerBtn.disabled = false;
        triggerBtn.classList.add("is-saved");
        triggerBtn.innerHTML = ok ? `&#10003; Agency Shortlist Saved (${agencySelectedMap.size})` : origHtml;
      }
      updateUiCounters();
      showGalleryToast(ok
        ? `Agency Shortlist (${agencySelectedMap.size} picks) saved to Cloud ✓`
        : "Saved locally (Cloud sync failed — please retry)");
    }

    if (agencyControlsSaveBtn) agencyControlsSaveBtn.addEventListener("click", () => handleSaveAgencyCloud(agencyControlsSaveBtn));
    if (floatingAgencySave) floatingAgencySave.addEventListener("click", () => handleSaveAgencyCloud(floatingAgencySave));

    const clientNotifyInput = container.querySelector("#portal-client-notify-email");
    const clientNotifyBtn = container.querySelector("#portal-client-notify-save-btn");
    if (clientNotifyInput && clientNotifyBtn) {
      const handleSaveNotifyEmail = () => {
        const val = clientNotifyInput.value.trim();
        if (val && !isValidEmailAddress(val)) {
          showGalleryToast("Please enter a valid e-mail address.");
          clientNotifyInput.focus();
          return;
        }
        saveClientNotifyEmail(shoot.id, val);
        autoSyncSelectionsToCloud(shoot.id);
        clientNotifyBtn.classList.toggle("is-saved", !!val);
        clientNotifyBtn.innerHTML = val ? "Saved &#10003;" : "Notify Me";
        showGalleryToast(val ? `We'll notify ${val} as soon as your final images are ready ✓` : "Notification e-mail cleared.");
      };
      clientNotifyBtn.addEventListener("click", handleSaveNotifyEmail);
      clientNotifyInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSaveNotifyEmail();
        }
      });
      clientNotifyInput.addEventListener("change", () => {
        const val = clientNotifyInput.value.trim();
        if (!val || isValidEmailAddress(val)) {
          saveClientNotifyEmail(shoot.id, val);
          autoSyncSelectionsToCloud(shoot.id);
          clientNotifyBtn.classList.toggle("is-saved", !!val);
          clientNotifyBtn.innerHTML = val ? "Saved &#10003;" : "Notify Me";
        }
      });
      clientNotifyInput.addEventListener("input", () => {
        const curSaved = loadClientNotifyEmail(shoot.id);
        const curTyped = clientNotifyInput.value.trim();
        if (curTyped !== curSaved) {
          clientNotifyBtn.classList.remove("is-saved");
          clientNotifyBtn.textContent = curTyped ? "Save E-mail" : "Notify Me";
        }
      });
    }

    // Bind Look Navigation Jump Pills
    container.querySelectorAll(".portal-look-nav-pill").forEach(pill => {
      pill.addEventListener("click", (e) => {
        e.preventDefault();
        const secId = pill.dataset.secId;
        const target = container.querySelector(`#look-anchor-${secId}`);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    // Delegate grid clicks
    if (sectionsContainer) {
      sectionsContainer.addEventListener("click", (e) => {
        // 0. Set as cover photo (Photographer mode)
        const coverBtn = e.target.closest(".portal-card-cover-btn");
        if (coverBtn) {
          e.stopPropagation();
          const fn = coverBtn.dataset.filename;
          const imgObj = shoot.images ? shoot.images.find(img => img.filename === fn) : null;
          if (imgObj) {
            shoot.coverFilename = fn;
            const k = getBlobKeyForImage(imgObj);
            if (k) shoot.coverBlobKey = k;
            if (imgObj.src && !imgObj.src.startsWith("blob:")) shoot.coverImage = imgObj.src;
            saveCustomShoot(shoot);
            sectionsContainer.querySelectorAll(".portal-card-cover-btn").forEach(b => {
              const isMatch = b.dataset.filename === fn;
              b.classList.toggle("is-active-cover", isMatch);
              b.textContent = isMatch ? "★" : "☆";
              b.title = isMatch ? "Current gallery cover photo" : "Set as gallery cover photo";
            });
          }
          return;
        }

        // A. Reject selection click
        const rejectBtn = e.target.closest(".portal-reject-btn");
        if (rejectBtn) {
          e.stopPropagation();
          const fn = rejectBtn.dataset.filename;
          onToggleReject(fn);
          return;
        }

        // B1. Heart selection click (Client mode — / Top 10 favourites in TFP mode)
        const heartBtn = e.target.closest(".portal-select-heart");
        if (heartBtn) {
          e.stopPropagation();
          const fn = heartBtn.dataset.filename;
          const tone = heartBtn.dataset.tone || getImageActiveTone(fn, shoot);
          toggleSelect(fn, tone);
          return;
        }

        // B1b. TFP "Other Likes" checkmark click (Client mode)
        const likeBtn = e.target.closest(".portal-select-like");
        if (likeBtn) {
          e.stopPropagation();
          const fn = likeBtn.dataset.filename;
          const tone = likeBtn.dataset.tone || getImageActiveTone(fn, shoot);
          toggleTfpSelection(fn, tone, "like");
          return;
        }

        // B2. Agency Star selection click (Agency mode)
        const starBtn = e.target.closest(".portal-agency-star-btn");
        if (starBtn) {
          e.stopPropagation();
          const fn = starBtn.dataset.filename;
          const tone = starBtn.dataset.tone || getImageActiveTone(fn, shoot);
          toggleAgencySelect(fn, tone);
          return;
        }

        // C. Slide-out Note button click -> opens Quick Note Modal!
        const noteSlideBtn = e.target.closest(".portal-note-slide-btn");
        if (noteSlideBtn) {
          e.stopPropagation();
          const fn = noteSlideBtn.dataset.filename;
          openNoteModal(fn);
          return;
        }

        // D. Card tone switcher button click in footer
        const toneBtn = e.target.closest(".card-tone-btn");
        if (toneBtn) {
          e.stopPropagation();
          const pill = toneBtn.closest(".portal-card-tone-pill");
          if (pill) {
            const fn = pill.dataset.filename;
            const tone = toneBtn.dataset.tone;
            setItemTone(fn, tone);
          }
          return;
        }

        // E. Card click -> open fullscreen lightbox
        const card = e.target.closest(".portal-proof-card");
        if (card) {
          const fn = card.dataset.filename;
          const currentTone = getImageActiveTone(fn, shoot);
          if (typeof window.openLightboxWithSelection === "function") {
            let visibleList = null;
            if (filterMode === "selected" || filterMode === "client-picks") {
              visibleList = shoot.images.filter(img => isFileSelected(img.filename));
            } else if (filterMode === "tfp-favs") {
              visibleList = shoot.images.filter(img => getFileSelectionTiers(img.filename).hasFavourite);
            } else if (filterMode === "tfp-likes") {
              visibleList = shoot.images.filter(img => getFileSelectionTiers(img.filename).hasLike);
            } else if (filterMode === "agency-picks") {
              visibleList = shoot.images.filter(img => isFileAgencySelected(img.filename));
            } else if (filterMode === "matched") {
              visibleList = shoot.images.filter(img => isFileSelected(img.filename) && isFileAgencySelected(img.filename));
            } else if (filterMode === "rejected") {
              visibleList = shoot.images.filter(img => isImageRejected(img.filename));
            } else if (!isAgency && hideRejected) {
              visibleList = shoot.images.filter(img => !isImageRejected(img.filename));
            } else {
              visibleList = [...(shoot.images || [])];
            }
            if (visibleList) visibleList.sort(naturalSortFilenames);

            if (isAgency) {
              window.openLightboxWithSelection(
                shoot,
                fn,
                currentTone,
                setItemTone,
                toggleAgencySelect,
                agencySelectedMap,
                isAgencyToneSelected,
                getAgencyImageNote,
                (fileName, note) => {
                  setAgencyImageNote(fileName, note);
                  updateCardNoteButton(fileName);
                  autoSyncAgencyToCloud(shoot.id);
                },
                (fileName, onSave) => {
                  openNoteModal(fileName, onSave);
                },
                (fileName) => getImageActiveTone(fileName, shoot),
                visibleList,
                null,
                () => false
              );
            } else {
              const tfpLightboxOptions = isTfp ? {
                isTfp: true,
                favLimit: tfpFavLimit,
                getSelectionTier: (f, t) => getSelectionTier(f, t, selectedMap),
                toggleLike: (f, t) => toggleTfpSelection(f, t, "like"),
                getTfpCounts: () => getTfpCounts(selectedMap)
              } : null;
              window.openLightboxWithSelection(
                shoot, 
                fn, 
                currentTone, 
                setItemTone, 
                toggleSelect, 
                selectedMap, 
                isToneSelected,
                getImageNote,
                (fileName, note) => {
                  setImageNote(fileName, note);
                  updateCardNoteButton(fileName);
                },
                (fileName, onSave) => {
                  openNoteModal(fileName, onSave);
                },
                (fileName) => getImageActiveTone(fileName, shoot),
                visibleList,
                onToggleReject,
                isImageRejected,
                tfpLightboxOptions
              );
            }
          } else {
            if (isAgency) toggleAgencySelect(fn, currentTone);
            else toggleSelect(fn, currentTone);
          }
        }
      });
    }

    // Review Navigation
    if (openReviewBtn) {
      openReviewBtn.addEventListener("click", () => {
        location.hash = buildPortalRouteHash(`${shoot.id}/review`);
      });
    }
    if (floatingReview) {
      floatingReview.addEventListener("click", () => {
        location.hash = buildPortalRouteHash(`${shoot.id}/review`);
      });
    }
  }

  /* ---------------------------------------------------------
     3. Dedicated Review & Export Selections Page
     --------------------------------------------------------- */
  function renderReviewCardHtml(item) {
    const note = getImageNote(item.filename);
    const key = item.id || makeKey(item.filename, item.tone);
    const toneLabel = getToneLabel(item.tone);

    // Dynamically resolve image source from active shoot
    const shoot = activeShootId ? getShootById(activeShootId) : null;
    const isTfp = !!(shoot && shoot.isTfp);
    const tfpFavLimit = isTfp ? getTfpFavLimit(shoot) : DEFAULT_TFP_FAV_LIMIT;
    const itemTier = item.tier === "like" ? "like" : "favourite";
    const imgObj = shoot && shoot.images ? shoot.images.find(i => i.filename === item.filename) : null;
    let resolvedSrc = (imgObj ? resolveImageSrc(imgObj, item.tone) : "") || item.src || "";

    // If resolvedSrc is empty or starts with blobKey:, fallback to local test proof path
    if (!resolvedSrc || resolvedSrc.startsWith("blobKey:")) {
      const toneSub = (item.tone && (item.tone.includes("faded") || item.tone === "faded-bw")) 
        ? "faded-bw" 
        : ((item.tone && (item.tone.includes("bw") || item.tone.includes("bnw"))) ? "bw" : "colour");
      resolvedSrc = `proofs/test-client/${toneSub}/${item.filename}`;
    }

    const blobKey = (imgObj && imgObj.versions && imgObj.versions[item.tone] && String(imgObj.versions[item.tone]).startsWith("blobKey:"))
      ? String(imgObj.versions[item.tone]).replace("blobKey:", "")
      : (imgObj ? imgObj.blobKey : "");

    return `
      <div class="portal-review-card" data-key="${key}" data-filename="${item.filename}" data-tone="${item.tone}" data-tier="${itemTier}">
        <div class="portal-review-img-wrap" data-filename="${item.filename}" data-tone="${item.tone}">
          <img 
            src="${resolvedSrc}" 
            alt="${item.filename} (${toneLabel})" 
            class="portal-review-img" 
            data-filename="${item.filename}"
            data-tone="${item.tone}"
            ${blobKey ? `data-blob-key="${blobKey}"` : ""}
            loading="lazy"
            decoding="async"
            onerror="if (this.src && !this.src.includes('proofs/test-client')) { this.src = 'proofs/test-client/' + (this.dataset.tone && (this.dataset.tone.includes('bw') || this.dataset.tone.includes('bnw')) ? 'bw' : (this.dataset.tone && this.dataset.tone.includes('faded') ? 'faded-bw' : 'colour')) + '/' + this.dataset.filename; }"
          >
          ${isTfp ? `
            <span class="portal-review-tfp-tier-badge ${itemTier === "like" ? "is-like" : "is-fav"}">${itemTier === "like" ? "&#10003; Liked" : `&#9829; Top ${tfpFavLimit}`}</span>
          ` : ""}
          <span class="portal-review-tone-badge ${item.tone}">${toneLabel}</span>
          <button 
            type="button" 
            class="portal-review-remove-btn" 
            data-key="${key}" 
            data-filename="${item.filename}" 
            data-tone="${item.tone}" 
            title="Remove this version" 
            aria-label="Remove"
          >&times;</button>
        </div>
        <div class="portal-review-card-footer">
          <div class="portal-review-card-meta">
            <span class="portal-review-card-fn">${item.filename}</span>
            <span class="portal-review-card-tone">${toneLabel}</span>
          </div>
          <div class="portal-review-card-note-row">
            ${note ? `
              <div class="portal-review-note-pill">
                <span class="review-note-text" title="${note}">&#9998; Note: "${note}"</span>
                <button type="button" class="portal-review-edit-note-btn" data-filename="${item.filename}">edit</button>
              </div>
            ` : `
              <button type="button" class="portal-review-add-note-btn" data-filename="${item.filename}">
                + add editing note
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function renderGroupedReviewSectionsHtml(shoot, selectedList) {
    selectedList.sort(naturalSortFilenames);
    const sectionGroups = [];
    (shoot.sections || []).forEach(sec => {
      const secFilenames = new Set((sec.images || []).map(i => i.filename));
      const itemsInSec = selectedList.filter(item => secFilenames.has(item.filename));
      itemsInSec.sort(naturalSortFilenames);
      if (itemsInSec.length > 0) {
        sectionGroups.push({
          id: sec.id,
          title: sec.title,
          description: sec.description || "",
          tonesNote: sec.tonesNote || "",
          items: itemsInSec
        });
      }
    });

    const groupedKeys = new Set();
    sectionGroups.forEach(g => g.items.forEach(it => groupedKeys.add(it.id || makeKey(it.filename, it.tone))));
    const unassigned = selectedList.filter(it => !groupedKeys.has(it.id || makeKey(it.filename, it.tone)));
    unassigned.sort(naturalSortFilenames);
    if (unassigned.length > 0) {
      sectionGroups.push({
        id: "other",
        title: "Additional Selections",
        tonesNote: "",
        items: unassigned
      });
    }

    return sectionGroups.map((group, gIdx) => `
      <div class="portal-review-section-block" id="review-sec-${group.id}">
        <div class="portal-review-section-header">
          <div class="portal-review-section-title-wrap">
            <span class="portal-review-section-kicker">LOOK 0${gIdx + 1}</span>
            <h3 class="portal-review-section-title">${group.title}</h3>
            ${group.tonesNote ? `<span class="portal-review-section-sub">${group.tonesNote}</span>` : ""}
          </div>
          <span class="portal-review-section-count">${group.items.length} ${group.items.length === 1 ? "Selection" : "Selections"}</span>
        </div>
        <div class="portal-review-grid">
          ${group.items.map(item => renderReviewCardHtml(item)).join("")}
        </div>
      </div>
    `).join("");
  }

  function renderTfpReviewSectionsHtml(shoot, selectedList) {
    const tfpLimit = getTfpFavLimit(shoot);
    const favList = selectedList.filter(it => it.tier !== "like");
    const likeList = selectedList.filter(it => it.tier === "like");
    const hasMultipleLooks = shoot.sections && shoot.sections.length > 1;
    const renderBucket = (items, emptyText) => {
      if (!items.length) {
        return `<div class="portal-review-tfp-empty">${emptyText}</div>`;
      }
      if (hasMultipleLooks) {
        return `<div class="portal-review-sections-wrap">${renderGroupedReviewSectionsHtml(shoot, items)}</div>`;
      }
      return `<div class="portal-review-grid">${items.map(item => renderReviewCardHtml(item)).join("")}</div>`;
    };

    return `
      <div class="portal-review-tfp-group" id="review-tfp-favs-group">
        <div class="portal-review-tfp-group-header">
          <h2 class="portal-review-tfp-group-title">
            <span class="portal-tfp-icon-badge is-fav" aria-hidden="true">&#9829;</span>
            Absolute Favourites &mdash; Definitely Edit
          </h2>
          <span class="portal-review-tfp-group-count" id="review-tfp-favs-count">${favList.length} / ${tfpLimit}</span>
        </div>
        ${renderBucket(favList, `No Top ${tfpLimit} favourites marked yet. Return to the gallery and tap the heart (\u2665) on your top ${tfpLimit} photos.`)}
      </div>

      <div class="portal-review-tfp-group" id="review-tfp-likes-group">
        <div class="portal-review-tfp-group-header">
          <h2 class="portal-review-tfp-group-title">
            <span class="portal-tfp-icon-badge is-like" aria-hidden="true">&#10003;</span>
            Other Liked Images &mdash; Pick Best From
          </h2>
          <span class="portal-review-tfp-group-count" id="review-tfp-likes-count">${likeList.length} ${likeList.length === 1 ? "Image" : "Images"}</span>
        </div>
        ${renderBucket(likeList, "No other likes selected. You can tap the tick (\u2713) on any extra images you'd like me to consider.")}
      </div>
    `;
  }

  function renderShootReviewPage(container, shoot) {
    selectedMap = loadSelections(shoot.id);
    const selectedList = Array.from(selectedMap.values());
    selectedList.sort(naturalSortFilenames);
    const submissionStatus = loadSubmissionStatus(shoot.id);
    const isSubmitted = submissionStatus && submissionStatus.submitted;
    const savedGeneralNotes = loadGeneralNotes(shoot.id);
    const isTfp = !!shoot.isTfp;
    const tfpFavLimit = getTfpFavLimit(shoot);
    const selectionSummary = formatShootSelectionSummary(shoot, selectedMap);

    container.innerHTML = `
      <div class="portal-review-page-wrap">
        <!-- Top Nav & Back Link -->
        <div class="portal-review-nav">
          <button type="button" class="portal-back-btn" id="review-back-btn">
            &larr; Back to Proofs Gallery
          </button>
          <div class="portal-review-quota-pill ${isSubmitted ? "is-submitted" : ""}" id="review-quota-pill">
            <span class="portal-status-dot"></span>
            <span id="review-quota-text">${isSubmitted ? `Saved &middot; ${selectionSummary}` : selectionSummary}</span>
          </div>
        </div>

        <!-- Monograph Editorial Header -->
        <header class="portal-review-header">
          <div class="portal-header-meta">
            <span>${shoot.clientName}</span>
            <span class="portal-meta-sep">&middot;</span>
            <span>${shoot.shootTitle}</span>
            <span class="portal-meta-sep">&middot;</span>
            <span>${isTfp ? "TFP Selections Review" : "Final Selections Review"}</span>
          </div>
          <h1 class="portal-review-title">selected proofs</h1>
          <p class="portal-review-subtitle">
            ${selectedList.length === 0 
              ? "You haven't selected any photos yet." 
              : (isTfp
                  ? `Review your top ${tfpFavLimit} favourites (\u2665) to definitely edit and your other liked images (\u2713) below.`
                  : `Review your ${selectedList.length} deliverable variations below. Each chosen version (Colour, Black & White, or Faded B&W) is displayed as an individual image so you can review your exact deliverable files.`)}
          </p>
        </header>

        ${isTfp ? renderTfpGuideBannerHtml(shoot) : renderExtraEditsBannerHtml()}

        ${selectedList.length === 0 ? `
          <div class="portal-empty-state">
            <p class="portal-empty-title">No selections chosen yet.</p>
            <p class="portal-empty-desc">${isTfp
              ? `Return to your proofs gallery and tap \u2665 for your top ${tfpFavLimit} favourites or \u2713 for any other images you like.`
              : "Return to your proofs gallery and tap the heart icon on any photo to add it to your shortlist."}</p>
            <button type="button" class="portal-enter-btn" id="empty-return-gallery-btn">Return to Proofs Gallery &rarr;</button>
          </div>
        ` : `
          ${isTfp ? `
            <div class="portal-review-sections-wrap" id="portal-review-grid">
              ${renderTfpReviewSectionsHtml(shoot, selectedList)}
            </div>
          ` : ((shoot.sections && shoot.sections.length > 1) ? `
            <!-- Visual Grid Grouped by Shoot Section / Look -->
            <div class="portal-review-sections-wrap">
              ${renderGroupedReviewSectionsHtml(shoot, selectedList)}
            </div>
          ` : `
            <!-- Flat Visual Grid of Individual Selected Variations -->
            <div class="portal-review-grid" id="portal-review-grid">
              ${selectedList.map(item => renderReviewCardHtml(item)).join("")}
            </div>
          `)}

          <!-- Summary & Save Selections Section -->
          <div class="portal-review-save-section">
            <div class="portal-save-card">
              <div class="portal-save-card-header">
                <h2 class="portal-save-title">Save Client Selections</h2>
                <p class="portal-save-desc">
                  Save your chosen proof variations and editing notes. Once saved, Koray will review your selections and begin final retouching.
                </p>
                <div class="portal-save-quota-pill" id="portal-save-quota-summary">
                  ${selectionSummary}
                </div>
              </div>

              <!-- Clear & Visible Banner for Clients to Update Selections -->
              <div class="portal-modify-banner">
                <div class="portal-modify-text-wrap">
                  <strong class="portal-modify-heading">Changed your mind or want to choose more?</strong>
                  <p class="portal-modify-copy">
                    You can adjust your picks anytime before final delivery. Tap below to return to your gallery to add or swap images, or remove photos directly above, then tap <strong>"Update Saved Selections"</strong>.
                  </p>
                </div>
                <button type="button" class="portal-modify-btn" id="review-modify-gallery-btn">
                  &larr; Return to Gallery to Change Picks
                </button>
              </div>

              <!-- Overall Session Notes -->
              <div class="portal-notes-group">
                <label for="review-client-notes-input" class="portal-input-label">Overall Session Notes & Retouching Requests (Optional)</label>
                <textarea 
                  id="review-client-notes-input" 
                  class="portal-notes-textarea" 
                  placeholder="Any general comments, delivery deadline, or special instructions..."
                  rows="3"
                >${savedGeneralNotes}</textarea>
              </div>

              <!-- Save Action Row -->
              <div class="portal-save-action-row">
                <button type="button" class="portal-save-selections-btn ${isSubmitted ? "is-saved" : ""}" id="save-selections-btn">
                  ${isSubmitted ? `&#10003; Update Saved Selections (${selectedList.length})` : `Save Client Selections (${selectedList.length}) &rarr;`}
                </button>
              </div>

              <!-- Save Confirmation Box with 3-4 Weeks Timeline & Update Reassurance -->
              <div class="portal-save-confirm-box" id="save-confirm-box" style="${isSubmitted ? "display: flex;" : "display: none;"}">
                <span class="portal-confirm-icon">&#10003;</span>
                <div class="portal-confirm-content">
                  <strong class="portal-confirm-title">Selections Saved Successfully</strong>
                  <p class="portal-confirm-text">
                    Your ${selectedList.length} selections and editing notes have been saved directly to Koray.
                  </p>

                  <!-- 3-4 Weeks Delivery Notice -->
                  <div class="portal-delivery-timeline-card">
                    <span class="portal-timeline-icon">&#9201;</span>
                    <div class="portal-timeline-content">
                      <strong class="portal-timeline-title">Estimated Delivery Timeline</strong>
                      <p class="portal-timeline-desc">
                        You should receive your final edits in the next <strong>3&ndash;4 weeks</strong> from when you've made your selection.
                      </p>
                    </div>
                  </div>

                  <!-- Change Mind / Update Reassurance -->
                  <div class="portal-modify-hint-card">
                    <span class="portal-hint-icon">&#8635;</span>
                    <div class="portal-hint-content">
                      <strong class="portal-hint-title">Need to update your picks?</strong>
                      <p class="portal-hint-desc">
                        You can adjust your photos or notes anytime before retouching starts. Return to the gallery or modify photos above, then click <strong>"Update Saved Selections"</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `}

        <!-- Note Modal (reused) -->
        <div class="portal-quick-note-modal" id="portal-quick-note-modal" style="display: none;">
          <div class="portal-quick-note-box">
            <div class="portal-quick-note-header">
              <span class="portal-quick-note-title" id="quick-note-title">Editing Note</span>
              <button type="button" class="portal-quick-note-close" id="quick-note-close">&times;</button>
            </div>
            <textarea 
              id="quick-note-textarea" 
              class="portal-quick-note-input" 
              rows="3" 
              placeholder="e.g. skin retouch, crop closer, remove flyaways..."
            ></textarea>
            <div class="portal-quick-note-actions">
              <button type="button" class="portal-quick-note-clear" id="quick-note-clear">Delete Note</button>
              <button type="button" class="portal-quick-note-save" id="quick-note-save">Save Note</button>
            </div>
          </div>
        </div>
      </div>
    `;

    bindReviewPageEvents(container, shoot);
  }

  function bindReviewPageEvents(container, shoot) {
    const returnToGallery = (e) => {
      if (e) e.preventDefault();
      portalViewMode = "client";
      const targetHash = buildPortalRouteHash(shoot.id);
      if (typeof window !== "undefined") {
        if (window.history && window.history.replaceState) {
          const cleanUrl = window.location.pathname + targetHash;
          window.history.replaceState(null, "", cleanUrl);
        } else {
          window.location.hash = targetHash;
        }
      }
      renderShootGallery(container, shoot);
    };

    const backBtn = container.querySelector("#review-back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", returnToGallery);
    }

    const modifyGalleryBtn = container.querySelector("#review-modify-gallery-btn");
    if (modifyGalleryBtn) {
      modifyGalleryBtn.addEventListener("click", returnToGallery);
    }

    const emptyBtn = container.querySelector("#empty-return-gallery-btn");
    if (emptyBtn) {
      emptyBtn.addEventListener("click", returnToGallery);
    }

    let noteModal = container.querySelector("#portal-quick-note-modal");
    if (noteModal && noteModal.parentNode !== document.body) {
      document.body.appendChild(noteModal);
    }
    const noteTitle = noteModal ? noteModal.querySelector("#quick-note-title") : null;
    const noteTextarea = noteModal ? noteModal.querySelector("#quick-note-textarea") : null;
    const noteClose = noteModal ? noteModal.querySelector("#quick-note-close") : null;
    const noteSave = noteModal ? noteModal.querySelector("#quick-note-save") : null;
    const noteClear = noteModal ? noteModal.querySelector("#quick-note-clear") : null;

    let onNoteSaved = null;

    function openNote(filename, cb) {
      noteModalFilename = filename;
      onNoteSaved = cb || null;
      if (noteTitle) noteTitle.textContent = `Editing Note · ${filename}`;
      if (noteTextarea) noteTextarea.value = getImageNote(filename);
      if (noteModal) {
        if (noteModal.parentNode !== document.body) document.body.appendChild(noteModal);
        noteModal.style.display = "flex";
      }
      if (noteTextarea) {
        setTimeout(() => noteTextarea.focus(), 80);
      }
    }

    function closeNote() {
      if (noteTextarea) noteTextarea.blur();
      noteModalFilename = null;
      onNoteSaved = null;
      if (noteModal) noteModal.style.display = "none";
    }

    if (noteClose) {
      noteClose.addEventListener("click", closeNote);
      noteClose.addEventListener("touchend", (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeNote();
      });
    }

    if (noteModal) {
      noteModal.addEventListener("click", (e) => {
        if (e.target === noteModal) closeNote();
      });
    }

    if (noteSave) {
      noteSave.addEventListener("click", () => {
        if (!noteModalFilename) return;
        const val = noteTextarea ? noteTextarea.value : "";
        setImageNote(noteModalFilename, val);
        const cb = onNoteSaved;
        closeNote();
        if (cb) cb();
      });
    }

    if (noteClear) {
      noteClear.addEventListener("click", () => {
        if (!noteModalFilename) return;
        setImageNote(noteModalFilename, "");
        const cb = onNoteSaved;
        closeNote();
        if (cb) cb();
      });
    }

    // Review Grids Delegation (supports both multi-look .portal-review-sections-wrap and single-look #portal-review-grid)
    const isTfp = !!shoot.isTfp;
    const tfpFavLimit = getTfpFavLimit(shoot);

    function toggleReviewSelection(fileName, selTone, targetTier) {
      const k = makeKey(fileName, selTone);
      if (isTfp) {
        const tier = targetTier === "like" ? "like" : "favourite";
        const existing = selectedMap.get(k);
        const existingTier = existing ? (existing.tier === "like" ? "like" : "favourite") : null;
        if (existingTier === tier) {
          selectedMap.delete(k);
        } else {
          if (tier === "favourite" && getTfpCounts(selectedMap).favourites >= tfpFavLimit) {
            alert(`All ${tfpFavLimit} favourites used. Unheart one photo first or tap the tick (\u2713) for other likes.`);
            return;
          }
          const imgObj = shoot.images ? shoot.images.find(i => i.filename === fileName) : null;
          selectedMap.set(k, {
            id: k,
            filename: fileName,
            tone: selTone,
            tier: tier,
            src: imgObj ? resolveImageSrc(imgObj, selTone) : ""
          });
        }
        saveSelections(shoot.id, selectedMap);
        const gridWrap = container.querySelector("#portal-review-grid");
        if (gridWrap) {
          const updatedList = Array.from(selectedMap.values()).sort(naturalSortFilenames);
          if (updatedList.length > 0) {
            gridWrap.innerHTML = renderTfpReviewSectionsHtml(shoot, updatedList);
          }
        }
        updateReviewPageCounters();
        return;
      }

      if (selectedMap.has(k)) selectedMap.delete(k);
      else {
        const imgObj = shoot.images ? shoot.images.find(i => i.filename === fileName) : null;
        selectedMap.set(k, {
          id: k,
          filename: fileName,
          tone: selTone,
          src: imgObj ? resolveImageSrc(imgObj, selTone) : ""
        });
      }
      saveSelections(shoot.id, selectedMap);
      autoSyncSelectionsToCloud(shoot.id);
    }

    const reviewRoot = container.querySelector(".portal-review-page-wrap") || container;
    if (reviewRoot) {
      reviewRoot.addEventListener("click", (e) => {
        // A. Remove button click
        const removeBtn = e.target.closest(".portal-review-remove-btn");
        if (removeBtn) {
          e.stopPropagation();
          const fn = removeBtn.dataset.filename;
          const tone = removeBtn.dataset.tone;
          const key = removeBtn.dataset.key || makeKey(fn, tone);

          selectedMap.delete(key);
          saveSelections(shoot.id, selectedMap);

          const card = removeBtn.closest(".portal-review-card");
          if (card) {
            const secBlock = card.closest(".portal-review-section-block");
            card.style.transition = "transform 0.25s var(--ease), opacity 0.25s var(--ease)";
            card.style.transform = "scale(0.85)";
            card.style.opacity = "0";
            setTimeout(() => {
              card.remove();
              if (secBlock) {
                const remainingCount = secBlock.querySelectorAll(".portal-review-card").length;
                if (remainingCount === 0) {
                  secBlock.remove();
                } else {
                  const countEl = secBlock.querySelector(".portal-review-section-count");
                  if (countEl) {
                    countEl.textContent = `${remainingCount} ${remainingCount === 1 ? "Selection" : "Selections"}`;
                  }
                }
              }
              updateReviewPageCounters();
            }, 250);
          }
          return;
        }

        // B. Edit note button
        const editNoteBtn = e.target.closest(".portal-review-edit-note-btn") || e.target.closest(".portal-review-add-note-btn");
        if (editNoteBtn) {
          e.stopPropagation();
          const fn = editNoteBtn.dataset.filename;
          openNote(fn, () => {
            renderShootReviewPage(container, shoot);
          });
          return;
        }

        // C. Card Image click -> open fullscreen viewer
        const imgWrap = e.target.closest(".portal-review-img-wrap");
        if (imgWrap && !e.target.closest(".portal-review-remove-btn")) {
          const fn = imgWrap.dataset.filename;
          const tone = imgWrap.dataset.tone || "colour";
          const currentReviewList = Array.from(reviewRoot.querySelectorAll(".portal-review-card")).map(card => {
            const cKey = card.dataset.key;
            const cFn = card.dataset.filename;
            const cTone = card.dataset.tone || "colour";
            const existing = (cKey && selectedMap.get(cKey)) || selectedMap.get(makeKey(cFn, cTone));
            if (existing) return existing;
            const imgObj = shoot.images ? shoot.images.find(i => i.filename === cFn) : null;
            return {
              id: cKey || makeKey(cFn, cTone),
              filename: cFn,
              tone: cTone,
              src: imgObj ? resolveImageSrc(imgObj, cTone) : ""
            };
          });
          if (typeof window.openLightboxWithSelection === "function") {
            const tfpReviewOpts = isTfp ? {
              isTfp: true,
              favLimit: tfpFavLimit,
              getSelectionTier: (f, t) => getSelectionTier(f, t, selectedMap),
              toggleLike: (f, t) => toggleReviewSelection(f, t, "like"),
              getTfpCounts: () => getTfpCounts(selectedMap)
            } : null;
            window.openLightboxWithSelection(
              shoot,
              fn,
              tone,
              (fileName, newTone) => {
                itemTones[fileName] = newTone;
              },
              (fileName, selTone) => toggleReviewSelection(fileName, selTone, "favourite"),
              selectedMap,
              isToneSelected,
              getImageNote,
              setImageNote,
              (fileName, onSave) => openNote(fileName, onSave),
              (fileName) => getImageActiveTone(fileName, shoot),
              currentReviewList,
              null,
              () => false,
              tfpReviewOpts
            );
          }
        }
      });
    }

    function updateReviewPageCounters() {
      const selectedList = Array.from(selectedMap.values());
      const currentStatus = loadSubmissionStatus(shoot.id);
      const isSub = currentStatus && currentStatus.submitted;
      const quotaSummaryText = formatShootSelectionSummary(shoot, selectedMap);

      const quotaPill = container.querySelector("#review-quota-pill");
      const quotaText = container.querySelector("#review-quota-text");
      if (quotaPill) quotaPill.classList.toggle("is-submitted", !!isSub);
      if (quotaText) quotaText.textContent = isSub ? `Saved \u00b7 ${quotaSummaryText}` : quotaSummaryText;

      const saveQuotaSummary = container.querySelector("#portal-save-quota-summary");
      if (saveQuotaSummary) saveQuotaSummary.textContent = quotaSummaryText;

      if (isTfp) {
        const tfpC = getTfpCounts(selectedMap);
        const favCountEl = container.querySelector("#review-tfp-favs-count");
        const likeCountEl = container.querySelector("#review-tfp-likes-count");
        if (favCountEl) favCountEl.textContent = `${tfpC.favourites} / ${tfpFavLimit}`;
        if (likeCountEl) likeCountEl.textContent = `${tfpC.likes} ${tfpC.likes === 1 ? "Image" : "Images"}`;
      }

      const saveBtn = container.querySelector("#save-selections-btn");
      if (saveBtn) {
        if (isSub) {
          saveBtn.innerHTML = `&#10003; Update Saved Selections (${selectedList.length})`;
        } else {
          saveBtn.innerHTML = `Save Client Selections (${selectedList.length}) &rarr;`;
        }
      }

      if (isSub) {
        if (selectedList.length === 0) {
          saveSubmissionStatus(shoot.id, null);
        } else {
          saveSubmissionStatus(shoot.id, {
            ...currentStatus,
            count: selectedList.length
          });
        }
      }
      autoSyncSelectionsToCloud(shoot.id);

      if (selectedList.length === 0) {
        renderShootReviewPage(container, shoot);
      }
    }

    // Bind Save Selections
    const saveBtn = container.querySelector("#save-selections-btn");
    const confirmBox = container.querySelector("#save-confirm-box");
    const generalNotesInput = container.querySelector("#review-client-notes-input");

    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        if (selectedMap.size === 0) {
          alert("Please select at least one photo before saving.");
          return;
        }

        const wasSubmitted = !!(loadSubmissionStatus(shoot.id) && loadSubmissionStatus(shoot.id).submitted);
        const notesVal = generalNotesInput ? generalNotesInput.value.trim() : "";
        saveGeneralNotes(shoot.id, notesVal);

        saveSubmissionStatus(shoot.id, {
          submitted: true,
          savedAt: Date.now(),
          count: selectedMap.size
        });

        saveBtn.disabled = true;
        saveBtn.innerHTML = `Saving to Cloud...`;

        // Save to Firebase Cloud + Notify Koray by email
        const [cloudSaved] = await Promise.all([
          saveSelectionsToCloud(shoot.id, selectedMap, itemNotes, notesVal, true),
          sendClientSelectionsEmailAlert(shoot, selectedMap, itemNotes, notesVal, wasSubmitted)
        ]);

        saveBtn.disabled = false;
        saveBtn.classList.add("is-saved");
        saveBtn.innerHTML = `&#10003; Update Saved Selections (${selectedMap.size})`;

        const quotaPill = container.querySelector("#review-quota-pill");
        const quotaText = container.querySelector("#review-quota-text");
        if (quotaPill) quotaPill.classList.add("is-submitted");
        if (quotaText) quotaText.textContent = `Saved \u00b7 ${formatShootSelectionSummary(shoot, selectedMap)}`;

        if (confirmBox) {
          confirmBox.style.display = "flex";
          const confirmText = confirmBox.querySelector(".portal-confirm-text");
          if (confirmText) {
            confirmText.innerHTML = `Your ${selectedMap.size} selections (${formatShootSelectionSummary(shoot, selectedMap)}) and editing notes have been sent directly to Koray.`;
          }
          confirmBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    }
  }

  // Refresh review page if lightbox was opened from review
  window.onReviewLightboxClosed = function() {
    if (activeShootId && typeof window !== "undefined" && window.location.hash.includes("/review")) {
      const shoot = getShootById(activeShootId);
      const container = document.querySelector("#main-content") || document.querySelector("main");
      if (shoot && container) {
        selectedMap = loadSelections(shoot.id);
        itemNotes = loadNotes(shoot.id);
        renderShootReviewPage(container, shoot);
      }
    }
  };

  // Auto-sync custom client galleries from Firebase Cloud on startup
  if (typeof window !== "undefined") {
    setTimeout(() => {
      syncAllCustomGalleriesFromCloud().catch(() => {});
    }, 100);

    window.addEventListener("kh_headers_updated", (e) => {
      const resolved = window.resolveCanonicalRoute ? window.resolveCanonicalRoute(location.hash) : null;
      const rawSlug = (location.hash || "").replace(/^#\/?/, "").split("/")[0];
      const slug = resolved ? resolved.canonicalBase : rawSlug;
      if (slug === "client-portal") {
        const subPath = resolved ? resolved.subPath : "";
        if (!subPath && typeof window.updateLiveHeroBannerInDOM === "function") {
          let data = (e && e.detail && e.detail["client-portal"]) || (window._KH_HEADERS && window._KH_HEADERS["client-portal"]);
          if (!data) {
            try {
              const raw = localStorage.getItem("kh_header_client-portal");
              if (raw) data = JSON.parse(raw);
            } catch(err) {}
          }
          if (data) {
            window.updateLiveHeroBannerInDOM("client-portal", data);
          }
        }
        const liveBanner = document.querySelector("#portal-extra-edits-banner");
        const H = getClientPortalHeaderConfig();
        if (liveBanner) {
          if (H.extraEditsBannerEnabled === false || !(H.extraEditsBannerText || "").trim()) {
            liveBanner.style.display = "none";
          } else {
            liveBanner.style.display = "";
            const badge = liveBanner.querySelector(".portal-extra-edits-badge");
            const copy = liveBanner.querySelector(".portal-extra-edits-copy");
            if (badge) badge.textContent = (H.extraEditsBannerTag || "Extra Retouched Edits").trim();
            if (copy) copy.textContent = H.extraEditsBannerText.trim();
          }
        }
      }
    });
  }

  /* ---------------------------------------------------------
     4. Design 1: Monograph Exhibition Final Delivery Suite
        (Powered by Google Drive + In-Browser .ZIP & Camera Roll)
     --------------------------------------------------------- */
  function extractDriveFolderId(rawInput) {
    if (!rawInput) return "";
    const str = String(rawInput).trim();
    const folderMatch = str.match(/\/folders\/([a-zA-Z0-9_-]+)/i);
    if (folderMatch && folderMatch[1]) return folderMatch[1];
    const idParamMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
    if (idParamMatch && idParamMatch[1]) return idParamMatch[1];
    if (/^[a-zA-Z0-9_-]{10,80}$/.test(str)) return str;
    return "";
  }

  const TEST_DELIVERY_SHOOT = {
    id: "test-delivery",
    code: "TESTDELIVERY",
    clientName: "final collection",
    shootTitle: "Editorial Studio Delivery (Live Google Drive Test)",
    shootDate: "November 2026",
    location: "London, England",
    deliveryReady: true,
    deliveryDriveUrl: "https://drive.google.com/open?id=1l1np3KABqRjGJRuuDgepC9ZBiVsx0KJw&usp=drive_fs",
    deliveryFolderId: "1l1np3KABqRjGJRuuDgepC9ZBiVsx0KJw"
  };

  const deliveryCatalogCache = {};

  const CRC32_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c >>> 0;
    }
    return table;
  })();

  function computeCrc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function writeUint64LE(view, byteOffset, value) {
    const v = Number(value) || 0;
    const low = v >>> 0;
    const high = Math.floor(v / 4294967296) >>> 0;
    view.setUint32(byteOffset, low, true);
    view.setUint32(byteOffset + 4, high, true);
  }

  function formatTransferBytes(bytes) {
    const b = Number(bytes) || 0;
    if (b >= 1024 * 1024 * 1024) {
      return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    if (b >= 1024 * 1024) {
      return `${Math.round(b / (1024 * 1024))} MB`;
    }
    if (b >= 1024) {
      return `${Math.round(b / 1024)} KB`;
    }
    return `${b} B`;
  }

  function buildZipBlob(entries) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const now = new Date();
    const dosTime = ((now.getHours() & 0x1f) << 11) | ((now.getMinutes() & 0x3f) << 5) | ((now.getSeconds() >> 1) & 0x1f);
    const dosDate = (((Math.max(1980, now.getFullYear()) - 1980) & 0x7f) << 9) | (((now.getMonth() + 1) & 0x0f) << 5) | (now.getDate() & 0x1f);

    entries.forEach(entry => {
      const nameBytes = encoder.encode(entry.path);
      let payload = entry.blob || null;
      let crc = entry.crc;
      let size = entry.size;

      if (!payload && entry.bytes) {
        const dataBytes = entry.bytes instanceof Uint8Array ? entry.bytes : new Uint8Array(entry.bytes);
        if (crc === undefined) crc = computeCrc32(dataBytes);
        size = dataBytes.length;
        payload = dataBytes;
      } else if (payload) {
        size = Number(size !== undefined ? size : payload.size) || 0;
        crc = Number(crc || 0) >>> 0;
      } else {
        payload = new Uint8Array(0);
        crc = 0;
        size = 0;
      }

      const sizeOverflow = size >= 0xffffffff;
      const offsetOverflow = offset >= 0xffffffff;
      const useZip64Entry = sizeOverflow || offsetOverflow;

      // Local File Header (30 bytes + name)
      const localExtraLen = sizeOverflow ? 20 : 0;
      const localHeader = new ArrayBuffer(30 + nameBytes.length + localExtraLen);
      const lv = new DataView(localHeader);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, useZip64Entry ? 45 : 20, true);
      lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
      lv.setUint16(8, 0, true); // STORE (uncompressed original file)
      lv.setUint16(10, dosTime, true);
      lv.setUint16(12, dosDate, true);
      lv.setUint32(14, crc >>> 0, true);
      lv.setUint32(18, sizeOverflow ? 0xffffffff : size, true);
      lv.setUint32(22, sizeOverflow ? 0xffffffff : size, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, localExtraLen, true);
      new Uint8Array(localHeader, 30, nameBytes.length).set(nameBytes);
      if (sizeOverflow) {
        const exOff = 30 + nameBytes.length;
        lv.setUint16(exOff, 0x0001, true);
        lv.setUint16(exOff + 2, 16, true);
        writeUint64LE(lv, exOff + 4, size);
        writeUint64LE(lv, exOff + 12, size);
      }

      localParts.push(localHeader, payload);

      // Central Directory Header (46 bytes + name + optional ZIP64 extra)
      const cdExtraDataLen = (sizeOverflow ? 16 : 0) + (offsetOverflow ? 8 : 0);
      const cdExtraLen = useZip64Entry ? (4 + cdExtraDataLen) : 0;
      const centralHeader = new ArrayBuffer(46 + nameBytes.length + cdExtraLen);
      const cv = new DataView(centralHeader);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, useZip64Entry ? 45 : 20, true);
      cv.setUint16(6, useZip64Entry ? 45 : 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, dosTime, true);
      cv.setUint16(14, dosDate, true);
      cv.setUint32(16, crc >>> 0, true);
      cv.setUint32(20, sizeOverflow ? 0xffffffff : size, true);
      cv.setUint32(24, sizeOverflow ? 0xffffffff : size, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, cdExtraLen, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offsetOverflow ? 0xffffffff : offset, true);
      new Uint8Array(centralHeader, 46, nameBytes.length).set(nameBytes);
      if (useZip64Entry) {
        let p = 46 + nameBytes.length;
        cv.setUint16(p, 0x0001, true);
        cv.setUint16(p + 2, cdExtraDataLen, true);
        p += 4;
        if (sizeOverflow) {
          writeUint64LE(cv, p, size);
          writeUint64LE(cv, p + 8, size);
          p += 16;
        }
        if (offsetOverflow) {
          writeUint64LE(cv, p, offset);
        }
      }

      centralParts.push(centralHeader);
      offset += localHeader.byteLength + size;
    });

    const centralSize = centralParts.reduce((s, p) => s + p.byteLength, 0);
    const needsZip64 = entries.length >= 0xffff || offset >= 0xffffffff || centralSize >= 0xffffffff;
    const footerParts = [...centralParts];

    if (needsZip64) {
      const zip64Eocd = new ArrayBuffer(56);
      const z64 = new DataView(zip64Eocd);
      z64.setUint32(0, 0x06064b50, true);
      writeUint64LE(z64, 4, 44);
      z64.setUint16(12, 45, true);
      z64.setUint16(14, 45, true);
      z64.setUint32(16, 0, true);
      z64.setUint32(20, 0, true);
      writeUint64LE(z64, 24, entries.length);
      writeUint64LE(z64, 32, entries.length);
      writeUint64LE(z64, 40, centralSize);
      writeUint64LE(z64, 48, offset);

      const zip64Locator = new ArrayBuffer(20);
      const loc = new DataView(zip64Locator);
      loc.setUint32(0, 0x07064b50, true);
      loc.setUint32(4, 0, true);
      writeUint64LE(loc, 8, offset + centralSize);
      loc.setUint32(16, 1, true);

      footerParts.push(zip64Eocd, zip64Locator);
    }

    const eocd = new ArrayBuffer(22);
    const ev = new DataView(eocd);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, entries.length >= 0xffff ? 0xffff : entries.length, true);
    ev.setUint16(10, entries.length >= 0xffff ? 0xffff : entries.length, true);
    ev.setUint32(12, centralSize >= 0xffffffff ? 0xffffffff : centralSize, true);
    ev.setUint32(16, offset >= 0xffffffff ? 0xffffffff : offset, true);
    ev.setUint16(20, 0, true);
    footerParts.push(eocd);

    return new Blob([...localParts, ...footerParts], { type: "application/zip" });
  }

  function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 1500);
  }

  function supportsNativePhotoShare() {
    try {
      if (typeof navigator === "undefined" || typeof navigator.canShare !== "function" || typeof File === "undefined") {
        return false;
      }
      const probe = new File([new Uint8Array([1])], "probe.jpg", { type: "image/jpeg" });
      return navigator.canShare({ files: [probe] });
    } catch (e) {
      return false;
    }
  }

  async function fetchDeliveryFilesInBatches(items, onProgress) {
    const results = new Array(items.length);
    const CONCURRENCY = 3;
    let nextIdx = 0;
    let completed = 0;
    let totalBytesLoaded = 0;
    let lastProgressReport = 0;

    const emitProgress = (force) => {
      if (!onProgress) return;
      const now = Date.now();
      if (force || now - lastProgressReport >= 140) {
        lastProgressReport = now;
        onProgress(completed, items.length, totalBytesLoaded);
      }
    };

    async function fetchOneItem(item) {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ctype = res.headers.get("content-type") || "image/jpeg";
      if (/text\/html/i.test(ctype)) {
        throw new Error(`Google Drive returned HTML instead of image for ${item.filename}`);
      }

      let assembled = null;
      if (res.body && typeof res.body.getReader === "function") {
        const reader = res.body.getReader();
        const chunks = [];
        let fileSize = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value && value.byteLength > 0) {
            chunks.push(value);
            fileSize += value.byteLength;
            totalBytesLoaded += value.byteLength;
            emitProgress(false);
          }
        }
        assembled = new Uint8Array(fileSize);
        let writeOffset = 0;
        for (let c = 0; c < chunks.length; c++) {
          assembled.set(chunks[c], writeOffset);
          writeOffset += chunks[c].byteLength;
          chunks[c] = null;
        }
      } else {
        const buf = await res.arrayBuffer();
        assembled = new Uint8Array(buf);
        totalBytesLoaded += assembled.byteLength;
        emitProgress(false);
      }

      const crc = computeCrc32(assembled);
      const size = assembled.byteLength;
      const cleanType = /png/i.test(ctype) ? "image/png" : (/webp/i.test(ctype) ? "image/webp" : "image/jpeg");
      const file = new File([assembled], item.downloadName || item.filename || "photo.jpg", {
        type: cleanType,
        lastModified: Date.now()
      });
      assembled = null;

      return {
        ...item,
        file,
        blob: file,
        crc,
        size,
        type: cleanType
      };
    }

    async function worker() {
      while (nextIdx < items.length) {
        const i = nextIdx++;
        const item = items[i];
        try {
          results[i] = await fetchOneItem(item);
        } catch (err) {
          console.warn("Delivery file fetch error:", item.filename, err);
          results[i] = null;
        }
        completed++;
        emitProgress(true);
      }
    }

    const workers = [];
    for (let w = 0; w < Math.min(CONCURRENCY, items.length); w++) {
      workers.push(worker());
    }
    await Promise.all(workers);
    return results.filter(Boolean);
  }

  function showCameraRollShareSheet(preparedFiles, titleLabel) {
    const existing = document.getElementById("portal-delivery-share-modal");
    if (existing) existing.remove();

    const totalSize = preparedFiles.reduce((s, f) => s + (f.size || (f.file && f.file.size) || (f.blob && f.blob.size) || (f.bytes && f.bytes.byteLength) || 0), 0);
    const btnLabel = preparedFiles.length === 1
      ? "Save Photo to Camera Roll \u2192"
      : `Save All ${preparedFiles.length} Photos to Camera Roll \u2192`;

    const modal = document.createElement("div");
    modal.id = "portal-delivery-share-modal";
    modal.className = "portal-quick-note-modal";
    modal.style.display = "flex";
    modal.innerHTML = `
      <div class="portal-quick-note-box portal-delivery-share-box">
        <div class="portal-quick-note-header">
          <span class="portal-quick-note-title">Save to Camera Roll &middot; ${escapeHtml(titleLabel)}</span>
          <button type="button" class="portal-quick-note-close" id="delivery-share-close">&times;</button>
        </div>
        <p class="portal-delivery-share-copy" id="delivery-share-copy">
          ${preparedFiles.length === 1
            ? `High-resolution photo ready (${formatTransferBytes(totalSize)}). Tap below and choose <strong>Save Image</strong> to add it to your Camera Roll.`
            : `${preparedFiles.length} high-resolution photos ready (${formatTransferBytes(totalSize)}). Tap below and choose <strong>Save ${preparedFiles.length} Images</strong> in your phone's Share menu to save directly to Apple Photos / Camera Roll.`
          }
        </p>
        <div class="portal-delivery-share-batches" id="delivery-share-batches">
          <button type="button" class="portal-delivery-btn is-gold portal-delivery-share-trigger">${btnLabel}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector("#delivery-share-close").addEventListener("click", close);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });

    const getShareFiles = (items) => items.map(item => {
      if (item.file instanceof File) return item.file;
      return new File([item.blob || item.bytes], item.downloadName || item.filename || "photo.jpg", {
        type: item.type || "image/jpeg",
        lastModified: Date.now()
      });
    });

    const fallbackDownload = (items, btnEl) => {
      const files = getShareFiles(items);
      if (files.length === 1) {
        triggerBlobDownload(files[0], files[0].name);
        if (btnEl) {
          btnEl.textContent = "Downloaded ✓";
          btnEl.classList.add("is-completed");
        }
      } else {
        const zipBlob = buildZipBlob(items.map((f, idx) => ({
          path: f.zipPath || f.downloadName || `photo-${idx + 1}.jpg`,
          blob: f.file || f.blob,
          bytes: f.bytes,
          crc: f.crc,
          size: f.size
        })));
        triggerBlobDownload(zipBlob, `${(titleLabel || "final-edits").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.zip`);
        if (btnEl) {
          btnEl.textContent = "Downloaded .ZIP ✓";
          btnEl.classList.add("is-completed");
        }
      }
    };

    function renderBatchButtons() {
      const copyEl = modal.querySelector("#delivery-share-copy");
      const batchesEl = modal.querySelector("#delivery-share-batches");
      if (!batchesEl) return;
      const BATCH_SIZE = 8;
      const batches = [];
      for (let i = 0; i < preparedFiles.length; i += BATCH_SIZE) {
        batches.push(preparedFiles.slice(i, i + BATCH_SIZE));
      }
      if (copyEl) {
        copyEl.innerHTML = `Your phone's Share menu limited saving ${preparedFiles.length} high-res photos in one tap &mdash; tap each group below and choose <strong>Save Images</strong> to add them straight to your Camera Roll:`;
      }
      batchesEl.innerHTML = batches.map((batch, bIdx) => {
        const startN = bIdx * BATCH_SIZE + 1;
        const endN = startN + batch.length - 1;
        return `<button type="button" class="portal-delivery-btn is-gold portal-delivery-share-batch" data-batch-idx="${bIdx}">Save Photos ${startN}&ndash;${endN} (${batch.length}) &rarr;</button>`;
      }).join("");

      batchesEl.querySelectorAll(".portal-delivery-share-batch").forEach(btn => {
        btn.addEventListener("click", async () => {
          const bIdx = parseInt(btn.dataset.batchIdx, 10) || 0;
          const batch = batches[bIdx] || [];
          const batchFiles = getShareFiles(batch);
          const tapStart = Date.now();
          try {
            await navigator.share({ files: batchFiles });
            btn.textContent = "Saved ✓";
            btn.classList.add("is-completed");
          } catch (err) {
            if (err && err.name === "AbortError" && (Date.now() - tapStart) >= 600) {
              return;
            }
            fallbackDownload(batch, btn);
          }
        });
      });
    }

    const triggerBtn = modal.querySelector(".portal-delivery-share-trigger");
    if (triggerBtn) {
      triggerBtn.addEventListener("click", async () => {
        const allFiles = getShareFiles(preparedFiles);
        const tapStart = Date.now();
        try {
          if (navigator.canShare && navigator.canShare({ files: allFiles })) {
            await navigator.share({ files: allFiles });
            triggerBtn.textContent = "Saved ✓";
            triggerBtn.classList.add("is-completed");
          } else if (preparedFiles.length > 8) {
            renderBatchButtons();
          } else {
            fallbackDownload(preparedFiles, triggerBtn);
          }
        } catch (err) {
          const elapsed = Date.now() - tapStart;
          if (err && err.name === "AbortError" && elapsed >= 600) {
            return;
          }
          if (preparedFiles.length > 8) {
            renderBatchButtons();
          } else {
            fallbackDownload(preparedFiles, triggerBtn);
          }
        }
      });
    }
  }

  async function renderShootDeliveryPage(container, shoot) {
    if (!container || !shoot) return;
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    const folderId = shoot.deliveryFolderId || extractDriveFolderId(shoot.deliveryDriveUrl || "");
    const folderUrl = folderId ? `https://drive.google.com/drive/folders/${folderId}` : (shoot.deliveryDriveUrl || "");
    const safeSlugName = (shoot.clientName || "final-edits").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const hasProofs = Boolean(shoot.images && shoot.images.length > 0);
    const isPhotographer = isPhotographerAuth();

    container.innerHTML = `
      <div class="portal-delivery-wrap">
        <div class="portal-review-nav">
          <button type="button" class="portal-back-btn" id="delivery-back-btn">
            &larr; ${isPhotographer ? "Master Dashboard" : "Lock Gallery"}
          </button>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            ${hasProofs ? `<button type="button" class="portal-back-btn" id="delivery-proofs-btn">View Proofs</button>` : ""}
            <span class="portal-review-quota-pill is-submitted">
              <span class="portal-status-dot"></span>
              Final Retouched Collection
            </span>
          </div>
        </div>

        <div id="delivery-content-root">
          <header class="portal-delivery-header">
            <span class="portal-delivery-kicker">FINAL RETOUCHED COLLECTION</span>
            <h1 class="portal-delivery-title">${escapeHtml(shoot.deliveryHeading || shoot.clientName || "final collection")}</h1>
            <p class="portal-delivery-subtitle">
              ${escapeHtml(shoot.shootTitle || "Loading your finished portraits...")}
            </p>
          </header>
          <div class="portal-delivery-loading">
            <div class="portal-delivery-spinner"></div>
            <p>Organising Looks, Tone Variations &amp; Grid Layouts from Google Drive...</p>
          </div>
        </div>
      </div>
    `;

    const backBtn = container.querySelector("#delivery-back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        activeShootId = null;
        if (!isPhotographer) setShootUnlockedMode(shoot.id, null);
        if (typeof window !== "undefined") {
          window.location.hash = `#/${window.getCustomPageSlug ? window.getCustomPageSlug("client-portal") : "client-portal"}`;
        }
        renderLandingScreen(container);
      });
    }

    const proofsBtn = container.querySelector("#delivery-proofs-btn");
    if (proofsBtn) {
      proofsBtn.addEventListener("click", () => {
        if (typeof window !== "undefined") {
          window.location.hash = buildPortalRouteHash(`${shoot.id}/proofs`);
        }
      });
    }

    const contentRoot = container.querySelector("#delivery-content-root");

    if (!folderId) {
      contentRoot.innerHTML = `
        <div class="portal-empty-state">
          <p class="portal-empty-title">No Google Drive delivery folder linked yet.</p>
          <p class="portal-empty-desc">Add a Google Drive folder link in Edit Shoot Setup to activate Final Delivery.</p>
        </div>
      `;
      return;
    }

    let catalog = deliveryCatalogCache[folderId] || null;
    if (!catalog) {
      try {
        const res = await fetch(`/api/gdrive-delivery?folderId=${encodeURIComponent(folderId)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load Google Drive delivery folder.");
        catalog = data;
        deliveryCatalogCache[folderId] = catalog;
      } catch (err) {
        contentRoot.innerHTML = `
          <div class="portal-empty-state">
            <p class="portal-empty-title">Couldn't Load Delivery Folder</p>
            <p class="portal-empty-desc">${escapeHtml(err.message || "Check that Google Drive folder sharing is set to Anyone with the link.")}</p>
            ${folderUrl ? `<a href="${escapeHtml(folderUrl)}" target="_blank" rel="noopener noreferrer" class="portal-delivery-btn is-gold" style="margin-top: 16px; display: inline-flex; text-decoration: none;">Open Google Drive Folder &nearr;</a>` : ""}
          </div>
        `;
        return;
      }
    }

    const customStorageKey = `kh_delivery_custom_${shoot.id}`;
    let savedCustom = {};
    try {
      const rawCustom = localStorage.getItem(customStorageKey);
      if (rawCustom) savedCustom = JSON.parse(rawCustom) || {};
    } catch (e) {}

    let customHeading = savedCustom.deliveryHeading !== undefined
      ? savedCustom.deliveryHeading
      : (shoot.deliveryHeading || shoot.clientName || "final collection");
    let customHeroFileId = savedCustom.deliveryHeroFileId !== undefined
      ? savedCustom.deliveryHeroFileId
      : (shoot.deliveryHeroFileId || "");

    let cloudSyncTimer = null;
    function persistDeliveryCustomization() {
      try {
        localStorage.setItem(customStorageKey, JSON.stringify({
          deliveryHeading: customHeading,
          deliveryHeroFileId: customHeroFileId
        }));
      } catch (e) {}
      if (shoot.isCustom) {
        shoot.deliveryHeading = customHeading.trim();
        shoot.deliveryHeroFileId = customHeroFileId.trim();
        saveCustomShoot(shoot);
        clearTimeout(cloudSyncTimer);
        cloudSyncTimer = setTimeout(() => {
          syncCustomShootToCloud(shoot);
        }, 700);
      }
    }

    const heroCandidates = [];
    (catalog.looks || []).forEach(look => {
      (look.items || []).forEach(item => {
        const defTone = item.defaultTone || Object.keys(item.versions)[0];
        const v = item.versions[defTone] || item.versions[Object.keys(item.versions)[0]];
        if (v && v.fileId) {
          heroCandidates.push({
            fileId: v.fileId,
            allFileIds: Object.values(item.versions || {}).map(ver => ver && ver.fileId).filter(Boolean),
            previewUrl: v.previewUrl,
            fullPreviewUrl: v.fullPreviewUrl,
            lookTitle: look.title,
            title: item.title,
            toneLabel: v.toneLabel
          });
        }
      });
    });

    function resolveHeroPortrait() {
      if (customHeroFileId) {
        const matched = heroCandidates.find(c => c.fileId === customHeroFileId || c.allFileIds.includes(customHeroFileId));
        if (matched) return matched;
      }
      return heroCandidates[0] || null;
    }

    const lookToneFilters = {};
    (catalog.looks || []).forEach(look => {
      lookToneFilters[look.id] = (look.tones && look.tones[0] && look.tones[0].key) || "colour";
    });
    const cardToneOverrides = {};

    const countSummary = [
      `${catalog.totalPortraits} Retouched Portraits`,
      catalog.looks.length > 0 ? `${catalog.looks.length} ${catalog.looks.length === 1 ? "Look" : "Looks"}` : "",
      catalog.totalGrids > 0 ? `${catalog.totalGrids} Grid ${catalog.totalGrids === 1 ? "Layout" : "Layouts"}` : ""
    ].filter(Boolean).join(" \u00b7 ");

    function resolveOriginalUrl(v) {
      if (!v) return "";
      return `/api/gdrive-delivery?fileId=${encodeURIComponent(v.fileId)}&original=1`;
    }

    function getLookActiveTone(look) {
      if (!look) return "colour";
      return lookToneFilters[look.id] || (look.tones && look.tones[0] && look.tones[0].key) || "colour";
    }

    function getLookVisibleItems(look) {
      if (!look) return [];
      const activeTone = getLookActiveTone(look);
      const filtered = look.items.filter(it => !!it.versions[activeTone]);
      return filtered.length > 0 ? filtered : look.items;
    }

    function resolveItemTone(item, look) {
      const cardKey = item.filename + "::" + item.lookTitle;
      const ov = cardToneOverrides[cardKey];
      if (ov && item.versions[ov]) return ov;
      const lookTone = getLookActiveTone(look);
      if (lookTone && item.versions[lookTone]) return lookTone;
      return item.defaultTone || Object.keys(item.versions)[0] || "colour";
    }

    function resolveGridTone(g) {
      if (!g) return "colour";
      if (cardToneOverrides[g.id] && g.versions[cardToneOverrides[g.id]]) {
        return cardToneOverrides[g.id];
      }
      return g.defaultTone || Object.keys(g.versions)[0] || "colour";
    }

    function collectVisibleDownloadItems(scopeLooks, includeGrids, mode) {
      const downloadMode = mode || "all-tones";
      const out = [];
      (scopeLooks || []).forEach(look => {
        const activeTone = getLookActiveTone(look);
        const itemsList = downloadMode === "active-tones" ? getLookVisibleItems(look) : look.items;
        itemsList.forEach(item => {
          let tonesToGrab;
          if (downloadMode === "active-tones") {
            const chosenTone = item.versions[activeTone] ? activeTone : resolveItemTone(item, look);
            tonesToGrab = item.versions[chosenTone] ? [chosenTone] : [];
          } else {
            tonesToGrab = item.toneKeys;
          }
          tonesToGrab.forEach(tKey => {
            const v = item.versions[tKey];
            if (!v) return;
            const folderPart = (look.tones && look.tones.length > 1) || item.toneKeys.length > 1
              ? `${look.title}/${v.toneLabel}`
              : look.title;
            const safeToneTag = v.toneLabel.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
            const extMatch = item.filename.match(/(\.[^.]+)$/);
            const ext = extMatch ? extMatch[1] : ".jpg";
            const stem = item.filename.replace(/\.[^.]+$/, "");
            out.push({
              fileId: v.fileId,
              filename: item.filename,
              downloadName: `${look.title.replace(/[^a-zA-Z0-9]+/g, "_")}_${stem}_${safeToneTag}${ext}`,
              zipPath: `${folderPart}/${item.filename}`,
              url: resolveOriginalUrl(v)
            });
          });
        });
      });
      if (includeGrids && catalog.grids.length > 0) {
        catalog.grids.forEach(g => {
          const tonesToGrab = downloadMode === "active-tones"
            ? [resolveGridTone(g)]
            : g.toneKeys;
          tonesToGrab.forEach(tKey => {
            const v = g.versions[tKey];
            if (!v) return;
            const safeToneTag = v.toneLabel.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
            const extMatch = g.filename.match(/(\.[^.]+)$/);
            const ext = extMatch ? extMatch[1] : ".jpg";
            const stem = g.filename.replace(/\.[^.]+$/, "");
            const pathPrefix = g.toneKeys.length > 1 ? `Grid Layouts/${g.lookTitle}/${v.toneLabel}` : `Grid Layouts/${g.lookTitle}`;
            out.push({
              fileId: v.fileId,
              filename: g.filename,
              downloadName: `${g.lookTitle.replace(/[^a-zA-Z0-9]+/g, "_")}_${stem}_${safeToneTag}${ext}`,
              zipPath: `${pathPrefix}/${g.filename}`,
              url: resolveOriginalUrl(v)
            });
          });
        });
      }
      return out;
    }

    async function handleZipDownload(downloadItems, btnEl, zipFilename) {
      if (!downloadItems || downloadItems.length === 0) return;
      const origHtml = btnEl ? btnEl.innerHTML : "";
      if (btnEl) {
        btnEl.disabled = true;
        btnEl.textContent = `Preparing .ZIP (0 / ${downloadItems.length})...`;
      }
      const fetched = await fetchDeliveryFilesInBatches(downloadItems, (done, total, bytesLoaded) => {
        if (btnEl) {
          const sizeStr = bytesLoaded > 0 ? ` · ${formatTransferBytes(bytesLoaded)}` : "";
          btnEl.textContent = `Bundling .ZIP (${done} / ${total}${sizeStr})...`;
        }
      });
      if (fetched.length === 0) {
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.innerHTML = origHtml;
        }
        alert("Could not download files for the ZIP. Use the Google Drive archive link directly.");
        return;
      }
      if (btnEl) btnEl.textContent = "Finalising .ZIP...";
      const seenPaths = new Set();
      const uniqueEntries = fetched.map((f, idx) => {
        let p = f.zipPath;
        if (seenPaths.has(p)) {
          p = p.replace(/(\.[^.]+)$/, `_${idx + 1}$1`);
        }
        seenPaths.add(p);
        return {
          path: p,
          blob: f.blob,
          bytes: f.bytes,
          crc: f.crc,
          size: f.size
        };
      });
      const zipBlob = buildZipBlob(uniqueEntries);
      triggerBlobDownload(zipBlob, zipFilename);
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.innerHTML = `Downloaded .ZIP ✓`;
        setTimeout(() => {
          btnEl.innerHTML = origHtml;
        }, 2500);
      }
    }

    async function handleCameraRollSave(downloadItems, btnEl, label) {
      if (!downloadItems || downloadItems.length === 0) return;
      const useShare = supportsNativePhotoShare();
      if (!useShare) {
        if (downloadItems.length === 1) {
          const item = downloadItems[0];
          const origHtml = btnEl ? btnEl.innerHTML : "";
          if (btnEl) {
            btnEl.disabled = true;
            btnEl.textContent = "Downloading...";
          }
          const fetched = await fetchDeliveryFilesInBatches([item], (done, total, bytesLoaded) => {
            if (btnEl && bytesLoaded > 0) {
              btnEl.textContent = `Downloading (${formatTransferBytes(bytesLoaded)})...`;
            }
          });
          if (fetched[0]) {
            const dlBlob = fetched[0].blob || new Blob([fetched[0].bytes], { type: fetched[0].type });
            triggerBlobDownload(dlBlob, item.downloadName);
          }
          if (btnEl) {
            btnEl.disabled = false;
            btnEl.innerHTML = origHtml;
          }
          return;
        }
        await handleZipDownload(downloadItems, btnEl, `${safeSlugName}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.zip`);
        return;
      }

      const origHtml = btnEl ? btnEl.innerHTML : "";
      const szForShare = downloadItems.length <= 5
        ? "w4000"
        : (downloadItems.length <= 15 ? "w3000" : "w2400");
      const shareItems = downloadItems.map(item => {
        if (!item.fileId) return item;
        return {
          ...item,
          url: `/api/gdrive-delivery?fileId=${encodeURIComponent(item.fileId)}&sz=${szForShare}`
        };
      });

      if (btnEl) {
        btnEl.disabled = true;
        btnEl.textContent = `Preparing (0 / ${shareItems.length})...`;
      }
      const fetched = await fetchDeliveryFilesInBatches(shareItems, (done, total, bytesLoaded) => {
        if (btnEl) {
          const sizeStr = bytesLoaded > 0 ? ` · ${formatTransferBytes(bytesLoaded)}` : "";
          btnEl.textContent = `Preparing (${done} / ${total}${sizeStr})...`;
        }
      });
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.innerHTML = origHtml;
      }
      if (fetched.length === 0) return;

      const fileObjects = fetched.map(item => {
        if (item.file instanceof File) return item.file;
        return new File([item.blob || item.bytes], item.downloadName || item.filename || "photo.jpg", {
          type: item.type || "image/jpeg",
          lastModified: Date.now()
        });
      });
      const shareAttemptStart = Date.now();
      try {
        await navigator.share({ files: fileObjects });
        if (btnEl) {
          btnEl.innerHTML = "Saved ✓";
          setTimeout(() => {
            btnEl.innerHTML = origHtml;
          }, 2500);
        }
        return;
      } catch (err) {
        const elapsed = Date.now() - shareAttemptStart;
        if (err && err.name === "AbortError" && elapsed >= 600) return;
        // iOS Safari expired transient activation gesture or rejected auto-call -> open 1-tap Share Sheet modal
        showCameraRollShareSheet(fetched, label);
      }
    }

    function renderLookSectionInner(look, lIdx) {
      const visibleItems = getLookVisibleItems(look);
      const activeTone = getLookActiveTone(look);
      const hasMultiTones = look.tones && look.tones.length > 1;
      const activeToneObj = hasMultiTones ? look.tones.find(t => t.key === activeTone) : null;

      return `
        <div class="portal-delivery-section-header">
          <div class="portal-delivery-section-meta-col">
            <span class="portal-delivery-section-kicker">LOOK ${String(lIdx + 1).padStart(2, "0")}</span>
            <h2 class="portal-delivery-section-title">${escapeHtml(look.title)}</h2>
            <span class="portal-delivery-section-meta">${visibleItems.length} ${visibleItems.length === 1 ? "Portrait" : "Portraits"}${activeToneObj ? ` &middot; ${escapeHtml(activeToneObj.label)}` : ""}</span>
            ${hasMultiTones ? `
              <div class="portal-delivery-look-tones" role="group" aria-label="${escapeHtml(look.title)} tone versions">
                ${look.tones.map(t => `
                  <button type="button" class="portal-delivery-pill ${activeTone === t.key ? "is-active" : ""}" data-look-tone-filter="${look.id}" data-tone="${t.key}">
                    ${escapeHtml(t.label)}
                  </button>
                `).join("")}
              </div>
            ` : ""}
          </div>
          <div class="portal-delivery-section-actions">
            <button type="button" class="portal-delivery-mini-btn" data-look-zip="${look.id}">&darr; Look .ZIP (Full Res)</button>
            <button type="button" class="portal-delivery-mini-btn is-gold-outline" data-look-save="${look.id}">Save Look (High Res)</button>
          </div>
        </div>

        <div class="portal-delivery-grid">
          ${visibleItems.map(item => {
            const curToneKey = resolveItemTone(item, look);
            const v = item.versions[curToneKey] || item.versions[Object.keys(item.versions)[0]];
            const dlUrl = resolveOriginalUrl(v);
            return `
              <article class="portal-delivery-card" data-look-id="${look.id}" data-filename="${escapeHtml(item.filename)}">
                <div class="portal-delivery-img-wrap" data-kind="portrait" data-look-id="${look.id}" data-filename="${escapeHtml(item.filename)}">
                  <img src="${v.previewUrl}" alt="${escapeHtml(look.title)} · ${escapeHtml(item.filename)}" class="portal-delivery-img" loading="lazy" decoding="async">
                </div>
                <div class="portal-delivery-card-footer">
                  <div class="portal-delivery-card-top">
                    <span class="portal-delivery-card-fn">${escapeHtml(item.title)}</span>
                    <button type="button" class="portal-delivery-fullres-link" data-card-save="1" data-file-id="${v.fileId}" data-original-url="${escapeHtml(dlUrl)}" data-filename="${escapeHtml(item.filename)}" data-tone="${escapeHtml(v.toneLabel)}" data-look="${escapeHtml(look.title)}" title="Save Full-Res to Camera Roll / Download" aria-label="Download photo">Save &darr;</button>
                  </div>
                  ${item.toneKeys.length > 1 ? `
                    <div class="portal-delivery-card-tones">
                      ${item.toneKeys.map(tKey => `
                        <button type="button" class="portal-delivery-card-tone-btn ${curToneKey === tKey ? "is-active" : ""}" data-card-tone="${tKey}">
                          ${escapeHtml(getToneShort(tKey, shoot))}
                        </button>
                      `).join("")}
                    </div>
                  ` : ""}
                </div>
              </article>
            `;
          }).join("")}
        </div>
      `;
    }

    function renderDeliveryBody() {
      const hasChapterNav = (catalog.looks.length > 1 || catalog.grids.length > 0);
      const heroItem = resolveHeroPortrait();
      const showStudioCustomizer = isPhotographer || shoot.id === "test-delivery";

      contentRoot.innerHTML = `
        ${showStudioCustomizer ? `
          <!-- Photographer Live Header & Hero Image Customizer -->
          <div class="portal-delivery-customizer">
            <div class="portal-delivery-customizer-row">
              <div class="portal-delivery-customizer-field">
                <label class="portal-delivery-customizer-label" for="delivery-custom-heading-input">Heading Text</label>
                <input type="text" id="delivery-custom-heading-input" class="portal-delivery-customizer-input" placeholder="final collection (or client name)" value="${escapeHtml(customHeading)}">
              </div>
              <div class="portal-delivery-customizer-actions">
                <button type="button" class="portal-delivery-mini-btn is-gold-outline" id="delivery-toggle-hero-picker-btn">Pick Top Image &darr;</button>
                <span class="portal-delivery-customizer-status" id="delivery-custom-status"></span>
              </div>
            </div>
            <div class="portal-delivery-hero-picker-drawer" id="delivery-hero-picker-drawer" style="display: none;">
              ${heroCandidates.map(c => `
                <button type="button" class="portal-builder-hero-option ${(heroItem && heroItem.fileId === c.fileId) ? "is-selected" : ""}" data-set-hero-file-id="${escapeHtml(c.fileId)}" title="${escapeHtml(c.lookTitle)} · ${escapeHtml(c.title)}">
                  <img src="${escapeHtml(c.previewUrl)}" alt="${escapeHtml(c.title)}" loading="lazy">
                  <span>${escapeHtml(c.lookTitle)} &middot; ${escapeHtml(c.title)}</span>
                </button>
              `).join("")}
            </div>
          </div>
        ` : ""}

        <!-- Design 01 · Split Hero Cover -->
        <section class="portal-delivery-split-hero">
          <div class="portal-delivery-hero-copy">
            <span class="portal-delivery-kicker">FINAL RETOUCHED COLLECTION</span>
            <h1 class="portal-delivery-title" id="delivery-main-heading">${escapeHtml(customHeading || "final collection")}</h1>
            <p class="portal-delivery-subtitle" id="delivery-subtitle">
              ${escapeHtml(shoot.shootTitle || "")}${shoot.shootTitle ? " &middot; " : ""}<strong>${escapeHtml(countSummary)}</strong>
            </p>

            <div class="portal-delivery-dock-buttons is-hero-stack">
              <button type="button" class="portal-delivery-btn is-gold" id="delivery-download-zip-btn">
                &darr; Download .ZIP (Full Resolution)
              </button>
              <button type="button" class="portal-delivery-btn is-outline" id="delivery-camera-roll-btn">
                Save to Camera Roll (High Resolution)
              </button>
            </div>

            <p class="portal-delivery-res-note">For Full Resolution images, please download the .ZIP file.</p>

            ${folderUrl ? `
              <a href="${escapeHtml(folderUrl)}" target="_blank" rel="noopener noreferrer" class="portal-delivery-drive-link">
                Google Drive Archive (Full Folder) &nearr;
              </a>
            ` : ""}
          </div>

          ${heroItem ? `
            <div class="portal-delivery-hero-media" id="delivery-hero-media-trigger" title="Click to view full screen">
              <img id="delivery-hero-img" src="${escapeHtml(heroItem.fullPreviewUrl || heroItem.previewUrl)}" alt="${escapeHtml(customHeading || "final collection")}" class="portal-delivery-hero-img" loading="eager" decoding="async">
              <span class="portal-delivery-hero-caption" id="delivery-hero-caption">${escapeHtml(heroItem.lookTitle)} &middot; ${escapeHtml(heroItem.title)}</span>
            </div>
          ` : ""}
        </section>

        <!-- Look Chapter Navigation -->
        ${hasChapterNav ? `
          <div class="portal-delivery-filter-bar">
            <div class="portal-delivery-jump-pills">
              ${catalog.looks.map((l, idx) => `
                <a href="#delivery-look-${l.id}" class="portal-delivery-jump-pill" data-target="delivery-look-${l.id}">
                  0${idx + 1} &middot; ${escapeHtml(l.title)}
                </a>
              `).join("")}
              ${catalog.grids.length > 0 ? `
                <a href="#delivery-grids-section" class="portal-delivery-jump-pill is-grid-pill" data-target="delivery-grids-section">
                  Grid Layouts (${catalog.grids.length})
                </a>
              ` : ""}
            </div>
          </div>
        ` : ""}

        <!-- Look Sections (3-Column 2:3 Monograph Portrait Grid) -->
        <div class="portal-delivery-sections">
          ${catalog.looks.map((look, lIdx) => `
            <section class="portal-delivery-look-section" id="delivery-look-${look.id}" data-look-section-id="${look.id}" data-look-idx="${lIdx}">
              ${renderLookSectionInner(look, lIdx)}
            </section>
          `).join("")}
        </div>

        ${catalog.grids.length > 0 ? `
          <!-- Dedicated Grid Layouts Exhibition Section -->
          <section class="portal-delivery-grids-section" id="delivery-grids-section">
            <div class="portal-delivery-section-header">
              <div>
                <span class="portal-delivery-section-kicker">COMPOSITE SERIES</span>
                <h2 class="portal-delivery-section-title">grid layouts</h2>
                <span class="portal-delivery-section-meta">${catalog.grids.length} Curated Composite ${catalog.grids.length === 1 ? "Grid" : "Grids"}</span>
              </div>
              <div class="portal-delivery-section-actions">
                <button type="button" class="portal-delivery-mini-btn" id="delivery-grids-zip-btn">&darr; Grids .ZIP (Full Res)</button>
                <button type="button" class="portal-delivery-mini-btn is-gold-outline" id="delivery-grids-save-btn">Save Grids (High Res)</button>
              </div>
            </div>

            <div class="portal-delivery-grids-grid">
              ${catalog.grids.map(g => {
                const curToneKey = resolveGridTone(g);
                const gv = g.versions[curToneKey] || g.versions[Object.keys(g.versions)[0]];
                const gDlUrl = resolveOriginalUrl(gv);
                return `
                  <article class="portal-delivery-card is-grid-card" data-grid-id="${escapeHtml(g.id)}">
                    <div class="portal-delivery-img-wrap is-grid-wrap" data-kind="grid" data-grid-id="${escapeHtml(g.id)}">
                      <img src="${gv.previewUrl}" alt="${escapeHtml(g.lookTitle)} · ${escapeHtml(g.filename)}" class="portal-delivery-img" loading="lazy" decoding="async">
                      <span class="portal-delivery-grid-badge">${escapeHtml(g.lookTitle)}</span>
                    </div>
                    <div class="portal-delivery-card-footer">
                      <div class="portal-delivery-card-top">
                        <span class="portal-delivery-card-fn">${escapeHtml(g.lookTitle)} &middot; ${escapeHtml(g.title)}</span>
                        <button type="button" class="portal-delivery-fullres-link" data-card-save="1" data-file-id="${gv.fileId}" data-original-url="${escapeHtml(gDlUrl)}" data-filename="${escapeHtml(g.filename)}" data-tone="${escapeHtml(gv.toneLabel)}" data-look="${escapeHtml(g.lookTitle)}" title="Save Grid to Camera Roll / Download" aria-label="Download grid">Save &darr;</button>
                      </div>
                      ${g.toneKeys.length > 1 ? `
                        <div class="portal-delivery-card-tones">
                          ${g.toneKeys.map(tKey => `
                            <button type="button" class="portal-delivery-card-tone-btn ${curToneKey === tKey ? "is-active" : ""}" data-grid-tone="${tKey}">
                              ${escapeHtml(getToneShort(tKey, shoot))}
                            </button>
                          `).join("")}
                        </div>
                      ` : ""}
                    </div>
                  </article>
                `;
              }).join("")}
            </div>
          </section>
        ` : ""}

        <!-- Bottom Repeat Download Dock (Design 01 Monograph Footer) -->
        <div class="portal-delivery-bottom-cta">
          <div class="portal-delivery-dock-buttons">
            <button type="button" class="portal-delivery-btn is-gold" id="delivery-bottom-zip-btn">
              &darr; Download .ZIP (Full Resolution)
            </button>
            <button type="button" class="portal-delivery-btn is-outline" id="delivery-bottom-cam-btn">
              Save to Camera Roll (High Resolution)
            </button>
          </div>
          <p class="portal-delivery-res-note">For Full Resolution images, please download the .ZIP file.</p>
        </div>
      `;

      // Bind Customizer Controls
      const customHeadingInput = contentRoot.querySelector("#delivery-custom-heading-input");
      const mainHeadingEl = contentRoot.querySelector("#delivery-main-heading");
      const customStatusEl = contentRoot.querySelector("#delivery-custom-status");
      const heroPickerBtn = contentRoot.querySelector("#delivery-toggle-hero-picker-btn");
      const heroPickerDrawer = contentRoot.querySelector("#delivery-hero-picker-drawer");
      const heroImgEl = contentRoot.querySelector("#delivery-hero-img");
      const heroCaptionEl = contentRoot.querySelector("#delivery-hero-caption");
      const heroMediaTrigger = contentRoot.querySelector("#delivery-hero-media-trigger");

      if (customHeadingInput && mainHeadingEl) {
        customHeadingInput.addEventListener("input", () => {
          customHeading = customHeadingInput.value;
          mainHeadingEl.textContent = customHeading.trim() || "final collection";
          persistDeliveryCustomization();
          if (customStatusEl) customStatusEl.textContent = "Saved ✓";
        });
      }

      if (heroPickerBtn && heroPickerDrawer) {
        heroPickerBtn.addEventListener("click", () => {
          const isOpen = heroPickerDrawer.style.display !== "none";
          heroPickerDrawer.style.display = isOpen ? "none" : "grid";
          heroPickerBtn.innerHTML = isOpen ? "Pick Top Image &darr;" : "Close Picker &uarr;";
        });
        heroPickerDrawer.querySelectorAll("[data-set-hero-file-id]").forEach(btn => {
          btn.addEventListener("click", () => {
            const newId = btn.dataset.setHeroFileId || "";
            const chosen = heroCandidates.find(c => c.fileId === newId);
            if (!chosen) return;
            customHeroFileId = chosen.fileId;
            if (heroImgEl) heroImgEl.src = chosen.fullPreviewUrl || chosen.previewUrl;
            if (heroCaptionEl) heroCaptionEl.textContent = `${chosen.lookTitle} · ${chosen.title}`;
            heroPickerDrawer.querySelectorAll("[data-set-hero-file-id]").forEach(b => b.classList.toggle("is-selected", b === btn));
            persistDeliveryCustomization();
            if (customStatusEl) customStatusEl.textContent = "Top image updated ✓";
          });
        });
      }

      if (heroMediaTrigger && typeof window.openLightbox === "function") {
        heroMediaTrigger.addEventListener("click", () => {
          const current = resolveHeroPortrait();
          if (current) {
            window.openLightbox([{
              src: current.fullPreviewUrl,
              model: current.lookTitle,
              movie: `${current.title} (${current.toneLabel})`
            }], 0);
          }
        });
      }

      // Bind Smooth Jump Links
      contentRoot.querySelectorAll(".portal-delivery-jump-pill").forEach(link => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const target = contentRoot.querySelector(`#${CSS.escape(link.dataset.target)}`);
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });

      // Bind Primary Hero & Bottom ZIP / Camera Roll Buttons
      ["#delivery-download-zip-btn", "#delivery-bottom-zip-btn"].forEach(sel => {
        const btn = contentRoot.querySelector(sel);
        if (btn) {
          btn.addEventListener("click", () => {
            const items = collectVisibleDownloadItems(catalog.looks, true, "all-tones");
            handleZipDownload(items, btn, `${safeSlugName}-all-edits.zip`);
          });
        }
      });

      ["#delivery-camera-roll-btn", "#delivery-bottom-cam-btn"].forEach(sel => {
        const btn = contentRoot.querySelector(sel);
        if (btn) {
          btn.addEventListener("click", () => {
            const items = collectVisibleDownloadItems(catalog.looks, true, "active-tones");
            handleCameraRollSave(items, btn, customHeading || shoot.shootTitle || "All Final Edits");
          });
        }
      });

      // Bind Grids Section ZIP & Save
      const gridsZipBtn = contentRoot.querySelector("#delivery-grids-zip-btn");
      if (gridsZipBtn) {
        gridsZipBtn.addEventListener("click", () => {
          const items = collectVisibleDownloadItems([], true, "all-tones");
          handleZipDownload(items, gridsZipBtn, `${safeSlugName}-grid-layouts.zip`);
        });
      }
      const gridsSaveBtn = contentRoot.querySelector("#delivery-grids-save-btn");
      if (gridsSaveBtn) {
        gridsSaveBtn.addEventListener("click", () => {
          const items = collectVisibleDownloadItems([], true, "active-tones");
          handleCameraRollSave(items, gridsSaveBtn, "Grid Layouts");
        });
      }

      // Delegated Click Handling for In-Place Look Tones, Look ZIP/Save, Card Tones, Card Save & Lightbox
      contentRoot.addEventListener("click", (e) => {
        const lookToneBtn = e.target.closest("[data-look-tone-filter]");
        if (lookToneBtn) {
          const lookId = lookToneBtn.dataset.lookToneFilter;
          const newTone = lookToneBtn.dataset.tone;
          const lIdx = catalog.looks.findIndex(l => l.id === lookId);
          if (lIdx !== -1 && newTone) {
            const lookObj = catalog.looks[lIdx];
            lookToneFilters[lookId] = newTone;
            (lookObj.items || []).forEach(it => {
              delete cardToneOverrides[it.filename + "::" + it.lookTitle];
            });
            const secEl = contentRoot.querySelector(`[data-look-section-id="${CSS.escape(lookId)}"]`);
            if (secEl) {
              secEl.innerHTML = renderLookSectionInner(lookObj, lIdx);
            }
          }
          return;
        }

        const lookZipBtn = e.target.closest("[data-look-zip]");
        if (lookZipBtn) {
          const lookObj = catalog.looks.find(l => l.id === lookZipBtn.dataset.lookZip);
          if (!lookObj) return;
          const items = collectVisibleDownloadItems([lookObj], false, "all-tones");
          handleZipDownload(items, lookZipBtn, `${safeSlugName}-${lookObj.id}.zip`);
          return;
        }

        const lookSaveBtn = e.target.closest("[data-look-save]");
        if (lookSaveBtn) {
          const lookObj = catalog.looks.find(l => l.id === lookSaveBtn.dataset.lookSave);
          if (!lookObj) return;
          const items = collectVisibleDownloadItems([lookObj], false, "active-tones");
          handleCameraRollSave(items, lookSaveBtn, lookObj.title);
          return;
        }

        const cardToneBtn = e.target.closest("[data-card-tone]");
        if (cardToneBtn) {
          e.stopPropagation();
          const card = cardToneBtn.closest(".portal-delivery-card");
          if (!card) return;
          const lookObj = catalog.looks.find(l => l.id === card.dataset.lookId);
          const item = lookObj && lookObj.items.find(i => i.filename === card.dataset.filename);
          const newTone = cardToneBtn.dataset.cardTone;
          if (!item || !item.versions[newTone]) return;
          cardToneOverrides[item.filename + "::" + item.lookTitle] = newTone;
          const v = item.versions[newTone];
          const dlUrl = resolveOriginalUrl(v);
          const img = card.querySelector(".portal-delivery-img");
          if (img) img.src = v.previewUrl;
          const saveBtn = card.querySelector("[data-card-save]");
          if (saveBtn) {
            saveBtn.dataset.fileId = v.fileId;
            saveBtn.dataset.originalUrl = dlUrl;
            saveBtn.dataset.tone = v.toneLabel;
          }
          card.querySelectorAll("[data-card-tone]").forEach(b => b.classList.toggle("is-active", b.dataset.cardTone === newTone));
          return;
        }

        const gridToneBtn = e.target.closest("[data-grid-tone]");
        if (gridToneBtn) {
          e.stopPropagation();
          const card = gridToneBtn.closest(".portal-delivery-card");
          if (!card) return;
          const g = catalog.grids.find(gr => gr.id === card.dataset.gridId);
          const newTone = gridToneBtn.dataset.gridTone;
          if (!g || !g.versions[newTone]) return;
          cardToneOverrides[g.id] = newTone;
          const gv = g.versions[newTone];
          const dlUrl = resolveOriginalUrl(gv);
          const img = card.querySelector(".portal-delivery-img");
          if (img) img.src = gv.previewUrl;
          const saveBtn = card.querySelector("[data-card-save]");
          if (saveBtn) {
            saveBtn.dataset.fileId = gv.fileId;
            saveBtn.dataset.originalUrl = dlUrl;
            saveBtn.dataset.tone = gv.toneLabel;
          }
          card.querySelectorAll("[data-grid-tone]").forEach(b => b.classList.toggle("is-active", b.dataset.gridTone === newTone));
          return;
        }

        const saveBtn = e.target.closest("[data-card-save]");
        if (saveBtn) {
          e.stopPropagation();
          const fId = saveBtn.dataset.fileId;
          const fn = saveBtn.dataset.filename || "photo.jpg";
          const toneLab = saveBtn.dataset.tone || "Colour";
          const lookLab = saveBtn.dataset.look || "Edit";
          const safeTone = toneLab.replace(/[^a-zA-Z0-9]+/g, "-");
          const ext = (fn.match(/(\.[^.]+)$/) || [null, ".jpg"])[1];
          const stem = fn.replace(/\.[^.]+$/, "");
          const singleItem = {
            fileId: fId,
            filename: fn,
            downloadName: `${lookLab.replace(/[^a-zA-Z0-9]+/g, "_")}_${stem}_${safeTone}${ext}`,
            url: `/api/gdrive-delivery?fileId=${encodeURIComponent(fId)}&original=1`
          };
          handleCameraRollSave([singleItem], saveBtn, `${lookLab} · ${fn}`);
          return;
        }

        const wrap = e.target.closest(".portal-delivery-img-wrap");
        if (wrap && typeof window.openLightbox === "function") {
          if (wrap.dataset.kind === "grid") {
            const lbList = catalog.grids.map(gr => {
              const tk = resolveGridTone(gr);
              const v = gr.versions[tk] || gr.versions[Object.keys(gr.versions)[0]];
              return {
                src: v.fullPreviewUrl,
                model: `${gr.lookTitle} · Grid Layouts`,
                movie: `${gr.title} (${v.toneLabel})`
              };
            });
            const startIdx = Math.max(0, catalog.grids.findIndex(gr => gr.id === wrap.dataset.gridId));
            window.openLightbox(lbList, startIdx);
          } else {
            const flatPortraits = [];
            catalog.looks.forEach(lk => {
              getLookVisibleItems(lk).forEach(it => {
                const tk = resolveItemTone(it, lk);
                const v = it.versions[tk] || it.versions[Object.keys(it.versions)[0]];
                flatPortraits.push({
                  lookId: lk.id,
                  filename: it.filename,
                  src: v.fullPreviewUrl,
                  model: lk.title,
                  movie: `${it.title} (${v.toneLabel})`
                });
              });
            });
            const startIdx = Math.max(0, flatPortraits.findIndex(p => p.lookId === wrap.dataset.lookId && p.filename === wrap.dataset.filename));
            window.openLightbox(flatPortraits, startIdx);
          }
        }
      });
    }

    renderDeliveryBody();
  }

})();
