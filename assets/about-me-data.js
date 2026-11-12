/* ==========================================================
   About Me Data — Koray Hussein Photography
   First-person biography, Studio specifications & Google Maps,
   Instagram profile integration.
   ========================================================== */

(function() {
  "use strict";

  window.ABOUT_ME_DATA = {
    meta: {
      title: "about me",
      subtitle: "portrait & travel photographer · london",
      location: "London, England",
      heroImage: "photos/contact/2.jpg"
    },

    // First-person biography
    bio: {
      lead: "I'm Koray Hussein, a portrait and travel photographer based in London, England.",
      paragraphs: [
        "Challenging the notion that strength and power are masculine traits, my work draws out each whilst still maintaining the true essence of femininity. These are traits that can only be captured when the model is happy, comfortable and relaxed, and I work hard to maintain the best working environment for each and every person I work with. If all three are achieved and everybody is on the same page, then the images will fall into place.",
        "When it comes to my travel work, I mainly shoot in a street style so as to properly capture the mood and character of each location. No two places are the same, and I try to reflect that in my work."
      ],
      quote: "Challenging the notion that strength and power are masculine traits, drawing out each whilst maintaining the true essence of femininity."
    },

    // Studio details & Google Maps
    studio: {
      name: "Grow Studios",
      address: {
        line1: "Grow Studios",
        street: "92 Wallis Road",
        area: "Hackney Wick",
        city: "London",
        postcode: "E9 5LN",
        full: "Grow Studios, 92 Wallis Road, Hackney Wick, London E9 5LN"
      },
      directions: "My studio is located a short three minute walk from Hackney Wick station, inside Grow Studios. To get to the studio from the station you just turn left when coming out, through the small tunnel, then turn right and then right again. You should find yourself in the areas car park. Grow Studio is at the end of the car park on the right.",
      // Google Maps Embed & Direct Links
      embedUrl: "https://maps.google.com/maps?q=Grow%20Studios%2C%2092%20Wallis%20Road%2C%20Hackney%20Wick%2C%20London%20E9%205LN&t=&z=16&ie=UTF8&iwloc=&output=embed",
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Grow+Studios+92+Wallis+Road+Hackney+Wick+London+E9+5LN",
      googleMapsPlaceUrl: "https://www.google.com/maps/place/Grow+Studios/@51.5428285,-0.0245228,17z/data=!4m6!3m5!1s0x48761d77a83b4b8b:0x5109b83b381ec3a6!8m2!3d51.5428285!4d-0.0245228"
    },

    // Instagram settings (Can be customized with Koray's exact live stats)
    instagram: {
      handle: "korayhussein",
      displayHandle: "@korayhussein",
      url: "https://instagram.com/korayhussein",
      // Connect your free Behold.so feed ID here (e.g. "aB1cD2eF3g") for 100% automated live updates
      beholdFeedId: null,
      // Stats placeholders — update with exact figures from Koray
      stats: {
        followers: null, // e.g. "12.4K"
        following: null, // e.g. "950"
        posts: null      // e.g. "412"
      },
      // 9 most recent posts
      posts: [
        { src: "photos/contact/2.jpg", url: "https://instagram.com/korayhussein" },
        { src: "photos/contact/DSCF8633.jpg", url: "https://instagram.com/korayhussein" },
        { src: "photos/studio/011 Amrita 1.jpg", url: "https://instagram.com/korayhussein" },
        { src: "photos/black-and-white/003 9.jpg", url: "https://instagram.com/korayhussein" },
        { src: "photos/paris-france/DSCF2039.jpg", url: "https://instagram.com/korayhussein" },
        { src: "photos/sets/rachel-ii/008_8.jpg", url: "https://instagram.com/korayhussein" },
        { src: "photos/valencia-spain/DSCF5419.jpg", url: "https://instagram.com/korayhussein" },
        { src: "photos/sets/sheyla/011_16.jpg", url: "https://instagram.com/korayhussein" },
        { src: "photos/sets/melanie/005_15.jpg", url: "https://instagram.com/korayhussein" }
      ]
    },

    // Imagery for the 10 editorial options
    images: {
      hero: "photos/contact/2.jpg",
      portrait: "photos/contact/DSCF8633.jpg",
      street: "photos/paris-france/DSCF2039.jpg",
      studio: "photos/studio/011 Amrita 1.jpg",
      bw: "photos/black-and-white/003 9.jpg",
      travel: "photos/valencia-spain/DSCF5419.jpg",
      fashion: "photos/sets/sheyla/011_16.jpg"
    }
  };

  const ABOUT_STORAGE_KEY = "kh_about_me_data_v1";
  try {
    const rawAbout = localStorage.getItem(ABOUT_STORAGE_KEY);
    if (rawAbout) {
      const parsed = JSON.parse(rawAbout);
      if (parsed && typeof parsed === "object") {
        window.ABOUT_ME_DATA = { ...window.ABOUT_ME_DATA, ...parsed };
      }
    }
  } catch(e) {}

  window.saveAboutMeData = function(data) {
    window.ABOUT_ME_DATA = data;
    try {
      localStorage.setItem(ABOUT_STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("kh_about_me_updated", { detail: data }));
    } catch(e) {}
    const FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/korayhussein-proofing/databases/(default)/documents/client_shoots/about_me_config?key=AIzaSyD0b76g_32uPjLpeezf3QSlTSbAEbSeXjs";
    fetch(FIRESTORE_URL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          updatedAt: { integerValue: String(Date.now()) },
          aboutJson: { stringValue: JSON.stringify(data) }
        }
      })
    }).catch(() => {});
  };

  window.syncAboutMeFromCloud = async function() {
    try {
      const FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/korayhussein-proofing/databases/(default)/documents/client_shoots/about_me_config?key=AIzaSyD0b76g_32uPjLpeezf3QSlTSbAEbSeXjs";
      const res = await fetch(FIRESTORE_URL, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.fields && json.fields.aboutJson) {
        const cloudData = JSON.parse(json.fields.aboutJson.stringValue);
        if (cloudData) {
          window.ABOUT_ME_DATA = { ...window.ABOUT_ME_DATA, ...cloudData };
          localStorage.setItem(ABOUT_STORAGE_KEY, JSON.stringify(cloudData));
          window.dispatchEvent(new CustomEvent("kh_about_me_updated", { detail: cloudData }));
        }
      }
    } catch(e) {}
  };
  try { window.syncAboutMeFromCloud(); } catch(e) {}

})();
