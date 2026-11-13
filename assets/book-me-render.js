/* ==========================================================
   Book Me Dynamic Renderer
   - Dedicated Session Pages (#/book-me/:packageId)
   - Studio Sessions & Rates cards on main #/book-me
   - The Space & The Approach narrative at bottom of main page
   - Full booking customisation, live totals & enquiry form
   - Shoot inspiration image upload & moodboard link
   ========================================================== */

(function() {
  "use strict";

  let selectedOptionIndex = 0;
  let polaroidAddonChecked = false;
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
    return pkgs.find(p => p.id === id) || pkgs[0];
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
      { src: `photos/book-me/${pkgId}/01_01.jpg`, alt: `Example 1` },
      { src: `photos/book-me/${pkgId}/02_02.jpg`, alt: `Example 2` },
      { src: `photos/book-me/${pkgId}/03_03.jpg`, alt: `Example 3` }
    ];
  }

  function calculateTotal(pkg) {
    if (!pkg) return 0;
    const opt = (pkg.options && pkg.options[selectedOptionIndex]) || (pkg.options && pkg.options[0]);
    let base = opt ? opt.price : 0;
    if (polaroidAddonChecked && pkg.addOns && pkg.addOns.length > 0) {
      base += pkg.addOns[0].price;
    }
    return base;
  }

  function getBookingSummaryText(pkg) {
    if (!pkg) return "";
    if (pkg.isCustomQuote) {
      return `${pkg.title} · Tailored bespoke commission — Quote upon enquiry`;
    }
    const opt = (pkg.options && pkg.options[selectedOptionIndex]) || (pkg.options && pkg.options[0]);
    const optText = opt ? `${opt.label} (${formatPrice(opt.price)})` : "";
    const addonText = (polaroidAddonChecked && pkg.addOns && pkg.addOns.length > 0) 
      ? ` + Polaroids Add-on (${formatPrice(pkg.addOns[0].price)})` 
      : "";
    const total = calculateTotal(pkg);
    const depositText = pkg.hasDeposit ? ` (50% deposit to secure: ${formatPrice(Math.round(total / 2))})` : "";
    return `${pkg.title} · ${optText}${addonText} — Total: ${formatPrice(total)}${depositText}`;
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
          ${isImg ? `<img src="${thumbUrl}" alt="${file.name}">` : `<div class="bm-doc-icon">DOC</div>`}
        </div>
        <div class="bm-preview-meta">
          <span class="bm-preview-name" title="${file.name}">${file.name}</span>
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

  /* ---------------------------------------------------------
     Dedicated Package Page Render (Atelier Dossier Design)
     --------------------------------------------------------- */
  function renderDedicatedPackagePage(container, pkg) {
    if (!pkg) return;

    window.scrollTo({ top: 0, behavior: "instant" });
    selectedOptionIndex = 0;
    if (pkg.options && pkg.options.length > 0) {
      const defIdx = pkg.options.findIndex(o => o.default);
      if (defIdx >= 0) selectedOptionIndex = defIdx;
    }
    polaroidAddonChecked = false;
    selectedInspirationFiles = [];

    container.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.className = "book-page-wrap bm-dedicated-pkg-wrap";

    const demoImages = getPackageDemoImages(pkg.id);
    const hasAddons = pkg.addOns && pkg.addOns.length > 0;
    const polaroidAddon = hasAddons ? pkg.addOns[0] : null;
    const opt = (pkg.options && pkg.options[selectedOptionIndex]) || (pkg.options && pkg.options[0]);
    let total = calculateTotal(pkg);

    const sessionsPlural = pkg.title.toLowerCase().endsWith("session")
      ? pkg.title.toLowerCase().replace(/session$/, "sessions")
      : `${pkg.title.toLowerCase()} sessions`;

    const allPackages = (window.BOOK_ME_DATA && window.BOOK_ME_DATA.packages) || [];
    const otherPackages = allPackages.filter(p => p.id !== pkg.id);

    wrap.innerHTML = `
      <div class="bm-pkg-page">
        <!-- Top Navigation Bar with Back Link -->
        <nav class="bm-pkg-nav-bar" aria-label="Breadcrumb">
          <a href="#/book-me" class="bm-pkg-back-btn" id="bm-pkg-back-link">
            <span class="bm-pkg-back-arrow">&larr;</span>
            <span>all studio sessions</span>
          </a>
          <div class="bm-pkg-nav-badge">
            <span class="bm-tag">${escapeHtml(pkg.category)}</span>
          </div>
        </nav>

        <!-- Session Masthead -->
        <header class="bm-pkg-masthead">
          <span class="bm-pkg-sub">${escapeHtml(pkg.details)}</span>
          <h1 class="bm-pkg-title">${escapeHtml(pkg.title)}</h1>
          <div class="bm-pkg-price-badge">
            <span class="bm-pkg-price-label">${pkg.isCustomQuote ? 'pricing' : 'starting from'}</span>
            <span class="bm-pkg-price-val">${escapeHtml(pkg.price)}</span>
          </div>
        </header>

        <!-- Visual Reference Gallery (3 Example Photos) -->
        <section class="bm-pkg-gallery-section">
          <div class="bm-incard-heading">
            <span class="bm-incard-hint">visual reference for ${escapeHtml(sessionsPlural)}</span>
            <span class="bm-pkg-gallery-count">3 example photographs &middot; click to expand</span>
          </div>
          <div class="bm-incard-cards-trio bm-pkg-cards-trio">
            ${demoImages.map((img, i) => `
              <div class="bm-incard-photo-tile" data-demo-idx="${i}" role="button" tabindex="0" title="Click to view Example ${i + 1}" aria-label="View Example ${i + 1} in fullscreen lightbox" style="border: none !important; padding: 0 !important; background: transparent !important; box-shadow: none !important; outline: none !important;">
                <div class="bm-frame" style="border: none !important; padding: 0 !important; background: transparent !important; box-shadow: none !important; outline: none !important; width: 100%; height: auto; overflow: visible;">
                  <img src="${escapeHtml(img.src)}" alt="Example ${i + 1}" loading="lazy" style="border: none !important; outline: none !important; box-shadow: none !important; display: block; width: 100%; height: auto; max-width: 100%; object-fit: contain;">
                </div>
                <div class="bm-incard-photo-label" style="border: none !important; border-top: none !important; outline: none !important; padding: 8px 0 0; margin-top: 6px;">
                  <span class="bm-photo-tag">Example ${i + 1}</span>
                  <span class="bm-photo-expand-tag">&plus; expand</span>
                </div>
              </div>
            `).join("")}
          </div>
        </section>

        <!-- Session Narrative Overview -->
        <section class="bm-pkg-overview-section">
          <span class="bm-tag">session overview</span>
          <p class="bm-pkg-full-desc">${escapeHtml(pkg.fullDesc || pkg.desc)}</p>
        </section>

        <!-- Booking Customiser & Direct Enquiry Form -->
        <section class="bm-pkg-booking-section">
          <div class="bm-pkg-config-box">
            <span class="bm-tag">package customisation</span>

            <!-- Tier Options -->
            ${pkg.options && pkg.options.length > 1 ? `
              <div class="bm-config-section">
                <label class="bm-config-label">1. choose your image package</label>
                <div class="bm-tier-options">
                  ${pkg.options.map((option, idx) => `
                    <label class="bm-tier-card ${idx === selectedOptionIndex ? 'is-selected' : ''}" data-opt-idx="${idx}">
                      <input type="radio" name="bm_tier_option" value="${idx}" ${idx === selectedOptionIndex ? 'checked' : ''}>
                      <div class="bm-tier-info">
                        <span class="bm-tier-name">${escapeHtml(option.label)}</span>
                        <span class="bm-tier-sub">${escapeHtml(option.countText)}</span>
                      </div>
                      <div class="bm-tier-price">${escapeHtml(option.priceFormatted)}</div>
                    </label>
                  `).join("")}
                </div>
              </div>
            ` : `
              <div class="bm-config-section">
                <label class="bm-config-label">package includes</label>
                <div class="bm-tier-single">
                  <span class="bm-tier-name">${escapeHtml(pkg.options[0].label)} (${escapeHtml(pkg.options[0].countText)})</span>
                  <span class="bm-tier-price">${escapeHtml(pkg.options[0].priceFormatted)}</span>
                </div>
              </div>
            `}

            <!-- Add-ons -->
            ${hasAddons && polaroidAddon ? `
              <div class="bm-config-section">
                <label class="bm-config-label">2. optional studio add-on</label>
                <label class="bm-addon-card ${polaroidAddonChecked ? 'is-selected' : ''}" id="bm-dedicated-addon-card">
                  <div class="bm-addon-checkbox-wrap">
                    <input type="checkbox" id="bm_dedicated_polaroid_check" ${polaroidAddonChecked ? 'checked' : ''}>
                    <span class="bm-addon-custom-check"></span>
                  </div>
                  <div class="bm-addon-info">
                    <div class="bm-addon-title-row">
                      <span class="bm-addon-title">${escapeHtml(polaroidAddon.label)}</span>
                      <span class="bm-addon-price">+${escapeHtml(polaroidAddon.priceFormatted)}</span>
                    </div>
                    <p class="bm-addon-note">${escapeHtml(polaroidAddon.desc || 'Clean, natural light digitals for agencies, scouts & casting directors (front & 45° headshots, 3/4 and full length).')}</p>
                  </div>
                </label>
              </div>
            ` : ''}

            <!-- Estimate & Terms Summary -->
            <div class="bm-pkg-estimate-card">
              <div class="bm-pricing-notice-box" role="note">
                <div class="bm-pricing-notice-inner">
                  <span class="bm-pricing-notice-icon">&#10022;</span>
                  <p class="bm-pricing-notice-text">${pkg.isCustomQuote ? "Each bespoke or commercial commission is quoted specifically based on your deliverables, licensing, and production scope. Submit your request below to receive a custom quote." : "The prices are for reference only. The deposit is not due until we've set a final date and time. Submit this booking request to get in touch."}</p>
                </div>
              </div>
              <div class="bm-pkg-estimate-row">
                <div class="bm-pkg-estimate-item">
                  <span class="bm-total-label">${pkg.isCustomQuote ? 'quote type' : 'session estimate'}</span>
                  <div class="bm-total-amount" id="bm-dedicated-total-amount">${pkg.isCustomQuote ? 'bespoke quote' : formatPrice(total)}</div>
                </div>
                ${pkg.hasDeposit ? `
                  <div class="bm-deposit-line" id="bm-dedicated-deposit-wrap">
                    <span class="bm-deposit-badge">50% deposit to secure slot</span>
                    <span class="bm-deposit-val" id="bm-dedicated-deposit-val">${formatPrice(Math.round(total / 2))}</span>
                  </div>
                ` : ''}
              </div>
              ${pkg.depositNote ? `
                <div class="bm-drawer-policy-note">
                  <span class="bm-policy-icon">&bull;</span> ${escapeHtml(pkg.depositNote)}
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Direct Booking Enquiry Form -->
          <div class="bm-pkg-form-card">
            <div class="bm-pkg-form-header">
              <span class="bm-tag">direct booking enquiry</span>
              <h3>request this shoot</h3>
              <p class="bm-pkg-form-sub">Drop your details below and I'll be in touch within 24 hours to confirm date availability and shoot details.</p>
            </div>

            <form class="editorial-contact-form bm-custom-booking-form" data-subject="${pkg.isCustomQuote ? `New Bespoke Commission Request — ${escapeHtml(pkg.title)} — korayhussein.com` : `New Booking Request — ${escapeHtml(pkg.title)} (${formatPrice(total)}) — korayhussein.com`}">
              <input type="hidden" name="SELECTED_PACKAGE" value="${escapeHtml(pkg.title)}">
              <input type="hidden" name="IMAGE_PACKAGE" id="bm-hidden-image-package" value="${escapeHtml(opt ? opt.label : '')} (${escapeHtml(opt ? opt.countText : '')})">
              <input type="hidden" name="POLAROIDS_ADDON" id="bm-hidden-polaroids-addon" value="${polaroidAddonChecked ? 'Yes (+£70)' : 'No'}">
              <input type="hidden" name="ESTIMATED_TOTAL" id="bm-hidden-estimated-total" value="${pkg.isCustomQuote ? 'Bespoke / Custom Quote' : formatPrice(total)}">
              ${pkg.hasDeposit ? `
                <input type="hidden" name="DEPOSIT_REQUIRED" id="bm-hidden-deposit-required" value="50% (${formatPrice(Math.round(total / 2))})">
                <input type="hidden" name="NOTICE_POLICY" value="At least 1 week notice required to move booking date">
              ` : ''}

              <div class="form-row form-row--duo">
                <div class="form-group">
                  <label>your name *</label>
                  <input type="text" name="name" placeholder="first & last name" required>
                </div>
                <div class="form-group">
                  <label>email address *</label>
                  <input type="email" name="email" placeholder="name@domain.com" required>
                </div>
              </div>

              ${(pkg.isCustomQuote || pkg.id === "all-other-enquiries") ? `
                <div class="form-group">
                  <label>instagram handle / website *</label>
                  <input type="text" name="instagram_or_website" placeholder="@yourhandle or website link" required>
                </div>

                <div class="form-row form-row--duo">
                  <div class="form-group">
                    <label>preferred shoot dates / availability</label>
                    <input type="text" name="preferred_dates" placeholder="e.g. Mid-November weekdays, specific weekend dates, or flexible...">
                  </div>
                  <div class="form-group">
                    <label>expected amount of deliverables</label>
                    <input type="text" name="expected_deliverables" placeholder="e.g. 15-20 edited images, campaign lookbook, or specific deliverables...">
                  </div>
                </div>
              ` : `
                <div class="form-row form-row--duo">
                  <div class="form-group">
                    <label>instagram handle / website *</label>
                    <input type="text" name="instagram_or_website" placeholder="@yourhandle or website link" required>
                  </div>
                  <div class="form-group">
                    <label>booking as</label>
                    <select name="booking_as">
                      <option>model (direct booking)</option>
                      <option>agency (for represented model)</option>
                      <option>actor / creative headshots</option>
                      <option>other creative</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label>preferred shoot dates / availability</label>
                  <input type="text" name="preferred_dates" placeholder="e.g. Mid-November weekdays, specific weekend dates, or flexible...">
                </div>
              `}

              <!-- Shoot Inspiration Images & Moodboard Upload -->
              <div class="form-group bm-inspiration-group">
                <label>shoot inspiration & moodboard (optional)</label>
                <div class="bm-dropzone" id="bm-dropzone" role="button" tabindex="0">
                  <input type="file" id="bm-inspiration-files" name="attachment" multiple accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" class="bm-file-input">
                  <div class="bm-dropzone-content">
                    <svg class="bm-dropzone-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <div class="bm-dropzone-text">
                      <span class="bm-dropzone-prompt">drag & drop inspiration images or <span class="bm-browse-link">browse files</span></span>
                      <span class="bm-dropzone-hint">JPG, PNG, HEIC, WEBP or PDF · up to 6 images</span>
                    </div>
                  </div>
                </div>
                <div class="bm-inspiration-previews" id="bm-inspiration-previews"></div>
                <div class="bm-inspiration-link-wrap">
                  <label class="bm-sublabel">or share a link to a moodboard (optional)</label>
                  <input type="text" name="moodboard_link" placeholder="e.g. Pinterest board, Milanote, Google Drive, or Dropbox link">
                </div>
              </div>

              <div class="form-group">
                <label>your message / shoot goals & questions *</label>
                <textarea rows="4" name="message" placeholder="Tell me about your shoot goals, ideas, styling thoughts, or any questions you have..." required></textarea>
              </div>

              <div class="form-submit-wrap">
                <button type="submit" class="editorial-submit-btn">
                  <span>send booking request &rarr;</span>
                </button>
                <span class="direct-email-hint">or email directly to <a href="mailto:${(window.BOOK_ME_DATA && window.BOOK_ME_DATA.contact && window.BOOK_ME_DATA.contact.email) || 'bookings@korayhussein.com'}">${(window.BOOK_ME_DATA && window.BOOK_ME_DATA.contact && window.BOOK_ME_DATA.contact.email) || 'bookings@korayhussein.com'}</a> for custom or multi-model shoots</span>
              </div>
            </form>
          </div>
        </section>

        <!-- Other Studio Sessions Comparison Footer -->
        ${otherPackages.length > 0 ? `
          <section class="bm-pkg-other-section">
            <span class="bm-tag">explore other studio sessions</span>
            <div class="bm-pkg-other-grid">
              ${otherPackages.map(o => `
                <a href="#/book-me/${o.id}" class="bm-pkg-other-card">
                  <div class="bm-pkg-other-info">
                    <span class="bm-pkg-other-sub">${escapeHtml(o.details)}</span>
                    <h4>${escapeHtml(o.title)}</h4>
                  </div>
                  <div class="bm-pkg-other-right">
                    <span class="bm-pkg-other-price">${escapeHtml(o.price)}</span>
                    <span class="bm-pkg-other-arrow">&rarr;</span>
                  </div>
                </a>
              `).join("")}
            </div>
          </section>
        ` : ''}
      </div>
    `;

    container.appendChild(wrap);

    // Lightbox handlers for 3 example photos
    const demoTiles = wrap.querySelectorAll(".bm-incard-photo-tile");
    demoTiles.forEach((tile) => {
      const openTileLightbox = () => {
        const idx = parseInt(tile.dataset.demoIdx, 10) || 0;
        if (typeof window.openLightbox === "function") {
          const lbImages = demoImages.map((img, i) => ({
            src: img.src,
            alt: `Example ${i + 1}`,
            filename: `Example ${i + 1}`
          }));
          window.openLightbox(lbImages, idx);
        }
      };
      tile.addEventListener("click", openTileLightbox);
      tile.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openTileLightbox();
        }
      });
    });

    // Helper to update live prices & hidden form inputs without resetting form fields
    const updateLiveConfig = () => {
      const currentOpt = (pkg.options && pkg.options[selectedOptionIndex]) || (pkg.options && pkg.options[0]);
      const currentTotal = calculateTotal(pkg);

      const totalEl = wrap.querySelector("#bm-dedicated-total-amount");
      if (totalEl) totalEl.textContent = pkg.isCustomQuote ? "bespoke quote" : formatPrice(currentTotal);

      const depositValEl = wrap.querySelector("#bm-dedicated-deposit-val");
      if (depositValEl) depositValEl.textContent = formatPrice(Math.round(currentTotal / 2));

      const hiddenTotal = wrap.querySelector("#bm-hidden-estimated-total");
      if (hiddenTotal) hiddenTotal.value = pkg.isCustomQuote ? "Bespoke / Custom Quote" : formatPrice(currentTotal);

      const hiddenDeposit = wrap.querySelector("#bm-hidden-deposit-required");
      if (hiddenDeposit) hiddenDeposit.value = `50% (${formatPrice(Math.round(currentTotal / 2))})`;

      const hiddenImgPkg = wrap.querySelector("#bm-hidden-image-package");
      if (hiddenImgPkg && currentOpt) hiddenImgPkg.value = `${currentOpt.label} (${currentOpt.countText})`;

      const hiddenAddon = wrap.querySelector("#bm-hidden-polaroids-addon");
      if (hiddenAddon) hiddenAddon.value = polaroidAddonChecked ? "Yes (+£70)" : "No";

      const formEl = wrap.querySelector(".bm-custom-booking-form");
      if (formEl) {
        formEl.dataset.subject = pkg.isCustomQuote 
          ? `New Bespoke Commission Request — ${pkg.title} — korayhussein.com`
          : `New Booking Request — ${pkg.title} (${formatPrice(currentTotal)}) — korayhussein.com`;
      }

      // Update tier card highlights
      wrap.querySelectorAll(".bm-tier-card").forEach((card) => {
        const idx = parseInt(card.dataset.optIdx, 10);
        card.classList.toggle("is-selected", idx === selectedOptionIndex);
      });

      // Update addon card highlight
      const addonCard = wrap.querySelector("#bm-dedicated-addon-card");
      if (addonCard) {
        addonCard.classList.toggle("is-selected", polaroidAddonChecked);
      }
    };

    // Radios: Tier options
    wrap.querySelectorAll("input[name='bm_tier_option']").forEach(radio => {
      radio.addEventListener("change", (e) => {
        selectedOptionIndex = parseInt(e.target.value, 10) || 0;
        updateLiveConfig();
      });
    });

    // Checkbox: Add-on
    const addonCheck = wrap.querySelector("#bm_dedicated_polaroid_check");
    if (addonCheck) {
      addonCheck.addEventListener("change", (e) => {
        polaroidAddonChecked = e.target.checked;
        updateLiveConfig();
      });
    }

    // Inspiration upload dropzone
    setupDropzone(wrap);
  }

  /* ---------------------------------------------------------
     Main Book Me Page Render
     - Hero banner at top
     - Section 1: Studio Sessions & Rates (clean 3 cards linking to #/book-me/:pkgId)
     - Section 2: The Space & The Approach (moved beneath the cards!)
     - Section 3: Priority Cancellations & FAQ Bars
     --------------------------------------------------------- */
  function renderMainBookMePage(container) {
    const D = window.BOOK_ME_DATA;
    if (!D) return;

    window.scrollTo({ top: 0, behavior: "instant" });
    container.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.className = "book-page-wrap";

    // Header extraction
    let H = (D.header && typeof D.header === "object") ? { ...D.header } : {};
    try {
      const customRaw = localStorage.getItem("kh_custom_headers");
      if (customRaw) {
        const parsed = JSON.parse(customRaw);
        if (parsed && parsed["book-me"]) {
          H = { ...H, ...parsed["book-me"] };
        }
      }
    } catch(e) {}

    const heroImg = H.heroImage || 'photos/faq/Tara Wagner 1.jpg';
    const heroImgMobile = H.heroImageMobile || H.heroMobileImage || 'photos/black-and-white/004 Flavia Santiago 2.jpg';
    const heroMobileAspect = H.heroMobileAspect || '4 / 5';
    const mobileSrcset = heroImgMobile.startsWith("data:") ? heroImgMobile : encodeURI(heroImgMobile);
    const title = H.title || 'book a studio shoot';
    const intro = H.intro || "Whether you're a new model looking to get signed or an experienced model looking to refresh your book, we'll be able to create the kind of studio images you're looking for.";
    const tag = H.tag || D.tag || 'london studio booking';
    const bookingTicker = H.bookingTicker || D.bookingTicker || 'currently taking bookings for december and january';
    const travelDates = H.travelDates || [];
    const travelTickerRaw = (travelDates.length && travelDates[0]) || H.travelTicker || "paris · 12–18 may";
    const travelTicker = travelTickerRaw.replace(/^upcoming travel:\s*/i, "");
    const travelEnabled = !(D.header && D.header.travelEnabled === false);

    wrap.innerHTML = `
      <div class="bm-page--original">
        <!-- 1. Hero Banner -->
        <header class="cinematic-hero-banner">
          <div class="cinematic-hero-banner__img-box" style="--hero-mobile-aspect: ${heroMobileAspect};">
            <picture>
              <source media="(max-width: 768px)" srcset="${mobileSrcset}">
              <img src="${heroImg}" alt="Tara Wagner portrait by Koray Hussein" loading="eager">
            </picture>
            <div class="cinematic-hero-banner__scrim"></div>
          </div>

          <!-- Standalone Availability & Travel Stamps (Top-Right of Hero) -->
          <div class="cinematic-hero-stamp-wrap">
            <div class="cinematic-hero-stamp" id="header-booking-stamp">
              <span class="cinematic-hero-stamp__icon">&#10022;</span>
              <span class="cinematic-hero-stamp__text">${bookingTicker}</span>
            </div>
            ${travelEnabled ? `
              <div class="cinematic-hero-stamp cinematic-hero-stamp--travel" id="header-travel-stamp">
                <span class="cinematic-hero-stamp__icon" style="color:#d1b48c;">&#9992;&#xFE0E;</span>
                <span class="cinematic-hero-stamp__text" id="header-travel-stamp-text">upcoming travel: ${travelTicker}</span>
              </div>
            ` : ''}
          </div>

          <div class="cinematic-hero-banner__content">
            ${tag ? `
              <div class="cinematic-hero-tag-row">
                <span class="cinematic-hero-tag">${tag}</span>
              </div>
            ` : ''}
            <h1 class="cinematic-hero-title">${title}</h1>
            <p class="cinematic-hero-lead">${intro}</p>
          </div>
        </header>

        <!-- 2. Studio Sessions & Rates (FIRST: Placed directly beneath the Hero!) -->
        <section class="bm-rates-feed-section" id="book-shoot-section">
          <div class="bm-sec-header">
            <span class="bm-sec-num">STUDIO SESSIONS &amp; RATES</span>
            <h2>choose a session</h2>
            <span class="bm-sec-hint">&mdash; click any session to view imagery, package tiers &amp; book</span>
          </div>
          <div class="bm-rates-triptych-grid">
            ${D.packages.map(pkg => `
              <a href="#/book-me/${pkg.id}" class="bm-feed-rate-card bm-clickable-card" data-package-id="${pkg.id}">
                <div class="bm-feed-rate-top">
                  <div class="bm-feed-title-price">
                    <h3>${escapeHtml(pkg.title)}</h3>
                    <div class="bm-feed-rate-cost">${escapeHtml(pkg.price)}</div>
                  </div>
                </div>
                <p class="bm-feed-desc">${escapeHtml(pkg.desc)}</p>
                ${pkg.details ? `<div class="bm-feed-duration">${escapeHtml(pkg.details)}</div>` : ''}
                <div class="bm-card-action-bar">
                  <span class="bm-card-action-text">view session &amp; request to book &rarr;</span>
                </div>
              </a>
            `).join("")}
          </div>
        </section>

        <!-- 3. The Space & The Approach (MOVED TO BOTTOM: Studio story & philosophy) -->
        <section class="bm-studio-approach-section">
          <div class="bm-features-duo-grid">
            ${D.features.map(f => `
              <div class="bm-feature-block">
                <span class="bm-tag">${escapeHtml(f.tag)}</span>
                <h3>${escapeHtml(f.title)}</h3>
                <p>${escapeHtml(f.body)}</p>
              </div>
            `).join("")}
          </div>
        </section>

        <!-- 4. Cancellation Notification List & FAQ Bars -->
        <section class="bm-footer-callouts-section">
          <div class="bm-cancellation-callout-bar">
            <div class="bm-cancellation-callout-text">
              <span class="bm-cancellation-pulse">&#9679;</span>
              <span>Looking to book in at short notice? Leave your details and I'll get in touch if a cancellation happens.</span>
            </div>
            <a href="#/cancellations" class="bm-cancellation-callout-link">leave your details for cancellations &rarr;</a>
          </div>

          <div class="bm-faq-link-bar">
            <span>Have questions about studio prep, image delivery, or booking guidelines?</span>
            <a href="#/faq" class="bm-faq-direct-link">view frequently asked questions &rarr;</a>
          </div>
        </section>
      </div>
    `;

    container.appendChild(wrap);
  }

  /* ---------------------------------------------------------
     Public Route Handler: Main Page vs Dedicated Package Page
     --------------------------------------------------------- */
  window.renderBookMeEdition = function(container, slug) {
    const D = window.BOOK_ME_DATA;
    if (!D) return;

    // Detect if routing directly to a specific package page: #/book-me/:pkgId or #/book/:pkgId
    let targetPkgId = null;
    if (typeof slug === "string") {
      const match = slug.match(/^(?:book-me|book)\/([a-zA-Z0-9_-]+)/);
      if (match) targetPkgId = match[1];
    }
    if (!targetPkgId && location.hash) {
      const hashMatch = location.hash.match(/^#\/?(?:book-me|book)\/([a-zA-Z0-9_-]+)/);
      if (hashMatch) targetPkgId = hashMatch[1];
    }

    const pkg = targetPkgId ? (D.packages || []).find(p => p.id === targetPkgId) : null;
    if (pkg) {
      renderDedicatedPackagePage(container, pkg);
      return;
    }

    // Otherwise render Main Book Me Page (Sessions at top, The Space & The Approach at bottom)
    renderMainBookMePage(container);
  };

  window.renderBookMePage = window.renderBookMeEdition;

})();
