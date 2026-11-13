/* ==========================================================
   FAQ Dynamic Renderer — Option 2: Interactive Editorial Cards
   - Exact Panoramic Header Image Aspect Ratio (1139 / 439)
   - Clickable cards opening an enlarged reading card
   - Modal appended directly to document.body (immune to parent transforms)
   - In-modal Next / Prev navigation & keyboard support (Esc, Arrows)
   - "Have a Question?" enquiry form
   ========================================================== */

(function() {
  "use strict";

  // Flatten all questions for seamless modal navigation
  function getAllQuestions(D) {
    const list = [];
    D.categories.forEach(cat => {
      cat.questions.forEach((q, idx) => {
        list.push({
          globalIdx: list.length,
          catId: cat.id,
          catTitle: cat.title,
          catNum: cat.num,
          idxInCat: idx + 1,
          totalInCat: cat.questions.length,
          q: q.q,
          a: q.a
        });
      });
    });
    return list;
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

  /* ---------------------------------------------------------
     Ask a Question Form
     --------------------------------------------------------- */
  function getAskQuestionFormHTML() {
    const D = window.FAQ_DATA || {};
    const ask = D.contactBox || D.askBox || {};
    return `
      <section class="faq-ask-section">
        <div class="faq-ask-header">
          <span class="faq-meta-tag">${escapeHtml(ask.tag || 'GOT A QUESTION?')}</span>
          <h2 class="faq-ask-title">${escapeHtml(ask.title || "Have a question that's not answered here?")}</h2>
          <p class="faq-ask-desc">${escapeHtml(ask.desc || "Send it through and I'll get back to you with an answer as soon as I can.")}</p>
        </div>
        <form class="editorial-contact-form faq-ask-form" data-subject="New FAQ Question Submission — korayhussein.com">
          <div class="form-row form-row--duo">
            <div class="form-group">
              <label for="faq-name">Your Name</label>
              <input type="text" id="faq-name" name="name" placeholder="First & last name" required>
            </div>
            <div class="form-group">
              <label for="faq-email">Email Address</label>
              <input type="email" id="faq-email" name="email" placeholder="name@domain.com" required>
            </div>
          </div>
          <div class="form-group">
            <label for="faq-question">Your Question</label>
            <textarea id="faq-question" name="message" rows="4" placeholder="Ask about shoots, camera gear, studio, rates, or anything else..." required></textarea>
          </div>
          <div class="form-submit-wrap">
            <button type="submit" class="editorial-submit-btn">
              <span>${escapeHtml(ask.btnText || 'Send Question →')}</span>
            </button>
            <span class="direct-email-hint">or email directly to <a href="mailto:${escapeHtml(ask.directEmail || 'contact@korayhussein.com')}">${escapeHtml(ask.directEmail || 'contact@korayhussein.com')}</a></span>
          </div>
        </form>
      </section>
    `;
  }

  /* ---------------------------------------------------------
     Modal Management (Appended directly to document.body)
     --------------------------------------------------------- */
  function ensureModalElement() {
    let modal = document.getElementById("faq-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "faq-modal";
      modal.id = "faq-modal";
      modal.setAttribute("aria-hidden", "true");
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");

      modal.innerHTML = `
        <div class="faq-modal__backdrop" id="faq-modal-backdrop"></div>
        <div class="faq-modal__dialog" role="document">
          <button class="faq-modal__close-btn" id="faq-modal-close" type="button" aria-label="Close reading card">&times;</button>

          <div class="faq-modal__body">
            <div class="faq-modal__meta">
              <span class="faq-meta-tag" id="modal-cat-tag">01 / FOR CLIENTS</span>
              <span class="faq-modal__counter" id="modal-counter">Question 1 of 49</span>
            </div>

            <h2 class="faq-modal__question" id="modal-question">Question title here</h2>

            <div class="faq-modal__divider"></div>

            <div class="faq-modal__answer" id="modal-answer">
              <!-- Full answer paragraphs populated dynamically -->
            </div>
          </div>

          <div class="faq-modal__footer">
            <button class="faq-modal__nav-btn" id="modal-prev-btn" type="button" aria-label="Previous question">
              <span>&larr; Previous</span>
            </button>
            <span class="faq-modal__nav-hint">use &larr; &rarr; arrow keys or ESC</span>
            <button class="faq-modal__nav-btn" id="modal-next-btn" type="button" aria-label="Next question">
              <span>Next &rarr;</span>
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    return modal;
  }

  /* ---------------------------------------------------------
     Main Page Renderer — Option 2: Editorial Cards
     --------------------------------------------------------- */
  window.renderFAQPage = function(container) {
    const D = window.FAQ_DATA;
    if (!container || !D) return;

    const allQuestions = getAllQuestions(D);

    let H = (D.header && typeof D.header === "object") ? { ...D.header } : {};
    try {
      const customRaw = localStorage.getItem("kh_custom_headers");
      if (customRaw) {
        const parsed = JSON.parse(customRaw);
        if (parsed && parsed["faq"]) {
          H = { ...H, ...parsed["faq"] };
        }
      }
    } catch(e) {}

    const heroImg = H.heroImage || 'photos/faq/Tara Wagner 1.jpg';
    const heroImgMobile = H.heroImageMobile || H.heroMobileImage || H.heroImage || 'photos/portfolio/001 Nyekachi Douglas 2.jpg';
    const heroMobileAspect = H.heroMobileAspect || '4 / 5';
    const mobileSrcset = heroImgMobile.startsWith("data:") ? heroImgMobile : encodeURI(heroImgMobile);

    container.innerHTML = `
      <article class="faq-master-wrap faq-v2-master">
        <!-- 1. Unified Cinematic Hero Banner -->
        <header class="cinematic-hero-banner">
          <div class="cinematic-hero-banner__img-box" style="--hero-mobile-aspect: ${heroMobileAspect};">
            <picture>
              <source media="(max-width: 768px)" srcset="${mobileSrcset}">
              <img src="${heroImg}" alt="Tara Wagner portrait by Koray Hussein" loading="eager">
            </picture>
            <div class="cinematic-hero-banner__scrim"></div>
          </div>
          <div class="cinematic-hero-banner__content">
            ${(D.header && D.header.tag) ? `
              <div class="cinematic-hero-tag-row">
                <span class="cinematic-hero-tag">${D.header.tag}</span>
              </div>
            ` : ''}
            <h1 class="cinematic-hero-title">${(D.header && D.header.title) || 'frequently asked questions'}</h1>
            <p class="cinematic-hero-lead">${(D.header && D.header.intro) || ''}</p>
            ${(D.header && D.header.subtext) ? `<p class="cinematic-hero-sub">${D.header.subtext}</p>` : ''}
          </div>
        </header>

        <!-- 2. Category Filter Bar -->
        <div class="faq-filter-bar">
          <div class="faq-filter-bar__pills">
            <button class="faq-pill-btn is-active" data-cat="all" type="button">
              <span>All Questions (${allQuestions.length})</span>
            </button>
            ${D.categories.map(c => `
              <button class="faq-pill-btn" data-cat="${c.id}" type="button">
                <span>${c.title} (${c.questions.length})</span>
              </button>
            `).join("")}
          </div>
          <span class="faq-click-hint">Click any card to read full answer &nearr;</span>
        </div>

        <!-- 3. Clickable Editorial Cards Grid by Category -->
        <div class="faq-sections-container" id="faq-sections-container">
          ${D.categories.map(cat => {
            const catQuestions = allQuestions.filter(item => item.catId === cat.id);
            return `
              <section class="faq-cat-block" data-cat-id="${cat.id}">
                <div class="faq-cat-block__header">
                  <div>
                    <span class="faq-meta-tag">${cat.num} / ARCHIVE</span>
                    <h2 class="faq-cat-block__title">${cat.title}</h2>
                    <p class="faq-cat-block__desc">${cat.desc}</p>
                  </div>
                  <span class="faq-cat-block__count">${catQuestions.length} Questions</span>
                </div>

                <div class="faq-cards-grid">
                  ${catQuestions.map(item => `
                    <div class="faq-card" data-global-idx="${item.globalIdx}" role="button" tabindex="0" aria-label="Read answer to: ${item.q}">
                      <div class="faq-card__header">
                        <span class="faq-card__tag">${item.catTitle} · ${String(item.idxInCat).padStart(2, '0')}</span>
                        <span class="faq-card__expand-icon" aria-hidden="true">&nearr;</span>
                      </div>
                      <h3 class="faq-card__q">${item.q}</h3>
                      <div class="faq-card__preview">
                        <p>${item.a[0]}</p>
                      </div>
                      <div class="faq-card__footer">
                        <span class="faq-card__open-label">read full answer &rarr;</span>
                      </div>
                    </div>
                  `).join("")}
                </div>
              </section>
            `;
          }).join("")}
        </div>

        <!-- 4. Ask a Question Form -->
        ${getAskQuestionFormHTML()}
      </article>
    `;

    // ---------------------------------------------------------
    // Interactivity: Category Filtering
    // ---------------------------------------------------------
    const pillBtns = container.querySelectorAll(".faq-pill-btn");
    const catBlocks = container.querySelectorAll(".faq-cat-block");

    pillBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        pillBtns.forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");

        const targetCat = btn.dataset.cat;
        catBlocks.forEach(block => {
          if (targetCat === "all" || block.dataset.catId === targetCat) {
            block.style.display = "";
          } else {
            block.style.display = "none";
          }
        });
      });
    });

    // ---------------------------------------------------------
    // Interactivity: Enlarged Reading Modal on document.body
    // ---------------------------------------------------------
    const modal = ensureModalElement();
    const backdrop = modal.querySelector("#faq-modal-backdrop");
    const closeBtn = modal.querySelector("#faq-modal-close");
    const modalCatTag = modal.querySelector("#modal-cat-tag");
    const modalCounter = modal.querySelector("#modal-counter");
    const modalQuestion = modal.querySelector("#modal-question");
    const modalAnswer = modal.querySelector("#modal-answer");
    const prevBtn = modal.querySelector("#modal-prev-btn");
    const nextBtn = modal.querySelector("#modal-next-btn");

    let activeIdx = 0;
    let isModalOpen = false;

    function openModal(idx) {
      if (idx < 0) idx = allQuestions.length - 1;
      if (idx >= allQuestions.length) idx = 0;
      activeIdx = idx;

      const item = allQuestions[activeIdx];
      if (!item) return;

      modalCatTag.textContent = `${item.catNum} / ${item.catTitle.toUpperCase()}`;
      modalCounter.textContent = `Question ${item.idxInCat} of ${item.totalInCat} in ${item.catTitle}`;
      modalQuestion.textContent = item.q;
      modalAnswer.innerHTML = item.a.map(p => `<p>${p}</p>`).join("");

      // Ensure modal is attached directly to document.body
      if (modal.parentNode !== document.body) {
        document.body.appendChild(modal);
      }

      modal.classList.add("is-visible");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("faq-modal-open");
      isModalOpen = true;

      // Reset scroll inside modal body
      const modalBody = modal.querySelector(".faq-modal__body");
      if (modalBody) modalBody.scrollTop = 0;

      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      modal.classList.remove("is-visible");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("faq-modal-open");
      isModalOpen = false;
    }

    // Bind card clicks
    container.querySelectorAll(".faq-card").forEach(card => {
      const idx = parseInt(card.dataset.globalIdx, 10);
      card.addEventListener("click", () => openModal(idx));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal(idx);
        }
      });
    });

    if (closeBtn) closeBtn.onclick = closeModal;
    if (backdrop) backdrop.onclick = closeModal;

    if (prevBtn) {
      prevBtn.onclick = () => openModal(activeIdx - 1);
    }
    if (nextBtn) {
      nextBtn.onclick = () => openModal(activeIdx + 1);
    }

    // Global keyboard listener
    function handleKeydown(e) {
      if (!isModalOpen) return;
      if (e.key === "Escape") {
        closeModal();
      } else if (e.key === "ArrowLeft") {
        openModal(activeIdx - 1);
      } else if (e.key === "ArrowRight") {
        openModal(activeIdx + 1);
      }
    }

    document.removeEventListener("keydown", window._faqKeyHandler);
    window._faqKeyHandler = handleKeydown;
    document.addEventListener("keydown", window._faqKeyHandler);
  };

  window.addEventListener("kh_headers_updated", () => {
    const currentSlug = (location.hash || "").replace(/^#\/?/, "").split("/")[0];
    if (currentSlug === "faq") {
      const mainEl = document.getElementById("main") || document.querySelector("main");
      if (mainEl && typeof window.renderFAQPage === "function") {
        window.renderFAQPage(mainEl);
      }
    }
  });
})();
