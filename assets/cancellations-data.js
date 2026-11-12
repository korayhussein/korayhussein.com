/* ==========================================================
   Last-Minute Cancellations & Priority Notification Data Store
   Manages live cancellation openings, subscriber waitlist,
   and email broadcast drafting for Koray Hussein Photography.
   ========================================================== */

(function() {
  "use strict";

  const STORAGE_KEY = "kh_cancellations_priority_data_v1";
  const FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/korayhussein-proofing/databases/(default)/documents/client_shoots/cancellations_config?key=AIzaSyD0b76g_32uPjLpeezf3QSlTSbAEbSeXjs";
  let inMemoryData = null;

  const DEFAULT_DATA = {
    header: {
      tag: "priority list &middot; last-minute openings",
      title: "cancellation notifications",
      subtitle: "Join the private priority list to receive direct email alerts whenever a last-minute studio or location slot becomes available due to rescheduling.",
      heroImage: "photos/faq/Tara Wagner 1.jpg"
    },
    introCard: {
      tag: "priority notification list",
      heading: "direct notifications for short-notice studio dates",
      body: "When a scheduled commercial shoot, agency test, or portfolio booking moves dates at short notice, an unexpected studio or location session opens up.\n\nOnce you enter your information below, you will be added directly to my private cancellation list. Whenever a suitable last-minute slot opens up that matches what you are looking for, I will email you personally so you can take the slot before it is shared publicly."
    },
    formConfig: {
      tag: "join the list",
      title: "enter your details",
      subtitle: "Fill in the fields below. I'll reach out directly by email as soon as an opening arises.",
      submitButtonText: "Join Cancellation Priority List &rarr;",
      privacyNote: "🔒 Strictly confidential. I will only contact you personally when a suitable opening occurs.",
      successTitle: "you're on the priority notification list",
      successDesc: "Thank you for joining. Whenever an unexpected cancellation or short-notice opening arises, you will receive an immediate private notification at your email address.",
      bookingAsOptions: [
        "model (direct booking)",
        "agency (for represented model)",
        "actor / creative headshots",
        "other creative / brand enquiry"
      ],
      shootTypeOptions: [
        "portfolio shoot",
        "beauty shoot",
        "polaroids"
      ],
      timeOfDayOptions: [
        "any (most flexible)",
        "morning",
        "daytime",
        "evening"
      ]
    },
    currentOpening: {
      isActive: false,
      date: "Friday, 21 November 2026",
      time: "Full Day / Afternoon Session (11:00 – 17:00)",
      location: "East London Daylight Studio",
      sessionType: "Fashion Editorial / Model Portfolio Refresh",
      rateNote: "Short-notice studio rate: £420 (includes full daylight studio hire & 10 retouched selects)",
      message: "A scheduled campaign shoot has moved dates, opening up this coming Friday in our East London daylight studio. If you're looking to update your model book or shoot an editorial story, this slot is available at short notice.",
      publishedAt: "2026-11-06T12:00:00Z"
    },
    subscribers: [
      {
        id: "sub-101",
        name: "Elena Rostova",
        email: "elena.rostova@stormmodels.co.uk",
        socialOrWebsite: "@elenarostova",
        bookingAs: "agency (for represented model)",
        shootType: "portfolio shoot",
        timeOfDay: "daytime",
        dateSubscribed: "2026-11-01T10:15:00Z"
      },
      {
        id: "sub-102",
        name: "Sarah Jenkins",
        email: "sarah@jenkinsstyling.com",
        socialOrWebsite: "@sarahjenkins_style",
        bookingAs: "model (direct booking)",
        shootType: "beauty shoot",
        timeOfDay: "any",
        dateSubscribed: "2026-11-02T14:30:00Z"
      },
      {
        id: "sub-103",
        name: "Maya Lin",
        email: "maya.lin.model@gmail.com",
        socialOrWebsite: "mayalinportfolio.com",
        bookingAs: "model (direct booking)",
        shootType: "polaroids",
        timeOfDay: "morning",
        dateSubscribed: "2026-11-03T09:45:00Z"
      },
      {
        id: "sub-104",
        name: "Marcus Vance",
        email: "marcus@vancestudio.co.uk",
        socialOrWebsite: "@marcusvance",
        bookingAs: "actor / creative headshots",
        shootType: "portfolio shoot",
        timeOfDay: "evening",
        dateSubscribed: "2026-11-04T16:20:00Z"
      }
    ]
  };

  function loadCancellationsData() {
    if (inMemoryData && typeof inMemoryData === "object") {
      return inMemoryData;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          inMemoryData = {
            header: { ...DEFAULT_DATA.header, ...(parsed.header || {}) },
            introCard: { ...DEFAULT_DATA.introCard, ...(parsed.introCard || {}) },
            formConfig: { ...DEFAULT_DATA.formConfig, ...(parsed.formConfig || {}) },
            currentOpening: { ...DEFAULT_DATA.currentOpening, ...(parsed.currentOpening || {}) },
            subscribers: Array.isArray(parsed.subscribers) ? parsed.subscribers : DEFAULT_DATA.subscribers
          };
          return inMemoryData;
        }
      }
    } catch (e) {
      console.warn("Could not load cancellations data from localStorage, using defaults", e);
    }
    inMemoryData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    return inMemoryData;
  }

  function saveCancellationsData(data, pushToCloud = true) {
    inMemoryData = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("kh_cancellations_updated", { detail: data }));
    } catch (e) {
      console.error("Failed to save cancellations data to localStorage", e);
    }

    // Persist to local server
    fetch("/api/save-cancellations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancellations: data })
    }).catch(() => {});

    // Sync to Firestore Cloud for all devices
    if (pushToCloud) {
      fetch(FIRESTORE_URL, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({
          fields: {
            updatedAt: { integerValue: String(Date.now()) },
            cancellationsJson: { stringValue: JSON.stringify(data) }
          }
        })
      }).catch(err => console.warn("Failed to patch cancellations to Firestore:", err));
    }
  }

  async function syncCancellationsFromCloud() {
    try {
      const res = await fetch(FIRESTORE_URL, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json || !json.fields || !json.fields.cancellationsJson) return null;
      const cloudData = JSON.parse(json.fields.cancellationsJson.stringValue);
      if (cloudData && typeof cloudData === "object") {
        inMemoryData = {
          header: { ...DEFAULT_DATA.header, ...(cloudData.header || {}) },
          introCard: { ...DEFAULT_DATA.introCard, ...(cloudData.introCard || {}) },
          formConfig: { ...DEFAULT_DATA.formConfig, ...(cloudData.formConfig || {}) },
          currentOpening: { ...DEFAULT_DATA.currentOpening, ...(cloudData.currentOpening || {}) },
          subscribers: Array.isArray(cloudData.subscribers) ? cloudData.subscribers : DEFAULT_DATA.subscribers
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryData));
        } catch (e) {}
        window.dispatchEvent(new CustomEvent("kh_cancellations_updated", { detail: inMemoryData }));
        return inMemoryData;
      }
    } catch (e) {
      console.warn("Could not sync cancellations from cloud:", e);
    }
    return null;
  }

  function addSubscriber(entry) {
    const data = loadCancellationsData();
    const newSub = {
      id: "sub-" + Date.now(),
      name: entry.name || "Anonymous",
      email: entry.email || "",
      socialOrWebsite: entry.socialOrWebsite || entry.instagram_or_website || entry.instagram || "",
      bookingAs: entry.bookingAs || entry.booking_as || entry.role || "model (direct booking)",
      shootType: entry.shootType || entry.shoot_type || "portfolio shoot",
      timeOfDay: entry.timeOfDay || entry.time_of_day || "any",
      dateSubscribed: new Date().toISOString()
    };
    data.subscribers = [newSub, ...(data.subscribers || [])];
    saveCancellationsData(data);
    return newSub;
  }

  function deleteSubscriber(id) {
    const data = loadCancellationsData();
    data.subscribers = (data.subscribers || []).filter(s => s.id !== id);
    saveCancellationsData(data);
    return data.subscribers;
  }

  function updateOpening(opening) {
    const data = loadCancellationsData();
    data.currentOpening = {
      ...data.currentOpening,
      ...opening,
      publishedAt: new Date().toISOString()
    };
    saveCancellationsData(data);
    return data.currentOpening;
  }

  function updateIntroCard(card) {
    const data = loadCancellationsData();
    data.introCard = {
      ...DEFAULT_DATA.introCard,
      ...(data.introCard || {}),
      ...card
    };
    saveCancellationsData(data);
    return data.introCard;
  }

  function updateFormConfig(config) {
    const data = loadCancellationsData();
    data.formConfig = {
      ...DEFAULT_DATA.formConfig,
      ...(data.formConfig || {}),
      ...config
    };
    saveCancellationsData(data);
    return data.formConfig;
  }

  // Export to window
  window.CANCELLATIONS_DATA = {
    loadCancellationsData,
    saveCancellationsData,
    syncCancellationsFromCloud,
    addSubscriber,
    deleteSubscriber,
    updateOpening,
    updateIntroCard,
    updateFormConfig,
    DEFAULT_DATA
  };

  // Synchronous hydrate on load
  try {
    syncCancellationsFromCloud();
  } catch (e) {}

})();
