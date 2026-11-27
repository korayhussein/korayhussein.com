/* ==========================================================
   Book Me Dynamic Renderer (Minimal Original Editorial Design)
   - Hero banner with availability & travel stamps
   - Unboxed studio packages with base prices & (higher tiers available if needed)
   - Direct unboxed "get in touch" form (Name, Email, Message required;
     clean 4-option Package dropdown & single-line image attachment optional)
   - Plain Studio & Approach prose + quiet text links
   ========================================================== */

(function() {
  "use strict";

  let selectedInspirationFiles = [];
  let pendingPreselectPkgId = null;
  let preselectScrollTimer = null;

  window.getSelectedInspirationFiles = function() {
    return Array.isArray(selectedInspirationFiles) ? selectedInspirationFiles : [];
  };

  window.resetInspirationPreviews = function() {
    selectedInspirationFiles = [];
    const previewsEl = document.querySelector("#bm-inspiration-previews");
    if (previewsEl) {
      previewsEl.innerHTML = "";
      previewsEl.style.display = "none";
    }
  };

  function formatPrice(num) {
    return `£${num}`;
  }

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatSentenceCase(str) {
    const clean = String(str || "").trim();
    if (!clean) return "";
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  function updateInspirationInputAndPreviews(parentEl) {
    const fileInput = parentEl.querySelector("#bm-inspiration-files");
    const previewsEl = parentEl.querySelector("#bm-inspiration-previews");
    if (!fileInput || !previewsEl) return;

    try {
      const dt = new DataTransfer();
      selectedInspirationFiles.forEach(file => dt.items.add(file));
      fileInput.files = dt.files;
    } catch (err) {
      console.warn("DataTransfer sync notice:", err);
    }

    previewsEl.innerHTML = "";
    if (selectedInspirationFiles.length === 0) {
      previewsEl.style.display = "none";
      return;
    }
    previewsEl.style.display = "grid";

    selectedInspirationFiles.forEach((file, index) => {
      const card = document.createElement("div");
      card.className = "bm-preview-tile";
      const isImg = file.type.startsWith("image/");
      const thumbUrl = isImg ? URL.createObjectURL(file) : null;

      card.innerHTML = `
        <div class="bm-preview-media">
          ${isImg ? `<img src="${thumbUrl}" alt="${escapeHtml(file.name)}">` : `<div class="bm-doc-icon">DOC</div>`}
        </div>
        <div class="bm-preview-meta">
          <span class="bm-preview-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
          <span class="bm-preview-size">${(file.size / 1024).toFixed(0)} KB</span>
        </div>
        <button type="button" class="bm-preview-remove" data-index="${index}" aria-label="Remove image">&times;</button>
      `;

      card.querySelector(".bm-preview-remove").addEventListener("click", (e) => {
        e.stopPropagation();
        selectedInspirationFiles.splice(index, 1);
        updateInspirationInputAndPreviews(parentEl);
      });

      previewsEl.appendChild(card);
    });
  }

  function setupDropzone(parentEl) {
    const dropzone = parentEl.querySelector("#bm-dropzone");
    const fileInput = parentEl.querySelector("#bm-inspiration-files");
    if (!dropzone || !fileInput) return;

    updateInspirationInputAndPreviews(parentEl);

    dropzone.addEventListener("click", () => fileInput.click());
    dropzone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fileInput.click();
      }
    });
    fileInput.addEventListener("click", (e) => e.stopPropagation());

    fileInput.addEventListener("change", (e) => {
      const newFiles = Array.from(e.target.files || []);
      newFiles.forEach(f => {
        if (selectedInspirationFiles.length < 6 && !selectedInspirationFiles.some(existing => existing.name === f.name && existing.size === f.size)) {
          selectedInspirationFiles.push(f);
        }
      });
      updateInspirationInputAndPreviews(parentEl);
    });

    ["dragenter", "dragover"].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("is-dragover");
      });
    });

    ["dragleave", "drop"].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("is-dragover");
      });
    });

    dropzone.addEventListener("drop", (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        const droppedFiles = Array.from(dt.files);
        droppedFiles.forEach(f => {
          if (selectedInspirationFiles.length < 6 && !selectedInspirationFiles.some(existing => existing.name === f.name && existing.size === f.size)) {
            selectedInspirationFiles.push(f);
          }
        });
        updateInspirationInputAndPreviews(parentEl);
      }
    });
  }

  function buildSimpleDropdownOptionsHtml(packages) {
    if (!Array.isArray(packages)) return "";
    return packages.map((pkg) => {
      const label = formatSentenceCase(pkg.title);
      if (!label) return "";
      return `<option value="${escapeHtml(label)}" data-pkg-id="${escapeHtml(pkg.id)}">${escapeHtml(label)}</option>`;
    }).join("");
  }

  function buildPlainPackageHtml(pkg) {
    if (!pkg) return "";
    const descText = pkg.fullDesc || pkg.desc || "";

    if (pkg.isCustomQuote) {
      return `
        <div class="bm-plain-pkg-item">
          <h3>${escapeHtml(pkg.title)}</h3>
          <p class="bm-plain-pkg-desc">${escapeHtml(descText)}</p>
        </div>
      `;
    }

    const baseOpt = (Array.isArray(pkg.options) && pkg.options[0]) || null;
    const basePrice = (baseOpt && Number(baseOpt.price) > 0)
      ? formatPrice(baseOpt.price)
      : String(pkg.price || "").replace(/^from\s+/i, "");
    const hasHigherTiers = Array.isArray(pkg.options) && pkg.options.length > 1;
    const baseCount = (baseOpt && baseOpt.countText) ? baseOpt.countText : "";
    const metaParts = [pkg.details, baseCount].filter(Boolean).join(" \u00b7 ");

    return `
      <div class="bm-plain-pkg-item">
        <h3>${escapeHtml(pkg.title)}</h3>
        <p class="bm-plain-pkg-price">
          <strong>${escapeHtml(basePrice)}</strong>${hasHigherTiers ? ` <span class="bm-plain-tier-note">(higher tiers available if needed)</span>` : ""}${metaParts ? ` <span class="bm-plain-pkg-meta">&middot; ${escapeHtml(metaParts)}</span>` : ""}
        </p>
        <p class="bm-plain-pkg-desc">${escapeHtml(descText)}</p>
      </div>
    `;
  }

  function renderSimpleBookMePage(container, preselectPkgId) {
    const D = window.BOOK_ME_DATA;
    if (!D || !container) return;

    container.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.className = "book-page-wrap";

    // Header extraction
    let H = {};
    try {
      const dedicated = localStorage.getItem("kh_header_book-me");
      if (dedicated) {
        H = JSON.parse(dedicated) || {};
      } else {
        const customRaw = localStorage.getItem("kh_custom_headers");
        if (customRaw) {
          const parsed = JSON.parse(customRaw);
          if (parsed && parsed["book-me"]) H = parsed["book-me"];
        }
      }
    } catch (e) {}
    if (window._KH_HEADERS && window._KH_HEADERS["book-me"]) {
      H = { ...H, ...window._KH_HEADERS["book-me"] };
    }
    H = { ...((D && D.header) || {}), ...H };

    const heroImg = H.heroImage || "https://pub-c64c2ecfb504495cb6e4b8d1dde437c0.r2.dev/headers/book-me_desktop/headers_book-me_desktop_1794622848073.jpg";
    const heroImgMobile = H.heroImageMobile || H.heroMobileImage || H.heroImage || "https://pub-c64c2ecfb504495cb6e4b8d1dde437c0.r2.dev/headers/book-me_mobile/headers_book-me_mobile_1794622856242.jpg";
    const heroMobileAspect = H.heroMobileAspect || "4 / 5";
    const mobileSrcset = window.safeHeroUrl ? window.safeHeroUrl(heroImgMobile) : (heroImgMobile.startsWith("data:") ? heroImgMobile : encodeURI(heroImgMobile));
    const initialHeroImgSrc = window.safeHeroUrl ? window.safeHeroUrl(heroImg) : heroImg;
    const title = H.title || "book a studio shoot";
    const intro = H.intro || "Whether you're a new model looking to get signed or an experienced model looking to refresh your book, we'll be able to create the kind of studio images you're looking for.";
    const tag = H.tag || D.tag || "london studio booking";
    const bookingTicker = H.bookingTicker || D.bookingTicker || "currently taking bookings for december and january";
    const travelDates = H.travelDates || [];
    const travelTickerRaw = (travelDates.length && travelDates[0]) || H.travelTicker || "paris · 12–18 may";
    const travelTicker = travelTickerRaw.replace(/^upcoming travel:\s*/i, "");
    const travelEnabled = (typeof H.travelEnabled === "boolean")
      ? H.travelEnabled
      : !(D.header && D.header.travelEnabled === false);

    const directEmail = (D.contact && D.contact.email) || "contact@korayhussein.com";
    const contactHero = (D.contact && D.contact.hero) || "photos/book-me/tara 10.jpg";
    const packages = Array.isArray(D.packages) ? D.packages : [];
    const features = Array.isArray(D.features) ? D.features : [];
    const cancellationsHref = window.getCustomPageHref ? window.getCustomPageHref("cancellations") : "#/cancellations";
    const faqHref = window.getCustomPageHref ? window.getCustomPageHref("faq") : "#/faq";

    wrap.innerHTML = `
      <div class="bm-minimal-page">
        <!-- 1. Hero Banner -->
        <header class="cinematic-hero-banner">
          <div class="cinematic-hero-banner__img-box" style="--hero-mobile-aspect: ${heroMobileAspect};">
            <picture>
              <source media="(max-width: 768px)" srcset="${mobileSrcset}">
              <img src="${initialHeroImgSrc}" alt="Tara Wagner portrait by Koray Hussein" loading="eager">
            </picture>
            <div class="cinematic-hero-banner__scrim"></div>
          </div>

          <div class="cinematic-hero-stamp-wrap">
            <div class="cinematic-hero-stamp" id="header-booking-stamp">
              <span class="cinematic-hero-stamp__icon">&#10022;</span>
              <span class="cinematic-hero-stamp__text">${escapeHtml(bookingTicker)}</span>
            </div>
            ${travelEnabled ? `
              <div class="cinematic-hero-stamp cinematic-hero-stamp--travel" id="header-travel-stamp">
                <span class="cinematic-hero-stamp__icon" style="color:#d1b48c;">&#9992;&#xFE0E;</span>
                <span class="cinematic-hero-stamp__text" id="header-travel-stamp-text">upcoming travel: ${escapeHtml(travelTicker)}</span>
              </div>
            ` : ""}
          </div>

          <div class="cinematic-hero-banner__content">
            ${tag ? `
              <div class="cinematic-hero-tag-row">
                <span class="cinematic-hero-tag">${escapeHtml(tag)}</span>
              </div>
            ` : ""}
            <h1 class="cinematic-hero-title">${escapeHtml(title)}</h1>
            <p class="cinematic-hero-lead">${escapeHtml(intro)}</p>
          </div>
        </header>

        <!-- 2. Packages & Base Rates (Pure Unboxed Editorial Prose) -->
        <section class="bm-plain-packages" id="book-shoot-section">
          ${packages.map(buildPlainPackageHtml).join("")}
          <p class="bm-plain-deposit-note">A 50% deposit secures your date once confirmed.</p>
        </section>

        <hr class="bm-plain-divider">

        <!-- 3. Direct Get in Touch (Unboxed Two-Column Desktop / Direct Form Mobile) -->
        <section class="bm-plain-contact" id="bm-contact-section">
          <div class="bm-plain-contact-photo">
            <img src="${escapeHtml(contactHero)}" alt="Studio portrait by Koray Hussein" loading="lazy">
          </div>
          <div class="bm-plain-contact-form-wrap">
            <h2>get in touch</h2>

            <form class="editorial-contact-form bm-plain-form" data-subject="New Booking Enquiry — korayhussein.com">
              <div class="form-row form-row--duo">
                <div class="form-group">
                  <label for="bm-enq-name">name *</label>
                  <input type="text" id="bm-enq-name" name="name" placeholder="Your name" required>
                </div>
                <div class="form-group">
                  <label for="bm-enq-email">email *</label>
                  <input type="email" id="bm-enq-email" name="email" placeholder="your@email.com" required>
                </div>
              </div>

              <div class="form-group">
                <label for="bm-optional-package-select">package <span class="bm-opt-tag">(optional)</span></label>
                <select id="bm-optional-package-select" name="SELECTED_PACKAGE">
                  <option value="">Select a package (optional)</option>
                  ${buildSimpleDropdownOptionsHtml(packages)}
                </select>
              </div>

              <div class="form-group">
                <label for="bm-enq-message">message *</label>
                <textarea id="bm-enq-message" name="message" rows="4" placeholder="Let me know what you're looking for, preferred dates, or any questions..." required></textarea>
              </div>

              <div class="form-group bm-plain-attach-group">
                <div class="bm-plain-attach-bar" id="bm-dropzone" role="button" tabindex="0">
                  <input type="file" id="bm-inspiration-files" name="attachment" multiple accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" class="bm-file-input">
                  <span class="bm-plain-attach-label">+ Attach reference images <span class="bm-opt-tag">(optional, up to 6)</span></span>
                </div>
                <div class="bm-inspiration-previews" id="bm-inspiration-previews"></div>
              </div>

              <div class="form-submit-wrap">
                <button type="submit" class="editorial-submit-btn">
                  <span>send message &rarr;</span>
                </button>
                <span class="direct-email-hint">or email <a href="mailto:${escapeHtml(directEmail)}">${escapeHtml(directEmail)}</a></span>
              </div>
            </form>
          </div>
        </section>

        ${features.length > 0 ? `
          <hr class="bm-plain-divider">

          <!-- 4. About the Studio & About Me -->
          <section class="bm-plain-story">
            <div class="bm-features-duo-grid">
              ${features.map(f => `
                <div class="bm-feature-block">
                  <h3>${escapeHtml(f.title)}</h3>
                  <p>${escapeHtml(f.body)}</p>
                </div>
              `).join("")}
            </div>
          </section>
        ` : ""}

        <hr class="bm-plain-divider">

        <!-- 5. Quiet Footer Links -->
        <footer class="bm-plain-footer-links">
          <p>Looking for a short-notice slot? <a href="${escapeHtml(cancellationsHref)}">Join the cancellation list &rarr;</a> &nbsp;&middot;&nbsp; <a href="${escapeHtml(faqHref)}">Frequently asked questions &rarr;</a></p>
        </footer>
      </div>
    `;

    container.appendChild(wrap);

    const formEl = wrap.querySelector(".bm-plain-form");
    const selectEl = wrap.querySelector("#bm-optional-package-select");

    const syncSubjectFromSelect = () => {
      if (!formEl || !selectEl) return;
      const val = (selectEl.value || "").trim();
      formEl.dataset.subject = val
        ? `New Booking Enquiry — ${val} — korayhussein.com`
        : "New Booking Enquiry — korayhussein.com";
    };

    if (selectEl) {
      selectEl.addEventListener("change", syncSubjectFromSelect);
    }

    if (formEl) {
      formEl.addEventListener("reset", () => {
        setTimeout(syncSubjectFromSelect, 0);
      });
    }

    setupDropzone(wrap);

    // Handle pre-selected package from legacy route #/book-me/:pkgId
    if (preselectPkgId && selectEl) {
      const targetOpt = Array.from(selectEl.options).find(o => o.dataset.pkgId === preselectPkgId);
      if (targetOpt) {
        selectEl.value = targetOpt.value;
        syncSubjectFromSelect();
        if (preselectScrollTimer) clearTimeout(preselectScrollTimer);
        preselectScrollTimer = setTimeout(() => {
          const liveContactSec = document.getElementById("bm-contact-section");
          if (liveContactSec) {
            liveContactSec.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          pendingPreselectPkgId = null;
          preselectScrollTimer = null;
        }, 160);
      }
    }
  }

  /* ---------------------------------------------------------
     Public Route Handler: Single-Page Book Me + Legacy Sub-Route
     --------------------------------------------------------- */
  window.renderBookMeEdition = function(container, slug) {
    const D = window.BOOK_ME_DATA;
    if (!D) return;

    window.scrollTo({ top: 0, behavior: "instant" });
    selectedInspirationFiles = [];
    if (preselectScrollTimer) {
      clearTimeout(preselectScrollTimer);
      preselectScrollTimer = null;
    }

    let targetPkgId = null;
    if (typeof slug === "string") {
      const match = slug.match(/^(?:book-me|book)\/([a-zA-Z0-9_-]+)/);
      if (match) targetPkgId = match[1].split("?")[0];
    }
    if (!targetPkgId && location.hash) {
      const resolved = window.resolveCanonicalRoute ? window.resolveCanonicalRoute(location.hash) : null;
      if (resolved && resolved.canonicalBase === "book-me" && resolved.subPath) {
        targetPkgId = resolved.subPath.split("/")[0].split("?")[0];
      } else {
        const hashMatch = location.hash.match(/^#\/?(?:book-me|book)\/([a-zA-Z0-9_-]+)/);
        if (hashMatch) targetPkgId = hashMatch[1].split("?")[0];
      }
    }

    pendingPreselectPkgId = targetPkgId || null;
    renderSimpleBookMePage(container, targetPkgId);
  };

  window.renderBookMePage = window.renderBookMeEdition;

  function refreshBookMeIfActive(e) {
    const rawSlug = (location.hash || "").replace(/^#\/?/, "").split("/")[0].split("?")[0];
    const currentSlug = window.resolveCanonicalRoute ? window.resolveCanonicalRoute(location.hash).canonicalBase : rawSlug;
    if (currentSlug === "book-me" || currentSlug === "book") {
      if (e && e.type === "kh_book_me_updated") {
        const mainEl = document.querySelector("#main-content") || document.querySelector("main");
        if (mainEl) {
          const savedScrollY = window.scrollY;
          const activeId = document.activeElement && document.activeElement.id ? document.activeElement.id : null;
          const prevNameEl = mainEl.querySelector("#bm-enq-name");
          const prevEmailEl = mainEl.querySelector("#bm-enq-email");
          const prevSelectEl = mainEl.querySelector("#bm-optional-package-select");
          const prevMsgEl = mainEl.querySelector("#bm-enq-message");

          const savedState = {
            name: prevNameEl ? prevNameEl.value : "",
            email: prevEmailEl ? prevEmailEl.value : "",
            pkg: prevSelectEl ? prevSelectEl.value : "",
            message: prevMsgEl ? prevMsgEl.value : ""
          };

          const shouldReplayPreselect = Boolean(pendingPreselectPkgId && savedScrollY < 100);
          renderSimpleBookMePage(mainEl, shouldReplayPreselect ? pendingPreselectPkgId : null);

          const nextNameEl = mainEl.querySelector("#bm-enq-name");
          const nextEmailEl = mainEl.querySelector("#bm-enq-email");
          const nextSelectEl = mainEl.querySelector("#bm-optional-package-select");
          const nextMsgEl = mainEl.querySelector("#bm-enq-message");
          const nextFormEl = mainEl.querySelector(".bm-plain-form");

          if (nextNameEl && savedState.name) nextNameEl.value = savedState.name;
          if (nextEmailEl && savedState.email) nextEmailEl.value = savedState.email;
          if (!shouldReplayPreselect && nextSelectEl && savedState.pkg) {
            const optExists = Array.from(nextSelectEl.options).some(o => o.value === savedState.pkg);
            if (optExists) {
              nextSelectEl.value = savedState.pkg;
              if (nextFormEl) {
                nextFormEl.dataset.subject = `New Booking Enquiry — ${savedState.pkg} — korayhussein.com`;
              }
            }
          }
          if (nextMsgEl && savedState.message) nextMsgEl.value = savedState.message;

          if (activeId) {
            const focusTarget = document.getElementById(activeId);
            if (focusTarget && typeof focusTarget.focus === "function") {
              try {
                focusTarget.focus({ preventScroll: true });
              } catch (err) {
                focusTarget.focus();
              }
            }
          }
          if (!shouldReplayPreselect && savedScrollY > 0) {
            window.scrollTo({ top: savedScrollY, behavior: "instant" });
          }
          return;
        }
      }

      const D = window.BOOK_ME_DATA || {};
      const secondary = (e && e.detail && (e.detail["book-me"] || e.detail.header)) || D.header || {};
      let primary = (window._KH_HEADERS && window._KH_HEADERS["book-me"]) || null;
      if (!primary) {
        try {
          const raw = localStorage.getItem("kh_header_book-me");
          if (raw) primary = JSON.parse(raw);
        } catch (err) {}
      }
      const data = { ...secondary, ...(primary || {}) };
      if (data && typeof window.updateLiveHeroBannerInDOM === "function") {
        window.updateLiveHeroBannerInDOM("book-me", data);
      }
    }
  }

  window.addEventListener("kh_book_me_updated", refreshBookMeIfActive);
  window.addEventListener("kh_headers_updated", refreshBookMeIfActive);

})();
