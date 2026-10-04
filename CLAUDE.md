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
rurok/index.html         -> /rurok/   ("Rurok" bulletin — was
                             bulletin/index.html at /bulletin/ until
                             2026-08-01, when the URL was renamed to
                             match the display name (no redirect from
                             the old /bulletin/ path, matching this
                             site's /foundation/->/diskwentulong/
                             precedent); linked in nav as "Rurok" on
                             all 6 nav-bearing pages; see
                             docs/RUROK-DESIGN.md)
contact/index.html       -> /contact/    (also holds "Get Involved")
assets/rotary-logo.png -> real logo file (was a Drive hotlink, now local)
backend/Code.gs         -> mirror of the live DTC Apps Script backend
                             source (added 2026-10-03 — first time this
                             repo has tracked it; previously only lived
                             in the Apps Script editor's own revision
                             history). Edit via `clasp` against the real
                             project, not by hand here — see
                             docs/BACKEND-CAPABILITY-TEST.md's clasp
                             section. Keep in sync after any live push.
CNAME                  -> custom domain config, do not remove
docs/DTC-DESIGN.md     -> full DiskwenTulong Card design detail
docs/CONTENT-MANAGEMENT.md -> Google Drive content sync procedure
docs/PROJECTS-PAGE.md  -> Service Projects page workflow, HISTORICAL —
                           superseded 2026-07-20 by the data-driven
                           rework below. Its §4 Share-button platform-
                           constraint analysis still applies, but the
                           actual mechanism it describes was removed
                           (PR #100) then rebuilt differently on
                           2026-10-03 — see docs/SERVICE-PROJECTS-DESIGN.md
                           §8 for the current one
docs/SERVICE-PROJECTS-DESIGN.md -> data-driven Service Projects rework
                           (Areas of Focus / Avenues of Service), BUILT
                           and live, 12 real projects built as of
                           2026-08-14 — see its §6 for the 2 rows still
                           excluded and why
docs/QA-STATUS.md      -> what's actually confirmed live vs. only
                           sandbox-tested, and the open DTC/QA risk list
docs/RUROK-DESIGN.md   -> Rurok (Digital Bulletin) page design: naming,
                           featured/past-issues structure, the Heyzine-
                           polling automation (Code.gs v10), current
                           data state
docs/SEO.md            -> SEO checklist to run on any copy-changing
                           commit, per-page audit state, audit history
docs/BACKEND-CAPABILITY-TEST.md -> what Claude has actually tested (not
                           assumed) it can/can't do against Drive/Sheets
docs/MERCHANTS-SYNC-DESIGN.md -> design + build record for a scheduled
                           job that detects new Partner Merchants
                           categories/entries and opens a PR with the
                           diff, mirroring the review-preserving pattern
                           already used for Rurok's automation. Built,
                           confirmed fully working end-to-end including
                           its first real PR, merged (#140 + a logo-fix
                           follow-up, #141); see its Status section
.github/workflows/merchants-sync.yml -> scheduled (+ manually
                           dispatchable) GitHub Action, this repo's
                           first piece of CI, confirmed opening/updating
                           real PRs successfully — see
                           docs/MERCHANTS-SYNC-DESIGN.md §2b
.github/scripts/merchants-sync.js -> the diff engine that workflow
                           runs — unit-tested locally and confirmed
                           working against real live data, including its
                           gh pr create/edit path (PR #140, 2026-10-03);
                           see docs/MERCHANTS-SYNC-DESIGN.md §2b-1. Its
                           logo checklist also flags existing merchants'
                           missing/mismatched logos with Drive deep
                           links (Phase 1, 2026-10-03) — see §2b-2
docs/Rotarians.md      -> /rotarians/ roster rules, incl. the Council of
                           Presidents section (added 2026-07-21) and how
                           to update it each Rotary Year
docs/OPTIMIZATION-AUDIT-2026-10.md -> whole-repo optimization audit
                           (2026-10-04) covering SEO, content strategy,
                           workflow automation, merchant automation, QA,
                           architecture, performance, accessibility,
                           analytics, security, documentation, and
                           Rotarians data — a dated snapshot, not a living
                           design doc; see its own header before treating
                           any finding in it as still open
.claude/settings.json  -> committed, project-scoped Claude Code
                           permission rules (added 2026-10-03) — currently
                           just allow-listing the PR subscribe/unsubscribe
                           MCP tools so they don't prompt; distinct from
                           the untracked settings.local.json above
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
- Phase 1 (public site) in progress — some sections still have PLACEHOLDER
  data (see "Known placeholders" below for what's actually still open —
  the bulletin/Rurok content itself was resolved 2026-08-01). The
  "Address Here"/`XXX` phone placeholder
  that used to appear on every page's footer is RESOLVED as of 2026-07-21
  — all page footers now show the real venue (Dy Viajero, CBD Terminal,
  Naga City) and have no phone number (none on file, so it was removed
  rather than left fake).
- A scrolling DTC support banner sits above the header on index,
  rotarians, projects, rurok, and contact (deliberately not on
  diskwentulong, verify, or register — see docs/DTC-DESIGN.md). Links to
  /diskwentulong/, repeats 4x so the motion stays visible on wide desktop
  screens, includes a "Learn More" pill that scrolls with the ticker
  (not a separate static button).
- Every page's social-share preview image (`og:image`/`twitter:image`)
  is now a real photo of the club (`assets/social/og-share.jpg`,
  self-hosted), replacing a generic Pexels stock placeholder that was
  live on every page until 2026-07-21. Three pages use their own
  dedicated image instead of the shared one: `/diskwentulong/`
  (`assets/diskwentulong/dtc-card-og.jpg`), `/rurok/`
  (`assets/rurok/rurok-og.jpg`, a crop of the current issue's own
  cover — see docs/RUROK-DESIGN.md for why this needs manual updating
  each time the featured issue changes), and, **added 2026-09-19**,
  the homepage `/` itself (`assets/social/homepage-og.jpg` — the real
  "Rotary Club of Naga Heights" wordmark logo, `assets/header-logo.png`,
  centered on a plain white 1200x630 canvas, per the user's request
  that linking the homepage show the logo rather than a club photo).
- `/verify/` was rebuilt (PRs #68-71) as a single card-styled form/result
  component matching the physical DTC card's navy/gold branding, fixing
  several rounds of real device bugs along the way (font-metric field
  clipping, native `<option>` popup styling, `inputmode` not actually
  restricting input, a batch-field regression that broke typing `TEST`).
  Built blind (no working `cdn.tailwindcss.com` access that session) and
  validated only by the human's live-device testing — confirmed
  2026-07-24, with real network access, still renders and functions
  correctly end-to-end: card proportions, logo sizing, field widths, the
  mandatory T&C gate, and a live Apps Script verify call all check out.
  See docs/QA-STATUS.md for exactly how that check was done (not the same
  as a live device test) and one new finding it turned up.
- `/register/` gained a "Confirm Registration" review step (2026-07-29)
  — shows the typed name/card number and requires an explicit "Yes,
  Register" click before the request fires, so a typo can be caught
  before it's written to the Sheet (there's still no edit-registration
  feature, so a typo after the fact means a manual Sheets edit).
- `/verify/` now also requires the cardholder's name, matched
  server-side against the name on file, before returning any real
  status/details (closes a card-number-enumeration gap — see
  docs/DTC-DESIGN.md's Open items). `Code.gs v9` (written 2026-07-30)
  has been deployed and confirmed live 2026-08-04 via direct black-box
  testing of the real endpoint — the name-match gate is actually
  enforced now, not just in the frontend. See docs/DTC-DESIGN.md's
  Open items for exactly how this was confirmed.
- Rotarians page now has the full real roster (30 people, from a Drive
  membership sheet) instead of 4 hardcoded name slots — still plain
  hardcoded HTML, not data-driven; re-editing this file by hand is
  expected for future roster changes until/unless it's rebuilt data-driven.
  A "Council of Presidents" section (added 2026-07-21) lists everyone
  with a Charter/Immediate Past/Past President designation — Ghiel
  Rosales (Charter President) always pinned first, then newest-first by
  Rotary Year. Each of those 5 people's card now lives ONLY in this
  section (removed from Officers/Members to avoid duplication) and shows
  their current officer title if they have one. **Updated 2026-08-15**:
  found and added Maria Francesca Gumabao, a plain Member present in
  the Drive sheet since the original build but missed at the time — no
  other discrepancies, every officer title/COP designation/theme
  cross-checked clean against the sheet. **Also updated 2026-08-15**:
  every card in all three grids (COP, Officers, Members) now shows a
  circular portrait photo, sourced from a new Drive "Portraits" folder
  and downloaded the same direct-`curl` way as the DTC logos/Governor's
  Visit photo. See docs/Rotarians.md.
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
  is retired (docs/PROJECTS-PAGE.md, marked historical — its §4
  platform-constraint reasoning still holds, but the Share mechanism
  itself was rebuilt 2026-10-03, see docs/SERVICE-PROJECTS-DESIGN.md §8).
  See "Known placeholders" below for exactly what's built vs. still missing.
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
- `/diskwentulong/`'s Terms & Conditions modal is now a MANDATORY gate
  (2026-07-21) — the X button, click-outside, and Escape-to-close were
  all removed; only clicking "I Understand" dismisses it, matching
  `/verify/`. Also added a sample card graphic (real card number format
  `DTC-2026-00001`, transparent PNG background, not a photo) beside the
  "What is DTC" description. **Updated 2026-08-03**: swapped in the
  club's official card artwork — fixes a stray "A PROJECT OF" line and
  a hand-drawn gear icon (now the real Rotary logo). A "Valid Until
  12/31/2027" line was added and then removed again same day, per the
  original 2026-07-21 no-date reasoning. See docs/DTC-DESIGN.md §6's
  sample-card note for the full history.
- Partner Merchants category taxonomy changed 2026-08-04 to match the
  granular classifications the Drive source sheet actually uses (Cafe
  Partners, Legal Partners, etc. — 11 categories, replacing the earlier
  7-bucket simplification that was never actually locked in). This was
  a live-breaking change until fixed same day: the frontend only draws
  tiles for categories in its own hardcoded list, so when the backend
  Sheet's categories changed out from under it, `/diskwentulong/`
  briefly showed zero partners live. **Updated again 2026-08-14**: the
  user pasted 44 rows into the live Merchants Sheet directly, renaming
  2 categories (now `Cafes and Restaurant Partners`/`Hotel Partners`)
  and adding a new `Mental Health Partners` category plus 3 more real
  partners (one, MiPanda Naga, with a real logo added). `Code.gs`/the
  live Sheet is genuinely ahead of this repo now — `diskwentulong/
  index.html` and `partners.json` were updated to follow it, the
  reverse of the usual direction. A data-integrity bug was found in the
  live Sheet's `logo_file_id` column (~30 of 44 rows point at the
  wrong merchant's logo filename) — not fixed (no Sheets write access),
  flagged for the user. **Updated 2026-08-16**: the live `getPartners`
  endpoint switched to a completely different 17-category taxonomy
  (`Restaurants`, `Coffee Shops`, `Grooming Services`, etc. — no more
  `X Partners` suffix), breaking `/diskwentulong/` live again the same
  way as 2026-08-04 (user reported "partner merchants missing").
  `CATEGORY_ICONS`/`CATEGORY_ORDER`/`partners.json` updated to match;
  2 brand-new partners found in the same diff (Redflame Enterprises,
  Noeia Psychological Services), both with real logos added. 44/44
  prior partners still accounted for, none removed. **Updated
  2026-08-17**: since this same category-taxonomy break has now
  happened twice, `renderCategoryGrid()` no longer treats
  `CATEGORY_ORDER` as a strict filter — an unrecognized category now
  still renders (generic icon, appended last) instead of silently
  hiding its partners. Also added `assets/merchants/live-snapshot.json`,
  a raw mirror of the live `getPartners` response kept only as a manual
  diff baseline for future syncs (not read by the live site, not
  auto-updated) — **removed 2026-10-03**, superseded by the automated
  Partner Merchants Sync job (see its entry further below and
  docs/MERCHANTS-SYNC-DESIGN.md). **Updated again 2026-08-17**: categories changed a
  third time (16 categories now, down from 17) — `Home & Car Care`/
  `Home Essentials` merged into one `Home & Car Essentials`, 2 more
  renamed. This time the resilience fix caught it live exactly as
  designed: affected tiles kept showing their partners, just with a
  generic icon, which is what the user spotted and reported. 1 more
  new partner found (LabCom Laboratory Supplies), real logo added.
  46/46 prior partners still accounted for. **Updated 2026-08-20**: 2
  more new partners synced (Mercury Drug, Flavours by RooRoo Café),
  both real logos added — no category taxonomy change this time, both
  landed in already-known categories. 47/47 prior partners still
  accounted for. See docs/DTC-DESIGN.md §5.
- `/verify/` now shows a merchant-specific promo image under the
  verification result (2026-08-20) — Mercury Drug's RiteMed flyer, shown
  only when the merchant dropdown is set to "Mercury Drug" AND the
  result's card status is ACTIVE. Hardcoded per-merchant for now (one
  partner); see docs/DTC-DESIGN.md §4 for the pattern if more partners
  want this.
- **New 2026-10-03**: this session confirmed `clasp` (the Apps Script
  CLI) can directly clone/edit/push/deploy the real, live DTC Apps
  Script backend — a real capability upgrade from only being able to
  hand the user plain-text `Code.gs` to paste in by hand. Used it to add
  the live Service Projects sync above. See docs/BACKEND-CAPABILITY-TEST.md
  for the full writeup, including: the OAuth credential does NOT persist
  across sessions (this container is ephemeral — a future session needs
  a fresh `clasp login`); a real ~15-minute incident where a scope change
  blocked the entire live deployment (including the already-working
  partners/verify/register actions) until the user manually clicked
  through Google's re-authorization prompt; and why this environment's
  own curl/Playwright tests can't reliably confirm whether a live Apps
  Script change actually works — only the user's own browser can.
  `backend/Code.gs` in this repo is now a tracked mirror of that live
  source, kept in sync after any future `clasp push`.
- **Updated 2026-10-03**: `Code.gs` v13 — `getPartners_()` now returns
  `merchant_id` on every entry (purely additive, no other field changed,
  no new Google API scope), via `clasp push` + a new version (17) +
  redeploying the existing live Web App deployment to it. This was
  docs/MERCHANTS-SYNC-DESIGN.md's §2a-2 prerequisite for the Partner
  Merchants sync job.
- **Updated again 2026-10-03**: the Partner Merchants sync job itself
  (§2b) is built and now **fully confirmed working end-to-end, including
  its first real PR, merged** — this repo's first GitHub Action
  (`.github/workflows/merchants-sync.yml`, scheduled daily +
  manually dispatchable) runs `.github/scripts/merchants-sync.js` to
  diff the live partner feed against the committed
  `assets/merchants/partners.json`/`categories.json` and open or update
  a PR with the result — never commits to `main` directly. Its first
  real runs each hit a genuine finding and handled every one correctly:
  a duplicate `merchant_id`, a transient HTML-not-JSON response, then
  (after a diagnostics improvement) two real duplicate-`merchant_id`
  collisions in the live Sheet, all safely aborted with no changes until
  the user fixed the Sheet. The first real PR (#140) then successfully
  bootstrap-matched all 49 legacy partners, added one new merchant
  (Green Stock), and updated 9 changed fields — merged after review.
  One follow-up (#141) fixed Green Stock's logo, which Codex caught as
  corrupted on first download (traced to a reproducible truncation bug
  in the Google Drive MCP tool's `download_file_content` — worked around
  via a direct `curl`, same pattern as the Governor's Visit photo; see
  docs/BACKEND-CAPABILITY-TEST.md). Post-merge verification (this
  session, not just the sync job): re-ran the workflow once more and got
  "no diff detected," confirming full parity between the live feed and
  the committed file and that none of the 49 bootstrap matches needs a
  second look; checked the live site itself
  (`https://rcnagaheights.org/diskwentulong/`) directly — all 50
  partners render, Green Stock's logo loads correctly, and the live
  `?action=partners` call (not just the static fallback) returns real
  JSON with `merchant_id` present on every entry, closing out the one
  remaining unconfirmed claim from `Code.gs` v13 above. See
  docs/MERCHANTS-SYNC-DESIGN.md's Status section for the full account.
- **Updated again 2026-10-03**: investigated the `logo_file_id`
  data-integrity problem (it's a human-typed filename, never a real
  Drive file ID, and has a documented history — see
  docs/DTC-DESIGN.md — of pointing at the wrong merchant after a Sheet
  edit) and shipped the lightweight, pre-approved Phase 1 fix: the sync
  job's logo checklist now also flags existing merchants with a missing
  or "potentially mismatched" logo (not just new merchants), and every
  checklist entry links the reviewer straight to a Drive search for the
  raw filename plus the confirmed approved-logos folder, instead of a
  bare filename string. No new credentials, no new Apps Script endpoint,
  still no automatic logo download/commit. A Phase 2 proposal (an
  Apps-Script-side lookup scoped to one `merchant_id` at a time, with
  required image-integrity validation before any future automated
  download could become a commit candidate) was written up but
  explicitly NOT implemented — see docs/MERCHANTS-SYNC-DESIGN.md §3b.
- **Started 2026-10-04**: Phase A of docs/OPTIMIZATION-AUDIT-2026-10.md's
  roadmap (quick wins / low risk). Done so far, frontend/docs only: all
  31 Rotarians portraits now have `loading="lazy"`; all 8 pages preconnect
  to `cdn.tailwindcss.com`/`fonts.googleapis.com`/`fonts.gstatic.com`; the
  homepage hero carousel now respects `prefers-reduced-motion` (matching
  the DTC banner's existing handling); the mobile menu button on all 6
  nav-bearing pages now reports `aria-expanded`; `docs/agent-teams.md`
  (generic Claude Code reference, no project content) removed from the
  repo per the audit's own recommendation; `docs/QA-STATUS.md` and
  `docs/CONTENT-MANAGEMENT.md` got explicit staleness banners pointing to
  their current replacements instead of silently going stale further.
  **Not yet done from Phase A**: the Sheets-formula-injection fix in
  `backend/Code.gs` (blocked on a fresh `clasp login` — the session's
  saved credential expired mid-session, `invalid_rapt`) and Google Search
  Console verification (needs the user's own action/token, not something
  this session can do unilaterally).

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
- **RESOLVED 2026-08-01**: the old `/bulletin/` placeholder (stock-photo
  cover, dead `href="#"` download link, empty flipbook box) is gone.
  The page — renamed "Rurok" and now living at **`/rurok/`** (URL
  renamed same day; old `/bulletin/` path 404s, no redirect, matching
  this site's `/foundation/`->`/diskwentulong/` precedent) — now embeds
  the real first issue (Rurok, Volume 1: June Issue, Rotary Year
  2026-27) via a Heyzine flipbook iframe, plus a "Past Issues" section
  below it. `noindex` removed, `/rurok/` is in `sitemap.xml`, and it's
  linked in the nav (desktop, mobile menu, footer Site Map) on all 6
  nav-bearing pages, between "DiskwenTulong Card" and "Contact Us"
  (`/verify/`/`/register/` have no nav chrome by design, untouched).
  Visible on-page headings ("Rurok" title, "Latest Issue" label, "Past
  Issues" heading) were later stripped as redundant clutter — the
  `<h1>` stays in the DOM but visually hidden (`sr-only`) for SEO.
  **Updated 2026-08-18**: a second issue (Volume 2: July Issue) is now
  live, and the original "one flipbook per Rotary Year" plan is
  superseded — the club is uploading a new Heyzine flipbook per issue
  instead, roughly monthly, retiring the previous one into a real Past
  Issues card (Volume 1's, now live, linking to its own Heyzine page —
  no plain PDF exists for it yet, and Heyzine's free-tier 5-flipbook
  cap isn't close to being a real constraint). **Updated 2026-08-24**:
  the automation discussed and deferred on 2026-08-18 is now built —
  `Code.gs v10` polls Heyzine's own List Flipbooks API on a daily
  trigger and keeps a new `RurokIssues` Sheet tab in sync; `/rurok/`
  now fetches `?action=rurokIssues` (falling back to
  `assets/rurok/issues.json`, same live-then-static pattern as
  `/diskwentulong/`) instead of a hardcoded Featured iframe + Past
  Issues card. A new upload needs zero HTML edit now — though a blank
  Heyzine title/subtitle (confirmed live on the current Volume 2 issue)
  still needs one manual label fix per issue; see docs/RUROK-DESIGN.md's
  "Automation" section for exactly what's automated vs. still manual.
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
  docs/SERVICE-PROJECTS-DESIGN.md) — Featured/Latest is sorted by each
  row's own `date`, not manually curated. **Updated 2026-08-14**: the
  Drive Tracker Sheet was replaced by "Service Projects.xlsx" (now
  including `Start Date:`/`End Date:` columns), and 12 more real
  projects were built alongside the original BINHI NG KINABUKASAN — 13
  total live then, including BRIGADA ESKWELA once its photo appeared in
  Drive later the same day (its sheet-specified filename was `BEMD.png`;
  the actual upload was `BEMD.jpg` — used anyway, only one candidate
  file existed). **Updated 2026-08-15**: GOVERNOR'S VISIT — the last
  unbuilt row, previously stuck on 6 failed downloads of its 7.4MB
  photo — is now live too: the file had shrunk to 1.4MB in Drive since
  the last attempt, and a direct `curl` against its Drive share link
  (bypassing the Drive MCP tool, which kept returning the file inline
  instead of to disk) pulled it down cleanly. All 14 of 14 rows are now
  live. See design doc §6. **Updated 2026-10-03**: the page now fetches
  this data LIVE from a new `?action=projects` Apps Script endpoint
  (`getServiceProjects_`, reading a converted-to-native "Service
  Projects" Google Sheet), falling back to the committed
  `service-projects.json` only if that call fails — a new project row
  needs zero HTML edit now, the same pattern already used by
  `/diskwentulong/`'s partners and `/rurok/`'s issues. Built and tested
  via `clasp` (see docs/BACKEND-CAPABILITY-TEST.md) — this is the first
  time this repo's own docs/code reflect direct `clasp` access to the
  live Apps Script backend, a capability upgrade from the prior
  "Claude can only write Code.gs as text for the user to paste in" state.
  Photos are still a manual step (download/resize/commit + one entry in
  `projects/index.html`'s `IMAGE_BY_PROJECT` map) — see
  docs/SERVICE-PROJECTS-DESIGN.md §7 for exactly why that part isn't
  automated. Not yet confirmed live on the deployed GitHub Pages site by
  the user as of this update (tested locally against the real live
  backend, screenshot-verified).
  Homepage's separate "What We Do" carousel
  (`assets/recent-projects/`) is untouched by this rework.
  **Updated again 2026-10-03**: every project (not just Featured) now
  has a working Share button — native Web Share API first (opens the
  real OS share sheet, no hardcoded target apps), Facebook + Copy Link
  fallback otherwise — and a unique `?project=<slug>` URL that restores/
  highlights the right project on load. See
  docs/SERVICE-PROJECTS-DESIGN.md §8. True per-project Facebook preview
  CARDS (showing that project's own photo, not the generic club photo)
  are NOT implemented — confirmed not possible without a real
  architecture change; the user explicitly chose to accept the generic
  page-level preview for now (Option C) rather than build a static-page
  generation step or an Apps-Script-hosted OG workaround — see §9 for
  the 3 options weighed and a technical recommendation for later
  automating static per-project share pages via `clasp`, if ever
  revisited.
  **Fixed 2026-10-04** (reported as "slow to load"): the page's live
  `?action=projects` fetch had no parallel static fallback — unlike
  `/diskwentulong/`'s already-fixed pattern, the static
  `service-projects.json` fallback here only started inside the live
  call's `.catch()`, so every page load waited out the full live round
  trip (documented 2-3s Apps Script overhead) before showing anything.
  Now fires the static fallback immediately in parallel, same as
  `/diskwentulong/`; the live call still wins and re-renders on top once
  it resolves. Playwright-confirmed against the real live backend:
  projects now render in ~0.9s instead of waiting ~3s+, with the live
  data settling cleanly on top and no errors. Also fixed two related
  render bugs found by Codex review before merge: a stale "could not
  load" error message that never cleared once live data arrived, and a
  `?project=<slug>` deep link to a project present only in the stale
  static fallback whose lightbox never closed once live data (correctly)
  showed no such project.
  **Also fixed 2026-10-04**: `/rurok/`'s `?action=rurokIssues` fetch had
  the identical issue (flagged but not fixed in the projects-page PR) —
  same parallel-static-fallback fix applied. Playwright-confirmed: the
  featured issue now renders at ~0.8s via the static fallback, and the
  live call correctly overwrites the iframe with the live-current issue
  once it resolves (~3.5s+). No separate stale-error fix was needed here
  — the existing loading overlay already clears via the iframe's own
  `load` event once live data sets a real `src`, confirmed empirically
  by forcing the static fetch to fail.
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
- Consider SEO impact on every commit, not just content-heavy ones — see
  docs/SEO.md for the checklist. This was skipped for a while (see PR
  #72) — a stale sitemap and a Contact-page description promising a
  phone number the page didn't have both went unnoticed until an
  explicit SEO audit caught them.

`index.html` and `rotarians/index.html` (only) still carry harmless
leftover Canva-export markup — `class="canva-text"`/`canva-button`/
`canva-image`, `data-template-id="..."` attributes, and inline `style=`
duplicating the Tailwind classes right next to them. None of this is
wired to any CSS rule; it's dead weight, not a bug, and the
`canva://`/`drive.google.com` grep above won't catch it since it's not a
live link. Don't "clean it up" incidentally while touching an unrelated
line in these two files — treat it as a separate, deliberate task if
ever done.

## Fuller background
Deeper project history and rationale (why GitHub Pages over Canva, full
phase roadmap) lives in Google Drive docs the user maintains outside this
repo — you now have Drive access, so you can read these directly rather
than asking the user to explain them each time. DTC-specific design detail
is additionally mirrored into docs/DTC-DESIGN.md for convenience.
