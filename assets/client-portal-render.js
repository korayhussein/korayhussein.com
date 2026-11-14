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
  let globalTone = "colour"; // "colour" | "bw" | "faded-bw"
  let itemTones = {}; // filename -> "colour" | "bw" | "faded-bw"
  let itemNotes = {}; // filename -> note string
  let selectedMap = new Map(); // key `${filename}::${tone}` -> { id, filename, tone, src }
  let rejectedSet = new Set(); // Set of rejected filenames
  let filterMode = "all"; // "all" | "selected" | "rejected"
  let hideRejected = false; // Toggle to hide rejected images from "all" view
  let showSelectedOnly = false;
  let isReviewModalOpen = false;
  let noteModalFilename = null;

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

  function setImageNote(filename, note) {
    if (note && note.trim()) {
      itemNotes[filename] = note.trim();
    } else {
      delete itemNotes[filename];
    }
    saveNotes(activeShootId, itemNotes);
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

  function saveSelections(shootId, map) {
    try {
      const arr = Array.from(map.values());
      localStorage.setItem(`kh_selections_multi_${shootId}`, JSON.stringify(arr));
    } catch (e) {}
  }

  function loadRejected(shootId) {
    try {
      const stored = localStorage.getItem(`kh_rejected_${shootId}`);
      if (stored) return new Set(JSON.parse(stored));
    } catch (e) {}
    return new Set();
  }

  function saveRejected(shootId, set) {
    try {
      localStorage.setItem(`kh_rejected_${shootId}`, JSON.stringify(Array.from(set)));
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
  }

  function loadNotes(shootId) {
    try {
      const stored = localStorage.getItem(`kh_notes_${shootId}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  }

  function saveNotes(shootId, notes) {
    try {
      localStorage.setItem(`kh_notes_${shootId}`, JSON.stringify(notes));
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

  // Master Passkey Authentication (Discreet Photographer Mode)
  const MASTER_PASSKEY = "Mezepo5633";

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
      t: item.tone
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
    return `${base}#/client-portal/${shootId}/review?sel=${payload}`;
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

  // Save shoot selections to Firebase Cloud
  async function saveSelectionsToCloud(shootId, map, notes, generalNotes) {
    try {
      const arr = Array.from(map.values()).map(item => ({
        id: item.id || makeKey(item.filename, item.tone),
        filename: item.filename,
        tone: item.tone,
        section: item.section || "",
        note: (notes && notes[item.filename]) || ""
      }));

      const payload = {
        selections: arr,
        notes: notes || {},
        generalNotes: generalNotes || "",
        savedAt: Date.now()
      };

      const docBody = {
        fields: {
          shootId: { stringValue: shootId },
          submitted: { booleanValue: true },
          count: { integerValue: String(arr.length) },
          savedAt: { integerValue: String(payload.savedAt) },
          clientNotes: { stringValue: generalNotes || "" },
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
      console.warn("Firestore save error:", e);
      return false;
    }
  }

  let autoSyncSelectionsTimer = null;
  function autoSyncSelectionsToCloud(shootId) {
    if (!shootId) return;
    if (autoSyncSelectionsTimer) clearTimeout(autoSyncSelectionsTimer);
    autoSyncSelectionsTimer = setTimeout(() => {
      saveSelectionsToCloud(shootId, selectedMap, itemNotes, loadGeneralNotes(shootId));
    }, 400);
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
      const jsonStr = f.payloadJson ? f.payloadJson.stringValue : "";

      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (parsed.selections && Array.isArray(parsed.selections)) {
          const shoot = getShootById(shootId);
          const map = new Map();
          parsed.selections.forEach(item => {
            const imgObj = shoot ? shoot.images.find(img => img.filename === item.filename) : null;
            const k = item.id || makeKey(item.filename, item.tone);
            map.set(k, {
              id: k,
              filename: item.filename,
              tone: item.tone,
              src: imgObj ? resolveImageSrc(imgObj, item.tone) : ""
            });
          });
          saveSelections(shootId, map);
        }
        if (parsed.notes) saveNotes(shootId, parsed.notes);
        if (parsed.generalNotes) saveGeneralNotes(shootId, parsed.generalNotes);
      }

      if (isSubmitted) {
        saveSubmissionStatus(shootId, {
          submitted: true,
          savedAt: savedAt,
          count: count
        });
      }

      return { isSubmitted, count, savedAt, clientNotes };
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
            if (parsed.selections && Array.isArray(parsed.selections)) {
              const shoot = getShootById(shootId);
              const map = new Map();
              parsed.selections.forEach(item => {
                const imgObj = shoot ? shoot.images.find(img => img.filename === item.filename) : null;
                const k = item.id || makeKey(item.filename, item.tone);
                map.set(k, {
                  id: k,
                  filename: item.filename,
                  tone: item.tone,
                  src: imgObj ? resolveImageSrc(imgObj, item.tone) : ""
                });
              });
              saveSelections(shootId, map);
            }
            if (parsed.notes) saveNotes(shootId, parsed.notes);
            if (parsed.generalNotes) saveGeneralNotes(shootId, parsed.generalNotes);
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

  async function fileToCompressedDataUrl(file, maxDim = 1200, quality = 0.76) {
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

      selectedMap = loadSelections(shoot.id);
      itemNotes = loadNotes(shoot.id);

      // Fetch latest cloud state in background for this shoot
      loadShootFromCloud(shoot.id).then(res => {
        if (res && res.isSubmitted) {
          selectedMap = loadSelections(shoot.id);
          itemNotes = loadNotes(shoot.id);
          const topPill = container.querySelector(".portal-shoot-tag-pill");
          if (topPill) {
            topPill.classList.add("is-submitted");
            topPill.innerHTML = `<span class="portal-status-dot"></span>Client Selected (${selectedMap.size})`;
          }
          const saveBtn = container.querySelector("#save-selections-btn");
          if (saveBtn) {
            saveBtn.classList.add("is-saved");
            saveBtn.innerHTML = `&#10003; Selections Saved to Cloud (${selectedMap.size}) &mdash; Tap to Update`;
          }
        }
      });

      if (subRoute === "review") {
        renderShootReviewPage(container, shoot);
      } else {
        renderShootGallery(container, shoot);
      }
    } else {
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
      ...H
    };
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
      : "Welcome to your private proofing gallery. Please enter your shoot access code to review, toggle tone variations, add editing notes, and select your favorite versions for final retouching.");
    const bannerImg = H.heroImage || "photos/contact/2.jpg";
    const bannerImgMobile = H.heroImageMobile || H.heroMobileImage || H.heroImage || bannerImg || "photos/sets/melanie/005_15.jpg";
    const heroMobileAspect = H.heroMobileAspect || '4 / 5';
    const mobileSrcset = (window.safeHeroUrl ? window.safeHeroUrl(bannerImgMobile) : (bannerImgMobile.startsWith("data:") ? bannerImgMobile : encodeURI(bannerImgMobile)));
    const initialHeroImgSrc = (window.safeHeroUrl ? window.safeHeroUrl(bannerImg) : bannerImg);

    const cardLabel = H.accessCardLabel || (isPhotographer ? "Shoot Access Code or Master Passkey" : "Private Shoot Access Code");
    const placeholderText = H.accessPlaceholder || (isPhotographer ? "Enter client shoot code..." : "Enter your shoot access code...");
    const buttonText = H.accessBtnText || "Enter Gallery &rarr;";
    const hintText = H.accessHint || "";

    const guideTitle1 = H.guideTitle1 || "Multi-Tone Variations";
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

            <div class="portal-shoots-grid">
              ${allShoots.map(s => {
                const status = loadSubmissionStatus(s.id);
                const curSelections = loadSelections(s.id);
                const count = status && status.count != null ? status.count : curSelections.size;
                const isSubmitted = status && status.submitted && count > 0;
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
                    ${s.hasVariants ? `<span class="portal-shoot-variant-badge">Multi-Tone Options</span>` : ""}
                  </div>
                  <div class="portal-shoot-details">
                    <span class="portal-shoot-meta">${s.shootDate} &middot; ${s.location}</span>
                    <h3 class="portal-shoot-client">${s.clientName}</h3>
                    <p class="portal-shoot-desc">${s.shootTitle}</p>
                    <div class="portal-shoot-footer">
                      <div class="portal-shoot-code-row">
                        <span class="portal-shoot-code">Access Code: <code>${s.code}</code></span>
                        <button type="button" class="portal-copy-code-btn" data-code="${s.code}" title="Copy Access Code">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          <span>Copy</span>
                        </button>
                      </div>
                      <div class="portal-card-btns-row">
                        ${s.isCustom ? `
                          <button type="button" class="portal-custom-action-btn portal-edit-gallery-btn" data-shoot-id="${s.id}" title="Edit gallery setup">&#9998; Edit Setup</button>
                          <button type="button" class="portal-custom-action-btn portal-export-code-btn" data-shoot-id="${s.id}" title="Export JavaScript code">Export</button>
                        ` : ""}
                        <button type="button" class="portal-custom-action-btn portal-delete-gallery-btn" data-shoot-id="${s.id}" title="Delete gallery">&times;</button>
                        ${isSubmitted ? `
                          <button type="button" class="portal-card-btn is-review-btn" data-action="review" data-shoot-id="${s.id}">Review (${count}) &rarr;</button>
                        ` : `
                          <button type="button" class="portal-card-btn" data-action="gallery" data-shoot-id="${s.id}">Open &rarr;</button>
                        `}
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

      // Master Passkey Authentication for Koray
      if (rawInput === MASTER_PASSKEY || code === MASTER_PASSKEY.toLowerCase()) {
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

      // Client Code Lookup
      let match = allShoots.find(s => 
        (s.code && s.code.trim().toLowerCase() === code) || 
        (s.id && s.id.toLowerCase() === code) || 
        (s.clientName && s.clientName.toLowerCase().includes(code))
      );

      // If not found locally, try quick cloud sync in case it was created on desktop
      if (!match) {
        enterBtn.textContent = "Checking...";
        await syncAllCustomGalleriesFromCloud();
        const updatedShoots = getAllShoots();
        match = updatedShoots.find(s => 
          (s.code && s.code.trim().toLowerCase() === code) || 
          (s.id && s.id.toLowerCase() === code) || 
          (s.clientName && s.clientName.toLowerCase().includes(code))
        );
        enterBtn.textContent = "Open Gallery →";
      }

      if (match) {
        errorMsg.style.display = "none";
        activeShootId = match.id;
        if (typeof window !== "undefined") {
          window.location.hash = `#/client-portal/${match.id}`;
        }
        try {
          if (match.isCustom) {
            await preloadShootBlobUrls(match);
          }
          selectedMap = loadSelections(match.id);
          itemNotes = loadNotes(match.id);
          renderShootGallery(container, match);
        } catch (err) {
          console.error("Error opening gallery:", err);
          renderShootGallery(container, match);
        }
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
          const originalHtml = btn.innerHTML;
          btn.classList.add("is-copied");
          btn.innerHTML = `<span>Copied ✓</span>`;
          setTimeout(() => {
            btn.classList.remove("is-copied");
            btn.innerHTML = originalHtml;
          }, 2000);
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
        if (e.target.closest(".portal-custom-action-btn") || e.target.closest(".portal-copy-code-btn")) {
          return;
        }

        const id = card.dataset.shootId;
        if (!id) return;
        activeShootId = id;
        const reviewBtn = e.target.closest("[data-action='review']");
        if (reviewBtn) {
          e.stopPropagation();
          if (typeof window !== "undefined") {
            window.location.hash = `#/client-portal/${id}/review`;
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
        } else {
          if (typeof window !== "undefined") {
            window.location.hash = `#/client-portal/${id}`;
          }
          const shoot = getShootById(id);
          if (shoot) {
            if (shoot.isCustom) {
              await preloadShootBlobUrls(shoot);
            }
            selectedMap = loadSelections(shoot.id);
            itemNotes = loadNotes(shoot.id);
            renderShootGallery(container, shoot);
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
        // parts.length >= 4: Root / Look / Tone / file.jpg
        lookName = parts[parts.length - 3];
        toneRaw = parts[parts.length - 2];
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

    const isEditMode = Boolean(editShootId);
    const existingShoot = editShootId ? getShootById(editShootId) : null;
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
      shootDate: existingShoot ? (existingShoot.shootDate || "November 2026") : "November 2026",
      location: existingShoot ? (existingShoot.location || "London, England") : "London, England",
      packageQuota: existingShoot ? (existingShoot.packageQuota || 15) : 15,
      notes: existingShoot ? (existingShoot.notes || "") : "",
      coverBlobKey: existingShoot ? (existingShoot.coverBlobKey || "") : "",
      coverImage: existingShoot ? getShootCoverSrc(existingShoot) : "",
      coverFilename: existingShoot ? (existingShoot.coverFilename || "") : "",
      coverTone: existingShoot ? (existingShoot.coverTone || "colour") : "colour",
      coverCustomFile: null,
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
              <span>Photographer Control Center</span>
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

              <div class="portal-builder-grid-3">
                <div class="portal-form-group">
                  <label class="portal-form-label">Client Login Code <span class="required">*</span></label>
                  <div class="portal-code-input-wrap">
                    <input type="text" id="builder-access-code" class="portal-form-input is-code" placeholder="e.g. ELENA2026" value="${builderState.accessCode}" required autocomplete="off">
                    <button type="button" id="builder-code-gen-btn" class="portal-code-gen-btn" title="Generate Access Code">&#127922;</button>
                  </div>
                  <span class="portal-form-help">Client will enter this private code to open their gallery.</span>
                </div>
                <div class="portal-form-group">
                  <label class="portal-form-label">Shoot Date</label>
                  <input type="text" id="builder-shoot-date" class="portal-form-input" placeholder="e.g. November 2026" value="${builderState.shootDate}">
                </div>
                <div class="portal-form-group">
                  <label class="portal-form-label">Location</label>
                  <input type="text" id="builder-shoot-location" class="portal-form-input" placeholder="e.g. London, England" value="${builderState.location}">
                </div>
              </div>

              <div class="portal-form-group">
                <label class="portal-form-label">Welcome Message & Retouching Guidance (Optional)</label>
                <textarea id="builder-shoot-notes" class="portal-form-textarea" rows="2" placeholder="Welcome! Please review your proofs below. You can toggle tones and leave editing notes before making your final selections.">${builderState.notes}</textarea>
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
      if (nameInput) {
        nameInput.addEventListener("input", () => {
          builderState.clientName = nameInput.value;
          if (!codeInput.dataset.userEdited) {
            builderState.accessCode = generateAccessCode(nameInput.value);
            codeInput.value = builderState.accessCode;
          }
        });
      }

      if (codeInput) {
        codeInput.addEventListener("input", () => {
          codeInput.dataset.userEdited = "true";
          builderState.accessCode = codeInput.value.toUpperCase();
        });
      }

      // 🎲 Dice random access code button
      const diceBtn = container.querySelector("#builder-code-gen-btn");
      if (diceBtn && codeInput) {
        diceBtn.addEventListener("click", () => {
          builderState.accessCode = generateAccessCode(nameInput ? nameInput.value : "");
          codeInput.value = builderState.accessCode;
          codeInput.dataset.userEdited = "true";
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
      if (totalFiles === 0) {
        alert("Please upload or import at least 1 photo for your gallery.");
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

      const updatedShoot = {
        ...(existingShoot || {}),
        id: shootId,
        code: code,
        clientName: name,
        shootTitle: title,
        shootDate: builderState.shootDate || "November 2026",
        location: builderState.location || "London, England",
        packageQuota: parseInt(builderState.packageQuota, 10) || 15,
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

      await saveCustomShoot(updatedShoot);

      submitBtn.textContent = builderState.isEditMode ? "Setup Saved ✓" : "Gallery Published ✓";
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
      clientName: shoot.clientName,
      shootTitle: shoot.shootTitle,
      shootDate: shoot.shootDate,
      location: shoot.location,
      packageQuota: shoot.packageQuota,
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

    container.innerHTML = `
      <div class="portal-gallery-wrap">
        <!-- Top Navigation Bar -->
        <div class="portal-top-nav">
          <button type="button" class="portal-back-btn" id="portal-back-btn">
            &larr; ${isPhotographerAuth() ? "Master Dashboard" : "Access Code Login Page"}
          </button>
          <div class="portal-top-nav-right" style="display: flex; align-items: center; gap: 8px;">
            ${(shoot.isCustom && isPhotographerAuth()) ? `
              <button type="button" class="portal-edit-setup-nav-btn" id="portal-edit-setup-btn" title="Edit gallery setup and tone names">&#9998; Edit Setup</button>
            ` : ""}
            <div class="portal-shoot-tag-pill ${isSubmitted ? "is-submitted" : ""}">
              <span class="portal-status-dot"></span>
              ${isSubmitted ? `Client Selected (${selectedMap.size})` : "Private Proofing Active"}
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
          </div>
          <h1 class="portal-client-title">${shoot.clientName}</h1>
          <p class="portal-session-subtitle">${shoot.shootTitle}</p>
          ${shoot.notes ? `<p class="portal-client-notes">${shoot.notes}</p>` : ""}
        </header>

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
              <span class="portal-tone-hint">Tip: Tap the heart to like, the &times; to reject, and the pencil to add editing notes.</span>
            </div>
          </div>
        ` : ""}

        <!-- Sticky Controls Bar -->
        <div class="portal-controls-bar">
          <div class="portal-controls-left">
            <button type="button" class="portal-filter-tab ${filterMode === "all" ? "is-active" : ""}" id="tab-show-all">
              All <span class="portal-tab-count">${shoot.images.length}</span>
            </button>
            <button type="button" class="portal-filter-tab ${filterMode === "selected" ? "is-active" : ""}" id="tab-show-selected">
              Selected <span class="portal-tab-count" id="tab-selected-count">${selectedMap.size}</span>
            </button>
            <button type="button" class="portal-filter-tab ${filterMode === "rejected" ? "is-active" : ""}" id="tab-show-rejected">
              Rejected <span class="portal-tab-count" id="tab-rejected-count">${rejectedSet.size}</span>
            </button>
            <button type="button" class="portal-filter-toggle-btn ${hideRejected ? "is-active" : ""}" id="toggle-hide-rejected" title="${hideRejected ? "Click to show rejected photos" : "Click to hide rejected photos from view"}">
              <span class="toggle-reject-icon">&times;</span> ${hideRejected ? "Rejected Hidden" : "Hide Rejected"}
            </button>
          </div>

          <div class="portal-controls-right">
            <button type="button" class="portal-submit-pill-btn" id="open-review-btn">
              Review (${selectedMap.size}) &rarr;
            </button>
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
          <p class="portal-empty-desc">Tap the heart on any photo to add it to your shortlist.</p>
          <button type="button" class="portal-enter-btn" id="empty-show-all-btn">Show All Proofs</button>
        </div>

        <!-- Floating Mobile Selection Bar -->
        <div class="portal-floating-bar" id="portal-floating-bar">
          <div class="portal-floating-info">
            <span class="portal-floating-count" id="floating-count">${selectedMap.size} Selected</span>
          </div>
          <div class="portal-floating-actions">
            <button type="button" class="portal-floating-filter-btn" id="floating-toggle-filter">
              ${showSelectedOnly ? "Show All" : "View Selected"}
            </button>
            <button type="button" class="portal-floating-submit-btn" id="floating-review-btn">
              Review Picks &rarr;
            </button>
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
        if (filterMode === "rejected") {
          return isImageRejected(img.filename);
        }
        // filterMode === "all"
        if (hideRejected && isImageRejected(img.filename)) {
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
    const activeTone = getImageActiveTone(img.filename, shoot);
    const isCurrentToneSelected = isToneSelected(img.filename, activeTone);
    const selectedTones = getSelectedTonesForFile(img.filename);
    const hasAnySelected = selectedTones.length > 0;
    const isRejected = isImageRejected(img.filename);
    const imgSrc = resolveImageSrc(img, activeTone);
    const noteText = getImageNote(img.filename);
    const availableTones = getAvailableTonesForImage(img);
    const blobKey = getBlobKeyForImage(img, activeTone);

    return `
      <div class="portal-proof-card ${hasAnySelected ? "is-selected" : ""} ${isRejected ? "is-rejected" : ""}" data-filename="${img.filename}">
        <div class="portal-proof-img-wrap">
          <img 
            src="${imgSrc || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400' viewBox='0 0 300 400'%3E%3Crect width='300' height='400' fill='%23161616'/%3E%3C/svg%3E"}" 
            alt="${img.filename}" 
            class="portal-proof-img" 
            id="proof-img-${img.filename.replace(/[^a-zA-Z0-9]/g, '_')}"
            data-filename="${img.filename}"
            data-blob-key="${blobKey}"
            loading="lazy"
          >
          
          ${isRejected ? `<span class="portal-card-rejected-banner">&times; Rejected</span>` : ""}

          <!-- Bottom-Right Corner Action Cluster (Reject + Note + Heart) -->
          <div class="portal-card-action-cluster">
            ${isPhotographerAuth() ? `
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

            <!-- Slide-out Note Button (slides out smoothly when photo is liked) -->
            <button 
              type="button" 
              class="portal-note-slide-btn ${hasAnySelected ? "is-visible" : ""} ${noteText ? "has-note" : ""}" 
              data-filename="${img.filename}"
              title="${noteText ? `Note: \"${noteText}\" (tap to edit)` : "Leave editing note (optional)"}"
              aria-label="Leave editing note"
            >
              <span class="note-pencil-icon">&#9998;</span>
              <span class="note-slide-label">${noteText ? "Note added" : "Leave note"}</span>
            </button>

            <!-- Heart Button (Toggles like for current tone) -->
            <button 
              type="button" 
              class="portal-select-heart ${isCurrentToneSelected ? "is-active" : ""}" 
              data-filename="${img.filename}"
              data-tone="${activeTone}"
              aria-label="${isCurrentToneSelected ? "Remove from selections" : "Select photo"}"
            >
              <svg class="heart-icon" viewBox="0 0 24 24" width="16" height="16">
                <path fill="${isCurrentToneSelected ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Pure Clean Footer: Filename on Left + Version Toggle Pills on Right -->
        <div class="portal-proof-footer">
          <span class="portal-proof-filename">${img.filename}</span>

          ${availableTones.length > 1 ? `
            <div class="portal-card-tone-pill" data-filename="${img.filename}">
              ${availableTones.map(toneKey => {
                const isSel = isToneSelected(img.filename, toneKey);
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
    const sectionsContainer = container.querySelector("#portal-sections-container");
    const emptyState = container.querySelector("#portal-empty-state");
    const tabAll = container.querySelector("#tab-show-all");
    const tabSel = container.querySelector("#tab-show-selected");
    const selCountEl = container.querySelector("#tab-selected-count");
    const quotaCountEl = container.querySelector("#quota-selected-count");
    const openReviewBtn = container.querySelector("#open-review-btn");
    const floatingCount = container.querySelector("#floating-count");
    const floatingToggle = container.querySelector("#floating-toggle-filter");
    const floatingReview = container.querySelector("#floating-review-btn");
    const backBtn = container.querySelector("#portal-back-btn");
    const editSetupBtn = container.querySelector("#portal-edit-setup-btn");

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        activeShootId = null;
        if (typeof window !== "undefined") {
          window.location.hash = "#/client-portal";
        }
        renderLandingScreen(container);
      });
    }

    if (editSetupBtn) {
      editSetupBtn.addEventListener("click", () => {
        if (typeof window !== "undefined") {
          window.location.hash = `#/client-portal/${shoot.id}/edit`;
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
      if (noteTitle) noteTitle.textContent = `Editing Note · ${filename}`;
      if (noteTextarea) {
        noteTextarea.value = getImageNote(filename);
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
        setImageNote(noteModalFilename, val);
        updateCardNoteButton(noteModalFilename);
        const cb = noteModalOnSaveCallback;
        closeNoteModal();
        if (cb) cb();
      });
    }

    if (noteClear) {
      noteClear.addEventListener("click", () => {
        if (!noteModalFilename) return;
        setImageNote(noteModalFilename, "");
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
        const note = getImageNote(filename);
        if (slideBtn) {
          slideBtn.classList.toggle("has-note", !!note);
          const label = slideBtn.querySelector(".note-slide-label");
          if (label) label.textContent = note ? "Note added" : "Leave note";
          slideBtn.title = note ? `Note: \"${note}\" (tap to edit)` : "Leave editing note (optional)";
        }
      }
    }

    const tabRej = container.querySelector("#tab-show-rejected");
    const tabRejCountEl = container.querySelector("#tab-rejected-count");
    const toggleHideRejBtn = container.querySelector("#toggle-hide-rejected");

    function updateUiCounters() {
      const count = selectedMap.size;
      const rejCount = rejectedSet.size;
      if (selCountEl) selCountEl.textContent = count;
      if (quotaCountEl) quotaCountEl.textContent = count;
      if (tabRejCountEl) tabRejCountEl.textContent = rejCount;
      if (floatingCount) floatingCount.textContent = `${count} Selected`;
      if (openReviewBtn) openReviewBtn.textContent = `Review (${count}) \u2192`;
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
      updateUiCounters();

      if (hideRejected || filterMode !== "all") {
        renderGalleryContent();
      }
      return isNowRejected;
    }

    // Toggle Selection for a specific (filename, tone) version
    function toggleSelect(filename, tone) {
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

      // Keep submission status and Cloud sync automatically up to date in real time
      const curStatus = loadSubmissionStatus(shoot.id);
      if (curStatus && curStatus.submitted) {
        saveSubmissionStatus(shoot.id, {
          submitted: true,
          savedAt: Date.now(),
          count: selectedMap.size
        });
        autoSyncSelectionsToCloud(shoot.id);
      }

      if (filterMode === "selected" || filterMode === "rejected" || hideRejected) {
        renderGalleryContent();
      }
    }

    // Update card appearance after selection, reject, or tone change
    function updateProofCard(filename) {
      const card = container.querySelector(`.portal-proof-card[data-filename="${filename}"]`);
      if (card) {
        const currentTone = getImageActiveTone(filename, shoot);
        const isCurrentToneSel = isToneSelected(filename, currentTone);
        const selectedTones = getSelectedTonesForFile(filename);
        const hasAny = selectedTones.length > 0;
        const isRej = isImageRejected(filename);

        card.classList.toggle("is-selected", hasAny);
        card.classList.toggle("is-rejected", isRej);

        const heart = card.querySelector(".portal-select-heart");
        if (heart) {
          heart.classList.toggle("is-active", isCurrentToneSel);
          const path = heart.querySelector("path");
          if (path) path.setAttribute("fill", isCurrentToneSel ? "currentColor" : "none");
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
        }

        // Toggle slide-out note button smoothly!
        const slideBtn = card.querySelector(".portal-note-slide-btn");
        if (slideBtn) {
          slideBtn.classList.toggle("is-visible", hasAny);
        }

        // Update tone buttons checkmarks
        card.querySelectorAll(".card-tone-btn").forEach(btn => {
          const t = btn.dataset.tone;
          const isTSelected = isToneSelected(filename, t);
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

        // Update heart state for the newly viewed tone
        const heart = card.querySelector(".portal-select-heart");
        const isCurrentToneSel = isToneSelected(filename, tone);
        if (heart) {
          heart.dataset.tone = tone;
          heart.classList.toggle("is-active", isCurrentToneSel);
          const path = heart.querySelector("path");
          if (path) path.setAttribute("fill", isCurrentToneSel ? "currentColor" : "none");
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
      showSelectedOnly = (filterMode === "selected");
      if (tabAll) tabAll.classList.toggle("is-active", filterMode === "all");
      if (tabSel) tabSel.classList.toggle("is-active", filterMode === "selected");
      if (tabRej) tabRej.classList.toggle("is-active", filterMode === "rejected");
      if (floatingToggle) {
        floatingToggle.textContent = filterMode === "selected" ? "Show All" : "View Selected";
      }
      renderGalleryContent();
    }

    if (tabAll) tabAll.addEventListener("click", () => setFilterMode("all"));
    if (tabSel) tabSel.addEventListener("click", () => setFilterMode("selected"));
    if (tabRej) tabRej.addEventListener("click", () => setFilterMode("rejected"));
    if (floatingToggle) floatingToggle.addEventListener("click", () => {
      setFilterMode(filterMode === "selected" ? "all" : "selected");
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

        // B. Heart selection click
        const heartBtn = e.target.closest(".portal-select-heart");
        if (heartBtn) {
          e.stopPropagation();
          const fn = heartBtn.dataset.filename;
          const tone = heartBtn.dataset.tone || getImageActiveTone(fn, shoot);
          toggleSelect(fn, tone);
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
            if (filterMode === "selected") {
              visibleList = shoot.images.filter(img => isFileSelected(img.filename));
            } else if (filterMode === "rejected") {
              visibleList = shoot.images.filter(img => isImageRejected(img.filename));
            } else if (hideRejected) {
              visibleList = shoot.images.filter(img => !isImageRejected(img.filename));
            } else {
              visibleList = [...(shoot.images || [])];
            }
            if (visibleList) visibleList.sort(naturalSortFilenames);
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
              isImageRejected
            );
          } else {
            toggleSelect(fn, currentTone);
          }
        }
      });
    }

    // Review Navigation
    if (openReviewBtn) {
      openReviewBtn.addEventListener("click", () => {
        location.hash = `#/client-portal/${shoot.id}/review`;
      });
    }
    if (floatingReview) {
      floatingReview.addEventListener("click", () => {
        location.hash = `#/client-portal/${shoot.id}/review`;
      });
    }

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        activeShootId = null;
        location.hash = "#/client-portal";
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
      <div class="portal-review-card" data-key="${key}" data-filename="${item.filename}" data-tone="${item.tone}">
        <div class="portal-review-img-wrap" data-filename="${item.filename}" data-tone="${item.tone}">
          <img 
            src="${resolvedSrc}" 
            alt="${item.filename} (${toneLabel})" 
            class="portal-review-img" 
            data-filename="${item.filename}"
            data-tone="${item.tone}"
            ${blobKey ? `data-blob-key="${blobKey}"` : ""}
            loading="lazy"
            onerror="if (this.src && !this.src.includes('proofs/test-client')) { this.src = 'proofs/test-client/' + (this.dataset.tone && (this.dataset.tone.includes('bw') || this.dataset.tone.includes('bnw')) ? 'bw' : (this.dataset.tone && this.dataset.tone.includes('faded') ? 'faded-bw' : 'colour')) + '/' + this.dataset.filename; }"
          >
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

  function renderShootReviewPage(container, shoot) {
    selectedMap = loadSelections(shoot.id);
    const selectedList = Array.from(selectedMap.values());
    selectedList.sort(naturalSortFilenames);
    const submissionStatus = loadSubmissionStatus(shoot.id);
    const isSubmitted = submissionStatus && submissionStatus.submitted;
    const savedGeneralNotes = loadGeneralNotes(shoot.id);

    container.innerHTML = `
      <div class="portal-review-page-wrap">
        <!-- Top Nav & Back Link -->
        <div class="portal-review-nav">
          <button type="button" class="portal-back-btn" id="review-back-btn">
            &larr; Back to Proofs Gallery
          </button>
          <div class="portal-review-quota-pill ${isSubmitted ? "is-submitted" : ""}" id="review-quota-pill">
            <span class="portal-status-dot"></span>
            <span id="review-quota-text">${isSubmitted ? `Selections Saved (${selectedList.length})` : `${selectedList.length} Selected`}</span>
          </div>
        </div>

        <!-- Monograph Editorial Header -->
        <header class="portal-review-header">
          <div class="portal-header-meta">
            <span>${shoot.clientName}</span>
            <span class="portal-meta-sep">&middot;</span>
            <span>${shoot.shootTitle}</span>
            <span class="portal-meta-sep">&middot;</span>
            <span>Final Selections Review</span>
          </div>
          <h1 class="portal-review-title">selected proofs</h1>
          <p class="portal-review-subtitle">
            ${selectedList.length === 0 
              ? "You haven't selected any photos yet." 
              : `Review your ${selectedList.length} deliverable variations below. Each chosen version (Colour, Black & White, or Faded B&W) is displayed as an individual image so you can review your exact deliverable files.`}
          </p>
        </header>

        ${selectedList.length === 0 ? `
          <div class="portal-empty-state">
            <p class="portal-empty-title">No selections chosen yet.</p>
            <p class="portal-empty-desc">Return to your proofs gallery and tap the heart icon on any photo to add it to your shortlist.</p>
            <button type="button" class="portal-enter-btn" id="empty-return-gallery-btn">Return to Proofs Gallery &rarr;</button>
          </div>
        ` : `
          ${(shoot.sections && shoot.sections.length > 1) ? `
            <!-- Visual Grid Grouped by Shoot Section / Look -->
            <div class="portal-review-sections-wrap">
              ${renderGroupedReviewSectionsHtml(shoot, selectedList)}
            </div>
          ` : `
            <!-- Flat Visual Grid of Individual Selected Variations -->
            <div class="portal-review-grid" id="portal-review-grid">
              ${selectedList.map(item => renderReviewCardHtml(item)).join("")}
            </div>
          `}

          <!-- Summary & Save Selections Section -->
          <div class="portal-review-save-section">
            <div class="portal-save-card">
              <div class="portal-save-card-header">
                <h2 class="portal-save-title">Save Client Selections</h2>
                <p class="portal-save-desc">
                  Save your chosen proof variations and editing notes. Once saved, Koray will review your selections and begin final retouching.
                </p>
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
      if (typeof window !== "undefined") {
        if (window.history && window.history.replaceState) {
          const cleanUrl = window.location.pathname + `#/client-portal/${shoot.id}`;
          window.history.replaceState(null, "", cleanUrl);
        } else {
          window.location.hash = `#/client-portal/${shoot.id}`;
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

    // Grid Delegation
    const grid = container.querySelector("#portal-review-grid");
    if (grid) {
      grid.addEventListener("click", (e) => {
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
            card.style.transition = "transform 0.25s var(--ease), opacity 0.25s var(--ease)";
            card.style.transform = "scale(0.85)";
            card.style.opacity = "0";
            setTimeout(() => {
              card.remove();
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
          const currentReviewList = Array.from(selectedMap.values());
          if (typeof window.openLightboxWithSelection === "function") {
            window.openLightboxWithSelection(
              shoot,
              fn,
              tone,
              (fileName, newTone) => {
                setItemTone(fileName, newTone);
              },
              (fileName, selTone) => {
                const k = makeKey(fileName, selTone);
                if (selectedMap.has(k)) selectedMap.delete(k);
                else {
                  const imgObj = shoot.images.find(i => i.filename === fileName);
                  selectedMap.set(k, {
                    id: k,
                    filename: fileName,
                    tone: selTone,
                    src: resolveImageSrc(imgObj, selTone)
                  });
                }
                saveSelections(shoot.id, selectedMap);
              },
              selectedMap,
              isToneSelected,
              getImageNote,
              setImageNote,
              (fileName, onSave) => openNote(fileName, onSave),
              getImageActiveTone,
              currentReviewList
            );
          }
        }
      });
    }

    function updateReviewPageCounters() {
      const selectedList = Array.from(selectedMap.values());
      const currentStatus = loadSubmissionStatus(shoot.id);
      const isSub = currentStatus && currentStatus.submitted;

      const quotaPill = container.querySelector("#review-quota-pill");
      const quotaText = container.querySelector("#review-quota-text");
      if (quotaPill) quotaPill.classList.toggle("is-submitted", !!isSub);
      if (quotaText) quotaText.textContent = isSub ? `Selections Saved (${selectedList.length})` : `${selectedList.length} Selected`;

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
          autoSyncSelectionsToCloud(shoot.id);
        }
      }

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

        const notesVal = generalNotesInput ? generalNotesInput.value.trim() : "";
        saveGeneralNotes(shoot.id, notesVal);

        saveSubmissionStatus(shoot.id, {
          submitted: true,
          savedAt: Date.now(),
          count: selectedMap.size
        });

        saveBtn.disabled = true;
        saveBtn.innerHTML = `Saving to Cloud...`;

        // Save to Firebase Cloud
        const cloudSaved = await saveSelectionsToCloud(shoot.id, selectedMap, itemNotes, notesVal);

        saveBtn.disabled = false;
        saveBtn.classList.add("is-saved");
        saveBtn.innerHTML = `&#10003; Update Saved Selections (${selectedMap.size})`;

        if (confirmBox) {
          confirmBox.style.display = "flex";
          const confirmText = confirmBox.querySelector(".portal-confirm-text");
          if (confirmText) {
            confirmText.innerHTML = `Your ${selectedMap.size} selections and editing notes have been saved directly to Koray.`;
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
      const slug = (location.hash || "").replace(/^#\/?/, "").split("/")[0];
      if (slug === "client-portal" && !location.hash.includes("/shoot") && !location.hash.includes("/review")) {
        let data = (e && e.detail && e.detail["client-portal"]) || (window._KH_HEADERS && window._KH_HEADERS["client-portal"]);
        if (!data) {
          try {
            const raw = localStorage.getItem("kh_header_client-portal");
            if (raw) data = JSON.parse(raw);
          } catch(err) {}
        }
        if (data && typeof window.updateLiveHeroBannerInDOM === "function") {
          window.updateLiveHeroBannerInDOM("client-portal", data);
        }
      }
    });
  }

})();
