/* ==========================================================
   About Me Page — Refined Classic Layout
   A modern facelift of Koray's original portfolio structure:
   1. Hero photograph (2.jpg)
   2. First-person biography
   3. Subtle hairline divider
   4. Studio Location + Google Maps
   5. Say hello. section (Portrait + Contact Form)
   ========================================================== */

(function() {
  "use strict";

  window.renderAboutMePage = function(container) {
    const D = window.ABOUT_ME_DATA;
    if (!container || !D) return;

    // Load any saved bio paragraphs or body text
    const bioParas = (D.bio && D.bio.paragraphs && D.bio.paragraphs.length)
      ? D.bio.paragraphs
      : (D.bio && typeof D.bio.body === "string" && D.bio.body.trim())
        ? D.bio.body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
        : [
            "Challenging the notion that strength and power are masculine traits, my work draws out each whilst still maintaining the true essence of femininity. These are traits that can only be captured when the model is happy, comfortable and relaxed, and I work hard to maintain the best working environment for each and every person I work with. If all three are achieved and everybody is on the same page, then the images will fall into place.",
            "When it comes to my travel work, I mainly shoot in a street style so as to properly capture the mood and character of each location. No two places are the same, and I try to reflect that in my work."
          ];

    const contactPhoto = D.contactPhoto || "photos/contact/DSCF8633.jpg";
    const studioDirections = (D.studio && D.studio.directions) || "My studio is located a short three minute walk from Hackney Wick station, inside Grow Studios.\n\nTo get to the studio from the station you just turn left when coming out, through the small tunnel, then turn right and then right again. You should find yourself in the area's car park. Grow Studio is at the end of the car park on the right.";
    const dirParas = typeof studioDirections === "string" ? studioDirections.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean) : [studioDirections];

    let H = {};
    try {
      const dedicated = localStorage.getItem("kh_header_about-me");
      if (dedicated) {
        H = JSON.parse(dedicated) || {};
      } else {
        const customRaw = localStorage.getItem("kh_custom_headers");
        if (customRaw) {
          const parsed = JSON.parse(customRaw);
          if (parsed && parsed["about-me"]) H = parsed["about-me"];
        }
      }
    } catch(e) {}
    if (window._KH_HEADERS && window._KH_HEADERS["about-me"]) {
      H = { ...H, ...window._KH_HEADERS["about-me"] };
    }
    H = { ...((D && D.header) || {}), ...H };

    if (typeof window.syncPageHeader === "function") {
      window.syncPageHeader("about-me");
    }

    const heroImg = H.heroImage || (D.meta && D.meta.heroImage) || 'photos/contact/2.jpg';
    const heroImgMobile = H.heroImageMobile || H.heroMobileImage || H.heroImage || (D.meta && D.meta.heroImage) || 'photos/contact/DSCF8633.jpg';
    const heroMobileAspect = H.heroMobileAspect || '4 / 5';
    const mobileSrcset = heroImgMobile.startsWith("data:") ? heroImgMobile : encodeURI(heroImgMobile);
    const isMobileViewport = typeof window !== "undefined" && window.innerWidth <= 768;
    const initialHeroImgSrc = (isMobileViewport && mobileSrcset) ? mobileSrcset : heroImg;

    container.innerHTML = `
      <article class="about-classic-wrap">
        <!-- 1. Unified Cinematic Hero Banner -->
        <header class="cinematic-hero-banner">
          <div class="cinematic-hero-banner__img-box" style="--hero-mobile-aspect: ${heroMobileAspect};">
            <picture>
              <source media="(max-width: 768px)" srcset="${mobileSrcset}">
              <img src="${initialHeroImgSrc}" alt="Portrait photography by Koray Hussein" loading="eager">
            </picture>
            <div class="cinematic-hero-banner__scrim"></div>
          </div>
          <div class="cinematic-hero-banner__content">
            ${((D.header && D.header.tag) || (D.meta && D.meta.tag)) ? `
              <div class="cinematic-hero-tag-row">
                <span class="cinematic-hero-tag">${(D.header && D.header.tag) || D.meta.tag}</span>
              </div>
            ` : ''}
            <h1 class="cinematic-hero-title">${(D.header && D.header.title) || (D.meta && D.meta.title) || 'about me'}</h1>
            <p class="cinematic-hero-lead">${(D.header && D.header.intro) || (D.bio && D.bio.lead) || "I'm Koray Hussein, a portrait and travel photographer based in London, England."}</p>
          </div>
        </header>

        <!-- 2. Biography Text -->
        <section class="about-classic-bio">
          ${bioParas.map(p => `<p>${p}</p>`).join("")}
        </section>

        <hr class="about-classic-divider">

        <!-- 3. Studio Location + Live Google Map -->
        <section class="about-classic-studio-section">
          <div class="about-classic-studio-grid">
            <div class="about-classic-studio-info">
              <h2 class="about-classic-heading">${(D.studio && D.studio.name) ? `${D.studio.name} Location` : 'Studio Location'}</h2>
              ${dirParas.map(p => `<p>${p}</p>`).join("")}
              <div class="about-classic-studio-actions">
                <a href="${(D.studio && D.studio.googleMapsUrl) || 'https://www.google.com/maps/search/?api=1&query=Grow+Studios+92+Wallis+Road+Hackney+Wick+London+E9+5LN'}" target="_blank" rel="noopener" class="about-classic-link">
                  <span>Open in Google Maps &nearr;</span>
                </a>
                <button type="button" class="about-classic-link about-classic-link--btn" id="about-copy-address-btn" data-address="${(D.studio && D.studio.address && D.studio.address.full) || 'Grow Studios, 92 Wallis Road, Hackney Wick, London E9 5LN'}">
                  <span>Copy Address</span>
                </button>
              </div>
            </div>

            <div class="about-classic-map-wrapper">
              <iframe
                src="${(D.studio && D.studio.embedUrl) || 'https://maps.google.com/maps?q=Grow%20Studios%2C%2092%20Wallis%20Road%2C%20Hackney%20Wick%2C%20London%20E9%205LN&t=&z=16&ie=UTF8&iwloc=&output=embed'}"
                title="Grow Studios Location Map"
                loading="lazy"
                allowfullscreen
                referrerpolicy="no-referrer-when-downgrade">
              </iframe>
            </div>
          </div>
        </section>

        <hr class="about-classic-divider">

        <!-- 4. Say Hello Section (Portrait + Contact Form) -->
        <section class="about-classic-contact-section">
          <h2 class="about-classic-heading about-classic-heading--center">Say hello.</h2>

          <div class="about-classic-contact-grid">
            <div class="about-classic-contact-photo">
              <img src="${contactPhoto}" alt="Koray Hussein Portrait" loading="lazy">
            </div>

            <div class="about-classic-contact-form-wrap">
              <form class="editorial-contact-form about-classic-form" data-subject="New Website Message — korayhussein.com">
                <div class="form-group">
                  <label for="contact-name">Name</label>
                  <input type="text" id="contact-name" name="name" placeholder="Your name" required>
                </div>

                <div class="form-group">
                  <label for="contact-email">Email</label>
                  <input type="email" id="contact-email" name="email" placeholder="name@domain.com" required>
                </div>

                <div class="form-group">
                  <label for="contact-message">Message</label>
                  <textarea id="contact-message" name="message" rows="8" placeholder="Your message..." required></textarea>
                </div>

                <div class="form-submit-wrap">
                  <button type="submit" class="editorial-submit-btn">
                    <span>Send Message &rarr;</span>
                  </button>
                  <span class="direct-email-hint">or email directly to <a href="mailto:contact@korayhussein.com">contact@korayhussein.com</a></span>
                </div>
              </form>
            </div>
          </div>
        </section>
      </article>
    `;

    // Copy Address Handler
    const copyBtn = container.querySelector("#about-copy-address-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const addr = copyBtn.dataset.address || "Grow Studios, 92 Wallis Road, Hackney Wick, London E9 5LN";
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(addr).then(() => {
            const span = copyBtn.querySelector("span");
            if (span) {
              const prev = span.textContent;
              span.textContent = "Address Copied!";
              setTimeout(() => { span.textContent = prev; }, 2000);
            }
          });
        }
      });
    }
  };

  function refreshAboutMeHeroBanner() {
    const slug = (location.hash || "").replace(/^#\/?/, "").split("/")[0];
    if (slug === "about-me" || slug === "contact") {
      const D = window.ABOUT_ME_DATA || {};
      let H = (D.header && typeof D.header === "object") ? { ...D.header } : {};
      try {
        const raw = localStorage.getItem("kh_custom_headers");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed["about-me"]) {
            H = { ...parsed["about-me"], ...H };
          }
        }
      } catch(e) {}
      if (typeof window.updateLiveHeroBannerInDOM === "function") {
        window.updateLiveHeroBannerInDOM("about-me", H);
      }
    }
  }

  window.addEventListener("kh_about_me_updated", refreshAboutMeHeroBanner);
  window.addEventListener("kh_headers_updated", refreshAboutMeHeroBanner);
})();
