# Rotary Club of Naga Heights — Website

Static multi-page site for a Rotary club, hosted on GitHub Pages at
rcnagaheights.org. Plain HTML/Tailwind/vanilla JS — no build step, no
framework, no package.json. Every page is a self-contained .html file.

## Structure
```
index.html            -> / (About Rotary / homepage)
rotarians/index.html  -> /rotarians/  (Officers, members, president)
projects/index.html   -> /projects/   (Service projects)
foundation/index.html -> /foundation/ (Partner Merchants — still live;
                          planned to be replaced by diskwentulong/, see
                          docs/DTC-DESIGN.md, but that page is NOT built
                          yet)
bulletin/index.html   -> /bulletin/   (exists, not linked in nav yet)
contact/index.html    -> /contact/    (also holds "Get Involved")
assets/rotary-logo.png -> real logo file (was a Drive hotlink, now local)
CNAME                  -> custom domain config, do not remove
docs/DTC-DESIGN.md     -> full DiskwenTulong Card design detail
docs/CONTENT-MANAGEMENT.md -> Google Drive content sync procedure
```

`foundation/` is still live and linked in nav on every page right now.
Per docs/DTC-DESIGN.md it's planned to be replaced by `diskwentulong/`,
but that page doesn't exist yet — do not remove or unlink `foundation/`
until `diskwentulong/` is actually built and ready to take its place.

Each page: own `<title>`/meta description/canonical/OG/Twitter Card/JSON-LD,
shared header+nav+footer duplicated per file (no templating), page-specific
`<script>` only where needed (hero slider on index.html only).

## Stack
Tailwind 3.4.17 (CDN), vanilla JS, Lucide icons 0.263.0 (CDN), Google Fonts
(Libre Franklin + Playfair Display). Color tokens: --blue:#17458f
--deep:#0c3c7c --gold:#f7a81b --mist:#f4f7fc

## Current status
- Site is live on GitHub Pages, DNS + HTTPS confirmed working.
- Phase 1 (public site) in progress — most sections still have PLACEHOLDER
  data (check for literal text like "Officer Name", "Address Here", "XXX"
  in phone numbers before assuming content is real).
- Phase 2 (DiskwenTulong Card + real Digital Bulletin) is NOT built yet.
  Do not re-add DTC register/verify UI or the "Digital Bulletin" nav link
  — deliberately removed, they pointed at a backend that doesn't exist.
  For full current DTC design (which IS actively being planned, just not
  built), see docs/DTC-DESIGN.md — do not assume it's simply "not
  happening" just because the UI isn't live yet.

## Content management (Google Drive)
A Google Drive connector is available to you, but you have no
background awareness of it — you only check Drive when the user asks
(e.g. "run the content sync"). Full procedure, slot counts, and
freshness rules are in docs/CONTENT-MANAGEMENT.md — read it before
doing any Drive-related content work.

## Hard rules — do not reintroduce
- No public membership application form anywhere
- No online card sales for the (future) DiskwenTulong Card
- No random/client-generated card numbers (cards are pre-printed physical
  stock, numbers come from a Sheet, never Math.random()/Date.now())
- No duplicate footer on the Contact page (it has its own expanded layout)
- Only one Four-Way Test section on the About page
- Merchant-facing card verification must never expose cardholder
  email/phone/address — name + status + dates only
- Full DTC-specific rules (expiration logic, member-only registration,
  the two separate QR codes, category schema) are in docs/DTC-DESIGN.md
  — check it before touching anything DTC-related

## Known placeholders / open TODOs
- Confirm current status of logo/banner/Four-Way Test assets with the
  user rather than assuming — these have changed more than once
- Site-wide max-width (1280px, `max-w-7xl` everywhere) leaves large empty
  margins on very wide monitors — a pending decision, not yet actioned;
  must be done consistently across ALL sections if done at all
- "Latest project" (homepage + Projects page) is manually curated HTML,
  not date-sorted — no data source exists yet for real sorting

## Keep this file updated
After a change affecting "Current status" or "Known placeholders," update
those sections as part of your commit — don't leave them stale. This file
is only useful if it reflects reality.

**Keep this file itself short.** If something needs more than a few lines
to explain properly (like the DTC design), put it in its own file under
docs/ and link to it from here instead of expanding this file in place.

## Documentation versioning convention
Applies to this file, anything under docs/, and Google Drive project docs
if you have access to them:
- MINOR changes (a clarification, one resolved decision) -> decimal bump:
  v4 -> v4.1 -> v4.2
- MAJOR changes (substantial rewrite, multiple sections) -> whole number:
  v4.x -> v5
Avoid separate "ADDENDUM" files for small changes, and avoid full
rewrites for one-line updates.

## Verifying changes
No build step, no test suite. Before considering an HTML edit done:
- Run each page's inline `<script>` through `node --check`
- Grep for `canva://` and `drive.google.com` — neither should ever appear
- Confirm internal links use trailing-slash paths (`/rotarians/`, not
  `/rotarians`) to match the folder+index.html structure GitHub Pages uses

## Fuller background
Deeper project history and rationale (why GitHub Pages over Canva, full
phase roadmap) lives in Google Drive docs the user maintains outside this
repo — you now have Drive access, so you can read these directly rather
than asking the user to explain them each time. DTC-specific design detail
is additionally mirrored into docs/DTC-DESIGN.md for convenience.
