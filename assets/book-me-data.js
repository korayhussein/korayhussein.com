/* ==========================================================
   Book Me Editorial Data & Layout Templates
   Structured package options, tiers, add-ons & copy.
   ========================================================== */

window.BOOK_ME_DATA = {
  header: {
    tag: "london studio booking",
    title: "book a studio shoot",
    heroImage: "photos/faq/Tara Wagner 1.jpg",
    heroImageMobile: "photos/black-and-white/004 Flavia Santiago 2.jpg",
    heroMobileAspect: "4 / 5",
    intro: "Whether you're a new model looking to get signed or an experienced model looking to refresh your book, we'll be able to create the kind of studio images you're looking for.",
    bookingTicker: "currently taking bookings for december and january",
    travelEnabled: true,
    travelTicker: "upcoming travel: paris · 12–18 may",
    travelDates: [
      "paris · 12–18 may",
      "new york · 2–9 june",
      "milan · 16–22 june"
    ]
  },

  heroImages: [
    { src: "photos/book-me/10.jpg", alt: "Studio portrait 1" },
    { src: "photos/book-me/9.jpg", alt: "Studio portrait 2" },
    { src: "photos/book-me/13.jpg", alt: "Studio portrait 3" }
  ],

  showcases: [
    {
      id: "portfolio",
      tag: "session showcase",
      title: "portfolio session",
      desc: "A good mix of full body, mid length and headshots to give you complete variety for your portfolio or model book.",
      images: [
        {
                "src": "photos/book-me/portfolio/01_01.jpg",
                "alt": "Portfolio session image 1"
        },
        {
                "src": "photos/book-me/portfolio/02_02.jpg",
                "alt": "Portfolio session image 2"
        },
        {
                "src": "photos/book-me/portfolio/03_03.jpg",
                "alt": "Portfolio session image 3"
        }
]
    },
    {
      id: "beauty",
      tag: "session showcase",
      title: "beauty/headshot session",
      desc: "Purely focused on beauty and headshot portraiture, clean studio lighting, skin texture, and expressions.",
      images: [
        {
                "src": "photos/book-me/beauty/01_01.jpg",
                "alt": "Beauty session image 1"
        },
        {
                "src": "photos/book-me/beauty/02_02.jpg",
                "alt": "Beauty session image 2"
        },
        {
                "src": "photos/book-me/beauty/03_03.jpg",
                "alt": "Beauty session image 3"
        }
]
    },
    {
      id: "polaroids",
      tag: "session showcase",
      title: "polaroids session",
      desc: "Clean, natural light digitals for agencies, scouts, and casting directors. Delivered unedited and raw for casting integrity.",
      images: [
        {
                "src": "photos/book-me/polaroids/01_01.jpg",
                "alt": "Polaroids session image 1"
        },
        {
                "src": "photos/book-me/polaroids/02_02.jpg",
                "alt": "Polaroids session image 2"
        },
        {
                "src": "photos/book-me/polaroids/03_03.jpg",
                "alt": "Polaroids session image 3"
        }
]
    },
    {
      id: "all-other-enquiries",
      tag: "bespoke & commercial",
      title: "all other enquiries",
      desc: "If you're looking for a more bespoke or tailored shoot, or if you're a brand looking for content, please send over a request with any pertinent information and I'll get back to you as soon as I can.",
      images: [
        {
          "src": "photos/colour/001 Flavia Santiago 1.jpg",
          "alt": "All other enquiries example 1"
        },
        {
          "src": "photos/colour/002 Danni 1.jpg",
          "alt": "All other enquiries example 2"
        },
        {
          "src": "photos/colour/003 Nyeka 1.jpg",
          "alt": "All other enquiries example 3"
        }
      ]
    }
  ],

  packages: [
    {
      id: "portfolio",
      category: "studio portraiture",
      title: "portfolio session",
      price: "from £300",
      details: "Two hour session",
      desc: "This is the all rounder. we will get a good mix of full body, mid length and headshots to give you a variety of images. Comes with the option of a polaroids session as an add-on for £70.",
      fullDesc: "This is the all rounder. we will get a good mix of full body, mid length and headshots to give you a variety of images.",
      hasDeposit: true,
      depositNote: "Only a 50% deposit is required to secure the slot. At least a week's notice is needed if you want to move your booking to another date.",
      options: [
        { id: "nine-images", label: "nine images package", countText: "9 edited images", price: 300, priceFormatted: "£300", default: true },
        { id: "twelve-images", label: "twelve images package", countText: "12 edited images", price: 350, priceFormatted: "£350" }
      ],
      addOns: [
        { id: "polaroids", label: "polaroids session add-on", price: 70, priceFormatted: "£70", note: "Clean, natural light digitals for agencies, scouts & casting directors (front & 45° headshots, 3/4 and full length)." }
      ]
    },
    {
      id: "beauty",
      category: "specialist focus",
      title: "beauty/headshot session",
      price: "from £240",
      details: "One to two hour session",
      desc: "This package is purely for beauty or headshots. Comes with the option of a polaroids session as an add-on for £70.",
      fullDesc: "This package is purely for beauty or headshots. Comes with the option of a polaroids session as an add-on for £70.",
      hasDeposit: true,
      depositNote: "Only a 50% deposit is required to secure the slot. At least a week's notice is needed if you want to move your booking to another date.",
      options: [
        { id: "three-images", label: "three images package", countText: "3 edited images", price: 240, priceFormatted: "£240", default: true },
        { id: "six-images", label: "six images package", countText: "6 edited images", price: 300, priceFormatted: "£300" },
        { id: "nine-images", label: "nine images package", countText: "9 edited images", price: 360, priceFormatted: "£360" }
      ],
      addOns: [
        { id: "polaroids", label: "polaroids session add-on", price: 70, priceFormatted: "£70", note: "Clean, natural light digitals for agencies, scouts & casting directors (front & 45° headshots, 3/4 and full length)." }
      ]
    },
    {
      id: "polaroids",
      category: "agency digitals",
      title: "polaroids session",
      price: "£110",
      details: "Forty five minute session",
      desc: "Quick and shot with studio lights to replicate natural light.",
      fullDesc: "Clean, natural light digitals for agencies, scouts, and casting directors. Front & 45° headshots, 3/4 length, and full-length. Quick and shot with studio lights to replicate daylight. Delivered unedited and raw for casting integrity.",
      hasDeposit: false,
      options: [
        { id: "agency-digitals", label: "complete digital set", countText: "Full casting set (raw)", price: 110, priceFormatted: "£110", default: true }
      ],
      addOns: []
    },
    {
      id: "all-other-enquiries",
      category: "bespoke & commercial",
      title: "all other enquiries",
      price: "bespoke quote",
      details: "tailored / bespoke",
      desc: "If you're looking for a more bespoke or tailored shoot, or if you're a brand looking for content, please send over a request with any pertinent information and I'll get back to you as soon as I can.",
      fullDesc: "If you're looking for a more bespoke or tailored shoot, or if you're a brand looking for content, please send over a request with any pertinent information and I'll get back to you as soon as I can.",
      hasDeposit: false,
      isCustomQuote: true,
      options: [
        { id: "custom-quote", label: "bespoke commission / commercial brief", countText: "Tailored to your brief", price: 0, priceFormatted: "tailored quote", default: true }
      ],
      addOns: []
    }
  ],

  features: [
    {
      tag: "the space",
      title: "a little about the studio...",
      body: "The studio is located in one of London's creative hubs in Hackney Wick, a short five-minute walk from the station. Situated on the first floor with abundant natural light. A private changing nook is fashioned with ten-foot poly boards so you can change in complete privacy, and an iron/steamer is always on hand."
    },
    {
      tag: "the approach",
      title: "a little about me...",
      body: "I've been working as a portrait photographer for over six years with brands and model agencies across London, Paris, and Milan. For portfolio shoots, I'm an avid believer that the focus needs to be purely on the model—classic framing, beautiful light, zero gimmicks."
    }
  ],

  midImages: [
    { src: "photos/book-me/2.jpg", alt: "Studio editorial 2" },
    { src: "photos/book-me/Flavia Santiago 1.jpg", alt: "Studio editorial Flavia" },
    { src: "photos/book-me/Tuti Pon 1.jpg", alt: "Studio editorial Tuti" }
  ],

  bookingInfo: [
    {
      title: "for models booking directly",
      text: "Just drop me a note below with your name, portfolio or Instagram link, and preferred dates. If you'd like to book multiple shoots, let me know in the message and we will arrange a tailored schedule."
    },
    {
      title: "for agencies booking for models",
      text: "Drop a message below or email directly. For multiple models on the same day or polaroid update batches (minimum 3 sessions), mention this in the note to coordinate timings."
    }
  ],

  contact: {
    hero: "photos/book-me/tara 10.jpg",
    email: "bookings@korayhussein.com",
    instagram: "https://instagram.com/korayhussein"
  }
};

