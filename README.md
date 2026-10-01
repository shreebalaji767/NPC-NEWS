# NPC NEWS

NPC NEWS is a fictional/satirical static newsroom about the everyday consequences of extraordinary battles.

## Included

- Responsive desktop, tablet and mobile newsroom UI
- Client-side story navigation and incident pages
- Fictional world, battle, damage, business, transport and NPC-life coverage
- In-page story search (`/` focuses search, `Esc` clears it)
- Installable Progressive Web App (PWA)
- Offline-first service worker cache
- Accessibility improvements including reduced-motion support and screen-reader labels
- Static data generation through `generate.py`

## Local development

1. Run `python generate.py` to regenerate the static site assets.
2. Serve `dist/` with any static HTTP server.
3. Open the resulting site in a browser.

Example:

    python -m http.server 8000 --directory dist

Then open `http://localhost:8000`.

## Important

NPC NEWS is fictional/satirical. It is not a real news organization and does not report real-world events.
