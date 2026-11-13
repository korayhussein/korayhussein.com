/* ==========================================================
   Cancellation Notifications & Priority List Page Renderer
   Bespoke editorial client-facing interface for Koray Hussein.
   ========================================================== */

(function() {
  "use strict";

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderCancellationsPage() {
    const main = document.getElementById("main-content");
    if (!main) return;

    window.scrollTo({ top: 0, behavior: "instant" });
    main.innerHTML = "";

    const store = window.CANCELLATIONS_DATA || {};
    const data = store.loadCancellationsData ? store.loadCancellationsData() : {};
    const intro = data.introCard || (store.DEFAULT_DATA ? store.DEFAULT_DATA.introCard : null) || {};
    const formConfig = data.formConfig || (store.DEFAULT_DATA ? store.DEFAULT_DATA.formConfig : null) || {};
    const opening = data.currentOpening || {};

    function getIntroParagraphs(ic) {
      if (ic && typeof ic.body === "string" && ic.body.trim()) {
        return ic.body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
      }
      const paras = [];
      if (ic && ic.paragraph1) paras.push(ic.paragraph1.trim());
      if (ic && ic.paragraph2) paras.push(ic.paragraph2.trim());
      if (paras.length > 0) return paras;
      return [
        "When a scheduled commercial shoot, agency test, or portfolio booking moves dates at short notice, an unexpected studio or location session opens up.",
        "Once you enter your information below, you will be added directly to my private cancellation list. Whenever a suitable last-minute slot opens up that matches what you are looking for, I will email you personally so you can take the slot before it is shared publicly."
      ];
    }

    const wrap = document.createElement("div");
    wrap.className = "cancellations-page-wrap";

    // Build Current Opening Section HTML if active
    let openingHtml = "";
    if (opening && opening.isActive) {
      openingHtml = `
        <section class="kh-cn-opening-card" id="kh-cn-live-opening">
          <div class="kh-cn-opening-header">
            <div class="kh-cn-badge-cluster">
              <span class="kh-cn-live-pulse" aria-hidden="true"></span>
              <span class="kh-cn-live-label">open slot available now &middot; short notice</span>
            </div>
            <span class="kh-cn-tag">short notice booking</span>
          </div>

          <div class="kh-cn-opening-body">
            <div class="kh-cn-opening-main">
              <h2 class="kh-cn-opening-date">${escapeHtml(opening.date || 'Upcoming Opening')}</h2>
              <div class="kh-cn-opening-meta">
                <span class="kh-cn-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  ${escapeHtml(opening.time || 'Full / Half Day Session')}
                </span>
                <span class="kh-cn-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  ${escapeHtml(opening.location || 'London Daylight Studio')}
                </span>
                <span class="kh-cn-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  ${escapeHtml(opening.sessionType || 'Editorial / Model Portfolio')}
                </span>
              </div>

              ${opening.message ? `
                <div class="kh-cn-message-box">
                  <p class="kh-cn-message-text">&ldquo;${escapeHtml(opening.message)}&rdquo;</p>
                  <span class="kh-cn-message-author">&mdash; Koray Hussein</span>
                </div>
              ` : ''}

              ${opening.rateNote ? `
                <div class="kh-cn-rate-badge">
                  <span class="kh-cn-rate-icon">&dagger;</span>
                  <span>${escapeHtml(opening.rateNote)}</span>
                </div>
              ` : ''}
            </div>

            <div class="kh-cn-opening-actions">
              <button type="button" class="kh-btn-primary kh-cn-claim-btn" id="kh-cn-claim-slot-btn">
                Claim This Slot &rarr;
              </button>
              <span class="kh-cn-claim-note">First to confirm takes the date. Priority given to immediate bookings.</span>
            </div>
          </div>
        </section>
      `;
    }

    let H = data.header || {};
    try {
      const customRaw = localStorage.getItem("kh_custom_headers");
      if (customRaw) {
        const parsed = JSON.parse(customRaw);
        if (parsed && parsed["cancellations"]) {
          H = { ...H, ...parsed["cancellations"] };
        }
      }
    } catch(e) {}
    const heroImg = H.heroImage || 'photos/faq/Tara Wagner 1.jpg';
    const heroImgMobile = H.heroImageMobile || H.heroMobileImage || 'photos/black-and-white/004 Flavia Santiago 2.jpg';
    const heroMobileAspect = H.heroMobileAspect || '4 / 5';
    const mobileSrcset = heroImgMobile.startsWith("data:") ? heroImgMobile : encodeURI(heroImgMobile);

    wrap.innerHTML = `
      <!-- 1. Unified Cinematic Hero Banner -->
      <header class="cinematic-hero-banner">
        <div class="cinematic-hero-banner__img-box" style="--hero-mobile-aspect: ${heroMobileAspect};">
          <picture>
            <source media="(max-width: 768px)" srcset="${escapeHtml(mobileSrcset)}">
            <img src="${heroImg}" alt="Short notice booking notifications" loading="eager" style="object-position: center 30%;">
          </picture>
          <div class="cinematic-hero-banner__scrim"></div>
        </div>
        <div class="cinematic-hero-banner__content">
          <div class="cinematic-hero-tag-row">
            <span class="cinematic-hero-tag">${H.tag || 'short notice bookings &middot; last-minute openings'}</span>
          </div>
          <h1 class="cinematic-hero-title">${H.title || 'short notice bookings'}</h1>
          <p class="cinematic-hero-lead">${H.subtitle || ''}</p>
        </div>
      </header>

      <div class="kh-cn-container">
        <!-- Live Opening Callout (if active) -->
        ${openingHtml}

        <!-- Writing Section Explaining Personal Email Notifications -->
        <section class="kh-cn-editorial-intro" style="margin-bottom: 36px;">
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px; padding: clamp(24px, 4vw, 36px);">
            <span class="kh-cn-section-tag" style="margin-bottom: 8px;">${escapeHtml(intro.tag || 'short notice notification list')}</span>
            <h2 class="cinematic-hero-title" style="font-size: clamp(24px, 3.2vw, 36px); line-height: 1.15; margin: 6px 0 16px; color: var(--text);">
              ${escapeHtml(intro.heading || 'direct notifications for short-notice studio dates')}
            </h2>
            <div style="font-family: var(--font-caslon); font-size: var(--font-size-body, 20px); line-height: 1.7; color: var(--text);">
              ${getIntroParagraphs(intro).map(p => `<p style="margin: 0 0 14px 0;">${escapeHtml(p)}</p>`).join("")}
            </div>
          </div>
        </section>

        <!-- Sign-Up Form -->
        <section class="kh-cn-signup-section" id="signup-section">
          <div class="kh-cn-signup-card">
            <div class="kh-cn-signup-header">
              <span class="kh-cn-section-tag">${escapeHtml(formConfig.tag || 'join the list')}</span>
              <h2 class="kh-cn-signup-title">${escapeHtml(formConfig.title || 'enter your details')}</h2>
              <p class="kh-cn-signup-subtitle">${escapeHtml(formConfig.subtitle || "Fill in the fields below. I'll reach out directly by email as soon as an opening arises.")}</p>
            </div>

            <form id="kh-cn-signup-form" class="kh-cn-form" novalidate>
              <div class="kh-cn-form-grid">
                <!-- Name -->
                <div class="kh-cn-form-group">
                  <label for="cn-name" class="kh-cn-label">Full Name <span class="kh-cn-req">*</span></label>
                  <input type="text" id="cn-name" name="name" class="kh-cn-input" placeholder="e.g. freja beha" required autocomplete="name">
                </div>

                <!-- Email -->
                <div class="kh-cn-form-group">
                  <label for="cn-email" class="kh-cn-label">Email Address <span class="kh-cn-req">*</span></label>
                  <input type="email" id="cn-email" name="email" class="kh-cn-input" placeholder="e.g. name@agency.com" required autocomplete="email">
                </div>

                <!-- Instagram / Website -->
                <div class="kh-cn-form-group">
                  <label for="cn-social" class="kh-cn-label">Instagram Handle / Website <span class="kh-cn-req">*</span></label>
                  <input type="text" id="cn-social" name="socialOrWebsite" class="kh-cn-input" placeholder="@yourhandle or website link" required>
                </div>

                <!-- Booking As -->
                <div class="kh-cn-form-group">
                  <label for="cn-booking-as" class="kh-cn-label">Booking As <span class="kh-cn-req">*</span></label>
                  <select id="cn-booking-as" name="bookingAs" class="kh-cn-select">
                    ${(formConfig.bookingAsOptions || [
                      "model (direct booking)",
                      "agency (for represented model)",
                      "actor / creative headshots",
                      "other creative"
                    ]).map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join("")}
                  </select>
                </div>

                <!-- Shoot Focus -->
                <div class="kh-cn-form-group">
                  <label for="cn-shoot-type" class="kh-cn-label">Shoot Focus <span class="kh-cn-req">*</span></label>
                  <select id="cn-shoot-type" name="shootType" class="kh-cn-select">
                    ${(formConfig.shootTypeOptions || [
                      "portfolio shoot",
                      "beauty shoot",
                      "polaroids"
                    ]).map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join("")}
                  </select>
                </div>

                <!-- Time of Day -->
                <div class="kh-cn-form-group">
                  <label for="cn-time-of-day" class="kh-cn-label">Rough Time Most Likely Available <span class="kh-cn-req">*</span></label>
                  <select id="cn-time-of-day" name="timeOfDay" class="kh-cn-select">
                    ${(formConfig.timeOfDayOptions || [
                      "any (most flexible)",
                      "morning",
                      "daytime",
                      "evening"
                    ]).map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join("")}
                  </select>
                </div>
              </div>

              <div class="kh-cn-form-footer">
                <button type="submit" class="kh-btn-primary kh-cn-submit-btn" id="cn-submit-btn">
                  ${escapeHtml(formConfig.submitButtonText || 'Register for Short Notice Alerts &rarr;')}
                </button>
                <div class="kh-cn-privacy-note">
                  <span>${escapeHtml(formConfig.privacyNote || '🔒 Strictly confidential. I will only contact you personally when a suitable opening occurs.')}</span>
                </div>
              </div>
            </form>

            <!-- Success State (Hidden initially) -->
            <div id="kh-cn-success-box" class="kh-cn-success-box" style="display: none;">
              <div class="kh-cn-success-icon">&#10003;</div>
              <h3 class="kh-cn-success-title">${escapeHtml(formConfig.successTitle || "you're on the short notice notification list")}</h3>
              <p class="kh-cn-success-desc">
                ${escapeHtml(formConfig.successDesc || "Thank you for joining. Whenever an unexpected cancellation or short-notice opening arises, you will receive an immediate private notification at your email address.")}
              </p>
              <div class="kh-cn-success-actions">
                <a href="#/book-me" class="kh-btn-secondary">&larr; Return to Book a Shoot</a>
                <a href="#/portfolio" class="kh-btn-secondary">View Main Portfolio &rarr;</a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Claim Slot Modal Mount -->
      <div id="kh-cn-claim-modal-mount"></div>
    `;

    main.appendChild(wrap);

    // Bind Claim Button
    const claimBtn = wrap.querySelector("#kh-cn-claim-slot-btn");
    if (claimBtn) {
      claimBtn.addEventListener("click", () => {
        openClaimSlotModal(opening);
      });
    }

    // Bind Sign Up Form Submit
    const form = wrap.querySelector("#kh-cn-signup-form");
    const successBox = wrap.querySelector("#kh-cn-success-box");

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const nameInput = form.querySelector("#cn-name");
        const emailInput = form.querySelector("#cn-email");
        const socialInput = form.querySelector("#cn-social");
        const bookingAsSelect = form.querySelector("#cn-booking-as");
        const shootTypeSelect = form.querySelector("#cn-shoot-type");
        const timeOfDaySelect = form.querySelector("#cn-time-of-day");

        if (!nameInput.value.trim() || !emailInput.value.trim() || !emailInput.value.includes("@")) {
          alert("Please enter a valid name and email address.");
          return;
        }

        const entry = {
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          socialOrWebsite: socialInput ? socialInput.value.trim() : "",
          bookingAs: bookingAsSelect ? bookingAsSelect.value : "model (direct booking)",
          shootType: shootTypeSelect ? shootTypeSelect.value : "portfolio shoot",
          timeOfDay: timeOfDaySelect ? timeOfDaySelect.value : "any"
        };

        if (window.CANCELLATIONS_DATA && window.CANCELLATIONS_DATA.addSubscriber) {
          window.CANCELLATIONS_DATA.addSubscriber(entry);
        }

        // Show tranquil success state
        form.style.display = "none";
        successBox.style.display = "block";
        successBox.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }

  function openClaimSlotModal(opening) {
    const mount = document.getElementById("kh-cn-claim-modal-mount");
    if (!mount) return;

    mount.innerHTML = `
      <div class="kh-modal-backdrop" id="kh-cn-claim-modal">
        <div class="kh-modal-window kh-modal-window--narrow">
          <div class="kh-modal-head">
            <div>
              <span class="kh-studio-badge">&#9679; Priority Opening</span>
              <h3 style="margin-top:4px; font-family:var(--font-caslon); font-size:24px; text-transform:lowercase;">claim cancellation slot</h3>
            </div>
            <button type="button" class="kh-modal-close" id="kh-cn-claim-close-btn">&times;</button>
          </div>

          <div class="kh-modal-body" style="padding:24px;">
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:16px; border-radius:4px; margin-bottom:20px;">
              <div style="font-family:var(--font-caslon); font-size:20px; color:var(--text); margin-bottom:4px;">${escapeHtml(opening.date)}</div>
              <div style="font-size:12px; color:var(--text-muted); line-height:1.5;">
                ${escapeHtml(opening.time)} &middot; ${escapeHtml(opening.location)}<br>
                ${escapeHtml(opening.sessionType)}
              </div>
            </div>

            <p style="font-size:13px; line-height:1.5; color:var(--text); margin-bottom:20px;">
              To secure this slot immediately, send a direct message below. First confirmed booking locks the date.
            </p>

            <form id="kh-cn-claim-form" style="display:flex; flex-direction:column; gap:14px;">
              <div>
                <label style="display:block; font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">Your Name *</label>
                <input type="text" id="claim-name" class="kh-input" required placeholder="e.g. Maya Lin">
              </div>
              <div>
                <label style="display:block; font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">Your Email *</label>
                <input type="email" id="claim-email" class="kh-input" required placeholder="e.g. maya@agency.com">
              </div>
              <div>
                <label style="display:block; font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">Phone / WhatsApp *</label>
                <input type="tel" id="claim-phone" class="kh-input" required placeholder="e.g. +44 7700 900123">
              </div>
              <div>
                <label style="display:block; font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px;">Message / Shoot Requirements</label>
                <textarea id="claim-message" class="kh-textarea" rows="3" placeholder="Brief note on what you would like to shoot during this slot..."></textarea>
              </div>

              <div style="display:flex; gap:10px; margin-top:8px;">
                <button type="submit" class="kh-btn-primary" style="flex:1;">Send Booking Request &rarr;</button>
                <button type="button" class="kh-btn-secondary" id="claim-direct-email-btn">Direct Email</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    const close = () => { mount.innerHTML = ""; };
    const closeBtn = mount.querySelector("#kh-cn-claim-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", close);

    const directEmailBtn = mount.querySelector("#claim-direct-email-btn");
    if (directEmailBtn) {
      directEmailBtn.addEventListener("click", () => {
        const subject = encodeURIComponent(`Claiming Cancellation Slot: ${opening.date}`);
        const body = encodeURIComponent(`Hi Koray,\n\nI would like to take the cancellation slot for:\nDate: ${opening.date}\nTime: ${opening.time}\nLocation: ${opening.location}\n\nPlease let me know if this is still available.\n\nBest,\n`);
        window.location.href = `mailto:koray@korayhussein.com?subject=${subject}&body=${body}`;
        close();
      });
    }

    const claimForm = mount.querySelector("#kh-cn-claim-form");
    if (claimForm) {
      claimForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = mount.querySelector("#claim-name").value.trim();
        const email = mount.querySelector("#claim-email").value.trim();
        const phone = mount.querySelector("#claim-phone").value.trim();
        const msg = mount.querySelector("#claim-message").value.trim();

        const subject = encodeURIComponent(`Cancellation Slot Booking Request: ${opening.date} (${name})`);
        const body = encodeURIComponent(`Hi Koray,\n\nI would like to claim the cancellation slot for ${opening.date}.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nShoot details:\n${msg}\n\nBest regards,\n${name}`);
        window.location.href = `mailto:koray@korayhussein.com?subject=${subject}&body=${body}`;

        mount.innerHTML = `
          <div class="kh-modal-backdrop">
            <div class="kh-modal-window kh-modal-window--narrow" style="text-align:center; padding:36px 24px;">
              <div style="font-size:32px; color:#d1b48c; margin-bottom:12px;">&#10003;</div>
              <h3 style="font-family:var(--font-caslon); font-size:24px; margin-bottom:8px;">request sent</h3>
              <p style="font-size:13px; color:var(--text-muted); line-height:1.5; margin-bottom:20px;">
                Your request to claim the ${escapeHtml(opening.date)} slot has been submitted. Koray will get back to you immediately to confirm the booking.
              </p>
              <button type="button" class="kh-btn-primary" id="claim-done-btn">Done</button>
            </div>
          </div>
        `;
        document.getElementById("claim-done-btn").addEventListener("click", close);
      });
    }
  }

  // Live re-render on cloud update
  window.addEventListener("kh_cancellations_updated", () => {
    const slug = (location.hash || "").replace(/^#\/?/, "").trim();
    if (slug === "cancellations" || slug === "cancellation" || slug === "cancel") {
      renderCancellationsPage();
    }
  });

  // Export to window
  window.renderCancellationsPage = renderCancellationsPage;

})();
