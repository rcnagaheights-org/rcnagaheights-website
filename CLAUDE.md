# Rotary Club of Naga Heights — Website

Static multi-page site for a Rotary club, hosted on GitHub Pages at
rcnagaheights.org. Plain HTML/Tailwind/vanilla JS — no build step, no
framework, no package.json. Every page is a self-contained .html file.

## Structure
```
index.html               -> / (About Rotary / homepage)
rotarians/index.html     -> /rotarians/  (Officers, members, president)
projects/index.html      -> /projects/   (Service projects)
diskwentulong/index.html -> /diskwentulong/ (DTC info + partner merchant
                             directory, replaces the old foundation/ page
                             as of 2026-07-18 — see docs/DTC-DESIGN.md)
verify/index.html       -> /verify/  (public, no-index: partner-counter
                             card verification, printed at partner
                             counters per docs/DTC-DESIGN.md §4)
register/index.html     -> /register/ (no-index: register a client's
                             card — Google Sign-In restricted to
                             @rcnagaheights.org, confirmed working live
                             as of 2026-07-20, see docs/DTC-DESIGN.md §3)
bulletin/index.html      -> /bulletin/   (exists, not linked in nav yet)
contact/index.html       -> /contact/    (also holds "Get Involved")
assets/rotary-logo.png -> real logo file (was a Drive hotlink, now local)
CNAME                  -> custom domain config, do not remove
docs/DTC-DESIGN.md     -> full DiskwenTulong Card design detail
docs/CONTENT-MANAGEMENT.md -> Google Drive content sync procedure
docs/PROJECTS-PAGE.md  -> Service Projects page workflow, HISTORICAL —
                           superseded 2026-07-20 by the data-driven
                           rework below (its Share-button section
                           still applies, the rest does not)
docs/SERVICE-PROJECTS-DESIGN.md -> data-driven Service Projects rework
                           (Areas of Focus / Avenues of Service), BUILT
                           and live, one real project (BINHI) built so
                           far, 5 more real rows blocked on missing
                           sheet fields (not photos) — see its §6
docs/QA-STATUS.md      -> what's actually confirmed live vs. only
                           sandbox-tested, and the open DTC/QA risk list
docs/BACKEND-CAPABILITY-TEST.md -> what Claude has actually tested (not
                           assumed) it can/can't do against Drive/Sheets
```

`foundation/` has been removed entirely (no redirect, deliberately a 404)
and replaced by `diskwentulong/` in the nav on every page. Do not
re-add a `foundation/` page or link.

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
  data (check for literal text like "Address Here", "XXX" in phone
  numbers before assuming content is real).
- Rotarians page now has the full real roster (29 people, from a Drive
  membership sheet) instead of 4 hardcoded name slots — still plain
  hardcoded HTML, not data-driven; re-editing this file by hand is
  expected for future roster changes until/unless it's rebuilt data-driven.
- Homepage hero is a rotating carousel of 3 real photos (confirmed with
  the user 2026-07-19 — earlier guidance calling it a single static image
  was superseded). Each slide now renders as a single `object-cover`
  image (2026-07-20) — the earlier treatment (a heavily blurred/scaled
  duplicate layered behind an `object-contain` copy, plus a navy
  gradient tint left over from when the hero still had overlaid text)
  was removed after it caused visible blur bars on narrower viewports
  and muted/darkened the photos with no text left to justify the tint.
  Tradeoff: `object-cover` crops on narrow screens, so the "Create
  Lasting Impact" branding baked into the bottom of each photo gets cut
  off on mobile. A Drive requirement doc (2026-07-19) asks for separate
  mobile-crop exports of each hero photo via a `<picture>` element,
  which would properly solve this — not built yet, no mobile crop
  images exist in Drive yet either.
- Projects page was rebuilt 2026-07-20 as fully data-driven — no more
  manual "latest project" hero or hand-coded archive grid, that design
  is retired (docs/PROJECTS-PAGE.md, marked historical, though its
  Share-button section §4 still applies unchanged). See "Known
  placeholders" below for exactly what's built vs. still missing.
