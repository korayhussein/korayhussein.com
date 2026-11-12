Annie Set — Photo Gallery Setup
=================================

1. Drop your selected images for Annie's set into this folder.
   Supported formats: .jpg, .jpeg, .png, .tif, .tiff, .heic, .webp

2. Naming / Order:
   - Photos will appear on the set page in alphabetical/numerical order (e.g. 01.jpg, 02.jpg, ...).
   - Cover photo: If you want a specific photo to be the cover card on the '#/sets' index, include "hero" in its filename (e.g. "hero.jpg" or "01_hero.jpg"). If not specified, the first photo will be used.
   - Optional: You can create an `order.txt` file with one filename per line to define an exact sequence.

3. Once you've added your photos:
   - Ask Antigravity to "rebuild the pages" (or run `python3 tools/build_pages.py`).
   - Web-sized copies (max 2000px) will be created automatically, and the site gallery at `#/set/annie` will update immediately.
