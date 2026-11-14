/* ==========================================================
   Playlists Page Renderer — Koray Hussein Photography
   Standard Full Tracklist Spotify Embed Player (Official 352px)
   Dynamic Responsive Grid: 2x2 for 4 items, 3 cols for 3 items
   Exclusively featuring Studio & Editing playlists.
   ========================================================== */

(function() {
  "use strict";

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function extractEmbedId(pl) {
    if (pl.embedId && typeof pl.embedId === "string" && pl.embedId.trim().length > 0) {
      return pl.embedId.trim();
    }
    if (pl.url && typeof pl.url === "string") {
      const m = pl.url.match(/playlist[\/:]([a-zA-Z0-9]+)/);
      if (m && m[1]) return m[1];
    }
    return "";
  }

  /* ---------------------------------------------------------
     Main Page Renderer
     --------------------------------------------------------- */
  window.renderPlaylistsPage = function(container) {
    const D = window.PLAYLISTS_DATA;
    if (!container || !D) return;

    container.innerHTML = "";

    const wrap = document.createElement("article");
    wrap.className = "pl-master-wrap";

    let H = {};
    try {
      const dedicated = localStorage.getItem("kh_header_playlists");
      if (dedicated) {
        H = JSON.parse(dedicated) || {};
      } else {
        const customRaw = localStorage.getItem("kh_custom_headers");
        if (customRaw) {
          const parsed = JSON.parse(customRaw);
          if (parsed && parsed["playlists"]) H = parsed["playlists"];
        }
      }
    } catch(e) {}
    if (window._KH_HEADERS && window._KH_HEADERS["playlists"]) {
      H = { ...H, ...window._KH_HEADERS["playlists"] };
    }
    H = { ...((D && D.header) || {}), ...H };

    const heroImg = H.heroImage || 'https://pub-c64c2ecfb504495cb6e4b8d1dde437c0.r2.dev/headers/playlists_desktop/headers_playlists_desktop_1794622948363.jpg';
    const heroImgMobile = H.heroImageMobile || H.heroMobileImage || H.heroImage || 'https://pub-c64c2ecfb504495cb6e4b8d1dde437c0.r2.dev/headers/playlists_mobile/headers_playlists_mobile_1794622941966.jpg';
    const heroMobileAspect = H.heroMobileAspect || '4 / 5';
    const mobileSrcset = (window.safeHeroUrl ? window.safeHeroUrl(heroImgMobile) : (heroImgMobile.startsWith("data:") ? heroImgMobile : encodeURI(heroImgMobile)));
    const initialHeroImgSrc = (window.safeHeroUrl ? window.safeHeroUrl(heroImg) : heroImg);

    wrap.innerHTML = `
      <div class="pl-v11-tracklists">
        <!-- 1. Unified Cinematic Hero Banner -->
        <header class="cinematic-hero-banner">
          <div class="cinematic-hero-banner__img-box" style="--hero-mobile-aspect: ${heroMobileAspect};">
            <picture>
              <source media="(max-width: 768px)" srcset="${escapeHtml(mobileSrcset)}">
              <img src="${escapeHtml(initialHeroImgSrc)}" alt="Studio & editing soundscapes by Koray Hussein" loading="eager" style="object-position: center 30%;">
            </picture>
            <div class="cinematic-hero-banner__scrim"></div>
          </div>
          <div class="cinematic-hero-banner__content">
            ${(H.tag || (D.header && D.header.tag)) ? `
              <div class="cinematic-hero-tag-row">
                <span class="cinematic-hero-tag">${escapeHtml(H.tag || D.header.tag)}</span>
              </div>
            ` : ''}
            <h1 class="cinematic-hero-title">${escapeHtml(H.title || (D.header && D.header.title) || 'playlists')}</h1>
            <p class="cinematic-hero-lead">${escapeHtml(H.intro || H.subtitle || (D.header && (D.header.intro || D.header.subtitle)) || '')}</p>
          </div>
        </header>

        ${(D.sections || []).map(sec => {
          const plList = sec.playlists || [];
          const count = plList.length;
          // Dynamic Layout:
          // 2 or 4 items -> 2 columns (balanced 2x2 grid)
          // 3, 5, or 6 items -> 3 columns (balanced 3x1 or 3x2 grid)
          // 7+ items -> responsive auto-fit
          const gridLayoutClass = (count === 4 || count === 2)
            ? "pl-tracklist-grid--cols-2"
            : (count === 3 || count === 5 || count === 6 ? "pl-tracklist-grid--cols-3" : "pl-tracklist-grid--auto");

          return `
          <section class="pl-tracklist-section">
            <div class="pl-section-heading">
              <div>
                <span class="pl-meta-tag">${escapeHtml(sec.num || '01')} / ${escapeHtml(sec.title || '').toUpperCase()}</span>
                <p class="pl-section-desc">${escapeHtml(sec.desc || '')}</p>
              </div>
              <span class="pl-section-count">${count} PLAYLISTS · FULL TRACKLISTS</span>
            </div>

            <div class="pl-tracklist-grid ${gridLayoutClass}">
              ${plList.map((pl, plIdx) => {
                const embedId = extractEmbedId(pl);
                const numLabel = pl.num || String(plIdx + 1).padStart(2, '0');
                return `
                <div class="pl-tracklist-card">
                  <div class="pl-tracklist-card-top">
                    <span class="pl-tracklist-badge">${escapeHtml(sec.title)} · ${escapeHtml(numLabel)}</span>
                  </div>

                  <div class="pl-tracklist-embed-wrap">
                    <div class="pl-tracklist-skeleton" aria-hidden="true">
                      <span class="pl-skeleton-dot"></span>
                      <span class="pl-skeleton-label">loading ${escapeHtml(pl.title || 'playlist')}...</span>
                    </div>
                    <iframe
                      class="pl-spotify-iframe"
                      style="border-radius:12px; width:100%; height:352px; border:0; background:#121212; color-scheme:dark;"
                      src="https://open.spotify.com/embed/playlist/${encodeURIComponent(embedId)}?utm_source=generator&theme=0"
                      width="100%"
                      height="352"
                      frameborder="0"
                      allowfullscreen=""
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="eager"
                      title="${escapeHtml(pl.title || 'Spotify Playlist')}">
                    </iframe>
                  </div>
                </div>
                `;
              }).join("")}
            </div>
          </section>
          `;
        }).join("")}
      </div>
    `;

    container.appendChild(wrap);

    // Reveal each embed smoothly over its dark #121212 shell once ready (preventing white flash)
    wrap.querySelectorAll(".pl-tracklist-embed-wrap").forEach(embedWrap => {
      const iframe = embedWrap.querySelector("iframe.pl-spotify-iframe");
      if (!iframe) return;
      const markReady = () => {
        embedWrap.classList.add("is-ready");
        iframe.classList.add("is-loaded");
      };
      iframe.addEventListener("load", markReady, { once: true });
      setTimeout(markReady, 1800);
    });
  };

  window.addEventListener("kh_headers_updated", (e) => {
    const currentSlug = (location.hash || "").replace(/^#\/?/, "").split("/")[0];
    if (currentSlug === "playlists") {
      let data = (e && e.detail && e.detail["playlists"]) || (window._KH_HEADERS && window._KH_HEADERS["playlists"]);
      if (!data) {
        try {
          const raw = localStorage.getItem("kh_header_playlists");
          if (raw) data = JSON.parse(raw);
        } catch(err) {}
      }
      if (data && typeof window.updateLiveHeroBannerInDOM === "function") {
        window.updateLiveHeroBannerInDOM("playlists", data);
      }
    }
  });

})();
