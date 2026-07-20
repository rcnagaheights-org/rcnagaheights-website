# Service Projects Page — Workflow & Design Detail (SUPERSEDED)
Version: v1.1 · Last updated: 2026-07-20

## Status
**SUPERSEDED as of 2026-07-20 by docs/SERVICE-PROJECTS-DESIGN.md.**
§1-3 below describe a hand-coded single-hero + `archive-card`-grid
design that no longer exists in `projects/index.html` — it was fully
replaced by a data-driven page organized by Rotary's Areas of Focus /
Avenues of Service. Kept here for history only; do not treat §1-3 as
current. **§4 (Share button) and §5 still apply** — the new page
carried forward the same `shareProject()` mechanism and lightbox
pattern unchanged, just fed by different data.

## 1. Succession/retirement workflow — manual, no CMS (HISTORICAL — see docs/SERVICE-PROJECTS-DESIGN.md §3-4 for the current logic)
There is no data source or CMS for projects — the "Most Recent Service
Project" hero and the "Other Projects" archive grid are both hand-
written HTML in `projects/index.html`. When a new project launches:

1. Copy the current hero block's title, description, and image into a
   new card at the front of the `archive-card` grid (it needs
   `data-title` and `data-img` attributes — see §3).
2. Overwrite the hero block (`featured-project-hero`/`-title`/`-desc`)
   with the new project's own title, description, and image.

This is a manual copy-paste-and-swap each time, not automated — fine at
the current scale (single digits of projects), but won't scale
gracefully past roughly 15-20 without a real data source. Not a problem
to solve now, just a known ceiling.

## 2. Image sizing — one photo per project, two derived sizes (HISTORICAL)
Each project is handed over as ONE raw photo. Two sizes are generated
from it (by Claude, when adding the project) — the club never needs to
prepare more than one file:
- **Hero**: matches the homepage's "What We Do" carousel treatment —
  `aspect-video` (16:9), full width of the `max-w-7xl` container.
  Target source: ~1600x900, compressed, well under 500KB.
- **Archive thumbnail**: a separate, smaller derivative (~600px wide)
  for the small `h-44` grid tiles — NOT the same file as the hero
  image. Reusing the full hero-resolution file for a 176px-tall
  thumbnail would waste bandwidth on every visitor once a project
  retires into the archive grid, especially on mobile.

## 3. Archive grid → lightbox on click (HISTORICAL — `.archive-card`/`data-title`/`data-img` no longer exist; current carousel markup is in docs/SERVICE-PROJECTS-DESIGN.md §2, §5)
Each `.archive-card` div carries `data-title` and `data-img` (the
thumbnail's full-size counterpart, not necessarily identical to the
thumbnail file — see §2) and is keyboard-accessible (`role="button"
tabindex="0"`, Enter/Space to open). Clicking or activating a card opens
`#lightbox-modal`, a simple full-image popup (same `.modal-hidden`
pattern used elsewhere on the site) with its own Share button. Closes
via the X button, clicking the scrim, or Escape.

## 4. Share button — platform constraints, not a site bug
Both the hero and the lightbox have a Share button, wired to a single
`shareProject(title, text, imgUrl)` function. Two real platform
constraints shaped the design, worth understanding before "fixing"
this differently later:

- **Instagram has no web share intent at all.** No website, this one
  included, can deep-link to "share this to Instagram" — Meta simply
  doesn't expose that on the web. Instagram only shows up as a share
  target via the phone's native OS share sheet.
- **A Facebook link-share button (`sharer.php?u=...`) shares a URL, and
  Facebook unfurls that URL using ITS Open Graph tags** — but this site
  has one URL for the whole Projects page, not one per project. A
  link-based share button would show the wrong photo for any project
  except whichever one currently has the page's static `og:image`.

Given that, `shareProject()` uses the **Web Share API with actual file
bytes** (`navigator.share({ files: [...] })`): it fetches the specific
project's own image, wraps it in a `File`, and hands it to the OS share
sheet — which is correct per-project on any target app, by construction
(no URL/OG-tag involved at all). If the browser doesn't support file
sharing (some desktop browsers), it falls back to opening the image
directly in a new tab so the user can save/attach it manually. There is
deliberately no separate Facebook-only fallback button, since that
would risk showing the wrong project's image — see the constraint
above.

## 5. Known test limitation (not a production issue)
This repo's sandboxed dev environment blocks `images.pexels.com` (the
placeholder stock photos this old design's archive grid used) and
`cdn.jsdelivr.net` (Lucide icons), so neither renders when testing
locally in that environment. Confirmed working with a real same-origin
image instead — at the time this was written, that was
`/assets/service-projects/binhi-ng-kinabukasan.png`; that exact file no
longer exists (moved/renamed to
`/assets/service-projects/areas-of-focus/binhi-ng-kinabukasan.jpg` as
part of the 2026-07-20 rework), but the same testing approach (swap in
any real same-origin image) still applies and was used again for the
new design — see docs/SERVICE-PROJECTS-DESIGN.md.
