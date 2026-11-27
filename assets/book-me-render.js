/* ==========================================================
   Book Me Dynamic Renderer (Unified Single-Page Editorial Layout)
   - Hero banner with studio availability & travel stamps
   - Studio Sessions & Rates upfront with inline tiers & example lightbox
   - Direct "Get in Touch" form (Name, Email, Message required;
     Session/Package & Inspiration Images optional)
   - The Space & The Approach narrative
   - Short-notice cancellation waitlist & FAQ callout bars
   ========================================================== */

(function() {
  "use strict";

  let selectedInspirationFiles = [];

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

  function getPackageById(id) {
    const pkgs = window.BOOK_ME_DATA && window.BOOK_ME_DATA.packages;
    if (!pkgs) return null;
    return pkgs.find(p => p.id === id) || null;
  }

  function getPackageDemoImages(pkgId) {
    const D = window.BOOK_ME_DATA;
    if (D && D.showcases) {
      const sc = D.showcases.find(s => s.id === pkgId);
      if (sc && Array.isArray(sc.images) && sc.images.length > 0) {
        return sc.images.map((item, idx) => {
          if (typeof item === "string") return { src: item, alt: `Example ${idx + 1}` };
          return { src: item.src || item.url || "", alt: item.alt || `Example ${idx + 1}` };
        });
      }
    }
    return [
      { src: `photos/book-me/${pkgId}/01_01.jpg`, alt: "Example 1" },
      { src: `photos/book-me/${pkgId}/02_02.jpg`, alt: "Example 2" },
      { src: `photos/book-me/${pkgId}/03_03.jpg`, alt: "Example 3" }
    ];
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

  function buildPackageOptionsHtml(packages) {
    if (!Array.isArray(packages)) return "";
    return packages.map((pkg) => {
      const hasMultiOptions = !pkg.isCustomQuote && Array.isArray(pkg.options) && pkg.options.length > 1;
      if (hasMultiOptions) {
        const groupLabel = pkg.title || "";
        const generalVal = `${pkg.title} (${pkg.price})`;
        const tierOptionsHtml = pkg.options.map((opt) => {
          const tierPrice = Number(opt.price) > 0
            ? formatPrice(opt.price)
            : ((opt.priceFormatted && opt.priceFormatted !== "£0") ? opt.priceFormatted : pkg.price);
          const tierVal = `${pkg.title} — ${opt.countText || opt.label} (${tierPrice})`;
          return `<option value="${escapeHtml(tierVal)}">${escapeHtml(pkg.title)} &mdash; ${escapeHtml(opt.countText || opt.label)} (${escapeHtml(tierPrice)})</option>`;
        }).join("");
        return `
          <optgroup label="${escapeHtml(groupLabel)}">
            <option value="${escapeHtml(generalVal)}" data-pkg-id="${escapeHtml(pkg.id)}">${escapeHtml(generalVal)}</option>
            ${tierOptionsHtml}
          </optgroup>
        `;
      }

      const optVal = pkg.isCustomQuote ? pkg.title : `${pkg.title} (${pkg.price})`;
      return `<option value="${escapeHtml(optVal)}" data-pkg-id="${escapeHtml(pkg.id)}">${escapeHtml(optVal)}</option>`;
    }).join("");
  }

  function buildTierListHtml(pkg) {
    if (!pkg || pkg.isCustomQuote || !Array.isArray(pkg.options) || pkg.options.length === 0) {
      return "";
    }
    const tierRows = pkg.options.map((opt) => {
      const priceLabel = (Number(opt.price) > 0)
        ? formatPrice(opt.price)
        : ((opt.priceFormatted && opt.priceFormatted !== "£0") ? opt.priceFormatted : pkg.price);
      return `
        <div class="bm-simple-tier-row">
          <span>${escapeHtml(opt.countText || opt.label)}</span>
          <strong>${escapeHtml(priceLabel)}</strong>
        </div>
      `;
    }).join("");

    const addonRows = (Array.isArray(pkg.addOns) && pkg.addOns.length > 0)
      ? pkg.addOns.map((addon) => {
          const addonPrice = addon.priceFormatted || formatPrice(addon.price);
          return `
            <div class="bm-simple-tier-row bm-simple-tier-row--addon">
              <span>${escapeHtml(addon.label)} (optional)</span>
              <strong>+${escapeHtml(addonPrice)}</strong>
            </div>
          `;
        }).join("")
      : "";

    return `
      <div class="bm-simple-tier-list">
        ${tierRows}
        ${addonRows}
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

    wrap.innerHTML = `
      <div class="bm-page--original">
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

        <!-- 2. Studio Sessions & Rates -->
        <section class="bm-simple-rates-section" id="book-shoot-section">
          <div class="bm-simple-sec-head">
            <div>
              <span class="bm-sec-num">STUDIO SESSIONS &amp; RATES</span>
              <h2>sessions &amp; pricing</h2>
            </div>
            <button type="button" class="bm-jump-enquire-link" id="bm-top-jump-enquire">jump to enquiry form &darr;</button>
          </div>

          <div class="bm-simple-rates-grid">
            ${packages.map((pkg) => `
              <article class="bm-simple-rate-card" data-package-id="${escapeHtml(pkg.id)}">
                <div class="bm-simple-card-top">
                  ${pkg.details ? `<span class="bm-simple-duration">${escapeHtml(pkg.details)}</span>` : ""}
                  <div class="bm-simple-title-row">
                    <h3>${escapeHtml(pkg.title)}</h3>
                    <span class="bm-simple-price">${escapeHtml(pkg.price)}</span>
                  </div>
                </div>
                <p class="bm-simple-desc">${escapeHtml(pkg.fullDesc || pkg.desc)}</p>
                ${buildTierListHtml(pkg)}
                <div class="bm-simple-card-actions">
                  ${!pkg.isCustomQuote ? `
                    <button type="button" class="bm-simple-link-btn bm-view-examples-btn" data-pkg-id="${escapeHtml(pkg.id)}">view examples &nearr;</button>
                  ` : `<span></span>`}
                  <button type="button" class="bm-simple-enquire-btn" data-pkg-id="${escapeHtml(pkg.id)}">enquire &darr;</button>
                </div>
              </article>
            `).join("")}
          </div>

          <p class="bm-simple-deposit-note">A 50% deposit secures your slot once we&rsquo;ve confirmed a date together &mdash; nothing is paid upfront when enquiring.</p>
        </section>

        <!-- 3. Direct Get in Touch -->
        <section class="bm-contact-section bm-simple-enquire-section" id="bm-contact-section">
          <div class="bm-contact-grid">
            <div class="bm-contact-hero-img">
              <img src="${escapeHtml(contactHero)}" alt="Studio portrait by Koray Hussein" loading="lazy">
            </div>
            <div class="bm-contact-form-side">
              <span class="bm-tag">direct studio contact</span>
              <h2>get in touch</h2>
              <p class="bm-enquire-lead">Just let me know what you&rsquo;re looking to shoot, any dates in mind, or any questions &mdash; I&rsquo;ll get back to you personally.</p>

              <form class="editorial-contact-form bm-simple-enquiry-form" data-subject="New Booking Enquiry — korayhussein.com">
                <div class="form-row form-row--duo">
                  <div class="form-group">
                    <label for="bm-enq-name">your name *</label>
                    <input type="text" id="bm-enq-name" name="name" placeholder="First &amp; last name" required>
                  </div>
                  <div class="form-group">
                    <label for="bm-enq-email">email address *</label>
                    <input type="email" id="bm-enq-email" name="email" placeholder="name@domain.com" required>
                  </div>
                </div>

                <div class="form-group">
                  <label for="bm-optional-package-select">session / package <span class="bm-opt-tag">(optional)</span></label>
                  <select id="bm-optional-package-select" name="SELECTED_PACKAGE">
                    <option value="">&mdash; no specific package / general enquiry &mdash;</option>
                    ${buildPackageOptionsHtml(packages)}
                  </select>
                </div>

                <div class="form-group">
                  <label for="bm-enq-message">your message *</label>
                  <textarea id="bm-enq-message" name="message" rows="5" placeholder="Tell me what you need, any preferred dates, links to your book or Instagram, or any questions..." required></textarea>
                </div>

                <div class="form-group bm-inspiration-group bm-inspiration-group--compact">
                  <label>inspiration or reference images <span class="bm-opt-tag">(optional)</span></label>
                  <div class="bm-dropzone bm-dropzone--compact" id="bm-dropzone" role="button" tabindex="0">
                    <input type="file" id="bm-inspiration-files" name="attachment" multiple accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" class="bm-file-input">
                    <div class="bm-dropzone-inline">
                      <span class="bm-dropzone-prompt-wrap">
                        <svg class="bm-dropzone-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <span class="bm-dropzone-prompt">Drag &amp; drop images or <span class="bm-browse-link">browse files</span></span>
                      </span>
                      <span class="bm-dropzone-hint">Up to 6 images (JPG, PNG, HEIC, PDF)</span>
                    </div>
                  </div>
                  <div class="bm-inspiration-previews" id="bm-inspiration-previews"></div>
                </div>

                <div class="form-submit-wrap">
                  <button type="submit" class="editorial-submit-btn">
                    <span>send message &rarr;</span>
                  </button>
                  <span class="direct-email-hint">or email directly at <a href="mailto:${escapeHtml(directEmail)}">${escapeHtml(directEmail)}</a></span>
                </div>
              </form>
            </div>
          </div>
        </section>

        <!-- 4. The Space & The Approach -->
        <section class="bm-studio-approach-section">
          <div class="bm-features-duo-grid">
            ${features.map(f => `
              <div class="bm-feature-block">
                <span class="bm-tag">${escapeHtml(f.tag)}</span>
                <h3>${escapeHtml(f.title)}</h3>
                <p>${escapeHtml(f.body)}</p>
              </div>
            `).join("")}
          </div>
        </section>

        <!-- 5. Cancellation Notification List & FAQ Bars -->
        <section class="bm-footer-callouts-section">
          <div class="bm-cancellation-callout-bar">
            <div class="bm-cancellation-callout-text">
              <span class="bm-cancellation-pulse">&#9679;</span>
              <span>Looking to book in at short notice? Leave your details and I&rsquo;ll get in touch if a cancellation happens.</span>
            </div>
            <a href="${window.getCustomPageHref ? window.getCustomPageHref("cancellations") : "#/cancellations"}" class="bm-cancellation-callout-link">register interest &rarr;</a>
          </div>

          <div class="bm-faq-link-bar">
            <span>Have questions about studio prep, image delivery, or booking guidelines?</span>
            <a href="${window.getCustomPageHref ? window.getCustomPageHref("faq") : "#/faq"}" class="bm-faq-direct-link">view frequently asked questions &rarr;</a>
          </div>
        </section>
      </div>
    `;

    container.appendChild(wrap);

    const formEl = wrap.querySelector(".bm-simple-enquiry-form");
    const selectEl = wrap.querySelector("#bm-optional-package-select");
    const contactSec = wrap.querySelector("#bm-contact-section");
    const nameInput = wrap.querySelector("#bm-enq-name");
    const emailInput = wrap.querySelector("#bm-enq-email");
    const msgInput = wrap.querySelector("#bm-enq-message");

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

    const scrollToEnquiryForm = (focusField) => {
      if (contactSec) {
        contactSec.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (focusField && typeof focusField.focus === "function") {
        try {
          focusField.focus({ preventScroll: true });
        } catch (err) {
          focusField.focus();
        }
      }
    };

    // Jump link at top of sessions section
    const topJumpBtn = wrap.querySelector("#bm-top-jump-enquire");
    if (topJumpBtn) {
      topJumpBtn.addEventListener("click", () => {
        const hasIdentity = nameInput && nameInput.value.trim() && emailInput && emailInput.value.trim();
        scrollToEnquiryForm(hasIdentity ? msgInput : nameInput);
      });
    }

    // View Examples lightbox buttons
    wrap.querySelectorAll(".bm-view-examples-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pkgId = btn.dataset.pkgId;
        const pkg = getPackageById(pkgId);
        const demoImages = getPackageDemoImages(pkgId);
        if (typeof window.openLightbox === "function" && demoImages.length > 0) {
          const titlePrefix = pkg ? pkg.title : "Studio Session";
          const lbImages = demoImages.map((img, i) => ({
            src: img.src,
            alt: `${titlePrefix} — Example ${i + 1}`,
            filename: `${titlePrefix} — Example ${i + 1}`
          }));
          window.openLightbox(lbImages, 0);
        }
      });
    });

    // Enquire buttons on each session card
    wrap.querySelectorAll(".bm-simple-enquire-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pkgId = btn.dataset.pkgId;
        if (selectEl && pkgId) {
          const targetOpt = Array.from(selectEl.options).find(o => o.dataset.pkgId === pkgId);
          if (targetOpt) {
            selectEl.value = targetOpt.value;
            syncSubjectFromSelect();
          }
        }
        const hasIdentity = nameInput && nameInput.value.trim() && emailInput && emailInput.value.trim();
        scrollToEnquiryForm(hasIdentity ? msgInput : nameInput);
      });
    });

    // Reset dynamic subject if user resets form cleanly
    if (formEl) {
      formEl.addEventListener("reset", () => {
        setTimeout(syncSubjectFromSelect, 0);
      });
    }

    // Compact optional dropzone
    setupDropzone(wrap);

    // Handle pre-selected package from legacy route #/book-me/:pkgId
    if (preselectPkgId && selectEl) {
      const targetOpt = Array.from(selectEl.options).find(o => o.dataset.pkgId === preselectPkgId);
      if (targetOpt) {
        selectEl.value = targetOpt.value;
        syncSubjectFromSelect();
        setTimeout(() => {
          if (contactSec) {
            contactSec.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 60);
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

    // Support legacy #/book-me/:pkgId links by pre-selecting & scrolling smoothly to form
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
          // Preserve in-progress user input, focus & scroll during background cloud sync
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

          renderSimpleBookMePage(mainEl, null);

          const nextNameEl = mainEl.querySelector("#bm-enq-name");
          const nextEmailEl = mainEl.querySelector("#bm-enq-email");
          const nextSelectEl = mainEl.querySelector("#bm-optional-package-select");
          const nextMsgEl = mainEl.querySelector("#bm-enq-message");
          const nextFormEl = mainEl.querySelector(".bm-simple-enquiry-form");

          if (nextNameEl && savedState.name) nextNameEl.value = savedState.name;
          if (nextEmailEl && savedState.email) nextEmailEl.value = savedState.email;
          if (nextSelectEl && savedState.pkg) {
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
          if (savedScrollY > 0) {
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