// LocalStorage & Cloud synchronization
(function() {
  const BUILTIN_ALL_OTHER_PKG = {
    id: "all-other-enquiries",
    category: "bespoke & commercial",
    title: "all other enquiries",
    price: "bespoke quote",
    details: "tailored / bespoke",
    desc: "If you're looking for a more bespoke or tailored shoot, or if you're a brand looking for content, please send over a request with any pertinent information and I'll get back to you as soon as I can.",
    fullDesc: "If you're looking for a more bespoke or tailored shoot, or if you're a brand looking for content, please send over a request with any pertinent information and I'll get back to you as soon as I can.",
    hasDeposit: false,
    isCustomQuote: true,
    options: [
      { id: "custom-quote", label: "bespoke commission / commercial brief", countText: "Tailored to your brief", price: 0, priceFormatted: "tailored quote", default: true }
    ],
    addOns: []
  };

  const BUILTIN_ALL_OTHER_SHOWCASE = {
    id: "all-other-enquiries",
    tag: "bespoke & commercial",
    title: "all other enquiries",
    desc: "If you're looking for a more bespoke or tailored shoot, or if you're a brand looking for content, please send over a request with any pertinent information and I'll get back to you as soon as I can.",
    images: [
      {
        "src": "photos/colour/001 Flavia Santiago 1.jpg",
        "alt": "All other enquiries example 1"
      },
      {
        "src": "photos/colour/002 Danni 1.jpg",
        "alt": "All other enquiries example 2"
      },
      {
        "src": "photos/colour/003 Nyeka 1.jpg",
        "alt": "All other enquiries example 3"
      }
    ]
  };

  function ensureAllOtherEnquiries(target) {
    if (!target) return;
    if (Array.isArray(target.packages)) {
      if (!target.packages.some(p => p.id === "all-other-enquiries")) {
        target.packages.push(BUILTIN_ALL_OTHER_PKG);
      }
    }
    if (Array.isArray(target.showcases)) {
      if (!target.showcases.some(s => s.id === "all-other-enquiries")) {
        target.showcases.push(BUILTIN_ALL_OTHER_SHOWCASE);
      }
    }
  }

  const BOOK_ME_STORAGE_KEY = "kh_book_me_data_v1";
  try {
    const raw = localStorage.getItem(BOOK_ME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        window.BOOK_ME_DATA = { ...window.BOOK_ME_DATA, ...parsed };
      }
    }
  } catch(e) {}
  ensureAllOtherEnquiries(window.BOOK_ME_DATA);

  window.saveBookMeData = function(data) {
    ensureAllOtherEnquiries(data);
    window.BOOK_ME_DATA = data;
    try {
      localStorage.setItem(BOOK_ME_STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("kh_book_me_updated", { detail: data }));
    } catch(e) {}
    const FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/korayhussein-proofing/databases/(default)/documents/client_shoots/book_me_config?key=AIzaSyD0b76g_32uPjLpeezf3QSlTSbAEbSeXjs";
    fetch(FIRESTORE_URL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          updatedAt: { integerValue: String(Date.now()) },
          bookMeJson: { stringValue: JSON.stringify(data) }
        }
      })
    }).catch(() => {});
  };

  window.syncBookMeFromCloud = async function() {
    try {
      const FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/korayhussein-proofing/databases/(default)/documents/client_shoots/book_me_config?key=AIzaSyD0b76g_32uPjLpeezf3QSlTSbAEbSeXjs";
      const res = await fetch(FIRESTORE_URL, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.fields && json.fields.bookMeJson) {
        const cloudData = JSON.parse(json.fields.bookMeJson.stringValue);
        if (cloudData) {
          window.BOOK_ME_DATA = { ...window.BOOK_ME_DATA, ...cloudData };
          ensureAllOtherEnquiries(window.BOOK_ME_DATA);
          localStorage.setItem(BOOK_ME_STORAGE_KEY, JSON.stringify(window.BOOK_ME_DATA));
          window.dispatchEvent(new CustomEvent("kh_book_me_updated", { detail: window.BOOK_ME_DATA }));
        }
      }
    } catch(e) {}
  };
  try { window.syncBookMeFromCloud(); } catch(e) {}
})();
