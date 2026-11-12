# Roadmap & Notes for Future Work

## Agreed plan (2026-10-31)
1. **Now:** finish building pages one at a time from folders in `Page Images/<Page>/`,
   built with `python3 tools/build_pages.py` (folder → page mapping lives in `PAGES` in that script).
2. **Later:** build a lightweight Mac site-editor app.

## Mac site-editor app — chosen approach: Option 1
A local editor that opens in the browser, launched from a Dock/Applications icon.
Runs on the Mac's built-in Python (nothing to install).

Features wanted:
- Create / rename / delete / reorder galleries; drag photos in; drag to reorder.
- Add names (captions) to individual images.
- Create and edit text pages (like **Book Me**) with a simple formatting editor.
- Live preview on the real site design.
- "Publish" button (depends on chosen host, e.g. Netlify / Vercel / GitHub Pages).

Technical notes:
- Move page/image/caption/text data into one tidy content file that the site reads
  and the app edits (replacing hand-edited parts of `data.js`).
- Must keep working with the existing `Page Images/` folders.

Alternatives considered (not chosen): native Swift app (needs Xcode, slower to change);
Electron/Tauri wrapper (extra tooling, large app size).
