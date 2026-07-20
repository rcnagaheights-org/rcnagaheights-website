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
                             card — NO auth of any kind as of 2026-07-19,
                             an accepted tradeoff, see docs/DTC-DESIGN.md
                             §3 before assuming this is a bug)
bulletin/index.html      -> /bulletin/   (exists, not linked in nav yet)
contact/index.html       -> /contact/    (also holds "Get Involved")
assets/rotary-logo.png -> real logo file (was a Drive hotlink, now local)
CNAME                  -> custom domain config, do not remove
docs/DTC-DESIGN.md     -> full DiskwenTulong Card design detail
docs/CONTENT-MANAGEMENT.md -> Google Drive content sync procedure
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
  was superseded). A Drive requirement doc (2026-07-19) asks for separate
  mobile-crop exports of each hero photo via a `<picture>` element — not
  built yet, no mobile crop images exist in Drive yet either.
- Projects page has one real project (BINHI ng Kinabukasan) in the
  "Most Recent Service Project" slot; the archive grid below is still
  placeholder — 5 more real projects exist in the Drive summary sheet
  but have no matching photos yet.
- DTC backend is now live: ONE Apps Script Web App deployment
  ("Access: Anyone", 2026-07-19), shared by `/diskwentulong/` (live
  getPartners, falls back to the static partners.json if empty/
  unreachable), `/verify/`, and `/register/`. Registration member
  authentication has been tried 3 times: Session.getActiveUser() (broken
  for cross-origin fetch), a Google Sign-In + ID-token flow (dropped as
  too much Cloud Console setup at the time, leaving a no-auth window),
  then re-added a 3rd time (2026-07-19): Google Sign-In restricted to
  @rcnagaheights.org via the OAuth consent screen's "Internal" setting +
  ID-token verification. Live-tested that attempt (Code.gs v5) — sign-in
  worked but registration still failed on a `email_verified` boolean-vs-
  string type mismatch inside `verifyIdToken_`; fixed in Code.gs v6
  (current state, not yet re-tested — user still needs to paste v6 in
  and redeploy). See docs/DTC-DESIGN.md §3 for the full history before
  assuming the current state is a bug or changing it again. Register +
  verify were
  confirmed working end-to-end 2026-07-19 in the prior no-auth state
  (real test: registered DTC-TEST-00001, then verified it showed ACTIVE
  with correct dates) — still worth a fuller pass (multiple cards,
  invalid numbers, already-registered cards) before any real physical
  card printing run. The "Digital Bulletin" nav link is still
  deliberately absent — that backend doesn't exist.

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
