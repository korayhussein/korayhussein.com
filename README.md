# korayhussein.com

Hand-built portfolio site. No frameworks, no build step — just open `index.html`.

## Folders

| Folder / file | What it is |
|---|---|
| `photos/` | **Your original images.** This is the only place you put photos. |
| `photos/splash/` | The big intro image on the homepage. |
| `photos/home/` | Homepage favourites. `order.txt` controls the order. |
| `photos/series/<Name>/` | One gallery per folder; the folder name becomes the title. |
| `settings.js` | Your name, email, Instagram, about text. Safe to edit. |
| `images/`, `content.js` | Auto-generated — don't edit. |
| `assets/` | Design & animation code. |

## Updating photos

1. Add / remove / rename files in `photos/`.
2. Run `python3 tools/update.py` (or just ask Antigravity to "update the site photos").
3. Refresh the browser.

Tip: caption = filename, minus the trailing number (`Kayleigh Grant 2.jpg` → "Kayleigh Grant").

## Preview modes

- `index.html` — full experience (intro plays once per browser tab).
- `index.html?static` — no animation (also what visitors with "reduce motion" get).
