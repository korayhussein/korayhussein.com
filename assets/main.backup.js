/* ==========================================================
   Koray Hussein — Editorial Portfolio Application
   5 Distinct Sets Page Layouts + Theme Toggle + Refined Spacing
   ========================================================== */
(() => {
  "use strict";

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

  let currentGallery = [];
  let currentImageIdx = 0;
  let isNavOpen = false;
  let isTransitioning = false;

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

  const savedTheme = localStorage.getItem("kh-theme") || "dark";
  setTheme(savedTheme);

  function setTheme(theme) {
    const metaThemes = document.querySelectorAll('meta[name="theme-color"]');
    const themeColor = theme === "light" ? "#f5f3ef" : "#131313";
    metaThemes.forEach(m => m.setAttribute("content", themeColor));

    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      themeBtn.innerHTML = `
        <span class="theme-icon-wrap">${moonIcon}</span>
        <span class="theme-toggle-label">Switch to Dark Mode</span>
      `;
      themeBtn.setAttribute("aria-label", "Switch to Dark Mode");
      localStorage.setItem("kh-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
      themeBtn.innerHTML = `
        <span class="theme-icon-wrap">${sunIcon}</span>
        <span class="theme-toggle-label">Switch to Light Mode</span>
      `;
      themeBtn.setAttribute("aria-label", "Switch to Light Mode");
      localStorage.setItem("kh-theme", "dark");
    }
  }

  themeBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    setTheme(current === "light" ? "dark" : "light");
  });

  /* ---------------------------------------------------------
     Initialize Splash Screen
     --------------------------------------------------------- */
  if (data.site && data.site.splashImage) {
    splashBg.style.backgroundImage = `url('${data.site.splashImage}')`;
  }

  function hideSplash() {
    splash.classList.add("is-hidden");
    document.body.classList.add("site-active");
  }

  function showSplash() {
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
  }

  enterBtn.addEventListener("click", () => {
    location.hash = "#/portfolio";
  });

  /* ---------------------------------------------------------
     Build Fullscreen Editorial Navigation Menu (4 Columns)
     --------------------------------------------------------- */
  function buildMenu() {
    sideNavContent.innerHTML = "";

    const cleanSlug = (path) => path.replace(/^\//, "").replace(/^\d+-/, "");

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
        title: "02 · sets & series",
        items: [
          { title: "sets", path: "/sets", badge: "25 projects" },
          { title: "detail", path: "/13740836-detail" },
          { title: "grids", path: "/grids" },
          { title: "smiling", path: "/smiling" }
        ]
      },
      {
        title: "03 · travel archive",
        items: [
          { title: "florence, italy", path: "/florence-italy" },
          { title: "london, england", path: "/london-england" },
          { title: "north cyprus", path: "/north-cyprus" },
          { title: "paris, france", path: "/paris-france" },
          { title: "valencia, spain", path: "/valencia-spain" },
          { title: "venice, italy", path: "/12287761-venice-italy" }
        ]
      },
      {
        title: "04 · information",
        items: [
          { title: "book me", path: "/book-me" },
          { title: "about me", path: "/about-me" },
          { title: "testimonials", path: "/testimonials" },
          { title: "faq", path: "/faq" },
          { title: "playlists", path: "/playlists" }
        ]
      }
    ];

    columns.forEach(col => {
      const colEl = document.createElement("div");
      colEl.className = "editorial-col";

      const titleEl = document.createElement("div");
      titleEl.className = "editorial-col__title";
      titleEl.textContent = col.title;
      colEl.appendChild(titleEl);

      const listEl = document.createElement("ul");
      listEl.className = "editorial-col__list";

      col.items.forEach(item => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        const slug = cleanSlug(item.path);
        a.className = "editorial-col__link";
        a.href = `#/${slug}`;
        a.dataset.slug = slug;
        if (item.badge) {
          a.innerHTML = `<span>${item.title}</span><span class="editorial-col__badge">[${item.badge}]</span>`;
        } else {
          a.innerHTML = `<span>${item.title}</span>`;
        }
        li.appendChild(a);
        listEl.appendChild(li);
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
    isNavOpen = typeof force === "boolean" ? force : !isNavOpen;
    document.body.classList.toggle("menu-open", isNavOpen);
    sideMenu.classList.toggle("is-active", isNavOpen);
    menuBackdrop.classList.toggle("is-active", isNavOpen);
    if (isNavOpen) {
      menuOpenedAt = Date.now();
      menuCloseScrollAccum = 0;
    } else {
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
      toggleMenu(false);
      const targetHash = a.getAttribute("href");
      const currentHash = location.hash || "#/portfolio";
      if (targetHash === "#/portfolio" && (currentHash === "#/portfolio" || currentHash === "#/" || !location.hash)) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
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

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("viewer-open");
  }

  function updateLightbox() {
    const item = currentGallery[currentImageIdx];
    if (!item) return;
    lightboxImg.style.opacity = "0.2";
    lightboxImg.onload = () => {
      lightboxImg.style.opacity = "1";
    };
    lightboxImg.src = item.src;
    lightboxCounter.textContent = `${String(currentImageIdx + 1).padStart(2, '0')} / ${String(currentGallery.length).padStart(2, '0')}`;
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", () => {
    currentImageIdx = (currentImageIdx - 1 + currentGallery.length) % currentGallery.length;
    updateLightbox();
  });
  lightboxNext.addEventListener("click", () => {
    currentImageIdx = (currentImageIdx + 1) % currentGallery.length;
    updateLightbox();
  });

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
      const lines = (desc || "").split("\n").map(l => l.trim()).filter(Boolean);
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
      card.innerHTML = `
        <div class="set-card__media">
          <img src="${set.hero}" alt="${set.name}" loading="lazy">
          <div class="set-card__badge">view set</div>
        </div>
        <div class="set-card__footer">
          <h2 class="set-card__title">${set.name}</h2>
          <span class="set-card__info">${meta.combined}</span>
        </div>
      `;
      card.addEventListener("click", () => {
        sessionStorage.setItem("kh_set_referrer", JSON.stringify({ type: "sets", slug: "sets" }));
        location.hash = `#/set/${set.slug}`;
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
    const set = (data.sets && data.sets[slug]) || {};
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

    const container = document.createElement("div");
    container.className = "gallery-container";

    images.forEach((img, idx) => {
      const item = document.createElement("div");
      item.className = "gallery-item";
      
      const inner = document.createElement("div");
      inner.className = "gallery-item__inner";
      
      const imageEl = document.createElement("img");
      imageEl.src = img.src;
      imageEl.width = img.w;
      imageEl.height = img.h;
      imageEl.loading = idx < 2 ? "eager" : "lazy";
      imageEl.alt = `${set.name || "Set"} photo ${idx + 1}`;

      inner.appendChild(imageEl);
      inner.addEventListener("click", () => openLightbox(images, idx));

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
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });

    container.querySelectorAll(".gallery-item").forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------
     Render Standard Gallery Page
     --------------------------------------------------------- */
  function renderGallery(slug) {
    const images = data.galleries[slug] || [];
    if (!images.length) {
      main.innerHTML = `<div class="article-page"><p style="text-align:center; padding: 100px 0;">No images in this gallery.</p></div>`;
      return;
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
      imageEl.width = img.w;
      imageEl.height = img.h;
      imageEl.loading = idx < 2 ? "eager" : "lazy";
      imageEl.alt = img.filename;

      inner.appendChild(imageEl);
      inner.addEventListener("click", () => openLightbox(images, idx));

      // Link to set ONLY if explicitly assigned (e.g. Asha, Annie, Sheyla)
      const setSlug = img.setSlug || null;
      if (setSlug && data.sets && data.sets[setSlug]) {
        const badge = document.createElement("a");
        badge.href = `#/set/${setSlug}`;
        badge.className = "gallery-item__badge";
        badge.setAttribute("aria-label", `View ${data.sets[setSlug].name || setSlug} set`);
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
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });

    container.querySelectorAll(".gallery-item").forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------
     Contact & Booking Form Email Delivery
     Directly sends to contact@korayhussein.com via FormSubmit AJAX
     with graceful mailto fallback
     --------------------------------------------------------- */
  function showFormNotice(formEl, type, message) {
    let notice = formEl.querySelector(".form-status-notice");
    if (!notice) {
      notice = document.createElement("div");
      notice.className = "form-status-notice";
      formEl.appendChild(notice);
    }
    notice.className = `form-status-notice is-${type}`;
    notice.textContent = message;
    notice.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  window.sendEditorialEmail = async function(formEl, subjectPrefix) {
    const submitBtn = formEl.querySelector("button[type='submit']");
    const origBtnText = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>sending &rarr;</span>`;
    }

    const formData = new FormData(formEl);
    const payload = {
      _subject: subjectPrefix || "New Website Message — korayhussein.com",
      _template: "table",
      _captcha: "false"
    };

    const mailtoBody = [];
    formData.forEach((value, key) => {
      const v = typeof value === "string" ? value.trim() : value;
      if (v) {
        payload[key] = v;
        mailtoBody.push(`${key.toUpperCase()}: ${v}`);
      }
    });

    try {
      const res = await fetch("https://formsubmit.co/ajax/contact@korayhussein.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (submitBtn) {
          submitBtn.innerHTML = `<span>sent successfully &check;</span>`;
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origBtnText;
          }, 4000);
        }
        formEl.reset();
        showFormNotice(formEl, "success", "Thank you! Your message has been sent directly to contact@korayhussein.com.");
        return;
      }
      throw new Error("Form submission error");
    } catch (err) {
      console.warn("Direct submission notice:", err);
      // Seamless fallback: open mailto
      const mailtoUrl = `mailto:contact@korayhussein.com?subject=${encodeURIComponent(payload._subject)}&body=${encodeURIComponent(mailtoBody.join("\n\n"))}`;
      window.location.href = mailtoUrl;

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnText;
      }
      showFormNotice(formEl, "info", "Opening your email app to deliver to contact@korayhussein.com...");
    }
  };

  // Global handler for all forms across the site
  document.addEventListener("submit", (e) => {
    const form = e.target;
    if (form && (form.classList.contains("editorial-contact-form") || form.closest("#main-content"))) {
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
  function renderBookMePage() {
    main.innerHTML = "";
    if (window.renderBookMeEdition) {
      window.renderBookMeEdition(main);
    } else {
      renderContentPage("book-me");
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
    } else if (slug === "book-me") {
      renderBookMePage();
    } else if (slug === "testimonials") {
      renderTestimonialsPage();
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
      a.classList.toggle("is-current", a.dataset.slug === slug || ((slug === "about-me" || slug === "contact") && (a.dataset.slug === "about-me" || a.dataset.slug === "contact")));
    });
  }

  /* ---------------------------------------------------------
     Header Scroll Animation (Expand / Compact "khp")
     --------------------------------------------------------- */
  const headerEl = document.querySelector(".site-header");
  let isHeaderScrolled = false;

  function updateHeaderCompact() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    const shouldScroll = scrollY > 40;
    if (shouldScroll !== isHeaderScrolled) {
      isHeaderScrolled = shouldScroll;
      if (headerEl) {
        headerEl.classList.toggle("is-scrolled", isHeaderScrolled);
      }
    }
  }

  window.addEventListener("scroll", updateHeaderCompact, { passive: true });

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
    resetPullAnimation();
    toggleMenu(true);
  }

  // Wheel Listener (Trackpad & Mouse Wheel)
  window.addEventListener("wheel", (e) => {
    // 1) When Menu is OPEN: scroll down dismisses the menu
    if (isNavOpen && Date.now() - menuOpenedAt > 350 && e.deltaY > 0) {
      menuCloseScrollAccum += e.deltaY;
      clearTimeout(menuCloseTimer);
      menuCloseTimer = setTimeout(() => { menuCloseScrollAccum = 0; }, 200);

      if (menuCloseScrollAccum > 45) {
        menuCloseScrollAccum = 0;
        toggleMenu(false);
      }
      return;
    }

    // 2) Track continuous wheel stroke state
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

    // 3) Deliberate pull down from the top
    if (isEligibleAtTop() && (e.deltaY < 0 || isPullActive)) {
      if (e.deltaY < 0) {
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
      } else if (e.deltaY > 0 && isPullActive) {
        if (e.cancelable) e.preventDefault();
        pullDistance -= e.deltaY * 0.45;
        if (pullDistance <= 0) {
          resetPullAnimation();
        } else {
          updatePullVisuals(pullDistance);
        }
      }
    }
  }, { passive: false });

  // Touch screen listeners (Mobile / Tablet)
  window.addEventListener("touchstart", (e) => {
    if (isNavOpen) {
      menuTouchStartY = e.touches[0].clientY;
    } else {
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      touchStartY = e.touches[0].clientY;
      isTouching = true;
      touchStartedAtTop = (currentScrollY <= 0 && !wasScrolledDown);
    }
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    // Menu dismiss on swipe up (scroll down)
    if (isNavOpen && Date.now() - menuOpenedAt > 350) {
      const currentY = e.touches[0].clientY;
      const dy = currentY - menuTouchStartY;
      if (dy < -50) {
        toggleMenu(false);
      }
      return;
    }

    // If touch did not start at the top, it is a normal page scroll — never trigger pull
    if (!isTouching || !touchStartedAtTop || !isEligibleAtTop()) return;

    const currentY = e.touches[0].clientY;
    const dy = currentY - touchStartY;
    if (dy > 0) {
      if (e.cancelable) e.preventDefault();
      isPullActive = true;
      pullDistance = dy * 0.45;
      updatePullVisuals(pullDistance);
    }
  }, { passive: false });

  window.addEventListener("touchend", () => {
    if (isNavOpen) return;
    if (!isTouching || !touchStartedAtTop) {
      isTouching = false;
      return;
    }
    isTouching = false;
    touchStartedAtTop = false;

    if (pullDistance >= PULL_TRIGGER_PX) {
      triggerMenuFromPull();
    } else {
      resetPullAnimation();
    }
  }, { passive: true });

  function navigate(slug) {
    const isHome = !slug || slug === "home";
    window.scrollTo({ top: 0, behavior: "instant" });
    isHeaderScrolled = false;
    if (headerEl) headerEl.classList.remove("is-scrolled");
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
      // Now smoothly fade out splash overlay revealing the loaded page
      hideSplash();
    }
  }

  function handleRoute() {
    const raw = location.hash.replace(/^#\/?/, "").trim();
    navigate(raw || "home");
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

})();
