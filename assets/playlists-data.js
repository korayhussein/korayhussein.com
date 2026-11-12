/* ==========================================================
   Playlists Data — Koray Hussein Photography
   Exclusively featuring Studio & Editing playlists.
   All direct Spotify links and cover artwork preserved.
   ========================================================== */

(function() {
  "use strict";

  window.PLAYLISTS_DATA = {
    header: {
      tag: "04 / SOUND & ATMOSPHERE",
      title: "playlists",
      heroImage: "photos/playlists/header.jpg",
      subtitle: "curated soundscapes for shoots & post-production",
      intro: "Music is the best way to set the mood for a shoot. I always try to have a calming playlist in the background to give off an easy-going atmosphere. The same goes whilst I'm editing. I want music that will help me focus but keep my head in a relaxed state so I can edit for longer sessions.",
      spotifyProfileUrl: "https://open.spotify.com/user/korayhussein"
    },

    sections: [
      {
        id: "studio",
        num: "01",
        title: "studio playlists",
        subtitle: "In the Studio · Grow Studios, London",
        desc: "Here are a few playlists I've put together that I feel create the right shooting environment.",
        playlists: [
          {
            id: "studio-one",
            title: "studio one",
            num: "01",
            image: "photos/playlists/studio one.jpg",
            url: "https://open.spotify.com/playlist/1hHA7rfFkw2GGtdGm08Ci2?si=43dfd03229d5472c",
            embedId: "1hHA7rfFkw2GGtdGm08Ci2",
            mood: "Calm · Warm daylight · Ambient soul"
          },
          {
            id: "studio-two",
            title: "studio two",
            num: "02",
            image: "photos/playlists/studio two.jpg",
            url: "https://open.spotify.com/playlist/2Oprtt8X2iE0yzUJpmOTIV?si=4a0fbe8fa1784c47",
            embedId: "2Oprtt8X2iE0yzUJpmOTIV",
            mood: "Rhythmic · Mellow groove · Relaxed tempo"
          },
          {
            id: "studio-three",
            title: "studio three",
            num: "03",
            image: "photos/playlists/studio three.jpg",
            url: "https://open.spotify.com/playlist/3tmMReHvbJgWDSkMBgno0E?si=8040b1f3fbd647e1&pt=b1f341ff4e5a654720e9fee0ec5dec4d",
            embedId: "3tmMReHvbJgWDSkMBgno0E",
            mood: "Intimate · Acoustic & cinematic drift"
          }
        ]
      },
      {
        id: "editing",
        num: "02",
        title: "editing playlists",
        subtitle: "In the Edit Suite · Retouching & Color Grading",
        desc: "These are the playlists I'll listen to when doing long editing sessions. Especially late night ones.",
        playlists: [
          {
            id: "editing-one",
            title: "editing one",
            num: "01",
            image: "photos/playlists/editing one.jpg",
            url: "https://open.spotify.com/playlist/4sBsUafqW4UxP4lhEIZwyA?si=0ae0d73b73e24972",
            embedId: "4sBsUafqW4UxP4lhEIZwyA",
            mood: "Deep focus · Electronic & ambient pulse"
          },
          {
            id: "editing-two",
            title: "editing two",
            num: "02",
            image: "photos/playlists/editing two.jpg",
            url: "https://open.spotify.com/playlist/5S8EsyHK7WjyFIMO1jdRtc?si=1f6029d785b0431a",
            embedId: "5S8EsyHK7WjyFIMO1jdRtc",
            mood: "Late hours · Downtempo & lo-fi texture"
          },
          {
            id: "editing-three",
            title: "editing three",
            num: "03",
            image: "photos/playlists/editing three.jpg",
            url: "https://open.spotify.com/playlist/40vE2FdQe1szupA7mi6DeV?si=6aebaa3fb412467a",
            embedId: "40vE2FdQe1szupA7mi6DeV",
            mood: "Cinematic tone · Minimalist piano & strings"
          },
          {
            id: "editing-four",
            title: "editing four",
            num: "04",
            image: "photos/playlists/editing four.jpg",
            url: "https://open.spotify.com/playlist/2uz0hWmAGMO8SYIV0Bgwow?si=64ec080343a34b10",
            embedId: "2uz0hWmAGMO8SYIV0Bgwow",
            mood: "Flow state · Atmospheric drive & stillness"
          }
        ]
      }
    ]
  };

  const PLAYLISTS_STORAGE_KEY = "kh_playlists_data_v1";
  try {
    const rawPl = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
    if (rawPl) {
      const parsed = JSON.parse(rawPl);
      if (parsed && typeof parsed === "object") {
        window.PLAYLISTS_DATA = parsed;
      }
    }
  } catch(e) {}

  window.savePlaylistsData = function(data) {
    window.PLAYLISTS_DATA = data;
    try {
      localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("kh_playlists_updated", { detail: data }));
    } catch(e) {}
    const FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/korayhussein-proofing/databases/(default)/documents/client_shoots/playlists_config?key=AIzaSyD0b76g_32uPjLpeezf3QSlTSbAEbSeXjs";
    fetch(FIRESTORE_URL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          updatedAt: { integerValue: String(Date.now()) },
          playlistsJson: { stringValue: JSON.stringify(data) }
        }
      })
    }).catch(() => {});
  };

  window.syncPlaylistsFromCloud = async function() {
    try {
      const FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/korayhussein-proofing/databases/(default)/documents/client_shoots/playlists_config?key=AIzaSyD0b76g_32uPjLpeezf3QSlTSbAEbSeXjs";
      const res = await fetch(FIRESTORE_URL, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.fields && json.fields.playlistsJson) {
        const cloudData = JSON.parse(json.fields.playlistsJson.stringValue);
        if (cloudData) {
          window.PLAYLISTS_DATA = cloudData;
          localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(cloudData));
          window.dispatchEvent(new CustomEvent("kh_playlists_updated", { detail: cloudData }));
        }
      }
    } catch(e) {}
  };
  try { window.syncPlaylistsFromCloud(); } catch(e) {}

})();