- DTC backend is now live: ONE Apps Script Web App deployment
  ("Access: Anyone", 2026-07-19), shared by `/diskwentulong/` (live
  getPartners, falls back to the static partners.json if empty/
  unreachable), `/verify/`, and `/register/`. Registration member
  authentication has been tried 3 times: Session.getActiveUser() (broken
  for cross-origin fetch), a Google Sign-In + ID-token flow (dropped as
  too much Cloud Console setup at the time, leaving a no-auth window),
  then re-added a 3rd time: Google Sign-In restricted to
  @rcnagaheights.org via the OAuth consent screen's "Internal" setting +
  ID-token verification. This 3rd attempt needed two separate fixes
  before it actually worked, confirmed live 2026-07-20: (1) Code.gs v6
  fixed an `email_verified` boolean-vs-string type mismatch inside
  `verifyIdToken_`; (2) Code.gs v7 — not a code bug at all — the script
  had never been granted the `script.external_request` Apps Script
  authorization scope (no version before v5 ever called
  UrlFetchApp.fetch against an external host), which a background Web
  App request can't self-grant since it has no interactive session;
  fixed by manually running a one-time `authorizeExternalRequest()`
  helper from the Apps Script editor to trigger that consent screen.
  Live-tested 2026-07-20: registered DTC-TEST-00002 and DTC-TEST-00003
  while signed in as admin@rcnagaheights.org, `registered_by` recorded
  correctly both times. See docs/DTC-DESIGN.md §3 for the full history.
  Register + verify were also confirmed working end-to-end 2026-07-19
  in the prior no-auth state (real test: registered DTC-TEST-00001,
  then verified it showed ACTIVE with correct dates). See
  docs/QA-STATUS.md for exactly which DTC edge cases (duplicate/invalid
  cards, multiple batches, concurrent registration, a rejected non-
  domain account) are still untested before any real physical card
  printing run. The "Digital Bulletin" nav link is still deliberately
  absent — that backend doesn't exist.

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
- `bulletin/index.html`'s meta description/OG/Twitter tags promise "our
  archive of past issues," but the page itself has no archive — just a
  single placeholder "Latest Issue" (stock photo, dead `href="#"`
  download link) and an empty "Flipbook Viewer" box. Meta overclaims
  content that doesn't exist yet; low severity (SEO/social-preview
  only, page isn't linked from nav) but worth fixing before this page
  is ever actually linked or shared.
- No automated test suite exists anywhere in this repo (confirmed via
  audit 2026-07-20) — see docs/QA-STATUS.md for the full risk list,
  including which "confirmed working" claims are backed by the user's
  live screenshots vs. only sandbox-tested.
- Confirm current status of logo/banner/Four-Way Test assets with the
  user rather than assuming — these have changed more than once
- Site-wide max-width (1280px, `max-w-7xl` everywhere) leaves large empty
  margins on very wide monitors — a pending decision, not yet actioned;
  must be done consistently across ALL sections if done at all
- Projects page rebuilt 2026-07-20 as data-driven, organized by
  Rotary's Areas of Focus / Avenues of Service (see
  docs/SERVICE-PROJECTS-DESIGN.md) — Featured/Latest is now sorted by
  the Drive Tracker sheet's own `date` column, not manually curated.
  One real project is now live (BINHI NG KINABUKASAN, real photo
  resized/optimized). 5 more real Tracker rows exist (real names +
  descriptions) but are NOT yet built — each is missing `category`
  and/or `date` in the sheet (not just a missing photo), and those
  fields were deliberately not guessed since category is a permanent
  public label and date drives the Featured sort — see design doc §6
  for exactly what's missing per row. Homepage's separate "What We Do"
  carousel (`assets/recent-projects/`) is untouched by this rework.

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
