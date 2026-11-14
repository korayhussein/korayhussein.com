/* ==========================================================
   Koray Hussein Photography — Master Photographer Studio
   Full Editorial Dashboard Page for Main Galleries, Sets, Splash & Testimonials
   British English: Colour, Customise, Organise
   ========================================================== */

(function() {
  "use strict";

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const PHOTOGRAPHER_AUTH_KEY = "kh_photographer_auth";
  const MASTER_PASSKEY = "Mezepo5633";
  const CUSTOM_MAIN_GALLERIES_KEY = "kh_custom_main_galleries";
  const CUSTOM_SETS_KEY = "kh_custom_sets_data";
  const CUSTOM_TESTIMONIALS_KEY = "kh_custom_testimonials";
  const CUSTOM_HEADERS_KEY = "kh_custom_headers";
  const SPLASH_STORAGE_KEY = "kh_splash_custom_config";
  const TYPOGRAPHY_STORAGE_KEY = "kh_site_typography_v1";
  const FEATURED_SETS_KEY = "kh_featured_sets";
  const CUSTOM_SERIES_LIST_KEY = "kh_custom_series_list";
  const GALLERY_NAMES_KEY = "kh_gallery_custom_names";

  const DEFAULT_TYPOGRAPHY = {
    globalScale: 100,      // % (80% - 140%)
    headersSize: 44,       // px (28px - 64px)
    subheadsSize: 24,      // px (18px - 36px)
    bodySize: 20,          // px (15px - 26px)
    metaSize: 12,          // px (9px - 18px)
    menuSize: 24,          // px (18px - 34px)
    tickerSize: 11.5       // px (9px - 16px)
  };

  const INFO_PAGES_CONFIG = [
    {
      slug: "book-me",
      name: "Book Me",
      tag: "london studio booking",
      defaultTitle: "book a studio shoot",
      defaultIntro: "Whether you're a new model looking to get signed or an experienced model looking to refresh your book, we'll be able to create the kind of studio images you're looking for.",
      defaultHeroImage: "photos/faq/Tara Wagner 1.jpg",
      defaultHeroImageMobile: "photos/black-and-white/004 Flavia Santiago 2.jpg",
      defaultHeroMobileAspect: "4 / 5",
      hasBookingTicker: true,
      defaultBookingTicker: "currently taking bookings for december and january",
      hasTravelTicker: true,
      defaultTravelEnabled: true,
      defaultTravelTicker: "upcoming travel: paris · 12–18 may",
      defaultTravelDates: [
        "paris · 12–18 may",
        "new york · 2–9 june",
        "milan · 16–22 june"
      ]
    },
    {
      slug: "about-me",
      name: "About Me",
      tag: "portrait & travel photographer · london",
      defaultTitle: "about me",
      defaultIntro: "I'm Koray Hussein, a portrait and travel photographer based in London, England.",
      defaultHeroImage: "photos/contact/2.jpg",
      defaultHeroImageMobile: "photos/contact/DSCF8633.jpg",
      defaultHeroMobileAspect: "4 / 5"
    },
    {
      slug: "faq",
      name: "FAQ",
      tag: "04 / QUESTIONS & ANSWERS",
      defaultTitle: "frequently asked questions",
      defaultIntro: "Here you'll find questions (and answers... obviously) which I've been asked either through social media Q&A sessions, emails, or on shoot days.",
      defaultHeroImage: "photos/faq/Tara Wagner 1.jpg",
      defaultHeroImageMobile: "photos/portfolio/001 Nyekachi Douglas 2.jpg",
      defaultHeroMobileAspect: "4 / 5"
    },
    {
      slug: "playlists",
      name: "Playlists",
      tag: "04 / SOUND & ATMOSPHERE",
      defaultTitle: "playlists",
      defaultIntro: "Music is the best way to set the mood for a shoot. I always try to have a calming playlist in the background to give off an easy-going atmosphere. The same goes whilst I'm editing. I want music that will help me focus but keep my head in a relaxed state so I can edit for longer sessions.",
      defaultHeroImage: "photos/playlists/header.jpg",
      defaultHeroImageMobile: "photos/studio/011 Amrita 1.jpg",
      defaultHeroMobileAspect: "4 / 5"
    },
    {
      slug: "testimonials",
      name: "Testimonials",
      tag: "words & experiences",
      defaultTitle: "testimonials",
      defaultIntro: "Kind words from agency represented models, actors, and creative collaborators over the years.",
      defaultHeroImage: "photos/testimonials/header.jpg",
      defaultHeroImageMobile: "photos/sets/sheyla/011_16.jpg",
      defaultHeroMobileAspect: "4 / 5"
    },
    {
      slug: "cancellations",
      name: "Cancellations & Alerts",
      tag: "priority notification list",
      defaultTitle: "cancellation notifications",
      defaultIntro: "Direct notifications for short-notice studio dates and last-minute openings.",
      defaultHeroImage: "photos/faq/Tara Wagner 1.jpg",
      defaultHeroImageMobile: "photos/black-and-white/004 Flavia Santiago 2.jpg",
      defaultHeroMobileAspect: "4 / 5"
    },
    {
      slug: "client-portal",
      name: "Client Portal",
      tag: "exclusive client area",
      defaultTitle: "client proofing & portal",
      defaultIntro: "Private proofing suites, client selection reviews, and custom shoots.",
      defaultHeroImage: "photos/contact/2.jpg",
      defaultHeroImageMobile: "photos/sets/melanie/005_15.jpg",
      defaultHeroMobileAspect: "4 / 5",
      defaultAccessCardLabel: "Private Shoot Access Code",
      defaultAccessPlaceholder: "Enter your shoot access code...",
      defaultAccessBtnText: "Enter Gallery →",
      defaultAccessHint: "Welcome to your private proofing gallery. Please enter your shoot access code to review, toggle tone variations, add editing notes, and select your favorite versions for final retouching.",
      defaultGuideTitle1: "Multi-Tone Variations",
      defaultGuideDesc1: "Every photo is available in Colour, Black & White, and Faded B&W. Switch baseline at the top or toggle below each photo.",
      defaultGuideTitle2: "Pick Multiple Versions",
      defaultGuideDesc2: "Tap the heart to select. You can choose both Colour and Black & White versions of any photo.",
      defaultGuideTitle3: "Leave Editing Notes",
      defaultGuideDesc3: "When you like an image, tap the note icon next to the heart to leave specific retouching requests."
    }
  ];

  const FIREBASE_CONFIG = {
    apiKey: (typeof window !== "undefined" && window.SETTINGS && window.SETTINGS.firebase && window.SETTINGS.firebase.apiKey) || "AIzaSyD0b76g_32uPjLpeezf3QSlTSbAEbSeXjs",
    projectId: (typeof window !== "undefined" && window.SETTINGS && window.SETTINGS.firebase && window.SETTINGS.firebase.projectId) || "korayhussein-proofing"
  };

  const MAIN_GALLERIES_CONFIG = [
    { key: "portfolio", name: "Main Portfolio", category: "Portfolio" },
    { key: "beauty", name: "Beauty", category: "Portraiture" },
    { key: "lingerie", name: "Lingerie", category: "Portraiture" },
    { key: "black-and-white", name: "Black & White", category: "Portraiture" },
    { key: "colour", name: "Colour", category: "Portraiture" },
    { key: "studio", name: "Studio", category: "Portraiture" },
    { key: "location", name: "Location", category: "Portraiture" },
    { key: "interior", name: "Interior", category: "Portraiture" },
    { key: "grids", name: "Grids", category: "Series" },
    { key: "smiling", name: "Smiling", category: "Series" },
    { key: "detail", name: "Detail", category: "Series" },
    { key: "london-england", name: "London, England", category: "Travel" },
    { key: "paris-france", name: "Paris, France", category: "Travel" },
    { key: "florence-italy", name: "Florence, Italy", category: "Travel" },
    { key: "north-cyprus", name: "North Cyprus", category: "Travel" },
    { key: "valencia-spain", name: "Valencia, Spain", category: "Travel" },
    { key: "venice-italy", name: "Venice, Italy", category: "Travel" }
  ];

  function getFirestoreDocUrl(docId) {
    return `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/client_shoots/${encodeURIComponent(docId)}?key=${FIREBASE_CONFIG.apiKey}`;
  }

  function isPhotographerAuthenticated() {
    try {
      return localStorage.getItem(PHOTOGRAPHER_AUTH_KEY) === "true";
    } catch (e) {
      return false;
    }
  }

  function setPhotographerAuth(authed) {
    try {
      if (authed) {
        localStorage.setItem(PHOTOGRAPHER_AUTH_KEY, "true");
      } else {
        localStorage.removeItem(PHOTOGRAPHER_AUTH_KEY);
      }
    } catch (e) {}
  }

  /* ---------------------------------------------------------
     Cross-Device Image Compressor (Converts File -> Data URL)
     --------------------------------------------------------- */
  async function fileToCompressedDataUrl(file, maxDim = 2500, quality = 0.90, maxChars = 900000) {
    if (!file) return "";

    // 0. Direct Pass-Through if file fits within allocated document budget
    const maxPassBytes = Math.floor((maxChars * 3) / 4);
    if (file.size && file.size <= maxPassBytes && (file.type === "image/jpeg" || file.type === "image/webp" || file.type === "image/png")) {
      try {
        const directDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result || "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(file);
        });
        if (directDataUrl && directDataUrl.length > 50 && directDataUrl.length <= maxChars) {
          return directDataUrl;
        }
      } catch (directErr) {}
    }

    function renderCanvasToDataUrl(canvas, q) {
      let dataUrl = canvas.toDataURL("image/jpeg", q);
      while (dataUrl.length > maxChars && q > 0.82) {
        q -= 0.02;
        dataUrl = canvas.toDataURL("image/jpeg", q);
      }
      return dataUrl;
    }

    // 1. Modern createImageBitmap (Hardware accelerated, decodes HEIC on iOS 17+, EXIF auto-oriented)
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
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(bmp, 0, 0, w, h);
          if (typeof bmp.close === "function") bmp.close();
          const dataUrl = renderCanvasToDataUrl(canvas, quality);
          if (dataUrl && dataUrl.length > 50) return dataUrl;
        }
      } catch (bmpErr) {}
    }

    // 2. Image element with URL.createObjectURL (Low memory, fast, standard web standard)
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
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = "high";
              ctx.drawImage(img, 0, 0, w, h);
              URL.revokeObjectURL(objectUrl);
              resolve(renderCanvasToDataUrl(canvas, quality));
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
                  ctx2.imageSmoothingEnabled = true;
                  ctx2.imageSmoothingQuality = "high";
                  ctx2.drawImage(img2, 0, 0, w, h);
                  resolve(renderCanvasToDataUrl(canvas, quality));
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

  async function fileToPortraitDataUrl(file, targetW = 600, targetH = 900, quality = 0.82) {
    if (!file) return "";

    // 1. Modern createImageBitmap with 2:3 crop
    if (typeof createImageBitmap === "function") {
      try {
        const bmp = await createImageBitmap(file);
        const targetAspect = targetW / targetH; // 2:3
        const sourceAspect = bmp.width / bmp.height;
        let sx, sy, sw, sh;
        if (sourceAspect > targetAspect) {
          sh = bmp.height;
          sw = bmp.height * targetAspect;
          sx = (bmp.width - sw) / 2;
          sy = 0;
        } else {
          sw = bmp.width;
          sh = bmp.width / targetAspect;
          sx = 0;
          sy = (bmp.height - sh) / 2;
        }
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, targetW, targetH);
          if (typeof bmp.close === "function") bmp.close();
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          if (dataUrl && dataUrl.length > 50) return dataUrl;
        }
      } catch (bmpErr) {}
    }

    // 2. ObjectURL fallback
    return new Promise((resolve) => {
      let objectUrl = "";
      try {
        objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              const targetAspect = targetW / targetH; // 2:3 = 0.6667
              const sourceAspect = img.width / img.height;
              let sx, sy, sw, sh;
              if (sourceAspect > targetAspect) {
                sh = img.height;
                sw = img.height * targetAspect;
                sx = (img.width - sw) / 2;
                sy = 0;
              } else {
                sw = img.width;
                sh = img.width / targetAspect;
                sx = 0;
                sy = (img.height - sh) / 2;
              }
              ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
              URL.revokeObjectURL(objectUrl);
              resolve(canvas.toDataURL("image/jpeg", quality));
              return;
            }
          } catch (err2) {}
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          resolve("");
        };
        img.onerror = () => {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          resolve("");
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

  /* ---------------------------------------------------------
     Universal Photo Uploader (Direct Cloudflare R2 on Vercel & Local Server Support)
     --------------------------------------------------------- */
  async function getImageDimensions(file) {
    if (typeof createImageBitmap === "function") {
      try {
        const bmp = await createImageBitmap(file);
        const dims = { w: bmp.width, h: bmp.height };
        if (typeof bmp.close === "function") bmp.close();
        return dims;
      } catch (e) {}
    }
    return new Promise((resolve) => {
      let objectUrl = "";
      try {
        objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          const dims = { w: img.naturalWidth || img.width || 1333, h: img.naturalHeight || img.height || 2000 };
          URL.revokeObjectURL(objectUrl);
          resolve(dims);
        };
        img.onerror = () => {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          resolve({ w: 1333, h: 2000 });
        };
        img.src = objectUrl;
      } catch (err) {
        if (objectUrl) {
          try { URL.revokeObjectURL(objectUrl); } catch(e4) {}
        }
        resolve({ w: 1333, h: 2000 });
      }
    });
  }

  async function uploadPhotosToCloudOrLocal(files, categoryKey) {
    // 1. Try Cloudflare R2 direct presigned upload (works seamlessly on Vercel & Production)
    try {
      const presignRes = await fetch("/api/r2-presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shootId: `gallery_${categoryKey}`,
          files: files.map(f => ({
            filename: f.name,
            tone: "colour",
            contentType: f.type || "image/jpeg"
          }))
        })
      });

      if (presignRes.ok) {
        const presignData = await presignRes.json();
        const items = presignData.items || [];
        if (items.length > 0) {
          const uploadedImages = [];
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const pInfo = items[i];
            if (pInfo && pInfo.uploadUrl) {
              try {
                const putRes = await fetch(pInfo.uploadUrl, {
                  method: "PUT",
                  headers: { "Content-Type": file.type || "image/jpeg" },
                  body: file
                });
                if (putRes.ok) {
                  const dims = await getImageDimensions(file);
                  uploadedImages.push({
                    src: pInfo.publicUrl,
                    title: file.name.replace(/\.[^.]+$/, ""),
                    w: dims.w,
                    h: dims.h,
                    slug: categoryKey,
                    filename: file.name
                  });
                }
              } catch (upErr) {
                console.warn("Direct R2 PUT error for:", file.name, upErr);
              }
            }
          }
          if (uploadedImages.length > 0) {
            return uploadedImages;
          }
        }
      }
    } catch (r2Err) {
      console.warn("R2 presign upload failed, attempting local server:", r2Err);
    }

    // 2. Try Local Python Server (/api/upload-gallery-photos or /api/add-photos-to-set)
    try {
      const formData = new FormData();
      formData.append("galleryKey", categoryKey);
      formData.append("slug", categoryKey);
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      const isSet = String(categoryKey).startsWith("set_");
      const endpoint = isSet ? "/api/add-photos-to-set" : "/api/upload-gallery-photos";
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const result = await res.json();
        if (result && result.success && result.images) {
          return result.images;
        }
      }
    } catch (localErr) {
      console.warn("Local server upload failed, falling back to client-side compression:", localErr);
    }

    // 3. Resilient Fallback: In-Browser Compressed Data URLs
    const compressedImages = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = await fileToCompressedDataUrl(file, 1600, 0.82);
      if (dataUrl) {
        const dims = await getImageDimensions(file);
        compressedImages.push({
          src: dataUrl,
          title: file.name.replace(/\.[^.]+$/, ""),
          w: dims.w,
          h: dims.h,
          slug: categoryKey,
          filename: file.name
        });
      }
    }
    return compressedImages;
  }

  /* ---------------------------------------------------------
     Direct Cloudflare R2 Single File Uploader
     Streams bit-for-bit uncompressed master photograph to R2
     --------------------------------------------------------- */
  async function uploadSingleFileToR2(file, folder = "headers", tone = "desktop") {
    if (!file) return null;
    try {
      const ext = (file.name && file.name.split('.').pop()) || 'jpg';
      const cleanFolder = String(folder || 'headers').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanTone = String(tone || 'desktop').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanFolder}_${cleanTone}_${Date.now()}.${ext}`;

      const presignRes = await fetch("/api/r2-presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shootId: cleanFolder,
          filename: filename,
          tone: cleanTone,
          contentType: file.type || "image/jpeg"
        })
      });

      if (!presignRes.ok) return null;
      const presignData = await presignRes.json();
      if (!presignData || !presignData.uploadUrl || !presignData.publicUrl) return null;

      const putRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file
      });

      if (putRes.ok) {
        return presignData.publicUrl;
      }
    } catch (e) {
      console.warn("Direct R2 upload failed:", e);
    }
    return null;
  }

  async function uploadHeaderFileToR2(file, slug, isMobile = false) {
    const cleanSlug = String(slug || 'page').replace(/[^a-zA-Z0-9_-]/g, '_');
    return uploadSingleFileToR2(file, "headers", `${cleanSlug}_${isMobile ? 'mobile' : 'desktop'}`);
  }

  /* ---------------------------------------------------------
     Data Management: Featured Sets & Custom Series
     --------------------------------------------------------- */
  function loadFeaturedSets() {
    try {
      const raw = localStorage.getItem(FEATURED_SETS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return ["bree", "asha", "diana"];
  }

  function saveFeaturedSets(slugs) {
    try {
      localStorage.setItem(FEATURED_SETS_KEY, JSON.stringify(slugs));
    } catch (e) {}

    fetch(getFirestoreDocUrl("featured_sets_config"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify({
        fields: {
          updatedAt: { integerValue: String(Date.now()) },
          featuredSlugsJson: { stringValue: JSON.stringify(slugs) }
        }
      })
    }).then(() => {
      if (typeof window.syncSiteDataFromCloud === "function") window.syncSiteDataFromCloud();
    }).catch(err => console.warn("Failed to patch featured sets to Firestore:", err));
  }

  async function syncFeaturedSetsFromCloud() {
    try {
      const res = await fetch(getFirestoreDocUrl("featured_sets_config"), { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
      if (!res.ok) return;
      const json = await res.json();
      if (!json || !json.fields || !json.fields.featuredSlugsJson) return;
      const slugs = JSON.parse(json.fields.featuredSlugsJson.stringValue);
      if (Array.isArray(slugs) && slugs.length > 0) {
        localStorage.setItem(FEATURED_SETS_KEY, JSON.stringify(slugs));
      }
    } catch (e) {}
  }

  function loadCustomSeriesList() {
    try {
      const raw = localStorage.getItem(CUSTOM_SERIES_LIST_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }

  function saveCustomSeriesList(list) {
    try {
      localStorage.setItem(CUSTOM_SERIES_LIST_KEY, JSON.stringify(list));
    } catch (e) {}

    fetch(getFirestoreDocUrl("series_galleries_config"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify({
        fields: {
          updatedAt: { integerValue: String(Date.now()) },
          seriesListJson: { stringValue: JSON.stringify(list) }
        }
      })
    }).then(() => {
      if (typeof window.syncSiteDataFromCloud === "function") window.syncSiteDataFromCloud();
    }).catch(err => console.warn("Failed to patch series list to Firestore:", err));
  }

  async function syncSeriesGalleriesFromCloud() {
    try {
      const res = await fetch(getFirestoreDocUrl("series_galleries_config"), { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
      if (!res.ok) return;
      const json = await res.json();
      if (!json || !json.fields || !json.fields.seriesListJson) return;
      const list = JSON.parse(json.fields.seriesListJson.stringValue);
      if (Array.isArray(list)) {
        localStorage.setItem(CUSTOM_SERIES_LIST_KEY, JSON.stringify(list));
      }
    } catch (e) {}
  }

  function loadGalleryCustomNames() {
    try {
      const raw = localStorage.getItem(GALLERY_NAMES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (e) {}
    return {};
  }

  function saveGalleryCustomNames(map) {
    try {
      localStorage.setItem(GALLERY_NAMES_KEY, JSON.stringify(map));
    } catch (e) {}

    fetch(getFirestoreDocUrl("gallery_names_config"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify({
        fields: {
          updatedAt: { integerValue: String(Date.now()) },
          namesJson: { stringValue: JSON.stringify(map) }
        }
      })
    }).then(() => {
      if (typeof window.syncSiteDataFromCloud === "function") window.syncSiteDataFromCloud();
    }).catch(err => console.warn("Failed to patch gallery names to Firestore:", err));
  }

  async function syncGalleryNamesFromCloud() {
    try {
      const res = await fetch(getFirestoreDocUrl("gallery_names_config"), { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
      if (!res.ok) return;
      const json = await res.json();
      if (!json || !json.fields || !json.fields.namesJson) return;
      const map = JSON.parse(json.fields.namesJson.stringValue);
      if (map && typeof map === "object") {
        localStorage.setItem(GALLERY_NAMES_KEY, JSON.stringify(map));
      }
    } catch (e) {}
  }

  function getSortKey(str) {
    return (str || "")
      .trim()
      .toLowerCase()
      .replace(/^(the|a|an)\s+/i, "")
      .trim();
  }

  function getFullGalleriesConfig() {
    const customNames = loadGalleryCustomNames();
    const customSeries = loadCustomSeriesList();

    // Natural alphabetical sort ignoring leading articles ("the", "a", "an")
    customSeries.sort((a, b) => {
      const nameA = customNames[a.slug || a.key] || a.title || a.name || "";
      const nameB = customNames[b.slug || b.key] || b.title || b.name || "";
      return getSortKey(nameA).localeCompare(getSortKey(nameB));
    });

    const customSeriesConfigs = customSeries.map(s => {
      const k = s.slug || s.key;
      const displayName = customNames[k] || (s.title ? (s.title.charAt(0).toUpperCase() + s.title.slice(1)) : (s.name || s.slug));
      return {
        key: k,
        name: displayName,
        category: "Series",
        isCustomSeries: true
      };
    });

    const baseConfigs = MAIN_GALLERIES_CONFIG.map(cfg => {
      if (customNames[cfg.key]) {
        return { ...cfg, name: customNames[cfg.key] };
      }
      return cfg;
    });

    const existingKeys = new Set(baseConfigs.map(c => c.key));
    const extra = customSeriesConfigs.filter(c => !existingKeys.has(c.key));
    return [...baseConfigs, ...extra];
  }

  /* ---------------------------------------------------------
     Data Management: Main Portfolio & Core Galleries
     --------------------------------------------------------- */
  let inMemoryMainGalleries = null;
  let inMemorySetsData = null;

  function loadCustomMainGalleries() {
    const siteData = window.SITE_DATA || {};
    const base = {};
    getFullGalleriesConfig().forEach(cfg => {
      base[cfg.key] = (siteData.galleries && siteData.galleries[cfg.key]) ? [...siteData.galleries[cfg.key]] : [];
    });

    if (inMemoryMainGalleries && typeof inMemoryMainGalleries === "object" && Object.keys(inMemoryMainGalleries).length > 0) {
      const hasAny = Object.values(inMemoryMainGalleries).some(arr => Array.isArray(arr) && arr.length > 0);
      if (hasAny) {
        return Object.assign({}, base, inMemoryMainGalleries);
      }
    }

    try {
      const raw = localStorage.getItem(CUSTOM_MAIN_GALLERIES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          const hasAny = Object.values(parsed).some(arr => Array.isArray(arr) && arr.length > 0);
          if (hasAny) {
            inMemoryMainGalleries = Object.assign({}, base, parsed);
            return inMemoryMainGalleries;
          }
        }
      }
    } catch (e) {}

    inMemoryMainGalleries = base;
    return base;
  }

  function saveCustomMainGalleries(galleriesMap) {
    inMemoryMainGalleries = galleriesMap;
    if (window.SITE_DATA && window.SITE_DATA.galleries) {
      Object.assign(window.SITE_DATA.galleries, galleriesMap);
    }

    try {
      localStorage.setItem(CUSTOM_MAIN_GALLERIES_KEY, JSON.stringify(galleriesMap));
    } catch (storageErr) {
      console.warn("Storage quota full for main galleries; persisted in-memory & sending to cloud:", storageErr);
    }

    // Persist to local Studio server (data.js)
    fetch("/api/save-main-galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ galleries: galleriesMap })
    }).catch(e => console.warn("Local server galleries sync notice:", e));

    fetch(getFirestoreDocUrl("main_galleries_config"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify({
        fields: {
          updatedAt: { integerValue: String(Date.now()) },
          galleriesJson: { stringValue: JSON.stringify(galleriesMap) }
        }
      })
    }).then(() => {
      if (typeof window.syncSiteDataFromCloud === "function") window.syncSiteDataFromCloud();
    }).catch((err) => {
      console.warn("Failed to patch main galleries to Firestore:", err);
    });
    return true;
  }

  async function syncMainGalleriesFromCloud() {
    try {
      const res = await fetch(getFirestoreDocUrl("main_galleries_config"), {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!res.ok) return;
      const json = await res.json();
      if (!json || !json.fields || !json.fields.galleriesJson) return;
      const cloudData = JSON.parse(json.fields.galleriesJson.stringValue);
      if (cloudData && typeof cloudData === "object" && Object.keys(cloudData).length > 0) {
        const hasAny = Object.values(cloudData).some(arr => Array.isArray(arr) && arr.length > 0);
        if (!hasAny) return;

        const siteData = window.SITE_DATA || {};
        const base = {};
        getFullGalleriesConfig().forEach(cfg => {
          base[cfg.key] = (siteData.galleries && siteData.galleries[cfg.key]) ? [...siteData.galleries[cfg.key]] : [];
        });

        inMemoryMainGalleries = Object.assign({}, base, cloudData);
        try {
          localStorage.setItem(CUSTOM_MAIN_GALLERIES_KEY, JSON.stringify(inMemoryMainGalleries));
        } catch (e) {}
        if (window.SITE_DATA && window.SITE_DATA.galleries) {
          Object.assign(window.SITE_DATA.galleries, inMemoryMainGalleries);
        }
      }
    } catch (e) {}
  }

  /* ---------------------------------------------------------
     Data Management: Sets & Galleries
     --------------------------------------------------------- */
  function loadCustomSetsData() {
    if (inMemorySetsData && Array.isArray(inMemorySetsData.setsList)) {
      return inMemorySetsData;
    }
    try {
      const raw = localStorage.getItem(CUSTOM_SETS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.setsList)) {
          inMemorySetsData = parsed;
          return inMemorySetsData;
        }
      }
    } catch (e) {}

    const siteData = window.SITE_DATA || {};
    const baseList = (siteData.setsList || []).map(s => ({ ...s }));
    const baseSets = {};
    const baseGalleries = {};

    baseList.forEach(s => {
      baseSets[s.slug] = (siteData.sets && siteData.sets[s.slug]) ? { ...siteData.sets[s.slug] } : { name: s.name, desc: s.desc, hero: s.hero, slug: s.slug };
      const gKey = `set:${s.slug}`;
      baseGalleries[gKey] = (siteData.galleries && siteData.galleries[gKey]) ? [...siteData.galleries[gKey]] : [];
    });

    inMemorySetsData = {
      setsList: baseList,
      sets: baseSets,
      galleries: baseGalleries
    };
    return inMemorySetsData;
  }

  function saveCustomSetsData(data) {
    inMemorySetsData = data;
    const validSlugs = new Set((data.setsList || []).map(s => s.slug));
    const validSetKeys = new Set((data.setsList || []).map(s => `set:${s.slug}`));

    if (window.SITE_DATA) {
      window.SITE_DATA.setsList = data.setsList;
      window.SITE_DATA.sets = { ...data.sets };
      Object.keys(window.SITE_DATA.sets || {}).forEach(k => {
        if (!validSlugs.has(k)) delete window.SITE_DATA.sets[k];
      });
      const cleanGalleries = {};
      Object.entries(window.SITE_DATA.galleries || {}).forEach(([k, v]) => {
        if (!k.startsWith("set:") || validSetKeys.has(k)) {
          cleanGalleries[k] = v;
        }
      });
      Object.assign(cleanGalleries, data.galleries);
      window.SITE_DATA.galleries = cleanGalleries;
    }

    // Persist directly to local Studio server (data.js on disk)
    fetch("/api/save-sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        setsList: data.setsList,
        sets: data.sets,
        galleries: data.galleries
      })
    }).catch(e => console.warn("Local server sets sync notice:", e));

    try {
      localStorage.setItem(CUSTOM_SETS_KEY, JSON.stringify(data));
    } catch (storageErr) {
      console.warn("Storage quota full for sets data; persisted in-memory & sending to cloud:", storageErr);
    }

    fetch(getFirestoreDocUrl("sets_config"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify({
        fields: {
          updatedAt: { integerValue: String(Date.now()) },
          setsJson: { stringValue: JSON.stringify(data) }
        }
      })
    }).then(() => {
      if (typeof window.syncSiteDataFromCloud === "function") window.syncSiteDataFromCloud();
    }).catch((err) => {
      console.warn("Failed to patch sets to Firestore:", err);
    });
    return true;
  }

  async function syncSetsFromCloud() {
    try {
      const res = await fetch(getFirestoreDocUrl("sets_config"), {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!res.ok) return;
      const json = await res.json();
      if (!json || !json.fields || !json.fields.setsJson) return;
      const cloudData = JSON.parse(json.fields.setsJson.stringValue);
      if (cloudData && Array.isArray(cloudData.setsList)) {
        inMemorySetsData = cloudData;
        try {
          localStorage.setItem(CUSTOM_SETS_KEY, JSON.stringify(cloudData));
        } catch (e) {}
        if (window.SITE_DATA) {
          window.SITE_DATA.setsList = cloudData.setsList;
          window.SITE_DATA.sets = { ...(window.SITE_DATA.sets || {}), ...cloudData.sets };
          window.SITE_DATA.galleries = { ...(window.SITE_DATA.galleries || {}), ...cloudData.galleries };
        }
      }
    } catch (e) {}
  }

  /* ---------------------------------------------------------
     Data Management: Testimonials
     --------------------------------------------------------- */
  function loadTestimonialsList() {
    try {
      const raw = localStorage.getItem(CUSTOM_TESTIMONIALS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}

    const defaultItems = (window.TESTIMONIALS_DATA && window.TESTIMONIALS_DATA.items) || [];
    return defaultItems.map(item => ({ ...item }));
  }

  function saveTestimonialsList(items) {
    try {
      localStorage.setItem(CUSTOM_TESTIMONIALS_KEY, JSON.stringify(items));
      if (window.TESTIMONIALS_DATA) {
        window.TESTIMONIALS_DATA.items = items;
      }

      fetch(getFirestoreDocUrl("testimonials_config"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({
          fields: {
            updatedAt: { integerValue: String(Date.now()) },
            itemsJson: { stringValue: JSON.stringify(items) }
          }
        })
      }).then(() => {
        if (typeof window.syncSiteDataFromCloud === "function") window.syncSiteDataFromCloud();
      }).catch((err) => {
        console.warn("Failed to patch testimonials to Firestore:", err);
      });
      return true;
    } catch (e) {
      console.warn("Failed to save testimonials:", e);
      return false;
    }
  }

  async function syncTestimonialsFromCloud() {
    try {
      const res = await fetch(getFirestoreDocUrl("testimonials_config"), {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!res.ok) return;
      const json = await res.json();
      if (!json || !json.fields || !json.fields.itemsJson) return;
      const cloudItems = JSON.parse(json.fields.itemsJson.stringValue);
      if (Array.isArray(cloudItems) && cloudItems.length > 0) {
        localStorage.setItem(CUSTOM_TESTIMONIALS_KEY, JSON.stringify(cloudItems));
        if (window.TESTIMONIALS_DATA) {
          window.TESTIMONIALS_DATA.items = cloudItems;
        }
      }
    } catch (e) {}
  }

  /* ---------------------------------------------------------
     Data Management: Splash Settings
     --------------------------------------------------------- */
  function loadSplashSettings() {
    let custom = null;
    try {
      const raw = localStorage.getItem(SPLASH_STORAGE_KEY);
      if (raw) custom = JSON.parse(raw);
    } catch (e) {}

    const landscape = (custom && custom.landscape) ||
                      (window.SETTINGS && window.SETTINGS.splashImageLandscape) ||
                      (window.SITE_DATA && window.SITE_DATA.site && (window.SITE_DATA.site.splashImageLandscape || window.SITE_DATA.site.splashImage)) ||
                      "photos/splash/001 Bree Colter 1.jpg";

    const portrait = (custom && custom.portrait) ||
                     (window.SETTINGS && window.SETTINGS.splashImagePortrait) ||
                     (window.SITE_DATA && window.SITE_DATA.site && window.SITE_DATA.site.splashImagePortrait) ||
                     "photos/portfolio/001 Nyekachi Douglas 2.jpg";

    const titleSizeDesktop = (custom && parseInt(custom.titleSizeDesktop, 10)) || 68;
    const titleSizeMobile = (custom && parseInt(custom.titleSizeMobile, 10)) || 44;

    const travelEnabled = (custom && typeof custom.travelEnabled === "boolean") ? custom.travelEnabled : undefined;
    const travelDates = (custom && Array.isArray(custom.travelDates)) ? custom.travelDates : undefined;
    const travelTicker = (custom && custom.travelTicker) || undefined;
    const bookingTicker = (custom && custom.bookingTicker) || undefined;

    return { landscape, portrait, titleSizeDesktop, titleSizeMobile, travelEnabled, travelDates, travelTicker, bookingTicker };
  }

  function saveSplashSettings(settings) {
    try {
      localStorage.setItem(SPLASH_STORAGE_KEY, JSON.stringify(settings));
      applySplashSettingsToDOM(settings);

      const dSize = parseInt(settings.titleSizeDesktop, 10) || 68;
      const mSize = parseInt(settings.titleSizeMobile, 10) || 44;
      const landscape = settings.landscape || "photos/splash/001 Bree Colter 1.jpg";
      const portrait = settings.portrait || "photos/portfolio/001 Nyekachi Douglas 2.jpg";

      const currentH = loadCustomHeadersConfig();
      const bData = (currentH && currentH["book-me"]) || {};
      const tEnabled = typeof settings.travelEnabled === "boolean" ? settings.travelEnabled : (typeof bData.travelEnabled === "boolean" ? bData.travelEnabled : true);
      const tDates = Array.isArray(settings.travelDates) ? settings.travelDates : (bData.travelDates || ["paris · 12–18 may", "new york · 2–9 june", "milan · 16–22 june"]);
      const tTicker = settings.travelTicker || tDates.join(" / ");
      const bTicker = settings.bookingTicker || bData.bookingTicker || "currently taking bookings for december and january";

      fetch(getFirestoreDocUrl("splash_config"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({
          fields: {
            landscape: { stringValue: landscape },
            portrait: { stringValue: portrait },
            titleSizeDesktop: { integerValue: String(dSize) },
            titleSizeMobile: { integerValue: String(mSize) },
            travelEnabled: { booleanValue: tEnabled },
            travelTicker: { stringValue: tTicker },
            travelDatesJson: { stringValue: JSON.stringify(tDates) },
            bookingTicker: { stringValue: bTicker },
            updatedAt: { integerValue: String(Date.now()) }
          }
        })
      }).then(() => {
        if (typeof window.syncSiteDataFromCloud === "function") window.syncSiteDataFromCloud();
      }).catch((err) => {
        console.warn("Failed to patch splash settings to Firestore:", err);
      });
      return true;
    } catch (e) {
      console.warn("Failed to save splash settings:", e);
      return false;
    }
  }

  async function syncSplashFromCloud() {
    try {
      const res = await fetch(getFirestoreDocUrl("splash_config"), {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!res.ok) return;
      const json = await res.json();
      if (!json || !json.fields) return;
      const f = json.fields;
      const s = {
        landscape: (f.landscape && f.landscape.stringValue) || "photos/splash/001 Bree Colter 1.jpg",
        portrait: (f.portrait && f.portrait.stringValue) || "photos/portfolio/001 Nyekachi Douglas 2.jpg",
        titleSizeDesktop: parseInt(f.titleSizeDesktop && (f.titleSizeDesktop.integerValue || f.titleSizeDesktop.stringValue), 10) || 68,
        titleSizeMobile: parseInt(f.titleSizeMobile && (f.titleSizeMobile.integerValue || f.titleSizeMobile.stringValue), 10) || 44
      };
      if (f.travelDatesJson) {
        try { s.travelDates = JSON.parse(f.travelDatesJson.stringValue); } catch(e){}
      }
      if (f.travelEnabled || f.travelDatesJson) {
        const isEn = f.travelEnabled ? (f.travelEnabled.booleanValue !== undefined ? f.travelEnabled.booleanValue : (f.travelEnabled.stringValue === "true")) : true;
        s.travelEnabled = isEn;
        if (typeof window.updateSplashTravelTicker === "function") {
          window.updateSplashTravelTicker(isEn, s.travelDates || (f.travelTicker && f.travelTicker.stringValue));
        }
      }
      if (f.bookingTicker) {
        s.bookingTicker = f.bookingTicker.stringValue;
        if (typeof window.updateSplashBookingTicker === "function") {
          window.updateSplashBookingTicker(s.bookingTicker);
        }
      }
      localStorage.setItem(SPLASH_STORAGE_KEY, JSON.stringify(s));
      applySplashSettingsToDOM(s);
      return s;
    } catch (e) {
      console.warn("Failed to sync splash settings from cloud:", e);
    }
  }

  function applySplashSettingsToDOM(settings) {
    if (!settings) return;
    const splashBg = document.getElementById("splash-bg");
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const isPortraitBg = isMobile || (window.innerHeight > window.innerWidth);
    if (splashBg) {
      const targetSrc = isPortraitBg ? (settings.portrait || "photos/portfolio/001 Nyekachi Douglas 2.jpg") : (settings.landscape || "photos/splash/001 Bree Colter 1.jpg");
      splashBg.style.backgroundImage = `url("${encodeURI(targetSrc)}")`;
    }

    const dSize = parseInt(settings.titleSizeDesktop, 10) || 68;
    const mSize = parseInt(settings.titleSizeMobile, 10) || 44;
    document.documentElement.style.setProperty("--splash-title-size-desktop", `${dSize}px`);
    document.documentElement.style.setProperty("--splash-title-size-mobile", `${mSize}px`);

    const titleEl = document.querySelector(".splash__title");
    if (titleEl) {
      const activeSize = isMobile ? mSize : dSize;
      titleEl.style.setProperty("font-size", `${activeSize}px`, "important");
    }
  }

  /* ---------------------------------------------------------
     Data Management: Site-Wide Typography Hierarchy (Option 2)
     --------------------------------------------------------- */
  function loadTypographySettings() {
    let custom = null;
    try {
      const raw = localStorage.getItem(TYPOGRAPHY_STORAGE_KEY);
      if (raw) custom = JSON.parse(raw);
    } catch (e) {}

    return {
      globalScale: (custom && typeof custom.globalScale === "number") ? custom.globalScale : DEFAULT_TYPOGRAPHY.globalScale,
      headersSize: (custom && typeof custom.headersSize === "number") ? custom.headersSize : DEFAULT_TYPOGRAPHY.headersSize,
      subheadsSize: (custom && typeof custom.subheadsSize === "number") ? custom.subheadsSize : DEFAULT_TYPOGRAPHY.subheadsSize,
      bodySize: (custom && typeof custom.bodySize === "number") ? custom.bodySize : DEFAULT_TYPOGRAPHY.bodySize,
      metaSize: (custom && typeof custom.metaSize === "number") ? custom.metaSize : DEFAULT_TYPOGRAPHY.metaSize,
      menuSize: (custom && typeof custom.menuSize === "number") ? custom.menuSize : DEFAULT_TYPOGRAPHY.menuSize,
      tickerSize: (custom && typeof custom.tickerSize === "number") ? custom.tickerSize : DEFAULT_TYPOGRAPHY.tickerSize
    };
  }

  function applyTypographyToDOM(settings) {
    if (!settings || typeof settings !== "object") return;
    const root = document.documentElement;
    const scale = (typeof settings.globalScale === "number" ? settings.globalScale : 100) / 100;
    root.style.setProperty("--typo-global-scale", String(scale));
    if (settings.headersSize) root.style.setProperty("--typo-headers-size", `${settings.headersSize}px`);
    if (settings.subheadsSize) root.style.setProperty("--typo-subheads-size", `${settings.subheadsSize}px`);
    if (settings.bodySize) root.style.setProperty("--typo-body-size", `${settings.bodySize}px`);
    if (settings.metaSize) root.style.setProperty("--typo-meta-size", `${settings.metaSize}px`);
    if (settings.menuSize) root.style.setProperty("--typo-menu-size", `${settings.menuSize}px`);
    if (settings.tickerSize) root.style.setProperty("--typo-ticker-size", `${settings.tickerSize}px`);
  }
  window.applyTypographyToDOM = applyTypographyToDOM;

  function saveTypographySettings(settings, pushToCloud = true) {
    try {
      localStorage.setItem(TYPOGRAPHY_STORAGE_KEY, JSON.stringify(settings));
      applyTypographyToDOM(settings);

      if (pushToCloud) {
        fetch(getFirestoreDocUrl("typography_config"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
          body: JSON.stringify({
            fields: {
              updatedAt: { integerValue: String(Date.now()) },
              typographyJson: { stringValue: JSON.stringify(settings) }
            }
          })
        }).catch(err => console.warn("Cloud typography save failed:", err));
      }
    } catch (e) {
      console.warn("Failed to save typography settings:", e);
    }
  }

  async function syncTypographyFromCloud() {
    try {
      const res = await fetch(getFirestoreDocUrl("typography_config"), {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!res.ok) return;
      const json = await res.json();
      if (!json || !json.fields || !json.fields.typographyJson) return;
      const cloudTypo = JSON.parse(json.fields.typographyJson.stringValue);
      if (cloudTypo && typeof cloudTypo === "object") {
        saveTypographySettings(cloudTypo, false);
        return cloudTypo;
      }
    } catch (e) {
      console.warn("Failed to sync typography from cloud:", e);
    }
  }

  /* ---------------------------------------------------------
     Data Management: Information Page Headers & Booking Ticker
     --------------------------------------------------------- */
  let inMemoryHeadersConfig = null;

  function loadCustomHeadersConfig() {
    let stored = null;
    if (inMemoryHeadersConfig && typeof inMemoryHeadersConfig === "object") {
      stored = inMemoryHeadersConfig;
    } else {
      try {
        const raw = localStorage.getItem(CUSTOM_HEADERS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            stored = parsed;
          }
        }
      } catch (e) {}
    }

    const merged = {};
    INFO_PAGES_CONFIG.forEach(cfg => {
      // 1. Get raw saved entry for this specific page if exists
      const saved = (stored && typeof stored[cfg.slug] === "object") ? stored[cfg.slug] : null;

      // Check if client-portal was accidentally linked to book-me
      const isAccidentallyLinkedToBookMe = (
        cfg.slug === "client-portal" && saved && (
          (stored && stored["book-me"] && saved === stored["book-me"]) ||
          (saved.slug === "book-me") ||
          (saved.title === "book a studio shoot") ||
          saved.bookingTicker != null ||
          saved.travelDates != null
        )
      );

      const entry = (saved && !isAccidentallyLinkedToBookMe) ? { ...saved } : {};

      entry.slug = cfg.slug;
      entry.name = cfg.name;
      entry.tag = entry.tag || cfg.tag || "";
      entry.title = entry.title || cfg.defaultTitle;
      entry.intro = entry.intro || cfg.defaultIntro;
      entry.heroImage = entry.heroImage || cfg.defaultHeroImage;
      entry.heroImageMobile = entry.heroImageMobile || cfg.defaultHeroImageMobile || entry.heroImage;
      entry.heroMobileAspect = entry.heroMobileAspect || cfg.defaultHeroMobileAspect || "4 / 5";

      if (cfg.hasBookingTicker) {
        entry.hasBookingTicker = true;
        entry.bookingTicker = entry.bookingTicker || cfg.defaultBookingTicker || "";
      } else {
        delete entry.hasBookingTicker;
        delete entry.bookingTicker;
      }

      if (cfg.hasTravelTicker) {
        entry.hasTravelTicker = true;
        if (typeof entry.travelEnabled !== "boolean") entry.travelEnabled = typeof cfg.defaultTravelEnabled === "boolean" ? cfg.defaultTravelEnabled : true;
        if (!Array.isArray(entry.travelDates) || !entry.travelDates.length) {
          entry.travelDates = Array.isArray(cfg.defaultTravelDates) ? [...cfg.defaultTravelDates] : ["paris · 12–18 may", "new york · 2–9 june", "milan · 16–22 june"];
        }
        entry.travelTicker = entry.travelDates.join(" / ");
      } else {
        delete entry.hasTravelTicker;
        delete entry.travelEnabled;
        delete entry.travelDates;
        delete entry.travelTicker;
      }

      if (cfg.slug === "client-portal") {
        entry.accessCardLabel = entry.accessCardLabel || cfg.defaultAccessCardLabel || "Private Shoot Access Code";
        entry.accessPlaceholder = entry.accessPlaceholder || cfg.defaultAccessPlaceholder || "Enter your shoot access code...";
        entry.accessBtnText = entry.accessBtnText || cfg.defaultAccessBtnText || "Enter Gallery →";
        entry.accessHint = entry.accessHint || cfg.defaultAccessHint || "";
        entry.guideTitle1 = entry.guideTitle1 || cfg.defaultGuideTitle1 || "Multi-Tone Variations";
        entry.guideDesc1 = entry.guideDesc1 || cfg.defaultGuideDesc1 || "";
        entry.guideTitle2 = entry.guideTitle2 || cfg.defaultGuideTitle2 || "Pick Multiple Versions";
        entry.guideDesc2 = entry.guideDesc2 || cfg.defaultGuideDesc2 || "";
        entry.guideTitle3 = entry.guideTitle3 || cfg.defaultGuideTitle3 || "Leave Editing Notes";
        entry.guideDesc3 = entry.guideDesc3 || cfg.defaultGuideDesc3 || "";
      }

      merged[cfg.slug] = entry;
    });

    inMemoryHeadersConfig = merged;
    return inMemoryHeadersConfig;
  }

  function applyHeadersConfigToLiveDOM(config) {
    if (!config || typeof config !== "object") return;

    function updateLiveBanner(wrap, pageCfg) {
      if (!wrap || !pageCfg) return;
      const imgBox = wrap.querySelector(".cinematic-hero-banner__img-box");
      const heroTag = wrap.querySelector(".cinematic-hero-tag");
      const heroTitle = wrap.querySelector(".cinematic-hero-title");
      const heroLead = wrap.querySelector(".cinematic-hero-lead");

      if (imgBox) {
        const mAspect = pageCfg.heroMobileAspect || "4 / 5";
        imgBox.style.setProperty("--hero-mobile-aspect", mAspect);

        const mSrc = pageCfg.heroImageMobile || pageCfg.heroMobileImage || pageCfg.heroImage || "";
        const dSrc = pageCfg.heroImage || "";
        const mobileSrcset = mSrc ? (mSrc.startsWith("data:") ? mSrc : encodeURI(mSrc)) : "";
        const desktopSrc = dSrc ? (dSrc.startsWith("data:") ? dSrc : encodeURI(dSrc)) : "";
        const existingImg = imgBox.querySelector("img");
        const altText = (existingImg && existingImg.alt) || pageCfg.title || "Hero banner";

        let picture = imgBox.querySelector("picture");
        if (!picture) {
          picture = document.createElement("picture");
          if (existingImg) {
            imgBox.insertBefore(picture, existingImg);
            picture.appendChild(existingImg);
          }
        }
        if (picture) {
          picture.innerHTML = `
            ${mobileSrcset ? `<source media="(max-width: 768px)" srcset="${mobileSrcset}">` : ""}
            <img src="${desktopSrc || mobileSrcset}" alt="${altText}" loading="eager">
          `;
        }
      }

      if (heroTag && pageCfg.tag) heroTag.textContent = pageCfg.tag;
      if (heroTitle && pageCfg.title) heroTitle.textContent = pageCfg.title;
      if (heroLead && (pageCfg.intro || pageCfg.subtitle)) {
        heroLead.textContent = pageCfg.intro || pageCfg.subtitle;
      }
    }

    if (config["about-me"]) {
      window.ABOUT_ME_DATA = window.ABOUT_ME_DATA || {};
      window.ABOUT_ME_DATA.header = { ...(window.ABOUT_ME_DATA.header || {}), ...config["about-me"] };
      if (window.ABOUT_ME_DATA.meta && config["about-me"].heroImage) {
        window.ABOUT_ME_DATA.meta.heroImage = config["about-me"].heroImage;
      }
      const aboutWrap = document.querySelector(".about-classic-wrap");
      updateLiveBanner(aboutWrap, config["about-me"]);
    }
    if (config["book-me"]) {
      window.BOOK_ME_DATA = window.BOOK_ME_DATA || {};
      window.BOOK_ME_DATA.header = { ...(window.BOOK_ME_DATA.header || {}), ...config["book-me"] };
      if (config["book-me"].bookingTicker) {
        window.BOOK_ME_DATA.bookingTicker = config["book-me"].bookingTicker;
      }
      if (typeof window.updateSplashBookingTicker === "function") {
        window.updateSplashBookingTicker(config["book-me"].bookingTicker);
      }
      if (typeof window.updateSplashTravelTicker === "function") {
        window.updateSplashTravelTicker(config["book-me"].travelEnabled, config["book-me"].travelDates || config["book-me"].travelTicker);
      }
      const liveTravelStamp = document.getElementById("header-travel-stamp");
      const liveTravelText = document.getElementById("header-travel-stamp-text");
      if (liveTravelStamp) {
        liveTravelStamp.style.display = config["book-me"].travelEnabled ? "inline-flex" : "none";
      }
      if (liveTravelText && typeof window.startTickerCarousel === "function") {
        window.startTickerCarousel("header-travel-stamp-text", config["book-me"].travelDates || config["book-me"].travelTicker, "upcoming travel: ");
      }
      const bmWrap = document.querySelector(".book-page-wrap");
      updateLiveBanner(bmWrap, config["book-me"]);
    }
    if (config["faq"]) {
      window.FAQ_DATA = window.FAQ_DATA || {};
      window.FAQ_DATA.header = { ...(window.FAQ_DATA.header || {}), ...config["faq"] };
      const faqWrap = document.querySelector(".faq-master-wrap");
      updateLiveBanner(faqWrap, config["faq"]);
    }
    if (config["playlists"]) {
      window.PLAYLISTS_DATA = window.PLAYLISTS_DATA || {};
      window.PLAYLISTS_DATA.header = { ...(window.PLAYLISTS_DATA.header || {}), ...config["playlists"] };
      const plWrap = document.querySelector(".pl-master-wrap");
      updateLiveBanner(plWrap, config["playlists"]);
    }
    if (config["cancellations"]) {
      if (window.CANCELLATIONS_DATA && window.CANCELLATIONS_DATA.loadCancellationsData) {
        const cData = window.CANCELLATIONS_DATA.loadCancellationsData();
        cData.header = { ...(cData.header || {}), ...config["cancellations"] };
        if (window.CANCELLATIONS_DATA.saveCancellationsData) {
          window.CANCELLATIONS_DATA.saveCancellationsData(cData);
        }
      }
      const cnWrap = document.querySelector(".cancellations-page-wrap");
      updateLiveBanner(cnWrap, config["cancellations"]);
    }
    if (config["testimonials"]) {
      window.TESTIMONIALS_DATA = window.TESTIMONIALS_DATA || {};
      window.TESTIMONIALS_DATA.header = { ...(window.TESTIMONIALS_DATA.header || {}), ...config["testimonials"] };
      const tmWrap = document.querySelector(".testimonials-page-wrap");
      updateLiveBanner(tmWrap, config["testimonials"]);
    }
    if (config["client-portal"]) {
      window.CLIENT_PORTAL_DATA = window.CLIENT_PORTAL_DATA || {};
      window.CLIENT_PORTAL_DATA.header = { ...(window.CLIENT_PORTAL_DATA.header || {}), ...config["client-portal"] };
      const portalWrap = document.querySelector(".portal-landing-wrap");
      if (portalWrap) {
        updateLiveBanner(portalWrap, config["client-portal"]);

        const cardLabel = portalWrap.querySelector(".portal-input-label");
        const cardInp = portalWrap.querySelector("#portal-code-input");
        const cardBtn = portalWrap.querySelector("#portal-enter-btn");
        const cardHint = portalWrap.querySelector(".portal-access-hint");
        const guideCols = portalWrap.querySelectorAll(".portal-guide-col");

        if (cardLabel && config["client-portal"].accessCardLabel) cardLabel.textContent = config["client-portal"].accessCardLabel;
        if (cardInp && config["client-portal"].accessPlaceholder) cardInp.placeholder = config["client-portal"].accessPlaceholder;
        if (cardBtn && config["client-portal"].accessBtnText) cardBtn.innerHTML = config["client-portal"].accessBtnText.replace(/&amp;rarr;/g, "&rarr;");
        if (cardHint && config["client-portal"].accessHint) cardHint.textContent = config["client-portal"].accessHint;

        if (guideCols.length >= 3) {
          if (config["client-portal"].guideTitle1) guideCols[0].querySelector("h4").textContent = config["client-portal"].guideTitle1;
          if (config["client-portal"].guideDesc1) guideCols[0].querySelector("p").textContent = config["client-portal"].guideDesc1;
          if (config["client-portal"].guideTitle2) guideCols[1].querySelector("h4").textContent = config["client-portal"].guideTitle2;
          if (config["client-portal"].guideDesc2) guideCols[1].querySelector("p").textContent = config["client-portal"].guideDesc2;
          if (config["client-portal"].guideTitle3) guideCols[2].querySelector("h4").textContent = config["client-portal"].guideTitle3;
          if (config["client-portal"].guideDesc3) guideCols[2].querySelector("p").textContent = config["client-portal"].guideDesc3;
        }
      }
    }
  }

  window._kh_activeInfoPageSlug = "book-me";

  function saveCustomHeadersConfig(config, activeSlug) {
    if (!config || typeof config !== "object") return false;
    inMemoryHeadersConfig = config;
    applyHeadersConfigToLiveDOM(config);

    // Save dedicated per-page keys safely to avoid quota overflow
    window._KH_HEADERS = window._KH_HEADERS || {};
    for (const [s, data] of Object.entries(config)) {
      if (data && typeof data === "object") {
        window._KH_HEADERS[s] = data;
        try { localStorage.setItem("kh_header_" + s, JSON.stringify(data)); } catch (e) {}
      }
    }

    // 1. Save directly to header_<slug> keeping heroImage AND heroImageMobile intact!
    const currentActive = activeSlug || window._kh_activeInfoPageSlug || (typeof activeInfoPageSlug !== "undefined" ? activeInfoPageSlug : null);
    const targetSlugs = currentActive ? [currentActive] : Object.keys(config);

    targetSlugs.forEach(slug => {
      const pageCfg = config[slug];
      if (!pageCfg) return;

      fetch(getFirestoreDocUrl("header_" + slug), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({
          fields: {
            updatedAt: { integerValue: String(Date.now()) },
            slug: { stringValue: slug },
            dataJson: { stringValue: JSON.stringify(pageCfg) }
          }
        })
      }).then(res => {
        if (!res.ok) {
          console.error("Firestore patch failed for header_" + slug, res.status);
        }
      }).catch(err => {
        console.warn("Failed to patch individual header doc for", slug, err);
      });
    });

    // 2. Also save to the global headers_config, keeping it lean (<10KB) by omitting large base64 data URLs
    // so headers_config NEVER breaches Firestore's 1MB ceiling.
    const leanConfig = {};
    for (const [k, v] of Object.entries(config)) {
      leanConfig[k] = { ...v };
      if (leanConfig[k].heroImage && leanConfig[k].heroImage.startsWith("data:") && leanConfig[k].heroImage.length > 5000) {
        delete leanConfig[k].heroImage;
      }
      if (leanConfig[k].heroImageMobile && leanConfig[k].heroImageMobile.startsWith("data:") && leanConfig[k].heroImageMobile.length > 5000) {
        delete leanConfig[k].heroImageMobile;
      }
    }

    fetch(getFirestoreDocUrl("headers_config"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify({
        fields: {
          updatedAt: { integerValue: String(Date.now()) },
          headersJson: { stringValue: JSON.stringify(leanConfig) }
        }
      })
    }).then(() => {
      window.dispatchEvent(new CustomEvent("kh_headers_updated", { detail: config }));
    }).catch(err => {
      console.warn("Failed to patch headers config to Firestore:", err);
    });

    return true;
  }

  async function syncHeadersFromCloud() {
    try {
      let mergedData = {};
      const res = await fetch(getFirestoreDocUrl("headers_config"), {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.fields && json.fields.headersJson) {
          mergedData = JSON.parse(json.fields.headersJson.stringValue) || {};
        }
      }

      // Fetch per-page dedicated documents
      const infoSlugs = ["book-me", "about-me", "faq", "playlists", "testimonials", "cancellations", "client-portal"];
      await Promise.allSettled(infoSlugs.map(async (slug) => {
        try {
          const docRes = await fetch(getFirestoreDocUrl("header_" + slug), { cache: "no-store" });
          if (!docRes.ok) return;
          const docJson = await docRes.json();
          if (docJson && docJson.fields && docJson.fields.dataJson) {
            const pageData = JSON.parse(docJson.fields.dataJson.stringValue);
            if (pageData && typeof pageData === "object") {
              mergedData[slug] = { ...(mergedData[slug] || {}), ...pageData };
            }
          }
        } catch(e) {}
      }));

      if (Object.keys(mergedData).length > 0) {
        inMemoryHeadersConfig = mergedData;
        try {
          localStorage.setItem(CUSTOM_HEADERS_KEY, JSON.stringify(mergedData));
        } catch (e) {}
        applyHeadersConfigToLiveDOM(mergedData);
      }
    } catch (e) {}
  }

  function getAllAvailablePortfolioImages() {
    const list = [];
    const seen = new Set();
    const siteData = window.SITE_DATA || {};

    if (siteData.galleries) {
      for (const [catName, catImages] of Object.entries(siteData.galleries)) {
        if (!Array.isArray(catImages)) continue;
        catImages.forEach(img => {
          if (!img || !img.src || seen.has(img.src)) return;
          seen.add(img.src);
          const w = img.w || 0;
          const h = img.h || 0;
          const isLandscape = w > h;
          list.push({
            src: img.src,
            title: img.title || catName,
            category: catName.replace(/^set:/, "set · "),
            isLandscape: isLandscape,
            aspect: isLandscape ? "16/9" : "2/3"
          });
        });
      }
    }

    if (siteData.setsList) {
      siteData.setsList.forEach(s => {
        if (s.hero && !seen.has(s.hero)) {
          seen.add(s.hero);
          list.push({
            src: s.hero,
            title: `${s.name} (Hero)`,
            category: "sets",
            isLandscape: (s.w || 0) > (s.h || 0),
            aspect: (s.w || 0) > (s.h || 0) ? "16/9" : "2/3"
          });
        }
      });
    }

    return list;
  }

  function showToast(message) {
    const old = document.querySelector(".kh-studio-toast");
    if (old) old.remove();

    const toast = document.createElement("div");
    toast.className = "kh-studio-toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("is-active");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("is-active");
      setTimeout(() => toast.remove(), 400);
    }, 2800);
  }

  /* ---------------------------------------------------------
     Main Photographer Studio Dashboard Page Renderer
     --------------------------------------------------------- */
  window.renderPhotographerDashboardPage = function(container) {
    if (!container) return;
    window.scrollTo({ top: 0, behavior: "instant" });

    // 1. Password Verification Screen if not logged in
    if (!isPhotographerAuthenticated()) {
      renderStudioLockScreen(container);
      return;
    }

    let activeTab = "galleries"; // 'galleries' | 'sets' | 'splash' | 'infopages' | 'testimonials'
    let activeGalleryKey = "portfolio";
    let editingSetSlug = null;
    let editingTestimonialIdx = null; // null = list view, -1 = new testimonial, >= 0 = editing existing

    // Background sync from cloud
    Promise.allSettled([
      syncMainGalleriesFromCloud(),
      syncGalleryNamesFromCloud(),
      syncFeaturedSetsFromCloud(),
      syncSeriesGalleriesFromCloud(),
      syncSetsFromCloud(),
      syncTestimonialsFromCloud(),
      syncSplashFromCloud(),
      syncHeadersFromCloud(),
      syncTypographyFromCloud(),
      (window.syncBookMeFromCloud ? window.syncBookMeFromCloud() : Promise.resolve()),
      (window.syncAboutMeFromCloud ? window.syncAboutMeFromCloud() : Promise.resolve()),
      (window.syncFaqFromCloud ? window.syncFaqFromCloud() : Promise.resolve()),
      (window.syncPlaylistsFromCloud ? window.syncPlaylistsFromCloud() : Promise.resolve()),
      (window.CANCELLATIONS_DATA && window.CANCELLATIONS_DATA.syncCancellationsFromCloud ? window.CANCELLATIONS_DATA.syncCancellationsFromCloud() : Promise.resolve())
    ]).then(() => {
      const mount = container.querySelector("#kh-studio-tab-mount");
      if (!mount) return;
      if (activeTab === "galleries") renderMainGalleriesManager(mount);
      else if (activeTab === "sets" && !editingSetSlug) renderSetsManager(mount);
      else if (activeTab === "splash") renderSplashManager(mount);
      else if (activeTab === "infopages" || activeTab === "headers" || activeTab === "cancellations" || activeTab === "testimonials") {
        if (activeTab === "testimonials") activeInfoPageSlug = "testimonials";
        else if (activeTab === "cancellations") activeInfoPageSlug = "cancellations";
        renderInfoPagesManager(mount);
      }
    });

    function renderView() {
      container.innerHTML = `
        <div class="kh-studio-wrap">
          <!-- Editorial Studio Header -->
          <header class="kh-studio-header">
            <div class="kh-studio-header-top">
              <span class="kh-studio-badge">&#9679; Master Photographer Studio &middot; Cloud Live</span>
              <div class="kh-studio-header-actions">
                <a href="#/client-portal" class="kh-studio-nav-btn">&larr; Client Proofing</a>
                <a href="#/portfolio" class="kh-studio-nav-btn">View Live Site &rarr;</a>
                <button type="button" class="kh-studio-logout-btn" id="studio-logout-btn">Lock Studio &times;</button>
              </div>
            </div>
            <h1 class="kh-studio-title">photographer studio</h1>
            <p class="kh-studio-lead">
              Master curation suite for Koray Hussein. Curate photographs across your main portfolio, manage exhibition sets, configure splash typography, curate editorial testimonials, and manage all information pages (copy, hero photographs, FAQs, playlists, booking tickers, and cancellation waitlist alerts).
            </p>

            <!-- Navigation Tabs -->
            <nav class="kh-studio-tabs" aria-label="Studio navigation">
              <button type="button" class="kh-studio-tab-btn ${activeTab === "galleries" ? "is-active" : ""}" data-tab="galleries">
                01 &middot; Main Galleries
              </button>
              <button type="button" class="kh-studio-tab-btn ${activeTab === "sets" ? "is-active" : ""}" data-tab="sets">
                02 &middot; Exhibition Sets
              </button>
              <button type="button" class="kh-studio-tab-btn ${activeTab === "splash" ? "is-active" : ""}" data-tab="splash">
                03 &middot; Splash &amp; Typography
              </button>
              <button type="button" class="kh-studio-tab-btn ${(activeTab === "infopages" || activeTab === "headers" || activeTab === "cancellations" || activeTab === "testimonials") ? "is-active" : ""}" data-tab="infopages">
                04 &middot; Information Pages
              </button>
            </nav>
          </header>

          <!-- Tab Content Mount -->
          <div class="kh-studio-content" id="kh-studio-tab-mount"></div>
        </div>
      `;

      // Bind Tab Switching
      container.querySelectorAll(".kh-studio-tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          activeTab = btn.dataset.tab;
          editingSetSlug = null;
          editingTestimonialIdx = null;
          renderView();
        });
      });

      // Bind Logout Button
      const logoutBtn = container.querySelector("#studio-logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
          setPhotographerAuth(false);
          renderStudioLockScreen(container);
        });
      }

      const mount = container.querySelector("#kh-studio-tab-mount");
      if (!mount) return;

      if (activeTab === "galleries") {
        renderMainGalleriesManager(mount);
      } else if (activeTab === "sets") {
        if (editingSetSlug) {
          renderSetEditor(mount, editingSetSlug);
        } else {
          renderSetsManager(mount);
        }
      } else if (activeTab === "splash") {
        renderSplashManager(mount);
      } else if (activeTab === "infopages" || activeTab === "headers" || activeTab === "cancellations" || activeTab === "testimonials") {
        if (activeTab === "testimonials") activeInfoPageSlug = "testimonials";
        else if (activeTab === "cancellations") activeInfoPageSlug = "cancellations";
        renderInfoPagesManager(mount);
      }
    }

    /* =========================================================
       LIVE GRID SORTABLE ENGINE (Real-Time Drag & Displacement)
       ========================================================= */
    function enableLiveGridSortable(container, itemSelector, onReorder) {
      if (!container) return;
      let draggedEl = null;

      function cleanUpDragState() {
        if (draggedEl) {
          draggedEl.classList.remove("is-dragging");
          draggedEl = null;
        }
        container.classList.remove("is-sorting-active");
        container.querySelectorAll(itemSelector).forEach(el => el.classList.remove("is-dragging", "is-drag-over"));
      }

      container.addEventListener("dragstart", (e) => {
        if (e.target.closest("button, input, textarea, a, select, .kh-set-item-actions")) {
          e.preventDefault();
          return;
        }
        const item = e.target.closest(itemSelector);
        if (!item || item.parentElement !== container) {
          e.preventDefault();
          return;
        }
        draggedEl = item;
        item.classList.add("is-dragging");
        container.classList.add("is-sorting-active");
        try {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", item.dataset.slug || item.dataset.src || item.dataset.idx || "");
        } catch (err) {}
      });

      container.addEventListener("dragover", (e) => {
        e.preventDefault();
        try { e.dataTransfer.dropEffect = "move"; } catch (err) {}
        if (!draggedEl) return;

        const targetItem = e.target.closest(itemSelector);
        if (!targetItem || targetItem === draggedEl || targetItem.parentElement !== container) return;

        const rect = targetItem.getBoundingClientRect();
        const isPastHalf = (e.clientY - rect.top) / rect.height > 0.5 || (e.clientX - rect.left) / rect.width > 0.5;
        container.insertBefore(draggedEl, isPastHalf ? targetItem.nextSibling : targetItem);
      });

      container.addEventListener("dragend", () => {
        const reordered = Array.from(container.querySelectorAll(itemSelector));
        cleanUpDragState();
        if (typeof onReorder === "function") {
          onReorder(reordered);
        }
      });

      container.addEventListener("drop", cleanUpDragState);
      container.addEventListener("dragleave", (e) => {
        if (!container.contains(e.relatedTarget)) {
          cleanUpDragState();
        }
      });
      window.addEventListener("dragend", cleanUpDragState);
    }

    /* ---------------------------------------------------------
       Image File Size Measurement & Optimization Engine
       --------------------------------------------------------- */
    window._khImageSizesCache = window._khImageSizesCache || new Map();

    function formatByteSize(bytes) {
      if (typeof bytes !== "number" || isNaN(bytes) || bytes <= 0) return "--";
      if (bytes < 1024 * 1024) {
        return `${Math.round(bytes / 1024)} KB`;
      }
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function getSizeStatus(bytes) {
      if (typeof bytes !== "number" || isNaN(bytes) || bytes <= 0) {
        return { cls: "is-unknown", label: "unknown", needsCompression: false };
      }
      if (bytes < 800 * 1024) {
        return { cls: "is-optimal", label: "optimal", needsCompression: false };
      }
      if (bytes < 1500 * 1024) {
        return { cls: "is-moderate", label: "good", needsCompression: false };
      }
      if (bytes < 3000 * 1024) {
        return { cls: "is-heavy", label: "heavy", needsCompression: true };
      }
      return { cls: "is-very-heavy", label: "very heavy", needsCompression: true };
    }

    async function fetchImageSizes(srcList) {
      const list = (srcList || []).filter(Boolean);
      const uncached = list.filter(src => !window._khImageSizesCache.has(src));

      if (uncached.length > 0) {
        try {
          const res = await fetch("/api/file-sizes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paths: uncached })
          });
          if (res.ok) {
            const json = await res.json();
            if (json && json.sizes) {
              Object.entries(json.sizes).forEach(([p, sz]) => {
                if (typeof sz === "number") {
                  window._khImageSizesCache.set(p, sz);
                }
              });
            }
          }
        } catch (e) {
          // Fallback: concurrent HEAD requests
          await Promise.allSettled(uncached.slice(0, 30).map(async src => {
            try {
              const hRes = await fetch(src, { method: "HEAD", cache: "default" });
              const cl = hRes.headers.get("content-length");
              if (cl) {
                window._khImageSizesCache.set(src, parseInt(cl, 10));
              }
            } catch (err) {}
          }));
        }
      }

      const result = new Map();
      list.forEach(src => {
        result.set(src, window._khImageSizesCache.get(src) || null);
      });
      return result;
    }

    async function updateGridFileSizes(gridEl, summaryEl) {
      if (!gridEl) return;
      const cards = Array.from(gridEl.querySelectorAll(".kh-photo-card"));
      const srcs = cards.map(c => c.dataset.src).filter(Boolean);
      if (!srcs.length) {
        if (summaryEl) summaryEl.innerHTML = `<span class="kh-weight-text">0 photos</span>`;
        return;
      }

      const sizes = await fetchImageSizes(srcs);
      let totalBytes = 0;
      let heavyCount = 0;

      cards.forEach(card => {
        const src = card.dataset.src;
        const pill = card.querySelector(".kh-photo-size-pill");
        const valEl = card.querySelector(".kh-size-val");
        const compressBtn = card.querySelector(".kh-photo-compress-btn");
        const bytes = sizes.get(src);

        if (pill && valEl) {
          if (typeof bytes === "number") {
            totalBytes += bytes;
            const status = getSizeStatus(bytes);
            pill.className = `kh-photo-size-pill ${status.cls}`;
            valEl.textContent = formatByteSize(bytes);
            pill.title = `File size: ${formatByteSize(bytes)} (${status.label})`;

            if (compressBtn) {
              if (status.needsCompression) {
                heavyCount++;
                compressBtn.style.display = "inline-flex";
                compressBtn.textContent = "⚡ Compress";
                compressBtn.onclick = async (e) => {
                  e.stopPropagation();
                  compressBtn.disabled = true;
                  compressBtn.textContent = "Compressing...";
                  try {
                    const cRes = await fetch("/api/compress-photo", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ src })
                    });
                    if (cRes.ok) {
                      const cJson = await cRes.json();
                      if (cJson.success && typeof cJson.newSize === "number") {
                        window._khImageSizesCache.set(src, cJson.newSize);
                        const dimEl = card.querySelector(".kh-photo-dims");
                        if (dimEl && cJson.w && cJson.h) {
                          dimEl.innerHTML = `${cJson.w}&times;${cJson.h}`;
                        }
                        const savedPercent = Math.round((1 - cJson.newSize / cJson.oldSize) * 100);
                        showToast(`Compressed! ${formatByteSize(cJson.oldSize)} → ${formatByteSize(cJson.newSize)} (${savedPercent}% saved) ✓`);
                        updateGridFileSizes(gridEl, summaryEl);
                        return;
                      }
                    }
                    showToast("Compression finished (file was already well-optimized)");
                  } catch (cErr) {
                    showToast("Compression could not be completed on server");
                  } finally {
                    compressBtn.disabled = false;
                  }
                };
              } else {
                compressBtn.style.display = "none";
              }
            }
          } else {
            valEl.textContent = "N/A";
          }
        }
      });

      if (summaryEl) {
        const formattedTotal = formatByteSize(totalBytes);
        const heavyNotice = heavyCount > 0
          ? ` · <span class="kh-heavy-tag">${heavyCount} heavy ${heavyCount === 1 ? 'image' : 'images'} (&gt;1.5MB)</span>`
          : ` · <span class="kh-optimal-tag">All images well-optimized</span>`;
        summaryEl.innerHTML = `
          <span class="kh-weight-icon">⚖</span>
          <span class="kh-weight-text">Total: <strong>${formattedTotal}</strong>${heavyNotice}</span>
        `;
      }
    }

    /* =========================================================
       TAB 1: MAIN PORTFOLIO & CORE GALLERIES MANAGER
       ========================================================= */
    function renderMainGalleriesManager(mount) {
      const galleriesMap = loadCustomMainGalleries();
      const allGalleriesConfig = getFullGalleriesConfig();
      const currentConfig = allGalleriesConfig.find(c => c.key === activeGalleryKey) || allGalleriesConfig[0];
      const currentImages = galleriesMap[activeGalleryKey] || [];
      const setsData = loadCustomSetsData();
      const availableSets = (setsData && Array.isArray(setsData.setsList) && setsData.setsList.length)
        ? setsData.setsList
        : ((window.SITE_DATA && Array.isArray(window.SITE_DATA.setsList)) ? window.SITE_DATA.setsList : []);

      mount.innerHTML = `
        <div class="kh-studio-sec">
          <div class="kh-sec-toolbar">
            <div>
              <h2 class="kh-sec-heading">${currentConfig.name} <span style="font-family:var(--font-sans); font-size:14px; font-weight:600; color:var(--text-muted); text-transform:uppercase;">&middot; ${currentImages.length} Photographs</span></h2>
              <p class="kh-sec-desc">
                Re-order photographs with sequence arrows, remove images, or upload additions directly to this gallery.
                <span class="kh-gallery-weight-pill" id="gallery-weight-summary">
                  <span class="kh-weight-icon">⚖</span> <span class="kh-weight-text">Checking size...</span>
                </span>
              </p>
            </div>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
              <a href="#/${activeGalleryKey === 'portfolio' ? 'portfolio' : activeGalleryKey}" class="kh-btn-secondary" style="text-decoration:none;">View Live &rarr;</a>
              <button type="button" class="kh-btn-secondary" id="rename-gallery-btn" title="Rename this gallery's display title">
                &#9998; Rename Gallery
              </button>
              ${currentConfig.isCustomSeries ? `
                <button type="button" class="kh-btn-danger" id="delete-series-gallery-btn" data-slug="${currentConfig.key}" title="Delete this custom Series Gallery" style="padding: 7px 12px; font-size: 12px;">
                  &times; Delete Series
                </button>
              ` : ''}
              <button type="button" class="kh-btn-secondary" id="create-series-gallery-btn" title="Create a new Series Gallery that will automatically insert itself in alphabetical order in the Series column of the Index">
                ✨ + New Series Gallery
              </button>
              <button type="button" class="kh-btn-primary" id="gallery-upload-trigger-btn">
                &#128247; + Upload Photos
              </button>
              <button type="button" class="kh-btn-secondary" id="gallery-pick-existing-btn">
                &#128444; Choose from Library
              </button>
              <input type="file" id="upload-gallery-photos-input" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/*" style="position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; z-index: -1;">
            </div>
          </div>

          <!-- Gallery Pill Selector Bar -->
          <div class="kh-gallery-selector-bar" aria-label="Select gallery to edit">
            ${allGalleriesConfig.map(cfg => {
              const count = (galleriesMap[cfg.key] || []).length;
              return `
                <button type="button" class="kh-gallery-pill-btn ${cfg.key === activeGalleryKey ? 'is-active' : ''}" data-gallery-key="${cfg.key}">
                  <span>${cfg.name}</span>
                  ${cfg.category === "Series" ? `<span style="font-size:9px; opacity:0.6; text-transform:uppercase; margin-left:3px; letter-spacing:0.04em;">series</span>` : ''}
                  <span class="kh-gallery-pill-count">${count}</span>
                </button>
              `;
            }).join("")}
          </div>

          <!-- Gallery Photographs Grid -->
          <div class="kh-gallery-photos-grid" id="kh-gallery-photos-grid">
            ${currentImages.length === 0 ? `<p class="kh-empty-state">No photographs in this gallery yet. Use "+ Upload Photos" above to add images.</p>` : ""}
            ${currentImages.map((img, idx) => {
              const linkedSlug = img.setSlug || "";
              const linkedSet = availableSets.find(s => s.slug === linkedSlug) || ((setsData.sets && setsData.sets[linkedSlug]) || null);
              const linkedName = linkedSet ? (linkedSet.name || linkedSlug) : linkedSlug;

              return `
              <div class="kh-photo-card" data-idx="${idx}" data-src="${img.src}" draggable="true">
                <div class="kh-photo-media">
                  <img src="${img.src}" alt="${img.title || 'Photo'}" loading="lazy" draggable="false">
                  <span class="kh-photo-order-badge">0${idx + 1}</span>
                  <span class="kh-photo-drag-pill" title="Drag to reorder sequence">⋮⋮</span>
                  ${linkedSlug ? `
                    <span class="kh-photo-set-pill" title="Linked to exhibition set '${escapeHtml(linkedName)}'">
                      <span style="font-size:10px;">🔗</span> SET: ${escapeHtml(linkedName)}
                    </span>
                  ` : ''}
                </div>
                <div class="kh-photo-meta-bar">
                  <span class="kh-photo-dims">${img.w ? `${img.w}&times;${img.h}` : ''}</span>
                  <div class="kh-photo-size-wrap">
                    <span class="kh-photo-size-pill" data-src="${img.src}">
                      <span class="kh-size-dot"></span>
                      <span class="kh-size-val">--</span>
                    </span>
                    <button type="button" class="kh-photo-compress-btn" data-src="${img.src}" title="Compress this image in-place (macOS sips)" style="display:none;">⚡ Compress</button>
                  </div>
                </div>
                <div class="kh-photo-set-linker">
                  <div class="kh-photo-set-label">
                    <span>&#128279; Exhibition Set</span>
                    ${linkedSlug ? `<span class="kh-photo-set-status-badge">LINKED</span>` : ''}
                  </div>
                  <select class="kh-photo-set-select ${linkedSlug ? 'is-linked' : ''}" data-idx="${idx}" aria-label="Link photograph to exhibition set">
                    <option value="">&mdash; None (Stand-alone) &mdash;</option>
                    ${availableSets.map(s => `
                      <option value="${s.slug}" ${linkedSlug === s.slug ? 'selected' : ''}>
                        ${escapeHtml(s.name || s.slug)}
                      </option>
                    `).join("")}
                  </select>
                </div>
                <div class="kh-photo-caption-editor">
                  <div class="kh-caption-input-row">
                    <label class="kh-caption-label">Model Name</label>
                    <input type="text" class="kh-photo-model-input" data-idx="${idx}" placeholder="e.g. Nyekachi Douglas" value="${escapeHtml(img.model || '')}">
                  </div>
                  <div class="kh-caption-input-row">
                    <label class="kh-caption-label">Movie Title</label>
                    <input type="text" class="kh-photo-movie-input" data-idx="${idx}" placeholder="e.g. In the Mood for Love (1994)" value="${escapeHtml(img.movie || '')}">
                  </div>
                </div>
                <div class="kh-photo-toolbar">
                  <div class="kh-photo-move-group">
                    <button type="button" class="kh-photo-action-btn" data-action="left" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''} title="Move earlier in sequence">&larr;</button>
                    <button type="button" class="kh-photo-action-btn" data-action="right" data-idx="${idx}" ${idx === currentImages.length - 1 ? 'disabled' : ''} title="Move later in sequence">&rarr;</button>
                  </div>
                  <button type="button" class="kh-photo-action-btn kh-photo-delete-btn" data-action="delete" data-idx="${idx}" title="Remove photograph from gallery">&times;</button>
                </div>
              </div>
              `;
            }).join("")}
          </div>
        </div>

        <div id="gallery-picker-modal-mount"></div>
      `;

      // Switch Active Gallery Pill
      mount.querySelectorAll(".kh-gallery-pill-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const targetBtn = e.target.closest(".kh-gallery-pill-btn") || btn;
          const key = targetBtn.dataset.galleryKey;
          if (key) {
            activeGalleryKey = key;
            renderMainGalleriesManager(mount);
            const activeEl = mount.querySelector(`.kh-gallery-pill-btn[data-gallery-key="${key}"]`);
            if (activeEl && typeof activeEl.scrollIntoView === "function") {
              activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            }
          }
        });
      });

      // Create New Series Gallery Handler
      const newSeriesBtn = mount.querySelector("#create-series-gallery-btn");
      if (newSeriesBtn) {
        newSeriesBtn.addEventListener("click", () => {
          const title = prompt("Enter title for the new Series Gallery (e.g. 'Shadows', 'Movement', 'Portraits in Motion'):");
          if (!title || !title.trim()) return;
          const cleanTitle = title.trim();
          const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          if (!slug) {
            alert("Please enter a valid title.");
            return;
          }

          const customList = loadCustomSeriesList();
          if (customList.some(s => s.slug === slug || s.key === slug) || MAIN_GALLERIES_CONFIG.some(c => c.key === slug)) {
            alert("A gallery or series with this title already exists.");
            return;
          }

          const newItem = {
            title: cleanTitle.toLowerCase(),
            slug: slug,
            key: slug,
            path: `/${slug}`
          };
          customList.push(newItem);
          saveCustomSeriesList(customList);

          const currentMap = loadCustomMainGalleries();
          if (!currentMap[slug]) {
            currentMap[slug] = [];
            saveCustomMainGalleries(currentMap);
          }

          showToast(`Series gallery "${cleanTitle}" created! Automatically sorted in alphabetical order in the Series column ✓`);
          activeGalleryKey = slug;
          renderMainGalleriesManager(mount);
        });
      }

      // Delete Custom Series Gallery Handler
      const delSeriesBtn = mount.querySelector("#delete-series-gallery-btn");
      if (delSeriesBtn) {
        delSeriesBtn.addEventListener("click", () => {
          const slug = delSeriesBtn.dataset.slug;
          if (!slug) return;
          if (!confirm(`Are you sure you want to delete the series gallery "${currentConfig.name}"?`)) return;

          let customList = loadCustomSeriesList();
          customList = customList.filter(s => (s.slug !== slug && s.key !== slug));
          saveCustomSeriesList(customList);

          const currentMap = loadCustomMainGalleries();
          delete currentMap[slug];
          saveCustomMainGalleries(currentMap);

          showToast(`Series gallery "${currentConfig.name}" deleted.`);
          activeGalleryKey = "grids";
          renderMainGalleriesManager(mount);
        });
      }

      // Rename Gallery Handler (Supports all core & custom series galleries)
      const renameBtn = mount.querySelector("#rename-gallery-btn");
      if (renameBtn) {
        renameBtn.addEventListener("click", () => {
          const currentName = currentConfig.name;
          const newName = prompt(`Enter new display title for "${currentName}":`, currentName);
          if (!newName || !newName.trim() || newName.trim() === currentName) return;
          const cleanName = newName.trim();

          // 1. If it's a custom series gallery, update in kh_custom_series_list
          const customSeries = loadCustomSeriesList();
          const foundSeries = customSeries.find(s => (s.slug === activeGalleryKey || s.key === activeGalleryKey));
          if (foundSeries) {
            foundSeries.title = cleanName.toLowerCase();
            saveCustomSeriesList(customSeries);
          }

          // 2. Also save to gallery custom names map for cloud sync & site-wide rendering
          const namesMap = loadGalleryCustomNames();
          namesMap[activeGalleryKey] = cleanName;
          saveGalleryCustomNames(namesMap);

          showToast(`Gallery renamed to "${cleanName}" ✓`);
          renderMainGalleriesManager(mount);
        });
      }

      // Link to Exhibition Set Handler
      mount.querySelectorAll(".kh-photo-set-select").forEach(sel => {
        sel.addEventListener("change", (e) => {
          e.stopPropagation();
          const idx = parseInt(sel.dataset.idx, 10);
          const list = galleriesMap[activeGalleryKey] || [];
          if (!list[idx]) return;
          const chosenSlug = sel.value.trim();
          if (chosenSlug) {
            list[idx].setSlug = chosenSlug;
            const targetSet = availableSets.find(s => s.slug === chosenSlug);
            const targetName = targetSet ? targetSet.name : chosenSlug;
            showToast(`Linked photograph to "${targetName}" set ✓`);
          } else {
            delete list[idx].setSlug;
            showToast("Set link removed from photograph ✓");
          }
          saveCustomMainGalleries(galleriesMap);
          renderMainGalleriesManager(mount);
        });
      });

      // Model Name Input Handler (The Blank Canvas Project & Curated Galleries)
      mount.querySelectorAll(".kh-photo-model-input").forEach(inp => {
        inp.addEventListener("click", e => e.stopPropagation());
        inp.addEventListener("mousedown", e => e.stopPropagation());
        inp.addEventListener("change", () => {
          const idx = parseInt(inp.dataset.idx, 10);
          const list = galleriesMap[activeGalleryKey] || [];
          if (!list[idx]) return;
          const val = inp.value.trim();
          if (val) {
            list[idx].model = val;
          } else {
            delete list[idx].model;
          }
          saveCustomMainGalleries(galleriesMap);
          showToast(`Model name saved: "${val || 'Cleared'}" ✓`);
        });
      });

      // Movie Title Input Handler (The Blank Canvas Project)
      mount.querySelectorAll(".kh-photo-movie-input").forEach(inp => {
        inp.addEventListener("click", e => e.stopPropagation());
        inp.addEventListener("mousedown", e => e.stopPropagation());
        inp.addEventListener("change", () => {
          const idx = parseInt(inp.dataset.idx, 10);
          const list = galleriesMap[activeGalleryKey] || [];
          if (!list[idx]) return;
          const val = inp.value.trim();
          if (val) {
            list[idx].movie = val;
          } else {
            delete list[idx].movie;
          }
          saveCustomMainGalleries(galleriesMap);
          showToast(`Movie title saved: "${val || 'Cleared'}" ✓`);
        });
      });

      // Photo Card Actions (Move Left / Right / Delete)
      mount.querySelectorAll(".kh-photo-action-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const action = btn.dataset.action;
          const idx = parseInt(btn.dataset.idx, 10);
          const list = galleriesMap[activeGalleryKey] || [];

          if (action === "left" && idx > 0) {
            const temp = list[idx];
            list[idx] = list[idx - 1];
            list[idx - 1] = temp;
            saveCustomMainGalleries(galleriesMap);
            renderMainGalleriesManager(mount);
          } else if (action === "right" && idx < list.length - 1) {
            const temp = list[idx];
            list[idx] = list[idx + 1];
            list[idx + 1] = temp;
            saveCustomMainGalleries(galleriesMap);
            renderMainGalleriesManager(mount);
          } else if (action === "delete") {
            if (confirm("Remove this photograph from this gallery?")) {
              list.splice(idx, 1);
              saveCustomMainGalleries(galleriesMap);
              showToast("Photograph removed ✓");
              renderMainGalleriesManager(mount);
            }
          }
        });
      });

      // Live Drag & Drop Reordering for Main Gallery Photographs
      const galleryContainer = mount.querySelector("#kh-gallery-photos-grid");
      enableLiveGridSortable(galleryContainer, ".kh-photo-card", (reorderedCards) => {
        const newSrcs = reorderedCards.map(c => c.dataset.src).filter(Boolean);
        const list = galleriesMap[activeGalleryKey] || [];
        const updatedList = [];
        newSrcs.forEach(src => {
          const img = list.find(i => i.src === src);
          if (img) updatedList.push(img);
        });
        list.forEach(i => {
          if (!updatedList.some(u => u.src === i.src)) updatedList.push(i);
        });
        galleriesMap[activeGalleryKey] = updatedList;
        saveCustomMainGalleries(galleriesMap);
        showToast("Photographs reordered & published ✓");
        renderMainGalleriesManager(mount);
      });

      // Programmatic Upload Button & Input Handler
      const uploadTriggerBtn = mount.querySelector("#gallery-upload-trigger-btn");
      const uploadInput = mount.querySelector("#upload-gallery-photos-input");
      const pickExistingBtn = mount.querySelector("#gallery-pick-existing-btn");

      if (uploadTriggerBtn && uploadInput) {
        uploadTriggerBtn.addEventListener("click", () => {
          uploadInput.value = "";
          uploadInput.click();
        });

        uploadInput.addEventListener("change", async () => {
          const files = Array.from(uploadInput.files || []);
          if (files.length === 0) return;

          uploadTriggerBtn.disabled = true;
          uploadTriggerBtn.textContent = "Uploading & Optimising...";
          showToast(`Uploading & optimising ${files.length} photograph${files.length > 1 ? "s" : ""} to "${currentConfig.name}"...`);

          try {
            const newImages = await uploadPhotosToCloudOrLocal(files, activeGalleryKey);
            if (newImages && newImages.length > 0) {
              const currentList = galleriesMap[activeGalleryKey] || [];
              galleriesMap[activeGalleryKey] = [...currentList, ...newImages];
              saveCustomMainGalleries(galleriesMap);
              showToast(`Added ${newImages.length} photograph${newImages.length > 1 ? "s" : ""} to "${currentConfig.name}" ✓`);
              renderMainGalleriesManager(mount);
            } else {
              throw new Error("No photographs could be uploaded.");
            }
          } catch (err) {
            console.error("Gallery upload error:", err);
            alert(`Error uploading photographs: ${err.message}`);
            uploadTriggerBtn.disabled = false;
            uploadTriggerBtn.textContent = "📷 + Upload Photos";
          }
        });
      }

      if (pickExistingBtn) {
        pickExistingBtn.addEventListener("click", () => {
          openGalleryLibraryPicker(mount, "gallery-picker-modal-mount", (selectedSrcs) => {
            const list = galleriesMap[activeGalleryKey] || [];
            selectedSrcs.forEach(src => {
              list.push({
                src: src,
                title: `${currentConfig.name} ${list.length + 1}`,
                w: 1333,
                h: 2000,
                slug: activeGalleryKey
              });
            });
            galleriesMap[activeGalleryKey] = list;
            saveCustomMainGalleries(galleriesMap);
            showToast(`Added ${selectedSrcs.length} photo${selectedSrcs.length > 1 ? "s" : ""} from library ✓`);
            renderMainGalleriesManager(mount);
          });
        });
      }

      // Asynchronously measure & populate image file sizes and total gallery weight
      updateGridFileSizes(
        mount.querySelector("#kh-gallery-photos-grid"),
        mount.querySelector("#gallery-weight-summary")
      );
    }

    /* =========================================================
       TAB 2: EXHIBITION SETS & GALLERIES MANAGER
       ========================================================= */
    function renderSetsManager(mount) {
      const setsData = loadCustomSetsData();
      const setsList = setsData.setsList || [];
      const featuredSlugs = loadFeaturedSets();

      mount.innerHTML = `
        <div class="kh-studio-sec">
          <div class="kh-sec-toolbar">
            <div>
              <h2 class="kh-sec-heading">Sets Exhibition Grid</h2>
              <p class="kh-sec-desc">Re-order sets display sequence on the Sets page, edit gallery photographs, or create a brand new exhibition set.</p>
            </div>
            <button type="button" class="kh-btn-primary" id="studio-create-set-btn">
              + Create New Set
            </button>
          </div>

          <div class="kh-sets-grid-list" id="kh-sets-list">
            ${setsList.length === 0 ? `<p class="kh-empty-state">No sets currently found. Click "+ Create New Set" above to start.</p>` : ""}
            ${setsList.map((set, idx) => {
              const count = (setsData.galleries && setsData.galleries[`set:${set.slug}`]) ? setsData.galleries[`set:${set.slug}`].length : (set.count || 0);
              const isFeatured = featuredSlugs.includes(set.slug);
              return `
                <div class="kh-set-item-card" data-slug="${set.slug}" data-idx="${idx}" draggable="true" title="Click to open &amp; edit '${escapeHtml(set.name)}' gallery">
                  <div class="kh-set-item-media">
                    <img src="${set.hero || 'photos/sets/bree/001_hero.jpg'}" alt="${escapeHtml(set.name)}" loading="lazy" draggable="false">
                    <span class="kh-set-item-count">${count} Photos</span>
                    <span class="kh-set-item-open-hint">&#9998; Edit Gallery</span>
                  </div>
                  <div class="kh-set-item-details">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                      <div class="kh-set-item-order-badge">0${idx + 1}</div>
                      <span class="kh-drag-handle" title="Drag to reorder set sequence">⋮⋮ Drag</span>
                    </div>
                    <h3 class="kh-set-item-title">${escapeHtml(set.name)}</h3>
                    <p class="kh-set-item-meta">${escapeHtml((set.desc || "").replace(/\n/g, " · "))}</p>
                    <div class="kh-set-item-actions">
                      <button type="button" class="kh-set-feature-btn ${isFeatured ? 'is-featured' : ''}" data-slug="${set.slug}" title="${isFeatured ? 'Click to unfeature from index column' : 'Click to feature under Sets column in Index'}">${isFeatured ? '★ Featured in Index' : '☆ Feature in Index'}</button>
                      <button type="button" class="kh-set-move-btn" data-action="up" data-idx="${idx}" ${idx === 0 ? "disabled" : ""} title="Move set earlier in sequence">&uarr; Up</button>
                      <button type="button" class="kh-set-move-btn" data-action="down" data-idx="${idx}" ${idx === setsList.length - 1 ? "disabled" : ""} title="Move set later in sequence">&darr; Down</button>
                      <button type="button" class="kh-btn-edit" data-slug="${set.slug}">&#9998; Edit Set &amp; Images</button>
                      <button type="button" class="kh-btn-danger" data-slug="${set.slug}">&times; Delete</button>
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;

      // Live Drag & Drop Reordering for Exhibition Sets
      const setsContainer = mount.querySelector("#kh-sets-list");
      enableLiveGridSortable(setsContainer, ".kh-set-item-card", async (reorderedCards) => {
        const newSlugs = reorderedCards.map(c => c.dataset.slug).filter(Boolean);
        const list = [...setsData.setsList];
        const updatedList = [];
        newSlugs.forEach(slug => {
          const item = list.find(s => s.slug === slug);
          if (item) updatedList.push(item);
        });
        list.forEach(s => {
          if (!updatedList.some(u => u.slug === s.slug)) updatedList.push(s);
        });
        setsData.setsList = updatedList;
        saveCustomSetsData(setsData);

        try {
          await fetch("/api/reorder-sets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slugs: newSlugs })
          });
        } catch (e) {}

        showToast("Exhibition sets sequence updated & saved ✓");
        renderSetsManager(mount);
      });

      // Move Up / Down Reordering
      mount.querySelectorAll(".kh-set-move-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const idx = parseInt(btn.dataset.idx, 10);
          const action = btn.dataset.action;
          const list = [...setsData.setsList];

          if (action === "up" && idx > 0) {
            const temp = list[idx];
            list[idx] = list[idx - 1];
            list[idx - 1] = temp;
          } else if (action === "down" && idx < list.length - 1) {
            const temp = list[idx];
            list[idx] = list[idx + 1];
            list[idx + 1] = temp;
          }

          setsData.setsList = list;
          saveCustomSetsData(setsData);

          try {
            await fetch("/api/reorder-sets", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slugs: list.map(s => s.slug) })
            });
          } catch (e) {}

          showToast("Sets order updated & saved ✓");
          renderSetsManager(mount);
        });
      });

      // Feature in Index Toggle
      mount.querySelectorAll(".kh-set-feature-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const slug = btn.dataset.slug;
          if (!slug) return;
          const currentFeatured = loadFeaturedSets();
          let nextFeatured;
          if (currentFeatured.includes(slug)) {
            nextFeatured = currentFeatured.filter(s => s !== slug);
            showToast(`Removed "${slug}" from Featured Sets in Index`);
          } else {
            nextFeatured = [...currentFeatured, slug];
            showToast(`Added "${slug}" to Featured Sets in Index ✓`);
          }
          saveFeaturedSets(nextFeatured);
          renderSetsManager(mount);
        });
      });

      // Edit Set - Click Card (Media, Title, Details) or Edit Button
      mount.querySelectorAll(".kh-set-item-card").forEach(card => {
        card.addEventListener("click", (e) => {
          if (e.target.closest("button, input, textarea, a, select, .kh-drag-handle, .kh-set-item-actions")) {
            return;
          }
          const slug = card.dataset.slug;
          if (slug) {
            editingSetSlug = slug;
            renderView();
          }
        });
      });

      mount.querySelectorAll(".kh-btn-edit").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          editingSetSlug = btn.dataset.slug;
          renderView();
        });
      });

      // Delete Set
      mount.querySelectorAll(".kh-btn-danger").forEach(btn => {
        btn.addEventListener("click", async () => {
          const slug = btn.dataset.slug;
          const target = setsData.setsList.find(s => s.slug === slug);
          if (!target) return;
          if (confirm(`Are you sure you want to permanently delete the set "${target.name}"?`)) {
            btn.disabled = true;
            btn.textContent = "Deleting...";

            setsData.setsList = setsData.setsList.filter(s => s.slug !== slug);
            delete setsData.sets[slug];
            delete setsData.galleries[`set:${slug}`];
            if (window.SITE_DATA) {
              if (window.SITE_DATA.sets) delete window.SITE_DATA.sets[slug];
              if (window.SITE_DATA.galleries) delete window.SITE_DATA.galleries[`set:${slug}`];
            }

            saveCustomSetsData(setsData);

            try {
              await fetch("/api/delete-set", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug })
              });
            } catch (e) {}

            showToast(`Deleted set "${target.name}" ✓`);
            renderSetsManager(mount);
          }
        });
      });

      // Create New Set
      const createBtn = mount.querySelector("#studio-create-set-btn");
      if (createBtn) {
        createBtn.addEventListener("click", () => {
          openCreateSetModal(mount, setsData);
        });
      }
    }

    function openCreateSetModal(mount, setsData) {
      let modalBox = document.getElementById("studio-set-modal-container");
      if (!modalBox) {
        modalBox = document.createElement("div");
        modalBox.id = "studio-set-modal-container";
        document.body.appendChild(modalBox);
      } else {
        document.body.appendChild(modalBox);
      }

      modalBox.innerHTML = `
        <div class="kh-modal-backdrop">
          <div class="kh-modal-window" style="max-width: 620px; max-height: 90vh; display:flex; flex-direction:column;">
            <div class="kh-modal-head">
              <h3>Create New Exhibition Set</h3>
              <button type="button" class="kh-modal-close" id="modal-cancel-btn">&times;</button>
            </div>
            <div class="kh-modal-body" style="overflow-y:auto; flex:1;">
              <div class="kh-form-field">
                <label>Set Name (e.g. Nyeka)</label>
                <input type="text" id="new-set-name" class="kh-input" placeholder="Model name or exhibition title..." required>
              </div>
              <div class="kh-form-row">
                <div class="kh-form-field">
                  <label>Location</label>
                  <input type="text" id="new-set-loc" class="kh-input" value="London, England" placeholder="e.g. London, England">
                </div>
                <div class="kh-form-field">
                  <label>Year</label>
                  <input type="text" id="new-set-year" class="kh-input" value="2026" placeholder="e.g. 2026">
                </div>
              </div>

              <div class="kh-form-field">
                <label>Upload Photographs (Select multiple)</label>
                <p style="font-size:12px; color:var(--text-muted); margin:0 0 8px 0;">Select photographs for this exhibition. You can click on any thumbnail below to choose the cover photo.</p>
                <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                  <button type="button" class="kh-btn-secondary" id="new-set-browse-btn">&#128194; Select Photographs...</button>
                  <span class="kh-upload-summary" id="new-set-upload-summary" style="margin:0; font-size:13px; color:#fff;">No photos selected yet</span>
                </div>
                <input type="file" id="new-set-files" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/*" style="position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; z-index: -1;">
              </div>

              <div id="new-set-preview-wrapper" style="display:none; margin-top:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <label style="margin:0; font-size:13px; font-weight:600; color:#fff;">Select Cover / Hero Photo</label>
                  <span id="new-set-cover-tag" style="font-size:12px; color:var(--color-gold, #c5a059); font-weight:600;">Cover: None selected</span>
                </div>
                <p style="font-size:12px; color:var(--text-muted); margin:0 0 10px 0;">Click any photo thumbnail to set it as the cover photo for the exhibition cards.</p>
                <div id="new-set-preview-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(95px, 1fr)); gap:10px; max-height:220px; overflow-y:auto; padding:8px; background:rgba(0,0,0,0.35); border-radius:6px; border:1px solid rgba(255,255,255,0.08);"></div>
              </div>
            </div>
            <div class="kh-modal-foot">
              <button type="button" class="kh-btn-secondary" id="modal-cancel-btn-2">Cancel</button>
              <button type="button" class="kh-btn-primary" id="modal-save-set-btn">Create &amp; Publish Set &rarr;</button>
            </div>
          </div>
        </div>
      `;

      const filesInput = modalBox.querySelector("#new-set-files");
      const summary = modalBox.querySelector("#new-set-upload-summary");
      const browseBtn = modalBox.querySelector("#new-set-browse-btn");
      const saveBtn = modalBox.querySelector("#modal-save-set-btn");
      const previewWrapper = modalBox.querySelector("#new-set-preview-wrapper");
      const previewGrid = modalBox.querySelector("#new-set-preview-grid");
      const coverTag = modalBox.querySelector("#new-set-cover-tag");

      let selectedFiles = [];
      let selectedHeroFilename = "";
      let createdBlobUrls = [];

      if (browseBtn && filesInput) {
        browseBtn.addEventListener("click", () => {
          filesInput.value = "";
          filesInput.click();
        });
      }

      function updateThumbnails() {
        if (!previewGrid || !previewWrapper) return;
        previewGrid.innerHTML = "";
        if (selectedFiles.length === 0) {
          previewWrapper.style.display = "none";
          return;
        }

        previewWrapper.style.display = "block";
        coverTag.textContent = selectedHeroFilename ? `Cover: ${selectedHeroFilename}` : "Click a photo to select cover";

        selectedFiles.forEach((f, idx) => {
          const isCover = f.name === selectedHeroFilename;
          const blobUrl = URL.createObjectURL(f);
          createdBlobUrls.push(blobUrl);

          const card = document.createElement("div");
          card.style.cssText = `
            position: relative;
            aspect-ratio: 3/4;
            border-radius: 6px;
            overflow: hidden;
            cursor: pointer;
            background: #111;
            border: 2px solid ${isCover ? "var(--color-gold, #c5a059)" : "rgba(255,255,255,0.12)"};
            box-shadow: ${isCover ? "0 0 10px rgba(197,160,89,0.45)" : "none"};
            transition: all 0.2s ease;
          `;

          card.innerHTML = `
            <img src="${blobUrl}" style="width:100%; height:100%; object-fit:cover; display:block;" alt="${f.name}">
            <div style="position:absolute; bottom:0; left:0; right:0; background:linear-gradient(transparent, rgba(0,0,0,0.85)); padding:4px 6px; font-size:10px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${idx + 1}. ${f.name}
            </div>
            ${isCover ? `
              <div style="position:absolute; top:4px; right:4px; background:var(--color-gold, #c5a059); color:#000; font-size:9px; font-weight:700; padding:2px 5px; border-radius:3px; letter-spacing:0.04em;">
                ★ COVER
              </div>
            ` : ""}
          `;

          card.addEventListener("click", () => {
            selectedHeroFilename = f.name;
            updateThumbnails();
          });

          previewGrid.appendChild(card);
        });
      }

      filesInput.addEventListener("change", () => {
        createdBlobUrls.forEach(url => URL.revokeObjectURL(url));
        createdBlobUrls = [];
        selectedFiles = Array.from(filesInput.files || []);
        summary.textContent = `${selectedFiles.length} photo${selectedFiles.length === 1 ? "" : "s"} selected`;

        if (selectedFiles.length > 0) {
          const heroMatch = selectedFiles.find(f => /hero|cover/i.test(f.name));
          selectedHeroFilename = heroMatch ? heroMatch.name : selectedFiles[0].name;
          updateThumbnails();
        } else {
          selectedHeroFilename = "";
          updateThumbnails();
        }
      });

      const close = () => {
        createdBlobUrls.forEach(url => URL.revokeObjectURL(url));
        createdBlobUrls = [];
        modalBox.innerHTML = "";
      };
      modalBox.querySelectorAll("#modal-cancel-btn, #modal-cancel-btn-2").forEach(b => b.addEventListener("click", close));

      saveBtn.addEventListener("click", async () => {
        const name = (modalBox.querySelector("#new-set-name").value || "").trim();
        const loc = (modalBox.querySelector("#new-set-loc").value || "").trim();
        const year = (modalBox.querySelector("#new-set-year").value || "").trim();

        if (!name) {
          alert("Please enter a Set Name.");
          return;
        }
        if (selectedFiles.length === 0) {
          alert("Please select at least one photograph for this set.");
          return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = "Publishing & Optimising Photos...";

        try {
          const formData = new FormData();
          formData.append("name", name);
          formData.append("location", loc);
          formData.append("year", year);
          if (selectedHeroFilename) {
            formData.append("hero_filename", selectedHeroFilename);
          }
          for (let i = 0; i < selectedFiles.length; i++) {
            formData.append("files", selectedFiles[i]);
          }

          const res = await fetch("/api/create-set", {
            method: "POST",
            body: formData
          });

          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error || `Server returned ${res.status}`);
          }

          const result = await res.json();
          if (result && result.success) {
            if (result.set) {
              setsData.setsList = setsData.setsList.filter(s => s.slug !== result.set.slug);
              setsData.setsList.unshift(result.set);
              setsData.sets[result.set.slug] = result.set;
              setsData.galleries[`set:${result.set.slug}`] = result.images || [];
              saveCustomSetsData(setsData);
            }
            showToast(`Created new set "${name}" with ${selectedFiles.length} photos ✓`);
            close();
            renderSetsManager(mount);
          } else {
            throw new Error(result.error || "Failed to create set");
          }
        } catch (err) {
          console.error("Upload error:", err);
          alert(`Error creating set: ${err.message}`);
          saveBtn.disabled = false;
          saveBtn.textContent = "Create & Publish Set →";
        }
      });
    }

    function renderSetEditor(mount, slug) {
      const setsData = loadCustomSetsData();
      const set = setsData.setsList.find(s => s.slug === slug);
      const galleryKey = `set:${slug}`;
      const images = (setsData.galleries && setsData.galleries[galleryKey]) ? [...setsData.galleries[galleryKey]] : [];

      if (!set) {
        editingSetSlug = null;
        renderSetsManager(mount);
        return;
      }

      // Parse current location and year cleanly
      const descLines = (set.desc || "").split("\n").map(l => l.trim()).filter(Boolean);
      let curLoc = descLines[0] || (set.desc || "");
      let curYear = descLines[1] || "";
      if (!curYear && curLoc.includes("·")) {
        const parts = curLoc.split("·").map(p => p.trim());
        curLoc = parts[0] || "";
        curYear = parts[1] || "";
      } else if (!curYear) {
        const ym = curLoc.match(/^(.*?)(?:,\s*|\s+)(\d{4})$/);
        if (ym) {
          curLoc = ym[1];
          curYear = ym[2];
        }
      }

      mount.innerHTML = `
        <div class="kh-studio-sec">
          <div class="kh-sec-toolbar">
            <div>
              <button type="button" class="kh-btn-inline-back" id="editor-back-btn">&larr; Back to All Sets</button>
              <h2 class="kh-sec-heading">Editing Set: <span style="font-family:var(--font-caslon); text-transform:none;">${set.name}</span></h2>
              <p class="kh-sec-desc">
                ${images.length} photos in gallery &middot; Set cover hero, upload additions, or remove images.
                <span class="kh-gallery-weight-pill" id="set-weight-summary">
                  <span class="kh-weight-icon">⚖</span> <span class="kh-weight-text">Checking size...</span>
                </span>
              </p>
            </div>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
              <button type="button" class="kh-btn-primary" id="set-upload-trigger-btn">
                &#128247; + Upload Photos
              </button>
              <button type="button" class="kh-btn-secondary" id="set-pick-existing-btn">
                &#128444; Choose from Library
              </button>
              <input type="file" id="editor-add-photos-input" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/*" style="position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; z-index: -1;">
            </div>
          </div>

          <div class="kh-card-box">
            <h3 class="kh-box-title">Set Details</h3>
            <div class="kh-form-row">
              <div class="kh-form-field">
                <label>Set Display Name</label>
                <input type="text" id="edit-set-name" class="kh-input" value="${set.name || ''}" placeholder="e.g. Nyeka">
              </div>
              <div class="kh-form-field">
                <label>Location</label>
                <input type="text" id="edit-set-loc" class="kh-input" value="${curLoc}" placeholder="e.g. London, England">
              </div>
              <div class="kh-form-field">
                <label>Year</label>
                <input type="text" id="edit-set-year" class="kh-input" value="${curYear}" placeholder="e.g. 2026">
              </div>
            </div>
            <div style="margin-top:14px; display:flex; justify-content:flex-end;">
              <button type="button" class="kh-btn-secondary" id="save-set-meta-btn">Save Details</button>
            </div>
          </div>

          <div class="kh-gallery-editor-grid" id="kh-gallery-editor-grid">
            ${images.length === 0 ? `<p class="kh-empty-state">This set has no photographs. Use "+ Add Photos to Set" above to add some.</p>` : ""}
            ${images.map((img, idx) => {
              const isHero = set.hero === img.src;
              return `
                <div class="kh-photo-card ${isHero ? "is-hero-card" : ""}" data-idx="${idx}" data-src="${img.src}" draggable="true">
                  <div class="kh-photo-media">
                    <img src="${img.src}" alt="Photo ${idx + 1}" loading="lazy" draggable="false">
                    <span class="kh-photo-order-badge">0${idx + 1}</span>
                    <span class="kh-photo-drag-pill" title="Drag to reorder sequence">⋮⋮</span>
                    ${isHero ? `<span class="kh-hero-indicator">&#9733; Hero Cover</span>` : ""}
                  </div>
                  <div class="kh-photo-meta-bar">
                    <span class="kh-photo-dims">${img.w ? `${img.w}&times;${img.h}` : ''}</span>
                    <div class="kh-photo-size-wrap">
                      <span class="kh-photo-size-pill" data-src="${img.src}">
                        <span class="kh-size-dot"></span>
                        <span class="kh-size-val">--</span>
                      </span>
                      <button type="button" class="kh-photo-compress-btn" data-src="${img.src}" title="Compress this image in-place (macOS sips)" style="display:none;">⚡ Compress</button>
                    </div>
                  </div>
                  <div class="kh-photo-caption-editor">
                    <div class="kh-caption-input-row">
                      <label class="kh-caption-label">Model Name</label>
                      <input type="text" class="kh-set-photo-model-input" data-idx="${idx}" placeholder="e.g. Nyekachi Douglas" value="${escapeHtml(img.model || '')}">
                    </div>
                  </div>
                  <div class="kh-photo-toolbar">
                    <button type="button" class="kh-photo-action-btn ${isHero ? "is-active" : ""}" data-action="set-hero" data-idx="${idx}" title="Set as Exhibition Cover">
                      ${isHero ? "&#10003; Cover" : "Make Cover"}
                    </button>
                    <div class="kh-photo-move-group">
                      <button type="button" class="kh-photo-action-btn" data-action="move-left" data-idx="${idx}" ${idx === 0 ? "disabled" : ""} title="Move photo left">&larr;</button>
                      <button type="button" class="kh-photo-action-btn" data-action="move-right" data-idx="${idx}" ${idx === images.length - 1 ? "disabled" : ""} title="Move photo right">&rarr;</button>
                    </div>
                    <button type="button" class="kh-photo-action-btn kh-photo-delete-btn" data-action="delete" data-idx="${idx}" title="Remove photo from set">&times;</button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <div id="set-picker-modal-mount"></div>
      `;

      mount.querySelector("#editor-back-btn").addEventListener("click", () => {
        editingSetSlug = null;
        renderView();
      });

      mount.querySelector("#save-set-meta-btn").addEventListener("click", async () => {
        const newName = (mount.querySelector("#edit-set-name").value || "").trim();
        const newLoc = (mount.querySelector("#edit-set-loc").value || "").trim();
        const newYear = (mount.querySelector("#edit-set-year").value || "").trim();
        if (!newName) {
          alert("Please enter a Set Name.");
          return;
        }
        const newDesc = newYear ? `${newLoc}\n${newYear}` : newLoc;

        set.name = newName;
        set.desc = newDesc;

        if (!setsData.sets) setsData.sets = {};
        if (!setsData.sets[slug]) setsData.sets[slug] = { ...set };
        setsData.sets[slug].name = newName;
        setsData.sets[slug].desc = newDesc;

        if (Array.isArray(setsData.setsList)) {
          const listItem = setsData.setsList.find(s => s.slug === slug);
          if (listItem) {
            listItem.name = newName;
            listItem.desc = newDesc;
          }
        }

        saveCustomSetsData(setsData);

        try {
          await fetch("/api/update-set", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, name: newName, location: newLoc, year: newYear })
          });
        } catch (e) {}

        showToast("Set details updated & published ✓");
        renderSetEditor(mount, slug);
      });

      // Set Photo Model Name Input Handler
      mount.querySelectorAll(".kh-set-photo-model-input").forEach(inp => {
        inp.addEventListener("click", e => e.stopPropagation());
        inp.addEventListener("mousedown", e => e.stopPropagation());
        inp.addEventListener("change", () => {
          const idx = parseInt(inp.dataset.idx, 10);
          const curImages = setsData.galleries[galleryKey] || [];
          if (!curImages[idx]) return;
          const val = inp.value.trim();
          if (val) {
            curImages[idx].model = val;
          } else {
            delete curImages[idx].model;
          }
          saveCustomSetsData(setsData);
          showToast(`Model name saved: "${val || 'Cleared'}" ✓`);
        });
      });

      mount.querySelectorAll(".kh-photo-action-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const action = btn.dataset.action;
          const idx = parseInt(btn.dataset.idx, 10);
          const curImages = setsData.galleries[galleryKey] || [];

          if (action === "set-hero") {
            if (curImages[idx]) {
              const chosenHero = curImages[idx].src;
              set.hero = chosenHero;
              setsData.sets[slug].hero = chosenHero;
              saveCustomSetsData(setsData);
              fetch("/api/set-cover", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug, heroSrc: chosenHero })
              }).then(r => r.json()).then(res => {
                if (res && res.success) console.log("Cover persisted on disk:", res);
              }).catch(e => console.warn("Notice: set-cover backend sync:", e));
              showToast("Cover hero photo updated & saved ✓");
              renderSetEditor(mount, slug);
            }
          } else if (action === "move-left" && idx > 0) {
            const temp = curImages[idx];
            curImages[idx] = curImages[idx - 1];
            curImages[idx - 1] = temp;
            saveCustomSetsData(setsData);
            renderSetEditor(mount, slug);
          } else if (action === "move-right" && idx < curImages.length - 1) {
            const temp = curImages[idx];
            curImages[idx] = curImages[idx + 1];
            curImages[idx + 1] = temp;
            saveCustomSetsData(setsData);
            renderSetEditor(mount, slug);
          } else if (action === "delete") {
            if (confirm("Remove this photograph from the set?")) {
              curImages.splice(idx, 1);
              set.count = curImages.length;
              setsData.sets[slug].count = curImages.length;
              if (set.hero && curImages.length > 0 && !curImages.some(img => img.src === set.hero)) {
                set.hero = curImages[0].src;
                setsData.sets[slug].hero = curImages[0].src;
              }
              saveCustomSetsData(setsData);
              showToast("Photo removed from set ✓");
              renderSetEditor(mount, slug);
            }
          }
        });
      });

      // Live Drag & Drop Reordering for Set Photographs
      const setPhotosContainer = mount.querySelector("#kh-gallery-editor-grid");
      enableLiveGridSortable(setPhotosContainer, ".kh-photo-card", (reorderedCards) => {
        const newSrcs = reorderedCards.map(c => c.dataset.src).filter(Boolean);
        const curImages = setsData.galleries[galleryKey] || [];
        const updatedImages = [];
        newSrcs.forEach(src => {
          const img = curImages.find(i => i.src === src);
          if (img) updatedImages.push(img);
        });
        curImages.forEach(i => {
          if (!updatedImages.some(u => u.src === i.src)) updatedImages.push(i);
        });
        setsData.galleries[galleryKey] = updatedImages;
        saveCustomSetsData(setsData);
        showToast("Set photographs reordered & published ✓");
        renderSetEditor(mount, slug);
      });

      const setUploadBtn = mount.querySelector("#set-upload-trigger-btn");
      const addInput = mount.querySelector("#editor-add-photos-input");
      const setPickExistingBtn = mount.querySelector("#set-pick-existing-btn");

      if (setUploadBtn && addInput) {
        setUploadBtn.addEventListener("click", () => {
          addInput.value = "";
          addInput.click();
        });

        addInput.addEventListener("change", async () => {
          const files = Array.from(addInput.files || []);
          if (files.length === 0) return;

          setUploadBtn.disabled = true;
          setUploadBtn.textContent = "Uploading & Optimising...";
          showToast(`Uploading & optimising ${files.length} photo${files.length > 1 ? "s" : ""} to "${set.name}"...`);

          try {
            const newImages = await uploadPhotosToCloudOrLocal(files, `set_${slug}`);
            if (newImages && newImages.length > 0) {
              const currentList = setsData.galleries[galleryKey] || [];
              setsData.galleries[galleryKey] = [...currentList, ...newImages];
              set.count = setsData.galleries[galleryKey].length;
              setsData.sets[slug].count = set.count;
              if (!set.hero && newImages.length > 0) {
                set.hero = newImages[0].src;
                setsData.sets[slug].hero = newImages[0].src;
              }
              saveCustomSetsData(setsData);
              showToast(`Added ${newImages.length} photograph${newImages.length > 1 ? "s" : ""} to "${set.name}" ✓`);
              renderSetEditor(mount, slug);
            } else {
              throw new Error("No photographs could be uploaded.");
            }
          } catch (err) {
            console.error("Add photos error:", err);
            alert(`Error uploading photographs: ${err.message}`);
            setUploadBtn.disabled = false;
            setUploadBtn.textContent = "📷 + Upload Photos";
          }
        });
      }

      if (setPickExistingBtn) {
        setPickExistingBtn.addEventListener("click", () => {
          openGalleryLibraryPicker(mount, "set-picker-modal-mount", (selectedSrcs) => {
            const curImages = setsData.galleries[galleryKey] || [];
            selectedSrcs.forEach(src => {
              curImages.push({
                src: src,
                title: `${set.name} ${curImages.length + 1}`,
                w: 1333,
                h: 2000,
                slug: slug
              });
            });
            set.count = curImages.length;
            setsData.sets[slug].count = curImages.length;
            if (!set.hero && curImages.length > 0) {
              set.hero = curImages[0].src;
              setsData.sets[slug].hero = curImages[0].src;
            }
            setsData.galleries[galleryKey] = curImages;
            saveCustomSetsData(setsData);
            showToast(`Added ${selectedSrcs.length} photo${selectedSrcs.length > 1 ? "s" : ""} from library ✓`);
            renderSetEditor(mount, slug);
          });
        });
      }

      // Asynchronously measure & populate image file sizes and total set weight
      updateGridFileSizes(
        mount.querySelector("#kh-gallery-editor-grid"),
        mount.querySelector("#set-weight-summary")
      );
    }

    function escapeAttr(str) {
      if (str == null) return "";
      return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function renderTravelStopsManager(mountEl, options) {
      const travelDates = Array.isArray(options.travelDates) && options.travelDates.length ?
        options.travelDates.map(s => String(s).trim()).filter(Boolean) :
        ["paris · 12–18 may", "new york · 2–9 june", "milan · 16–22 june"];
      let stops = [...travelDates];
      if (stops.length === 0) stops = ["paris · 12–18 may"];

      const onChange = typeof options.onChange === "function" ? options.onChange : () => {};

      function render() {
        mountEl.innerHTML = `
          <div class="kh-travel-stops-list" style="display:flex; flex-direction:column; gap:8px;">
            ${stops.map((stop, idx) => `
              <div class="kh-travel-stop-row" data-idx="${idx}" style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.12em; color:#d1b48c; background:rgba(209,180,140,0.12); border:1px solid rgba(209,180,140,0.3); border-radius:3px; padding:7px 10px; white-space:nowrap; min-width:68px; text-align:center;">Stop ${idx + 1}</span>
                <input type="text" class="kh-input kh-travel-stop-input" data-idx="${idx}" value="${escapeAttr(stop)}" placeholder="e.g. paris · 12–18 may" style="flex:1;">
                <button type="button" class="kh-btn-secondary kh-travel-stop-del-btn" data-idx="${idx}" title="Remove this stop" style="padding:6px 10px; font-size:11px; color:#ff7b72; border-color:rgba(255,123,114,0.35); min-width:32px;">✕</button>
              </div>
            `).join("")}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; flex-wrap:wrap; gap:8px;">
            <button type="button" class="kh-btn-secondary kh-add-stop-btn" style="font-size:11px; padding:7px 14px; border-color:rgba(209,180,140,0.4); color:#d1b48c;">
              + Add Another Travel Date &amp; Location
            </button>
            <span style="font-size:11px; color:var(--text-muted); font-style:italic;">
              Rotates every 2.8s in the ticker carousel
            </span>
          </div>

          <div style="margin-top:12px;">
            <span style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:var(--text-muted); font-family:var(--font-sans); display:block; margin-bottom:8px;">Quick Destination Presets (Click to add as stop):</span>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              ${[
                "paris · 12–18 may",
                "new york · 2–9 june",
                "milan · 16–22 june",
                "los angeles · 10–18 july",
                "tokyo & seoul · september 2026",
                "berlin & amsterdam · august 2026",
                "paris fashion week bookings open",
                "worldwide travel & editorial shoots on request"
              ].map(preset => `
                <button type="button" class="kh-gallery-pill-btn kh-stop-preset-pill" data-preset="${escapeAttr(preset)}" style="font-size:11px; padding:6px 12px;">
                  + ${preset}
                </button>
              `).join("")}
            </div>
          </div>
        `;

        mountEl.querySelectorAll(".kh-travel-stop-input").forEach(input => {
          input.addEventListener("input", (e) => {
            const i = parseInt(e.target.dataset.idx, 10);
            stops[i] = e.target.value;
            onChange([...stops]);
          });
        });

        mountEl.querySelectorAll(".kh-travel-stop-del-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const i = parseInt(btn.dataset.idx, 10);
            if (stops.length > 1) {
              stops.splice(i, 1);
            } else {
              stops = [""];
            }
            render();
            onChange([...stops]);
            showToast("Travel stop removed ✓");
          });
        });

        const addBtn = mountEl.querySelector(".kh-add-stop-btn");
        if (addBtn) {
          addBtn.addEventListener("click", () => {
            stops.push("");
            render();
            const inputs = mountEl.querySelectorAll(".kh-travel-stop-input");
            if (inputs.length) {
              inputs[inputs.length - 1].focus();
            }
            onChange([...stops]);
          });
        }

        mountEl.querySelectorAll(".kh-stop-preset-pill").forEach(pill => {
          pill.addEventListener("click", () => {
            const pVal = pill.dataset.preset;
            if (stops.length === 1 && !stops[0].trim()) {
              stops[0] = pVal;
            } else {
              stops.push(pVal);
            }
            render();
            onChange([...stops]);
            showToast(`Added travel stop: "${pVal}" ✓`);
          });
        });
      }

      render();
    }

    /* =========================================================
       TAB 3: SPLASH PAGE & TYPOGRAPHY MANAGER
       ========================================================= */
    function renderSplashManager(mount) {
      const splash = loadSplashSettings();
      const typo = loadTypographySettings();
      let autoSaveTimer = null;
      let typoAutoSaveTimer = null;

      const currentHeaders = loadCustomHeadersConfig();
      const currentTickerText = (currentHeaders && currentHeaders["book-me"] && currentHeaders["book-me"].bookingTicker) ||
        (window.BOOK_ME_DATA && window.BOOK_ME_DATA.bookingTicker) ||
        "currently taking bookings for december and january";
      const currentTravelEnabled = (currentHeaders && currentHeaders["book-me"] && typeof currentHeaders["book-me"].travelEnabled === "boolean") ?
        currentHeaders["book-me"].travelEnabled : (typeof splash.travelEnabled === "boolean" ? splash.travelEnabled : true);
      let currentTravelDates = (currentHeaders && currentHeaders["book-me"] && currentHeaders["book-me"].travelDates) ||
        splash.travelDates ||
        ["paris · 12–18 may", "new york · 2–9 june", "milan · 16–22 june"];
      if (typeof currentTravelDates === "string") {
        currentTravelDates = currentTravelDates.includes("/") ?
          currentTravelDates.split("/").map(s => s.trim()).filter(Boolean) : [currentTravelDates];
      }
      const currentTravelText = (currentTravelDates && currentTravelDates[0]) || "paris · 12–18 may";

      const desktopPresets = [
        { label: "52px · Subtle", size: 52 },
        { label: "68px · Classic", size: 68 },
        { label: "96px · Medium", size: 96 },
        { label: "130px · Large", size: 130 },
        { label: "168px · Extra Large", size: 168 },
        { label: "210px · Enormous", size: 210 }
      ];

      const mobilePresets = [
        { label: "32px · Compact", size: 32 },
        { label: "44px · Standard", size: 44 },
        { label: "58px · Large", size: 58 },
        { label: "76px · Grand", size: 76 },
        { label: "96px · Dramatic", size: 96 }
      ];

      mount.innerHTML = `
        <div class="kh-studio-sec">
          <div class="kh-sec-toolbar">
            <div>
              <h2 class="kh-sec-heading">Splash Screen &amp; Typography</h2>
              <p class="kh-sec-desc">Calibrate "koray hussein photography" word sizing across desktop and mobile in real-time, and choose orientation-optimised images.</p>
            </div>
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <a href="#/home" class="kh-preview-splash-link" id="view-live-splash-link" title="Open live splash screen">
                <span>&larr; View Live Splash</span>
              </a>
              <button type="button" class="kh-btn-primary" id="save-splash-settings-btn">
                Save Splash Settings &rarr;
              </button>
            </div>
          </div>

          <div class="kh-device-previews-grid">
            <div class="kh-device-frame kh-desktop-frame">
              <div class="kh-device-header">
                <span class="kh-device-label">Desktop &middot; Landscape Orientation</span>
                <span class="kh-device-res" id="desktop-size-readout">${splash.titleSizeDesktop}px title</span>
              </div>
              <div class="kh-device-screen" id="desktop-preview-screen">
                <div class="kh-virtual-canvas kh-virtual-canvas--desktop" id="desktop-virtual-canvas" style="background-image:url('${encodeURI(splash.landscape)}');">
                  <div class="kh-preview-overlay"></div>
                  <div class="kh-preview-content">
                    <h1 class="splash__title" id="desktop-preview-title" style="font-size:${splash.titleSizeDesktop}px !important; line-height:1.1; max-width:92vw;">
                      koray hussein photography
                    </h1>
                  </div>
                  <div class="splash__tickers-cluster" style="position:absolute; bottom:28px; left:50%; transform:translateX(-50%); pointer-events:none; z-index:4; display:flex; gap:10px; flex-wrap:wrap; justify-content:center; max-width:90%;">
                    <div class="splash__booking-ticker" style="font-size:11px; padding:6px 14px; gap:8px;">
                      <span class="splash__ticker-icon" style="font-size:10px;">&#10022;</span>
                      <span class="splash__ticker-text" id="splash-preview-booking-text-d">${currentTickerText}</span>
                    </div>
                    <div class="splash__booking-ticker splash__booking-ticker--travel" id="splash-preview-travel-pill-d" style="font-size:11px; padding:6px 14px; gap:8px; display:${currentTravelEnabled ? 'inline-flex' : 'none'};">
                      <span class="splash__ticker-icon splash__ticker-icon--travel" style="font-size:11px;">&#9992;&#xFE0E;</span>
                      <span class="splash__ticker-text" id="splash-preview-travel-text-d">upcoming travel: ${currentTravelText}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="kh-device-footer">
                <button type="button" class="kh-btn-secondary" id="pick-landscape-btn">Choose Landscape Image</button>
                <button type="button" class="kh-btn-secondary" id="upload-landscape-trigger-btn">Upload Photo</button>
                <input type="file" id="upload-landscape-input" accept="image/jpeg,image/png,image/webp,image/heic,image/*" style="position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; z-index: -1;">
              </div>
            </div>

            <div class="kh-device-frame kh-mobile-frame">
              <div class="kh-device-header">
                <span class="kh-device-label">Mobile &middot; Portrait Orientation</span>
                <span class="kh-device-res" id="mobile-size-readout">${splash.titleSizeMobile}px title</span>
              </div>
              <div class="kh-device-screen" id="mobile-preview-screen">
                <div class="kh-virtual-canvas kh-virtual-canvas--mobile" id="mobile-virtual-canvas" style="background-image:url('${encodeURI(splash.portrait)}');">
                  <div class="kh-preview-overlay"></div>
                  <div class="kh-preview-content">
                    <h1 class="splash__title" id="mobile-preview-title" style="font-size:${splash.titleSizeMobile}px !important; line-height:1.15; max-width:92vw;">
                      koray hussein photography
                    </h1>
                  </div>
                  <div class="splash__tickers-cluster" style="position:absolute; bottom:20px; left:50%; transform:translateX(-50%); pointer-events:none; z-index:4; display:flex; gap:8px; flex-wrap:wrap; justify-content:center; max-width:90%;">
                    <div class="splash__booking-ticker" style="font-size:10px; padding:5px 12px; gap:6px;">
                      <span class="splash__ticker-icon" style="font-size:9px;">&#10022;</span>
                      <span class="splash__ticker-text" id="splash-preview-booking-text-m">${currentTickerText}</span>
                    </div>
                    <div class="splash__booking-ticker splash__booking-ticker--travel" id="splash-preview-travel-pill-m" style="font-size:10px; padding:5px 12px; gap:6px; display:${currentTravelEnabled ? 'inline-flex' : 'none'};">
                      <span class="splash__ticker-icon splash__ticker-icon--travel" style="font-size:10px;">&#9992;&#xFE0E;</span>
                      <span class="splash__ticker-text" id="splash-preview-travel-text-m">upcoming travel: ${currentTravelText}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="kh-device-footer">
                <button type="button" class="kh-btn-secondary" id="pick-portrait-btn">Choose Portrait Image</button>
                <button type="button" class="kh-btn-secondary" id="upload-portrait-trigger-btn">Upload Photo</button>
                <input type="file" id="upload-portrait-input" accept="image/jpeg,image/png,image/webp,image/heic,image/*" style="position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; z-index: -1;">
              </div>
            </div>
          </div>

          <div class="kh-card-box" style="margin-top:24px;">
            <h3 class="kh-box-title">Splash Title Typography Size</h3>
            <p class="kh-sec-desc">Adjust the scale of "koray hussein photography". Changes preview immediately and synchronise across all mobile and desktop devices.</p>
            
            <div class="kh-sliders-grid">
              <!-- Desktop Slider & Controls -->
              <div class="kh-slider-item">
                <div class="kh-slider-header">
                  <label for="splash-desktop-slider">Desktop Words Size</label>
                  <span class="kh-slider-val" id="desktop-val-display">${splash.titleSizeDesktop}px</span>
                </div>
                <div class="kh-slider-controls-row">
                  <button type="button" class="kh-slider-step-btn" id="desktop-step-down" aria-label="Decrease desktop title size">&minus;</button>
                  <input type="range" id="splash-desktop-slider" class="kh-range-slider" min="36" max="220" step="2" value="${splash.titleSizeDesktop}">
                  <button type="button" class="kh-slider-step-btn" id="desktop-step-up" aria-label="Increase desktop title size">&plus;</button>
                </div>
                <div class="kh-presets-row" id="desktop-presets-mount">
                  ${desktopPresets.map(p => `
                    <button type="button" class="kh-preset-pill ${splash.titleSizeDesktop === p.size ? "is-active" : ""}" data-preset-d="${p.size}">
                      ${p.label}
                    </button>
                  `).join("")}
                </div>
              </div>

              <!-- Mobile Slider & Controls -->
              <div class="kh-slider-item">
                <div class="kh-slider-header">
                  <label for="splash-mobile-slider">Mobile Words Size</label>
                  <span class="kh-slider-val" id="mobile-val-display">${splash.titleSizeMobile}px</span>
                </div>
                <div class="kh-slider-controls-row">
                  <button type="button" class="kh-slider-step-btn" id="mobile-step-down" aria-label="Decrease mobile title size">&minus;</button>
                  <input type="range" id="splash-mobile-slider" class="kh-range-slider" min="24" max="110" step="2" value="${splash.titleSizeMobile}">
                  <button type="button" class="kh-slider-step-btn" id="mobile-step-up" aria-label="Increase mobile title size">&plus;</button>
                </div>
                <div class="kh-presets-row" id="mobile-presets-mount">
                  ${mobilePresets.map(p => `
                    <button type="button" class="kh-preset-pill ${splash.titleSizeMobile === p.size ? "is-active" : ""}" data-preset-m="${p.size}">
                      ${p.label}
                    </button>
                  `).join("")}
                </div>
              </div>
            </div>
          </div>

          <!-- Splash Screen Tickers: Availability & Travel Dates Card -->
          <div class="kh-card-box" style="margin-top:24px; border:1px solid rgba(209, 180, 140, 0.45); background: linear-gradient(180deg, rgba(209, 180, 140, 0.04) 0%, rgba(0,0,0,0) 100%);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
              <div>
                <h3 class="kh-box-title" style="margin:0; color:#d1b48c;">Splash Screen Availability &amp; Travel Tickers</h3>
                <p class="kh-sec-desc" style="margin:3px 0 0;">Customise and toggle the discreet editorial ticker capsules shown at the bottom of the splash screen across all devices.</p>
              </div>
            </div>

            <!-- 1. Travel Dates Ticker with Toggle -->
            <div style="padding:16px; border-radius:6px; background:rgba(0,0,0,0.28); border:1px solid rgba(255,255,255,0.08); margin-bottom:18px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:12px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="color:#d1b48c; font-size:16px;">&#9992;&#xFE0E;</span>
                  <span style="font-family:var(--font-sans); font-size:13px; font-weight:600; letter-spacing:0.04em; color:var(--text);">Travel Dates &amp; Locations Ticker</span>
                </div>
                <label class="kh-toggle-wrap ${currentTravelEnabled ? 'is-checked' : ''}" id="splash-mgr-travel-toggle-label" title="Toggle travel dates ticker visibility on splash">
                  <input type="checkbox" id="splash-mgr-travel-toggle" style="position:absolute; opacity:0; pointer-events:none;" ${currentTravelEnabled ? 'checked' : ''}>
                  <span class="kh-toggle-track">
                    <span class="kh-toggle-thumb"></span>
                  </span>
                  <span class="kh-toggle-label" id="splash-mgr-travel-toggle-status">${currentTravelEnabled ? 'ACTIVE ON SPLASH' : 'OFF · HIDDEN'}</span>
                </label>
              </div>

              <div id="splash-mgr-travel-fields-wrap" style="transition: opacity 0.3s ease; opacity: ${currentTravelEnabled ? '1' : '0.45'}; pointer-events: ${currentTravelEnabled ? 'auto' : 'none'};">
                <p class="kh-sec-desc" style="margin:4px 0 12px; font-size:12px;">Add your travel tour stops below. They will smoothly rotate every 2.8 seconds in the ticker capsule.</p>
                <div id="splash-travel-stops-mount"></div>
              </div>
            </div>

            <!-- 2. Currently Taking Bookings Ticker -->
            <div style="padding:16px; border-radius:6px; background:rgba(0,0,0,0.28); border:1px solid rgba(255,255,255,0.08);">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                <span style="color:#d1b48c; font-size:16px;">&#10022;</span>
                <span style="font-family:var(--font-sans); font-size:13px; font-weight:600; letter-spacing:0.04em; color:var(--text);">"Currently Taking Bookings" Ticker</span>
              </div>

              <div class="kh-form-field">
                <label for="splash-mgr-booking-input">Availability Badge Text</label>
                <input type="text" id="splash-mgr-booking-input" class="kh-input" value="${currentTickerText}" placeholder="e.g. currently taking bookings for december and january">
              </div>

              <div style="margin-top:10px;">
                <span style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:var(--text-muted); font-family:var(--font-sans); display:block; margin-bottom:8px;">Quick Month Presets (Click to apply):</span>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                  ${[
                    "currently taking bookings for december and january",
                    "currently taking bookings for january and february",
                    "currently taking bookings for february and march",
                    "currently taking bookings for march and april",
                    "currently taking bookings for spring 2026",
                    "currently taking bookings for summer 2026",
                    "now accepting bookings for this month"
                  ].map(preset => `
                    <button type="button" class="kh-gallery-pill-btn splash-mgr-booking-preset-pill" data-preset="${preset}" style="font-size:11px; padding:6px 12px;">
                      ${preset.replace(/^currently taking bookings for /, "")}
                    </button>
                  `).join("")}
                </div>
              </div>
            </div>
          </div>

          <!-- SITE-WIDE EDITORIAL TYPOGRAPHY HIERARCHY FINE-TUNING (OPTION 2) -->
          <div class="kh-card-box" style="margin-top:28px; border:1px solid rgba(209, 180, 140, 0.45); background: linear-gradient(180deg, rgba(209, 180, 140, 0.05) 0%, rgba(0,0,0,0) 100%);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px; margin-bottom:18px;">
              <div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="color:#d1b48c; font-size:16px;">✦</span>
                  <h3 class="kh-box-title" style="margin:0; color:#d1b48c;">Site-Wide Typography &amp; Hierarchy Fine-Tuning</h3>
                </div>
                <p class="kh-sec-desc" style="margin:4px 0 0;">
                  Fine-tune font sizes across the website in real-time. Adjust headers, body text, subheadings, metadata tags, and the editorial menu independently, or scale everything together. Changes reflect instantly and synchronise to all devices.
                </p>
              </div>
              <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <button type="button" class="kh-btn-secondary" id="typo-reset-defaults-btn" title="Reset all typography to default editorial baseline">
                  ↺ Reset to Defaults
                </button>
                <button type="button" class="kh-btn-primary" id="typo-save-now-btn">
                  Save Typography Settings ✓
                </button>
              </div>
            </div>

            <!-- Live Typographic Specimen Box -->
            <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:24px; margin-bottom:24px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:10px;">
                <span style="font-family:var(--font-sans); font-size:11px; text-transform:uppercase; letter-spacing:0.18em; color:var(--text-muted);">Live Interactive Typography Specimen</span>
                <span style="font-family:var(--font-sans); font-size:11px; color:#d1b48c;" id="typo-specimen-scale-badge">Scale: ${typo.globalScale}%</span>
              </div>
              <div id="typo-specimen-container" style="display:flex; flex-direction:column; gap:14px;">
                <!-- Specimen Tag -->
                <div>
                  <span class="bm-tag" id="specimen-tag" style="margin-bottom:0;">01 · EDITORIAL ARCHIVE &middot; LONDON</span>
                </div>
                <!-- Specimen Header -->
                <h2 id="specimen-header" style="font-family:var(--font-caslon); margin:0; line-height:1.05; letter-spacing:-0.02em; color:var(--text); text-transform:lowercase;">
                  koray hussein photography
                </h2>
                <!-- Specimen Subheading -->
                <h3 id="specimen-subhead" style="font-family:var(--font-caslon); margin:0; font-weight:400; color:var(--text); line-height:1.2;">
                  Autumn / Winter Collection &middot; Natural Light &amp; 90s Ink
                </h3>
                <!-- Specimen Body -->
                <p id="specimen-body" style="font-family:var(--font-caslon); margin:0; line-height:1.6; color:var(--text); max-width:820px;">
                  Challenging the notion that strength and power are masculine traits, my work draws out each whilst still maintaining the true essence of femininity. Natural light portraiture and 90s monochrome editorial aesthetics captured across London, Paris, and Milan.
                </p>
                <!-- Specimen Footer Row: Ticker & Menu Link -->
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-top:8px; padding-top:12px; border-top:1px dashed rgba(255,255,255,0.08);">
                  <div class="splash__booking-ticker" style="font-size:11px; padding:6px 14px; gap:8px;">
                    <span class="splash__ticker-icon" style="font-size:10px;">✦</span>
                    <span class="splash__ticker-text" id="specimen-ticker">CURRENTLY ACCEPTING COMMISSIONS &middot; PARIS &amp; LONDON</span>
                  </div>
                  <div style="display:inline-flex; align-items:center; gap:8px;">
                    <span style="font-family:var(--font-sans); font-size:10px; text-transform:uppercase; letter-spacing:0.16em; color:var(--text-muted);">Menu Link:</span>
                    <span class="editorial-link-title" id="specimen-menu-link" style="color:var(--text);">portfolio &middot; 25 works</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sliders Grid -->
            <div class="kh-sliders-grid">
              <!-- 1. Global Proportional Scale -->
              <div class="kh-slider-item" style="grid-column: 1 / -1; background: rgba(209, 180, 140, 0.04); border-color: rgba(209, 180, 140, 0.3);">
                <div class="kh-slider-header">
                  <label for="typo-global-slider" style="color:#d1b48c; font-weight:600;">Global Site Scale Multiplier</label>
                  <span class="kh-slider-val" id="typo-global-val" style="color:#d1b48c;">${typo.globalScale}%</span>
                </div>
                <p class="kh-sec-desc" style="margin:2px 0 10px; font-size:12px;">Scale every typographic element across the website proportionally up or down with a single control.</p>
                <div class="kh-slider-controls-row">
                  <button type="button" class="kh-slider-step-btn" id="typo-global-step-down">&minus;</button>
                  <input type="range" id="typo-global-slider" class="kh-range-slider" min="80" max="140" step="1" value="${typo.globalScale}">
                  <button type="button" class="kh-slider-step-btn" id="typo-global-step-up">&plus;</button>
                </div>
                <div class="kh-presets-row" id="typo-global-presets">
                  ${[
                    { label: "90% · Compact", scale: 90 },
                    { label: "100% · Default Baseline", scale: 100 },
                    { label: "110% · Comfortable", scale: 110 },
                    { label: "120% · Editorial Large", scale: 120 },
                    { label: "130% · Grand", scale: 130 }
                  ].map(p => `
                    <button type="button" class="kh-preset-pill ${typo.globalScale === p.scale ? 'is-active' : ''}" data-scale="${p.scale}">${p.label}</button>
                  `).join("")}
                </div>
              </div>

              <!-- 2. Page Headers & Hero Titles -->
              <div class="kh-slider-item">
                <div class="kh-slider-header">
                  <label for="typo-headers-slider">Page Headers &amp; Hero Titles</label>
                  <span class="kh-slider-val" id="typo-headers-val">${typo.headersSize}px</span>
                </div>
                <p class="kh-sec-desc" style="margin:2px 0 10px; font-size:12px;">Top hero headlines (About Me, FAQ, Book Me, Testimonials, Cancellations).</p>
                <div class="kh-slider-controls-row">
                  <button type="button" class="kh-slider-step-btn" id="typo-headers-step-down">&minus;</button>
                  <input type="range" id="typo-headers-slider" class="kh-range-slider" min="28" max="64" step="2" value="${typo.headersSize}">
                  <button type="button" class="kh-slider-step-btn" id="typo-headers-step-up">&plus;</button>
                </div>
                <div class="kh-presets-row" id="typo-headers-presets">
                  ${[
                    { label: "36px · Subtle", val: 36 },
                    { label: "44px · Classic", val: 44 },
                    { label: "52px · Large", val: 52 },
                    { label: "60px · Grand", val: 60 }
                  ].map(p => `
                    <button type="button" class="kh-preset-pill ${typo.headersSize === p.val ? 'is-active' : ''}" data-val="${p.val}">${p.label}</button>
                  `).join("")}
                </div>
              </div>

              <!-- 3. Subheadings & Card Titles -->
              <div class="kh-slider-item">
                <div class="kh-slider-header">
                  <label for="typo-subheads-slider">Subheadings &amp; Card Titles</label>
                  <span class="kh-slider-val" id="typo-subheads-val">${typo.subheadsSize}px</span>
                </div>
                <p class="kh-sec-desc" style="margin:2px 0 10px; font-size:12px;">FAQ question headers, client names, cancellation slot dates, set titles.</p>
                <div class="kh-slider-controls-row">
                  <button type="button" class="kh-slider-step-btn" id="typo-subheads-step-down">&minus;</button>
                  <input type="range" id="typo-subheads-slider" class="kh-range-slider" min="18" max="36" step="1" value="${typo.subheadsSize}">
                  <button type="button" class="kh-slider-step-btn" id="typo-subheads-step-up">&plus;</button>
                </div>
                <div class="kh-presets-row" id="typo-subheads-presets">
                  ${[
                    { label: "20px · Compact", val: 20 },
                    { label: "24px · Balanced", val: 24 },
                    { label: "28px · Prominent", val: 28 },
                    { label: "32px · Bold", val: 32 }
                  ].map(p => `
                    <button type="button" class="kh-preset-pill ${typo.subheadsSize === p.val ? 'is-active' : ''}" data-val="${p.val}">${p.label}</button>
                  `).join("")}
                </div>
              </div>

              <!-- 4. Body Text & Paragraphs -->
              <div class="kh-slider-item">
                <div class="kh-slider-header">
                  <label for="typo-body-slider">Body Text &amp; Paragraphs</label>
                  <span class="kh-slider-val" id="typo-body-val">${typo.bodySize}px</span>
                </div>
                <p class="kh-sec-desc" style="margin:2px 0 10px; font-size:12px;">Biography story, descriptions, FAQ answers, testimonials quotes, shoot notes.</p>
                <div class="kh-slider-controls-row">
                  <button type="button" class="kh-slider-step-btn" id="typo-body-step-down">&minus;</button>
                  <input type="range" id="typo-body-slider" class="kh-range-slider" min="15" max="26" step="1" value="${typo.bodySize}">
                  <button type="button" class="kh-slider-step-btn" id="typo-body-step-up">&plus;</button>
                </div>
                <div class="kh-presets-row" id="typo-body-presets">
                  ${[
                    { label: "17px · Editorial", val: 17 },
                    { label: "19px · Standard", val: 19 },
                    { label: "20px · Comfortable", val: 20 },
                    { label: "22px · Large", val: 22 },
                    { label: "24px · Generous", val: 24 }
                  ].map(p => `
                    <button type="button" class="kh-preset-pill ${typo.bodySize === p.val ? 'is-active' : ''}" data-val="${p.val}">${p.label}</button>
                  `).join("")}
                </div>
              </div>

              <!-- 5. Metadata, Tags & Small Caps -->
              <div class="kh-slider-item">
                <div class="kh-slider-header">
                  <label for="typo-meta-slider">Metadata, Tags &amp; Small Caps</label>
                  <span class="kh-slider-val" id="typo-meta-val">${typo.metaSize}px</span>
                </div>
                <p class="kh-sec-desc" style="margin:2px 0 10px; font-size:12px;">Section numbering (01 ·), uppercase badges, and contact form labels.</p>
                <div class="kh-slider-controls-row">
                  <button type="button" class="kh-slider-step-btn" id="typo-meta-step-down">&minus;</button>
                  <input type="range" id="typo-meta-slider" class="kh-range-slider" min="9" max="18" step="0.5" value="${typo.metaSize}">
                  <button type="button" class="kh-slider-step-btn" id="typo-meta-step-up">&plus;</button>
                </div>
                <div class="kh-presets-row" id="typo-meta-presets">
                  ${[
                    { label: "10px · Micro", val: 10 },
                    { label: "11px · Classic", val: 11 },
                    { label: "12px · Refined", val: 12 },
                    { label: "13.5px · Legible", val: 13.5 },
                    { label: "15px · Prominent", val: 15 }
                  ].map(p => `
                    <button type="button" class="kh-preset-pill ${typo.metaSize === p.val ? 'is-active' : ''}" data-val="${p.val}">${p.label}</button>
                  `).join("")}
                </div>
              </div>

              <!-- 6. Navigation Menu Links -->
              <div class="kh-slider-item">
                <div class="kh-slider-header">
                  <label for="typo-menu-slider">Navigation Menu Links</label>
                  <span class="kh-slider-val" id="typo-menu-val">${typo.menuSize}px</span>
                </div>
                <p class="kh-sec-desc" style="margin:2px 0 10px; font-size:12px;">Titles and gallery links inside the full-screen editorial index overlay.</p>
                <div class="kh-slider-controls-row">
                  <button type="button" class="kh-slider-step-btn" id="typo-menu-step-down">&minus;</button>
                  <input type="range" id="typo-menu-slider" class="kh-range-slider" min="18" max="34" step="1" value="${typo.menuSize}">
                  <button type="button" class="kh-slider-step-btn" id="typo-menu-step-up">&plus;</button>
                </div>
                <div class="kh-presets-row" id="typo-menu-presets">
                  ${[
                    { label: "20px · Minimal", val: 20 },
                    { label: "22px · Classic", val: 22 },
                    { label: "24px · Editorial", val: 24 },
                    { label: "28px · Statement", val: 28 }
                  ].map(p => `
                    <button type="button" class="kh-preset-pill ${typo.menuSize === p.val ? 'is-active' : ''}" data-val="${p.val}">${p.label}</button>
                  `).join("")}
                </div>
              </div>

              <!-- 7. Availability & Travel Tickers -->
              <div class="kh-slider-item">
                <div class="kh-slider-header">
                  <label for="typo-ticker-slider">Availability &amp; Travel Tickers</label>
                  <span class="kh-slider-val" id="typo-ticker-val">${typo.tickerSize}px</span>
                </div>
                <p class="kh-sec-desc" style="margin:2px 0 10px; font-size:12px;">Independent font size for the floating availability and travel capsule tickers on the splash page.</p>
                <div class="kh-slider-controls-row">
                  <button type="button" class="kh-slider-step-btn" id="typo-ticker-step-down">&minus;</button>
                  <input type="range" id="typo-ticker-slider" class="kh-range-slider" min="9" max="16" step="0.5" value="${typo.tickerSize}">
                  <button type="button" class="kh-slider-step-btn" id="typo-ticker-step-up">&plus;</button>
                </div>
                <div class="kh-presets-row" id="typo-ticker-presets">
                  ${[
                    { label: "10px · Micro", val: 10 },
                    { label: "11px · Classic", val: 11 },
                    { label: "11.5px · Standard", val: 11.5 },
                    { label: "12.5px · Legible", val: 12.5 },
                    { label: "14px · Prominent", val: 14 }
                  ].map(p => `
                    <button type="button" class="kh-preset-pill ${typo.tickerSize === p.val ? 'is-active' : ''}" data-val="${p.val}">${p.label}</button>
                  `).join("")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="splash-picker-modal-mount"></div>
      `;

      const dSlider = mount.querySelector("#splash-desktop-slider");
      const mSlider = mount.querySelector("#splash-mobile-slider");
      const dTitle = mount.querySelector("#desktop-preview-title");
      const mTitle = mount.querySelector("#mobile-preview-title");
      const dVal = mount.querySelector("#desktop-val-display");
      const mVal = mount.querySelector("#mobile-val-display");
      const dReadout = mount.querySelector("#desktop-size-readout");
      const mReadout = mount.querySelector("#mobile-size-readout");
      const dDown = mount.querySelector("#desktop-step-down");
      const dUp = mount.querySelector("#desktop-step-up");
      const mDown = mount.querySelector("#mobile-step-down");
      const mUp = mount.querySelector("#mobile-step-up");

      function updateDesktopPillHighlight(val) {
        mount.querySelectorAll("[data-preset-d]").forEach(btn => {
          btn.classList.toggle("is-active", parseInt(btn.dataset.presetD, 10) === val);
        });
      }

      function updateMobilePillHighlight(val) {
        mount.querySelectorAll("[data-preset-m]").forEach(btn => {
          btn.classList.toggle("is-active", parseInt(btn.dataset.presetM, 10) === val);
        });
      }

      function queueAutoSave() {
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
          saveSplashSettings(splash);
        }, 350);
      }

      function updateDesktopPreview(val) {
        const screen = mount.querySelector("#desktop-preview-screen");
        if (!screen || !dTitle) return;
        const w = screen.clientWidth || 560;
        // Reference desktop viewport width is 1440px
        const scale = w / 1440;
        const previewPx = Math.max(14, Math.round(val * scale));
        dTitle.style.fontSize = `${previewPx}px`;
      }

      function updateCanvasScales() {
        const dScreen = mount.querySelector("#desktop-preview-screen");
        const mScreen = mount.querySelector("#mobile-preview-screen");
        if (dScreen) {
          const w = dScreen.clientWidth;
          if (w > 0) dScreen.style.setProperty("--kh-desktop-scale", String(w / 1440));
        }
        if (mScreen) {
          const w = mScreen.clientWidth;
          if (w > 0) mScreen.style.setProperty("--kh-mobile-scale", String(w / 390));
        }
      }

      function applyDesktopSize(val, shouldSave) {
        val = Math.max(36, Math.min(220, Math.round(val)));
        splash.titleSizeDesktop = val;
        dSlider.value = val;
        if (dTitle) dTitle.style.setProperty("font-size", `${val}px`, "important");
        dVal.textContent = `${val}px`;
        dReadout.textContent = `${val}px title`;
        document.documentElement.style.setProperty("--splash-title-size-desktop", `${val}px`);
        applySplashSettingsToDOM(splash);
        updateDesktopPillHighlight(val);
        if (shouldSave) {
          saveSplashSettings(splash);
        } else {
          queueAutoSave();
        }
      }

      function applyMobileSize(val, shouldSave) {
        val = Math.max(24, Math.min(110, Math.round(val)));
        splash.titleSizeMobile = val;
        mSlider.value = val;
        if (mTitle) mTitle.style.setProperty("font-size", `${val}px`, "important");
        mVal.textContent = `${val}px`;
        mReadout.textContent = `${val}px title`;
        document.documentElement.style.setProperty("--splash-title-size-mobile", `${val}px`);
        applySplashSettingsToDOM(splash);
        updateMobilePillHighlight(val);
        if (shouldSave) {
          saveSplashSettings(splash);
        } else {
          queueAutoSave();
        }
      }

      // Initial proportional virtual viewport calibration
      requestAnimationFrame(updateCanvasScales);
      setTimeout(updateCanvasScales, 60);
      setTimeout(updateCanvasScales, 250);

      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => {
          updateCanvasScales();
        });
        const dScreenEl = mount.querySelector("#desktop-preview-screen");
        const mScreenEl = mount.querySelector("#mobile-preview-screen");
        if (dScreenEl) ro.observe(dScreenEl);
        if (mScreenEl) ro.observe(mScreenEl);
      }
      window.addEventListener("resize", updateCanvasScales);

      // Desktop slider input & change
      dSlider.addEventListener("input", (e) => {
        applyDesktopSize(parseInt(e.target.value, 10), false);
      });
      dSlider.addEventListener("change", (e) => {
        applyDesktopSize(parseInt(e.target.value, 10), true);
        showToast("Desktop title size saved ✓");
      });

      // Desktop step down & step up
      dDown.addEventListener("click", () => {
        applyDesktopSize((splash.titleSizeDesktop || 68) - 4, true);
      });
      dUp.addEventListener("click", () => {
        applyDesktopSize((splash.titleSizeDesktop || 68) + 4, true);
      });

      // Desktop preset buttons
      mount.querySelectorAll("[data-preset-d]").forEach(btn => {
        btn.addEventListener("click", () => {
          const s = parseInt(btn.dataset.presetD, 10);
          applyDesktopSize(s, true);
          showToast(`Desktop title set to ${s}px ✓`);
        });
      });

      // Mobile slider input & change
      mSlider.addEventListener("input", (e) => {
        applyMobileSize(parseInt(e.target.value, 10), false);
      });
      mSlider.addEventListener("change", (e) => {
        applyMobileSize(parseInt(e.target.value, 10), true);
        showToast("Mobile title size saved ✓");
      });

      // Mobile step down & step up
      mDown.addEventListener("click", () => {
        applyMobileSize((splash.titleSizeMobile || 44) - 2, true);
      });
      mUp.addEventListener("click", () => {
        applyMobileSize((splash.titleSizeMobile || 44) + 2, true);
      });

      // Mobile preset buttons
      mount.querySelectorAll("[data-preset-m]").forEach(btn => {
        btn.addEventListener("click", () => {
          const s = parseInt(btn.dataset.presetM, 10);
          applyMobileSize(s, true);
          showToast(`Mobile title set to ${s}px ✓`);
        });
      });

      // View live splash link
      const viewSplashLink = mount.querySelector("#view-live-splash-link");
      if (viewSplashLink) {
        viewSplashLink.addEventListener("click", (e) => {
          e.preventDefault();
          saveSplashSettings(splash);
          const splashEl = document.getElementById("splash");
          if (splashEl) {
            splashEl.classList.remove("is-hidden");
            document.body.classList.remove("site-active");
            if (typeof window.updateSplashImage === "function") window.updateSplashImage();
          }
          location.hash = "#/home";
        });
      }

      const dUpload = mount.querySelector("#upload-landscape-input");
      const dUploadBtn = mount.querySelector("#upload-landscape-trigger-btn");
      if (dUploadBtn && dUpload) {
        dUploadBtn.addEventListener("click", () => {
          dUpload.value = "";
          dUpload.click();
        });
      }

      dUpload.addEventListener("change", async () => {
        if (dUpload.files && dUpload.files[0]) {
          const file = dUpload.files[0];
          const localBlob = URL.createObjectURL(file);
          const dCanvas = mount.querySelector("#desktop-virtual-canvas") || mount.querySelector("#desktop-preview-screen");
          if (dCanvas) dCanvas.style.backgroundImage = `url("${localBlob}")`;

          showToast("Uploading landscape photo in full quality...");
          let finalUrl = await uploadSingleFileToR2(file, "splash", "landscape");
          if (!finalUrl) {
            finalUrl = await fileToCompressedDataUrl(file, 2400, 0.90, 850000);
          }
          if (finalUrl) {
            splash.landscape = finalUrl;
            if (dCanvas) dCanvas.style.backgroundImage = `url("${encodeURI(finalUrl)}")`;
            applySplashSettingsToDOM(splash);
            saveSplashSettings(splash);
            showToast("Landscape photo uploaded & saved ✓");
          }
        }
      });

      const mUpload = mount.querySelector("#upload-portrait-input");
      const mUploadBtn = mount.querySelector("#upload-portrait-trigger-btn");
      if (mUploadBtn && mUpload) {
        mUploadBtn.addEventListener("click", () => {
          mUpload.value = "";
          mUpload.click();
        });
      }

      mUpload.addEventListener("change", async () => {
        if (mUpload.files && mUpload.files[0]) {
          const file = mUpload.files[0];
          const localBlob = URL.createObjectURL(file);
          const mCanvas = mount.querySelector("#mobile-virtual-canvas") || mount.querySelector("#mobile-preview-screen");
          if (mCanvas) mCanvas.style.backgroundImage = `url("${localBlob}")`;

          showToast("Uploading portrait photo in full quality...");
          let finalUrl = await uploadSingleFileToR2(file, "splash", "portrait");
          if (!finalUrl) {
            finalUrl = await fileToCompressedDataUrl(file, 1600, 0.90, 750000);
          }
          if (finalUrl) {
            splash.portrait = finalUrl;
            if (mCanvas) mCanvas.style.backgroundImage = `url("${encodeURI(finalUrl)}")`;
            applySplashSettingsToDOM(splash);
            saveSplashSettings(splash);
            showToast("Portrait photo uploaded & saved ✓");
          }
        }
      });

      mount.querySelector("#pick-landscape-btn").addEventListener("click", () => {
        openSplashImagePicker(mount, "landscape", (src) => {
          splash.landscape = src;
          const dCanvas = mount.querySelector("#desktop-virtual-canvas") || mount.querySelector("#desktop-preview-screen");
          if (dCanvas) dCanvas.style.backgroundImage = `url("${encodeURI(src)}")`;
          applySplashSettingsToDOM(splash);
          saveSplashSettings(splash);
        });
      });

      mount.querySelector("#pick-portrait-btn").addEventListener("click", () => {
        openSplashImagePicker(mount, "portrait", (src) => {
          splash.portrait = src;
          const mCanvas = mount.querySelector("#mobile-virtual-canvas") || mount.querySelector("#mobile-preview-screen");
          if (mCanvas) mCanvas.style.backgroundImage = `url("${encodeURI(src)}")`;
          applySplashSettingsToDOM(splash);
          saveSplashSettings(splash);
        });
      });

      // Splash Manager Ticker Controls
      const splashTravelToggle = mount.querySelector("#splash-mgr-travel-toggle");
      const splashTravelToggleLabel = mount.querySelector("#splash-mgr-travel-toggle-label");
      const splashTravelToggleStatus = mount.querySelector("#splash-mgr-travel-toggle-status");
      const splashTravelFieldsWrap = mount.querySelector("#splash-mgr-travel-fields-wrap");
      const splashBookingInput = mount.querySelector("#splash-mgr-booking-input");

      const previewTravelPillD = mount.querySelector("#splash-preview-travel-pill-d");
      const previewTravelPillM = mount.querySelector("#splash-preview-travel-pill-m");
      const previewTravelTextD = mount.querySelector("#splash-preview-travel-text-d");
      const previewTravelTextM = mount.querySelector("#splash-preview-travel-text-m");
      const previewBookingTextD = mount.querySelector("#splash-preview-booking-text-d");
      const previewBookingTextM = mount.querySelector("#splash-preview-booking-text-m");

      function syncSplashTickersToState(travelEnabled, travelDatesOrText, bookingText) {
        const headers = loadCustomHeadersConfig();
        if (headers["book-me"]) {
          if (typeof travelEnabled === "boolean") headers["book-me"].travelEnabled = travelEnabled;
          if (Array.isArray(travelDatesOrText)) {
            headers["book-me"].travelDates = travelDatesOrText;
            headers["book-me"].travelTicker = travelDatesOrText.join(" / ");
          } else if (typeof travelDatesOrText === "string") {
            headers["book-me"].travelTicker = travelDatesOrText;
            headers["book-me"].travelDates = travelDatesOrText.includes("/") ?
              travelDatesOrText.split("/").map(s => s.trim()).filter(Boolean) : [travelDatesOrText];
          }
          if (typeof bookingText === "string") headers["book-me"].bookingTicker = bookingText;
          saveCustomHeadersConfig(headers);
        }
        if (typeof travelEnabled === "boolean") splash.travelEnabled = travelEnabled;
        if (Array.isArray(travelDatesOrText)) {
          splash.travelDates = travelDatesOrText;
          splash.travelTicker = travelDatesOrText.join(" / ");
        }
        if (typeof window.updateSplashTravelTicker === "function") {
          window.updateSplashTravelTicker(travelEnabled, travelDatesOrText);
        }
        if (typeof window.updateSplashBookingTicker === "function") {
          window.updateSplashBookingTicker(bookingText);
        }
      }

      // Initialise carousel on preview screens
      if (typeof window.startTickerCarousel === "function") {
        window.startTickerCarousel(previewTravelTextD, currentTravelDates, "upcoming travel: ");
        window.startTickerCarousel(previewTravelTextM, currentTravelDates, "upcoming travel: ");
      }

      const splashTravelStopsMount = mount.querySelector("#splash-travel-stops-mount");
      if (splashTravelStopsMount) {
        renderTravelStopsManager(splashTravelStopsMount, {
          travelDates: currentTravelDates,
          onChange: (newStops) => {
            const valid = newStops.filter(s => s.trim().length > 0);
            currentTravelDates = valid.length ? valid : ["paris · 12–18 may"];
            splash.travelDates = currentTravelDates;
            splash.travelTicker = currentTravelDates.join(" / ");
            syncSplashTickersToState(splashTravelToggle ? splashTravelToggle.checked : true, currentTravelDates, undefined);
            if (typeof window.startTickerCarousel === "function") {
              window.startTickerCarousel(previewTravelTextD, currentTravelDates, "upcoming travel: ");
              window.startTickerCarousel(previewTravelTextM, currentTravelDates, "upcoming travel: ");
            }
          }
        });
      }

      if (splashTravelToggle) {
        splashTravelToggle.addEventListener("change", () => {
          const isEnabled = splashTravelToggle.checked;
          if (splashTravelToggleLabel) splashTravelToggleLabel.classList.toggle("is-checked", isEnabled);
          if (splashTravelToggleStatus) splashTravelToggleStatus.textContent = isEnabled ? "ACTIVE ON SPLASH" : "OFF · HIDDEN";
          if (splashTravelFieldsWrap) {
            splashTravelFieldsWrap.style.opacity = isEnabled ? "1" : "0.45";
            splashTravelFieldsWrap.style.pointerEvents = isEnabled ? "auto" : "none";
          }
          if (previewTravelPillD) previewTravelPillD.style.display = isEnabled ? "inline-flex" : "none";
          if (previewTravelPillM) previewTravelPillM.style.display = isEnabled ? "inline-flex" : "none";

          syncSplashTickersToState(isEnabled, currentTravelDates, undefined);
          showToast(isEnabled ? "Travel dates ticker activated on splash ✓" : "Travel dates ticker turned off (hidden from splash) ✓");
        });
      }

      if (splashBookingInput) {
        splashBookingInput.addEventListener("input", () => {
          const val = splashBookingInput.value;
          if (previewBookingTextD) previewBookingTextD.textContent = val;
          if (previewBookingTextM) previewBookingTextM.textContent = val;
          syncSplashTickersToState(undefined, undefined, val);
        });
      }

      mount.querySelectorAll(".splash-mgr-booking-preset-pill").forEach(pBtn => {
        pBtn.addEventListener("click", () => {
          const val = pBtn.dataset.preset;
          if (splashBookingInput) splashBookingInput.value = val;
          if (previewBookingTextD) previewBookingTextD.textContent = val;
          if (previewBookingTextM) previewBookingTextM.textContent = val;
          syncSplashTickersToState(undefined, undefined, val);
          showToast(`Applied booking ticker: "${val}"`);
        });
      });

      mount.querySelector("#save-splash-settings-btn").addEventListener("click", () => {
        splash.travelEnabled = splashTravelToggle ? splashTravelToggle.checked : true;
        splash.travelDates = currentTravelDates;
        splash.travelTicker = currentTravelDates.join(" / ");
        saveSplashSettings(splash);
        saveTypographySettings(typo, true);
        const headers = loadCustomHeadersConfig();
        if (headers["book-me"]) {
          headers["book-me"].travelEnabled = splash.travelEnabled;
          headers["book-me"].travelDates = splash.travelDates;
          headers["book-me"].travelTicker = splash.travelTicker;
          saveCustomHeadersConfig(headers);
        }
        showToast("Splash settings, tickers and typography saved ✓");
      });

      // -------------------------------------------------------------
      // Site-Wide Typography Hierarchy Controls (Option 2)
      // -------------------------------------------------------------
      const typoGlobalSlider = mount.querySelector("#typo-global-slider");
      const typoGlobalVal = mount.querySelector("#typo-global-val");
      const typoGlobalStepDown = mount.querySelector("#typo-global-step-down");
      const typoGlobalStepUp = mount.querySelector("#typo-global-step-up");

      const typoHeadersSlider = mount.querySelector("#typo-headers-slider");
      const typoHeadersVal = mount.querySelector("#typo-headers-val");
      const typoHeadersStepDown = mount.querySelector("#typo-headers-step-down");
      const typoHeadersStepUp = mount.querySelector("#typo-headers-step-up");

      const typoSubheadsSlider = mount.querySelector("#typo-subheads-slider");
      const typoSubheadsVal = mount.querySelector("#typo-subheads-val");
      const typoSubheadsStepDown = mount.querySelector("#typo-subheads-step-down");
      const typoSubheadsStepUp = mount.querySelector("#typo-subheads-step-up");

      const typoBodySlider = mount.querySelector("#typo-body-slider");
      const typoBodyVal = mount.querySelector("#typo-body-val");
      const typoBodyStepDown = mount.querySelector("#typo-body-step-down");
      const typoBodyStepUp = mount.querySelector("#typo-body-step-up");

      const typoMetaSlider = mount.querySelector("#typo-meta-slider");
      const typoMetaVal = mount.querySelector("#typo-meta-val");
      const typoMetaStepDown = mount.querySelector("#typo-meta-step-down");
      const typoMetaStepUp = mount.querySelector("#typo-meta-step-up");

      const typoMenuSlider = mount.querySelector("#typo-menu-slider");
      const typoMenuVal = mount.querySelector("#typo-menu-val");
      const typoMenuStepDown = mount.querySelector("#typo-menu-step-down");
      const typoMenuStepUp = mount.querySelector("#typo-menu-step-up");

      const typoTickerSlider = mount.querySelector("#typo-ticker-slider");
      const typoTickerVal = mount.querySelector("#typo-ticker-val");
      const typoTickerStepDown = mount.querySelector("#typo-ticker-step-down");
      const typoTickerStepUp = mount.querySelector("#typo-ticker-step-up");

      const specimenScaleBadge = mount.querySelector("#typo-specimen-scale-badge");
      const specimenTag = mount.querySelector("#specimen-tag");
      const specimenHeader = mount.querySelector("#specimen-header");
      const specimenSubhead = mount.querySelector("#specimen-subhead");
      const specimenBody = mount.querySelector("#specimen-body");
      const specimenTicker = mount.querySelector("#specimen-ticker");
      const specimenMenuLink = mount.querySelector("#specimen-menu-link");

      function updateTypoSpecimen() {
        const mult = (typo.globalScale || 100) / 100;
        if (specimenScaleBadge) specimenScaleBadge.textContent = `Scale: ${typo.globalScale}%`;
        if (specimenTag) specimenTag.style.setProperty("font-size", `${(typo.metaSize || 12) * mult}px`, "important");
        if (specimenHeader) specimenHeader.style.setProperty("font-size", `${(typo.headersSize || 44) * mult}px`, "important");
        if (specimenSubhead) specimenSubhead.style.setProperty("font-size", `${(typo.subheadsSize || 24) * mult}px`, "important");
        if (specimenBody) specimenBody.style.setProperty("font-size", `${(typo.bodySize || 20) * mult}px`, "important");
        if (specimenTicker) specimenTicker.style.setProperty("font-size", `${(typo.tickerSize || 11.5) * mult}px`, "important");
        if (specimenMenuLink) specimenMenuLink.style.setProperty("font-size", `${(typo.menuSize || 24) * mult}px`, "important");
      }

      function queueTypoAutoSave() {
        if (typoAutoSaveTimer) clearTimeout(typoAutoSaveTimer);
        typoAutoSaveTimer = setTimeout(() => {
          saveTypographySettings(typo, true);
        }, 350);
      }

      function renderTypoState() {
        if (typoGlobalSlider) typoGlobalSlider.value = typo.globalScale;
        if (typoGlobalVal) typoGlobalVal.textContent = `${typo.globalScale}%`;
        mount.querySelectorAll("#typo-global-presets [data-scale]").forEach(p => {
          p.classList.toggle("is-active", parseInt(p.dataset.scale, 10) === typo.globalScale);
        });

        if (typoHeadersSlider) typoHeadersSlider.value = typo.headersSize;
        if (typoHeadersVal) typoHeadersVal.textContent = `${typo.headersSize}px`;
        mount.querySelectorAll("#typo-headers-presets [data-val]").forEach(p => {
          p.classList.toggle("is-active", parseFloat(p.dataset.val) === typo.headersSize);
        });

        if (typoSubheadsSlider) typoSubheadsSlider.value = typo.subheadsSize;
        if (typoSubheadsVal) typoSubheadsVal.textContent = `${typo.subheadsSize}px`;
        mount.querySelectorAll("#typo-subheads-presets [data-val]").forEach(p => {
          p.classList.toggle("is-active", parseFloat(p.dataset.val) === typo.subheadsSize);
        });

        if (typoBodySlider) typoBodySlider.value = typo.bodySize;
        if (typoBodyVal) typoBodyVal.textContent = `${typo.bodySize}px`;
        mount.querySelectorAll("#typo-body-presets [data-val]").forEach(p => {
          p.classList.toggle("is-active", parseFloat(p.dataset.val) === typo.bodySize);
        });

        if (typoMetaSlider) typoMetaSlider.value = typo.metaSize;
        if (typoMetaVal) typoMetaVal.textContent = `${typo.metaSize}px`;
        mount.querySelectorAll("#typo-meta-presets [data-val]").forEach(p => {
          p.classList.toggle("is-active", parseFloat(p.dataset.val) === typo.metaSize);
        });

        if (typoMenuSlider) typoMenuSlider.value = typo.menuSize;
        if (typoMenuVal) typoMenuVal.textContent = `${typo.menuSize}px`;
        mount.querySelectorAll("#typo-menu-presets [data-val]").forEach(p => {
          p.classList.toggle("is-active", parseFloat(p.dataset.val) === typo.menuSize);
        });

        if (typoTickerSlider) typoTickerSlider.value = typo.tickerSize;
        if (typoTickerVal) typoTickerVal.textContent = `${typo.tickerSize}px`;
        mount.querySelectorAll("#typo-ticker-presets [data-val]").forEach(p => {
          p.classList.toggle("is-active", parseFloat(p.dataset.val) === typo.tickerSize);
        });

        updateTypoSpecimen();
        applyTypographyToDOM(typo);
      }

      // 1. Global Scale Slider
      if (typoGlobalSlider) {
        typoGlobalSlider.addEventListener("input", () => {
          typo.globalScale = parseInt(typoGlobalSlider.value, 10);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      if (typoGlobalStepDown) {
        typoGlobalStepDown.addEventListener("click", () => {
          typo.globalScale = Math.max(80, typo.globalScale - 5);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      if (typoGlobalStepUp) {
        typoGlobalStepUp.addEventListener("click", () => {
          typo.globalScale = Math.min(140, typo.globalScale + 5);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      mount.querySelectorAll("#typo-global-presets [data-scale]").forEach(btn => {
        btn.addEventListener("click", () => {
          typo.globalScale = parseInt(btn.dataset.scale, 10);
          renderTypoState();
          queueTypoAutoSave();
          showToast(`Global typography scale set to ${typo.globalScale}% ✓`);
        });
      });

      // 2. Headers Slider
      if (typoHeadersSlider) {
        typoHeadersSlider.addEventListener("input", () => {
          typo.headersSize = parseInt(typoHeadersSlider.value, 10);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      if (typoHeadersStepDown) {
        typoHeadersStepDown.addEventListener("click", () => {
          typo.headersSize = Math.max(28, typo.headersSize - 2);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      if (typoHeadersStepUp) {
        typoHeadersStepUp.addEventListener("click", () => {
          typo.headersSize = Math.min(64, typo.headersSize + 2);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      mount.querySelectorAll("#typo-headers-presets [data-val]").forEach(btn => {
        btn.addEventListener("click", () => {
          typo.headersSize = parseFloat(btn.dataset.val);
          renderTypoState();
          queueTypoAutoSave();
        });
      });

      // 3. Subheadings Slider
      if (typoSubheadsSlider) {
        typoSubheadsSlider.addEventListener("input", () => {
          typo.subheadsSize = parseInt(typoSubheadsSlider.value, 10);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      if (typoSubheadsStepDown) {
        typoSubheadsStepDown.addEventListener("click", () => {
          typo.subheadsSize = Math.max(18, typo.subheadsSize - 1);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      if (typoSubheadsStepUp) {
        typoSubheadsStepUp.addEventListener("click", () => {
          typo.subheadsSize = Math.min(36, typo.subheadsSize + 1);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      mount.querySelectorAll("#typo-subheads-presets [data-val]").forEach(btn => {
        btn.addEventListener("click", () => {
          typo.subheadsSize = parseFloat(btn.dataset.val);
          renderTypoState();
          queueTypoAutoSave();
        });
      });

      // 4. Body Slider
      if (typoBodySlider) {
        typoBodySlider.addEventListener("input", () => {
          typo.bodySize = parseInt(typoBodySlider.value, 10);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      if (typoBodyStepDown) {
        typoBodyStepDown.addEventListener("click", () => {
          typo.bodySize = Math.max(15, typo.bodySize - 1);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      if (typoBodyStepUp) {
        typoBodyStepUp.addEventListener("click", () => {
          typo.bodySize = Math.min(26, typo.bodySize + 1);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      mount.querySelectorAll("#typo-body-presets [data-val]").forEach(btn => {
        btn.addEventListener("click", () => {
          typo.bodySize = parseFloat(btn.dataset.val);
          renderTypoState();
          queueTypoAutoSave();
        });
      });

      // 5. Meta Slider
      if (typoMetaSlider) {
        typoMetaSlider.addEventListener("input", () => {
          typo.metaSize = parseFloat(typoMetaSlider.value);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      if (typoMetaStepDown) {
        typoMetaStepDown.addEventListener("click", () => {
          typo.metaSize = Math.max(9, typo.metaSize - 0.5);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      if (typoMetaStepUp) {
        typoMetaStepUp.addEventListener("click", () => {
          typo.metaSize = Math.min(18, typo.metaSize + 0.5);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      mount.querySelectorAll("#typo-meta-presets [data-val]").forEach(btn => {
        btn.addEventListener("click", () => {
          typo.metaSize = parseFloat(btn.dataset.val);
          renderTypoState();
          queueTypoAutoSave();
        });
      });

      // 7. Ticker Slider (Independent from Metadata)
      if (typoTickerSlider) {
        typoTickerSlider.addEventListener("input", () => {
          typo.tickerSize = parseFloat(typoTickerSlider.value);
          renderTypoState();
          queueTypoAutoSave();
          if (typeof window.updateSplashBookingTicker === "function") window.updateSplashBookingTicker();
          if (typeof window.updateSplashTravelTicker === "function") window.updateSplashTravelTicker();
        });
      }
      if (typoTickerStepDown) {
        typoTickerStepDown.addEventListener("click", () => {
          typo.tickerSize = Math.max(9, typo.tickerSize - 0.5);
          renderTypoState();
          queueTypoAutoSave();
          if (typeof window.updateSplashBookingTicker === "function") window.updateSplashBookingTicker();
          if (typeof window.updateSplashTravelTicker === "function") window.updateSplashTravelTicker();
        });
      }
      if (typoTickerStepUp) {
        typoTickerStepUp.addEventListener("click", () => {
          typo.tickerSize = Math.min(16, typo.tickerSize + 0.5);
          renderTypoState();
          queueTypoAutoSave();
          if (typeof window.updateSplashBookingTicker === "function") window.updateSplashBookingTicker();
          if (typeof window.updateSplashTravelTicker === "function") window.updateSplashTravelTicker();
        });
      }
      mount.querySelectorAll("#typo-ticker-presets [data-val]").forEach(btn => {
        btn.addEventListener("click", () => {
          typo.tickerSize = parseFloat(btn.dataset.val);
          renderTypoState();
          queueTypoAutoSave();
          if (typeof window.updateSplashBookingTicker === "function") window.updateSplashBookingTicker();
          if (typeof window.updateSplashTravelTicker === "function") window.updateSplashTravelTicker();
        });
      });

      // 6. Menu Slider
      if (typoMenuSlider) {
        typoMenuSlider.addEventListener("input", () => {
          typo.menuSize = parseInt(typoMenuSlider.value, 10);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      if (typoMenuStepDown) {
        typoMenuStepDown.addEventListener("click", () => {
          typo.menuSize = Math.max(18, typo.menuSize - 1);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      if (typoMenuStepUp) {
        typoMenuStepUp.addEventListener("click", () => {
          typo.menuSize = Math.min(34, typo.menuSize + 1);
          renderTypoState();
          queueTypoAutoSave();
        });
      }
      mount.querySelectorAll("#typo-menu-presets [data-val]").forEach(btn => {
        btn.addEventListener("click", () => {
          typo.menuSize = parseFloat(btn.dataset.val);
          renderTypoState();
          queueTypoAutoSave();
        });
      });

      // Reset Defaults Button
      const typoResetBtn = mount.querySelector("#typo-reset-defaults-btn");
      if (typoResetBtn) {
        typoResetBtn.addEventListener("click", () => {
          Object.assign(typo, DEFAULT_TYPOGRAPHY);
          renderTypoState();
          saveTypographySettings(typo, true);
          showToast("Typography reset to default editorial scale ✓");
        });
      }

      // Save Now Button
      const typoSaveBtn = mount.querySelector("#typo-save-now-btn");
      if (typoSaveBtn) {
        typoSaveBtn.addEventListener("click", () => {
          saveTypographySettings(typo, true);
          showToast("Typography hierarchy saved and synced to cloud ✓");
        });
      }

      // Initialise state
      renderTypoState();
    }

    function openSplashImagePicker(mount, targetMode, onSelect) {
      const modalMount = mount.querySelector("#splash-picker-modal-mount");
      if (!modalMount) return;

      const allImages = getAllAvailablePortfolioImages();
      const filtered = allImages.filter(img => targetMode === "landscape" ? img.isLandscape : !img.isLandscape);

      modalMount.innerHTML = `
        <div class="kh-modal-backdrop">
          <div class="kh-modal-window kh-modal-wide">
            <div class="kh-modal-head">
              <h3>Choose ${targetMode === "landscape" ? "Landscape (Desktop)" : "Portrait (Mobile)"} Splash Photo</h3>
              <button type="button" class="kh-modal-close" id="picker-close-btn">&times;</button>
            </div>
            <div class="kh-modal-body">
              <div class="kh-picker-grid">
                ${filtered.map(img => `
                  <div class="kh-picker-card" data-src="${img.src}">
                    <img src="${img.src}" alt="${img.title}" loading="lazy">
                    <span class="kh-picker-caption">${img.title}</span>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>
      `;

      const close = () => { modalMount.innerHTML = ""; };
      modalMount.querySelector("#picker-close-btn").addEventListener("click", close);

      modalMount.querySelectorAll(".kh-picker-card").forEach(card => {
        card.addEventListener("click", () => {
          const src = card.dataset.src;
          onSelect(src);
          close();
          showToast(`Selected splash photograph ✓`);
        });
      });
    }

    function openGalleryLibraryPicker(mount, modalMountId, onSelect) {
      const modalMount = mount.querySelector(`#${modalMountId}`);
      if (!modalMount) return;

      const allImages = getAllAvailablePortfolioImages();
      const selected = new Set();

      modalMount.innerHTML = `
        <div class="kh-modal-backdrop">
          <div class="kh-modal-window kh-modal-wide">
            <div class="kh-modal-head">
              <div>
                <h3>Add Photos from Existing Library</h3>
                <p class="kh-sec-desc" style="margin:2px 0 0 0;">Click photos to select. Selected photos will be added to this gallery.</p>
              </div>
              <button type="button" class="kh-modal-close" id="lib-picker-close-btn">&times;</button>
            </div>
            <div class="kh-modal-body">
              <div class="kh-picker-grid">
                ${allImages.map((img, i) => `
                  <div class="kh-picker-card" data-src="${img.src}" data-lib-idx="${i}" style="cursor:pointer; position:relative; transition:all 0.15s ease;">
                    <img src="${img.src}" alt="${img.title}" loading="lazy">
                    <span class="kh-picker-caption">${img.title}</span>
                  </div>
                `).join("")}
              </div>
            </div>
            <div class="kh-modal-foot" style="display:flex; justify-content:space-between; align-items:center;">
              <span id="lib-picker-count" style="font-family:var(--font-sans); font-size:12px; font-weight:600; color:var(--text-muted);">0 photos selected</span>
              <div style="display:flex; gap:10px;">
                <button type="button" class="kh-btn-secondary" id="lib-picker-cancel-btn">Cancel</button>
                <button type="button" class="kh-btn-primary" id="lib-picker-add-btn" disabled>Add Selected Photos &rarr;</button>
              </div>
            </div>
          </div>
        </div>
      `;

      const close = () => { modalMount.innerHTML = ""; };
      modalMount.querySelector("#lib-picker-close-btn").addEventListener("click", close);
      modalMount.querySelector("#lib-picker-cancel-btn").addEventListener("click", close);

      const countEl = modalMount.querySelector("#lib-picker-count");
      const addBtn = modalMount.querySelector("#lib-picker-add-btn");

      modalMount.querySelectorAll(".kh-picker-card").forEach(card => {
        card.addEventListener("click", () => {
          const src = card.dataset.src;
          if (selected.has(src)) {
            selected.delete(src);
            card.style.outline = "";
            card.style.transform = "";
          } else {
            selected.add(src);
            card.style.outline = "3px solid #22c55e";
            card.style.transform = "scale(0.97)";
          }
          const cnt = selected.size;
          countEl.textContent = `${cnt} photo${cnt === 1 ? "" : "s"} selected`;
          addBtn.disabled = cnt === 0;
          addBtn.textContent = cnt > 0 ? `Add Selected (${cnt}) &rarr;` : "Add Selected Photos &rarr;";
        });
      });

      addBtn.addEventListener("click", () => {
        if (selected.size > 0) {
          onSelect(Array.from(selected));
          close();
        }
      });
    }

    /* =========================================================
       TAB 4: TESTIMONIALS MANAGER (IN-PAGE FULL VIEW, NO POPUP!)
       ========================================================= */
    function renderTestimonialsManager(mount) {
      const testimonials = loadTestimonialsList();

      mount.innerHTML = `
        <div class="kh-studio-sec">
          <div class="kh-sec-toolbar">
            <div>
              <h2 class="kh-sec-heading">Testimonials &amp; Client Words</h2>
              <p class="kh-sec-desc">Re-order sequence of client reviews, edit quotes and Instagram handles, or add new testimonials with 2:3 vertical portrait imagery.</p>
            </div>
            <button type="button" class="kh-btn-primary" id="add-testimonial-page-btn">
              + Add New Testimonial
            </button>
          </div>

          <div class="kh-testimonials-list" id="kh-testimonials-list">
            ${testimonials.length === 0 ? `<p class="kh-empty-state">No testimonials found. Click "+ Add New Testimonial" above.</p>` : ""}
            ${testimonials.map((item, idx) => `
              <div class="kh-tm-item-card" data-idx="${idx}">
                <div class="kh-tm-item-avatar">
                  <img src="${item.image || 'photos/testimonials/header.jpg'}" alt="${item.name}" loading="lazy">
                </div>
                <div class="kh-tm-item-content">
                  <div class="kh-tm-item-meta">
                    <h3 class="kh-tm-item-name">${item.name}</h3>
                    <span class="kh-tm-item-handle">${item.handle || "@instagram"}</span>
                  </div>
                  <p class="kh-tm-item-quote">&ldquo;${(item.quote || "").replace(/\n/g, " ").slice(0, 160)}...&rdquo;</p>
                </div>
                <div class="kh-tm-item-actions">
                  <button type="button" class="kh-set-move-btn" data-action="up" data-idx="${idx}" ${idx === 0 ? "disabled" : ""} title="Move testimonial earlier in sequence">&uarr; Up</button>
                  <button type="button" class="kh-set-move-btn" data-action="down" data-idx="${idx}" ${idx === testimonials.length - 1 ? "disabled" : ""} title="Move testimonial later in sequence">&darr; Down</button>
                  <button type="button" class="kh-btn-edit" data-idx="${idx}">&#9998; Edit Testimonial</button>
                  <button type="button" class="kh-btn-danger" data-idx="${idx}">&times; Delete</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;

      // Move Up / Down
      mount.querySelectorAll(".kh-set-move-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.idx, 10);
          const action = btn.dataset.action;
          const list = [...testimonials];

          if (action === "up" && idx > 0) {
            const temp = list[idx];
            list[idx] = list[idx - 1];
            list[idx - 1] = temp;
          } else if (action === "down" && idx < list.length - 1) {
            const temp = list[idx];
            list[idx] = list[idx + 1];
            list[idx + 1] = temp;
          }

          saveTestimonialsList(list);
          showToast("Testimonials reordered ✓");
          renderTestimonialsManager(mount);
        });
      });

      // Edit Testimonial (Switches to In-Page Editor!)
      mount.querySelectorAll(".kh-btn-edit").forEach(btn => {
        btn.addEventListener("click", () => {
          editingTestimonialIdx = parseInt(btn.dataset.idx, 10);
          renderView();
        });
      });

      // Delete Testimonial
      mount.querySelectorAll(".kh-btn-danger").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.idx, 10);
          const target = testimonials[idx];
          if (!target) return;
          if (confirm(`Delete testimonial from "${target.name}"?`)) {
            testimonials.splice(idx, 1);
            saveTestimonialsList(testimonials);
            showToast("Testimonial deleted ✓");
            renderTestimonialsManager(mount);
          }
        });
      });

      // Add Testimonial (Switches to In-Page Editor!)
      mount.querySelector("#add-testimonial-page-btn").addEventListener("click", () => {
        editingTestimonialIdx = -1; // -1 means adding new
        renderView();
      });
    }

    // In-Page Full View Testimonial Editor (NO POPUP!)
    function renderTestimonialEditorPage(mount) {
      const testimonials = loadTestimonialsList();
      const isEdit = editingTestimonialIdx >= 0 && testimonials[editingTestimonialIdx];
      const item = isEdit ? testimonials[editingTestimonialIdx] : { name: "", handle: "", quote: "", image: "photos/testimonials/header.jpg" };

      mount.innerHTML = `
        <div class="kh-studio-sec kh-tm-editor-page">
          <div class="kh-tm-editor-header">
            <div>
              <button type="button" class="kh-btn-inline-back" id="tm-editor-back-btn">&larr; Back to Testimonials List</button>
              <h2 class="kh-sec-heading">${isEdit ? `Editing Testimonial: ${item.name}` : "Add New Testimonial"}</h2>
              <p class="kh-sec-desc">Enter client details, testimonial quote, and a 2:3 vertical portrait photograph.</p>
            </div>
          </div>

          <div class="kh-card-box">
            <div class="kh-tm-preview-layout">
              <div>
                <label style="font-family:var(--font-sans); font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:var(--text-muted); display:block; margin-bottom:8px;">Portrait (2:3 Aspect Ratio)</label>
                <div class="kh-tm-portrait-box">
                  <img src="${item.image || 'photos/testimonials/header.jpg'}" id="tm-portrait-preview-img" alt="Portrait preview">
                </div>
                <div style="display:flex; flex-direction:column; gap:8px; margin-top:12px;">
                  <button type="button" class="kh-btn-secondary" id="tm-upload-trigger-btn" style="width:100%; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
                    &#128247; Upload Portrait (2:3)
                  </button>
                  <button type="button" class="kh-btn-secondary" id="tm-portfolio-trigger-btn" style="width:100%; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
                    &#128444; Choose from Portfolio
                  </button>
                  <input type="file" id="tm-page-file-upload" accept="image/jpeg,image/png,image/webp,image/heic,image/*" style="display:none;">
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap:16px;">
                <div class="kh-form-row">
                  <div class="kh-form-field">
                    <label>Client / Model Name</label>
                    <input type="text" id="tm-page-name" class="kh-input" value="${item.name || ''}" placeholder="first &amp; last name" required>
                  </div>
                  <div class="kh-form-field">
                    <label>Instagram Handle</label>
                    <input type="text" id="tm-page-handle" class="kh-input" value="${item.handle || ''}" placeholder="@instagram_handle">
                  </div>
                </div>

                <div class="kh-form-field">
                  <label>Testimonial Quote</label>
                  <textarea id="tm-page-quote" class="kh-textarea" rows="7" placeholder="Share client's kind words and shoot experience...">${item.quote || ''}</textarea>
                </div>

                <div style="display:flex; gap:12px; justify-content:flex-end; margin-top:8px;">
                  <button type="button" class="kh-btn-secondary" id="tm-page-cancel-btn">Cancel</button>
                  <button type="button" class="kh-btn-primary" id="tm-page-save-btn">${isEdit ? "Save Changes ✓" : "Publish Testimonial &rarr;"}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="tm-picker-modal-mount"></div>
      `;

      let curImage = item.image || "photos/testimonials/header.jpg";
      const fileInput = mount.querySelector("#tm-page-file-upload");
      const uploadTriggerBtn = mount.querySelector("#tm-upload-trigger-btn");
      const portfolioTriggerBtn = mount.querySelector("#tm-portfolio-trigger-btn");
      const previewImg = mount.querySelector("#tm-portrait-preview-img");

      uploadTriggerBtn.addEventListener("click", () => {
        fileInput.value = "";
        fileInput.click();
      });

      fileInput.addEventListener("change", async () => {
        if (fileInput.files && fileInput.files[0]) {
          const file = fileInput.files[0];
          showToast("Processing portrait photo (2:3)...");
          try {
            const dataUrl = await fileToPortraitDataUrl(file, 600, 900, 0.82);
            if (dataUrl) {
              curImage = dataUrl;
              previewImg.src = dataUrl;
              showToast("Portrait loaded ✓ Click Save Changes to publish");
            } else {
              showToast("Could not process this file format.");
            }
          } catch (err) {
            console.warn("Portrait processing error:", err);
            showToast("Error processing photo.");
          }
        }
      });

      portfolioTriggerBtn.addEventListener("click", () => {
        openTestimonialImagePicker(mount, (src) => {
          curImage = src;
          previewImg.src = src;
          showToast("Portrait selected from portfolio ✓");
        });
      });

      const returnToList = () => {
        editingTestimonialIdx = null;
        renderView();
      };

      mount.querySelector("#tm-editor-back-btn").addEventListener("click", returnToList);
      mount.querySelector("#tm-page-cancel-btn").addEventListener("click", returnToList);

      mount.querySelector("#tm-page-save-btn").addEventListener("click", () => {
        const name = (mount.querySelector("#tm-page-name").value || "").trim();
        let handle = (mount.querySelector("#tm-page-handle").value || "").trim();
        const quote = (mount.querySelector("#tm-page-quote").value || "").trim();

        if (!name) {
          alert("Please enter a Client / Model Name.");
          return;
        }
        if (!quote) {
          alert("Please enter the Testimonial quote.");
          return;
        }

        if (handle && !handle.startsWith("@")) {
          handle = `@${handle}`;
        }
        const cleanHandle = handle.replace(/^@/, "");
        const href = handle ? `https://www.instagram.com/${cleanHandle}` : "";

        const newObj = {
          name: name.toLowerCase(),
          handle: handle.toLowerCase(),
          href: href,
          image: curImage,
          quote: quote
        };

        if (isEdit) {
          testimonials[editingTestimonialIdx] = newObj;
        } else {
          testimonials.unshift(newObj);
        }

        saveTestimonialsList(testimonials);
        showToast(isEdit ? "Testimonial updated ✓" : "Testimonial added to list ✓");
        returnToList();
      });
    }

    function openTestimonialImagePicker(mount, onSelect) {
      const modalMount = mount.querySelector("#tm-picker-modal-mount");
      if (!modalMount) return;

      const allImages = getAllAvailablePortfolioImages();
      const portraits = allImages.filter(img => !img.isLandscape);
      const listToRender = portraits.length > 0 ? portraits : allImages;

      modalMount.innerHTML = `
        <div class="kh-modal-backdrop">
          <div class="kh-modal-window kh-modal-wide">
            <div class="kh-modal-head">
              <h3>Choose Testimonial Portrait (2:3)</h3>
              <button type="button" class="kh-modal-close" id="tm-picker-close-btn">&times;</button>
            </div>
            <div class="kh-modal-body">
              <div class="kh-picker-grid">
                ${listToRender.map(img => `
                  <div class="kh-picker-card" data-src="${img.src}">
                    <img src="${img.src}" alt="${img.title}" loading="lazy" style="aspect-ratio:2/3; object-fit:cover;">
                    <span class="kh-picker-caption">${img.title}</span>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>
      `;

      const close = () => { modalMount.innerHTML = ""; };
      modalMount.querySelector("#tm-picker-close-btn").addEventListener("click", close);

      modalMount.querySelectorAll(".kh-picker-card").forEach(card => {
        card.addEventListener("click", () => {
          const src = card.dataset.src;
          onSelect(src);
          close();
        });
      });
    }

    /* =========================================================
       TAB 4: UNIFIED INFORMATION PAGES SUITE
       (Book Me, About Me, FAQ, Playlists, Testimonials, Cancellations, Client Portal)
       ========================================================= */
    let activeInfoPageSlug = "book-me";
    let activeFaqCategoryFilter = "all";
    let activePlaylistsSectionFilter = "all";

    function escapeHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function splitParagraphs(text) {
      if (!text) return [];
      return text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    }

    function renderInfoPagesManager(mount) {
      const headersConfig = loadCustomHeadersConfig();
      const pageConfig = headersConfig[activeInfoPageSlug] || {};
      const isBookMe = activeInfoPageSlug === "book-me";
      const isAboutMe = activeInfoPageSlug === "about-me";
      const isFaq = activeInfoPageSlug === "faq";
      const isPlaylists = activeInfoPageSlug === "playlists";
      const isTestimonials = activeInfoPageSlug === "testimonials";
      const isCancellations = activeInfoPageSlug === "cancellations";
      const isClientPortal = activeInfoPageSlug === "client-portal";

      // 1. Initialise Book Me travel & tickers if needed
      if (isBookMe) {
        if (!Array.isArray(pageConfig.travelDates) || !pageConfig.travelDates.length) {
          if (pageConfig.travelTicker) {
            pageConfig.travelDates = pageConfig.travelTicker.includes("/") ?
              pageConfig.travelTicker.split("/").map(s => s.trim()).filter(Boolean) : [pageConfig.travelTicker];
          } else {
            pageConfig.travelDates = ["paris · 12–18 may", "new york · 2–9 june", "milan · 16–22 june"];
          }
        }
        if (typeof pageConfig.travelEnabled !== "boolean") pageConfig.travelEnabled = true;
      }

      // 2. Fetch specific data stores
      const bookMeData = window.BOOK_ME_DATA || { packages: [], contact: {}, features: [] };
      if (!Array.isArray(bookMeData.features) || bookMeData.features.length === 0) {
        bookMeData.features = [
          {
            tag: "the space",
            title: "a little about the studio...",
            body: "The studio is located in one of London's creative hubs in Hackney Wick, a short five-minute walk from the station. Situated on the first floor with abundant natural light. A private changing nook is fashioned with ten-foot poly boards so you can change in complete privacy, and an iron/steamer is always on hand."
          },
          {
            tag: "the approach",
            title: "a little about me...",
            body: "I've been working as a portrait photographer for over six years with brands and model agencies across London, Paris, and Milan. For portfolio shoots, I'm an avid believer that the focus needs to be purely on the model—classic framing, beautiful light, zero gimmicks."
          }
        ];
      }
      const aboutData = window.ABOUT_ME_DATA || {};
      const faqData = window.FAQ_DATA || { categories: [], contactBox: {} };
      const playlistsData = window.PLAYLISTS_DATA || { sections: [] };
      const testimonials = loadTestimonialsList();
      const cancellationsStore = window.CANCELLATIONS_DATA || {};
      const cancellationsData = cancellationsStore.loadCancellationsData ? cancellationsStore.loadCancellationsData() : { introCard: {}, formConfig: {}, subscribers: [] };
      const introCard = cancellationsData.introCard || (cancellationsStore.DEFAULT_DATA ? cancellationsStore.DEFAULT_DATA.introCard : null) || {};
      const formConfig = cancellationsData.formConfig || (cancellationsStore.DEFAULT_DATA ? cancellationsStore.DEFAULT_DATA.formConfig : null) || {};
      const subscribers = cancellationsData.subscribers || [];
      const clientPortalData = window.CLIENT_PORTAL_DATA || { shoots: [] };

      // Ensure the 3 standard FAQ categories exist
      if (!Array.isArray(faqData.categories) || faqData.categories.length === 0) {
        faqData.categories = [
          { id: "clients", num: "01", title: "For clients", desc: "Shoots, image delivery, studio details, wardrobe & preparation", questions: [] },
          { id: "photographers", num: "02", title: "For aspiring photographers", desc: "Camera gear, directing models, editing apps, business & mentoring", questions: [] },
          { id: "general", num: "03", title: "General / Misc", desc: "Inspirations, travel, background, food & personal trivia", questions: [] }
        ];
      }

      // About Me Bio Text Helper
      function getAboutBioBody() {
        if (aboutData.bio && typeof aboutData.bio.body === "string" && aboutData.bio.body.trim()) {
          return aboutData.bio.body;
        }
        if (aboutData.bio && Array.isArray(aboutData.bio.paragraphs) && aboutData.bio.paragraphs.length) {
          return aboutData.bio.paragraphs.join("\n\n");
        }
        return "Challenging the notion that strength and power are masculine traits, my work draws out each whilst still maintaining the true essence of femininity. These are traits that can only be captured when the model is happy, comfortable and relaxed, and I work hard to maintain the best working environment for each and every person I work with. If all three are achieved and everybody is on the same page, then the images will fall into place.\n\nWhen it comes to my travel work, I mainly shoot in a street style so as to properly capture the mood and character of each location. No two places are the same, and I try to reflect that in my work.";
      }
      const currentBioBody = getAboutBioBody();

      // Cancellations Bio Text Helper
      function getCnIntroBody() {
        if (introCard && typeof introCard.body === "string" && introCard.body.trim()) return introCard.body;
        const parts = [];
        if (introCard && introCard.paragraph1) parts.push(introCard.paragraph1.trim());
        if (introCard && introCard.paragraph2) parts.push(introCard.paragraph2.trim());
        if (parts.length > 0) return parts.join("\n\n");
        return "When a scheduled commercial shoot, agency test, or portfolio booking moves dates at short notice, an unexpected studio or location session opens up.\n\nOnce you enter your information below, you will be added directly to my private cancellation list. Whenever a suitable last-minute slot opens up that matches what you are looking for, I will email you personally so you can take the slot before it is shared publicly.";
      }
      const currentCnBody = getCnIntroBody();

      // CSV Data URI for cancellations waitlist export
      const csvHeader = "ID,Name,Email,InstagramOrWebsite,BookingAs,ShootType,TimeAvailable,DateSubscribed\n";
      const csvRows = subscribers.map(s => [
        `"${s.id || ''}"`,
        `"${(s.name || '').replace(/"/g, '""')}"`,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        `"${(s.socialOrWebsite || s.instagram_or_website || s.phone || '').replace(/"/g, '""')}"`,
        `"${(s.bookingAs || s.booking_as || s.role || '').replace(/"/g, '""')}"`,
        `"${(s.shootType || s.shoot_type || '').replace(/"/g, '""')}"`,
        `"${(s.timeOfDay || s.time_of_day || s.location || '').replace(/"/g, '""')}"`,
        `"${s.dateSubscribed || ''}"`
      ].join(",")).join("\n");
      const csvDataUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvHeader + csvRows);
      const defaultSubjectDate = "upcoming opening";
      const initialSubject = `Last Minute Cancellation on ${defaultSubjectDate}`;

      mount.innerHTML = `
        <div class="kh-studio-sec">
          <!-- Main Toolbar -->
          <div class="kh-sec-toolbar">
            <div>
              <h2 class="kh-sec-heading">04 &middot; Information Pages Manager</h2>
              <p class="kh-sec-desc">Master curation suite to edit writing, hero photographs, session rates, FAQs, Spotify soundscapes, testimonials, cancellation alerts, and client portal.</p>
            </div>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
              <a href="#/${activeInfoPageSlug}" class="kh-btn-secondary" style="text-decoration:none;" target="_blank">View Live Page &nearr;</a>
              <button type="button" class="kh-btn-primary" id="save-infopages-top-btn">
                Save Page Settings &amp; Sync Cloud &rarr;
              </button>
            </div>
          </div>

          <!-- Page Pill Selector Bar -->
          <div class="kh-gallery-selector-bar" aria-label="Select information page to customise">
            ${INFO_PAGES_CONFIG.map(cfg => {
              const isActive = cfg.slug === activeInfoPageSlug;
              return `
                <button type="button" class="kh-gallery-pill-btn ${isActive ? 'is-active' : ''}" data-page-slug="${cfg.slug}">
                  <span>${cfg.name}</span>
                  ${cfg.hasBookingTicker ? `<span class="kh-gallery-pill-count" style="background:rgba(209,180,140,0.18); color:#d1b48c; border:1px solid rgba(209,180,140,0.35);">✦ Tickers</span>` : ''}
                  ${cfg.slug === 'cancellations' ? `<span class="kh-gallery-pill-count" style="background:rgba(209,180,140,0.18); color:#d1b48c; border:1px solid rgba(209,180,140,0.35);">${subscribers.length} Waitlist</span>` : ''}
                  ${cfg.slug === 'testimonials' ? `<span class="kh-gallery-pill-count" style="background:rgba(209,180,140,0.18); color:#d1b48c; border:1px solid rgba(209,180,140,0.35);">${testimonials.length} Reviews</span>` : ''}
                  ${cfg.slug === 'client-portal' ? `<span class="kh-gallery-pill-count" style="background:rgba(209,180,140,0.18); color:#d1b48c; border:1px solid rgba(209,180,140,0.35);">${(clientPortalData.shoots || []).length} Shoots</span>` : ''}
                </button>
              `;
            }).join("")}
          </div>

          <!-- Universal Section 1: Hero Image & Header Typography -->
          <div class="kh-card-box" style="padding: 16px; margin-bottom: 24px; border: 1px solid var(--border);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; flex-wrap:wrap; gap:8px;">
              <span class="kh-studio-badge" style="font-size:10px; letter-spacing:0.18em;">LIVE PREVIEW &middot; ${pageConfig.name.toUpperCase()} HERO BANNER</span>
              <span style="font-size:12px; color:var(--text-muted); font-family:var(--font-sans);">Previews live changes in real-time</span>
            </div>
            <div class="kh-hero-preview-frame" style="position:relative; overflow:hidden; border-radius:6px; background:#000;">
              <header class="cinematic-hero-banner" style="margin-bottom:0;">
                <div class="cinematic-hero-banner__img-box">
                  <img id="header-preview-img" src="${pageConfig.heroImage || 'photos/faq/Tara Wagner 1.jpg'}" alt="${pageConfig.name} header" loading="eager">
                  <div class="cinematic-hero-banner__scrim"></div>
                </div>

                ${isBookMe ? `
                  <div class="cinematic-hero-stamp-wrap" style="position:absolute; top:16px; right:16px; display:flex; flex-direction:column; align-items:flex-end; gap:6px; z-index:3;">
                    <div class="cinematic-hero-stamp" id="header-preview-stamp">
                      <span class="cinematic-hero-stamp__icon">&#10022;</span>
                      <span class="cinematic-hero-stamp__text" id="header-preview-stamp-text">${pageConfig.bookingTicker || "currently taking bookings for december and january"}</span>
                    </div>
                    <div class="cinematic-hero-stamp cinematic-hero-stamp--travel" id="header-preview-travel-stamp" style="display:${pageConfig.travelEnabled ? 'inline-flex' : 'none'};">
                      <span class="cinematic-hero-stamp__icon" style="color:#d1b48c;">&#9992;&#xFE0E;</span>
                      <span class="cinematic-hero-stamp__text" id="header-preview-travel-text">${pageConfig.travelTicker || "upcoming travel: paris · 12–18 may"}</span>
                    </div>
                  </div>
                ` : ''}

                <div class="cinematic-hero-banner__content">
                  <div class="cinematic-hero-tag-row" style="margin-bottom:6px;">
                    <span class="cinematic-hero-tag" id="header-preview-tag" style="text-transform:uppercase; letter-spacing:0.22em; font-size:12px; color:var(--accent); font-weight:500;">${pageConfig.tag || 'information'}</span>
                  </div>
                  <h1 class="cinematic-hero-title" id="header-preview-title">${pageConfig.title}</h1>
                  <p class="cinematic-hero-lead" id="header-preview-lead">${pageConfig.intro}</p>
                </div>
              </header>
            </div>
          </div>

          <!-- Controls Grid for Header Settings -->
          <div style="display:grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 28px;">
            <!-- Header Images (Desktop & Mobile Responsive Art Direction) -->
            <div class="kh-card-box">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:8px;">
                <h3 class="kh-box-title" style="margin:0;">Header Photographs (Desktop &amp; Mobile)</h3>
                <span class="kh-studio-badge" style="font-size:9.5px;">RESPONSIVE ART DIRECTION</span>
              </div>
              <p class="kh-sec-desc">Choose two different photographs: an expansive wide banner for desktop monitors, and an intimate vertical portrait that displays cleanly on mobile screens without letterboxing.</p>

              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:20px; margin-top:16px;">
                <!-- Desktop Hero Image -->
                <div style="padding:14px; border:1px solid var(--border); border-radius:6px; background:rgba(255,255,255,0.02);">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <strong style="font-size:12px; letter-spacing:0.12em; text-transform:uppercase; color:var(--text);">🖥 Desktop Banner (Wide)</strong>
                    <span style="font-size:11px; color:var(--text-muted);">Aspect ~ 2.6:1</span>
                  </div>
                  <div style="width:100%; height:110px; border-radius:4px; overflow:hidden; border:1px solid var(--border); background:#111; margin-bottom:12px;">
                    <img id="header-thumb-img" src="${pageConfig.heroImage || 'photos/faq/Tara Wagner 1.jpg'}" alt="Desktop Thumb" style="width:100%; height:100%; object-fit:cover; object-position:center 30%;">
                  </div>
                  <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button type="button" class="kh-btn-primary" id="header-upload-photo-btn" style="font-size:12px; padding:6px 12px;">
                      &#128247; Upload Desktop
                    </button>
                    <button type="button" class="kh-btn-secondary" id="header-pick-library-btn" style="font-size:12px; padding:6px 12px;">
                      &#128444; Library
                    </button>
                    <input type="file" id="header-file-input" accept="image/jpeg,image/png,image/webp,image/heic,image/*" style="position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; z-index: -1;">
                  </div>
                </div>

                <!-- Mobile Hero Image -->
                <div style="padding:14px; border:1px solid var(--border); border-radius:6px; background:rgba(255,255,255,0.02);">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <strong style="font-size:12px; letter-spacing:0.12em; text-transform:uppercase; color:var(--accent);">📱 Mobile Header (Phones)</strong>
                    <span style="font-size:11px; color:var(--text-muted);">Portrait Orientation</span>
                  </div>
                  <div style="width:100%; height:110px; border-radius:4px; overflow:hidden; border:1px solid var(--border); background:#111; margin-bottom:12px;">
                    <img id="header-mobile-thumb-img" src="${pageConfig.heroImageMobile || pageConfig.heroImage || 'photos/black-and-white/004 Flavia Santiago 2.jpg'}" alt="Mobile Thumb" style="width:100%; height:100%; object-fit:cover; object-position:center 25%;">
                  </div>
                  <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button type="button" class="kh-btn-primary" id="header-mobile-upload-photo-btn" style="font-size:12px; padding:6px 12px;">
                      &#128247; Upload Mobile
                    </button>
                    <button type="button" class="kh-btn-secondary" id="header-mobile-pick-library-btn" style="font-size:12px; padding:6px 12px;">
                      &#128444; Library
                    </button>
                    <input type="file" id="header-mobile-file-input" accept="image/jpeg,image/png,image/webp,image/heic,image/*" style="position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; z-index: -1;">
                  </div>
                </div>
              </div>

              <!-- Mobile Aspect Ratio Control -->
              <div style="margin-top:16px; padding-top:14px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div>
                  <label for="header-mobile-aspect-select" style="font-family:var(--font-sans); font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.1em; color:var(--text); display:block; margin-bottom:3px;">
                    Mobile Aspect Ratio Frame:
                  </label>
                  <span style="font-size:11.5px; color:var(--text-muted); font-family:var(--font-sans);">Controls vertical height proportion when viewed on phones.</span>
                </div>
                <select id="header-mobile-aspect-select" class="kh-input" style="width:auto; min-width:210px; font-size:12px; padding:6px 10px;">
                  <option value="4 / 5" ${(pageConfig.heroMobileAspect || "4 / 5") === "4 / 5" ? "selected" : ""}>4:5 Portrait (Recommended)</option>
                  <option value="3 / 4" ${(pageConfig.heroMobileAspect || "4 / 5") === "3 / 4" ? "selected" : ""}>3:4 Vertical Editorial</option>
                  <option value="1 / 1" ${(pageConfig.heroMobileAspect || "4 / 5") === "1 / 1" ? "selected" : ""}>1:1 Square</option>
                  <option value="16 / 10" ${(pageConfig.heroMobileAspect || "4 / 5") === "16 / 10" ? "selected" : ""}>16:10 Landscape (Classic)</option>
                </select>
              </div>
            </div>

            ${isBookMe ? `
              <!-- Book Me Availability Ticker Card -->
              <div class="kh-card-box" style="border: 1px solid rgba(209, 180, 140, 0.45); background: linear-gradient(180deg, rgba(209, 180, 140, 0.04) 0%, rgba(0,0,0,0) 100%);">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                  <span style="color:#d1b48c; font-size:16px;">&#10022;</span>
                  <h3 class="kh-box-title" style="margin:0; color:#d1b48c;">"Currently Taking Bookings" Ticker (Book Me Page)</h3>
                </div>
                <p class="kh-sec-desc">Change the availability wording or booking months shown on the Book Me header badge across all desktop and mobile devices.</p>

                <div class="kh-form-field" style="margin-top:14px;">
                  <label for="header-booking-ticker-input">Availability Badge Text</label>
                  <input type="text" id="header-booking-ticker-input" class="kh-input" value="${pageConfig.bookingTicker || 'currently taking bookings for december and january'}" placeholder="e.g. currently taking bookings for december and january">
                </div>

                <div style="margin-top:12px;">
                  <span style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:var(--text-muted); font-family:var(--font-sans); display:block; margin-bottom:8px;">Quick Month Presets (Click to apply):</span>
                  <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    ${[
                      "currently taking bookings for december and january",
                      "currently taking bookings for january and february",
                      "currently taking bookings for february and march",
                      "currently taking bookings for march and april",
                      "currently taking bookings for spring 2026",
                      "currently taking bookings for summer 2026",
                      "now accepting bookings for this month",
                      "limited studio availability this month"
                    ].map(preset => `
                      <button type="button" class="kh-gallery-pill-btn header-preset-pill" data-preset="${preset}" style="font-size:11px; padding:6px 12px;">
                        ${preset.replace(/^currently taking bookings for /, "")}
                      </button>
                    `).join("")}
                  </div>
                </div>
              </div>

              <!-- Travel Dates & Locations Ticker Card -->
              <div class="kh-card-box" style="border: 1px solid rgba(209, 180, 140, 0.45); background: linear-gradient(180deg, rgba(209, 180, 140, 0.04) 0%, rgba(0,0,0,0) 100%);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:8px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="color:#d1b48c; font-size:16px;">&#9992;&#xFE0E;</span>
                    <div>
                      <h3 class="kh-box-title" style="margin:0; color:#d1b48c;">Travel Dates &amp; Locations Ticker</h3>
                      <p class="kh-sec-desc" style="margin:2px 0 0;">Turn this on when travelling to show upcoming tour cities and dates on both the Splash page and Book Me banner.</p>
                    </div>
                  </div>
                  <label class="kh-toggle-wrap ${pageConfig.travelEnabled ? 'is-checked' : ''}" id="travel-ticker-toggle-label" title="Toggle travel dates ticker visibility">
                    <input type="checkbox" id="travel-ticker-toggle" style="position:absolute; opacity:0; pointer-events:none;" ${pageConfig.travelEnabled ? 'checked' : ''}>
                    <span class="kh-toggle-track">
                      <span class="kh-toggle-thumb"></span>
                    </span>
                    <span class="kh-toggle-label" id="travel-ticker-toggle-status">${pageConfig.travelEnabled ? 'ACTIVE · VISIBLE' : 'OFF · HIDDEN'}</span>
                  </label>
                </div>

                <div id="travel-ticker-fields-wrap" style="transition: opacity 0.3s ease; opacity: ${pageConfig.travelEnabled ? '1' : '0.45'}; pointer-events: ${pageConfig.travelEnabled ? 'auto' : 'none'};">
                  <p class="kh-sec-desc" style="margin:4px 0 12px; font-size:12px;">Add your travel tour stops below. They will automatically cycle every 2.8s on your Book Me page header and Splash screen.</p>
                  <div id="headers-travel-stops-mount"></div>
                </div>
              </div>
            ` : ''}

            <!-- Header Writing & Typography Card -->
            <div class="kh-card-box">
              <h3 class="kh-box-title">Header Writing &amp; Typography</h3>
              <p class="kh-sec-desc">Edit the category badge, the main title (writing ON the header), and the lead intro (writing UNDER the header).</p>

              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:18px; margin-top:14px;">
                <div class="kh-form-field">
                  <label for="header-tag-input">Section Tag / Badge</label>
                  <input type="text" id="header-tag-input" class="kh-input" value="${escapeHtml(pageConfig.tag || '')}" placeholder="e.g. london studio booking">
                  <span class="kh-hint">Uppercase category tag shown above title.</span>
                </div>

                <div class="kh-form-field">
                  <label for="header-title-input">Header Title (Writing ON Header)</label>
                  <input type="text" id="header-title-input" class="kh-input" value="${escapeHtml(pageConfig.title || '')}" placeholder="Page title...">
                  <span class="kh-hint">Primary heading in Big Caslon font.</span>
                </div>
              </div>

              <div class="kh-form-field" style="margin-top:16px;">
                <label for="header-intro-input">Writing UNDER Header (Lead Narrative / Subtitle)</label>
                <textarea id="header-intro-input" class="kh-textarea" rows="3" placeholder="Lead text under header...">${escapeHtml(pageConfig.intro || '')}</textarea>
                <span class="kh-hint">Introductory paragraph displayed beneath the hero photograph banner.</span>
              </div>
            </div>
          </div>

          <!-- =========================================================
               PAGE-SPECIFIC EDITORIAL EDITORS
               ========================================================= -->

          ${isBookMe ? `
            <!-- BOOK ME SPECIFIC SECTION -->
            <!-- Direct Booking Email Address -->
            <div class="kh-studio-card" style="padding:24px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px; margin-bottom:28px;">
              <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px; margin-bottom:18px;">
                <h3 style="font-family:var(--font-caslon); font-size:24px; text-transform:lowercase; margin:0;">direct booking contact &amp; routing</h3>
                <p style="font-size:14px; color:var(--text-muted); margin:5px 0 0 0;">Manage your primary studio email address for client enquiries and mailto booking links.</p>
              </div>

              <div class="kh-form-field">
                <label for="book-me-direct-email">Direct Booking Email Address *</label>
                <input type="email" id="book-me-direct-email" class="kh-input" value="${escapeHtml(bookMeData.contact?.email || 'bookings@korayhussein.com')}" placeholder="e.g. bookings@korayhussein.com">
                <span class="kh-hint">Client inquiries submitted on Book Me and direct email links across the site are routed to this address.</span>
              </div>
            </div>

            <!-- The Space & The Approach (Studio Story & Approach Spread) -->
            <div class="kh-studio-card" style="padding:24px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px; margin-bottom:28px;">
              <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px; margin-bottom:18px;">
                <h3 style="font-family:var(--font-caslon); font-size:24px; text-transform:lowercase; margin:0;">the space &amp; the approach (editorial story spread)</h3>
                <p style="font-size:14px; color:var(--text-muted); margin:5px 0 0 0;">Edit the section badges, headings, and writing for the two editorial columns displayed directly beneath the Book Me header.</p>
              </div>

              <div id="bm-features-mount" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
                ${(bookMeData.features || []).map((feat, fIdx) => `
                  <div class="kh-bm-feature-editor-card" data-feature-idx="${fIdx}" style="background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:10px;">
                      <span class="bm-tag bm-feat-card-badge" data-feature-idx="${fIdx}" style="margin-bottom:0; font-size:11px;">${escapeHtml(feat.tag || 'EDITORIAL FEATURE').toUpperCase()}</span>
                      <span style="font-size:11px; color:var(--text-muted); font-family:var(--font-sans);">Column 0${fIdx + 1}</span>
                    </div>

                    <div class="kh-form-field" style="margin-bottom:14px;">
                      <label class="kh-label" style="font-size:12px;">Section Tag / Badge *</label>
                      <input type="text" class="kh-input bm-feature-tag-input" data-feature-idx="${fIdx}" value="${escapeHtml(feat.tag || '')}" placeholder="e.g. the space">
                      <span class="kh-hint">Uppercase category badge in accent colour.</span>
                    </div>

                    <div class="kh-form-field" style="margin-bottom:14px;">
                      <label class="kh-label" style="font-size:12px;">Headline / Title *</label>
                      <input type="text" class="kh-input bm-feature-title-input" data-feature-idx="${fIdx}" value="${escapeHtml(feat.title || '')}" placeholder="e.g. a little about the studio...">
                    </div>

                    <div class="kh-form-field">
                      <label class="kh-label" style="font-size:12px;">Story Writing &amp; Body Text *</label>
                      <textarea class="kh-textarea bm-feature-body-input" data-feature-idx="${fIdx}" rows="6" placeholder="Write column details...">${escapeHtml(feat.body || '')}</textarea>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>

            <!-- Session Packages & Pricing Cards Editor -->
            <div class="kh-studio-card" style="padding:24px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px; margin-bottom:28px;">
              <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px; margin-bottom:18px;">
                <h3 style="font-family:var(--font-caslon); font-size:24px; text-transform:lowercase; margin:0;">session packages &amp; pricing cards ("choose a session")</h3>
                <p style="font-size:14px; color:var(--text-muted); margin:5px 0 0 0;">Edit the card titles, duration, prices, package descriptions, deposit notes, and tier rates displayed on your Book Me page.</p>
              </div>

              <div id="bm-packages-mount" style="display:flex; flex-direction:column; gap:20px;">
                ${(bookMeData.packages || []).map((pkg) => `
                  <div class="kh-bm-pkg-editor-card" data-pkg-id="${pkg.id}" style="background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:10px; flex-wrap:wrap; gap:8px;">
                      <span class="kh-studio-badge" style="font-size:11px;">${escapeHtml(pkg.category || 'SESSION').toUpperCase()} &middot; ${escapeHtml(pkg.title).toUpperCase()}</span>
                      <span style="font-size:12px; color:var(--text-muted); font-family:var(--font-sans);">Package ID: <code>${pkg.id}</code></span>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin-bottom:14px;">
                      <div>
                        <label class="kh-label" style="font-size:12px;">Card Title *</label>
                        <input type="text" class="kh-input bm-pkg-title-input" data-pkg-id="${pkg.id}" value="${escapeHtml(pkg.title)}" placeholder="e.g. portfolio session">
                      </div>
                      <div>
                        <label class="kh-label" style="font-size:12px;">Session Duration / Subtitle *</label>
                        <input type="text" class="kh-input bm-pkg-details-input" data-pkg-id="${pkg.id}" value="${escapeHtml(pkg.details)}" placeholder="e.g. Two hour session">
                      </div>
                      <div>
                        <label class="kh-label" style="font-size:12px;">Price Displayed on Card *</label>
                        <input type="text" class="kh-input bm-pkg-price-input" data-pkg-id="${pkg.id}" value="${escapeHtml(pkg.price)}" placeholder="e.g. from £300, £110">
                        <span class="kh-hint">Prominent price text shown on card face.</span>
                      </div>
                    </div>

                    <div style="margin-bottom:14px;">
                      <label class="kh-label" style="font-size:12px;">Card Summary Description *</label>
                      <textarea class="kh-textarea bm-pkg-desc-input" data-pkg-id="${pkg.id}" rows="2" placeholder="Summary text on card...">${escapeHtml(pkg.desc)}</textarea>
                    </div>

                    <div style="margin-bottom:14px;">
                      <label class="kh-label" style="font-size:12px;">Full Drawer Description (When client expands session)</label>
                      <textarea class="kh-textarea bm-pkg-fulldesc-input" data-pkg-id="${pkg.id}" rows="2" placeholder="Full session breakdown...">${escapeHtml(pkg.fullDesc || pkg.desc)}</textarea>
                    </div>

                    ${pkg.depositNote !== undefined ? `
                      <div style="margin-bottom:14px;">
                        <label class="kh-label" style="font-size:12px;">Deposit &amp; Notice Policy Note</label>
                        <input type="text" class="kh-input bm-pkg-deposit-input" data-pkg-id="${pkg.id}" value="${escapeHtml(pkg.depositNote || '')}" placeholder="e.g. Only a 50% deposit is required to secure the slot...">
                      </div>
                    ` : ''}

                    <!-- Image Packages & Pricing Tiers -->
                    ${pkg.options && pkg.options.length ? `
                      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:14px; margin-top:12px;">
                        <span style="font-size:11.5px; text-transform:uppercase; letter-spacing:0.1em; color:#d1b48c; font-weight:600; display:block; margin-bottom:10px;">Image Packages &amp; Pricing Tiers:</span>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                          ${pkg.options.map((opt, optIdx) => `
                            <div style="display:grid; grid-template-columns: 1fr 1fr 120px; gap:10px; align-items:center;">
                              <div>
                                <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:2px;">Tier Label</label>
                                <input type="text" class="kh-input bm-pkg-opt-label" data-pkg-id="${pkg.id}" data-opt-idx="${optIdx}" value="${escapeHtml(opt.label)}">
                              </div>
                              <div>
                                <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:2px;">Count / Note</label>
                                <input type="text" class="kh-input bm-pkg-opt-count" data-pkg-id="${pkg.id}" data-opt-idx="${optIdx}" value="${escapeHtml(opt.countText)}">
                              </div>
                              <div>
                                <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:2px;">Price (£)</label>
                                <input type="number" class="kh-input bm-pkg-opt-price" data-pkg-id="${pkg.id}" data-opt-idx="${optIdx}" value="${opt.price}">
                              </div>
                            </div>
                          `).join("")}
                        </div>
                      </div>
                    ` : ''}

                    <!-- Polaroids Add-on Price -->
                    ${pkg.addOns && pkg.addOns.length ? `
                      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:14px; margin-top:12px;">
                        <span style="font-size:11.5px; text-transform:uppercase; letter-spacing:0.1em; color:#d1b48c; font-weight:600; display:block; margin-bottom:10px;">Add-On Options:</span>
                        ${pkg.addOns.map((addon, aIdx) => `
                          <div style="display:grid; grid-template-columns: 1fr 120px; gap:10px; align-items:center;">
                            <div>
                              <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:2px;">Add-on Label</label>
                              <input type="text" class="kh-input bm-pkg-addon-label" data-pkg-id="${pkg.id}" data-addon-idx="${aIdx}" value="${escapeHtml(addon.label)}">
                            </div>
                            <div>
                              <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:2px;">Add-on Price (£)</label>
                              <input type="number" class="kh-input bm-pkg-addon-price" data-pkg-id="${pkg.id}" data-addon-idx="${aIdx}" value="${addon.price}">
                            </div>
                          </div>
                        `).join("")}
                      </div>
                    ` : ''}

                    <!-- Example Session Photographs (3 Showcase Images) -->
                    <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:16px; margin-top:14px;">
                      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
                        <div>
                          <span style="font-size:11.5px; text-transform:uppercase; letter-spacing:0.1em; color:#d1b48c; font-weight:600; display:block;">Example Session Photographs (3 Showcase Images)</span>
                          <span style="font-size:12px; color:var(--text-muted); display:block; margin-top:3px;">Select the 3 photographs displayed when clients expand this package on the Book Me page.</span>
                        </div>
                      </div>
                      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:14px;">
                        ${[0, 1, 2].map(imgIdx => {
                          const showcase = (bookMeData.showcases || []).find(s => s.id === pkg.id);
                          const scImg = showcase && showcase.images && showcase.images[imgIdx];
                          const currentImgSrc = (scImg && (typeof scImg === 'string' ? scImg : scImg.src)) || `photos/book-me/${pkg.id}/0${imgIdx + 1}_0${imgIdx + 1}.jpg`;
                          return `
                            <div class="bm-pkg-img-slot" data-pkg-id="${pkg.id}" data-img-idx="${imgIdx}" style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); border-radius:4px; padding:12px; display:flex; flex-direction:column; gap:10px;">
                              <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:11px; font-weight:600; text-transform:uppercase; color:#fff; letter-spacing:0.08em;">Example ${imgIdx + 1}</span>
                                <span style="font-size:10px; color:var(--text-muted);">Slot 0${imgIdx + 1}</span>
                              </div>
                              <div style="width:100%; aspect-ratio:3/4; overflow:hidden; background:#111; border-radius:3px; position:relative; border:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:center;">
                                <img class="bm-pkg-img-preview" data-pkg-id="${pkg.id}" data-img-idx="${imgIdx}" src="${currentImgSrc}" alt="Example ${imgIdx + 1}" style="width:100%; height:100%; object-fit:contain; display:block;">
                              </div>
                              <div style="display:flex; flex-direction:column; gap:6px;">
                                <span class="bm-pkg-img-filename" data-pkg-id="${pkg.id}" data-img-idx="${imgIdx}" style="font-size:10.5px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(currentImgSrc)}">${escapeHtml(currentImgSrc.split('/').pop() || currentImgSrc)}</span>
                                <input type="hidden" class="bm-pkg-img-src-input" data-pkg-id="${pkg.id}" data-img-idx="${imgIdx}" value="${escapeHtml(currentImgSrc)}">
                                <button type="button" class="kh-btn-secondary bm-pkg-pick-img-btn" data-pkg-id="${pkg.id}" data-img-idx="${imgIdx}" style="font-size:11px; padding:6px 10px; width:100%; justify-content:center; gap:6px;">
                                  <span>&#128247; Choose Photo...</span>
                                </button>
                              </div>
                            </div>
                          `;
                        }).join("")}
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          ` : ''}

          ${isAboutMe ? `
            <!-- ABOUT ME SPECIFIC SECTION -->
            <div class="kh-studio-card" style="padding:24px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px; margin-bottom:28px;">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
                <div>
                  <h3 style="font-family:var(--font-caslon); font-size:24px; text-transform:lowercase; margin:0;">biography story &amp; writing (unlimited paragraphs)</h3>
                  <p style="font-size:14px; color:var(--text-muted); margin:5px 0 0 0;">Edit your biography paragraphs, quote, portrait photograph, and studio walking directions.</p>
                </div>
                <button type="button" class="kh-btn-secondary" id="about-reset-bio-btn">Reset Bio to Default</button>
              </div>

              <div style="display:flex; flex-direction:column; gap:20px;">
                <div>
                  <label class="kh-label" for="about-bio-lead">Biography Lead Sentence</label>
                  <input type="text" id="about-bio-lead" class="kh-input" value="${escapeHtml(aboutData.bio?.lead || "I'm Koray Hussein, a portrait and travel photographer based in London, England.")}">
                  <span class="kh-hint">Prominent lead line introducing your personal bio.</span>
                </div>

                <div>
                  <label class="kh-label" for="about-bio-body">Biography Story &amp; Paragraphs (Unlimited) *</label>
                  <textarea id="about-bio-body" class="kh-textarea" rows="7" style="font-size:14.5px; line-height:1.65;" placeholder="Write your story here. Leave a blank line between paragraphs...">${escapeHtml(currentBioBody)}</textarea>
                  <span class="kh-hint">Write as many paragraphs as you like. Separate paragraphs with a blank line to format them cleanly as discrete editorial paragraphs.</span>
                </div>

                <div>
                  <label class="kh-label" for="about-bio-quote">Editorial Pull Quote</label>
                  <input type="text" id="about-bio-quote" class="kh-input" value="${escapeHtml(aboutData.bio?.quote || "Challenging the notion that strength and power are masculine traits, drawing out each whilst maintaining the true essence of femininity.")}">
                </div>

                <!-- Live Bio Preview -->
                <div style="margin-top:10px; padding:18px; border-radius:6px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08);">
                  <span style="font-size:11px; text-transform:uppercase; letter-spacing:0.14em; color:var(--text-muted); display:block; margin-bottom:12px;">Live Biography Preview (As Seen by Visitors):</span>
                  <div id="about-bio-preview" style="font-family:var(--font-caslon); font-size:clamp(17px, 1.8vw, 20px); line-height:1.75; color:rgba(255,255,255,0.85);">
                    ${splitParagraphs(currentBioBody).map(p => `<p style="margin:0 0 14px 0;">${escapeHtml(p)}</p>`).join("")}
                  </div>
                </div>
              </div>
            </div>

            <!-- Contact / Portrait Photo Card -->
            <div class="kh-studio-card" style="padding:24px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px; margin-bottom:28px;">
              <h3 style="font-family:var(--font-caslon); font-size:24px; text-transform:lowercase; margin:0 0 6px 0;">contact section &middot; portrait photograph</h3>
              <p style="font-size:14px; color:var(--text-muted); margin:0 0 18px 0;">The photograph displayed beside the "Say Hello" contact form on your About Me page.</p>

              <div style="display:flex; gap:20px; align-items:center; flex-wrap:wrap;">
                <div style="width:110px; height:140px; border-radius:4px; overflow:hidden; border:1px solid var(--border); background:#111; flex-shrink:0;">
                  <img id="about-portrait-thumb" src="${aboutData.contactPhoto || 'photos/contact/DSCF8633.jpg'}" alt="Portrait" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                  <button type="button" class="kh-btn-primary" id="about-upload-portrait-btn">
                    &#128247; + Upload Portrait Photo
                  </button>
                  <button type="button" class="kh-btn-secondary" id="about-pick-portrait-btn">
                    &#128444; Choose from Library
                  </button>
                  <input type="file" id="about-portrait-file-input" accept="image/*" style="position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; z-index: -1;">
                  <input type="hidden" id="about-contact-photo-val" value="${aboutData.contactPhoto || 'photos/contact/DSCF8633.jpg'}">
                </div>
              </div>
            </div>

            <!-- Studio Location & Walking Directions Card -->
            <div class="kh-studio-card" style="padding:24px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px; margin-bottom:28px;">
              <h3 style="font-family:var(--font-caslon); font-size:24px; text-transform:lowercase; margin:0 0 6px 0;">studio location &amp; walking directions</h3>
              <p style="font-size:14px; color:var(--text-muted); margin:0 0 18px 0;">Update your studio name, address, Google Maps links, and directions from the station.</p>

              <div style="display:flex; flex-direction:column; gap:18px;">
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:18px;">
                  <div>
                    <label class="kh-label" for="about-studio-name">Studio Name</label>
                    <input type="text" id="about-studio-name" class="kh-input" value="${escapeHtml(aboutData.studio?.name || 'Grow Studios')}">
                  </div>
                  <div>
                    <label class="kh-label" for="about-studio-address">Full Address</label>
                    <input type="text" id="about-studio-address" class="kh-input" value="${escapeHtml(aboutData.studio?.address?.full || 'Grow Studios, 92 Wallis Road, Hackney Wick, London E9 5LN')}">
                  </div>
                </div>

                <div>
                  <label class="kh-label" for="about-studio-directions">Walking Directions from Station (Unlimited)</label>
                  <textarea id="about-studio-directions" class="kh-textarea" rows="4">${escapeHtml(aboutData.studio?.directions || "My studio is located a short three minute walk from Hackney Wick station, inside Grow Studios.\n\nTo get to the studio from the station you just turn left when coming out, through the small tunnel, then turn right and then right again. You should find yourself in the area's car park. Grow Studio is at the end of the car park on the right.")}</textarea>
                  <span class="kh-hint">Separate paragraphs with blank lines.</span>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:18px;">
                  <div>
                    <label class="kh-label" for="about-studio-gmaps">Google Maps Direct Link</label>
                    <input type="url" id="about-studio-gmaps" class="kh-input" value="${escapeHtml(aboutData.studio?.googleMapsUrl || 'https://www.google.com/maps/search/?api=1&query=Grow+Studios+92+Wallis+Road+Hackney+Wick+London+E9+5LN')}">
                  </div>
                  <div>
                    <label class="kh-label" for="about-studio-embed">Google Maps Embed URL</label>
                    <input type="url" id="about-studio-embed" class="kh-input" value="${escapeHtml(aboutData.studio?.embedUrl || 'https://maps.google.com/maps?q=Grow%20Studios%2C%2092%20Wallis%20Road%2C%20Hackney%20Wick%2C%20London%20E9%205LN&t=&z=16&ie=UTF8&iwloc=&output=embed')}">
                  </div>
                </div>
              </div>
            </div>
          ` : ''}

          ${isFaq ? `
            <!-- FAQ SPECIFIC SECTION -->
            <div class="kh-studio-card" style="padding:24px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px; margin-bottom:28px;">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
                <div>
                  <h3 style="font-family:var(--font-caslon); font-size:24px; text-transform:lowercase; margin:0;">
                    frequently asked questions
                    <span style="font-family:var(--font-sans); font-size:13.5px; font-weight:600; color:var(--text-muted); text-transform:uppercase;">
                      &middot; ${(faqData.categories || []).reduce((acc, c) => acc + (c.questions ? c.questions.length : 0), 0)} Questions
                    </span>
                  </h3>
                  <p style="font-size:14px; color:var(--text-muted); margin:5px 0 0 0;">Drag and drop questions to reorder, tag as "for clients", "for aspiring photographers", or "general/misc", and edit in-place.</p>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                  <button type="button" class="kh-btn-primary" id="faq-open-add-modal-btn">+ Add New Question</button>
                </div>
              </div>

              <!-- FAQ Category Filter Bar -->
              <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px;">
                <button type="button" class="kh-gallery-pill-btn faq-filter-pill ${activeFaqCategoryFilter === 'all' ? 'is-active' : ''}" data-cat-filter="all">
                  <span>All Questions (${(faqData.categories || []).reduce((acc, c) => acc + (c.questions ? c.questions.length : 0), 0)})</span>
                </button>
                ${(faqData.categories || []).map(c => `
                  <button type="button" class="kh-gallery-pill-btn faq-filter-pill ${activeFaqCategoryFilter === c.id ? 'is-active' : ''}" data-cat-filter="${c.id}">
                    <span>${c.title} (${c.questions ? c.questions.length : 0})</span>
                  </button>
                `).join("")}
              </div>

              <!-- Draggable Questions List -->
              <div id="faq-questions-mount" style="display:flex; flex-direction:column; gap:16px;">
                ${(faqData.categories || []).map(cat => {
                  if (activeFaqCategoryFilter !== "all" && activeFaqCategoryFilter !== cat.id) return "";
                  const questions = cat.questions || [];
                  return questions.map((qItem, qIdx) => {
                    const ansText = Array.isArray(qItem.a) ? qItem.a.join("\n\n") : (qItem.a || "");
                    const isFirst = qIdx === 0;
                    const isLast = qIdx === questions.length - 1;
                    return `
                      <div class="faq-item-card" draggable="true" data-cat-id="${cat.id}" data-q-idx="${qIdx}" style="background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:18px; cursor:default; user-select:none;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
                          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                            <span class="faq-drag-handle" style="cursor:grab; color:var(--text-muted); font-size:14px; display:inline-flex; align-items:center; gap:4px; font-family:var(--font-sans); letter-spacing:0.06em; text-transform:uppercase;" title="Drag and drop to rearrange questions">
                              ⠿ Drag to reorder
                            </span>
                            <div style="display:inline-flex; align-items:center; gap:6px;">
                              <span style="font-size:11px; text-transform:uppercase; color:#d1b48c; font-weight:600; letter-spacing:0.06em;">Section:</span>
                              <select class="kh-select faq-q-cat-select" data-cat-id="${cat.id}" data-q-idx="${qIdx}" style="padding:4px 8px; font-size:12.5px; height:auto; width:auto;">
                                <option value="clients" ${cat.id === "clients" ? "selected" : ""}>for clients</option>
                                <option value="photographers" ${cat.id === "photographers" ? "selected" : ""}>for aspiring photographers</option>
                                <option value="general" ${cat.id === "general" ? "selected" : ""}>general/misc</option>
                              </select>
                            </div>
                            <span class="kh-studio-badge" style="font-size:10px;">#${qIdx + 1}</span>
                          </div>

                          <div style="display:flex; align-items:center; gap:6px;">
                            <button type="button" class="kh-btn-secondary faq-move-up-btn" data-cat-id="${cat.id}" data-q-idx="${qIdx}" ${isFirst ? 'disabled style="opacity:0.3; pointer-events:none;"' : ''} title="Move Up">
                              ▲ Up
                            </button>
                            <button type="button" class="kh-btn-secondary faq-move-down-btn" data-cat-id="${cat.id}" data-q-idx="${qIdx}" ${isLast ? 'disabled style="opacity:0.3; pointer-events:none;"' : ''} title="Move Down">
                              ▼ Down
                            </button>
                            <button type="button" class="faq-del-btn" data-cat-id="${cat.id}" data-q-idx="${qIdx}" style="background:none; border:none; color:#ff6b6b; cursor:pointer; font-size:13px; padding:6px 10px; font-weight:500;">
                              Remove &times;
                            </button>
                          </div>
                        </div>

                        <div style="display:flex; flex-direction:column; gap:12px;">
                          <div>
                            <label class="kh-label" style="font-size:12px;">Question Title *</label>
                            <input type="text" class="kh-input faq-q-input" style="font-family:var(--font-caslon); font-size:16px;" value="${escapeHtml(qItem.q)}" placeholder="Question title...">
                          </div>
                          <div>
                            <label class="kh-label" style="font-size:12px;">Answer Paragraphs (Leave blank line between paragraphs) *</label>
                            <textarea class="kh-textarea faq-a-textarea" rows="3" style="font-size:14px; line-height:1.55;" placeholder="Answer text...">${escapeHtml(ansText)}</textarea>
                          </div>
                        </div>
                      </div>
                    `;
                  }).join("");
                }).join("")}
              </div>
            </div>

            <!-- FAQ Contact Box Editor ("Got a question?") -->
            <div class="kh-studio-card" style="padding:24px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px; margin-bottom:28px;">
              <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px; margin-bottom:18px;">
                <h3 style="font-family:var(--font-caslon); font-size:24px; text-transform:lowercase; margin:0;">contact box at bottom of page ("got a question?")</h3>
                <p style="font-size:14px; color:var(--text-muted); margin:5px 0 0 0;">Edit the enquiry box shown at the bottom of the FAQ page for visitors with unanswered questions.</p>
              </div>

              <div style="display:flex; flex-direction:column; gap:18px;">
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:18px;">
                  <div>
                    <label class="kh-label" for="faq-contact-tag">Tag / Badge</label>
                    <input type="text" id="faq-contact-tag" class="kh-input" value="${escapeHtml(faqData.contactBox?.tag || 'GOT A QUESTION?')}">
                  </div>
                  <div>
                    <label class="kh-label" for="faq-contact-title">Heading *</label>
                    <input type="text" id="faq-contact-title" class="kh-input" value="${escapeHtml(faqData.contactBox?.title || "Have a question that's not answered here?")}">
                  </div>
                </div>

                <div>
                  <label class="kh-label" for="faq-contact-desc">Description</label>
                  <textarea id="faq-contact-desc" class="kh-textarea" rows="2">${escapeHtml(faqData.contactBox?.desc || "Send it through and I'll get back to you with an answer as soon as I can.")}</textarea>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:18px;">
                  <div>
                    <label class="kh-label" for="faq-contact-btn">Button Text</label>
                    <input type="text" id="faq-contact-btn" class="kh-input" value="${escapeHtml(faqData.contactBox?.btnText || 'Send Question →')}">
                  </div>
                  <div>
                    <label class="kh-label" for="faq-contact-email">Direct Contact Email</label>
                    <input type="email" id="faq-contact-email" class="kh-input" value="${escapeHtml(faqData.contactBox?.directEmail || 'contact@korayhussein.com')}">
                  </div>
                </div>
              </div>
            </div>

            <!-- FAQ Add Question Modal Mount -->
            <div id="faq-modal-mount"></div>
          ` : ''}

          ${isPlaylists ? `
            <!-- PLAYLISTS SPECIFIC SECTION -->
            <div class="kh-studio-card" style="padding:24px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px; margin-bottom:28px;">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
                <div>
                  <h3 style="font-family:var(--font-caslon); font-size:24px; text-transform:lowercase; margin:0;">
                    curated spotify playlists
                    <span style="font-family:var(--font-sans); font-size:13.5px; font-weight:600; color:var(--text-muted); text-transform:uppercase;">
                      &middot; ${(playlistsData.sections || []).reduce((acc, s) => acc + (s.playlists ? s.playlists.length : 0), 0)} Playlists
                    </span>
                  </h3>
                  <p style="font-size:14px; color:var(--text-muted); margin:5px 0 0 0;">Add new playlists, update Spotify URLs, change cover art, reorder (Move Up/Down), or remove playlists.</p>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                  <button type="button" class="kh-btn-primary" id="pl-open-add-modal-btn">+ Add New Playlist</button>
                </div>
              </div>

              <!-- Spotify Profile URL -->
              <div class="kh-form-field" style="margin-bottom:20px;">
                <label for="pl-profile-url">Spotify Profile URL</label>
                <input type="url" id="pl-profile-url" class="kh-input" value="${escapeHtml(playlistsData.header?.spotifyProfileUrl || 'https://open.spotify.com/user/korayhussein')}" placeholder="https://open.spotify.com/user/korayhussein">
                <span class="kh-hint">Public link to your main Spotify profile.</span>
              </div>

              <!-- Playlist Section Filter Pills -->
              <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px;">
                <button type="button" class="kh-gallery-pill-btn pl-filter-pill ${activePlaylistsSectionFilter === 'all' ? 'is-active' : ''}" data-sec-filter="all">
                  <span>All Playlists (${(playlistsData.sections || []).reduce((acc, s) => acc + (s.playlists ? s.playlists.length : 0), 0)})</span>
                </button>
                ${(playlistsData.sections || []).map(s => `
                  <button type="button" class="kh-gallery-pill-btn pl-filter-pill ${activePlaylistsSectionFilter === s.id ? 'is-active' : ''}" data-sec-filter="${s.id}">
                    <span>${s.title} (${s.playlists ? s.playlists.length : 0})</span>
                  </button>
                `).join("")}
              </div>

              <!-- Playlists List -->
              <div id="pl-items-mount" style="display:flex; flex-direction:column; gap:18px;">
                ${(playlistsData.sections || []).map(sec => {
                  if (activePlaylistsSectionFilter !== "all" && activePlaylistsSectionFilter !== sec.id) return "";
                  const plList = sec.playlists || [];
                  return plList.map((pl, plIdx) => {
                    const isFirst = plIdx === 0;
                    const isLast = plIdx === plList.length - 1;
                    return `
                      <div class="pl-item-card" data-sec-id="${sec.id}" data-pl-idx="${plIdx}" style="background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:18px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
                          <div style="display:flex; align-items:center; gap:8px;">
                            <span class="kh-studio-badge" style="font-size:10px;">${sec.title.toUpperCase()} &middot; #${pl.num || (plIdx + 1)}</span>
                          </div>
                          <div style="display:flex; align-items:center; gap:6px;">
                            <button type="button" class="kh-btn-secondary pl-move-up-btn" data-sec-id="${sec.id}" data-pl-idx="${plIdx}" ${isFirst ? 'disabled style="opacity:0.3; pointer-events:none;"' : ''} title="Move Up">
                              ▲ Move Up
                            </button>
                            <button type="button" class="kh-btn-secondary pl-move-down-btn" data-sec-id="${sec.id}" data-pl-idx="${plIdx}" ${isLast ? 'disabled style="opacity:0.3; pointer-events:none;"' : ''} title="Move Down">
                              ▼ Move Down
                            </button>
                            <button type="button" class="pl-del-btn" data-sec-id="${sec.id}" data-pl-idx="${plIdx}" style="background:none; border:none; color:#ff6b6b; cursor:pointer; font-size:13px; padding:6px 10px; font-weight:500;">
                              Remove &times;
                            </button>
                          </div>
                        </div>

                        <div style="display:grid; grid-template-columns:auto 1fr; gap:18px; align-items:start;">
                          <!-- Artwork -->
                          <div style="display:flex; flex-direction:column; gap:8px; align-items:center;">
                            <div style="width:80px; height:80px; border-radius:4px; overflow:hidden; border:1px solid var(--border); background:#111;">
                              <img class="pl-thumb-img" src="${pl.image || 'photos/playlists/header.jpg'}" alt="Cover" style="width:100%; height:100%; object-fit:cover;">
                            </div>
                            <button type="button" class="kh-btn-secondary pl-change-art-btn" data-sec-id="${sec.id}" data-pl-idx="${plIdx}" style="font-size:11px; padding:4px 8px;">
                              Change Art
                            </button>
                            <input type="hidden" class="pl-img-val" value="${pl.image || 'photos/playlists/header.jpg'}">
                          </div>

                          <!-- Fields -->
                          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:14px; width:100%;">
                            <div>
                              <label class="kh-label" style="font-size:12px;">Playlist Title *</label>
                              <input type="text" class="kh-input pl-title-input" value="${escapeHtml(pl.title)}" placeholder="e.g. studio one">
                            </div>
                            <div>
                              <label class="kh-label" style="font-size:12px;">Spotify Playlist URL *</label>
                              <div style="display:flex; gap:6px;">
                                <input type="url" class="kh-input pl-url-input" value="${escapeHtml(pl.url)}" placeholder="https://open.spotify.com/playlist/..." style="flex:1;">
                                <a href="${escapeHtml(pl.url)}" target="_blank" rel="noopener" class="kh-btn-secondary" style="text-decoration:none; white-space:nowrap; padding:8px 12px;" title="Test Spotify Link">↗</a>
                              </div>
                            </div>
                            <div style="grid-column: 1 / -1;">
                              <label class="kh-label" style="font-size:12px;">Atmosphere &amp; Mood Tag</label>
                              <input type="text" class="kh-input pl-mood-input" value="${escapeHtml(pl.mood || '')}" placeholder="e.g. Calm · Warm daylight · Ambient soul">
                            </div>
                          </div>
                        </div>
                      </div>
                    `;
                  }).join("");
                }).join("")}
              </div>
            </div>

            <!-- Playlist Add Modal Mount -->
            <div id="pl-modal-mount"></div>
          ` : ''}

          ${isTestimonials ? `
            <!-- TESTIMONIALS SPECIFIC SECTION -->
            <div class="kh-studio-card" style="padding:24px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px; margin-bottom:28px;">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
                <div>
                  <h3 style="font-family:var(--font-caslon); font-size:24px; text-transform:lowercase; margin:0;">
                    testimonials &amp; client words
                    <span style="font-family:var(--font-sans); font-size:13.5px; font-weight:600; color:var(--text-muted); text-transform:uppercase;">
                      &middot; ${testimonials.length} Reviews
                    </span>
                  </h3>
                  <p style="font-size:14px; color:var(--text-muted); margin:5px 0 0 0;">Add new testimonials with 2:3 vertical portrait imagery, edit quotes, or reorder sequence.</p>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                  <button type="button" class="kh-btn-primary" id="tm-open-add-modal-btn">+ Add New Testimonial</button>
                </div>
              </div>

              <!-- Testimonials List -->
              <div id="tm-items-mount" style="display:flex; flex-direction:column; gap:18px;">
                ${testimonials.length === 0 ? `<p class="kh-empty-state">No testimonials yet. Click "+ Add New Testimonial" above.</p>` : ''}
                ${testimonials.map((item, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === testimonials.length - 1;
                  return `
                    <div class="kh-tm-editor-card" data-idx="${idx}" style="background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:18px;">
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
                        <span class="kh-studio-badge" style="font-size:10px;">REVIEW #${idx + 1} &middot; ${escapeHtml(item.name || 'Client').toUpperCase()}</span>
                        <div style="display:flex; align-items:center; gap:6px;">
                          <button type="button" class="kh-btn-secondary tm-move-up-btn" data-idx="${idx}" ${isFirst ? 'disabled style="opacity:0.3; pointer-events:none;"' : ''}>▲ Up</button>
                          <button type="button" class="kh-btn-secondary tm-move-down-btn" data-idx="${idx}" ${isLast ? 'disabled style="opacity:0.3; pointer-events:none;"' : ''}>▼ Down</button>
                          <button type="button" class="tm-del-btn" data-idx="${idx}" style="background:none; border:none; color:#ff6b6b; cursor:pointer; font-size:13px; padding:6px 10px; font-weight:500;">Remove &times;</button>
                        </div>
                      </div>

                      <div style="display:grid; grid-template-columns:auto 1fr; gap:18px; align-items:start;">
                        <!-- Portrait Image -->
                        <div style="display:flex; flex-direction:column; gap:8px; align-items:center;">
                          <div style="width:70px; height:105px; border-radius:4px; overflow:hidden; border:1px solid var(--border); background:#111;">
                            <img class="tm-thumb-img" src="${item.image || 'photos/testimonials/header.jpg'}" alt="${escapeHtml(item.name)}" style="width:100%; height:100%; object-fit:cover;">
                          </div>
                          <button type="button" class="kh-btn-secondary tm-change-art-btn" data-idx="${idx}" style="font-size:11px; padding:4px 8px;">Change Photo</button>
                          <input type="hidden" class="tm-img-val" value="${item.image || 'photos/testimonials/header.jpg'}">
                        </div>

                        <!-- Fields -->
                        <div style="display:flex; flex-direction:column; gap:12px; width:100%;">
                          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
                            <div>
                              <label class="kh-label" style="font-size:12px;">Client / Model Name *</label>
                              <input type="text" class="kh-input tm-name-input" value="${escapeHtml(item.name || '')}" placeholder="e.g. Elena Rostova">
                            </div>
                            <div>
                              <label class="kh-label" style="font-size:12px;">Handle / Role</label>
                              <input type="text" class="kh-input tm-handle-input" value="${escapeHtml(item.handle || item.role || '')}" placeholder="e.g. @elenarostova · Storm Models">
                            </div>
                          </div>
                          <div>
                            <label class="kh-label" style="font-size:12px;">Testimonial Quote *</label>
                            <textarea class="kh-textarea tm-quote-input" rows="3" style="font-size:14px; line-height:1.6;" placeholder="Client's review or experience...">${escapeHtml(item.quote || '')}</textarea>
                          </div>
                        </div>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>

            <!-- Testimonials Add Modal Mount -->
            <div id="tm-modal-mount"></div>
          ` : ''}

          ${isCancellations ? `
            <!-- CANCELLATIONS & ALERTS SPECIFIC SECTION -->
            <!-- Section 1: Priority Notification List Card Editor -->
            <div class="kh-studio-card" style="margin-bottom:24px; padding:24px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px; flex-wrap:wrap; gap:12px;">
                <div>
                  <h3 style="font-family:var(--font-caslon); font-size:24px; text-transform:lowercase; margin:0;">01 &middot; priority notification card details</h3>
                  <p style="font-size:14px; color:var(--text-muted); margin:5px 0 0 0;">Edit the headline and narrative paragraphs for the introductory invitation card shown to prospective clients.</p>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                  <button type="button" class="kh-btn-secondary" id="cn-reset-intro-btn">Reset Card Copy</button>
                  <button type="button" class="kh-btn-primary" id="cn-save-intro-btn">Save Card Details &check;</button>
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap:20px;">
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:18px; width:100%;">
                  <div>
                    <label class="kh-label" for="cn-intro-tag">Section Tag / Badge *</label>
                    <input type="text" id="cn-intro-tag" class="kh-input" style="width:100%; box-sizing:border-box;" value="${escapeHtml(introCard.tag || 'priority notification list')}" placeholder="e.g. priority notification list">
                    <span class="kh-hint">Small uppercase category tag badge above the headline.</span>
                  </div>

                  <div>
                    <label class="kh-label" for="cn-intro-heading">Card Headline *</label>
                    <input type="text" id="cn-intro-heading" class="kh-input" style="width:100%; box-sizing:border-box;" value="${escapeHtml(introCard.heading || 'direct notifications for short-notice studio dates')}" placeholder="e.g. direct notifications for short-notice studio dates">
                    <span class="kh-hint">Primary headline introducing the private notification policy.</span>
                  </div>
                </div>

                <div style="width:100%;">
                  <label class="kh-label" for="cn-intro-body">Card Narrative &amp; Paragraphs (Unlimited) *</label>
                  <textarea id="cn-intro-body" class="kh-textarea" rows="6" style="width:100%; box-sizing:border-box; font-size:14.5px; line-height:1.65; padding:12px 14px;" placeholder="Write as many paragraphs as you like. Leave a blank line between each paragraph...">${escapeHtml(currentCnBody)}</textarea>
                  <span class="kh-hint">Write as many paragraphs as you need. Separate each paragraph with a blank line to automatically format them as distinct editorial paragraphs on the card.</span>
                </div>
              </div>

              <!-- Live Preview of the Editorial Card -->
              <div style="margin-top:24px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.08);">
                <span style="font-family:var(--font-sans); font-size:11.5px; text-transform:uppercase; letter-spacing:0.14em; color:var(--text-muted); display:block; margin-bottom:12px;">Live Editorial Card Preview (As Seen by Visitors):</span>
                <div style="background:rgba(255, 255, 255, 0.025); border:1px solid rgba(255, 255, 255, 0.1); border-radius:6px; padding:clamp(20px, 3vw, 32px); width:100%; box-sizing:border-box;">
                  <span id="cn-preview-tag" style="display:inline-block; font-family:var(--font-sans); font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.12em; color:#d1b48c; margin-bottom:10px;">${escapeHtml(introCard.tag || 'priority notification list')}</span>
                  <h4 id="cn-preview-heading" style="font-family:var(--font-caslon); font-size:clamp(22px, 2.5vw, 30px); font-weight:400; line-height:1.25; margin:0 0 16px 0; color:#ffffff; text-transform:lowercase;">
                    ${escapeHtml(introCard.heading || 'direct notifications for short-notice studio dates')}
                  </h4>
                  <div id="cn-preview-body" style="font-family:var(--font-caslon); font-size:clamp(17px, 1.8vw, 20px); line-height:1.7; color:rgba(255,255,255,0.85);">
                    ${splitParagraphs(currentCnBody).map(p => `<p style="margin:0 0 14px 0;">${escapeHtml(p)}</p>`).join("")}
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 2: Sign-Up Form Text & Dropdown Options -->
            <div class="kh-studio-card" style="margin-bottom:24px; padding:24px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px; flex-wrap:wrap; gap:12px;">
                <div>
                  <h3 style="font-family:var(--font-caslon); font-size:24px; text-transform:lowercase; margin:0;">02 &middot; sign-up form text &amp; dropdown options ("join the list")</h3>
                  <p style="font-size:14px; color:var(--text-muted); margin:5px 0 0 0;">Customise the title, instructions, dropdown selections, button text, and success screen for the client sign-up form.</p>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                  <button type="button" class="kh-btn-secondary" id="cn-reset-form-btn">Reset Form to Defaults</button>
                  <button type="button" class="kh-btn-primary" id="cn-save-form-btn">Save Form Settings &check;</button>
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap:20px;">
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:18px; width:100%;">
                  <div>
                    <label class="kh-label" for="cn-form-tag">Form Section Tag / Badge *</label>
                    <input type="text" id="cn-form-tag" class="kh-input" value="${escapeHtml(formConfig.tag || 'join the list')}" placeholder="e.g. join the list">
                    <span class="kh-hint">Small tag badge above the form title.</span>
                  </div>

                  <div>
                    <label class="kh-label" for="cn-form-title">Form Title *</label>
                    <input type="text" id="cn-form-title" class="kh-input" value="${escapeHtml(formConfig.title || 'enter your details')}" placeholder="e.g. enter your details">
                    <span class="kh-hint">Primary heading above the form fields.</span>
                  </div>
                </div>

                <div style="width:100%;">
                  <label class="kh-label" for="cn-form-subtitle">Form Subtitle / Instructions *</label>
                  <input type="text" id="cn-form-subtitle" class="kh-input" value="${escapeHtml(formConfig.subtitle || "Fill in the fields below. I'll reach out directly by email as soon as an opening arises.")}" placeholder="Instructions to users...">
                  <span class="kh-hint">Short instructional note shown directly beneath the title.</span>
                </div>

                <!-- Dropdown Options (3 Columns) -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:18px; width:100%; margin-top:6px;">
                  <div>
                    <label class="kh-label" for="cn-form-opt-booking">&ldquo;Booking As&rdquo; Options (1 per line) *</label>
                    <textarea id="cn-form-opt-booking" class="kh-textarea" rows="5" style="width:100%; box-sizing:border-box; font-size:14px; line-height:1.5;">${escapeHtml((formConfig.bookingAsOptions || [
                      "model (direct booking)",
                      "agency (for represented model)",
                      "actor / creative headshots",
                      "other creative"
                    ]).join("\n"))}</textarea>
                    <span class="kh-hint">Enter one option per line for the booking role dropdown.</span>
                  </div>

                  <div>
                    <label class="kh-label" for="cn-form-opt-shoot">&ldquo;Shoot Focus&rdquo; Options (1 per line) *</label>
                    <textarea id="cn-form-opt-shoot" class="kh-textarea" rows="5" style="width:100%; box-sizing:border-box; font-size:14px; line-height:1.5;">${escapeHtml((formConfig.shootTypeOptions || [
                      "portfolio shoot",
                      "beauty shoot",
                      "polaroids"
                    ]).join("\n"))}</textarea>
                    <span class="kh-hint">Enter one option per line for the shoot type dropdown.</span>
                  </div>

                  <div>
                    <label class="kh-label" for="cn-form-opt-time">&ldquo;Time Available&rdquo; Options (1 per line) *</label>
                    <textarea id="cn-form-opt-time" class="kh-textarea" rows="5" style="width:100%; box-sizing:border-box; font-size:14px; line-height:1.5;">${escapeHtml((formConfig.timeOfDayOptions || [
                      "any (most flexible)",
                      "morning",
                      "daytime",
                      "evening"
                    ]).join("\n"))}</textarea>
                    <span class="kh-hint">Enter one option per line for the session timing dropdown.</span>
                  </div>
                </div>

                <!-- Button & Privacy Note -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:18px; width:100%; margin-top:6px;">
                  <div>
                    <label class="kh-label" for="cn-form-btn-text">Submit Button Text *</label>
                    <input type="text" id="cn-form-btn-text" class="kh-input" value="${escapeHtml(formConfig.submitButtonText || 'Join Cancellation Priority List &rarr;')}" placeholder="e.g. Join Cancellation Priority List &rarr;">
                    <span class="kh-hint">Text shown inside the main submit button.</span>
                  </div>

                  <div>
                    <label class="kh-label" for="cn-form-privacy">Privacy &amp; Confidentiality Note *</label>
                    <input type="text" id="cn-form-privacy" class="kh-input" value="${escapeHtml(formConfig.privacyNote || '🔒 Strictly confidential. I will only contact you personally when a suitable opening occurs.')}" placeholder="Privacy disclaimer...">
                    <span class="kh-hint">Reassurance note shown below the submit button.</span>
                  </div>
                </div>

                <!-- Confirmation State -->
                <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:18px; margin-top:8px;">
                  <span style="font-family:var(--font-sans); font-size:11.5px; text-transform:uppercase; letter-spacing:0.12em; color:#d1b48c; display:block; margin-bottom:12px;">Confirmation / Success Screen (Shown After Client Submits):</span>
                  <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
                    <div>
                      <label class="kh-label" for="cn-form-success-title">Success Heading *</label>
                      <input type="text" id="cn-form-success-title" class="kh-input" value="${escapeHtml(formConfig.successTitle || "you're on the priority notification list")}">
                    </div>
                    <div>
                      <label class="kh-label" for="cn-form-success-desc">Success Description *</label>
                      <input type="text" id="cn-form-success-desc" class="kh-input" value="${escapeHtml(formConfig.successDesc || "Thank you for joining. Whenever an unexpected cancellation or short-notice opening arises, you will receive an immediate private notification at your email address.")}">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 3: Priority Waitlist Roster -->
            <div class="kh-studio-card" style="margin-bottom:24px; padding:24px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px; flex-wrap:wrap; gap:12px;">
                <div>
                  <h3 style="font-family:var(--font-caslon); font-size:24px; text-transform:lowercase; margin:0;">03 &middot; cancellation priority waitlist (${subscribers.length})</h3>
                  <p style="font-size:14px; color:var(--text-muted); margin:5px 0 0 0;">People who signed up to receive short-notice alerts. Click any person's email to start a 1-to-1 email with the cancellation date.</p>
                </div>
                <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                  <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); padding:6px 12px; border-radius:4px;">
                    <label for="cn-subject-date-input" style="font-size:12.5px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color:#d1b48c; white-space:nowrap;">Email Subject Date:</label>
                    <input type="text" id="cn-subject-date-input" class="kh-input" style="width:210px; padding:6px 10px; font-size:14px; height:auto;" value="${escapeHtml(defaultSubjectDate)}" placeholder="e.g. 21st November">
                  </div>
                  <div style="display:flex; gap:8px;">
                    <a href="${csvDataUri}" download="koray_cancellation_priority_subscribers.csv" class="kh-btn-secondary" style="text-decoration:none;">&#128190; Export CSV</a>
                    <button type="button" class="kh-btn-primary" id="cn-add-sub-modal-btn">+ Add Subscriber</button>
                  </div>
                </div>
              </div>

              <div style="background:rgba(209, 180, 140, 0.05); border:1px solid rgba(209, 180, 140, 0.2); padding:12px 16px; border-radius:6px; font-size:13.5px; line-height:1.55; color:var(--text); margin-bottom:18px; display:flex; align-items:center; gap:10px;">
                <span style="color:#d1b48c; font-size:16px;">✉</span>
                <span>Clicking an email address directly opens your email client addressed to <strong>that person only</strong> with the subject <strong>"Last Minute Cancellation on [DATE]"</strong>. No one else is copied in.</span>
              </div>

              ${subscribers.length === 0 ? `
                <div style="text-align:center; padding:40px; color:var(--text-muted); font-size:14px;">No subscribers on the priority waitlist yet.</div>
              ` : `
                <div style="overflow-x:auto;">
                  <table style="width:100%; border-collapse:collapse; text-align:left; font-size:14px;">
                    <thead>
                      <tr style="border-bottom:1px solid rgba(255,255,255,0.12); color:rgba(255,255,255,0.7); text-transform:uppercase; font-size:11.5px; letter-spacing:0.1em; font-weight:600;">
                        <th style="padding:12px 14px;">Name</th>
                        <th style="padding:12px 14px;">Email (Click to Email)</th>
                        <th style="padding:12px 14px;">Instagram / Website</th>
                        <th style="padding:12px 14px;">Booking As</th>
                        <th style="padding:12px 14px;">Shoot Focus</th>
                        <th style="padding:12px 14px;">Time Available</th>
                        <th style="padding:12px 14px;">Joined</th>
                        <th style="padding:12px 14px; text-align:right;">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${subscribers.map(s => {
                        const soc = s.socialOrWebsite || s.instagram_or_website || s.phone || "";
                        let socLink = "";
                        if (soc.startsWith("@")) {
                          socLink = `<a href="https://instagram.com/${escapeHtml(soc.replace('@', ''))}" target="_blank" rel="noopener" style="color:#ffffff; font-size:14px; text-decoration:none;">${escapeHtml(soc)} <span style="font-size:11px;">↗</span></a>`;
                        } else if (soc.includes(".")) {
                          const url = soc.startsWith("http") ? soc : "https://" + soc;
                          socLink = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" style="color:#ffffff; font-size:14px; text-decoration:none;">${escapeHtml(soc)} <span style="font-size:11px;">↗</span></a>`;
                        } else if (soc) {
                          socLink = `<span style="color:#ffffff; font-size:14px;">${escapeHtml(soc)}</span>`;
                        } else {
                          socLink = `<span style="color:var(--text-muted); font-size:14px;">&mdash;</span>`;
                        }

                        return `
                          <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                            <td style="padding:14px;">
                              <strong style="color:#ffffff; font-size:15px; font-weight:600;">${escapeHtml(s.name)}</strong>
                            </td>
                            <td style="padding:14px;">
                              <div style="display:inline-flex; align-items:center; gap:8px;">
                                <a href="mailto:${escapeHtml(s.email)}?subject=${encodeURIComponent(initialSubject)}" class="cn-sub-mailto" data-email="${escapeHtml(s.email)}" title="Send 1-to-1 email to ${escapeHtml(s.name)}" style="color:#d1b48c; text-decoration:none; font-size:14.5px; font-weight:500;">
                                  ${escapeHtml(s.email)} <span style="font-size:12px;">↗</span>
                                </a>
                                <button type="button" class="cn-copy-email-btn" data-email="${escapeHtml(s.email)}" title="Copy email address" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:13px; padding:2px 4px; opacity:0.85;">📋</button>
                              </div>
                            </td>
                            <td style="padding:14px;">
                              ${socLink}
                            </td>
                            <td style="padding:14px; color:rgba(255,255,255,0.75); font-size:13.5px;">
                              ${escapeHtml(s.bookingAs || s.booking_as || s.role || 'model (direct booking)')}
                            </td>
                            <td style="padding:14px;">
                              <span style="display:inline-block; padding:4px 10px; border-radius:4px; background:rgba(209,180,140,0.12); border:1px solid rgba(209,180,140,0.3); color:#d1b48c; font-size:12px; font-weight:500; text-transform:lowercase;">
                                ${escapeHtml(s.shootType || s.shoot_type || 'portfolio shoot')}
                              </span>
                            </td>
                            <td style="padding:14px;">
                              <span style="color:#ffffff; font-size:13.5px; text-transform:capitalize;">
                                ${escapeHtml(s.timeOfDay || s.time_of_day || s.location || 'any')}
                              </span>
                            </td>
                            <td style="padding:14px; color:var(--text-muted); font-size:13px; white-space:nowrap;">
                              ${s.dateSubscribed ? s.dateSubscribed.slice(0, 10) : 'Recent'}
                            </td>
                            <td style="padding:14px; text-align:right;">
                              <button type="button" class="cn-del-sub-btn" data-id="${s.id}" style="background:none; border:none; color:#ff6b6b; cursor:pointer; font-size:12.5px; padding:4px 8px; border-radius:3px; font-weight:500;">Remove &times;</button>
                            </td>
                          </tr>
                        `;
                      }).join("")}
                    </tbody>
                  </table>
                </div>
              `}
            </div>

            <!-- Add Subscriber Modal Mount -->
            <div id="cn-modal-mount"></div>
          ` : ''}

          ${isClientPortal ? `
            <!-- SECTION 02: CLIENT PORTAL ACCESS & GUIDANCE TEXT -->
            <div class="kh-studio-card" style="padding:24px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px; margin-bottom:28px;">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
                <div>
                  <span class="kh-studio-badge" style="font-size:10px; letter-spacing:0.18em;">02 &middot; PORTAL ACCESS &amp; PROOFING GUIDANCE TEXT</span>
                  <h3 style="font-family:var(--font-caslon); font-size:24px; text-transform:lowercase; margin:6px 0 0 0;">
                    landing page instructions &amp; access card
                  </h3>
                  <p style="font-size:14px; color:var(--text-muted); margin:4px 0 0 0;">Edit the access code form copy and the 3-step proofing guide displayed to clients on the portal landing screen.</p>
                </div>
              </div>

              <!-- Access Code Card Form Details -->
              <div style="background:rgba(255,255,255,0.015); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:18px; margin-bottom:20px;">
                <h4 style="font-family:var(--font-caslon); font-size:18px; margin:0 0 14px 0; color:#fff;">Access Code Card Copy</h4>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
                  <div>
                    <label class="kh-label" style="display:block; margin-bottom:6px; font-size:12px; font-weight:600;">Access Card Input Label</label>
                    <input type="text" id="portal-edit-card-label" class="kh-input" value="${escapeHtml(pageConfig.accessCardLabel || 'Private Shoot Access Code')}" placeholder="Private Shoot Access Code">
                    <span class="kh-hint" style="font-size:11px; color:var(--text-muted); display:block; margin-top:4px;">Headline label above the access code entry field.</span>
                  </div>

                  <div>
                    <label class="kh-label" style="display:block; margin-bottom:6px; font-size:12px; font-weight:600;">Input Placeholder Text</label>
                    <input type="text" id="portal-edit-placeholder" class="kh-input" value="${escapeHtml(pageConfig.accessPlaceholder || 'Enter your shoot access code...')}" placeholder="Enter your shoot access code...">
                    <span class="kh-hint" style="font-size:11px; color:var(--text-muted); display:block; margin-top:4px;">Ghost placeholder text inside the input box.</span>
                  </div>

                  <div>
                    <label class="kh-label" style="display:block; margin-bottom:6px; font-size:12px; font-weight:600;">Submit Button Text</label>
                    <input type="text" id="portal-edit-btn-text" class="kh-input" value="${escapeHtml(pageConfig.accessBtnText || 'Enter Gallery →')}" placeholder="Enter Gallery →">
                    <span class="kh-hint" style="font-size:11px; color:var(--text-muted); display:block; margin-top:4px;">Call-to-action text on the button.</span>
                  </div>

                  <div style="grid-column:1 / -1;">
                    <label class="kh-label" style="display:block; margin-bottom:6px; font-size:12px; font-weight:600;">Access Instructions / Privacy Hint</label>
                    <textarea id="portal-edit-hint" class="kh-textarea" rows="2" style="width:100%; font-size:13.5px;" placeholder="Instructions or privacy notice...">${escapeHtml(pageConfig.accessHint || 'Welcome to your private proofing gallery. Please enter your shoot access code to review, toggle tone variations, add editing notes, and select your favorite versions for final retouching.')}</textarea>
                    <span class="kh-hint" style="font-size:11px; color:var(--text-muted); display:block; margin-top:4px;">Guidance paragraph shown directly below the access code field.</span>
                  </div>
                </div>
              </div>

              <!-- 3-Step Proofing Guidance Cards -->
              <div style="background:rgba(255,255,255,0.015); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:18px;">
                <h4 style="font-family:var(--font-caslon); font-size:18px; margin:0 0 14px 0; color:#fff;">3-Step Client Proofing Guide</h4>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
                  <!-- Step 1 -->
                  <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:14px;">
                    <span class="kh-studio-badge" style="font-size:10px; margin-bottom:8px; display:inline-block;">STEP 01</span>
                    <label class="kh-label" style="display:block; margin-bottom:4px; font-size:11.5px; font-weight:600;">Title</label>
                    <input type="text" id="portal-edit-gtitle1" class="kh-input" style="margin-bottom:10px;" value="${escapeHtml(pageConfig.guideTitle1 || 'Multi-Tone Variations')}" placeholder="Step 1 Title">
                    <label class="kh-label" style="display:block; margin-bottom:4px; font-size:11.5px; font-weight:600;">Description</label>
                    <textarea id="portal-edit-gdesc1" class="kh-textarea" rows="3" style="font-size:13px;" placeholder="Step 1 Description">${escapeHtml(pageConfig.guideDesc1 || 'Every photo is available in Colour, Black & White, and Faded B&W. Switch baseline at the top or toggle below each photo.')}</textarea>
                  </div>

                  <!-- Step 2 -->
                  <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:14px;">
                    <span class="kh-studio-badge" style="font-size:10px; margin-bottom:8px; display:inline-block;">STEP 02</span>
                    <label class="kh-label" style="display:block; margin-bottom:4px; font-size:11.5px; font-weight:600;">Title</label>
                    <input type="text" id="portal-edit-gtitle2" class="kh-input" style="margin-bottom:10px;" value="${escapeHtml(pageConfig.guideTitle2 || 'Pick Multiple Versions')}" placeholder="Step 2 Title">
                    <label class="kh-label" style="display:block; margin-bottom:4px; font-size:11.5px; font-weight:600;">Description</label>
                    <textarea id="portal-edit-gdesc2" class="kh-textarea" rows="3" style="font-size:13px;" placeholder="Step 2 Description">${escapeHtml(pageConfig.guideDesc2 || 'Tap the heart to select. You can choose both Colour and Black & White versions of any photo.')}</textarea>
                  </div>

                  <!-- Step 3 -->
                  <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:14px;">
                    <span class="kh-studio-badge" style="font-size:10px; margin-bottom:8px; display:inline-block;">STEP 03</span>
                    <label class="kh-label" style="display:block; margin-bottom:4px; font-size:11.5px; font-weight:600;">Title</label>
                    <input type="text" id="portal-edit-gtitle3" class="kh-input" style="margin-bottom:10px;" value="${escapeHtml(pageConfig.guideTitle3 || 'Leave Editing Notes')}" placeholder="Step 3 Title">
                    <label class="kh-label" style="display:block; margin-bottom:4px; font-size:11.5px; font-weight:600;">Description</label>
                    <textarea id="portal-edit-gdesc3" class="kh-textarea" rows="3" style="font-size:13px;" placeholder="Step 3 Description">${escapeHtml(pageConfig.guideDesc3 || 'When you like an image, tap the note icon next to the heart to leave specific retouching requests.')}</textarea>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECTION 03: ACTIVE CLIENT SHOOTS -->
            <div class="kh-studio-card" style="padding:24px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px; margin-bottom:28px;">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
                <div>
                  <span class="kh-studio-badge" style="font-size:10px; letter-spacing:0.18em;">03 &middot; CLIENT PROOFING SUITES</span>
                  <h3 style="font-family:var(--font-caslon); font-size:24px; text-transform:lowercase; margin:6px 0 0 0;">
                    client proofing &amp; selection suites
                    <span style="font-family:var(--font-sans); font-size:13.5px; font-weight:600; color:var(--text-muted); text-transform:uppercase;">
                      &middot; ${(clientPortalData.shoots || []).length} Client Shoots
                    </span>
                  </h3>
                  <p style="font-size:14px; color:var(--text-muted); margin:4px 0 0 0;">Create new private proofing galleries, review client selections, and set welcome instructions.</p>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                  <a href="#/client-portal/create" class="kh-btn-primary" style="text-decoration:none;">+ Create New Client Shoot &rarr;</a>
                  <a href="#/client-portal" class="kh-btn-secondary" style="text-decoration:none;" target="_blank">Open Proofing Portal &nearr;</a>
                </div>
              </div>

              <!-- Active Shoots List -->
              <div style="display:flex; flex-direction:column; gap:16px;">
                ${(clientPortalData.shoots || []).map((shoot) => {
                  const proofCount = (shoot.sections || []).reduce((acc, sec) => acc + (sec.images ? sec.images.length : 0), 0);
                  return `
                    <div style="background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:18px; display:grid; grid-template-columns:auto 1fr auto; gap:18px; align-items:center;">
                      <div style="width:75px; height:100px; border-radius:4px; overflow:hidden; border:1px solid var(--border); background:#111;">
                        <img src="${shoot.coverImage || 'photos/contact/2.jpg'}" alt="${escapeHtml(shoot.clientName)}" style="width:100%; height:100%; object-fit:cover;">
                      </div>

                      <div>
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                          <span class="kh-studio-badge" style="font-size:11px; color:#d1b48c; border-color:rgba(209,180,140,0.4);">${escapeHtml(shoot.code)}</span>
                          <span style="font-size:12px; color:var(--text-muted);">&middot; ${escapeHtml(shoot.shootDate || '2026')}</span>
                        </div>
                        <h4 style="font-family:var(--font-caslon); font-size:20px; margin:0 0 4px 0; color:#fff;">${escapeHtml(shoot.clientName)} &middot; ${escapeHtml(shoot.shootTitle)}</h4>
                        <p style="font-size:13.5px; color:var(--text-muted); margin:0;">
                          ${escapeHtml(shoot.location || 'London, England')} &middot; <strong>${shoot.packageQuota || 15}</strong> Selections Quota &middot; <strong>${proofCount}</strong> Proofs Available
                        </p>
                      </div>

                      <div style="display:flex; flex-direction:column; gap:8px;">
                        <a href="#/client-portal/${shoot.id}" class="kh-btn-secondary" style="text-decoration:none; font-size:12px; text-align:center; padding:6px 12px;" target="_blank">Open Proofing Suite &nearr;</a>
                        <a href="#/client-portal/${shoot.id}/review" class="kh-btn-secondary" style="text-decoration:none; font-size:12px; text-align:center; padding:6px 12px;">View Selections &nearr;</a>
                        <a href="#/client-portal/${shoot.id}/edit" class="kh-btn-secondary" style="text-decoration:none; font-size:12px; text-align:center; padding:6px 12px;">Edit Shoot Setup &nearr;</a>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          ` : ''}

          <!-- Bottom Save Actions -->
          <div style="margin-top:20px; display:flex; justify-content:flex-end;">
            <button type="button" class="kh-btn-primary" id="save-infopages-bottom-btn">
              Save ${pageConfig.name} Settings &amp; Sync Cloud &rarr;
            </button>
          </div>
        </div>

        <!-- Universal Picker Modal Mount -->
        <div id="universal-picker-modal-mount"></div>
      `;

      // =========================================================
      // EVENT BINDINGS FOR INFORMATION PAGES
      // =========================================================

      // 1. Page Pill Switcher
      mount.querySelectorAll(".kh-gallery-pill-btn[data-page-slug]").forEach(btn => {
        btn.addEventListener("click", () => {
          window._kh_activeInfoPageSlug = activeInfoPageSlug = btn.dataset.pageSlug;
          renderInfoPagesManager(mount);
        });
      });

      // 2. Real-Time Live Header Previews
      const tagInput = mount.querySelector("#header-tag-input");
      const titleInput = mount.querySelector("#header-title-input");
      const introInput = mount.querySelector("#header-intro-input");
      const tickerInput = mount.querySelector("#header-booking-ticker-input");
      const previewTag = mount.querySelector("#header-preview-tag");
      const previewTitle = mount.querySelector("#header-preview-title");
      const previewLead = mount.querySelector("#header-preview-lead");
      const previewStampText = mount.querySelector("#header-preview-stamp-text");
      const previewImg = mount.querySelector("#header-preview-img");
      const thumbImg = mount.querySelector("#header-thumb-img");

      if (tagInput && previewTag) {
        tagInput.addEventListener("input", () => {
          pageConfig.tag = tagInput.value.trim();
          previewTag.textContent = tagInput.value.trim() || "information";
        });
      }
      if (titleInput && previewTitle) {
        titleInput.addEventListener("input", () => {
          pageConfig.title = titleInput.value;
          previewTitle.textContent = titleInput.value || "header title";
        });
      }
      if (introInput && previewLead) {
        introInput.addEventListener("input", () => {
          pageConfig.intro = introInput.value;
          previewLead.textContent = introInput.value;
        });
      }
      if (tickerInput && previewStampText) {
        tickerInput.addEventListener("input", () => {
          pageConfig.bookingTicker = tickerInput.value;
          previewStampText.textContent = tickerInput.value;
          if (typeof window.updateSplashBookingTicker === "function") {
            window.updateSplashBookingTicker(tickerInput.value);
          }
        });
      }

      // Real-time badge update for Book Me features (The Space / The Approach)
      mount.querySelectorAll(".bm-feature-tag-input").forEach(tagInp => {
        tagInp.addEventListener("input", (e) => {
          const idx = tagInp.dataset.featureIdx;
          const badge = mount.querySelector(`.bm-feat-card-badge[data-feature-idx="${idx}"]`);
          if (badge) {
            badge.textContent = (e.target.value.trim() || 'EDITORIAL FEATURE').toUpperCase();
          }
        });
      });

      // Bind Book Me package showcase image pickers
      mount.querySelectorAll(".bm-pkg-pick-img-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const pkgId = btn.dataset.pkgId;
          const imgIdx = parseInt(btn.dataset.imgIdx, 10);
          const pkg = (bookMeData.packages || []).find(p => p.id === pkgId);
          const pkgTitle = pkg ? pkg.title : pkgId;

          openUniversalImagePicker(mount, {
            title: `Select Example 0${imgIdx + 1} for ${pkgTitle}`,
            subtitle: "Choose any photograph from your studio portfolio, sets, or uploads.",
            onSelect: (chosenSrc) => {
              const preview = mount.querySelector(`.bm-pkg-img-preview[data-pkg-id='${pkgId}'][data-img-idx='${imgIdx}']`);
              const hiddenInp = mount.querySelector(`.bm-pkg-img-src-input[data-pkg-id='${pkgId}'][data-img-idx='${imgIdx}']`);
              const fnLabel = mount.querySelector(`.bm-pkg-img-filename[data-pkg-id='${pkgId}'][data-img-idx='${imgIdx}']`);
              if (preview) preview.src = chosenSrc;
              if (hiddenInp) hiddenInp.value = chosenSrc;
              if (fnLabel) {
                fnLabel.textContent = chosenSrc.split('/').pop() || chosenSrc;
                fnLabel.title = chosenSrc;
              }

              // Update in-memory bookMeData.showcases immediately
              if (!Array.isArray(bookMeData.showcases)) bookMeData.showcases = [];
              let sc = bookMeData.showcases.find(s => s.id === pkgId);
              if (!sc) {
                sc = { id: pkgId, tag: "session showcase", title: pkgTitle, desc: (pkg && pkg.desc) || "", images: [] };
                bookMeData.showcases.push(sc);
              }
              if (!Array.isArray(sc.images)) sc.images = [];
              while (sc.images.length <= imgIdx) {
                sc.images.push({ src: "", alt: `${pkgTitle} example ${sc.images.length + 1}` });
              }
              sc.images[imgIdx] = { src: chosenSrc, alt: `${pkgTitle} example ${imgIdx + 1}` };
              showToast(`Updated Example 0${imgIdx + 1} for ${pkgTitle} ✓`);
            }
          });
        });
      });

      // Quick month presets for Book Me ticker
      mount.querySelectorAll(".header-preset-pill").forEach(pBtn => {
        pBtn.addEventListener("click", () => {
          const val = pBtn.dataset.preset;
          if (tickerInput) tickerInput.value = val;
          pageConfig.bookingTicker = val;
          if (previewStampText) previewStampText.textContent = val;
          if (typeof window.updateSplashBookingTicker === "function") {
            window.updateSplashBookingTicker(val);
          }
          showToast(`Applied: "${val}"`);
        });
      });

      // Travel Dates Ticker Controls
      const travelToggle = mount.querySelector("#travel-ticker-toggle");
      const travelToggleLabel = mount.querySelector("#travel-ticker-toggle-label");
      const travelToggleStatus = mount.querySelector("#travel-ticker-toggle-status");
      const travelFieldsWrap = mount.querySelector("#travel-ticker-fields-wrap");
      const previewTravelStamp = mount.querySelector("#header-preview-travel-stamp");
      const previewTravelText = mount.querySelector("#header-preview-travel-text");

      if (previewTravelText && typeof window.startTickerCarousel === "function") {
        window.startTickerCarousel(previewTravelText, pageConfig.travelDates, "upcoming travel: ");
      }

      const headersTravelStopsMount = mount.querySelector("#headers-travel-stops-mount");
      if (headersTravelStopsMount) {
        renderTravelStopsManager(headersTravelStopsMount, {
          travelDates: pageConfig.travelDates,
          onChange: (newStops) => {
            const valid = newStops.filter(s => s.trim().length > 0);
            pageConfig.travelDates = valid.length ? valid : ["paris · 12–18 may"];
            pageConfig.travelTicker = pageConfig.travelDates.join(" / ");
            if (previewTravelText && typeof window.startTickerCarousel === "function") {
              window.startTickerCarousel(previewTravelText, pageConfig.travelDates, "upcoming travel: ");
            }
            if (typeof window.updateSplashTravelTicker === "function") {
              window.updateSplashTravelTicker(pageConfig.travelEnabled, pageConfig.travelDates);
            }
          }
        });
      }

      if (travelToggle) {
        travelToggle.addEventListener("change", () => {
          const isEnabled = travelToggle.checked;
          pageConfig.travelEnabled = isEnabled;
          if (travelToggleLabel) travelToggleLabel.classList.toggle("is-checked", isEnabled);
          if (travelToggleStatus) travelToggleStatus.textContent = isEnabled ? "ACTIVE · VISIBLE" : "OFF · HIDDEN";
          if (travelFieldsWrap) {
            travelFieldsWrap.style.opacity = isEnabled ? "1" : "0.45";
            travelFieldsWrap.style.pointerEvents = isEnabled ? "auto" : "none";
          }
          if (previewTravelStamp) {
            previewTravelStamp.style.display = isEnabled ? "inline-flex" : "none";
          }
          if (typeof window.updateSplashTravelTicker === "function") {
            window.updateSplashTravelTicker(isEnabled, pageConfig.travelDates || pageConfig.travelTicker);
          }
          showToast(isEnabled ? "Travel dates ticker activated ✓" : "Travel dates ticker turned off (hidden) ✓");
        });
      }

      // Header Photo Upload
      const fileInput = mount.querySelector("#header-file-input");
      const uploadPhotoBtn = mount.querySelector("#header-upload-photo-btn");
      const pickLibraryBtn = mount.querySelector("#header-pick-library-btn");

      if (uploadPhotoBtn && fileInput) {
        uploadPhotoBtn.addEventListener("click", () => {
          fileInput.value = "";
          fileInput.click();
        });

        fileInput.addEventListener("change", async () => {
          if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const localBlobUrl = URL.createObjectURL(file);
            if (previewImg) previewImg.src = localBlobUrl;
            if (thumbImg) thumbImg.src = localBlobUrl;
            showToast("Uploading desktop header in original full quality...");
            try {
              let finalImageUrl = await uploadHeaderFileToR2(file, activeInfoPageSlug, false);
              if (!finalImageUrl) {
                console.warn("R2 direct upload unavailable, falling back to local compression");
                finalImageUrl = await fileToCompressedDataUrl(file, 2500, 0.90, 850000);
              }
              if (finalImageUrl) {
                pageConfig.heroImage = finalImageUrl;
                if (previewImg) previewImg.src = finalImageUrl;
                if (thumbImg) thumbImg.src = finalImageUrl;
                headersConfig[activeInfoPageSlug] = pageConfig;
                saveCustomHeadersConfig(headersConfig, activeInfoPageSlug);
                const leanHeaderForSecondary = { ...pageConfig };
                if (leanHeaderForSecondary.heroImage && leanHeaderForSecondary.heroImage.startsWith("data:") && leanHeaderForSecondary.heroImage.length > 5000) delete leanHeaderForSecondary.heroImage;
                if (leanHeaderForSecondary.heroImageMobile && leanHeaderForSecondary.heroImageMobile.startsWith("data:") && leanHeaderForSecondary.heroImageMobile.length > 5000) delete leanHeaderForSecondary.heroImageMobile;

                if (isAboutMe) {
                  aboutData.header = { ...(aboutData.header || {}), ...leanHeaderForSecondary };
                  if (typeof window.saveAboutMeData === "function") window.saveAboutMeData(aboutData);
                } else if (isBookMe) {
                  bookMeData.header = { ...(bookMeData.header || {}), ...leanHeaderForSecondary };
                  if (typeof window.saveBookMeData === "function") window.saveBookMeData(bookMeData);
                } else if (isFaq) {
                  faqData.header = { ...(faqData.header || {}), ...leanHeaderForSecondary };
                  if (typeof window.saveFaqData === "function") window.saveFaqData(faqData);
                } else if (isPlaylists) {
                  playlistsData.header = { ...(playlistsData.header || {}), ...leanHeaderForSecondary };
                  if (typeof window.savePlaylistsData === "function") window.savePlaylistsData(playlistsData);
                }
                showToast("Desktop header uploaded in full resolution & saved ✓");
              }
            } catch (err) {
              console.error("Desktop header upload failed:", err);
              showToast("Failed to upload desktop header");
            }
          }
        });
      }

      // Header Choose from Library
      if (pickLibraryBtn) {
        pickLibraryBtn.addEventListener("click", () => {
          openUniversalImagePicker(mount, {
            title: `Choose Header Photograph for ${pageConfig.name}`,
            subtitle: "Click any portfolio or exhibition photograph to use it as the hero banner.",
            onSelect: (selectedSrc) => {
              pageConfig.heroImage = selectedSrc;
              if (previewImg) previewImg.src = selectedSrc;
              if (thumbImg) thumbImg.src = selectedSrc;
              headersConfig[activeInfoPageSlug] = pageConfig;
              saveCustomHeadersConfig(headersConfig, activeInfoPageSlug);
              if (isAboutMe) {
                aboutData.header = { ...(aboutData.header || {}), ...pageConfig };
                if (typeof window.saveAboutMeData === "function") window.saveAboutMeData(aboutData);
              } else if (isBookMe) {
                bookMeData.header = { ...(bookMeData.header || {}), ...pageConfig };
                if (typeof window.saveBookMeData === "function") window.saveBookMeData(bookMeData);
              } else if (isFaq) {
                faqData.header = { ...(faqData.header || {}), ...pageConfig };
                if (typeof window.saveFaqData === "function") window.saveFaqData(faqData);
              } else if (isPlaylists) {
                playlistsData.header = { ...(playlistsData.header || {}), ...pageConfig };
                if (typeof window.savePlaylistsData === "function") window.savePlaylistsData(playlistsData);
              }
              showToast("Header image updated from library ✓");
            }
          });
        });
      }

      // Mobile Header Photo Upload
      const mobileFileInput = mount.querySelector("#header-mobile-file-input");
      const uploadMobilePhotoBtn = mount.querySelector("#header-mobile-upload-photo-btn");
      const pickMobileLibraryBtn = mount.querySelector("#header-mobile-pick-library-btn");
      const thumbMobileImg = mount.querySelector("#header-mobile-thumb-img");

      if (uploadMobilePhotoBtn && mobileFileInput) {
        uploadMobilePhotoBtn.addEventListener("click", () => {
          mobileFileInput.value = "";
          mobileFileInput.click();
        });

        mobileFileInput.addEventListener("change", async () => {
          if (mobileFileInput.files && mobileFileInput.files[0]) {
            const file = mobileFileInput.files[0];
            const localBlobUrl = URL.createObjectURL(file);
            if (thumbMobileImg) thumbMobileImg.src = localBlobUrl;
            showToast("Uploading mobile header in original full quality...");
            try {
              let finalImageUrl = await uploadHeaderFileToR2(file, activeInfoPageSlug, true);
              if (!finalImageUrl) {
                console.warn("R2 direct upload unavailable, falling back to local compression");
                finalImageUrl = await fileToCompressedDataUrl(file, 1600, 0.90, 750000);
              }
              if (finalImageUrl) {
                pageConfig.heroImageMobile = finalImageUrl;
                if (thumbMobileImg) thumbMobileImg.src = finalImageUrl;
                headersConfig[activeInfoPageSlug] = pageConfig;
                saveCustomHeadersConfig(headersConfig, activeInfoPageSlug);
                const leanHeaderForSecondary = { ...pageConfig };
                if (leanHeaderForSecondary.heroImage && leanHeaderForSecondary.heroImage.startsWith("data:") && leanHeaderForSecondary.heroImage.length > 5000) delete leanHeaderForSecondary.heroImage;
                if (leanHeaderForSecondary.heroImageMobile && leanHeaderForSecondary.heroImageMobile.startsWith("data:") && leanHeaderForSecondary.heroImageMobile.length > 5000) delete leanHeaderForSecondary.heroImageMobile;

                if (isAboutMe) {
                  aboutData.header = { ...(aboutData.header || {}), ...leanHeaderForSecondary };
                  if (typeof window.saveAboutMeData === "function") window.saveAboutMeData(aboutData);
                } else if (isBookMe) {
                  bookMeData.header = { ...(bookMeData.header || {}), ...leanHeaderForSecondary };
                  if (typeof window.saveBookMeData === "function") window.saveBookMeData(bookMeData);
                } else if (isFaq) {
                  faqData.header = { ...(faqData.header || {}), ...leanHeaderForSecondary };
                  if (typeof window.saveFaqData === "function") window.saveFaqData(faqData);
                } else if (isPlaylists) {
                  playlistsData.header = { ...(playlistsData.header || {}), ...leanHeaderForSecondary };
                  if (typeof window.savePlaylistsData === "function") window.savePlaylistsData(playlistsData);
                }
                showToast("Mobile header uploaded in full resolution & saved ✓");
              }
            } catch (err) {
              console.error("Mobile header upload failed:", err);
              showToast("Failed to upload mobile header");
            }
          }
        });
      }

      // Mobile Header Choose from Library
      if (pickMobileLibraryBtn) {
        pickMobileLibraryBtn.addEventListener("click", () => {
          openUniversalImagePicker(mount, {
            title: `Choose Mobile Header Photograph for ${pageConfig.name}`,
            subtitle: "Select an intimate vertical portrait that displays cleanly on phones.",
            onSelect: (selectedSrc) => {
              pageConfig.heroImageMobile = selectedSrc;
              if (thumbMobileImg) thumbMobileImg.src = selectedSrc;
              headersConfig[activeInfoPageSlug] = pageConfig;
              saveCustomHeadersConfig(headersConfig, activeInfoPageSlug);
              if (isAboutMe) {
                aboutData.header = { ...(aboutData.header || {}), ...pageConfig };
                if (typeof window.saveAboutMeData === "function") window.saveAboutMeData(aboutData);
              } else if (isBookMe) {
                bookMeData.header = { ...(bookMeData.header || {}), ...pageConfig };
                if (typeof window.saveBookMeData === "function") window.saveBookMeData(bookMeData);
              } else if (isFaq) {
                faqData.header = { ...(faqData.header || {}), ...pageConfig };
                if (typeof window.saveFaqData === "function") window.saveFaqData(faqData);
              } else if (isPlaylists) {
                playlistsData.header = { ...(playlistsData.header || {}), ...pageConfig };
                if (typeof window.savePlaylistsData === "function") window.savePlaylistsData(playlistsData);
              }
              showToast("Mobile header image updated from library ✓");
            }
          });
        });
      }

      // Mobile Aspect Ratio Select
      const aspectSelect = mount.querySelector("#header-mobile-aspect-select");
      if (aspectSelect) {
        aspectSelect.addEventListener("change", () => {
          pageConfig.heroMobileAspect = aspectSelect.value;
          headersConfig[activeInfoPageSlug] = pageConfig;
          saveCustomHeadersConfig(headersConfig, activeInfoPageSlug);
          showToast(`Mobile aspect ratio set to ${aspectSelect.options[aspectSelect.selectedIndex].text} ✓`);
        });
      }

      // =========================================================
      // ABOUT ME SPECIFIC HANDLERS
      // =========================================================
      if (isAboutMe) {
        const bioBodyInput = mount.querySelector("#about-bio-body");
        const bioPreview = mount.querySelector("#about-bio-preview");
        if (bioBodyInput && bioPreview) {
          bioBodyInput.addEventListener("input", () => {
            const paras = splitParagraphs(bioBodyInput.value.trim());
            bioPreview.innerHTML = paras.length > 0
              ? paras.map(p => `<p style="margin:0 0 14px 0;">${escapeHtml(p)}</p>`).join("")
              : `<p style="color:var(--text-muted); font-style:italic;">Your biography paragraphs will appear here...</p>`;
          });
        }

        const resetBioBtn = mount.querySelector("#about-reset-bio-btn");
        if (resetBioBtn) {
          resetBioBtn.addEventListener("click", () => {
            const defaultBio = "Challenging the notion that strength and power are masculine traits, my work draws out each whilst still maintaining the true essence of femininity. These are traits that can only be captured when the model is happy, comfortable and relaxed, and I work hard to maintain the best working environment for each and every person I work with. If all three are achieved and everybody is on the same page, then the images will fall into place.\n\nWhen it comes to my travel work, I mainly shoot in a street style so as to properly capture the mood and character of each location. No two places are the same, and I try to reflect that in my work.";
            if (bioBodyInput) bioBodyInput.value = defaultBio;
            if (bioPreview) {
              bioPreview.innerHTML = splitParagraphs(defaultBio).map(p => `<p style="margin:0 0 14px 0;">${escapeHtml(p)}</p>`).join("");
            }
            showToast("Reset biography to default copy");
          });
        }

        // Contact / Portrait Photo Upload & Library Picker
        const pUploadBtn = mount.querySelector("#about-upload-portrait-btn");
        const pFileInput = mount.querySelector("#about-portrait-file-input");
        const pPickBtn = mount.querySelector("#about-pick-portrait-btn");
        const pThumb = mount.querySelector("#about-portrait-thumb");
        const pVal = mount.querySelector("#about-contact-photo-val");

        if (pUploadBtn && pFileInput) {
          pUploadBtn.addEventListener("click", () => {
            pFileInput.value = "";
            pFileInput.click();
          });
          pFileInput.addEventListener("change", async () => {
            if (pFileInput.files && pFileInput.files[0]) {
              const file = pFileInput.files[0];
              const localBlob = URL.createObjectURL(file);
              if (pThumb) pThumb.src = localBlob;
              showToast("Uploading contact portrait photo in full quality...");
              try {
                let finalUrl = await uploadSingleFileToR2(file, "about", "contact_portrait");
                if (!finalUrl) {
                  finalUrl = await fileToCompressedDataUrl(file, 1600, 0.90, 750000);
                }
                if (finalUrl) {
                  if (pThumb) pThumb.src = finalUrl;
                  if (pVal) pVal.value = finalUrl;
                  aboutData.contactPhoto = finalUrl;
                  if (typeof window.saveAboutMeData === "function") window.saveAboutMeData(aboutData);
                  showToast("Contact portrait photo uploaded & saved ✓");
                }
              } catch (e) {
                console.error("Portrait upload error:", e);
                showToast("Failed to upload portrait image");
              }
            }
          });
        }

        if (pPickBtn) {
          pPickBtn.addEventListener("click", () => {
            openUniversalImagePicker(mount, {
              title: "Choose Portrait Photograph for Contact Form",
              subtitle: "Select a photo to display alongside your 'Say Hello' contact form.",
              onSelect: (selectedSrc) => {
                if (pThumb) pThumb.src = selectedSrc;
                if (pVal) pVal.value = selectedSrc;
                aboutData.contactPhoto = selectedSrc;
                if (typeof window.saveAboutMeData === "function") window.saveAboutMeData(aboutData);
                showToast("Contact portrait updated from library ✓");
              }
            });
          });
        }
      }

      // =========================================================
      // FAQ SPECIFIC HANDLERS (DRAG & DROP, CATEGORY TAGS, CONTACT BOX)
      // =========================================================
      if (isFaq) {
        // FAQ category filter pills
        mount.querySelectorAll(".faq-filter-pill").forEach(pBtn => {
          pBtn.addEventListener("click", () => {
            activeFaqCategoryFilter = pBtn.dataset.catFilter;
            renderInfoPagesManager(mount);
          });
        });

        // FAQ Category Tag Selectors (Changes which section question belongs to)
        mount.querySelectorAll(".faq-q-cat-select").forEach(sel => {
          sel.addEventListener("change", () => {
            const oldCatId = sel.dataset.catId;
            const targetCatId = sel.value;
            const qIdx = parseInt(sel.dataset.qIdx, 10);
            if (oldCatId === targetCatId) return;

            const oldCat = (faqData.categories || []).find(c => c.id === oldCatId);
            const targetCat = (faqData.categories || []).find(c => c.id === targetCatId);
            if (oldCat && oldCat.questions && targetCat) {
              const [movedQ] = oldCat.questions.splice(qIdx, 1);
              if (movedQ) {
                if (!Array.isArray(targetCat.questions)) targetCat.questions = [];
                targetCat.questions.push(movedQ);
                if (typeof window.saveFaqData === "function") window.saveFaqData(faqData);
                showToast(`Moved to "${targetCat.title}" ✓`);
                renderInfoPagesManager(mount);
              }
            }
          });
        });

        // FAQ Move Up
        mount.querySelectorAll(".faq-move-up-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const catId = btn.dataset.catId;
            const qIdx = parseInt(btn.dataset.qIdx, 10);
            const cat = (faqData.categories || []).find(c => c.id === catId);
            if (cat && cat.questions && qIdx > 0) {
              const temp = cat.questions[qIdx];
              cat.questions[qIdx] = cat.questions[qIdx - 1];
              cat.questions[qIdx - 1] = temp;
              if (typeof window.saveFaqData === "function") window.saveFaqData(faqData);
              showToast("FAQ question moved up ✓");
              renderInfoPagesManager(mount);
            }
          });
        });

        // FAQ Move Down
        mount.querySelectorAll(".faq-move-down-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const catId = btn.dataset.catId;
            const qIdx = parseInt(btn.dataset.qIdx, 10);
            const cat = (faqData.categories || []).find(c => c.id === catId);
            if (cat && cat.questions && qIdx < cat.questions.length - 1) {
              const temp = cat.questions[qIdx];
              cat.questions[qIdx] = cat.questions[qIdx + 1];
              cat.questions[qIdx + 1] = temp;
              if (typeof window.saveFaqData === "function") window.saveFaqData(faqData);
              showToast("FAQ question moved down ✓");
              renderInfoPagesManager(mount);
            }
          });
        });

        // FAQ Delete Question
        mount.querySelectorAll(".faq-del-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const catId = btn.dataset.catId;
            const qIdx = parseInt(btn.dataset.qIdx, 10);
            if (confirm("Remove this FAQ question?")) {
              const cat = (faqData.categories || []).find(c => c.id === catId);
              if (cat && cat.questions) {
                cat.questions.splice(qIdx, 1);
                if (typeof window.saveFaqData === "function") window.saveFaqData(faqData);
                showToast("FAQ question removed ✓");
                renderInfoPagesManager(mount);
              }
            }
          });
        });

        // HTML5 Drag and Drop Engine for FAQ questions
        let draggedFaq = null;
        mount.querySelectorAll(".faq-item-card").forEach(card => {
          card.addEventListener("dragstart", (e) => {
            if (e.target.closest("input, textarea, select, button")) {
              e.preventDefault();
              return;
            }
            draggedFaq = {
              catId: card.dataset.catId,
              qIdx: parseInt(card.dataset.qIdx, 10)
            };
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", `${draggedFaq.catId}:${draggedFaq.qIdx}`);
            card.style.opacity = "0.45";
          });

          card.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            card.style.borderColor = "#d1b48c";
          });

          card.addEventListener("dragleave", () => {
            card.style.borderColor = "rgba(255,255,255,0.08)";
          });

          card.addEventListener("drop", (e) => {
            e.preventDefault();
            card.style.borderColor = "rgba(255,255,255,0.08)";
            if (!draggedFaq) return;

            const targetCatId = card.dataset.catId;
            const targetQIdx = parseInt(card.dataset.qIdx, 10);

            const sourceCat = (faqData.categories || []).find(c => c.id === draggedFaq.catId);
            const targetCat = (faqData.categories || []).find(c => c.id === targetCatId);

            if (sourceCat && targetCat && sourceCat.questions) {
              const [item] = sourceCat.questions.splice(draggedFaq.qIdx, 1);
              if (item) {
                if (!Array.isArray(targetCat.questions)) targetCat.questions = [];
                targetCat.questions.splice(targetQIdx, 0, item);
                if (typeof window.saveFaqData === "function") window.saveFaqData(faqData);
                showToast("Question reordered ✓");
                renderInfoPagesManager(mount);
              }
            }
          });

          card.addEventListener("dragend", () => {
            card.style.opacity = "1";
            draggedFaq = null;
          });
        });

        // FAQ Add New Question Modal
        const addFaqBtn = mount.querySelector("#faq-open-add-modal-btn");
        const faqModalMount = mount.querySelector("#faq-modal-mount");
        if (addFaqBtn && faqModalMount) {
          addFaqBtn.addEventListener("click", () => {
            faqModalMount.innerHTML = `
              <div class="kh-modal-backdrop">
                <div class="kh-modal-window kh-modal-window--narrow">
                  <div class="kh-modal-head">
                    <div>
                      <span class="kh-studio-badge">&#9679; FAQ Manager</span>
                      <h3 style="margin-top:6px; font-family:var(--font-caslon); font-size:24px; text-transform:lowercase;">add new question</h3>
                    </div>
                    <button type="button" class="kh-modal-close" id="faq-modal-close-btn">&times;</button>
                  </div>
                  <div class="kh-modal-body" style="padding:24px;">
                    <form id="faq-new-q-form" style="display:flex; flex-direction:column; gap:16px;">
                      <div>
                        <label class="kh-label">Category / Section *</label>
                        <select id="new-q-cat" class="kh-select">
                          <option value="clients" ${activeFaqCategoryFilter === 'clients' ? 'selected' : ''}>for clients</option>
                          <option value="photographers" ${activeFaqCategoryFilter === 'photographers' ? 'selected' : ''}>for aspiring photographers</option>
                          <option value="general" ${activeFaqCategoryFilter === 'general' ? 'selected' : ''}>general/misc</option>
                        </select>
                      </div>
                      <div>
                        <label class="kh-label">Question Title *</label>
                        <input type="text" id="new-q-title" class="kh-input" required placeholder="e.g. What camera equipment do you shoot on?">
                      </div>
                      <div>
                        <label class="kh-label">Answer (Separate paragraphs with blank lines) *</label>
                        <textarea id="new-q-ans" class="kh-textarea" rows="5" required placeholder="Full answer text..."></textarea>
                      </div>
                      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
                        <button type="button" class="kh-btn-secondary" id="faq-modal-cancel-btn">Cancel</button>
                        <button type="submit" class="kh-btn-primary">Add Question &check;</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            `;
            const closeModal = () => { faqModalMount.innerHTML = ""; };
            faqModalMount.querySelector("#faq-modal-close-btn").addEventListener("click", closeModal);
            faqModalMount.querySelector("#faq-modal-cancel-btn").addEventListener("click", closeModal);
            faqModalMount.querySelector("#faq-new-q-form").addEventListener("submit", (e) => {
              e.preventDefault();
              const catId = faqModalMount.querySelector("#new-q-cat").value;
              const title = faqModalMount.querySelector("#new-q-title").value.trim();
              const ansRaw = faqModalMount.querySelector("#new-q-ans").value.trim();
              if (!title || !ansRaw) return;
              const cat = (faqData.categories || []).find(c => c.id === catId);
              if (cat) {
                if (!Array.isArray(cat.questions)) cat.questions = [];
                cat.questions.unshift({
                  q: title,
                  a: splitParagraphs(ansRaw)
                });
                if (typeof window.saveFaqData === "function") window.saveFaqData(faqData);
                showToast("New FAQ question added ✓");
                closeModal();
                renderInfoPagesManager(mount);
              }
            });
          });
        }
      }

      // =========================================================
      // PLAYLISTS SPECIFIC HANDLERS
      // =========================================================
      if (isPlaylists) {
        // Filter pills
        mount.querySelectorAll(".pl-filter-pill").forEach(pBtn => {
          pBtn.addEventListener("click", () => {
            activePlaylistsSectionFilter = pBtn.dataset.secFilter;
            renderInfoPagesManager(mount);
          });
        });

        // Move Up
        mount.querySelectorAll(".pl-move-up-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const secId = btn.dataset.secId;
            const plIdx = parseInt(btn.dataset.plIdx, 10);
            const sec = (playlistsData.sections || []).find(s => s.id === secId);
            if (sec && sec.playlists && plIdx > 0) {
              const temp = sec.playlists[plIdx];
              sec.playlists[plIdx] = sec.playlists[plIdx - 1];
              sec.playlists[plIdx - 1] = temp;
              sec.playlists.forEach((p, i) => { p.num = String(i + 1).padStart(2, "0"); });
              if (typeof window.savePlaylistsData === "function") window.savePlaylistsData(playlistsData);
              showToast("Playlist moved up ✓");
              renderInfoPagesManager(mount);
            }
          });
        });

        // Move Down
        mount.querySelectorAll(".pl-move-down-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const secId = btn.dataset.secId;
            const plIdx = parseInt(btn.dataset.plIdx, 10);
            const sec = (playlistsData.sections || []).find(s => s.id === secId);
            if (sec && sec.playlists && plIdx < sec.playlists.length - 1) {
              const temp = sec.playlists[plIdx];
              sec.playlists[plIdx] = sec.playlists[plIdx + 1];
              sec.playlists[plIdx + 1] = temp;
              sec.playlists.forEach((p, i) => { p.num = String(i + 1).padStart(2, "0"); });
              if (typeof window.savePlaylistsData === "function") window.savePlaylistsData(playlistsData);
              showToast("Playlist moved down ✓");
              renderInfoPagesManager(mount);
            }
          });
        });

        // Delete Playlist
        mount.querySelectorAll(".pl-del-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const secId = btn.dataset.secId;
            const plIdx = parseInt(btn.dataset.plIdx, 10);
            if (confirm("Remove this playlist?")) {
              const sec = (playlistsData.sections || []).find(s => s.id === secId);
              if (sec && sec.playlists) {
                sec.playlists.splice(plIdx, 1);
                sec.playlists.forEach((p, i) => { p.num = String(i + 1).padStart(2, "0"); });
                if (typeof window.savePlaylistsData === "function") window.savePlaylistsData(playlistsData);
                showToast("Playlist removed ✓");
                renderInfoPagesManager(mount);
              }
            }
          });
        });

        // Change Artwork
        mount.querySelectorAll(".pl-change-art-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const secId = btn.dataset.secId;
            const plIdx = parseInt(btn.dataset.plIdx, 10);
            const sec = (playlistsData.sections || []).find(s => s.id === secId);
            if (!sec || !sec.playlists || !sec.playlists[plIdx]) return;
            const pl = sec.playlists[plIdx];

            openUniversalImagePicker(mount, {
              title: `Change Cover Art: ${pl.title}`,
              subtitle: "Click any photograph from your library to set as playlist cover art.",
              onSelect: (selectedSrc) => {
                pl.image = selectedSrc;
                if (typeof window.savePlaylistsData === "function") window.savePlaylistsData(playlistsData);
                showToast("Cover art updated ✓");
                renderInfoPagesManager(mount);
              }
            });
          });
        });

        // Add Playlist Modal
        const addPlBtn = mount.querySelector("#pl-open-add-modal-btn");
        const plModalMount = mount.querySelector("#pl-modal-mount");
        if (addPlBtn && plModalMount) {
          addPlBtn.addEventListener("click", () => {
            plModalMount.innerHTML = `
              <div class="kh-modal-backdrop">
                <div class="kh-modal-window kh-modal-window--narrow">
                  <div class="kh-modal-head">
                    <div>
                      <span class="kh-studio-badge">&#9679; Playlists Manager</span>
                      <h3 style="margin-top:6px; font-family:var(--font-caslon); font-size:24px; text-transform:lowercase;">add new playlist</h3>
                    </div>
                    <button type="button" class="kh-modal-close" id="pl-modal-close-btn">&times;</button>
                  </div>
                  <div class="kh-modal-body" style="padding:24px;">
                    <form id="pl-new-item-form" style="display:flex; flex-direction:column; gap:16px;">
                      <div>
                        <label class="kh-label">Section *</label>
                        <select id="new-pl-sec" class="kh-select">
                          <option value="studio">01 · Studio Playlists</option>
                          <option value="editing">02 · Editing Playlists</option>
                        </select>
                      </div>
                      <div>
                        <label class="kh-label">Playlist Title *</label>
                        <input type="text" id="new-pl-title" class="kh-input" required placeholder="e.g. studio four or late hours">
                      </div>
                      <div>
                        <label class="kh-label">Spotify Link / Embed URL *</label>
                        <input type="url" id="new-pl-url" class="kh-input" required placeholder="https://open.spotify.com/playlist/...">
                      </div>
                      <div>
                        <label class="kh-label">Mood / Atmosphere Tag</label>
                        <input type="text" id="new-pl-mood" class="kh-input" placeholder="e.g. Warm acoustic &amp; relaxed tempo">
                      </div>
                      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
                        <button type="button" class="kh-btn-secondary" id="pl-modal-cancel-btn">Cancel</button>
                        <button type="submit" class="kh-btn-primary">Add Playlist &check;</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            `;
            const closeModal = () => { plModalMount.innerHTML = ""; };
            plModalMount.querySelector("#pl-modal-close-btn").addEventListener("click", closeModal);
            plModalMount.querySelector("#pl-modal-cancel-btn").addEventListener("click", closeModal);
            plModalMount.querySelector("#pl-new-item-form").addEventListener("submit", (e) => {
              e.preventDefault();
              const secId = plModalMount.querySelector("#new-pl-sec").value;
              const title = plModalMount.querySelector("#new-pl-title").value.trim();
              const url = plModalMount.querySelector("#new-pl-url").value.trim();
              const mood = plModalMount.querySelector("#new-pl-mood").value.trim();
              if (!title || !url) return;

              const sec = (playlistsData.sections || []).find(s => s.id === secId);
              if (sec) {
                if (!Array.isArray(sec.playlists)) sec.playlists = [];
                const m = url.match(/playlist\/([a-zA-Z0-9]+)/);
                const embedId = m ? m[1] : "";
                sec.playlists.push({
                  id: "pl-" + Date.now(),
                  title,
                  num: String(sec.playlists.length + 1).padStart(2, "0"),
                  image: "photos/playlists/header.jpg",
                  url,
                  embedId,
                  mood
                });
                if (typeof window.savePlaylistsData === "function") window.savePlaylistsData(playlistsData);
                showToast("New playlist added ✓");
                closeModal();
                renderInfoPagesManager(mount);
              }
            });
          });
        }
      }

      // =========================================================
      // TESTIMONIALS SPECIFIC HANDLERS
      // =========================================================
      if (isTestimonials) {
        // Move Up
        mount.querySelectorAll(".tm-move-up-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.idx, 10);
            if (idx > 0) {
              const temp = testimonials[idx];
              testimonials[idx] = testimonials[idx - 1];
              testimonials[idx - 1] = temp;
              saveTestimonialsList(testimonials);
              showToast("Testimonial moved up ✓");
              renderInfoPagesManager(mount);
            }
          });
        });

        // Move Down
        mount.querySelectorAll(".tm-move-down-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.idx, 10);
            if (idx < testimonials.length - 1) {
              const temp = testimonials[idx];
              testimonials[idx] = testimonials[idx + 1];
              testimonials[idx + 1] = temp;
              saveTestimonialsList(testimonials);
              showToast("Testimonial moved down ✓");
              renderInfoPagesManager(mount);
            }
          });
        });

        // Delete Testimonial
        mount.querySelectorAll(".tm-del-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.idx, 10);
            const target = testimonials[idx];
            if (!target) return;
            if (confirm(`Remove testimonial from "${target.name || 'Client'}"?`)) {
              testimonials.splice(idx, 1);
              saveTestimonialsList(testimonials);
              showToast("Testimonial removed ✓");
              renderInfoPagesManager(mount);
            }
          });
        });

        // Change Portrait Photo
        mount.querySelectorAll(".tm-change-art-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.idx, 10);
            const target = testimonials[idx];
            if (!target) return;

            openUniversalImagePicker(mount, {
              title: `Change Portrait for ${target.name || 'Testimonial'}`,
              subtitle: "Select a 2:3 vertical portrait photograph from your library.",
              onSelect: (selectedSrc) => {
                target.image = selectedSrc;
                saveTestimonialsList(testimonials);
                showToast("Portrait photo updated ✓");
                renderInfoPagesManager(mount);
              }
            });
          });
        });

        // Add Testimonial Modal
        const addTmBtn = mount.querySelector("#tm-open-add-modal-btn");
        const tmModalMount = mount.querySelector("#tm-modal-mount");
        if (addTmBtn && tmModalMount) {
          addTmBtn.addEventListener("click", () => {
            tmModalMount.innerHTML = `
              <div class="kh-modal-backdrop">
                <div class="kh-modal-window kh-modal-window--narrow">
                  <div class="kh-modal-head">
                    <div>
                      <span class="kh-studio-badge">&#9679; Testimonials</span>
                      <h3 style="margin-top:6px; font-family:var(--font-caslon); font-size:24px; text-transform:lowercase;">add new testimonial</h3>
                    </div>
                    <button type="button" class="kh-modal-close" id="tm-modal-close-btn">&times;</button>
                  </div>
                  <div class="kh-modal-body" style="padding:24px;">
                    <form id="tm-new-item-form" style="display:flex; flex-direction:column; gap:16px;">
                      <div>
                        <label class="kh-label">Client Name *</label>
                        <input type="text" id="new-tm-name" class="kh-input" required placeholder="e.g. Maya Lin">
                      </div>
                      <div>
                        <label class="kh-label">Handle / Role</label>
                        <input type="text" id="new-tm-handle" class="kh-input" placeholder="e.g. @mayalin · Direct Booking">
                      </div>
                      <div>
                        <label class="kh-label">Review / Quote *</label>
                        <textarea id="new-tm-quote" class="kh-textarea" rows="4" required placeholder="Write the client's kind words here..."></textarea>
                      </div>
                      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
                        <button type="button" class="kh-btn-secondary" id="tm-modal-cancel-btn">Cancel</button>
                        <button type="submit" class="kh-btn-primary">Add Testimonial &check;</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            `;
            const closeModal = () => { tmModalMount.innerHTML = ""; };
            tmModalMount.querySelector("#tm-modal-close-btn").addEventListener("click", closeModal);
            tmModalMount.querySelector("#tm-modal-cancel-btn").addEventListener("click", closeModal);
            tmModalMount.querySelector("#tm-new-item-form").addEventListener("submit", (e) => {
              e.preventDefault();
              const name = tmModalMount.querySelector("#new-tm-name").value.trim();
              const handle = tmModalMount.querySelector("#new-tm-handle").value.trim();
              const quote = tmModalMount.querySelector("#new-tm-quote").value.trim();
              if (!name || !quote) return;

              testimonials.unshift({
                id: "tm-" + Date.now(),
                name,
                handle,
                quote,
                image: "photos/testimonials/header.jpg",
                date: new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" })
              });
              saveTestimonialsList(testimonials);
              showToast("Testimonial added ✓");
              closeModal();
              renderInfoPagesManager(mount);
            });
          });
        }
      }

      // =========================================================
      // CANCELLATIONS & ALERTS SPECIFIC HANDLERS
      // =========================================================
      if (isCancellations) {
        const cnTagInput = mount.querySelector("#cn-intro-tag");
        const cnHdnInput = mount.querySelector("#cn-intro-heading");
        const cnBodyInput = mount.querySelector("#cn-intro-body");
        const cnPrevTag = mount.querySelector("#cn-preview-tag");
        const cnPrevHdn = mount.querySelector("#cn-preview-heading");
        const cnPrevBody = mount.querySelector("#cn-preview-body");

        if (cnTagInput && cnPrevTag) {
          cnTagInput.addEventListener("input", () => {
            cnPrevTag.textContent = cnTagInput.value.trim() || "priority notification list";
          });
        }
        if (cnHdnInput && cnPrevHdn) {
          cnHdnInput.addEventListener("input", () => {
            cnPrevHdn.textContent = cnHdnInput.value.trim() || "direct notifications for short-notice studio dates";
          });
        }
        if (cnBodyInput && cnPrevBody) {
          cnBodyInput.addEventListener("input", () => {
            const paras = splitParagraphs(cnBodyInput.value.trim());
            cnPrevBody.innerHTML = paras.length > 0
              ? paras.map(p => `<p style="margin:0 0 14px 0;">${escapeHtml(p)}</p>`).join("")
              : `<p style="margin:0; color:var(--text-muted); font-style:italic;">Your paragraphs will appear here...</p>`;
          });
        }

        const cnResetIntroBtn = mount.querySelector("#cn-reset-intro-btn");
        if (cnResetIntroBtn) {
          cnResetIntroBtn.addEventListener("click", () => {
            const defCard = (cancellationsStore.DEFAULT_DATA ? cancellationsStore.DEFAULT_DATA.introCard : null) || {};
            const defBody = "When a scheduled commercial shoot, agency test, or portfolio booking moves dates at short notice, an unexpected studio or location session opens up.\n\nOnce you enter your information below, you will be added directly to my private cancellation list. Whenever a suitable last-minute slot opens up that matches what you are looking for, I will email you personally so you can take the slot before it is shared publicly.";
            if (cnTagInput) cnTagInput.value = defCard.tag || "priority notification list";
            if (cnHdnInput) cnHdnInput.value = defCard.heading || "direct notifications for short-notice studio dates";
            if (cnBodyInput) cnBodyInput.value = defBody;
            if (cnPrevTag) cnPrevTag.textContent = defCard.tag || "priority notification list";
            if (cnPrevHdn) cnPrevHdn.textContent = defCard.heading || "direct notifications for short-notice studio dates";
            if (cnPrevBody) {
              cnPrevBody.innerHTML = splitParagraphs(defBody).map(p => `<p style="margin:0 0 14px 0;">${escapeHtml(p)}</p>`).join("");
            }
            showToast("Reset card copy to default");
          });
        }

        const cnSaveIntroBtn = mount.querySelector("#cn-save-intro-btn");
        if (cnSaveIntroBtn) {
          cnSaveIntroBtn.addEventListener("click", () => {
            const bodyVal = cnBodyInput ? cnBodyInput.value.trim() : "";
            const paras = splitParagraphs(bodyVal);
            const updated = {
              tag: cnTagInput ? cnTagInput.value.trim() : "priority notification list",
              heading: cnHdnInput ? cnHdnInput.value.trim() : "direct notifications for short-notice studio dates",
              body: bodyVal,
              paragraph1: paras[0] || "",
              paragraph2: paras[1] || ""
            };
            if (cancellationsStore.updateIntroCard) cancellationsStore.updateIntroCard(updated);
            if (cancellationsStore.updateOpening) cancellationsStore.updateOpening({ isActive: false });
            showToast("Priority notification card saved ✓");
            renderInfoPagesManager(mount);
          });
        }

        const cnResetFormBtn = mount.querySelector("#cn-reset-form-btn");
        if (cnResetFormBtn) {
          cnResetFormBtn.addEventListener("click", () => {
            const defForm = (cancellationsStore.DEFAULT_DATA ? cancellationsStore.DEFAULT_DATA.formConfig : null) || {};
            const setVal = (id, val) => { const el = mount.querySelector(id); if (el) el.value = val; };
            setVal("#cn-form-tag", defForm.tag || "join the list");
            setVal("#cn-form-title", defForm.title || "enter your details");
            setVal("#cn-form-subtitle", defForm.subtitle || "");
            setVal("#cn-form-opt-booking", (defForm.bookingAsOptions || []).join("\n"));
            setVal("#cn-form-opt-shoot", (defForm.shootTypeOptions || []).join("\n"));
            setVal("#cn-form-opt-time", (defForm.timeOfDayOptions || []).join("\n"));
            setVal("#cn-form-btn-text", defForm.submitButtonText || "Join Cancellation Priority List &rarr;");
            setVal("#cn-form-privacy", defForm.privacyNote || "");
            setVal("#cn-form-success-title", defForm.successTitle || "you're on the priority notification list");
            setVal("#cn-form-success-desc", defForm.successDesc || "");
            showToast("Reset form settings to defaults");
          });
        }

        const cnSaveFormBtn = mount.querySelector("#cn-save-form-btn");
        if (cnSaveFormBtn) {
          cnSaveFormBtn.addEventListener("click", () => {
            const parseLines = (val) => (val || "").split("\n").map(l => l.trim()).filter(Boolean);
            const updatedForm = {
              tag: mount.querySelector("#cn-form-tag")?.value.trim() || "join the list",
              title: mount.querySelector("#cn-form-title")?.value.trim() || "enter your details",
              subtitle: mount.querySelector("#cn-form-subtitle")?.value.trim() || "",
              bookingAsOptions: parseLines(mount.querySelector("#cn-form-opt-booking")?.value),
              shootTypeOptions: parseLines(mount.querySelector("#cn-form-opt-shoot")?.value),
              timeOfDayOptions: parseLines(mount.querySelector("#cn-form-opt-time")?.value),
              submitButtonText: mount.querySelector("#cn-form-btn-text")?.value.trim() || "Join Cancellation Priority List &rarr;",
              privacyNote: mount.querySelector("#cn-form-privacy")?.value.trim() || "",
              successTitle: mount.querySelector("#cn-form-success-title")?.value.trim() || "you're on the priority notification list",
              successDesc: mount.querySelector("#cn-form-success-desc")?.value.trim() || ""
            };
            if (cancellationsStore.updateFormConfig) cancellationsStore.updateFormConfig(updatedForm);
            showToast("Sign-up form settings saved ✓");
            renderInfoPagesManager(mount);
          });
        }

        // Email subject date updater for mailto links
        const subjectDateInput = mount.querySelector("#cn-subject-date-input");
        if (subjectDateInput) {
          subjectDateInput.addEventListener("input", () => {
            const subject = "Last Minute Cancellation on " + (subjectDateInput.value.trim() || "upcoming opening");
            mount.querySelectorAll(".cn-sub-mailto").forEach(link => {
              const email = link.dataset.email;
              link.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}`;
            });
          });
        }

        // Copy email buttons
        mount.querySelectorAll(".cn-copy-email-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const email = btn.dataset.email;
            navigator.clipboard.writeText(email).then(() => {
              showToast(`Copied ${email} ✓`);
            }).catch(() => {
              prompt("Copy email address:", email);
            });
          });
        });

        // Delete subscriber
        mount.querySelectorAll(".cn-del-sub-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            if (confirm("Remove this subscriber from the priority waitlist?")) {
              if (cancellationsStore.deleteSubscriber) cancellationsStore.deleteSubscriber(id);
              showToast("Subscriber removed.");
              renderInfoPagesManager(mount);
            }
          });
        });

        // Add subscriber modal
        const addSubBtn = mount.querySelector("#cn-add-sub-modal-btn");
        const cnModalMount = mount.querySelector("#cn-modal-mount");
        if (addSubBtn && cnModalMount) {
          addSubBtn.addEventListener("click", () => {
            cnModalMount.innerHTML = `
              <div class="kh-modal-backdrop">
                <div class="kh-modal-window kh-modal-window--narrow">
                  <div class="kh-modal-head">
                    <div>
                      <span class="kh-studio-badge">&#9679; Priority Waitlist</span>
                      <h3 style="margin-top:6px; font-family:var(--font-caslon); font-size:24px; text-transform:lowercase;">add subscriber manually</h3>
                    </div>
                    <button type="button" class="kh-modal-close" id="cn-modal-close-btn">&times;</button>
                  </div>
                  <div class="kh-modal-body" style="padding:24px;">
                    <form id="cn-manual-sub-form" style="display:flex; flex-direction:column; gap:14px;">
                      <div>
                        <label class="kh-label">Name *</label>
                        <input type="text" id="manual-name" class="kh-input" required placeholder="e.g. Maya Lin">
                      </div>
                      <div>
                        <label class="kh-label">Email Address *</label>
                        <input type="email" id="manual-email" class="kh-input" required placeholder="e.g. maya@agency.com">
                      </div>
                      <div>
                        <label class="kh-label">Instagram / Website</label>
                        <input type="text" id="manual-social" class="kh-input" placeholder="@handle or website link">
                      </div>
                      <div>
                        <label class="kh-label">Booking As</label>
                        <select id="manual-booking-as" class="kh-select">
                          ${(formConfig.bookingAsOptions || [
                            "model (direct booking)",
                            "agency (for represented model)",
                            "actor / creative headshots",
                            "other creative"
                          ]).map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join("")}
                        </select>
                      </div>
                      <div>
                        <label class="kh-label">Shoot Focus</label>
                        <select id="manual-shoot-type" class="kh-select">
                          ${(formConfig.shootTypeOptions || [
                            "portfolio shoot",
                            "beauty shoot",
                            "polaroids"
                          ]).map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join("")}
                        </select>
                      </div>
                      <div>
                        <label class="kh-label">Rough Time Available</label>
                        <select id="manual-time-of-day" class="kh-select">
                          ${(formConfig.timeOfDayOptions || [
                            "any (most flexible)",
                            "morning",
                            "daytime",
                            "evening"
                          ]).map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join("")}
                        </select>
                      </div>
                      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
                        <button type="button" class="kh-btn-secondary" id="cn-modal-cancel-btn">Cancel</button>
                        <button type="submit" class="kh-btn-primary">Add Subscriber &check;</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            `;
            const closeModal = () => { cnModalMount.innerHTML = ""; };
            cnModalMount.querySelector("#cn-modal-close-btn").addEventListener("click", closeModal);
            cnModalMount.querySelector("#cn-modal-cancel-btn").addEventListener("click", closeModal);
            cnModalMount.querySelector("#cn-manual-sub-form").addEventListener("submit", (e) => {
              e.preventDefault();
              const name = cnModalMount.querySelector("#manual-name").value.trim();
              const email = cnModalMount.querySelector("#manual-email").value.trim();
              if (!name || !email) return;

              if (cancellationsStore.addSubscriber) {
                cancellationsStore.addSubscriber({
                  name,
                  email,
                  socialOrWebsite: cnModalMount.querySelector("#manual-social").value.trim(),
                  bookingAs: cnModalMount.querySelector("#manual-booking-as").value,
                  shootType: cnModalMount.querySelector("#manual-shoot-type").value,
                  timeOfDay: cnModalMount.querySelector("#manual-time-of-day").value
                });
              }
              showToast(`Added ${name} to priority waitlist ✓`);
              closeModal();
              renderInfoPagesManager(mount);
            });
          });
        }
      }

      // =========================================================
      // MASTER SAVE HANDLER (FOR TOP & BOTTOM BUTTONS)
      // =========================================================
      const handleMasterSave = () => {
        // 1. Update header config
        if (titleInput) pageConfig.title = titleInput.value.trim();
        if (introInput) pageConfig.intro = introInput.value.trim();
        if (tagInput) pageConfig.tag = tagInput.value.trim();

        if (isBookMe) {
          if (tickerInput) pageConfig.bookingTicker = tickerInput.value.trim();
          if (travelToggle) pageConfig.travelEnabled = travelToggle.checked;

          if (!Array.isArray(pageConfig.travelDates) || !pageConfig.travelDates.length) {
            pageConfig.travelDates = ["paris · 12–18 may", "new york · 2–9 june", "milan · 16–22 june"];
          }
          pageConfig.travelTicker = pageConfig.travelDates.join(" / ");
          const splash = loadSplashSettings();
          splash.travelEnabled = pageConfig.travelEnabled;
          splash.travelDates = pageConfig.travelDates;
          splash.travelTicker = pageConfig.travelTicker;
          if (pageConfig.bookingTicker) splash.bookingTicker = pageConfig.bookingTicker;
          saveSplashSettings(splash);

          // Update Direct Booking Email
          const directEmailInp = mount.querySelector("#book-me-direct-email");
          if (directEmailInp) {
            if (!bookMeData.contact) bookMeData.contact = {};
            bookMeData.contact.email = directEmailInp.value.trim() || "bookings@korayhussein.com";
          }

          // Update Packages & Pricing Cards
          mount.querySelectorAll(".kh-bm-pkg-editor-card").forEach(card => {
            const pkgId = card.dataset.pkgId;
            const pkg = (bookMeData.packages || []).find(p => p.id === pkgId);
            if (pkg) {
              const titleInp = card.querySelector(".bm-pkg-title-input");
              const detailsInp = card.querySelector(".bm-pkg-details-input");
              const priceInp = card.querySelector(".bm-pkg-price-input");
              const descInp = card.querySelector(".bm-pkg-desc-input");
              const fullDescInp = card.querySelector(".bm-pkg-fulldesc-input");
              const depositInp = card.querySelector(".bm-pkg-deposit-input");

              if (titleInp) pkg.title = titleInp.value.trim();
              if (detailsInp) pkg.details = detailsInp.value.trim();
              if (priceInp) pkg.price = priceInp.value.trim();
              if (descInp) pkg.desc = descInp.value.trim();
              if (fullDescInp) pkg.fullDesc = fullDescInp.value.trim();
              if (depositInp) pkg.depositNote = depositInp.value.trim();

              // Update Options
              card.querySelectorAll(".bm-pkg-opt-label").forEach(lblInp => {
                const optIdx = parseInt(lblInp.dataset.optIdx, 10);
                if (pkg.options && pkg.options[optIdx]) {
                  pkg.options[optIdx].label = lblInp.value.trim();
                }
              });
              card.querySelectorAll(".bm-pkg-opt-count").forEach(cntInp => {
                const optIdx = parseInt(cntInp.dataset.optIdx, 10);
                if (pkg.options && pkg.options[optIdx]) {
                  pkg.options[optIdx].countText = cntInp.value.trim();
                }
              });
              card.querySelectorAll(".bm-pkg-opt-price").forEach(prInp => {
                const optIdx = parseInt(prInp.dataset.optIdx, 10);
                if (pkg.options && pkg.options[optIdx]) {
                  const val = parseFloat(prInp.value) || 0;
                  pkg.options[optIdx].price = val;
                  pkg.options[optIdx].priceFormatted = `£${val}`;
                }
              });

              // Update Add-Ons
              card.querySelectorAll(".bm-pkg-addon-label").forEach(aLblInp => {
                const aIdx = parseInt(aLblInp.dataset.addonIdx, 10);
                if (pkg.addOns && pkg.addOns[aIdx]) {
                  pkg.addOns[aIdx].label = aLblInp.value.trim();
                }
              });
              card.querySelectorAll(".bm-pkg-addon-price").forEach(aPrInp => {
                const aIdx = parseInt(aPrInp.dataset.addonIdx, 10);
                if (pkg.addOns && pkg.addOns[aIdx]) {
                  const val = parseFloat(aPrInp.value) || 0;
                  pkg.addOns[aIdx].price = val;
                  pkg.addOns[aIdx].priceFormatted = `£${val}`;
                }
              });
            }
          });

          // Update Showcase Example Images for Each Package
          if (!Array.isArray(bookMeData.showcases)) bookMeData.showcases = [];
          (bookMeData.packages || []).forEach(pkg => {
            let sc = bookMeData.showcases.find(s => s.id === pkg.id);
            if (!sc) {
              sc = { id: pkg.id, tag: "session showcase", title: pkg.title, desc: pkg.desc || "", images: [] };
              bookMeData.showcases.push(sc);
            }
            const images = [];
            [0, 1, 2].forEach(imgIdx => {
              const hiddenInp = mount.querySelector(`.bm-pkg-img-src-input[data-pkg-id='${pkg.id}'][data-img-idx='${imgIdx}']`);
              const defaultSrc = `photos/book-me/${pkg.id}/0${imgIdx + 1}_0${imgIdx + 1}.jpg`;
              const srcVal = (hiddenInp && hiddenInp.value.trim()) || (sc.images && sc.images[imgIdx] && (typeof sc.images[imgIdx] === 'string' ? sc.images[imgIdx] : sc.images[imgIdx].src)) || defaultSrc;
              images.push({
                src: srcVal,
                alt: `${pkg.title} example ${imgIdx + 1}`
              });
            });
            sc.images = images;
          });

          // Update The Space & The Approach features
          if (Array.isArray(bookMeData.features)) {
            mount.querySelectorAll(".kh-bm-feature-editor-card").forEach((card) => {
              const fIdx = parseInt(card.dataset.featureIdx, 10);
              if (bookMeData.features[fIdx]) {
                const tagInp = card.querySelector(".bm-feature-tag-input");
                const titleInp = card.querySelector(".bm-feature-title-input");
                const bodyInp = card.querySelector(".bm-feature-body-input");
                if (tagInp) bookMeData.features[fIdx].tag = tagInp.value.trim();
                if (titleInp) bookMeData.features[fIdx].title = titleInp.value.trim();
                if (bodyInp) bookMeData.features[fIdx].body = bodyInp.value.trim();
              }
            });
          }

          // Live update if book-page-wrap is mounted in DOM
          const liveBmWrap = document.querySelector(".book-page-wrap");
          if (liveBmWrap) {
            const featGrid = liveBmWrap.querySelector(".bm-features-duo-grid");
            if (featGrid && Array.isArray(bookMeData.features)) {
              featGrid.innerHTML = bookMeData.features.map(f => `
                <div class="bm-feature-block">
                  <span class="bm-tag">${escapeHtml(f.tag)}</span>
                  <h3>${escapeHtml(f.title)}</h3>
                  <p>${escapeHtml(f.body)}</p>
                </div>
              `).join("");
            }
          }

          if (typeof window.saveBookMeData === "function") {
            bookMeData.header = { ...(bookMeData.header || {}), ...pageConfig };
            window.saveBookMeData(bookMeData);
          }
        }

        headersConfig[activeInfoPageSlug] = pageConfig;
        saveCustomHeadersConfig(headersConfig, activeInfoPageSlug);

        // 2. Specific Page Store Updates
        if (isAboutMe) {
          const bioBody = mount.querySelector("#about-bio-body")?.value.trim() || "";
          const bioParas = splitParagraphs(bioBody);
          aboutData.header = { ...(aboutData.header || {}), ...pageConfig };
          aboutData.meta = { ...(aboutData.meta || {}), heroImage: pageConfig.heroImage, title: pageConfig.title, subtitle: pageConfig.intro };
          aboutData.bio = {
            ...(aboutData.bio || {}),
            body: bioBody,
            paragraphs: bioParas.length > 0 ? bioParas : (aboutData.bio?.paragraphs || []),
            lead: mount.querySelector("#about-bio-lead")?.value.trim() || (aboutData.bio?.lead || ""),
            quote: mount.querySelector("#about-bio-quote")?.value.trim() || (aboutData.bio?.quote || "")
          };
          const contactPhotoVal = mount.querySelector("#about-contact-photo-val")?.value || aboutData.contactPhoto || "photos/contact/DSCF8633.jpg";
          aboutData.contactPhoto = contactPhotoVal;
          aboutData.studio = {
            ...(aboutData.studio || {}),
            name: mount.querySelector("#about-studio-name")?.value.trim() || "Grow Studios",
            address: {
              ...(aboutData.studio?.address || {}),
              full: mount.querySelector("#about-studio-address")?.value.trim() || "Grow Studios, 92 Wallis Road, Hackney Wick, London E9 5LN"
            },
            directions: mount.querySelector("#about-studio-directions")?.value.trim() || "",
            googleMapsUrl: mount.querySelector("#about-studio-gmaps")?.value.trim() || "https://www.google.com/maps/search/?api=1&query=Grow+Studios+92+Wallis+Road+Hackney+Wick+London+E9+5LN",
            embedUrl: mount.querySelector("#about-studio-embed")?.value.trim() || "https://maps.google.com/maps?q=Grow%20Studios%2C%2092%20Wallis%20Road%2C%20Hackney%20Wick%2C%20London%20E9%205LN&t=&z=16&ie=UTF8&iwloc=&output=embed"
          };
          if (typeof window.saveAboutMeData === "function") window.saveAboutMeData(aboutData);
        } else if (isFaq) {
          faqData.header = { ...(faqData.header || {}), ...pageConfig };
          mount.querySelectorAll(".faq-item-card").forEach(card => {
            const catId = card.dataset.catId;
            const qIdx = parseInt(card.dataset.qIdx, 10);
            const qInput = card.querySelector(".faq-q-input");
            const aTextarea = card.querySelector(".faq-a-textarea");
            const cat = (faqData.categories || []).find(c => c.id === catId);
            if (cat && cat.questions && cat.questions[qIdx]) {
              if (qInput) cat.questions[qIdx].q = qInput.value.trim();
              if (aTextarea) {
                const paras = splitParagraphs(aTextarea.value.trim());
                cat.questions[qIdx].a = paras.length ? paras : [aTextarea.value.trim()];
              }
            }
          });

          // Save Contact Box at bottom of FAQ
          if (!faqData.contactBox) faqData.contactBox = {};
          faqData.contactBox.tag = mount.querySelector("#faq-contact-tag")?.value.trim() || "GOT A QUESTION?";
          faqData.contactBox.title = mount.querySelector("#faq-contact-title")?.value.trim() || "Have a question that's not answered here?";
          faqData.contactBox.desc = mount.querySelector("#faq-contact-desc")?.value.trim() || "Send it through and I'll get back to you with an answer as soon as I can.";
          faqData.contactBox.btnText = mount.querySelector("#faq-contact-btn")?.value.trim() || "Send Question →";
          faqData.contactBox.directEmail = mount.querySelector("#faq-contact-email")?.value.trim() || "contact@korayhussein.com";

          if (typeof window.saveFaqData === "function") window.saveFaqData(faqData);
        } else if (isPlaylists) {
          playlistsData.header = {
            ...(playlistsData.header || {}),
            ...pageConfig,
            spotifyProfileUrl: mount.querySelector("#pl-profile-url")?.value.trim() || "https://open.spotify.com/user/korayhussein"
          };
          mount.querySelectorAll(".pl-item-card").forEach(card => {
            const secId = card.dataset.secId;
            const plIdx = parseInt(card.dataset.plIdx, 10);
            const sec = (playlistsData.sections || []).find(s => s.id === secId);
            if (sec && sec.playlists && sec.playlists[plIdx]) {
              const titleInp = card.querySelector(".pl-title-input");
              const urlInp = card.querySelector(".pl-url-input");
              const moodInp = card.querySelector(".pl-mood-input");
              const imgInp = card.querySelector(".pl-img-val");
              if (titleInp) sec.playlists[plIdx].title = titleInp.value.trim();
              if (urlInp) {
                sec.playlists[plIdx].url = urlInp.value.trim();
                const m = urlInp.value.trim().match(/playlist\/([a-zA-Z0-9]+)/);
                if (m && m[1]) sec.playlists[plIdx].embedId = m[1];
              }
              if (moodInp) sec.playlists[plIdx].mood = moodInp.value.trim();
              if (imgInp && imgInp.value) sec.playlists[plIdx].image = imgInp.value;
            }
          });
          if (typeof window.savePlaylistsData === "function") window.savePlaylistsData(playlistsData);
        } else if (isTestimonials) {
          mount.querySelectorAll(".kh-tm-editor-card").forEach(card => {
            const idx = parseInt(card.dataset.idx, 10);
            if (testimonials[idx]) {
              const nameInp = card.querySelector(".tm-name-input");
              const handleInp = card.querySelector(".tm-handle-input");
              const quoteInp = card.querySelector(".tm-quote-input");
              const imgInp = card.querySelector(".tm-img-val");
              if (nameInp) testimonials[idx].name = nameInp.value.trim();
              if (handleInp) {
                testimonials[idx].handle = handleInp.value.trim();
                testimonials[idx].role = handleInp.value.trim();
              }
              if (quoteInp) testimonials[idx].quote = quoteInp.value.trim();
              if (imgInp && imgInp.value) testimonials[idx].image = imgInp.value;
            }
          });
          saveTestimonialsList(testimonials);
        } else if (isCancellations) {
          const bodyVal = mount.querySelector("#cn-intro-body")?.value.trim() || "";
          const paras = splitParagraphs(bodyVal);
          const updatedIntro = {
            tag: mount.querySelector("#cn-intro-tag")?.value.trim() || "priority notification list",
            heading: mount.querySelector("#cn-intro-heading")?.value.trim() || "direct notifications for short-notice studio dates",
            body: bodyVal,
            paragraph1: paras[0] || "",
            paragraph2: paras[1] || ""
          };
          if (cancellationsStore.updateIntroCard) cancellationsStore.updateIntroCard(updatedIntro);
          if (cancellationsStore.updateOpening) cancellationsStore.updateOpening({ isActive: false });

          const parseLines = (val) => (val || "").split("\n").map(l => l.trim()).filter(Boolean);
          const updatedForm = {
            tag: mount.querySelector("#cn-form-tag")?.value.trim() || "join the list",
            title: mount.querySelector("#cn-form-title")?.value.trim() || "enter your details",
            subtitle: mount.querySelector("#cn-form-subtitle")?.value.trim() || "",
            bookingAsOptions: parseLines(mount.querySelector("#cn-form-opt-booking")?.value),
            shootTypeOptions: parseLines(mount.querySelector("#cn-form-opt-shoot")?.value),
            timeOfDayOptions: parseLines(mount.querySelector("#cn-form-opt-time")?.value),
            submitButtonText: mount.querySelector("#cn-form-btn-text")?.value.trim() || "Join Cancellation Priority List &rarr;",
            privacyNote: mount.querySelector("#cn-form-privacy")?.value.trim() || "",
            successTitle: mount.querySelector("#cn-form-success-title")?.value.trim() || "you're on the priority notification list",
            successDesc: mount.querySelector("#cn-form-success-desc")?.value.trim() || ""
          };
          if (cancellationsStore.updateFormConfig) cancellationsStore.updateFormConfig(updatedForm);
        } else if (isClientPortal) {
          const cardLabelInp = mount.querySelector("#portal-edit-card-label");
          const placeholderInp = mount.querySelector("#portal-edit-placeholder");
          const btnTextInp = mount.querySelector("#portal-edit-btn-text");
          const hintInp = mount.querySelector("#portal-edit-hint");
          const gTitle1Inp = mount.querySelector("#portal-edit-gtitle1");
          const gDesc1Inp = mount.querySelector("#portal-edit-gdesc1");
          const gTitle2Inp = mount.querySelector("#portal-edit-gtitle2");
          const gDesc2Inp = mount.querySelector("#portal-edit-gdesc2");
          const gTitle3Inp = mount.querySelector("#portal-edit-gtitle3");
          const gDesc3Inp = mount.querySelector("#portal-edit-gdesc3");

          if (cardLabelInp) pageConfig.accessCardLabel = cardLabelInp.value.trim();
          if (placeholderInp) pageConfig.accessPlaceholder = placeholderInp.value.trim();
          if (btnTextInp) pageConfig.accessBtnText = btnTextInp.value.trim();
          if (hintInp) pageConfig.accessHint = hintInp.value.trim();
          if (gTitle1Inp) pageConfig.guideTitle1 = gTitle1Inp.value.trim();
          if (gDesc1Inp) pageConfig.guideDesc1 = gDesc1Inp.value.trim();
          if (gTitle2Inp) pageConfig.guideTitle2 = gTitle2Inp.value.trim();
          if (gDesc2Inp) pageConfig.guideDesc2 = gDesc2Inp.value.trim();
          if (gTitle3Inp) pageConfig.guideTitle3 = gTitle3Inp.value.trim();
          if (gDesc3Inp) pageConfig.guideDesc3 = gDesc3Inp.value.trim();
        }

        // Save pageConfig to headersConfig for ALL information pages
        headersConfig[activeInfoPageSlug] = pageConfig;
        saveCustomHeadersConfig(headersConfig, activeInfoPageSlug);

        showToast(`${pageConfig.name} settings saved & synced ✓`);
        renderInfoPagesManager(mount);
      };

      mount.querySelectorAll("#save-infopages-top-btn, #save-infopages-bottom-btn").forEach(btn => {
        btn.addEventListener("click", handleMasterSave);
      });
    }

    // Universal Modal Picker for Hero Images, Portraits, Playlists, Testimonials
    function openUniversalImagePicker(mount, { title, subtitle, onSelect }) {
      const modalMount = mount.querySelector("#universal-picker-modal-mount");
      if (!modalMount) return;

      const allImages = getAllAvailablePortfolioImages();

      modalMount.innerHTML = `
        <div class="kh-modal-backdrop">
          <div class="kh-modal-window kh-modal-wide">
            <div class="kh-modal-head">
              <div>
                <h3>${title || "Choose Photo from Library"}</h3>
                <p class="kh-sec-desc" style="margin:2px 0 0 0;">${subtitle || "Click any photograph to select it."}</p>
              </div>
              <button type="button" class="kh-modal-close" id="universal-picker-close-btn">&times;</button>
            </div>
            <div class="kh-modal-body">
              <div class="kh-picker-grid">
                ${allImages.map(img => `
                  <div class="kh-picker-card" data-src="${img.src}" style="cursor:pointer; position:relative;">
                    <img src="${img.src}" alt="${img.title}" loading="lazy">
                    <span class="kh-picker-caption">${img.title}</span>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>
      `;

      const close = () => { modalMount.innerHTML = ""; };
      const closeBtn = modalMount.querySelector("#universal-picker-close-btn");
      if (closeBtn) closeBtn.addEventListener("click", close);

      modalMount.querySelectorAll(".kh-picker-card").forEach(card => {
        card.addEventListener("click", () => {
          const src = card.dataset.src;
          if (src && typeof onSelect === "function") {
            onSelect(src);
          }
          close();
        });
      });
    }

    // Compatibility stubs
    function renderHeadersManager(mount) { renderInfoPagesManager(mount); }
    function renderCancellationsManager(mount) {
      activeInfoPageSlug = "cancellations";
      renderInfoPagesManager(mount);
    }


        renderView();
  };

  /* ---------------------------------------------------------
     Lock Screen when not signed in
     --------------------------------------------------------- */
  function renderStudioLockScreen(container) {
    container.innerHTML = `
      <div class="kh-studio-lock-wrap">
        <div class="kh-studio-lock-box">
          <span class="kh-studio-badge">&#9679; Koray Hussein Photography</span>
          <h1 class="kh-studio-title" style="font-size:clamp(32px, 5vw, 48px); margin:12px 0;">master photographer studio</h1>
          <p class="kh-sec-desc" style="max-width:440px; margin:0 auto 24px;">
            Please enter your master passkey to access site curation, main galleries, exhibition sets, splash typography, and testimonials.
          </p>
          <div class="kh-lock-form">
            <input type="password" id="studio-passkey-input" class="kh-input" placeholder="Enter master passkey..." autofocus autocomplete="current-password">
            <button type="button" id="studio-unlock-btn" class="kh-btn-primary" style="white-space:nowrap;">Unlock Studio &rarr;</button>
          </div>
          <div id="studio-lock-error" class="kh-error-msg" style="display:none; margin-top:12px; color:#ff5555; font-size:13px;">Incorrect passkey. Please try again.</div>
          <div style="margin-top:24px;">
            <a href="#/portfolio" class="kh-btn-inline-back">&larr; Return to Portfolio</a>
          </div>
        </div>
      </div>
    `;

    const input = container.querySelector("#studio-passkey-input");
    const unlockBtn = container.querySelector("#studio-unlock-btn");
    const errorMsg = container.querySelector("#studio-lock-error");

    function attemptUnlock() {
      const val = (input.value || "").trim();
      if (val === MASTER_PASSKEY || val.toLowerCase() === MASTER_PASSKEY.toLowerCase()) {
        setPhotographerAuth(true);
        window.renderPhotographerDashboardPage(container);
      } else {
        errorMsg.style.display = "block";
        input.value = "";
        input.focus();
      }
    }

    unlockBtn.addEventListener("click", attemptUnlock);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") attemptUnlock();
    });
  }

  // Auto-init splash typography on startup if saved
  try {
    const savedSplash = loadSplashSettings();
    applySplashSettingsToDOM(savedSplash);
  } catch (e) {}

  // Auto-init site-wide typography on startup if saved
  try {
    const savedTypo = loadTypographySettings();
    applyTypographyToDOM(savedTypo);
  } catch (e) {}

  // Auto-init custom main galleries if present
  try {
    const customGalleries = loadCustomMainGalleries();
    if (window.SITE_DATA && window.SITE_DATA.galleries) {
      Object.assign(window.SITE_DATA.galleries, customGalleries);
    }
  } catch (e) {}

  // Auto-init custom headers on startup if saved
  try {
    const customHeaders = loadCustomHeadersConfig();
    applyHeadersConfigToLiveDOM(customHeaders);
  } catch (e) {}

})();
