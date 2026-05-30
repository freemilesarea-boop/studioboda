# `public/` — Static assets

Files placed here are served from the site root (e.g. `public/favicon.ico` → `/favicon.ico`).

## Current state

- **Favicon**: provided inline as an SVG data-URI in `app/layout.tsx` (`metadata.icons`).
  Drop a real `favicon.ico` here to override it for legacy browsers.
- **OG / social image**: generated at request time by `app/opengraph-image.tsx`
  (real 1200×630 PNG via `next/og`) — no binary asset required.

## Recommended assets to add before/around launch

| File | Size | Purpose |
| --- | --- | --- |
| `favicon.ico` | 32×32 (multi-res) | Legacy browser tab icon |
| `apple-touch-icon.png` | 180×180 | iOS home-screen icon |
| `og-image.png` | 1200×630 | Static OG fallback (optional; route already covers this) |

Once a designed `og-image.png` exists, you can replace the generated route by
referencing `/og-image.png` in `metadata.openGraph.images`.
