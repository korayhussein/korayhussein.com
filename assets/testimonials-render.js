/* ==========================================================
   Testimonials Dynamic Renderer — Option 2: Atelier Masonry
   Peter Lindbergh 90s Fashion Editorial Aesthetic
   ========================================================== */

(function() {
  "use strict";

  function getFormHTML(form) {
    return `
      <section class="tm-form-section">
        <div class="tm-form-wrap">
          <div class="tm-sec-header">
            <span class="tm-sec-num">SUBMIT / FEEDBACK</span>
            <h2>${form.title}</h2>
            <p class="tm-form-sub">${form.subtitle}</p>
          </div>
          <form class="editorial-contact-form" data-subject="New Testimonial — korayhussein.com">
            <div class="form-row form-row--duo">
              <div class="form-group">
                <label>your name</label>
                <input type="text" name="name" placeholder="first & last name" required>
              </div>
              <div class="form-group">
                <label>socials / portfolio link</label>
                <input type="text" name="socials" placeholder="@instagram or website link">
              </div>
            </div>
            <div class="form-group">
              <label>your testimonial / review</label>
              <textarea rows="5" name="testimonial" placeholder="share your experience shooting together..." required></textarea>
            </div>
            <div class="form-submit-wrap">
              <button type="submit" class="editorial-submit-btn">
                <span>send testimonial &rarr;</span>
              </button>
              <span class="direct-email-hint">or email directly to <a href="mailto:contact@korayhussein.com">contact@korayhussein.com</a></span>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getTestimonialsHeaderConfig() {
    try {
      const raw = localStorage.getItem("kh_custom_headers");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed["testimonials"]) {
          return parsed["testimonials"];
        }
      }
    } catch (e) {}
    if (window.TESTIMONIALS_DATA && window.TESTIMONIALS_DATA.header) {
      return window.TESTIMONIALS_DATA.header;
    }
    return {
      tag: "words & experiences",
      title: "testimonials",
      intro: "Kind words from agency represented models, actors, and creative collaborators over the years.",
      heroImage: "photos/testimonials/header.jpg"
    };
  }

  window.renderTestimonialsPage = function(container) {
    const D = window.TESTIMONIALS_DATA;
    if (!D) return;

    let items = D.items || [];
    try {
      const customRaw = localStorage.getItem("kh_custom_testimonials");
      if (customRaw) {
        const customItems = JSON.parse(customRaw);
        if (Array.isArray(customItems) && customItems.length > 0) {
          items = customItems;
        }
      }
    } catch (e) {}

    const H = getTestimonialsHeaderConfig();
    const heroImage = H.heroImage || (D.header && D.header.heroImage) || "photos/testimonials/header.jpg";
    const heroImgMobile = H.heroImageMobile || (D.header && (D.header.heroImageMobile || D.header.heroMobileImage)) || heroImage || "photos/sets/sheyla/011_16.jpg";
    const heroMobileAspect = H.heroMobileAspect || (D.header && D.header.heroMobileAspect) || '4 / 5';
    const mobileSrcset = heroImgMobile.startsWith("data:") ? heroImgMobile : encodeURI(heroImgMobile);
    const title = H.title || (D.header && D.header.title) || "testimonials";
    const tag = H.tag || (D.header && D.header.tag) || "words & experiences";
    const lead = H.intro || H.subtitle || (D.header && (D.header.subtitle || D.header.intro)) || "";

    container.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.className = "testimonials-page-wrap";

    wrap.innerHTML = `
      <!-- 1. Unified Cinematic Hero Banner -->
      <header class="cinematic-hero-banner">
        <div class="cinematic-hero-banner__img-box" style="--hero-mobile-aspect: ${heroMobileAspect};">
          <picture>
            <source media="(max-width: 768px)" srcset="${escapeHtml(mobileSrcset)}">
            <img src="${heroImage}" alt="${escapeHtml(title)}" loading="eager">
          </picture>
          <div class="cinematic-hero-banner__scrim"></div>
        </div>
        <div class="cinematic-hero-banner__content">
          <div class="cinematic-hero-tag-row">
            <span class="cinematic-hero-tag">${escapeHtml(tag)}</span>
          </div>
          <h1 class="cinematic-hero-title">${escapeHtml(title)}</h1>
          ${lead ? `<p class="cinematic-hero-lead">${escapeHtml(lead)}</p>` : ''}
        </div>
      </header>

      <!-- 3-Column Fashion Atelier Grid -->
      <div class="tm-v2-grid">
        ${items.map(it => `
          <article class="tm-v2-card">
            <div class="tm-v2-media">
              <img src="${it.image}" alt="${it.name}" loading="lazy">
            </div>
            <div class="tm-v2-body">
              <div class="tm-v2-header">
                <h3 class="tm-v2-name">${it.name}</h3>
                ${it.handle ? `<a href="${it.href}" target="_blank" rel="noopener" class="tm-v2-handle">${it.handle}</a>` : ''}
              </div>
              <p class="tm-v2-quote">&ldquo;${it.quote.replace(/\n\n/g, '<br><br>')}&rdquo;</p>
            </div>
          </article>
        `).join("")}
      </div>

      <!-- Bottom Submission Form -->
      ${getFormHTML(D.form)}
    `;

    container.appendChild(wrap);

    // Scroll reveal observer
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -4% 0px", threshold: 0.05 });

    wrap.querySelectorAll(".tm-v2-card, .tm-form-section").forEach(el => io.observe(el));
  };

  window.addEventListener("kh_headers_updated", () => {
    const currentSlug = (location.hash || "").replace(/^#\/?/, "").split("/")[0];
    if (currentSlug === "testimonials") {
      const mainEl = document.getElementById("main") || document.querySelector("main");
      if (mainEl && typeof window.renderTestimonialsPage === "function") {
        window.renderTestimonialsPage(mainEl);
      }
    }
  });

})();
