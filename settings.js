/*
  ─────────────────────────────────────────────
   SITE SETTINGS — safe to edit.
   Change the text between the quotes, save, and refresh the browser.
  ─────────────────────────────────────────────
*/
window.SETTINGS = {
  name: "Koray Hussein",
  role: "Photographer",

  // Contact
  email: "hello@korayhussein.com",        // TODO: replace with your real email
  instagram: "korayhussein",              // just the handle, no @

  // About page — TODO: placeholder text, replace with your own words
  statement: "Faces, light, and the quiet moment before the pose.",
  bio: [
    "Koray Hussein is a portrait and fashion photographer working in black and white.",
    "His work favours natural texture, honest skin and strong, simple light — images that feel timeless rather than polished.",
    "Available for editorial, campaign and model development work."
  ],

  // Shown in small type on the intro & footer
  basedIn: "",                              // e.g. "London" — leave empty to hide

  // Splash Screen Images (Optional overrides: customise via the in-app Splash Manager or specify paths here)
  splashImageLandscape: "",                 // e.g. "photos/splash/001 Bree Colter 1.jpg" (leave empty to use chosen/default)
  splashImagePortrait: "",                  // e.g. "photos/portfolio/001 Nyekachi Douglas 2.jpg"

  // Client Proofing Cloud Sync (Firebase Firestore)
  firebase: {
    apiKey: "AIzaSyD0b76g_32uPjLpeezf3QSlTSbAEbSeXjs",
    projectId: "korayhussein-proofing"
  }
};
