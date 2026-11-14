/* ==========================================================
   Koray Hussein — Editorial Portfolio Application
   5 Distinct Sets Page Layouts + Theme Toggle + Refined Spacing
   ========================================================== */
(() => {
  "use strict";

  // Self-healing: Purge legacy low-res embedded base64 headers from secondary data keys
  try {
    const secondaryKeys = [
      "kh_about_me_data_v1",
      "kh_book_me_data_v1",
      "kh_cancellations_priority_data_v1",
      "kh_faq_data_v1",
      "kh_playlists_data_v1",
      "kh_custom_headers"
    ];
    secondaryKeys.forEach(k => {
      const raw = localStorage.getItem(k);
      if (raw && (raw.includes("data:image/jpeg;base64") || raw.includes("data:image/png;base64"))) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            if (parsed.header) {
              if (parsed.header.heroImage && parsed.header.heroImage.startsWith("data:")) delete parsed.header.heroImage;
              if (parsed.header.heroImageMobile && parsed.header.heroImageMobile.startsWith("data:")) delete parsed.header.heroImageMobile;
            }
            if (parsed.meta) {
              if (parsed.meta.heroImage && parsed.meta.heroImage.startsWith("data:")) parsed.meta.heroImage = "photos/contact/2.jpg";
            }
            localStorage.setItem(k, JSON.stringify(parsed));
          }
        } catch(e) {}
      }
    });
  } catch(e) {}

  const data = window.SITE_DATA || {};
  const splash = document.getElementById("splash");
  const splashBg = document.getElementById("splash-bg");
  const enterBtn = document.getElementById("enter-site");
  
  // Navigation elements
  const menuBtn = document.getElementById("menu-btn");
  const menuCloseBtn = document.getElementById("menu-close-btn");
  const menuBackdrop = document.getElementById("menu-backdrop");
  const sideMenu = document.getElementById("side-menu");
  const sideNavContent = document.getElementById("side-nav-content");
  const sideNavInfo = document.getElementById("side-nav-info");
  const sideNavSocials = document.getElementById("side-nav-socials");
  
  const main = document.getElementById("main-content");
  const curtain = document.getElementById("curtain");
  const themeBtn = document.getElementById("theme-btn");
  
  // Lightbox elements
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");
  const lightboxPrev = document.getElementById("lightbox-prev");
  const lightboxNext = document.getElementById("lightbox-next");
  const lightboxCounter = document.getElementById("lightbox-counter");
  const lightboxProofingBar = document.getElementById("lightbox-proofing-bar");
  let activeProofingContext = null;

  let currentGallery = [];
  let currentImageIdx = 0;
  let isNavOpen = false;
  let isTransitioning = false;

  /* ---------------------------------------------------------
     Universal Cross-Device Cloud Sync Engine (Firestore)
     Ensures all devices (Mobile, Desktop, Tablet, Visitors)
     render the exact same live re-ordered Sets, Main Galleries,
     Testimonials and Splash settings in real time.
     --------------------------------------------------------- */
  const CUSTOM_SETS_KEY = "kh_custom_sets_data";
  const CUSTOM_MAIN_GALLERIES_KEY = "kh_custom_main_galleries";
  const CUSTOM_TESTIMONIALS_KEY = "kh_custom_testimonials";
  const CUSTOM_HEADERS_KEY = "kh_custom_headers";
  const SPLASH_STORAGE_KEY = "kh_splash_custom_config";
  const TYPOGRAPHY_STORAGE_KEY = "kh_site_typography_v1";

  function applyTypographyToDOM(settings) {
    if (!settings || typeof settings !== "object") return;
    const root = document.documentElement;
    if (typeof settings.globalScale === "number") {
      root.style.setProperty("--typo-global-scale", String(settings.globalScale / 100));
    }
    if (settings.headersSize) root.style.setProperty("--typo-headers-size", `${settings.headersSize}px`);
    if (settings.subheadsSize) root.style.setProperty("--typo-subheads-size", `${settings.subheadsSize}px`);
    if (settings.bodySize) root.style.setProperty("--typo-body-size", `${settings.bodySize}px`);
    if (settings.metaSize) root.style.setProperty("--typo-meta-size", `${settings.metaSize}px`);
    if (settings.menuSize) root.style.setProperty("--typo-menu-size", `${settings.menuSize}px`);
    if (settings.tickerSize) root.style.setProperty("--typo-ticker-size", `${settings.tickerSize}px`);
  }
  window.applyTypographyToDOM = applyTypographyToDOM;

  function syncLiveCustomTypography() {
    try {
      const customRaw = localStorage.getItem(TYPOGRAPHY_STORAGE_KEY);
      if (customRaw) {
        const customTypo = JSON.parse(customRaw);
        applyTypographyToDOM(customTypo);
      }
    } catch (e) {}
  }

  const FIREBASE_CONFIG = {
    apiKey: (typeof window !== "undefined" && window.SETTINGS && window.SETTINGS.firebase && window.SETTINGS.firebase.apiKey) || "AIzaSyD0b76g_32uPjLpeezf3QSlTSbAEbSeXjs",
    projectId: (typeof window !== "undefined" && window.SETTINGS && window.SETTINGS.firebase && window.SETTINGS.firebase.projectId) || "korayhussein-proofing"
  };

  function getFirestoreDocUrl(docId) {
    return `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/client_shoots/${encodeURIComponent(docId)}?key=${FIREBASE_CONFIG.apiKey}`;
  }

  function syncLiveCustomSets() {
    try {
      const customRaw = localStorage.getItem(CUSTOM_SETS_KEY);
      if (customRaw) {
        const customData = JSON.parse(customRaw);
        if (customData && Array.isArray(customData.setsList)) {
          data.setsList = customData.setsList;
          const validSetKeys = new Set(data.setsList.map(s => `set:${s.slug}`));
          data.sets = customData.sets || {};
          const cleanGalleries = {};
          Object.entries(data.galleries || {}).forEach(([k, v]) => {
            if (!k.startsWith("set:") || validSetKeys.has(k)) {
              cleanGalleries[k] = v;
            }
          });
          if (customData.galleries && typeof customData.galleries === "object") {
            Object.keys(customData.galleries).forEach(k => {
              if (validSetKeys.has(k)) {
                cleanGalleries[k] = customData.galleries[k];
              }
            });
          }
          data.galleries = cleanGalleries;
          if (window.SITE_DATA) {
            window.SITE_DATA.setsList = data.setsList;
            window.SITE_DATA.sets = data.sets;
            window.SITE_DATA.galleries = data.galleries;
          }
          const setsBadge = document.querySelector('[data-slug="sets"] .editorial-col__badge');
          if (setsBadge && Array.isArray(data.setsList)) {
            setsBadge.textContent = `[${data.setsList.length} galleries]`;
          }
        }
      }
    } catch (e) {}
  }

  function syncLiveCustomGalleries() {
    try {
      const customRaw = localStorage.getItem(CUSTOM_MAIN_GALLERIES_KEY);
      if (customRaw) {
        const customGalleries = JSON.parse(customRaw);
        if (customGalleries && typeof customGalleries === "object") {
          Object.keys(customGalleries).forEach(k => {
            const list = customGalleries[k];
            if (Array.isArray(list) && (list.length > 0 || !data.galleries[k])) {
              data.galleries[k] = list;
            }
          });
          if (window.SITE_DATA) {
            window.SITE_DATA.galleries = data.galleries;
          }
        }
      }
    } catch (e) {}
  }

  function syncLiveCustomTestimonials() {
    try {
      const customRaw = localStorage.getItem(CUSTOM_TESTIMONIALS_KEY);
      if (customRaw && window.TESTIMONIALS_DATA) {
        const customItems = JSON.parse(customRaw);
        if (Array.isArray(customItems) && customItems.length > 0) {
          window.TESTIMONIALS_DATA.items = customItems;
        }
      }
    } catch (e) {}
  }

  function updateLiveHeroBannerInDOM(pageSlug, pageCfg) {
    if (!pageCfg || typeof pageCfg !== "object") return;
    const banner = document.querySelector(".cinematic-hero-banner");
    if (!banner) return;

    // Check if the current visible page matches this slug
    const currentHash = (location.hash || "").replace(/^#\/?/, "").split("/")[0] || "";
    const slugMap = {
      "book-me": ["book-me", "book"],
      "about-me": ["about-me", "contact"],
      "faq": ["faq"],
      "playlists": ["playlists"],
      "testimonials": ["testimonials"],
      "cancellations": ["cancellations", "priority-list", "priority-openings", "short-notice-bookings", "short-notice"],
      "client-portal": ["client-portal"]
    };
    const validSlugs = slugMap[pageSlug] || [pageSlug];
    if (!validSlugs.includes(currentHash)) return;

    const imgBox = banner.querySelector(".cinematic-hero-banner__img-box");
    if (imgBox) {
      const mAspect = pageCfg.heroMobileAspect || "4 / 5";
      imgBox.style.setProperty("--hero-mobile-aspect", mAspect);

      const mSrc = pageCfg.heroImageMobile || pageCfg.heroMobileImage || pageCfg.heroImage || "";
      const dSrc = pageCfg.heroImage || "";
      const mobileSrcset = mSrc ? (mSrc.startsWith("data:") ? mSrc : encodeURI(mSrc)) : "";
      const desktopSrc = dSrc ? (dSrc.startsWith("data:") ? dSrc : encodeURI(dSrc)) : "";
      const existingImg = imgBox.querySelector("img");
      const altText = (existingImg && existingImg.alt) || pageCfg.title || "Hero banner";
      const isMobileScreen = typeof window !== "undefined" && window.innerWidth <= 768;
      const initialSrc = (isMobileScreen && mobileSrcset) ? mobileSrcset : (desktopSrc || mobileSrcset);

      let oldPicture = imgBox.querySelector("picture");
      const newPicture = document.createElement("picture");
      newPicture.innerHTML = `
        ${mobileSrcset ? `<source media="(max-width: 768px)" srcset="${mobileSrcset}">` : ""}
        <img src="${initialSrc}" alt="${altText}" loading="eager">
      `;
      if (oldPicture && oldPicture.parentNode === imgBox) {
        imgBox.replaceChild(newPicture, oldPicture);
      } else if (existingImg && existingImg.parentNode === imgBox) {
        imgBox.replaceChild(newPicture, existingImg);
      } else {
        imgBox.insertBefore(newPicture, imgBox.firstChild);
      }
    }

    const heroTag = banner.querySelector(".cinematic-hero-tag");
    const heroTitle = banner.querySelector(".cinematic-hero-title");
    const heroLead = banner.querySelector(".cinematic-hero-lead");

    if (heroTag && pageCfg.tag) heroTag.textContent = pageCfg.tag;
    if (heroTitle && pageCfg.title) heroTitle.textContent = pageCfg.title;
    if (heroLead && (pageCfg.intro || pageCfg.subtitle)) {
      heroLead.textContent = pageCfg.intro || pageCfg.subtitle;
    }
  }
  window.updateLiveHeroBannerInDOM = updateLiveHeroBannerInDOM;
  window._KH_HEADERS = window._KH_HEADERS || {};

  async function syncPageHeader(slug) {
    if (!slug) return;
    try {
      const [res, dRes, mRes] = await Promise.allSettled([
        fetch(getFirestoreDocUrl("header_" + slug), { cache: "no-store", headers: { "Cache-Control": "no-cache" } }),
        fetch(getFirestoreDocUrl("header_desktop_" + slug), { cache: "no-store", headers: { "Cache-Control": "no-cache" } }),
        fetch(getFirestoreDocUrl("header_mobile_" + slug), { cache: "no-store", headers: { "Cache-Control": "no-cache" } })
      ]);

      let pageData = {};
      if (res.status === "fulfilled" && res.value.ok) {
        const json = await res.value.json();
        if (json && json.fields && json.fields.dataJson) {
          pageData = JSON.parse(json.fields.dataJson.stringValue) || {};
        }
      }

      // Dedicated 1MB quota document for Desktop Header
      if (dRes.status === "fulfilled" && dRes.value.ok) {
        try {
          const dJson = await dRes.value.json();
          if (dJson && dJson.fields && dJson.fields.heroImage && dJson.fields.heroImage.stringValue) {
            pageData.heroImage = dJson.fields.heroImage.stringValue;
          }
        } catch(e) {}
      }

      // Dedicated 1MB quota document for Mobile Header
      if (mRes.status === "fulfilled" && mRes.value.ok) {
        try {
          const mJson = await mRes.value.json();
          if (mJson && mJson.fields && mJson.fields.heroImageMobile && mJson.fields.heroImageMobile.stringValue) {
            pageData.heroImageMobile = mJson.fields.heroImageMobile.stringValue;
          }
        } catch(e) {}
      }

      if (pageData && Object.keys(pageData).length > 0) {
        window._KH_HEADERS[slug] = pageData;
        try { localStorage.setItem("kh_header_" + slug, JSON.stringify(pageData)); } catch (e) {}
        applyHeadersConfig({ [slug]: pageData });
      }
    } catch (e) {}
  }
  window.syncPageHeader = syncPageHeader;

  function applyHeadersConfig(config) {
    if (!config || typeof config !== "object") return;
    for (const [slug, pageCfg] of Object.entries(config)) {
      if (!pageCfg) continue;
      window._KH_HEADERS[slug] = pageCfg;
      try { localStorage.setItem("kh_header_" + slug, JSON.stringify(pageCfg)); } catch (e) {}
      if (slug === "about-me" && window.ABOUT_ME_DATA) {
        window.ABOUT_ME_DATA.header = { ...(window.ABOUT_ME_DATA.header || {}), ...pageCfg };
        if (window.ABOUT_ME_DATA.meta && pageCfg.heroImage) {
          window.ABOUT_ME_DATA.meta.heroImage = pageCfg.heroImage;
        }
      } else if (slug === "book-me" && window.BOOK_ME_DATA) {
        window.BOOK_ME_DATA.header = { ...(window.BOOK_ME_DATA.header || {}), ...pageCfg };
        if (pageCfg.bookingTicker) {
          window.BOOK_ME_DATA.bookingTicker = pageCfg.bookingTicker;
        }
        updateSplashBookingTicker(pageCfg.bookingTicker);
        const dates = pageCfg.travelDates || pageCfg.travelTicker;
        updateSplashTravelTicker(pageCfg.travelEnabled, dates);
      } else if (slug === "faq" && window.FAQ_DATA) {
        window.FAQ_DATA.header = { ...(window.FAQ_DATA.header || {}), ...pageCfg };
      } else if (slug === "playlists" && window.PLAYLISTS_DATA) {
        window.PLAYLISTS_DATA.header = { ...(window.PLAYLISTS_DATA.header || {}), ...pageCfg };
      } else if (slug === "testimonials" && window.TESTIMONIALS_DATA) {
        window.TESTIMONIALS_DATA.header = { ...(window.TESTIMONIALS_DATA.header || {}), ...pageCfg };
      } else if (slug === "client-portal" && window.CLIENT_PORTAL_DATA) {
        window.CLIENT_PORTAL_DATA.header = { ...(window.CLIENT_PORTAL_DATA.header || {}), ...pageCfg };
      } else if (slug === "cancellations" && window.CANCELLATIONS_DATA) {
        window.CANCELLATIONS_DATA.header = { ...(window.CANCELLATIONS_DATA.header || {}), ...pageCfg };
      }
      updateLiveHeroBannerInDOM(slug, pageCfg);
    }
    window.dispatchEvent(new CustomEvent("kh_headers_updated", { detail: config }));
  }

  /* ---------------------------------------------------------
     Dynamic Adaptive Revolving Ticker Engine
     - Measures rendered text width against visible capsule boundaries.
     - When all words fit comfortably: stays completely STATIC.
     - When words overflow screen or container: smoothly REVOLVES like a
       real marquee news ticker in a continuous seamless loop.
     - Supports live window resizing & orientation switching.
     --------------------------------------------------------- */
  let currentSplashBookingText = "";
  let currentSplashTravelData = { enabled: true, dates: null };

  function measureRenderedTextWidth(text, referenceEl) {
    if (!text) return 0;
    let ruler = document.getElementById("kh-ticker-ruler");
    if (!ruler) {
      ruler = document.createElement("span");
      ruler.id = "kh-ticker-ruler";
      ruler.style.position = "absolute";
      ruler.style.visibility = "hidden";
      ruler.style.whiteSpace = "nowrap";
      ruler.style.pointerEvents = "none";
      ruler.style.top = "-9999px";
      ruler.style.left = "-9999px";
      document.body.appendChild(ruler);
    }
    const cs = window.getComputedStyle(referenceEl || document.body);
    ruler.style.fontFamily = cs.fontFamily || "var(--font-sans)";
    ruler.style.fontSize = cs.fontSize || (window.innerWidth <= 768 ? "10.5px" : "11.5px");
    ruler.style.fontWeight = cs.fontWeight || "400";
    ruler.style.letterSpacing = cs.letterSpacing || (window.innerWidth <= 768 ? "0.12em" : "0.16em");
    ruler.style.textTransform = cs.textTransform || "uppercase";
    ruler.textContent = text;
    return ruler.getBoundingClientRect().width;
  }

  function applyAdaptiveTicker(tickerEl, textEl, fullText) {
    if (!tickerEl || !textEl) return;
    const text = (fullText || "").trim();
    if (!text) {
      tickerEl.style.display = "none";
      return;
    }
    tickerEl.style.display = "inline-flex";

    const screenWidth = window.innerWidth;
    const isMobile = screenWidth <= 768;

    // Available width for text inside the ticker capsule:
    // Mobile (<=768px): screen max-width ~88vw minus padding & icon (~46px)
    // Desktop: capsule width up to ~540px or ~44vw minus padding & icon (~52px)
    const maxCapsuleWidth = isMobile ? (screenWidth * 0.88) : Math.min(540, screenWidth * 0.44);
    const availableTextWidth = Math.max(80, maxCapsuleWidth - (isMobile ? 46 : 52));

    const textWidth = measureRenderedTextWidth(text, textEl);
    const doesFit = textWidth <= availableTextWidth;

    if (doesFit) {
      // FITS EVERYTHING: Stay static, elegant, and perfectly centered
      tickerEl.classList.remove("is-revolving-ticker");
      textEl.classList.remove("is-revolving");
      textEl.textContent = text;
    } else {
      // OVERFLOWS: Revolves continuously like a real ticker
      tickerEl.classList.add("is-revolving-ticker");
      textEl.classList.add("is-revolving");

      // Dynamic duration based on pixel length for steady, readable crawl (~36px/s)
      const speed = 36;
      const segmentWidth = Math.max(textWidth + 36, 180);
      const duration = Math.max(10, segmentWidth / speed);

      const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      textEl.innerHTML = `
        <span class="splash__ticker-track" style="animation-duration: ${duration.toFixed(1)}s;">
          <span class="splash__ticker-segment">${safe}&nbsp;&nbsp;&middot;&middot;&middot;&nbsp;&nbsp;</span>
          <span class="splash__ticker-segment" aria-hidden="true">${safe}&nbsp;&nbsp;&middot;&middot;&middot;&nbsp;&nbsp;</span>
        </span>
      `;
    }
  }

  function updateSplashBookingTicker(customText) {
    const tickerEl = document.getElementById("splash-booking-ticker");
    const textEl = document.getElementById("splash-booking-ticker-text");
    if (!tickerEl || !textEl) return;

    const text = (typeof customText === "string" ? customText : (
      (window.BOOK_ME_DATA && window.BOOK_ME_DATA.header && window.BOOK_ME_DATA.header.bookingTicker) ||
      (window.BOOK_ME_DATA && window.BOOK_ME_DATA.bookingTicker) ||
      ""
    )).trim();

    currentSplashBookingText = text;
    applyAdaptiveTicker(tickerEl, textEl, text);
  }
  window.updateSplashBookingTicker = updateSplashBookingTicker;

  const activeCarousels = new Map();

  function startTickerCarousel(elementId, items, prefix = "upcoming travel: ", intervalMs = 2800) {
    const el = typeof elementId === "string" ? document.getElementById(elementId) : elementId;
    if (!el) return;

    if (activeCarousels.has(elementId)) {
      clearInterval(activeCarousels.get(elementId));
      activeCarousels.delete(elementId);
    }

    let list = [];
    if (Array.isArray(items)) {
      list = items.filter(Boolean).map(s => String(s).trim());
    } else if (typeof items === "string" && items.trim()) {
      list = items.includes("/") ? items.split("/").map(s => s.trim()).filter(Boolean) : [items.trim()];
    }

    if (list.length === 0) return;

    const formatText = (item) => {
      const clean = item.replace(/^upcoming travel:\s*/i, "").trim();
      return prefix ? `${prefix}${clean}` : clean;
    };

    let currentIndex = 0;
    el.textContent = formatText(list[0]);
    el.style.transform = "translateY(0)";
    el.style.opacity = "1";

    if (list.length <= 1) return; // Static when 1 stop

    let isPaused = false;
    const parentTicker = el.closest(".splash__booking-ticker, .cinematic-hero-stamp");
    if (parentTicker && !parentTicker._carouselHoverBound) {
      parentTicker._carouselHoverBound = true;
      parentTicker.addEventListener("mouseenter", () => { isPaused = true; });
      parentTicker.addEventListener("mouseleave", () => { isPaused = false; });
    }

    const timer = setInterval(() => {
      if (isPaused || !document.contains(el)) return;

      el.style.transition = "transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.32s ease";
      el.style.transform = "translateY(-7px)";
      el.style.opacity = "0";

      setTimeout(() => {
        if (!document.contains(el)) return;
        currentIndex = (currentIndex + 1) % list.length;
        el.textContent = formatText(list[currentIndex]);
        el.style.transition = "none";
        el.style.transform = "translateY(7px)";
        void el.offsetWidth; // Force reflow
        el.style.transition = "transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.38s ease";
        el.style.transform = "translateY(0)";
        el.style.opacity = "1";
      }, 330);
    }, intervalMs);

    activeCarousels.set(elementId, timer);
  }
  window.startTickerCarousel = startTickerCarousel;

  function updateSplashTravelTicker(enabled, customDates) {
    const tickerEl = document.getElementById("splash-travel-ticker");
    const textEl = document.getElementById("splash-travel-ticker-text");
    if (!tickerEl || !textEl) return;

    let isEnabled;
    if (typeof enabled === "boolean") {
      isEnabled = enabled;
    } else if (window.BOOK_ME_DATA && window.BOOK_ME_DATA.header && typeof window.BOOK_ME_DATA.header.travelEnabled === "boolean") {
      isEnabled = window.BOOK_ME_DATA.header.travelEnabled;
    } else {
      isEnabled = true;
    }

    let dates = customDates;
    if (!dates) {
      if (window.BOOK_ME_DATA && window.BOOK_ME_DATA.header && Array.isArray(window.BOOK_ME_DATA.header.travelDates) && window.BOOK_ME_DATA.header.travelDates.length) {
        dates = window.BOOK_ME_DATA.header.travelDates;
      } else if (window.BOOK_ME_DATA && window.BOOK_ME_DATA.header && window.BOOK_ME_DATA.header.travelTicker) {
        dates = [window.BOOK_ME_DATA.header.travelTicker];
      } else {
        dates = ["paris · 12–18 may", "new york · 2–9 june", "milan · 16–22 june"];
      }
    } else if (typeof dates === "string") {
      dates = dates.includes("/") ? dates.split("/").map(s => s.trim()).filter(Boolean) : [dates];
    }

    currentSplashTravelData = { enabled: isEnabled, dates: dates };

    if (!isEnabled || !dates || dates.length === 0) {
      tickerEl.style.display = "none";
      if (activeCarousels.has("splash-travel-ticker-text")) {
        clearInterval(activeCarousels.get("splash-travel-ticker-text"));
        activeCarousels.delete("splash-travel-ticker-text");
      }
    } else {
      tickerEl.style.display = "inline-flex";
      tickerEl.classList.remove("is-revolving-ticker");
      textEl.classList.remove("is-revolving");
      startTickerCarousel("splash-travel-ticker-text", dates, "upcoming travel: ");
    }
  }
  window.updateSplashTravelTicker = updateSplashTravelTicker;

  // Window resize handler: smoothly re-calibrates static vs revolving states
  let tickerResizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(tickerResizeTimer);
    tickerResizeTimer = setTimeout(() => {
      updateSplashBookingTicker(currentSplashBookingText);
      updateSplashTravelTicker(currentSplashTravelData.enabled, currentSplashTravelData.dates);
    }, 150);
  });

  function syncLiveCustomHeaders() {
    try {
      const customRaw = localStorage.getItem(CUSTOM_HEADERS_KEY);
      if (customRaw) {
        const customHeaders = JSON.parse(customRaw);
        applyHeadersConfig(customHeaders);
      }
    } catch (e) {}
  }

  // Hydrate memory from local cache synchronously so initial paint is instant
  syncLiveCustomSets();
  syncLiveCustomGalleries();
  syncLiveCustomTestimonials();
  syncLiveCustomHeaders();
  syncLiveCustomTypography();
  updateSplashBookingTicker();
  updateSplashTravelTicker();

  let isCloudSyncing = false;
  async function syncAllSiteDataFromCloud() {
    if (isCloudSyncing) return;
    isCloudSyncing = true;

    try {
      await Promise.allSettled([
        // 1. Sets & Exhibition Order
        (async () => {
          try {
            const res = await fetch(getFirestoreDocUrl("sets_config"), { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
            if (!res.ok) return;
            const json = await res.json();
            if (!json || !json.fields || !json.fields.setsJson) return;
            const cloudData = JSON.parse(json.fields.setsJson.stringValue);
            if (cloudData && Array.isArray(cloudData.setsList)) {
              const currentSetsListJson = JSON.stringify(data.setsList || []);
              const newSetsListJson = JSON.stringify(cloudData.setsList || []);
              const isSetsListChanged = currentSetsListJson !== newSetsListJson;

              const currentSlug = (location.hash || "").replace(/^#\/?/, "").trim();
              let isCurrentSetGalleryChanged = false;
              if (currentSlug.startsWith("set/")) {
                const sSlug = currentSlug.replace(/^set\//, "");
                const curImagesJson = JSON.stringify((data.galleries && data.galleries[`set:${sSlug}`]) || []);
                const cloudImagesJson = JSON.stringify((cloudData.galleries && cloudData.galleries[`set:${sSlug}`]) || []);
                isCurrentSetGalleryChanged = curImagesJson !== cloudImagesJson;
              }

              const validSetKeys = new Set((cloudData.setsList || []).map(s => `set:${s.slug}`));
              const cleanGalleries = {};
              Object.entries(data.galleries || {}).forEach(([k, v]) => {
                if (!k.startsWith("set:") || validSetKeys.has(k)) {
                  cleanGalleries[k] = v;
                }
              });

              localStorage.setItem(CUSTOM_SETS_KEY, JSON.stringify(cloudData));
              data.setsList = cloudData.setsList;
              data.sets = cloudData.sets || {};
              data.galleries = { ...cleanGalleries, ...(cloudData.galleries || {}) };
              if (window.SITE_DATA) {
                window.SITE_DATA.setsList = cloudData.setsList;
                window.SITE_DATA.sets = data.sets;
                window.SITE_DATA.galleries = data.galleries;
              }

              // Update menu badge count if present
              const setsBadge = document.querySelector('[data-slug="sets"] .editorial-col__badge');
              if (setsBadge && Array.isArray(cloudData.setsList)) {
                setsBadge.textContent = `[${cloudData.setsList.length} galleries]`;
              }
            }
          } catch (e) {}
        })(),

        // 2. Main Portfolio & Series Galleries
        (async () => {
          try {
            const res = await fetch(getFirestoreDocUrl("main_galleries_config"), { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
            if (!res.ok) return;
            const json = await res.json();
            if (!json || !json.fields || !json.fields.galleriesJson) return;
            const cloudGalleries = JSON.parse(json.fields.galleriesJson.stringValue);
            if (cloudGalleries && typeof cloudGalleries === "object") {
              localStorage.setItem(CUSTOM_MAIN_GALLERIES_KEY, JSON.stringify(cloudGalleries));
              data.galleries = { ...(data.galleries || {}), ...cloudGalleries };
              if (window.SITE_DATA) {
                window.SITE_DATA.galleries = data.galleries;
              }
            }
          } catch (e) {}
        })(),

        // 3. Testimonials
        (async () => {
          try {
            const res = await fetch(getFirestoreDocUrl("testimonials_config"), { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
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
        })(),

        // 4. Splash Configuration
        (async () => {
          try {
            const res = await fetch(getFirestoreDocUrl("splash_config"), { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
            if (!res.ok) return;
            const json = await res.json();
            if (!json || !json.fields) return;
            const f = json.fields;
            const splashSettings = {
              landscape: (f.landscape && f.landscape.stringValue) || "photos/splash/001 Bree Colter 1.jpg",
              portrait: (f.portrait && f.portrait.stringValue) || "photos/portfolio/001 Nyekachi Douglas 2.jpg",
              titleSizeDesktop: parseInt(f.titleSizeDesktop && (f.titleSizeDesktop.integerValue || f.titleSizeDesktop.stringValue), 10) || 68,
              titleSizeMobile: parseInt(f.titleSizeMobile && (f.titleSizeMobile.integerValue || f.titleSizeMobile.stringValue), 10) || 44
            };
            if (f.travelDatesJson) {
              try { splashSettings.travelDates = JSON.parse(f.travelDatesJson.stringValue); } catch(e){}
            }
            if (f.travelEnabled || f.travelDatesJson) {
              const isEn = f.travelEnabled ? (f.travelEnabled.booleanValue !== undefined ? f.travelEnabled.booleanValue : (f.travelEnabled.stringValue === "true")) : true;
              splashSettings.travelEnabled = isEn;
              updateSplashTravelTicker(isEn, splashSettings.travelDates || (f.travelTicker && f.travelTicker.stringValue));
            }
            if (f.bookingTicker) {
              updateSplashBookingTicker(f.bookingTicker.stringValue);
            }
            if (splashSettings.landscape || splashSettings.portrait || splashSettings.titleSizeMobile || splashSettings.titleSizeDesktop) {
              localStorage.setItem(SPLASH_STORAGE_KEY, JSON.stringify(splashSettings));
              updateSplashImage();
            }
          } catch (e) {}
        })(),

        // 5. Information Page Headers & Booking Ticker
        (async () => {
          try {
            const currentSlug = (location.hash || "").replace(/^#\/?/, "").split("/")[0] || "portfolio";
            const infoSlugs = ["book-me", "about-me", "faq", "playlists", "testimonials", "cancellations", "client-portal"];

            // Prioritize active page if visiting an info page directly
            if (infoSlugs.includes(currentSlug)) {
              await syncPageHeader(currentSlug);
            }

            // Sync remaining pages individually in background
            const otherSlugs = infoSlugs.filter(s => s !== currentSlug);
            Promise.allSettled(otherSlugs.map(slug => syncPageHeader(slug)));
          } catch (e) {}
        })(),

        // 6. Site-Wide Typography Hierarchy
        (async () => {
          try {
            const res = await fetch(getFirestoreDocUrl("typography_config"), { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
            if (!res.ok) return;
            const json = await res.json();
            if (!json || !json.fields || !json.fields.typographyJson) return;
            const cloudTypo = JSON.parse(json.fields.typographyJson.stringValue);
            if (cloudTypo && typeof cloudTypo === "object") {
              try { localStorage.setItem(TYPOGRAPHY_STORAGE_KEY, JSON.stringify(cloudTypo)); } catch (e) {}
              applyTypographyToDOM(cloudTypo);
            }
          } catch (e) {}
        })(),

        // 7. Last-Minute Cancellations & Priority List
        (async () => {
          try {
            if (window.CANCELLATIONS_DATA && typeof window.CANCELLATIONS_DATA.syncCancellationsFromCloud === "function") {
              await window.CANCELLATIONS_DATA.syncCancellationsFromCloud();
              const currentSlug = (location.hash || "").replace(/^#\/?/, "").trim();
              if (currentSlug === "cancellations" || currentSlug === "cancellation" || currentSlug === "cancel") {
                if (typeof window.renderCancellationsPage === "function") {
                  window.renderCancellationsPage();
                }
              }
            }
          } catch (e) {}
        })(),

        // 8. Featured Sets for Index Menu
        (async () => {
          try {
            const res = await fetch(getFirestoreDocUrl("featured_sets_config"), { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
            if (!res.ok) return;
            const json = await res.json();
            if (!json || !json.fields || !json.fields.featuredSlugsJson) return;
            const slugs = JSON.parse(json.fields.featuredSlugsJson.stringValue);
            if (Array.isArray(slugs) && slugs.length > 0) {
              localStorage.setItem("kh_featured_sets", JSON.stringify(slugs));
            }
          } catch (e) {}
        })(),

        // 9. Custom Series Galleries for Index Menu
        (async () => {
          try {
            const res = await fetch(getFirestoreDocUrl("series_galleries_config"), { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
            if (!res.ok) return;
            const json = await res.json();
            if (!json || !json.fields || !json.fields.seriesListJson) return;
            const list = JSON.parse(json.fields.seriesListJson.stringValue);
            if (Array.isArray(list)) {
              localStorage.setItem("kh_custom_series_list", JSON.stringify(list));
            }
          } catch (e) {}
        })(),

        // 10. Gallery Custom Names
        (async () => {
          try {
            const res = await fetch(getFirestoreDocUrl("gallery_names_config"), { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
            if (!res.ok) return;
            const json = await res.json();
            if (!json || !json.fields || !json.fields.namesJson) return;
            const map = JSON.parse(json.fields.namesJson.stringValue);
            if (map && typeof map === "object") {
              localStorage.setItem("kh_gallery_custom_names", JSON.stringify(map));
            }
          } catch (e) {}
        })()
      ]);

      if (document.body.classList.contains("menu-active") || !location.hash || location.hash === "#" || location.hash === "#/") {
        buildMenu();
      }
    } catch (e) {
    } finally {
      isCloudSyncing = false;
    }
  }

  window.syncSiteDataFromCloud = syncAllSiteDataFromCloud;

  /* ---------------------------------------------------------
     Theme Management (Symbols Only: Sun ☼ / Moon ☾)
     --------------------------------------------------------- */
  const sunIcon = `
    <svg class="theme-icon" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  `;

  const moonIcon = `
    <svg class="theme-icon" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  `;

  const savedTheme = localStorage.getItem("kh-theme") || (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  setTheme(savedTheme);

  function updateSafariTaskbarTint(theme) {
    const themeColor = theme === "light" ? "#f5f3ef" : "#000000";
    const scheme = theme === "light" ? "light" : "dark";
    
    // Explicitly set background color on html and body so Safari live-sampler matches
    if (document.documentElement) {
      document.documentElement.style.colorScheme = scheme;
      document.documentElement.style.backgroundColor = themeColor;
    }
    if (document.body) {
      document.body.style.colorScheme = scheme;
      document.body.style.backgroundColor = themeColor;
    }

    // Update existing theme-color meta tags cleanly without DOM deletion thrashing
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    if (metas.length === 0) {
      const freshMeta = document.createElement("meta");
      freshMeta.name = "theme-color";
      freshMeta.content = themeColor;
      document.head.appendChild(freshMeta);
    } else {
      metas.forEach(m => {
        m.removeAttribute("media");
        m.setAttribute("content", themeColor);
      });
    }

    // Keep status bar style clean (default avoids iOS Safari forcing translucent gray)
    let statusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!statusMeta) {
      statusMeta = document.createElement("meta");
      statusMeta.name = "apple-mobile-web-app-status-bar-style";
      document.head.appendChild(statusMeta);
    }
    statusMeta.setAttribute("content", "default");
  }

  function setTheme(theme) {
    updateSafariTaskbarTint(theme);

    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      if (themeBtn) {
        themeBtn.innerHTML = `
          <span class="theme-icon-wrap">${moonIcon}</span>
          <span class="theme-toggle-label">Switch to Dark Mode</span>
        `;
        themeBtn.setAttribute("aria-label", "Switch to Dark Mode");
      }
      localStorage.setItem("kh-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
      if (themeBtn) {
        themeBtn.innerHTML = `
          <span class="theme-icon-wrap">${sunIcon}</span>
          <span class="theme-toggle-label">Switch to Light Mode</span>
        `;
        themeBtn.setAttribute("aria-label", "Switch to Light Mode");
      }
      localStorage.setItem("kh-theme", "dark");
    }
  }

  // Listen for system color scheme changes if user hasn't explicitly set a preference
  if (window.matchMedia) {
    const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleSystemThemeChange = (e) => {
      if (!localStorage.getItem("kh-theme")) {
        setTheme(e.matches ? "light" : "dark");
      }
    };
    if (colorSchemeQuery.addEventListener) {
      colorSchemeQuery.addEventListener("change", handleSystemThemeChange);
    } else if (colorSchemeQuery.addListener) {
      colorSchemeQuery.addListener(handleSystemThemeChange);
    }
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      setTheme(current === "light" ? "dark" : "light");
    });
  }

  /* ---------------------------------------------------------
     Initialize Splash Screen (Responsive Orientation Aware)
     - Landscape for Desktop
     - Portrait for Mobile
     - Fully customisable via Photographer Splash Manager
     --------------------------------------------------------- */
  function updateSplashImage() {
    if (!splashBg) return;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const isPortraitBg = isMobile || (window.innerHeight > window.innerWidth);
    let settings = null;
    try {
      const customRaw = localStorage.getItem(SPLASH_STORAGE_KEY);
      if (customRaw) settings = JSON.parse(customRaw);
    } catch (e) {}
    if (!settings && typeof window.getActiveSplashSettings === "function") {
      settings = window.getActiveSplashSettings();
    }

    const landscapeSrc = (settings && settings.landscape) || (data.site && (data.site.splashImageLandscape || data.site.splashImage)) || "photos/splash/001 Bree Colter 1.jpg";
    const portraitSrc = (settings && settings.portrait) || (data.site && data.site.splashImagePortrait) || "photos/portfolio/001 Nyekachi Douglas 2.jpg";
    const targetSrc = isPortraitBg ? portraitSrc : landscapeSrc;
    splashBg.style.backgroundImage = `url("${encodeURI(targetSrc)}")`;

    const desktopSize = (settings && parseInt(settings.titleSizeDesktop, 10)) || 68;
    const mobileSize = (settings && parseInt(settings.titleSizeMobile, 10)) || 44;
    document.documentElement.style.setProperty("--splash-title-size-desktop", `${desktopSize}px`);
    document.documentElement.style.setProperty("--splash-title-size-mobile", `${mobileSize}px`);

    const titleEl = document.querySelector(".splash__title");
    if (titleEl) {
      const activeSize = isMobile ? mobileSize : desktopSize;
      titleEl.style.setProperty("font-size", `${activeSize}px`, "important");
    }
  }

  window.updateSplashImage = updateSplashImage;

  updateSplashImage();

  const splashMql = window.matchMedia("(max-width: 768px)");
  if (splashMql.addEventListener) {
    splashMql.addEventListener("change", updateSplashImage);
  } else if (splashMql.addListener) {
    splashMql.addListener(updateSplashImage);
  }
  window.addEventListener("resize", updateSplashImage);

  function hideSplash() {
    splash.classList.add("is-hidden");
    document.body.classList.add("site-active");
  }

  function showSplash() {
    updateSplashImage();
    splash.classList.remove("is-hidden");
    document.body.classList.remove("site-active");
    // Replay the title & banner animations each time splash is shown
    const titleWrap = splash.querySelector(".splash__title-wrap");
    const banner = splash.querySelector(".splash__banner");
    [titleWrap, banner].forEach(el => {
      if (el) {
        el.style.animation = "none";
        void el.offsetWidth;
        el.style.animation = "";
      }
    });
    updateSplashBookingTicker();
    updateSplashTravelTicker();
  }

  function enterPortfolio() {
    location.hash = "#/portfolio";
  }

  if (enterBtn) {
    enterBtn.addEventListener("click", enterPortfolio);
    enterBtn.addEventListener("touchend", (e) => {
      e.preventDefault();
      enterPortfolio();
    });
  }
  if (splash) {
    splash.addEventListener("click", (e) => {
      if (e.target.closest("#menu-btn") || e.target.closest("#side-menu") || e.target.closest("#splash-booking-ticker") || e.target.closest("#splash-travel-ticker")) return;
      enterPortfolio();
    });
  }

  // Desktop Mouse Wheel & Trackpad scroll on splash screen enters portfolio
  window.addEventListener("wheel", (e) => {
    if (!document.body.classList.contains("site-active") && splash && !splash.classList.contains("is-hidden")) {
      // Downward scroll (deltaY > 5 or standard mouse wheel downward notch)
      if (e.deltaY > 5 || (e.wheelDeltaY && e.wheelDeltaY < -5)) {
        enterPortfolio();
      }
    }
  }, { passive: true });

  const splashBookingTicker = document.getElementById("splash-booking-ticker");
  if (splashBookingTicker) {
    const handleTickerNav = (e) => {
      e.preventDefault();
      e.stopPropagation();
      location.hash = "#/book-me";
    };
    splashBookingTicker.addEventListener("click", handleTickerNav);
    splashBookingTicker.addEventListener("touchend", handleTickerNav);
  }

  const splashTravelTicker = document.getElementById("splash-travel-ticker");
  if (splashTravelTicker) {
    const handleTravelNav = (e) => {
      e.preventDefault();
      e.stopPropagation();
      location.hash = "#/book-me";
    };
    splashTravelTicker.addEventListener("click", handleTravelNav);
    splashTravelTicker.addEventListener("touchend", handleTravelNav);
  }

  /* ---------------------------------------------------------
     Build Fullscreen Editorial Navigation Menu (4 Columns with Flipping Thumbnails)
     --------------------------------------------------------- */
  function buildMenu() {
    sideNavContent.innerHTML = "";

    const cleanSlug = (path) => path.replace(/^\//, "").replace(/^\d+-/, "");

    // Helper to get image list for any gallery/item (Prioritises set exhibition heroes)
    function getItemImages(slug) {
      const clean = slug.replace(/^\d+-/, "");
      if (clean.startsWith("set/") || clean.startsWith("sets/")) {
        const setName = clean.replace(/^sets?\//, "");
        let heroImg = "";
        let customSets = null;
        try {
          const raw = localStorage.getItem("kh_custom_sets_data");
          if (raw) customSets = JSON.parse(raw);
        } catch (e) {}

        if (customSets && Array.isArray(customSets.setsList)) {
          const found = customSets.setsList.find(s => s.slug === setName);
          if (found && found.hero) heroImg = found.hero;
        }
        if (!heroImg && data.sets && data.sets[setName] && data.sets[setName].hero) {
          heroImg = data.sets[setName].hero;
        }
        if (!heroImg && Array.isArray(data.setsList)) {
          const found = data.setsList.find(s => s.slug === setName);
          if (found && found.hero) heroImg = found.hero;
        }

        const fromGal = data.galleries && (data.galleries[`set:${setName}`] || data.galleries[`set/${setName}`]);
        const galImages = (fromGal && fromGal.length)
          ? fromGal.map(img => (typeof img === "string" ? img : img.src)).filter(Boolean)
          : [];

        if (heroImg) {
          const remaining = galImages.filter(src => src !== heroImg);
          return [heroImg, ...remaining];
        }
        if (galImages.length) {
          return galImages;
        }
      }
      const direct = (data.galleries && (data.galleries[slug] || data.galleries[clean])) || [];
      if (direct.length) {
        return direct.map(img => (typeof img === "string" ? img : img.src)).filter(Boolean);
      }
      if (clean === "sets") {
        const fromSets = (data.setsList || []).map(s => s.hero).filter(Boolean);
        if (fromSets.length) return fromSets;
      }
      if (clean === "book-me") {
        return [
          "photos/book-me/001.jpg",
          "photos/studio/011 Amrita 1.jpg",
          "photos/portfolio/001 Nyekachi Douglas 2.jpg",
          "photos/portfolio/004 Aashna 1.jpg"
        ];
      }
      if (clean === "about-me") {
        return [
          "photos/contact/2.jpg",
          "photos/contact/DSCF8633.jpg",
          "photos/studio/011 Amrita 1.jpg",
          "photos/portfolio/001 Nyekachi Douglas 2.jpg"
        ];
      }
      if (clean === "testimonials") {
        return [
          "photos/portfolio/004 Aashna 1.jpg",
          "photos/portfolio/002 Tara Wagner 1.jpg",
          "photos/portfolio/001 Nyekachi Douglas 2.jpg"
        ];
      }
      if (clean === "faq") {
        return [
          "photos/portfolio/002 Tara Wagner 1.jpg",
          "photos/studio/001 Bree Colter 1.jpg"
        ];
      }
      if (clean === "playlists") {
        return [
          "photos/playlists/studio one.jpg",
          "photos/playlists/editing one.jpg",
          "photos/playlists/studio two.jpg",
          "photos/playlists/editing two.jpg"
        ];
      }
      if (clean === "cancellations" || clean === "priority-list" || clean === "short-notice-bookings" || clean === "short-notice") {
        return [
          "photos/faq/Tara Wagner 1.jpg",
          "photos/book-me/001.jpg",
          "photos/studio/011 Amrita 1.jpg"
        ];
      }
      return [];
    }

    function getNineSetsHeroes() {
      let list = [];
      let customSets = null;
      try {
        const raw = localStorage.getItem("kh_custom_sets_data");
        if (raw) customSets = JSON.parse(raw);
      } catch (e) {}

      if (customSets && Array.isArray(customSets.setsList) && customSets.setsList.length) {
        list = customSets.setsList.map(s => s.hero).filter(Boolean);
      } else if (Array.isArray(data.setsList) && data.setsList.length) {
        list = data.setsList.map(s => s.hero).filter(Boolean);
      } else if (data.sets) {
        list = Object.values(data.sets).map(s => s.hero).filter(Boolean);
      }

      const heroes = [...new Set(list)];
      return heroes.slice(0, 9);
    }

    function getFeaturedSetsItems() {
      let featuredSlugs = [];
      try {
        const raw = localStorage.getItem("kh_featured_sets");
        if (raw) {
          featuredSlugs = JSON.parse(raw);
        }
      } catch (e) {}

      if (!Array.isArray(featuredSlugs) || featuredSlugs.length === 0) {
        featuredSlugs = ["bree", "asha", "diana"];
      }

      const availableSets = (data.setsList && data.setsList.length) ? data.setsList : [];
      const items = [];

      featuredSlugs.forEach(slug => {
        const set = availableSets.find(s => s.slug === slug) || (data.sets && data.sets[slug]) || null;
        if (set) {
          items.push({
            title: set.name || set.title || slug,
            path: `/set/${slug}`,
            badge: ""
          });
        }
      });
      return items;
    }

    function getGalleryDisplayName(key, fallback) {
      try {
        const raw = localStorage.getItem("kh_gallery_custom_names");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed[key]) return parsed[key];
        }
      } catch (e) {}
      return fallback;
    }

    function getSortKey(str) {
      return (str || "")
        .trim()
        .toLowerCase()
        .replace(/^(the|a|an)\s+/i, "")
        .trim();
    }

    function getSeriesGalleriesItems() {
      const core = [
        { title: getGalleryDisplayName("detail", "detail"), path: "/13740836-detail", key: "detail" },
        { title: getGalleryDisplayName("grids", "grids"), path: "/grids", key: "grids" },
        { title: getGalleryDisplayName("smiling", "smiling"), path: "/smiling", key: "smiling" }
      ];

      let customSeries = [];
      try {
        const raw = localStorage.getItem("kh_custom_series_list");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) customSeries = parsed;
        }
      } catch (e) {}

      const map = new Map();
      core.forEach(s => map.set(s.key, s));
      customSeries.forEach(s => {
        if (s && s.title && s.path) {
          const key = s.slug || s.key || s.title.toLowerCase().trim();
          const displayName = getGalleryDisplayName(key, s.title);
          map.set(key, {
            ...s,
            title: displayName
          });
        }
      });

      // Natural alphabetical sort ignoring leading articles ("the", "a", "an")
      const list = Array.from(map.values());
      list.sort((a, b) => getSortKey(a.title).localeCompare(getSortKey(b.title)));
      return list;
    }

    const setsCount = (data.setsList && data.setsList.length) || (data.sets ? Object.keys(data.sets).length : 17);
    const featuredItems = getFeaturedSetsItems();
    const seriesItems = getSeriesGalleriesItems();

    const columns = [
      {
        title: "01 · portraiture",
        items: [
          { title: "beauty", path: "/beauty" },
          { title: "black and white", path: "/black-and-white" },
          { title: "colour", path: "/colour" },
          { title: "interior", path: "/interior" },
          { title: "lingerie", path: "/lingerie" },
          { title: "location", path: "/location" },
          { title: "studio", path: "/studio" }
        ]
      },
      {
        title: "02 · sets",
        items: [
          { title: "all sets", path: "/sets", badge: `${setsCount} galleries`, isAllSets: true, hasTrailingDash: true },
          ...featuredItems
        ]
      },
      {
        title: "03 · series",
        items: seriesItems
      },
      {
        title: "04 · information",
        isInfo: true,
        items: [
          { title: "book me", path: "/book-me" },
          { title: "about me", path: "/about-me" },
          { title: "short notice bookings", path: "/cancellations" },
          { title: "client portal", path: "/client-portal" },
          { title: "testimonials", path: "/testimonials" },
          { title: "faq", path: "/faq" },
          { title: "playlists", path: "/playlists" }
        ]
      }
    ];

    columns.forEach(col => {
      const colEl = document.createElement("div");
      colEl.className = col.isInfo ? "editorial-col editorial-col--info" : "editorial-col";

      const titleEl = document.createElement("div");
      titleEl.className = "editorial-col__title";
      titleEl.textContent = col.title;
      colEl.appendChild(titleEl);

      const listEl = document.createElement("ul");
      listEl.className = "editorial-col__list";

      col.items.forEach(item => {
        const li = document.createElement("li");
        li.className = "editorial-col__item";
        const a = document.createElement("a");
        const slug = cleanSlug(item.path);
        a.href = `#/${slug}`;
        a.dataset.slug = slug;

        if (col.isInfo) {
          a.className = "editorial-col__link editorial-col__link--dash";
          a.innerHTML = `
            <span class="editorial-dash" aria-hidden="true">&mdash;</span>
            <span class="editorial-link-title">${item.title}</span>
          `;
        } else if (item.isAllSets) {
          a.className = "editorial-col__link editorial-col__link--all-sets";
          const nineHeroes = getNineSetsHeroes();

          a.innerHTML = `
            <div class="editorial-thumb-wrap editorial-thumb-wrap--grid9" aria-hidden="true">
              <div class="editorial-thumb-grid9">
                ${nineHeroes.map(h => `<img src="${h}" alt="" loading="lazy">`).join("")}
              </div>
            </div>
            <div class="editorial-link-content">
              <span class="editorial-link-title">${item.title}</span>
              ${item.badge ? `<span class="editorial-col__badge">[${item.badge}]</span>` : ""}
            </div>
          `;
        } else {
          a.className = "editorial-col__link";
          const images = getItemImages(slug);
          const firstImg = images[0] || "";

          a.innerHTML = `
            <div class="editorial-thumb-wrap">
              ${firstImg ? `<img src="${firstImg}" alt="${item.title}" class="editorial-thumb-img" loading="lazy">` : `<div class="editorial-thumb-placeholder"></div>`}
            </div>
            <div class="editorial-link-content">
              <span class="editorial-link-title">${item.title}</span>
              ${item.badge ? `<span class="editorial-col__badge">[${item.badge}]</span>` : ""}
            </div>
          `;

          // Interactive hover: flips through the gallery's images
          if (images.length > 1) {
            let cycleIdx = 0;
            let intervalId = null;
            const imgEl = a.querySelector(".editorial-thumb-img");

            a.addEventListener("mouseenter", () => {
              if (!imgEl) return;
              cycleIdx = 0;
              clearInterval(intervalId);
              intervalId = setInterval(() => {
                cycleIdx = (cycleIdx + 1) % images.length;
                imgEl.classList.add("is-flipping");
                setTimeout(() => {
                  imgEl.src = images[cycleIdx];
                  imgEl.classList.remove("is-flipping");
                }, 140);
              }, 640);
            });

            a.addEventListener("mouseleave", () => {
              clearInterval(intervalId);
              if (imgEl && images[0]) {
                imgEl.src = images[0];
                imgEl.classList.remove("is-flipping");
              }
            });
          }
        }

        li.appendChild(a);
        listEl.appendChild(li);

        if (item.hasTrailingDash) {
          const dashLi = document.createElement("li");
          dashLi.className = "editorial-col__sets-divider";
          dashLi.setAttribute("aria-hidden", "true");
          dashLi.innerHTML = `<span class="editorial-sets-dash">&mdash;</span>`;
          listEl.appendChild(dashLi);
        }
      });

      colEl.appendChild(listEl);
      sideNavContent.appendChild(colEl);
    });

    // Social links in menu footer
    sideNavSocials.innerHTML = "";
    (data.site.socials || []).slice(0, 2).forEach(s => {
      const a = document.createElement("a");
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.innerHTML = `${s.title.toLowerCase()} &nearr;`;
      sideNavSocials.appendChild(a);
    });
  }

  function toggleMenu(force) {
    const nextState = typeof force === "boolean" ? force : !isNavOpen;
    if (nextState === isNavOpen) return;
    isNavOpen = nextState;

    if (isNavOpen) {
      document.body.classList.add("menu-open");
      if (sideMenu) {
        sideMenu.style.transform = "";
        sideMenu.style.transition = "";
      }
      sideMenu.classList.add("is-active");
      menuBackdrop.classList.add("is-active");
      menuOpenedAt = Date.now();
      menuCloseScrollAccum = 0;
      setHeaderHiddenMobile(false);
    } else {
      // Closing: slide UP smoothly into the ceiling
      sideMenu.classList.remove("is-active");
      menuBackdrop.classList.remove("is-active");
      if (sideMenu) {
        sideMenu.style.transform = "";
        sideMenu.style.transition = "";
      }

      // Keep body scroll locked until slide-up animation completes to prevent jumping
      setTimeout(() => {
        if (!isNavOpen) {
          document.body.classList.remove("menu-open");
        }
      }, 480);

      if (typeof resetPullAnimation === "function") {
        resetPullAnimation();
      }
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (scrollY <= 0 && typeof resetTopScrollLocks === "function") {
        resetTopScrollLocks();
      }
    }
  }

  menuBtn.addEventListener("click", () => toggleMenu(true));
  menuCloseBtn.addEventListener("click", () => toggleMenu(false));
  menuBackdrop.addEventListener("click", () => toggleMenu(false));

  sideMenu.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a && a.getAttribute("href") && a.getAttribute("href").startsWith("#/")) {
      const targetHash = a.getAttribute("href");
      toggleMenu(false);
      // Wait for slide-up before route scroll
      setTimeout(() => {
        const currentHash = location.hash || "#/portfolio";
        if (targetHash === "#/portfolio" && (currentHash === "#/portfolio" || currentHash === "#/" || !location.hash)) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 260);
    }
  });

  /* ---------------------------------------------------------
     Lightbox Viewer
     --------------------------------------------------------- */
  function openLightbox(images, index) {
    currentGallery = images;
    currentImageIdx = index;
    updateLightbox();
    lightbox.classList.add("is-open");
    document.body.classList.add("viewer-open");
  }

  window.openLightbox = openLightbox;
  window.closeLightbox = closeLightbox;

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("viewer-open");
    const hadProofing = !!activeProofingContext;
    activeProofingContext = null;
    if (lightboxProofingBar) lightboxProofingBar.style.display = "none";
    lightboxImg.className = "lightbox__img";
    const lbCap = document.getElementById("lightbox-caption");
    if (lbCap) {
      lbCap.textContent = "";
      lbCap.style.display = "none";
    }
    if (hadProofing && window.location.hash.includes("/review")) {
      if (typeof window.onReviewLightboxClosed === "function") {
        window.onReviewLightboxClosed();
      }
    }
  }

  function updateLightbox() {
    const item = currentGallery[currentImageIdx];
    if (!item) return;

    // Check if proofing mode is active
    if (activeProofingContext && activeProofingContext.shoot) {
      const shoot = activeProofingContext.shoot;
      const fn = item.filename;
      const imgObj = shoot.images ? shoot.images.find(i => i.filename === fn) : null;
      let availableTones = ["colour"];
      if (imgObj && imgObj.versions && typeof imgObj.versions === "object") {
        const vKeys = Object.keys(imgObj.versions).filter(k => !!imgObj.versions[k]);
        if (vKeys.length > 0) availableTones = vKeys;
      }

      let currentTone = item.tone || "colour";
      if (!availableTones.includes(currentTone)) {
        currentTone = availableTones[0];
        item.tone = currentTone;
      }

      const isToneSelFn = activeProofingContext.isToneSelected || (() => false);
      const isSelected = isToneSelFn(fn, currentTone);
      const isRejFn = activeProofingContext.isImageRejected || (() => false);
      const isImageRejected = isRejFn(fn);

      // Resolve tone image source (pure, untouched files)
      let imgSrc = item.src;
      if (typeof window.resolveClientPortalImageSrc === "function" && imgObj) {
        imgSrc = window.resolveClientPortalImageSrc(imgObj, currentTone);
      } else if (imgObj && imgObj.versions && imgObj.versions[currentTone]) {
        imgSrc = imgObj.versions[currentTone];
      } else if (imgObj && imgObj.versions && imgObj.versions["colour"]) {
        imgSrc = imgObj.versions["colour"];
      }
      lightboxImg.src = imgSrc;
      lightboxImg.className = `lightbox__img ${isImageRejected ? "is-rejected" : ""}`;

      const fnTag = fn ? ` · ${fn}` : "";
      lightboxCounter.textContent = `${String(currentImageIdx + 1).padStart(2, '0')} / ${String(currentGallery.length).padStart(2, '0')}${fnTag}`;

      const getToneLab = window.getClientPortalToneLabel || (t => t);
      const getToneSh = window.getClientPortalToneShort || (t => t.toUpperCase());
      const toneDisplayName = getToneLab(currentTone, shoot);

      const currentNote = activeProofingContext.getImageNote ? activeProofingContext.getImageNote(fn) : "";
      const hasAnySelectedOnImage = availableTones.some(t => isToneSelFn(fn, t));

      const toneControlHtml = availableTones.length > 1 ? `
        <div class="lb-tone-group">
          ${availableTones.map(tKey => {
            const isSel = isToneSelFn(fn, tKey);
            const shortLab = getToneSh(tKey, shoot);
            return `
              <button type="button" class="lb-tone-btn ${currentTone === tKey ? "is-active" : ""}" data-tone="${tKey}">
                ${shortLab}${isSel ? " &#10003;" : ""}
              </button>
            `;
          }).join("")}
        </div>
      ` : `
        <span class="lb-single-tone-tag">${toneDisplayName}</span>
      `;

      // Render proofing bar
      if (lightboxProofingBar) {
        lightboxProofingBar.style.display = "flex";
        lightboxProofingBar.innerHTML = `
          ${toneControlHtml}

          <!-- Slide-out Note Button (visible when image is selected) -->
          <button 
            type="button" 
            class="lb-note-btn ${hasAnySelectedOnImage ? "is-visible" : ""} ${currentNote ? "has-note" : ""}" 
            id="lb-note-toggle" 
            title="${currentNote ? `Note: "${currentNote}"` : "Leave editing note (optional)"}"
            aria-label="Leave editing note"
          >
            <span class="note-pencil-icon">&#9998;</span>
            <span class="lb-note-label">${currentNote ? "Note added" : "Leave note"}</span>
          </button>

          <!-- Reject Button to reject/restore image -->
          <button 
            type="button" 
            class="lb-reject-btn ${isImageRejected ? "is-active" : ""}" 
            id="lb-reject-toggle" 
            title="${isImageRejected ? "Rejected (tap to restore photo)" : "Tap to reject photo"}"
            aria-label="${isImageRejected ? "Restore photo" : "Reject photo"}"
          >
            <svg class="reject-icon" viewBox="0 0 24 24" width="16" height="16">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></line>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></line>
            </svg>
          </button>

          <!-- Heart Button to like/select active version -->
          <button 
            type="button" 
            class="lb-heart-btn ${isSelected ? "is-active" : ""}" 
            id="lb-heart-toggle" 
            title="${isSelected ? "Selected (tap to remove)" : "Tap to select photo"}"
            aria-label="${isSelected ? "Remove from selections" : "Select photo"}"
          >
            <svg class="heart-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="${isSelected ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
            </svg>
          </button>
        `;

        // Bind tone buttons
        lightboxProofingBar.querySelectorAll(".lb-tone-btn").forEach(btn => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const newTone = btn.dataset.tone;
            item.tone = newTone;
            if (activeProofingContext.setItemTone) {
              activeProofingContext.setItemTone(fn, newTone);
            }
            updateLightbox();
          });
        });

        // Bind reject button
        const rejectBtn = lightboxProofingBar.querySelector("#lb-reject-toggle");
        if (rejectBtn) {
          let lastRejectTap = 0;
          const onRejectToggle = (e) => {
            const now = Date.now();
            if (now - lastRejectTap < 350) return;
            lastRejectTap = now;
            e.preventDefault();
            e.stopPropagation();
            if (activeProofingContext && activeProofingContext.toggleReject) {
              activeProofingContext.toggleReject(fn);
            }
            updateLightbox();
          };
          rejectBtn.addEventListener("click", onRejectToggle);
          rejectBtn.addEventListener("touchend", onRejectToggle);
        }

        // Bind heart selection toggle (debounced to support touch and click without double-toggling)
        const heartBtn = lightboxProofingBar.querySelector("#lb-heart-toggle");
        if (heartBtn) {
          let lastHeartTap = 0;
          const onHeartToggle = (e) => {
            const now = Date.now();
            if (now - lastHeartTap < 350) return;
            lastHeartTap = now;
            e.preventDefault();
            e.stopPropagation();
            if (activeProofingContext && activeProofingContext.toggleSelect) {
              activeProofingContext.toggleSelect(fn, item.tone || "colour");
            }
            updateLightbox();
          };
          heartBtn.addEventListener("click", onHeartToggle);
          heartBtn.addEventListener("touchend", onHeartToggle);
        }

        // Bind note toggle
        const noteBtn = lightboxProofingBar.querySelector("#lb-note-toggle");
        if (noteBtn) {
          noteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (activeProofingContext.openNoteModal) {
              activeProofingContext.openNoteModal(fn, () => {
                updateLightbox();
              });
            } else {
              const existing = activeProofingContext.getImageNote ? activeProofingContext.getImageNote(fn) : "";
              const userNote = prompt(`Editing note for ${fn} (e.g. remove flyaways, crop closer):`, existing);
              if (userNote !== null) {
                if (activeProofingContext.setImageNote) {
                  activeProofingContext.setImageNote(fn, userNote);
                }
                updateLightbox();
              }
            }
          });
        }
      }
      return;
    }

    if (lightboxProofingBar) lightboxProofingBar.style.display = "none";
    lightboxImg.className = "lightbox__img";
    lightboxImg.style.opacity = "0.2";
    lightboxImg.onload = () => {
      lightboxImg.style.opacity = "1";
    };
    lightboxImg.src = item.src;
    if (lightboxImg.complete) {
      lightboxImg.style.opacity = "1";
    }
    
    // Clean counter: 01 / 18 (NO raw filenames)
    lightboxCounter.textContent = `${String(currentImageIdx + 1).padStart(2, '0')} / ${String(currentGallery.length).padStart(2, '0')}`;

    // Clean Caption: Model name (and Movie title if present), otherwise completely blank
    let lbCaption = document.getElementById("lightbox-caption");
    if (!lbCaption) {
      lbCaption = document.createElement("div");
      lbCaption.id = "lightbox-caption";
      lbCaption.className = "lightbox__caption";
      const footer = document.getElementById("lightbox-footer");
      if (footer) footer.prepend(lbCaption);
      else lightbox.appendChild(lbCaption);
    }
    const cleanModel = (item.model || "").trim();
    const cleanMovie = (item.movie || "").trim();
    if (cleanModel || cleanMovie) {
      lbCaption.innerHTML = `
        ${cleanModel ? `<span class="caption-model">${cleanModel}</span>` : ""}
        ${cleanModel && cleanMovie ? ` <span class="caption-sep">&mdash;</span> ` : ""}
        ${cleanMovie ? `<span class="caption-movie"><em>${cleanMovie}</em></span>` : ""}
      `;
      lbCaption.style.display = "block";
    } else {
      lbCaption.textContent = "";
      lbCaption.style.display = "none";
    }
  }

  window.openLightboxWithSelection = function(shoot, filename, currentTone, setItemTone, toggleSelect, selectedMap, isToneSelected, getImageNote, setImageNote, openNoteModal, getImageActiveTone, customImageList, toggleReject, isImageRejected) {
    activeProofingContext = { shoot, setItemTone, toggleSelect, selectedMap, isToneSelected, getImageNote, setImageNote, openNoteModal, getImageActiveTone, toggleReject, isImageRejected };
    let images;
    if (customImageList && Array.isArray(customImageList) && customImageList.length > 0) {
      images = customImageList.map(item => {
        const fn = item.filename;
        const tone = item.tone || (getImageActiveTone ? getImageActiveTone(fn) : "colour") || "colour";
        let src = item.src || "";
        const imgObj = shoot ? shoot.images.find(i => i.filename === fn) : null;
        if (imgObj && imgObj.versions && imgObj.versions[tone]) src = imgObj.versions[tone];
        else if (imgObj && imgObj.versions && imgObj.versions["colour"]) src = imgObj.versions["colour"];
        return { src: src, filename: fn, tone: tone };
      });
    } else {
      images = (shoot.images || []).map(i => {
        let avail = ["colour"];
        if (i.versions && typeof i.versions === "object") {
          const vk = Object.keys(i.versions).filter(k => !!i.versions[k]);
          if (vk.length > 0) avail = vk;
        }
        let tone = (getImageActiveTone ? getImageActiveTone(i.filename) : (i.filename === filename ? currentTone : "colour")) || "colour";
        if (!avail.includes(tone)) tone = avail[0];
        let src = i.src || "";
        if (i.versions && i.versions[tone]) src = i.versions[tone];
        else if (i.versions && i.versions["colour"]) src = i.versions["colour"];
        return { src: src, filename: i.filename, tone: tone };
      });
    }

    let idx = -1;
    if (customImageList && Array.isArray(customImageList)) {
      idx = images.findIndex(i => i.filename === filename && i.tone === currentTone);
    }
    if (idx < 0) {
      idx = images.findIndex(i => i.filename === filename);
    }
    openLightbox(images, idx >= 0 ? idx : 0);
  };

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxClose.addEventListener("touchend", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeLightbox();
  });
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
  lightboxPrev.addEventListener("click", () => {
    currentImageIdx = (currentImageIdx - 1 + currentGallery.length) % currentGallery.length;
    updateLightbox();
  });
  lightboxNext.addEventListener("click", () => {
    currentImageIdx = (currentImageIdx + 1) % currentGallery.length;
    updateLightbox();
  });

  // Touch Swipe Navigation for Lightbox (Mobile & Tablet)
  let lbTouchStartX = 0;
  let lbTouchStartY = 0;
  let lbTouchEndX = 0;
  let lbTouchEndY = 0;
  let lbTouchStartTime = 0;

  lightbox.addEventListener("touchstart", (e) => {
    if (e.touches && e.touches.length === 1) {
      lbTouchStartX = e.touches[0].clientX;
      lbTouchStartY = e.touches[0].clientY;
      lbTouchEndX = lbTouchStartX;
      lbTouchEndY = lbTouchStartY;
      lbTouchStartTime = Date.now();
    }
  }, { passive: true });

  lightbox.addEventListener("touchmove", (e) => {
    if (e.touches && e.touches.length === 1) {
      lbTouchEndX = e.touches[0].clientX;
      lbTouchEndY = e.touches[0].clientY;
    }
  }, { passive: true });

  lightbox.addEventListener("touchend", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    // Prevent swipe conflict when touching interactive buttons or modal
    if (e.target && e.target.closest && (e.target.closest(".lightbox__proofing-bar") || e.target.closest(".lightbox__close") || e.target.closest("#portal-quick-note-modal"))) {
      return;
    }

    const deltaX = lbTouchEndX - lbTouchStartX;
    const deltaY = lbTouchEndY - lbTouchStartY;
    const elapsedTime = Date.now() - lbTouchStartTime;

    // Horizontal Swipe (Swipe left = next, swipe right = previous)
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) {
        currentImageIdx = (currentImageIdx + 1) % currentGallery.length;
        updateLightbox();
      } else {
        currentImageIdx = (currentImageIdx - 1 + currentGallery.length) % currentGallery.length;
        updateLightbox();
      }
    }
  }, { passive: true });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (lightbox.classList.contains("is-open")) {
        closeLightbox();
        return;
      }
      if (isNavOpen) {
        toggleMenu(false);
        return;
      }
    }
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "ArrowLeft") {
      currentImageIdx = (currentImageIdx - 1 + currentGallery.length) % currentGallery.length;
      updateLightbox();
    }
    if (e.key === "ArrowRight") {
      currentImageIdx = (currentImageIdx + 1) % currentGallery.length;
      updateLightbox();
    }
  });

  /* ---------------------------------------------------------
     Render Sets Page (Dual Column Editorial Grid)
     --------------------------------------------------------- */
  function renderSetsIndex() {
    syncLiveCustomSets();
    const rawSets = data.setsList || [];
    const sets = rawSets.map(item => {
      const live = (data.sets && data.sets[item.slug]) || {};
      return { ...item, ...live };
    });
    if (!sets.length) {
      main.innerHTML = `<div class="article-page"><p style="text-align:center; padding: 100px 0;">No sets available.</p></div>`;
      return;
    }

    const wrapper = document.createElement("div");

    // Sets Header
    const header = document.createElement("div");
    header.className = "sets-page-header";
    header.innerHTML = `<h1 class="sets-page-title">sets</h1>`;
    wrapper.appendChild(header);

    // Helpers to parse location & year
    const parseMeta = (desc) => {
      if (!desc) return { loc: "", year: "", combined: "" };
      let lines = (desc || "").split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length === 1) {
        if (lines[0].includes("·")) {
          lines = lines[0].split("·").map(l => l.trim()).filter(Boolean);
        } else {
          const m = lines[0].match(/^(.*?)(?:,\s*|\s+)(\d{4})$/);
          if (m) lines = [m[1], m[2]];
        }
      }
      return {
        loc: lines[0] || "",
        year: lines[1] || "",
        combined: lines.join(" · ")
      };
    };

    // Dual Column Editorial Grid
    const grid = document.createElement("div");
    grid.className = "sets-v1";
    sets.forEach(set => {
      const meta = parseMeta(set.desc);
      const card = document.createElement("article");
      card.className = "set-card";
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "link");
      card.setAttribute("aria-label", `View exhibition set ${set.name}`);
      card.innerHTML = `
        <a href="#/set/${set.slug}" class="set-card__media" aria-label="View ${set.name} set" style="display:block; text-decoration:none;">
          <img src="${set.hero}" alt="${set.name}" loading="lazy">
          <div class="set-card__badge">view set</div>
        </a>
        <div class="set-card__footer">
          <h2 class="set-card__title"><a href="#/set/${set.slug}" style="text-decoration:none; color:inherit;">${set.name}</a></h2>
          <span class="set-card__info">${meta.combined}</span>
        </div>
      `;
      const navigateToSet = () => {
        sessionStorage.setItem("kh_set_referrer", JSON.stringify({ type: "sets", slug: "sets" }));
        location.hash = `#/set/${set.slug}`;
      };
      card.addEventListener("click", navigateToSet);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigateToSet();
        }
      });
      grid.appendChild(card);
    });
    wrapper.appendChild(grid);

    main.innerHTML = "";
    main.appendChild(wrapper);

    // Scroll reveal observer
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -4% 0px", threshold: 0.05 });

    wrapper.querySelectorAll(".set-card").forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------
     Render Set Individual Gallery
     --------------------------------------------------------- */
  function renderSetDetail(slug) {
    syncLiveCustomSets();
    const fromList = (data.setsList || []).find(s => s.slug === slug) || {};
    const fromSets = (data.sets && data.sets[slug]) || {};
    const set = { ...fromList, ...fromSets };
    const galleryKey = `set:${slug}`;
    const images = data.galleries[galleryKey] || [];

    const wrapper = document.createElement("div");

    // Check origin for conditional back button
    let referrer = null;
    try {
      referrer = JSON.parse(sessionStorage.getItem("kh_set_referrer"));
    } catch (e) {}

    const isFromGallery = referrer && referrer.type === "gallery" && referrer.slug && referrer.slug !== "sets";
    const backText = isFromGallery ? "← back to gallery" : "← back to sets";
    const backHref = isFromGallery ? `#/${referrer.slug}` : "#/sets";

    const header = document.createElement("div");
    header.className = "set-detail-header";
    header.innerHTML = `
      <a href="${backHref}" class="back-link">${backText}</a>
      <h1>${set.name || slug}</h1>
      ${set.desc ? `<p>${set.desc}</p>` : ""}
    `;

    const backLink = header.querySelector(".back-link");
    if (backLink && isFromGallery) {
      backLink.addEventListener("click", (e) => {
        e.preventDefault();
        sessionStorage.setItem("kh_scroll_to_image", String(referrer.imageIdx));
        location.hash = `#/${referrer.slug}`;
      });
    }

    wrapper.appendChild(header);

    if (!images || images.length === 0) {
      const emptyNotice = document.createElement("div");
      emptyNotice.className = "article-page";
      emptyNotice.style.cssText = "text-align: center; padding: 80px 20px 140px; color: var(--text-muted); font-size: 15px;";
      emptyNotice.innerHTML = `
        <p style="margin: 0 0 16px;">No photographs have been published in this exhibition set yet.</p>
        <a href="#/sets" class="back-link" style="display:inline-block; font-size:12px; letter-spacing:0.1em; text-transform:uppercase;">&larr; Return to All Sets</a>
      `;
      wrapper.appendChild(emptyNotice);
      main.innerHTML = "";
      main.appendChild(wrapper);
      return;
    }

    const container = document.createElement("div");
    container.className = "gallery-container";

    images.forEach((img, idx) => {
      const item = document.createElement("div");
      item.className = "gallery-item";
      
      const inner = document.createElement("div");
      inner.className = "gallery-item__inner";
      
      const imageEl = document.createElement("img");
      imageEl.src = img.src;
      if (img.w && img.h && Number(img.w) > 0 && Number(img.h) > 0) {
        imageEl.width = Number(img.w);
        imageEl.height = Number(img.h);
        imageEl.style.aspectRatio = `${img.w} / ${img.h}`;
      }
      imageEl.loading = idx < 2 ? "eager" : "lazy";
      imageEl.decoding = "async";
      imageEl.alt = img.model ? `${img.model}` : (img.title || `${set.name || "Set"} photo ${idx + 1}`);
      imageEl.onload = () => {
        if (!img.w || !img.h) {
          img.w = imageEl.naturalWidth;
          img.h = imageEl.naturalHeight;
          if (imageEl.naturalWidth && imageEl.naturalHeight) {
            imageEl.style.aspectRatio = `${imageEl.naturalWidth} / ${imageEl.naturalHeight}`;
          }
        }
      };

      inner.appendChild(imageEl);
      inner.addEventListener("click", () => openLightbox(images, idx));

      // Model & Movie caption if available
      const cleanModel = (img.model || "").trim();
      const cleanMovie = (img.movie || "").trim();
      if (cleanModel || cleanMovie) {
        const meta = document.createElement("div");
        meta.className = "gallery-item__cinematic-meta";
        meta.innerHTML = `
          ${cleanModel ? `<span class="cinematic-model">${cleanModel}</span>` : ""}
          ${cleanModel && cleanMovie ? `<span class="cinematic-divider">&mdash;</span>` : ""}
          ${cleanMovie ? `<span class="cinematic-movie"><em>${cleanMovie}</em></span>` : ""}
        `;
        inner.appendChild(meta);
      }

      item.appendChild(inner);
      container.appendChild(item);
    });

    wrapper.appendChild(container);
    main.innerHTML = "";
    main.appendChild(wrapper);

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "100px 0px 100px 0px", threshold: 0.01 });

    container.querySelectorAll(".gallery-item").forEach((el, idx) => {
      if (idx < 4) {
        el.classList.add("is-visible");
      } else {
        io.observe(el);
      }
    });
  }

  /* ---------------------------------------------------------
     Cinematic Opening Transition for The Blank Canvas Project
     --------------------------------------------------------- */
  function triggerCinematicApertureIntro(title) {
    const existing = document.getElementById("kh-cinema-intro");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "kh-cinema-intro";
    overlay.className = "kh-cinema-intro";
    overlay.innerHTML = `
      <div class="kh-cinema-bar kh-cinema-bar--top"></div>
      <div class="kh-cinema-slate">
        <div class="kh-cinema-slate__sup">A SERIES BY KORAY HUSSEIN</div>
        <div class="kh-cinema-slate__title">${title}</div>
        <div class="kh-cinema-slate__line"></div>
      </div>
      <div class="kh-cinema-bar kh-cinema-bar--bottom"></div>
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add("is-active");
      setTimeout(() => {
        overlay.classList.add("is-opening");
      }, 1700);
      setTimeout(() => {
        overlay.classList.add("is-completed");
        setTimeout(() => overlay.remove(), 400);
      }, 3100);
    });
  }

  /* ---------------------------------------------------------
     Render Standard Gallery Page
     --------------------------------------------------------- */
  function renderGallery(slug) {
    syncLiveCustomGalleries();
    const images = data.galleries[slug] || [];
    if (!images.length) {
      main.innerHTML = `<div class="article-page"><p style="text-align:center; padding: 100px 0;">No images in this gallery.</p></div>`;
      return;
    }

    const isBlankCanvas = typeof slug === "string" && slug.toLowerCase().includes("blank-canvas");
    if (isBlankCanvas) {
      triggerCinematicApertureIntro("THE BLANK CANVAS PROJECT");
    }

    const container = document.createElement("div");
    container.className = "gallery-container";

    images.forEach((img, idx) => {
      const item = document.createElement("div");
      item.className = "gallery-item";
      item.id = `gallery-item-${idx}`;
      
      const inner = document.createElement("div");
      inner.className = "gallery-item__inner";
      
      const imageEl = document.createElement("img");
      imageEl.src = img.src;
      if (img.w && img.h && Number(img.w) > 0 && Number(img.h) > 0) {
        imageEl.width = Number(img.w);
        imageEl.height = Number(img.h);
        imageEl.style.aspectRatio = `${img.w} / ${img.h}`;
      }
      imageEl.loading = idx < 2 ? "eager" : "lazy";
      imageEl.decoding = "async";
      imageEl.alt = img.model ? `${img.model}${img.movie ? ` - ${img.movie}` : ''}` : (img.title || img.filename || `Photo ${idx + 1}`);
      imageEl.onload = () => {
        if (!img.w || !img.h) {
          img.w = imageEl.naturalWidth;
          img.h = imageEl.naturalHeight;
          if (imageEl.naturalWidth && imageEl.naturalHeight) {
            imageEl.style.aspectRatio = `${imageEl.naturalWidth} / ${imageEl.naturalHeight}`;
          }
        }
      };

      inner.appendChild(imageEl);
      inner.addEventListener("click", () => openLightbox(images, idx));

      // Link to set ONLY if explicitly assigned (e.g. Asha, Annie, Sheyla, Fifi, Nyeka)
      const setSlug = img.setSlug || null;
      const setInfo = setSlug && ((data.sets && data.sets[setSlug]) || (data.setsList && data.setsList.find(s => s.slug === setSlug)));
      if (setSlug && setInfo) {
        const badge = document.createElement("a");
        badge.href = `#/set/${setSlug}`;
        badge.className = "gallery-item__badge";
        badge.setAttribute("aria-label", `View ${setInfo.name || setSlug} set`);
        badge.innerHTML = `<span>view set &rarr;</span>`;
        badge.addEventListener("click", (e) => {
          e.stopPropagation();
          sessionStorage.setItem("kh_set_referrer", JSON.stringify({
            type: "gallery",
            slug: slug,
            imageIdx: idx
          }));
          location.hash = `#/set/${setSlug}`;
        });
        inner.appendChild(badge);
      }

      // Model & Movie Captions (Editorial Presentation for Blank Canvas & Any Curated Photo)
      const cleanModel = (img.model || "").trim();
      const cleanMovie = (img.movie || "").trim();
      if (cleanModel || cleanMovie || isBlankCanvas) {
        if (cleanModel || cleanMovie) {
          const meta = document.createElement("div");
          meta.className = "gallery-item__cinematic-meta";
          meta.innerHTML = `
            ${cleanModel ? `<span class="cinematic-model">${cleanModel}</span>` : ""}
            ${cleanModel && cleanMovie ? `<span class="cinematic-divider">&mdash;</span>` : ""}
            ${cleanMovie ? `<span class="cinematic-movie"><em>${cleanMovie}</em></span>` : ""}
          `;
          inner.appendChild(meta);
        }
      }

      item.appendChild(inner);
      container.appendChild(item);
    });

    main.innerHTML = "";
    main.appendChild(container);

    // If returning from a set to the gallery, scroll smoothly back to the clicked image
    const scrollToIdx = sessionStorage.getItem("kh_scroll_to_image");
    if (scrollToIdx !== null) {
      sessionStorage.removeItem("kh_scroll_to_image");
      const idxNum = parseInt(scrollToIdx, 10);
      requestAnimationFrame(() => {
        setTimeout(() => {
          const targetEl = document.getElementById(`gallery-item-${idxNum}`);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 120);
      });
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "100px 0px 100px 0px", threshold: 0.01 });

    container.querySelectorAll(".gallery-item").forEach((el, idx) => {
      if (idx < 4) {
        el.classList.add("is-visible");
      } else {
        io.observe(el);
      }
    });
  }

  /* ---------------------------------------------------------
     Contact & Booking Form Email Delivery
     Directly sends to contact@korayhussein.com via FormSubmit AJAX
     with graceful mailto fallback
     --------------------------------------------------------- */
  function showFormNotice(formEl, type, messageHtml) {
    let notice = formEl.querySelector(".form-status-notice");
    if (!notice) {
      notice = document.createElement("div");
      notice.className = "form-status-notice";
      formEl.appendChild(notice);
    }
    notice.className = `form-status-notice is-${type}`;
    notice.innerHTML = messageHtml;
    notice.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function fileToBase64Attachment(file) {
    if (!file || file.size === 0) return null;

    const readDirectBase64 = () => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const res = e.target && e.target.result ? e.target.result : "";
        const base64 = typeof res === "string" ? res.split(",")[1] : "";
        resolve(base64 ? { filename: file.name, content: base64 } : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });

    // If file is reasonably sized (< 2MB) or not a common web image, read directly as pure base64
    const isWebImage = file.type && (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp");
    if (!isWebImage || file.size < 2 * 1024 * 1024) {
      return await readDirectBase64();
    }

    // For large standard images (> 2MB), attempt canvas compression with strict 1.5s timeout
    try {
      const compressed = await new Promise((resolve) => {
        let isDone = false;
        const timeout = setTimeout(() => {
          if (!isDone) {
            isDone = true;
            resolve(null);
          }
        }, 1500);

        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            if (isDone) return;
            isDone = true;
            clearTimeout(timeout);
            try {
              const maxDim = 1600;
              let width = img.width;
              let height = img.height;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
              const base64 = dataUrl.split(",")[1];
              const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
              resolve({ filename: cleanName, content: base64 });
            } catch (err) {
              resolve(null);
            }
          };
          img.onerror = () => {
            if (isDone) return;
            isDone = true;
            clearTimeout(timeout);
            resolve(null);
          };
          img.src = e.target.result;
        };
        reader.onerror = () => {
          if (isDone) return;
          isDone = true;
          clearTimeout(timeout);
          resolve(null);
        };
        reader.readAsDataURL(file);
      });

      if (compressed) return compressed;
    } catch (err) {
      console.warn("Canvas compression fallback:", err);
    }

    return await readDirectBase64();
  }

  window.sendEditorialEmail = async function(formEl, subjectPrefix) {
    const submitBtn = formEl.querySelector("button[type='submit']");
    const origBtnText = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>sending &rarr;</span>`;
    }

    const formData = new FormData(formEl);
    const subject = subjectPrefix || "New Website Message — korayhussein.com";

    // Gather all files to attach (crucial for iOS Safari where DataTransfer on file inputs fails)
    const rawFilesToAttach = [];
    if (typeof window.getSelectedInspirationFiles === "function") {
      const bookMeFiles = window.getSelectedInspirationFiles();
      if (Array.isArray(bookMeFiles)) {
        bookMeFiles.forEach(f => {
          if (f && f.size > 0 && !rawFilesToAttach.some(x => x.name === f.name && x.size === f.size)) {
            rawFilesToAttach.push(f);
          }
        });
      }
    }
    const fileInputs = formEl.querySelectorAll("input[type='file']");
    fileInputs.forEach(input => {
      if (input.files && input.files.length > 0) {
        for (let i = 0; i < input.files.length; i++) {
          const f = input.files[i];
          if (f && f.size > 0 && !rawFilesToAttach.some(x => x.name === f.name && x.size === f.size)) {
            rawFilesToAttach.push(f);
          }
        }
      }
    });

    let hasFiles = rawFilesToAttach.length > 0;
    const fileNames = [];
    const attachments = [];
    for (const file of rawFilesToAttach) {
      fileNames.push(file.name);
      try {
        const att = await fileToBase64Attachment(file);
        if (att && att.content) {
          attachments.push(att);
        }
      } catch (attErr) {
        console.warn("Attachment processing notice:", file.name, attErr);
      }
    }

    const mailtoBody = [];
    formData.forEach((value, key) => {
      if (key.startsWith("_")) return;
      if (value instanceof File) return;
      const v = typeof value === "string" ? value.trim() : value;
      if (v) {
        mailtoBody.push(`${key.toUpperCase()}: ${v}`);
      }
    });
    if (fileNames.length > 0) {
      mailtoBody.push(`ATTACHED INSPIRATION FILES (${fileNames.length}): ${fileNames.join(", ")}`);
    }

    try {
      let res;
      const pageSlug = (location.hash || "").replace(/^#\/?/, "") || "home";
      const payload = {
        page: pageSlug,
        subject: subject
      };
      if (attachments.length > 0) {
        payload.attachments = attachments;
      }
      formData.forEach((value, key) => {
        if (key.startsWith("_")) return;
        const v = typeof value === "string" ? value.trim() : value;
        if (v && !(value instanceof File)) {
          payload[key] = v;
        }
      });

      // 1. Primary: 100% White-Label Studio Dispatch via Resend (Universal Vercel + Netlify Serverless API)
      try {
        const apiUrl = window.location.hostname.includes("netlify.app")
          ? "/.netlify/functions/send-email"
          : "/api/send-email";
        res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload)
        });
        if (!res || !res.ok) {
          const fallbackUrl = apiUrl === "/api/send-email" ? "/.netlify/functions/send-email" : "/api/send-email";
          try {
            const altRes = await fetch(fallbackUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Accept": "application/json" },
              body: JSON.stringify(payload)
            });
            if (altRes && altRes.ok) res = altRes;
          } catch (altErr) {}
        }
      } catch (fnErr) {
        console.warn("Function endpoint unavailable, attempting direct fallback:", fnErr);
      }

      // 2. Secondary fallback if serverless function not available (e.g. static preview)
      if (!res || !res.ok) {
        if (hasFiles) {
          res = await fetch("https://formsubmit.co/ajax/contact@korayhussein.com", {
            method: "POST",
            headers: { "Accept": "application/json" },
            body: formData
          });
        } else {
          res = await fetch("https://formsubmit.co/ajax/contact@korayhussein.com", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify(payload)
          });
        }
      }

      if (res.ok) {
        if (submitBtn) {
          submitBtn.innerHTML = `<span>sent successfully &check;</span>`;
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origBtnText;
          }, 4000);
        }
        formEl.reset();
        if (window.resetInspirationPreviews) {
          window.resetInspirationPreviews();
        }
        showFormNotice(formEl, "success", "Thank you! Your shoot request has been sent directly to contact@korayhussein.com.");
        return;
      }
      throw new Error("Form submission error");
    } catch (err) {
      console.warn("Direct submission notice:", err);
      // Clean fallback: Provide direct user-tappable email link so Safari won't block programmatic mailto
      const mailtoUrl = `mailto:contact@korayhussein.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailtoBody.join("\n\n"))}`;

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnText;
      }
      showFormNotice(
        formEl,
        "info",
        `Could not submit automatically. <br><a href="${mailtoUrl}" style="display:inline-block; margin-top:8px; padding:6px 14px; background:#111; color:#fff; text-decoration:none; font-size:12px; letter-spacing:0.05em; text-transform:uppercase; font-weight:600; border-radius:2px;">Click here to send via your email app &rarr;</a>`
      );
    }
  };

  // Global handler for contact forms across the site
  document.addEventListener("submit", (e) => {
    const form = e.target;
    // Do NOT intercept Client Portal or Gallery Builder forms
    if (!form || form.id === "portal-builder-form" || form.closest(".portal-builder-page-wrap") || form.closest(".portal-gallery-wrap") || form.closest(".portal-landing-wrap")) {
      return;
    }

    if (form.classList.contains("editorial-contact-form")) {
      e.preventDefault();
      const subject = form.dataset.subject || (
        location.hash.includes("book-me") ? "New Booking Enquiry — korayhussein.com" :
        location.hash.includes("testimonials") ? "New Testimonial — korayhussein.com" :
        "New Contact Enquiry — korayhussein.com"
      );
      window.sendEditorialEmail(form, subject);
    }
  });

  /* ---------------------------------------------------------
     Render Book Me Page
     --------------------------------------------------------- */
  function renderBookMePage(slug) {
    main.innerHTML = "";
    if (window.renderBookMeEdition) {
      window.renderBookMeEdition(main, slug);
    } else {
      renderContentPage("book-me");
    }
    const isTravelEnabled = (window.BOOK_ME_DATA && window.BOOK_ME_DATA.header && typeof window.BOOK_ME_DATA.header.travelEnabled === "boolean") ?
      window.BOOK_ME_DATA.header.travelEnabled : true;
    if (isTravelEnabled) {
      const dates = (window.BOOK_ME_DATA && window.BOOK_ME_DATA.header && window.BOOK_ME_DATA.header.travelDates) ||
        ["paris · 12–18 may", "new york · 2–9 june", "milan · 16–22 june"];
      startTickerCarousel("header-travel-stamp-text", dates, "upcoming travel: ");
    }
  }

  /* ---------------------------------------------------------
     Render Testimonials Page (5 Editorial Editions)
     --------------------------------------------------------- */
  function renderTestimonialsPage() {
    main.innerHTML = "";
    if (window.renderTestimonialsPage) {
      window.renderTestimonialsPage(main);
    } else {
      renderContentPage("testimonials");
    }
  }

  /* ---------------------------------------------------------
     Render About Me Page (5 Layout Editions + Map + Instagram)
     --------------------------------------------------------- */
  function renderAboutMePage() {
    main.innerHTML = "";
    if (window.renderAboutMePage) {
      window.renderAboutMePage(main);
    } else {
      renderContentPage("contact");
    }
  }

  /* ---------------------------------------------------------
     Render FAQ Page (5 Distinct Editorial Layouts)
     --------------------------------------------------------- */
  function renderFAQPage() {
    main.innerHTML = "";
    if (window.renderFAQPage) {
      window.renderFAQPage(main);
    } else {
      renderContentPage("faq");
    }
  }

  /* ---------------------------------------------------------
     Render Playlists Page (5 Distinct Editorial Layouts)
     --------------------------------------------------------- */
  function renderPlaylistsPage() {
    main.innerHTML = "";
    if (window.renderPlaylistsPage) {
      window.renderPlaylistsPage(main);
    } else {
      renderContentPage("playlists");
    }
  }

  /* ---------------------------------------------------------
     Render Client Portal Page (Proofing & Image Selection)
     --------------------------------------------------------- */
  function renderClientPortalPage(slug) {
    main.innerHTML = "";
    const parts = (slug || "").replace(/^client-portal\/?/, "").split("/").filter(Boolean);
    const shootId = parts[0] || null;
    const subRoute = parts[1] || null;
    if (window.renderClientPortalEdition) {
      window.renderClientPortalEdition(main, shootId, subRoute);
    }
  }

  /* ---------------------------------------------------------
     Render Rich Content Page
     --------------------------------------------------------- */
  function renderContentPage(slug) {
    const html = data.pagesHtml[slug];
    if (!html) {
      renderGallery(slug);
      return;
    }

    const article = document.createElement("div");
    article.className = "article-page";
    article.innerHTML = html;
    main.innerHTML = "";
    main.appendChild(article);
  }

  /* ---------------------------------------------------------
     Router & Transitions
     --------------------------------------------------------- */
  function renderRoute(slug) {
    if (slug === "sets") {
      sessionStorage.setItem("kh_set_referrer", JSON.stringify({ type: "sets", slug: "sets" }));
      renderSetsIndex();
    } else if (slug === "book-me" || slug === "book" || slug.startsWith("book-me/") || slug.startsWith("book/")) {
      renderBookMePage(slug);
    } else if (slug === "cancellations" || slug === "priority-list" || slug === "priority-openings" || slug === "short-notice-bookings" || slug === "short-notice") {
      if (typeof window.renderCancellationsPage === "function") {
        window.renderCancellationsPage();
      }
    } else if (slug === "testimonials") {
      renderTestimonialsPage();
    } else if (slug === "photographer-dashboard" || slug === "dashboard" || slug === "studio") {
      if (typeof window.renderPhotographerDashboardPage === "function") {
        main.innerHTML = "";
        window.renderPhotographerDashboardPage(main);
      }
    } else if (slug === "client-portal" || slug.startsWith("client-portal/")) {
      renderClientPortalPage(slug);
    } else if (slug === "about-me" || slug === "contact") {
      renderAboutMePage();
    } else if (slug === "faq") {
      renderFAQPage();
    } else if (slug === "playlists" || slug === "10305082-playlists") {
      renderPlaylistsPage();
    } else if (slug.startsWith("set/")) {
      renderSetDetail(slug.replace(/^set\//, ""));
    } else if (data.pagesHtml && data.pagesHtml[slug]) {
      renderContentPage(slug);
    } else {
      renderGallery(slug);
    }
    document.querySelectorAll("#side-menu a").forEach(a => {
      a.classList.toggle("is-current", a.dataset.slug === slug || (slug.startsWith("book-me") && a.dataset.slug === "book-me") || ((slug === "about-me" || slug === "contact") && (a.dataset.slug === "about-me" || a.dataset.slug === "contact")));
    });
  }

  /* ---------------------------------------------------------
     Header Scroll Animation & Responsive Behavior
     - Desktop: Fixed header, compacts to "khp" when scrolled
     - Mobile (<= 768px): Top bar slides UP and theme toggle slides DOWN
       out of frame on scroll down; slide back in when scrolling up.
     --------------------------------------------------------- */
  const headerEl = document.querySelector(".site-header");
  let isHeaderScrolled = false;
  let isHeaderHiddenMobile = false;
  let lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
  let scrollUpDistance = 0;
  const MOBILE_SCROLL_UP_THRESHOLD = 8;

  function setHeaderHiddenMobile(hidden) {
    if (isHeaderHiddenMobile === hidden) return;
    isHeaderHiddenMobile = hidden;
    if (headerEl) {
      headerEl.classList.toggle("is-hidden-mobile", hidden);
    }
    if (themeBtn) {
      themeBtn.classList.toggle("is-hidden-mobile", hidden);
    }
    document.body.classList.toggle("header-hidden-mobile", hidden);
  }

  function updateHeaderBehavior() {
    const rawScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    const scrollY = Math.max(0, rawScrollY);
    const isMobile = window.innerWidth <= 768;

    if (!isMobile) {
      setHeaderHiddenMobile(false);
      const shouldScroll = scrollY > 15;
      if (shouldScroll !== isHeaderScrolled) {
        isHeaderScrolled = shouldScroll;
        if (headerEl) {
          headerEl.classList.toggle("is-scrolled", isHeaderScrolled);
        }
      }
      lastScrollY = scrollY;
      scrollUpDistance = 0;
      return;
    }

    // Mobile:
    // Near the top (<= 25px): ALWAYS keep header and theme toggle visible
    if (scrollY <= 25) {
      setHeaderHiddenMobile(false);
      lastScrollY = scrollY;
      scrollUpDistance = 0;
      return;
    }

    const docHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
    const maxScroll = Math.max(0, docHeight - window.innerHeight);
    if (rawScrollY > maxScroll) {
      lastScrollY = scrollY;
      return;
    }

    const delta = scrollY - lastScrollY;

    if (delta > 2) {
      // Scrolling DOWN: slide out of frame so words don't hover over photos
      scrollUpDistance = 0;
      setHeaderHiddenMobile(true);
    } else if (delta < -2) {
      // Scrolling UP: slide back into frame once user scrolls up slightly
      scrollUpDistance += (-delta);
      if (scrollUpDistance >= MOBILE_SCROLL_UP_THRESHOLD) {
        setHeaderHiddenMobile(false);
      }
    }

    lastScrollY = scrollY;
  }

  window.addEventListener("scroll", updateHeaderBehavior, { passive: true });

  /* ---------------------------------------------------------
     Floating Scroll-to-Top Button (Shows upon scrolling)
     --------------------------------------------------------- */
  const floatingTopBtn = document.createElement("button");
  floatingTopBtn.type = "button";
  floatingTopBtn.className = "floating-scroll-top-btn";
  floatingTopBtn.setAttribute("aria-label", "Scroll back to top");
  floatingTopBtn.setAttribute("title", "Back to top");
  floatingTopBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="floating-top-icon">
      <line x1="12" y1="19" x2="12" y2="5"></line>
      <polyline points="5 12 12 5 19 12"></polyline>
    </svg>
  `;
  document.body.appendChild(floatingTopBtn);

  floatingTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  function updateFloatingTopBtn(sy) {
    const scrollPos = typeof sy === "number" ? sy : (window.pageYOffset || document.documentElement.scrollTop || 0);
    if (scrollPos > 300) {
      floatingTopBtn.classList.add("is-visible");
    } else {
      floatingTopBtn.classList.remove("is-visible");
    }
  }

  window.addEventListener("scroll", () => {
    updateFloatingTopBtn();
  }, { passive: true });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && isHeaderHiddenMobile) {
      setHeaderHiddenMobile(false);
    }
  }, { passive: true });

  const logoLink = document.querySelector(".site-header__logo");
  if (logoLink) {
    logoLink.addEventListener("click", (e) => {
      const currentHash = location.hash || "#/portfolio";
      if (currentHash === "#/portfolio") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  /* ---------------------------------------------------------
     Gradual Pull-Down to Open Menu & Scroll-Down to Dismiss
     --------------------------------------------------------- */
  const pullCue = document.getElementById("pull-cue");
  const pullCueFill = document.getElementById("pull-cue-fill");
  const pullCueArrow = document.getElementById("pull-cue-arrow");
  const pullCueLabel = document.getElementById("pull-cue-label");
  const headerIconFirst = document.querySelector("#menu-btn .menu-icon-line:first-child");
  const headerIconLast = document.querySelector("#menu-btn .menu-icon-line:last-child");

  const PULL_TRIGGER_PX = 180; // Deep, deliberate pull distance
  let pullDistance = 0;
  let pullResetTimer = null;
  let isPullActive = false;

  // Trackpad gesture stroke tracking
  let isWheelStrokeActive = false;
  let wheelStrokeTimer = null;
  let wheelStartedAtTop = false;

  // Track whether the page was scrolled down from the top
  let wasScrolledDown = false;
  let settledAtTopTimer = null;

  window.addEventListener("scroll", () => {
    const sy = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (sy > 25) {
      wasScrolledDown = true;
      clearTimeout(settledAtTopTimer);
    } else if (sy <= 0 && wasScrolledDown) {
      // Arrived at top after being scrolled down: block pull-down until settled
      clearTimeout(settledAtTopTimer);
      settledAtTopTimer = setTimeout(() => {
        wasScrolledDown = false;
      }, 700);
    } else if (sy <= 0 && !wasScrolledDown) {
      clearTimeout(settledAtTopTimer);
    }
  }, { passive: true });

  // Touch gesture tracking
  let touchStartY = 0;
  let isTouching = false;
  let touchStartedAtTop = false;

  // Menu dismissal tracking
  let menuOpenedAt = 0;
  let menuCloseScrollAccum = 0;
  let menuCloseTimer = null;
  let menuTouchStartY = 0;

  function resetTopScrollLocks() {
    wasScrolledDown = false;
    clearTimeout(settledAtTopTimer);
    settledAtTopTimer = null;
    isWheelStrokeActive = false;
    clearTimeout(wheelStrokeTimer);
    wheelStrokeTimer = null;
    wheelStartedAtTop = false;
    touchStartedAtTop = false;
    isTouching = false;
    pullDistance = 0;
    isPullActive = false;
  }

  function isEligibleAtTop() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    const isLightboxOpen = lightbox && lightbox.classList.contains("is-open");
    return scrollY <= 0 && !wasScrolledDown && !isNavOpen && !isLightboxOpen;
  }

  function updatePullVisuals(dist) {
    const progress = Math.min(1, Math.max(0, dist / PULL_TRIGGER_PX));
    
    // Elastic logarithmic displacement for page, header, and splash
    const translateY = Math.min(75, Math.pow(dist, 0.76) * 1.4);

    if (main) {
      main.style.transition = "none";
      main.style.transform = dist > 0 ? `translateY(${translateY}px)` : "";
    }
    if (headerEl) {
      headerEl.style.transition = "none";
      headerEl.style.transform = dist > 0 ? `translateY(${translateY}px)` : "";
    }
    if (splash && !splash.classList.contains("is-hidden")) {
      splash.style.transition = "none";
      splash.style.transform = dist > 0 ? `translateY(${translateY}px)` : "";
    }
    if (sideMenu && !isNavOpen) {
      sideMenu.style.transition = "none";
      sideMenu.style.visibility = dist > 0 ? "visible" : "";
      sideMenu.style.transform = dist > 0 ? `translateY(calc(-100% + ${translateY}px))` : "";
    }

    // Hamburger icon lines gradually "charge up" and morph
    if (headerIconFirst && headerIconLast) {
      if (dist > 0) {
        headerIconFirst.style.transform = `rotate(${progress * 28}deg)`;
        headerIconLast.style.transform = `rotate(${-progress * 28}deg)`;
        headerIconLast.style.width = `${18 + progress * 10}px`;
      } else {
        headerIconFirst.style.transform = "";
        headerIconLast.style.transform = "";
        headerIconLast.style.width = "";
      }
    }

    // Pull cue pill indicator: slides down, fills progress bar
    if (pullCue) {
      pullCue.style.transition = "none";
      const cueY = Math.min(24, -60 + progress * 84);
      pullCue.style.transform = `translate(-50%, ${cueY}px)`;
      pullCue.style.opacity = Math.min(1, progress * 2.2).toString();

      if (pullCueFill) {
        pullCueFill.style.width = `${progress * 100}%`;
      }

      if (pullCueLabel) {
        pullCueLabel.textContent = "pull to reveal index";
      }

      pullCue.classList.toggle("is-ready", progress >= 1);
    }
  }

  function resetPullAnimation() {
    pullDistance = 0;
    isPullActive = false;

    if (main) {
      main.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
      main.style.transform = "";
      setTimeout(() => { if (!isPullActive && main) main.style.transition = ""; }, 450);
    }
    if (headerEl) {
      headerEl.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
      headerEl.style.transform = "";
      setTimeout(() => { if (!isPullActive && headerEl) headerEl.style.transition = ""; }, 450);
    }
    if (splash) {
      splash.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
      splash.style.transform = "";
      setTimeout(() => { if (!isPullActive && splash) splash.style.transition = ""; }, 450);
    }
    if (sideMenu && !isNavOpen) {
      sideMenu.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
      sideMenu.style.transform = "";
      setTimeout(() => {
        if (!isPullActive && !isNavOpen && sideMenu) {
          sideMenu.style.transition = "";
          sideMenu.style.visibility = "";
        }
      }, 450);
    }
    if (headerIconFirst) headerIconFirst.style.transform = "";
    if (headerIconLast) {
      headerIconLast.style.transform = "";
      headerIconLast.style.width = "";
    }
    if (pullCue) {
      pullCue.style.transition = "opacity 0.35s var(--ease), transform 0.35s var(--ease)";
      pullCue.style.opacity = "0";
      pullCue.style.transform = "translate(-50%, -60px)";
      pullCue.classList.remove("is-ready");
      if (pullCueFill) pullCueFill.style.width = "0%";
      if (pullCueLabel) pullCueLabel.textContent = "pull to reveal index";
    }
  }

  function triggerMenuFromPull() {
    if (sideMenu) {
      sideMenu.style.transition = "";
      sideMenu.style.transform = "";
      sideMenu.style.visibility = "";
    }
    resetPullAnimation();
    toggleMenu(true);
  }

  // Wheel Listener (Trackpad & Mouse Wheel)
  window.addEventListener("wheel", (e) => {
    // 0) On splash screen, let the splash wheel handler deal with it
    if (!document.body.classList.contains("site-active")) {
      return;
    }

    // 1) Desktop swipe-away: when index is open, swiping up / scrolling down dismisses the menu smoothly
    if (isNavOpen) {
      if (Date.now() - menuOpenedAt > 350 && e.deltaY > 0) {
        menuCloseScrollAccum += e.deltaY;
        clearTimeout(menuCloseTimer);
        menuCloseTimer = setTimeout(() => { menuCloseScrollAccum = 0; }, 200);
        if (menuCloseScrollAccum > 45) {
          menuCloseScrollAccum = 0;
          toggleMenu(false);
        }
      }
      return;
    }

    // 2) Detect physical desktop mouse wheel (discrete notched jumps) vs continuous trackpad
    // Traditional mouse wheels fire deltaMode !== 0 (DOM_DELTA_LINE/PAGE) or large discrete integer jumps (e.g. 100, 120, or >= 40)
    const isPhysicalMouseWheel = (e.deltaMode !== 0) || (Math.abs(e.deltaY) >= 40 && Number.isInteger(e.deltaY));

    // If it's a physical mouse wheel:
    // ALWAYS allow 100% native browser scrolling. NEVER intercept or block with preventDefault().
    if (isPhysicalMouseWheel) {
      if (isPullActive) {
        resetPullAnimation();
      }
      return;
    }

    // 3) Downward scroll intent (deltaY > 0):
    // NEVER call preventDefault() when the user is scrolling down! Let the browser scroll normally.
    if (e.deltaY > 0) {
      if (isPullActive) {
        resetPullAnimation();
      }
      return;
    }

    // 4) Trackpad continuous stroke tracking for gentle pull-down from the top
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

    if (!isWheelStrokeActive) {
      isWheelStrokeActive = true;
      // ONLY eligible if already at the top AND was not recently scrolling up from below
      wheelStartedAtTop = (currentScrollY <= 0 && !wasScrolledDown);
    }

    clearTimeout(wheelStrokeTimer);
    wheelStrokeTimer = setTimeout(() => {
      isWheelStrokeActive = false;
      wheelStartedAtTop = false;
      if (isPullActive) resetPullAnimation();
    }, 200);

    // If scrolling up from below, stop completely at the top — never open index
    if (!wheelStartedAtTop) {
      return;
    }

    // 5) Deliberate gentle pull down from the top on trackpad (e.deltaY < 0)
    if (isEligibleAtTop() && e.deltaY < 0) {
      if (e.cancelable) e.preventDefault();
      isPullActive = true;
      pullDistance += (-e.deltaY) * 0.45;
      updatePullVisuals(pullDistance);

      clearTimeout(pullResetTimer);

      if (pullDistance >= PULL_TRIGGER_PX) {
        triggerMenuFromPull();
      } else {
        pullResetTimer = setTimeout(() => {
          resetPullAnimation();
        }, 150);
      }
    }
  }, { passive: false });

  // Touch screen listeners (Mobile / Tablet)
  // Disable custom pull-to-open gesture on touch screens so native iOS touch scrolling is 100% fluid, buttery and glitch-free
  window.addEventListener("touchstart", () => {}, { passive: true });
  window.addEventListener("touchmove", () => {}, { passive: true });
  window.addEventListener("touchend", () => {}, { passive: true });

  /* ---------------------------------------------------------
     Back to the Top Button (Appended to Every Page Footer)
     --------------------------------------------------------- */
  function appendBackToTop() {
    const existing = document.querySelector(".back-to-top-wrap");
    if (existing) existing.remove();

    const wrap = document.createElement("div");
    wrap.className = "back-to-top-wrap";
    wrap.innerHTML = `
      <button type="button" class="back-to-top-btn" aria-label="Scroll back to top">
        <span class="back-to-top-arrow">&uarr;</span>
        <span class="back-to-top-text">back to the top</span>
      </button>
    `;

    wrap.querySelector(".back-to-top-btn").addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    main.appendChild(wrap);
  }

  function navigate(slug) {
    const isHome = !slug || slug === "home";
    window.scrollTo({ top: 0, behavior: "instant" });
    updateFloatingTopBtn(0);
    isHeaderScrolled = false;
    setHeaderHiddenMobile(false);
    lastScrollY = 0;
    scrollUpDistance = 0;
    if (headerEl) {
      headerEl.classList.remove("is-scrolled");
    }
    resetPullAnimation();
    if (typeof resetTopScrollLocks === "function") {
      resetTopScrollLocks();
    }

    if (isHome) {
      showSplash();
      main.innerHTML = "";
    } else {
      // Render portfolio/content page behind the splash first
      renderRoute(slug);
      appendBackToTop();
      // Now smoothly fade out splash overlay revealing the loaded page
      hideSplash();
    }
  }

  function handleRoute() {
    syncLiveCustomSets();
    syncLiveCustomGalleries();
    syncLiveCustomHeaders();
    syncLiveCustomTestimonials();
    const raw = location.hash.replace(/^#\/?/, "").trim();
    navigate(raw || "home");

    const slug = raw.split("/")[0] || "home";
    const infoSlugs = ["book-me", "about-me", "faq", "playlists", "testimonials", "cancellations", "client-portal"];
    if (infoSlugs.includes(slug)) {
      // 1. Check in-memory first
      if (window._KH_HEADERS && window._KH_HEADERS[slug]) {
        updateLiveHeroBannerInDOM(slug, window._KH_HEADERS[slug]);
      } else {
        // 2. Check dedicated per-page localStorage
        try {
          const cached = localStorage.getItem("kh_header_" + slug);
          if (cached) {
            updateLiveHeroBannerInDOM(slug, JSON.parse(cached));
          }
        } catch(e) {}
      }
      // 3. Always pull latest from Firestore cloud for this page!
      syncPageHeader(slug);
    }
  }

  // Initialize
  buildMenu();
  window.addEventListener("hashchange", handleRoute);

  if (location.hash && location.hash !== "#/" && location.hash !== "#/home") {
    hideSplash();
    handleRoute();
  } else {
    showSplash();
  }

  // Initial Cloud Synchronization on page load / hard refresh
  syncAllSiteDataFromCloud();

})();
