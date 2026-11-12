/* ==========================================================
   Koray Hussein — Splash Screen Customiser & Manager
   Orientation-Aware (Desktop Landscape & Mobile Portrait)
   British English: Customise, Colour, Organise
   ========================================================== */
(() => {
  "use strict";

  const SPLASH_STORAGE_KEY = "kh_splash_custom_config";
  const PHOTOGRAPHER_AUTH_KEY = "kh_photographer_auth";
  const MASTER_PASSKEY = "Mezepo5633";

  const DEFAULTS = {
    landscape: "photos/splash/001 Bree Colter 1.jpg",
    portrait: "photos/portfolio/001 Nyekachi Douglas 2.jpg"
  };

  function getFirebaseConfig() {
    return (window.SETTINGS && window.SETTINGS.firebase) || {
      apiKey: "AIzaSyD0b76g_32uPjLpeezf3QSlTSbAEbSeXjs",
      projectId: "korayhussein-proofing"
    };
  }

  function getFirestoreSplashDocUrl() {
    const fb = getFirebaseConfig();
    return `https://firestore.googleapis.com/v1/projects/${fb.projectId}/databases/(default)/documents/client_shoots/splash_config?key=${fb.apiKey}`;
  }

  // Retrieve current active splash settings with cascading fallbacks
  function getActiveSplashSettings() {
    let custom = null;
    try {
      const raw = localStorage.getItem(SPLASH_STORAGE_KEY);
      if (raw) custom = JSON.parse(raw);
    } catch (e) {}

    const landscape = (custom && custom.landscape) ||
                      (window.SETTINGS && window.SETTINGS.splashImageLandscape) ||
                      (window.SITE_DATA && window.SITE_DATA.site && (window.SITE_DATA.site.splashImageLandscape || window.SITE_DATA.site.splashImage)) ||
                      DEFAULTS.landscape;

    const portrait = (custom && custom.portrait) ||
                     (window.SETTINGS && window.SETTINGS.splashImagePortrait) ||
                     (window.SITE_DATA && window.SITE_DATA.site && window.SITE_DATA.site.splashImagePortrait) ||
                     DEFAULTS.portrait;

    const titleSizeDesktop = (custom && parseInt(custom.titleSizeDesktop, 10)) || 68;
    const titleSizeMobile = (custom && parseInt(custom.titleSizeMobile, 10)) || 44;

    return { landscape, portrait, titleSizeDesktop, titleSizeMobile };
  }

  // Immediately apply the chosen image and font sizing to #splash-bg and .splash__title
  function updateSplashImage() {
    const splashBg = document.getElementById("splash-bg");
    const isPortrait = window.matchMedia("(max-width: 768px), (orientation: portrait)").matches;
    const settings = getActiveSplashSettings();
    if (splashBg && settings) {
      const targetSrc = isPortrait ? settings.portrait : settings.landscape;
      if (targetSrc) splashBg.style.backgroundImage = `url("${encodeURI(targetSrc)}")`;
    }

    if (settings) {
      const dSize = settings.titleSizeDesktop || 68;
      const mSize = settings.titleSizeMobile || 44;
      document.documentElement.style.setProperty("--splash-title-size-desktop", `${dSize}px`);
      document.documentElement.style.setProperty("--splash-title-size-mobile", `${mSize}px`);
      const titleEl = document.querySelector(".splash__title");
      if (titleEl) {
        const activeSize = isPortrait ? mSize : dSize;
        titleEl.style.setProperty("font-size", `${activeSize}px`, "important");
      }
    }
  }

  // Synchronise splash settings from Firebase Cloud
  async function syncSplashConfigFromCloud() {
    try {
      const res = await fetch(getFirestoreSplashDocUrl(), { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.fields) return;

      const f = data.fields;
      const cloudLandscape = f.landscape ? f.landscape.stringValue : null;
      const cloudPortrait = f.portrait ? f.portrait.stringValue : null;
      const cloudDesktopSize = f.titleSizeDesktop ? parseInt(f.titleSizeDesktop.integerValue || f.titleSizeDesktop.stringValue, 10) : null;
      const cloudMobileSize = f.titleSizeMobile ? parseInt(f.titleSizeMobile.integerValue || f.titleSizeMobile.stringValue, 10) : null;

      if (cloudLandscape || cloudPortrait || cloudDesktopSize || cloudMobileSize) {
        let cur = {};
        try { cur = JSON.parse(localStorage.getItem(SPLASH_STORAGE_KEY) || "{}"); } catch (e) {}
        if (cloudLandscape) cur.landscape = cloudLandscape;
        if (cloudPortrait) cur.portrait = cloudPortrait;
        if (cloudDesktopSize) cur.titleSizeDesktop = cloudDesktopSize;
        if (cloudMobileSize) cur.titleSizeMobile = cloudMobileSize;
        localStorage.setItem(SPLASH_STORAGE_KEY, JSON.stringify(cur));
        updateSplashImage();
      }
    } catch (e) {
      // Offline fallback silently keeps local storage
    }
  }

  // Save splash settings to LocalStorage and Firebase Cloud
  async function saveSplashConfig(config) {
    try {
      localStorage.setItem(SPLASH_STORAGE_KEY, JSON.stringify(config));
      updateSplashImage();

      const dSize = parseInt(config.titleSizeDesktop, 10) || 68;
      const mSize = parseInt(config.titleSizeMobile, 10) || 44;

      // Cloud dispatch
      fetch(getFirestoreSplashDocUrl(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({
          fields: {
            landscape: { stringValue: config.landscape || DEFAULTS.landscape },
            portrait: { stringValue: config.portrait || DEFAULTS.portrait },
            titleSizeDesktop: { integerValue: String(dSize) },
            titleSizeMobile: { integerValue: String(mSize) },
            updatedAt: { integerValue: String(Date.now()) }
          }
        })
      }).catch(() => {});
      return true;
    } catch (e) {
      console.warn("Error saving splash settings:", e);
      return false;
    }
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

  // Prompt for Master Passkey if not already signed in
  function promptPasskey(onSuccess) {
    const existing = document.getElementById("splash-passkey-modal");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "splash-passkey-modal";
    overlay.className = "splash-modal-overlay";
    overlay.innerHTML = `
      <div class="splash-modal-box splash-passkey-box">
        <button type="button" class="splash-modal-close" id="splash-passkey-close">&times;</button>
        <span class="splash-modal-kicker">Koray Hussein Photography</span>
        <h3 class="splash-modal-title">Photographer Verification</h3>
        <p class="splash-modal-desc">Enter your master passkey to customise your desktop and mobile splash screens.</p>
        <div class="splash-passkey-form">
          <input type="password" id="splash-passkey-input" class="splash-text-input" placeholder="Enter passkey..." autocomplete="current-password" autofocus />
          <button type="button" id="splash-passkey-submit" class="splash-btn-primary">Unlock &rarr;</button>
        </div>
        <div id="splash-passkey-error" class="splash-error-text" style="display: none;"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = overlay.querySelector("#splash-passkey-input");
    const submitBtn = overlay.querySelector("#splash-passkey-submit");
    const closeBtn = overlay.querySelector("#splash-passkey-close");
    const errorMsg = overlay.querySelector("#splash-passkey-error");

    function handleSubmit() {
      const val = (input.value || "").trim();
      if (val === MASTER_PASSKEY || val.toLowerCase() === MASTER_PASSKEY.toLowerCase()) {
        setPhotographerAuth(true);
        overlay.remove();
        if (typeof onSuccess === "function") onSuccess();
      } else {
        errorMsg.textContent = "Incorrect passkey. Please try again.";
        errorMsg.style.display = "block";
        input.focus();
        input.select();
      }
    }

    submitBtn.addEventListener("click", handleSubmit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSubmit();
    });
    closeBtn.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });

    setTimeout(() => input.focus(), 80);
  }

  // Collect all photos from window.SITE_DATA
  function getAllSiteImages() {
    const images = [];
    const seen = new Set();
    const siteData = window.SITE_DATA || {};

    // 1. Galleries
    if (siteData.galleries) {
      for (const [catName, catImages] of Object.entries(siteData.galleries)) {
        if (!Array.isArray(catImages)) continue;
        catImages.forEach(img => {
          if (!img || !img.src || seen.has(img.src)) return;
          seen.add(img.src);
          const w = img.w || 0;
          const h = img.h || 0;
          images.push({
            src: img.src,
            filename: img.filename || img.src.split("/").pop(),
            w: w,
            h: h,
            category: catName,
            isLandscape: (w && h) ? (w > h) : false
          });
        });
      }
    }

    // 2. Sets
    if (siteData.sets) {
      for (const [setName, setObj] of Object.entries(siteData.sets)) {
        const setImages = setObj.images || (Array.isArray(setObj) ? setObj : []);
        if (!Array.isArray(setImages)) continue;
        setImages.forEach(img => {
          if (!img || !img.src || seen.has(img.src)) return;
          seen.add(img.src);
          const w = img.w || 0;
          const h = img.h || 0;
          images.push({
            src: img.src,
            filename: img.filename || img.src.split("/").pop(),
            w: w,
            h: h,
            category: `set: ${setName}`,
            isLandscape: (w && h) ? (w > h) : false
          });
        });
      }
    }

    return images;
  }

  // Compress uploaded file to safe resolution and return DataURL
  function readAndCompressImage(file, maxDimension = 2400) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxDimension || h > maxDimension) {
            if (w > h) {
              h = Math.round((h * maxDimension) / w);
              w = maxDimension;
            } else {
              w = Math.round((w * maxDimension) / h);
              h = maxDimension;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.88));
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  // Show Toast Alert
  function showToast(message) {
    const existing = document.getElementById("splash-customiser-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.id = "splash-customiser-toast";
    toast.className = "splash-customiser-toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("is-visible");
      setTimeout(() => {
        toast.classList.remove("is-visible");
        setTimeout(() => toast.remove(), 400);
      }, 3000);
    }, 20);
  }

  // Main Splash Customiser Modal
  function openSplashCustomiserModal() {
    if (!isPhotographerAuthenticated()) {
      promptPasskey(() => openSplashCustomiserModal());
      return;
    }

    const existing = document.getElementById("splash-customiser-modal");
    if (existing) existing.remove();

    const currentSettings = getActiveSplashSettings();
    let workingLandscape = currentSettings.landscape;
    let workingPortrait = currentSettings.portrait;
    let activeTarget = "landscape"; // "landscape" | "portrait"
    let activeMode = "portfolio";   // "portfolio" | "upload" | "custom"
    let currentCategory = "all";
    let searchQuery = "";
    let orientationFilterOnly = true; // recommended orientation filter

    const allImages = getAllSiteImages();

    const overlay = document.createElement("div");
    overlay.id = "splash-customiser-modal";
    overlay.className = "splash-modal-overlay splash-customiser-overlay";

    overlay.innerHTML = `
      <div class="splash-modal-box splash-customiser-box" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="splash-customiser-header">
          <div>
            <span class="splash-modal-kicker">Photographer Dashboard</span>
            <h2 class="splash-customiser-title">Customise Splash Screens</h2>
            <p class="splash-customiser-subtitle">Select individual images for Desktop (landscape) and Mobile (portrait) visitors.</p>
          </div>
          <button type="button" class="splash-modal-close" id="splash-customiser-close" title="Close without saving">&times;</button>
        </div>

        <!-- Dual Live Preview Showcase -->
        <div class="splash-previews-container">
          <!-- Desktop Preview Card -->
          <div class="splash-preview-card ${activeTarget === "landscape" ? "is-active" : ""}" id="splash-preview-card-landscape">
            <div class="splash-preview-card-header">
              <span class="splash-preview-badge">Desktop (Landscape)</span>
              <span class="splash-preview-active-tag">Active Target</span>
            </div>
            <div class="splash-preview-screen splash-preview-desktop">
              <div class="splash-preview-screen-bg" id="preview-screen-bg-landscape" style="background-image: url('${encodeURI(workingLandscape)}');"></div>
              <div class="splash-preview-screen-overlay"></div>
              <div class="splash-preview-screen-content">
                <span class="splash-preview-logo-text">koray hussein photography</span>
              </div>
            </div>
            <div class="splash-preview-meta">
              <span class="splash-preview-filename" id="preview-filename-landscape">${workingLandscape.split("/").pop()}</span>
            </div>
          </div>

          <!-- Mobile Preview Card -->
          <div class="splash-preview-card ${activeTarget === "portrait" ? "is-active" : ""}" id="splash-preview-card-portrait">
            <div class="splash-preview-card-header">
              <span class="splash-preview-badge">Mobile (Portrait)</span>
              <span class="splash-preview-active-tag">Active Target</span>
            </div>
            <div class="splash-preview-screen splash-preview-mobile">
              <div class="splash-preview-screen-bg" id="preview-screen-bg-portrait" style="background-image: url('${encodeURI(workingPortrait)}');"></div>
              <div class="splash-preview-screen-overlay"></div>
              <div class="splash-preview-screen-content">
                <span class="splash-preview-logo-text">koray hussein<br>photography</span>
              </div>
            </div>
            <div class="splash-preview-meta">
              <span class="splash-preview-filename" id="preview-filename-portrait">${workingPortrait.split("/").pop()}</span>
            </div>
          </div>
        </div>

        <!-- Target Switcher Tabs -->
        <div class="splash-target-switcher">
          <button type="button" class="splash-target-btn ${activeTarget === "landscape" ? "is-active" : ""}" id="target-btn-landscape">
            <span>&#128187; Edit Desktop Splash (Landscape)</span>
          </button>
          <button type="button" class="splash-target-btn ${activeTarget === "portrait" ? "is-active" : ""}" id="target-btn-portrait">
            <span>&#128241; Edit Mobile Splash (Portrait)</span>
          </button>
        </div>

        <!-- Mode Selector (Portfolio Picker / Upload / Custom Path) -->
        <div class="splash-mode-bar">
          <div class="splash-mode-buttons">
            <button type="button" class="splash-mode-btn ${activeMode === "portfolio" ? "is-active" : ""}" id="mode-btn-portfolio">
              &#128444; Choose from Portfolio
            </button>
            <button type="button" class="splash-mode-btn ${activeMode === "upload" ? "is-active" : ""}" id="mode-btn-upload">
              &#128193; Upload New Image
            </button>
            <button type="button" class="splash-mode-btn ${activeMode === "custom" ? "is-active" : ""}" id="mode-btn-custom">
              &#128279; File Path / URL
            </button>
          </div>
          <div class="splash-mode-hint" id="splash-mode-hint">
            Selecting photo for <strong>Desktop Splash</strong> (Landscape orientation recommended).
          </div>
        </div>

        <!-- Tab 1: Portfolio Browser Panel -->
        <div class="splash-panel-content" id="panel-portfolio" style="${activeMode === "portfolio" ? "display: flex;" : "display: none;"}">
          <!-- Filters & Search Toolbar -->
          <div class="splash-toolbar">
            <div class="splash-filter-chips">
              <button type="button" class="splash-chip ${currentCategory === "all" ? "is-active" : ""}" data-category="all">All Photos</button>
              <button type="button" class="splash-chip ${currentCategory === "portfolio" ? "is-active" : ""}" data-category="portfolio">Portfolio</button>
              <button type="button" class="splash-chip ${currentCategory === "black-and-white" ? "is-active" : ""}" data-category="black-and-white">Black &amp; White</button>
              <button type="button" class="splash-chip ${currentCategory === "colour" ? "is-active" : ""}" data-category="colour">Colour</button>
              <button type="button" class="splash-chip ${currentCategory === "beauty" ? "is-active" : ""}" data-category="beauty">Beauty</button>
              <button type="button" class="splash-chip ${currentCategory === "sets" ? "is-active" : ""}" data-category="sets">Sets</button>
            </div>
            <div class="splash-toolbar-right">
              <label class="splash-checkbox-label">
                <input type="checkbox" id="splash-orientation-filter-cb" ${orientationFilterOnly ? "checked" : ""}>
                <span id="splash-orientation-filter-text">${activeTarget === "landscape" ? "Landscape photos only" : "Portrait photos only"}</span>
              </label>
              <input type="text" id="splash-search-input" class="splash-search-input" placeholder="Search model or file..." value="${searchQuery}" />
            </div>
          </div>

          <!-- Photo Grid -->
          <div class="splash-photos-grid" id="splash-photos-grid">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- Tab 2: Upload Image Panel -->
        <div class="splash-panel-content" id="panel-upload" style="${activeMode === "upload" ? "display: flex;" : "display: none;"}">
          <div class="splash-upload-dropzone" id="splash-upload-dropzone">
            <div class="splash-upload-icon">&#128247;</div>
            <h3 class="splash-upload-title">Upload a High-Resolution Photo</h3>
            <p class="splash-upload-desc">Select an image from your computer or phone for your <span id="splash-upload-target-name">Desktop (Landscape)</span> splash page.</p>
            <button type="button" class="splash-btn-primary" id="splash-upload-browse-btn">Browse Files...</button>
            <input type="file" id="splash-file-input" accept="image/*" style="display: none;" />
            <span class="splash-upload-sub">Supports JPG, PNG, WebP (automatically optimised for instant loading)</span>
          </div>
        </div>

        <!-- Tab 3: Custom Path Panel -->
        <div class="splash-panel-content" id="panel-custom" style="${activeMode === "custom" ? "display: flex;" : "display: none;"}">
          <div class="splash-custom-path-box">
            <label class="splash-form-label" for="splash-custom-path-input">Custom Image Path or Direct URL</label>
            <div class="splash-custom-path-row">
              <input type="text" id="splash-custom-path-input" class="splash-text-input" value="${activeTarget === "landscape" ? workingLandscape : workingPortrait}" placeholder="e.g. photos/splash/hero-01.jpg" />
              <button type="button" class="splash-btn-primary" id="splash-apply-custom-path-btn">Preview</button>
            </div>
            <p class="splash-form-help">Enter any relative image path (e.g. <code>photos/portfolio/001 Bree Colter 1.jpg</code>) or hosted URL.</p>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="splash-customiser-footer">
          <button type="button" class="splash-footer-btn is-danger" id="splash-reset-btn">Reset to Defaults</button>
          <div class="splash-footer-right">
            <button type="button" class="splash-footer-btn" id="splash-cancel-btn">Cancel</button>
            <button type="button" class="splash-btn-primary is-save" id="splash-save-btn">Save &amp; Apply</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Elements
    const closeBtn = overlay.querySelector("#splash-customiser-close");
    const cancelBtn = overlay.querySelector("#splash-cancel-btn");
    const saveBtn = overlay.querySelector("#splash-save-btn");
    const resetBtn = overlay.querySelector("#splash-reset-btn");

    const targetBtnLandscape = overlay.querySelector("#target-btn-landscape");
    const targetBtnPortrait = overlay.querySelector("#target-btn-portrait");
    const cardLandscape = overlay.querySelector("#splash-preview-card-landscape");
    const cardPortrait = overlay.querySelector("#splash-preview-card-portrait");

    const bgLandscape = overlay.querySelector("#preview-screen-bg-landscape");
    const bgPortrait = overlay.querySelector("#preview-screen-bg-portrait");
    const filenameLandscape = overlay.querySelector("#preview-filename-landscape");
    const filenamePortrait = overlay.querySelector("#preview-filename-portrait");

    const modeBtnPortfolio = overlay.querySelector("#mode-btn-portfolio");
    const modeBtnUpload = overlay.querySelector("#mode-btn-upload");
    const modeBtnCustom = overlay.querySelector("#mode-btn-custom");

    const panelPortfolio = overlay.querySelector("#panel-portfolio");
    const panelUpload = overlay.querySelector("#panel-upload");
    const panelCustom = overlay.querySelector("#panel-custom");

    const modeHint = overlay.querySelector("#splash-mode-hint");
    const photosGrid = overlay.querySelector("#splash-photos-grid");
    const searchInput = overlay.querySelector("#splash-search-input");
    const orientationFilterCb = overlay.querySelector("#splash-orientation-filter-cb");
    const orientationFilterText = overlay.querySelector("#splash-orientation-filter-text");

    const uploadDropzone = overlay.querySelector("#splash-upload-dropzone");
    const fileInput = overlay.querySelector("#splash-file-input");
    const uploadBrowseBtn = overlay.querySelector("#splash-upload-browse-btn");
    const uploadTargetName = overlay.querySelector("#splash-upload-target-name");

    const customPathInput = overlay.querySelector("#splash-custom-path-input");
    const applyCustomPathBtn = overlay.querySelector("#splash-apply-custom-path-btn");

    // Update Live Previews
    function refreshPreviews() {
      bgLandscape.style.backgroundImage = `url('${encodeURI(workingLandscape)}')`;
      bgPortrait.style.backgroundImage = `url('${encodeURI(workingPortrait)}')`;
      filenameLandscape.textContent = workingLandscape.startsWith("data:") ? "Custom Uploaded Photo" : workingLandscape.split("/").pop();
      filenamePortrait.textContent = workingPortrait.startsWith("data:") ? "Custom Uploaded Photo" : workingPortrait.split("/").pop();

      if (activeTarget === "landscape") {
        cardLandscape.classList.add("is-active");
        cardPortrait.classList.remove("is-active");
        targetBtnLandscape.classList.add("is-active");
        targetBtnPortrait.classList.remove("is-active");
        modeHint.innerHTML = "Selecting photo for <strong>Desktop Splash</strong> (Landscape orientation recommended).";
        uploadTargetName.textContent = "Desktop (Landscape)";
        orientationFilterText.textContent = "Landscape photos only";
        customPathInput.value = workingLandscape;
      } else {
        cardPortrait.classList.add("is-active");
        cardLandscape.classList.remove("is-active");
        targetBtnPortrait.classList.add("is-active");
        targetBtnLandscape.classList.remove("is-active");
        modeHint.innerHTML = "Selecting photo for <strong>Mobile Splash</strong> (Portrait orientation recommended).";
        uploadTargetName.textContent = "Mobile (Portrait)";
        orientationFilterText.textContent = "Portrait photos only";
        customPathInput.value = workingPortrait;
      }

      renderPhotoGrid();
    }

    // Switch Active Target
    function switchTarget(newTarget) {
      activeTarget = newTarget;
      refreshPreviews();
    }

    // Switch Mode
    function switchMode(newMode) {
      activeMode = newMode;
      [modeBtnPortfolio, modeBtnUpload, modeBtnCustom].forEach(btn => btn.classList.remove("is-active"));
      panelPortfolio.style.display = "none";
      panelUpload.style.display = "none";
      panelCustom.style.display = "none";

      if (newMode === "portfolio") {
        modeBtnPortfolio.classList.add("is-active");
        panelPortfolio.style.display = "flex";
        renderPhotoGrid();
      } else if (newMode === "upload") {
        modeBtnUpload.classList.add("is-active");
        panelUpload.style.display = "flex";
      } else if (newMode === "custom") {
        modeBtnCustom.classList.add("is-active");
        panelCustom.style.display = "flex";
      }
    }

    // Render Filtered Photos Grid
    function renderPhotoGrid() {
      const activeCurrentSrc = activeTarget === "landscape" ? workingLandscape : workingPortrait;

      let filtered = allImages.filter(img => {
        // Category Filter
        if (currentCategory !== "all") {
          if (currentCategory === "sets") {
            if (!img.category.startsWith("set:")) return false;
          } else if (img.category !== currentCategory) {
            return false;
          }
        }

        // Orientation Filter
        if (orientationFilterOnly) {
          if (activeTarget === "landscape" && !img.isLandscape) return false;
          if (activeTarget === "portrait" && img.isLandscape) return false;
        }

        // Search Filter
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchFilename = img.filename.toLowerCase().includes(q);
          const matchCat = img.category.toLowerCase().includes(q);
          if (!matchFilename && !matchCat) return false;
        }

        return true;
      });

      if (filtered.length === 0) {
        photosGrid.innerHTML = `
          <div class="splash-no-photos">
            <p>No photos match the current filters.</p>
            <button type="button" class="splash-chip" id="splash-clear-filters-btn">Clear Filters</button>
          </div>
        `;
        const clearBtn = photosGrid.querySelector("#splash-clear-filters-btn");
        if (clearBtn) {
          clearBtn.addEventListener("click", () => {
            currentCategory = "all";
            searchQuery = "";
            searchInput.value = "";
            orientationFilterOnly = false;
            orientationFilterCb.checked = false;
            overlay.querySelectorAll(".splash-chip").forEach(c => c.classList.toggle("is-active", c.dataset.category === "all"));
            renderPhotoGrid();
          });
        }
        return;
      }

      // Render top 120 items for performance
      const itemsToRender = filtered.slice(0, 120);

      photosGrid.innerHTML = itemsToRender.map(img => {
        const isSelected = img.src === activeCurrentSrc;
        return `
          <div class="splash-photo-card ${isSelected ? "is-selected" : ""}" data-src="${img.src}" title="${img.filename}">
            <div class="splash-photo-thumb-wrap">
              <img src="${img.src}" loading="lazy" class="splash-photo-thumb" alt="${img.filename}" />
              ${isSelected ? `<span class="splash-photo-selected-badge">&#10003; Selected</span>` : ""}
              <span class="splash-photo-dim-badge">${img.w ? `${img.w}&times;${img.h}` : (img.isLandscape ? "Landscape" : "Portrait")}</span>
            </div>
            <div class="splash-photo-card-info">
              <span class="splash-photo-name">${img.filename}</span>
              <span class="splash-photo-cat">${img.category}</span>
            </div>
          </div>
        `;
      }).join("");

      // Bind Clicks on Photo Cards
      photosGrid.querySelectorAll(".splash-photo-card").forEach(card => {
        card.addEventListener("click", () => {
          const chosenSrc = card.dataset.src;
          if (activeTarget === "landscape") {
            workingLandscape = chosenSrc;
          } else {
            workingPortrait = chosenSrc;
          }
          refreshPreviews();
        });
      });
    }

    // Event Bindings
    targetBtnLandscape.addEventListener("click", () => switchTarget("landscape"));
    targetBtnPortrait.addEventListener("click", () => switchTarget("portrait"));
    cardLandscape.addEventListener("click", () => switchTarget("landscape"));
    cardPortrait.addEventListener("click", () => switchTarget("portrait"));

    modeBtnPortfolio.addEventListener("click", () => switchMode("portfolio"));
    modeBtnUpload.addEventListener("click", () => switchMode("upload"));
    modeBtnCustom.addEventListener("click", () => switchMode("custom"));

    // Category Chips
    overlay.querySelectorAll(".splash-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        overlay.querySelectorAll(".splash-chip").forEach(c => c.classList.remove("is-active"));
        chip.classList.add("is-active");
        currentCategory = chip.dataset.category;
        renderPhotoGrid();
      });
    });

    // Orientation Filter Checkbox
    orientationFilterCb.addEventListener("change", (e) => {
      orientationFilterOnly = e.target.checked;
      renderPhotoGrid();
    });

    // Search Input Debounced
    let searchTimeout = null;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = (e.target.value || "").trim();
        renderPhotoGrid();
      }, 150);
    });

    // File Upload Handling
    uploadBrowseBtn.addEventListener("click", () => fileInput.click());
    uploadDropzone.addEventListener("click", (e) => {
      if (e.target !== uploadBrowseBtn) fileInput.click();
    });

    uploadDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadDropzone.classList.add("is-dragover");
    });
    uploadDropzone.addEventListener("dragleave", () => {
      uploadDropzone.classList.remove("is-dragover");
    });
    uploadDropzone.addEventListener("drop", async (e) => {
      e.preventDefault();
      uploadDropzone.classList.remove("is-dragover");
      const files = e.dataTransfer.files;
      if (files && files[0]) {
        await processUploadedFile(files[0]);
      }
    });

    fileInput.addEventListener("change", async (e) => {
      const files = e.target.files;
      if (files && files[0]) {
        await processUploadedFile(files[0]);
      }
    });

    async function processUploadedFile(file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        return;
      }
      try {
        uploadBrowseBtn.textContent = "Processing image...";
        uploadBrowseBtn.disabled = true;
        const dataUrl = await readAndCompressImage(file);
        if (activeTarget === "landscape") {
          workingLandscape = dataUrl;
        } else {
          workingPortrait = dataUrl;
        }
        refreshPreviews();
        switchMode("portfolio"); // return to preview
        showToast("New image uploaded and applied to preview ✓");
      } catch (err) {
        alert("Failed to process image: " + err.message);
      } finally {
        uploadBrowseBtn.textContent = "Browse Files...";
        uploadBrowseBtn.disabled = false;
      }
    }

    // Custom Path Input
    applyCustomPathBtn.addEventListener("click", () => {
      const val = (customPathInput.value || "").trim();
      if (!val) return;
      if (activeTarget === "landscape") {
        workingLandscape = val;
      } else {
        workingPortrait = val;
      }
      refreshPreviews();
      showToast("Path applied to preview ✓");
    });

    // Reset Defaults
    resetBtn.addEventListener("click", () => {
      if (confirm("Reset splash screens back to default photographs?")) {
        workingLandscape = DEFAULTS.landscape;
        workingPortrait = DEFAULTS.portrait;
        refreshPreviews();
        showToast("Reset to defaults ✓");
      }
    });

    // Save and Apply
    saveBtn.addEventListener("click", async () => {
      saveBtn.textContent = "Saving...";
      saveBtn.disabled = true;

      const finalConfig = {
        landscape: workingLandscape,
        portrait: workingPortrait
      };

      await saveSplashConfig(finalConfig);
      saveBtn.textContent = "Saved ✓";

      setTimeout(() => {
        overlay.remove();
        showToast("Splash screens updated and saved to cloud ✓");
      }, 400);
    });

    // Close & Cancel
    closeBtn.addEventListener("click", () => overlay.remove());
    cancelBtn.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // Initial render
    refreshPreviews();
  }

  // Initialize Trigger on Splash Screen & Listeners
  function initSplashCustomiser() {
    updateSplashImage();

    // Orientation change listener
    const splashMql = window.matchMedia("(max-width: 768px), (orientation: portrait)");
    if (splashMql.addEventListener) {
      splashMql.addEventListener("change", updateSplashImage);
    } else if (splashMql.addListener) {
      splashMql.addListener(updateSplashImage);
    }

    // Cloud background sync
    syncSplashConfigFromCloud();

    // Ensure any stray button on splash page is removed so public visitors never see it
    const existingBtn = document.getElementById("splash-customise-btn");
    if (existingBtn) existingBtn.remove();
  }

  // Expose global API
  window.getActiveSplashSettings = getActiveSplashSettings;
  window.updateSplashImage = updateSplashImage;
  window.openSplashCustomiserModal = openSplashCustomiserModal;
  window.initSplashCustomiser = initSplashCustomiser;

  // Auto-init when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSplashCustomiser);
  } else {
    initSplashCustomiser();
  }
})();
