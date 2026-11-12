/* ==========================================================
   Book Me Dynamic Renderer — Clean Unified Editorial Layout
   Sequence:
   1. 3 Hero Images in a row
   2. Intro lead text ("Whether you're...")
   3. 3 Contact Cards side-by-side filling the line
   4. Studio & Approach details
   5. Natural light casting polaroids
   6. FAQs
   7. Contact Enquiry Form
   ========================================================== */

(function() {
  "use strict";

  function getContactFormHTML() {
    return `
      <form class="editorial-contact-form" data-subject="New Booking Enquiry — korayhussein.com">
        <div class="form-row form-row--duo">
          <div class="form-group">
            <label>your name</label>
            <input type="text" name="name" placeholder="first & last name" required>
          </div>
          <div class="form-group">
            <label>email address</label>
            <input type="email" name="email" placeholder="name@domain.com" required>
          </div>
        </div>
        <div class="form-row form-row--duo">
          <div class="form-group">
            <label>booking as</label>
            <select name="type">
              <option>model (direct booking)</option>
              <option>agency (for represented model)</option>
              <option>actor / creative headshots</option>
              <option>other / workshop enquiry</option>
            </select>
          </div>
          <div class="form-group">
            <label>preferred package / date range</label>
            <input type="text" name="package" placeholder="e.g. Portfolio Session (£300) · Late Dec">
          </div>
        </div>
        <div class="form-group">
          <label>message / links (instagram or agency board)</label>
          <textarea rows="5" name="message" placeholder="tell me about your shoot goals, ideas, and any questions..."></textarea>
        </div>
        <div class="form-submit-wrap">
          <button type="submit" class="editorial-submit-btn">
            <span>send booking enquiry &rarr;</span>
          </button>
          <span class="direct-email-hint">or email directly to <a href="mailto:contact@korayhussein.com">contact@korayhussein.com</a></span>
        </div>
      </form>
    `;
  }

  window.renderBookMeEdition = function(container) {
    const D = window.BOOK_ME_DATA;
    if (!D) return;

    container.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.className = "book-page-wrap";

    wrap.innerHTML = `
      <header class="bm-header-v1">
        <span class="bm-tag">${D.header.tag}</span>
        <h1 class="bm-title-hero">${D.header.title}</h1>
      </header>

      <!-- 1. The three images in a row -->
      <section class="bm-triptych-strip">
        ${D.heroImages.map(img => `
          <div class="bm-frame"><img src="${img.src}" alt="${img.alt}" loading="lazy"></div>
        `).join("")}
      </section>

      <!-- 2. The writing starting with "whether you're..." -->
      <section class="bm-intro-callout">
        <p class="bm-intro-lead">${D.header.intro}</p>
      </section>

      <!-- 3. The 3 Contact Cards formatted in Option 2's signature card layout (side-by-side filling the line) -->
      <section class="bm-rates-feed-section">
        <div class="bm-sec-header">
          <span class="bm-sec-num">01 / RATES</span>
          <h2>studio sessions</h2>
        </div>
        <div class="bm-rates-triptych-grid">
          ${D.packages.map(pkg => `
            <div class="bm-feed-rate-card">
              <div class="bm-feed-rate-top">
                <span class="bm-feed-sub">${pkg.details}</span>
                <div class="bm-feed-title-price">
                  <h3>${pkg.title}</h3>
                  <div class="bm-feed-rate-cost">${pkg.price}</div>
                </div>
              </div>
              <p class="bm-feed-desc">${pkg.desc}</p>
            </div>
          `).join("")}
        </div>
      </section>

      <!-- 4. Studio & Approach Features -->
      <section class="bm-mid-duo">
        <div class="bm-duo-content">
          ${D.features.map(f => `
            <div class="bm-feature-block">
              <span class="bm-tag">${f.tag}</span>
              <h3>${f.title}</h3>
              <p>${f.body}</p>
            </div>
          `).join("")}
        </div>
        <div class="bm-duo-image">
          <img src="${D.midImages[1].src}" alt="${D.midImages[1].alt}" loading="lazy">
        </div>
      </section>

      <!-- 5. Casting Polaroids Feature -->
      <section class="bm-polaroids-feature">
        <div class="bm-pol-head">
          <div>
            <span class="bm-tag">digital casting updates</span>
            <h2>${D.polaroids.title}</h2>
            <p>${D.polaroids.desc}</p>
          </div>
          <div class="bm-pol-note">${D.polaroids.disclaimer}</div>
        </div>
        <div class="bm-pol-quad">
          ${D.polaroids.images.map(img => `
            <div class="bm-pol-card">
              <img src="${img.src}" alt="${img.alt}" loading="lazy">
              <span class="bm-pol-stamp">raw format</span>
            </div>
          `).join("")}
        </div>
      </section>

      <!-- 6. Frequently Asked Questions -->
      <section class="bm-faq-section">
        <div class="bm-sec-header">
          <span class="bm-sec-num">02 / QUESTIONS</span>
          <h2>booking guide & frequently asked questions</h2>
        </div>
        <div class="bm-faq-grid">
          ${D.faqs.map(faq => `
            <div class="bm-faq-item">
              <h4>${faq.q}</h4>
              <p>${faq.a}</p>
            </div>
          `).join("")}
        </div>
      </section>

      <!-- 7. Direct Contact Form -->
      <section class="bm-contact-section">
        <div class="bm-contact-grid">
          <div class="bm-contact-hero-img">
            <img src="${D.contact.hero}" alt="Studio Session" loading="lazy">
          </div>
          <div class="bm-contact-form-side">
            <span class="bm-tag">direct studio contact</span>
            <h2>get in touch</h2>
            <p>For model or agency bookings, workshops, and custom requirements.</p>
            ${getContactFormHTML()}
          </div>
        </div>
      </section>
    `;

    container.appendChild(wrap);
  };

})();
