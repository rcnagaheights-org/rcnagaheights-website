# Service Projects Page — Data-Driven Rework
Version: v5 · Last updated: 2026-10-04

## Status
Design CONFIRMED and BUILT (2026-07-20). **Updated 2026-10-03**: the page
now fetches LIVE from the DTC Apps Script backend's new `?action=projects`
(`getServiceProjects_` in Code.gs), falling back to the committed
`assets/service-projects/service-projects.json` only if that call fails —
the same live-then-static-fallback pattern `/diskwentulong/` and `/rurok/`
already use. See §7 for the full automation design. All 14 real projects
are live either way (see §6).

## 0. Why this rework
The old page (see docs/PROJECTS-PAGE.md for its now-superseded
succession/lightbox/share design) was hand-coded HTML with one manually
curated "latest project" slot and a 4-tile archive grid — flagged in
CLAUDE.md's Known Placeholders as not scaling past ~15-20 projects and
having no real data source. This rework replaces that with a real
content pipeline modeled on Rotary's own classification system, built
the same way `/diskwentulong/`'s `getPartners` pipeline works: a
generated JSON data file in the repo (like
`assets/merchants/partners.json`), with the page rendering from that
data instead of hand-coded HTML per project.

## 1. Drive structure (source of truth)
**Updated 2026-08-14**: the original "Service Projects Tracker" Google
Sheet + "Areas of Focus"/"Avenues of Service" photo subfolders were
replaced by the user with a simpler structure — still the same folder,
different contents:
```
Service Projects/                          (Drive folder)
├── Service Projects.xlsx                   (replaces the Tracker Sheet)
└── Images/                                 (replaces the two photo
                                              subfolders — one flat
                                              folder for every project's
                                              photo, regardless of
                                              category)
```
("Areas of Focus Logos" also exists in this folder — 7 generic official
Rotary Area-of-Focus icon graphics, not project photos, unused by this
page.)

**Service Projects.xlsx columns:** `Service Projects` (project_name),
`Start Date:`, `End Date:`, `Avenue of Service:` (category — see format
note below), `Image_Filename:`, `Description`.

- `date` in the generated JSON uses `Start Date:` uniformly (even for
  multi-day/ongoing entries like DISKWENTULONG CARD, RCNH WEBSITE, and
  RUROK MAGAZINE, whose `End Date:` is the literal string "Present") —
  a deliberate simplification, not a guess, so Featured sorting has one
  consistent field to compare.
- `Avenue of Service:` mixes two formats: a plain avenue name for
  non-cause-specific projects (e.g. `Club Service`, `Youth Service`),
  or `Community Service: <Area of Focus name>` for cause-specific ones
  (e.g. `Community Service: Basic Education and Literacy`). Parsed as:
  a value containing `: ` → `category_group: "areas_of_focus"`,
  `category` = the part after the colon; otherwise →
  `category_group: "avenues_of_service"`, `category` = the value as-is.
- `image_filename` still must match an actual uploaded file in the
  (now singular) `Images/` folder exactly. No fuzzy-matching — a
  non-matching filename is flagged, not guessed.

Rotary's official categories, for reference:
- **Areas of Focus** (global cause areas): e.g. Disease Prevention and
  Treatment, Water/Sanitation/Hygiene, Maternal and Child Health,
  Basic Education and Literacy, Community Economic Development, Peace
  and Conflict Prevention, Environment.
- **Avenues of Service** (Rotary's 5 official avenues): Club Service,
  Vocational Service, Community Service, International Service, Youth
  Service.

A row's parsed `category_group` determines which of the two page
carousels (see §2) it belongs to — the two-subfolder split by category
no longer exists on the Drive side, only in the generated JSON/page.

## 2. Page sections (in order)
1. **Featured/Latest** — one prominent project, data-driven (see §3),
   not manually curated.
2. **Areas of Focus** — carousel of thumbnails for every project in
   that category group, EXCEPT whichever one is currently Featured
   (see §4 for why).
3. **Avenues of Service** — same, for that category group.

Each carousel thumbnail is clickable, opening a lightbox with that
project's full photo (reusing the lightbox pattern already built for
the previous version of this page — see docs/PROJECTS-PAGE.md §3).

## 3. Featured/Latest logic
The Featured project is whichever Tracker row has the newest `date`
value, compared across BOTH category groups combined — a plain sort by
the sheet's own `date` column, not Drive file `createdTime` (deliberate
— the Tracker sheet's `date` field is the authoritative date for this
content type, since a photo's upload time and the event's actual date
can differ).

## 4. Retirement / no-duplication rule
Every non-Featured row "retires" into whichever carousel matches its
`category`'s subfolder — never hidden, just moved out of the Featured
slot. If the Featured project's own category would otherwise place it
in one of the two carousels too, it's excluded from that carousel's
list (it's already shown above, in the Featured slot).

**Flagging this assumption per the build instructions:** this means a
category group can show as few as its total row count minus one (if
the Featured project happens to belong to that group) — i.e. a
category with only 1 project ever, once it becomes Featured, would
render that carousel empty until a 2nd project in that category
exists. An alternative would be to always show the Featured project in
its own carousel too (accept the duplication) — not implemented,
flagged here in case that's preferred instead.

## 5. Generated data file
**Superseded 2026-10-03 — see §7.** Originally: a JSON file generated from
the Tracker sheet + the two Drive subfolders, checked into the repo, with
the page fetching/rendering from it client-side, regenerated by hand
whenever the Tracker sheet changed (the same way partners.json used to be
the only source before DTC's live `getPartners`). Still kept, now as the
fallback file for when the live call in §7 fails.

Shape (per row):
```json
{
  "project_name": "...",
  "category": "...",
  "category_group": "areas_of_focus" | "avenues_of_service",
  "description": "...",
  "date": "YYYY-MM-DD",
  "image": "/assets/service-projects/<group>/<filename>"
}
```

## 6. Current data state as of 2026-08-15 — all 14 real projects live
As of 2026-07-20, the Tracker sheet had 6 real rows, only 1 fully
specified (BINHI, live since then). The Tracker Sheet was then replaced
by "Service Projects.xlsx" (see §1), which added `Start Date:`/`End
Date:` columns to every row and grew the row count to 14, and a new
"Images" Drive folder was populated with a photo for each row. 12 rows
were built first (BINHI already live + 11 new); BRIGADA ESKWELA
followed once its photo appeared in Drive later the same day; GOVERNOR'S
VISIT — the last holdout — was resolved 2026-08-15 (see below). All 14
of 14 rows are now live.

**Live now (14 total):** BINHI NG KINABUKASAN, SUMMER CLUB TURNOVER AND
STRATEGIC PLANNING, TALK ON ETHICAL LEADERSHIP FOR LAW STUDENTS,
UNLOCKING MENTAL WELL-BEING, DISKWENTULONG CARD, CHARTERING OF THE NCF
INTERACT CLUB, LEAD, LIWANAG SA DILIM: Sustainable Alternative
Lighting, GOVERNOR'S VISIT, 27TH UP HARONG ACADEMIC FESTIVAL, RCNH
WEBSITE, RUROK: THE RCNH MAGAZINE, 4 IN 1 DISTRICT LEARNING SEMINAR,
BRIGADA ESKWELA @ MAHABANG DAHILIG SHS. Photos downloaded from Drive's
"Images" folder, resized to ≤1600px wide and re-compressed as JPEG
(matching the BINHI precedent), placed under
`assets/service-projects/areas-of-focus/` or `.../avenues-of-service/`
per each row's parsed `category_group`. Featured project (newest
`Start Date:`, 2026-08-04) is 27TH UP HARONG ACADEMIC FESTIVAL — GOVERNOR'S
VISIT's `2026-08-01` date doesn't overtake it. Verified locally
(Playwright screenshot of a local static server): all render,
Featured/carousel/lightbox logic all correct — not yet confirmed
against the live deployed site by the user.

**BRIGADA ESKWELA note:** its Drive photo appeared as `BEMD.jpg`, not
the `BEMD.png` the sheet's `Image_Filename:` column literally
specifies — an extension mismatch, not a guess across multiple
candidates (it's the only file with that base name, uploaded the same
day the row's other gap — the missing photo itself — was raised). Used
it; the sheet's `Image_Filename:` value should ideally be corrected to
`BEMD.jpg` to match, though nothing depends on that being fixed.

**GOVERNOR'S VISIT — resolved 2026-08-15:** `GV.png` (also mislabeled —
actually a JPEG, same quirk as BEMD) had failed 6 straight
`download_file_content` attempts across two sessions with a
session-expired error, previously logged here as a ~5MB size ceiling
on that download path. Two things had changed by this attempt: the
Drive file itself was now only 1.4MB (down from the originally-reported
7.4MB — apparently re-exported/re-compressed at some point, though not
by anything this repo tracked), and this session discovered that
`download_file_content` isn't the only route to a Drive file — both
files share "Anyone with the link" permission, so a direct
`curl https://drive.google.com/uc?export=download&id=<fileId>` pulled
the exact byte-for-byte file straight to disk, bypassing the MCP tool
entirely. That path was actually used to unblock two other stuck
downloads this same session (partner logos for Bistro Roberto and VCH
Health Resort Club — see docs/DTC-DESIGN.md) before being applied here.
Resized locally to 1600×1067 JPEG and added to
`service-projects.json`/`assets/service-projects/avenues-of-service/`.

**Resolved 2026-08-14:** the earlier placeholder entry's leftover image
in Drive's old "Avenues of Service" subfolder (file id
`1rYEvhLBVzwoP92WX5aw0xpRZE3FlecUf`) has been trashed, now that this
environment has Drive delete access — no longer an outstanding item.

## 7. Live automation (added 2026-10-03)
The manual "regenerate service-projects.json by hand" step from §5 is
retired for metadata — a new project row now appears on `/projects/` with
zero file edits, mirroring how `/diskwentulong/` and `/rurok/` already
work.

**What changed, end to end:**
1. The original "Service Projects.xlsx" was converted (by the user, in
   Drive) into a native Google Sheet titled "Service Projects" (same
   Drive folder, spreadsheet ID `1AQbpoq2r6FFwjaQKeDoYGYhSeu8fw_-5_jfGgsmaq6Q`).
   This was a hard requirement, not a style choice: Apps Script's
   `SpreadsheetApp` can only read native Sheets, never a raw uploaded
   `.xlsx` binary.
2. `Code.gs` gained `getServiceProjects_()` (CONFIG.SERVICE_PROJECTS_SHEET_ID),
   wired to `?action=projects` in `doGet`. It opens that second spreadsheet
   by ID (it's NOT a tab in the DTC backend's own bound "DTC Card
   Database" spreadsheet — a deliberate choice to keep this a separate
   document the Secretariat/whoever maintains Service Projects can own
   without touching the DTC data), parses rows with the exact same
   category_group/category logic as §1, and returns
   `{ projects: [...] }`.
3. `projects/index.html` now fetches `${APPS_SCRIPT_URL}?action=projects`
   first, falling back to the static JSON (§5) only on failure or an
   empty result.
4. **Photos are NOT automated** and this is a deliberate limit, not an
   oversight: the live endpoint's `image_filename` is the Sheet's raw
   Drive filename, which has never reliably matched the final resized/
   renamed/recompressed asset actually committed under
   `assets/service-projects/<group>/` (see every per-row note in §6 —
   extension mismatches, manual renames, etc. were already the norm
   before this automation). `projects/index.html` keeps a hand-maintained
   `IMAGE_BY_PROJECT` map (`project_name` -> committed asset path),
   seeded from the 14 known projects; a brand-new row renders with a
   placeholder (`/assets/rotary-logo.png`) until someone downloads,
   resizes, commits its real photo, and adds one entry to that map — the
   one remaining manual step, down from "hand-edit the whole page."

**How this was built**: via `clasp` (the Apps Script CLI), logged in as
`secretariat@rcnagaheights.org` — see docs/BACKEND-CAPABILITY-TEST.md for
the full capability writeup, including a real ~15-minute production
incident this caused (the new code's broader Sheets-access scope blocked
the entire deployment, including the pre-existing `partners`/`verify`/
`register` actions, until the user manually clicked through Google's
re-authorization prompt) and why this environment's own test tools
(curl, headless Chromium) couldn't be trusted to confirm the fix — only
the user's own browser DevTools Network tab could.

**Verified live 2026-10-03**: `?action=projects` returns all 14 projects
with correct dates/categories (confirmed by direct comparison against
the Sheet); `/projects/` rendering confirmed via a local static-server +
live-backend test (Playwright) — Featured correctly picked 27TH UP HARONG
ACADEMIC FESTIVAL (newest date), 4 Areas of Focus + 9 Avenues of Service
cards (13 = 14 minus Featured), no console errors. Not yet confirmed via
the user's own browser against the actual deployed `/projects/` page (the
HTML change was written and tested but not yet deployed to GitHub Pages
as of this doc's last update).

## 8. Per-project sharing (added 2026-10-03, generalized 2026-10-03)
A Share button was re-added — first to the Featured section only (the
old one, documented in docs/PROJECTS-PAGE.md §4, was removed from this
page entirely in PR #100 — that doc's platform-constraint analysis still
applies and is the reasoning behind this one too), then generalized the
same day so **every** project has a working Share button: one on the
Featured section, and one inside the lightbox that opens for any
carousel card. Both call the same `shareProject(project, anchorBtn)`
function — there's no hardcoded project or per-project handler, so this
needs zero code change for any future project.

### Unique per-project URL
Every project gets a shareable URL of the form
`https://rcnagaheights.org/projects/?project=<slug>`, where `<slug>` is
computed from `project_name` by a single `slugify()` function used both
to build the link and to resolve one back to a project — no stored/
hardcoded slug list, works automatically for any project present in the
live or fallback data.

**Why a query param, not a path** (`/projects/<slug>/`): this site is
plain GitHub Pages with no build step (see this repo's top-level
CLAUDE.md) and no `.nojekyll`/custom `404.html` SPA-routing setup.
A path-based URL would need either a real generated file per project
(a build step, needing to re-run on every live Sheet change — a bigger
architecture change than this warrants) or a client-side-routing hack
via a custom 404 page (extra fragility for no real benefit here). A
query param needs no hosting change at all and works today.

**Restoring a shared link**: on page load, after project data finishes
loading (live or fallback), `restoreSharedProject()` reads `?project=`,
finds the matching project, opens its lightbox, and — if it has a
carousel card (the Featured project doesn't need one, it's already the
page's main focus) — scrolls that card into view and briefly highlights
it with a gold ring. A slug that doesn't match any current project
(e.g. a stale bookmark to a retired project) silently does nothing,
same as before.

### Share behavior, in order
1. **Primary — Web Share API with the actual photo file**: fetches the
   project's own image, wraps it as a `File`, and calls
   `navigator.share({ files, title, text, url })` — `url` is this
   project's own `?project=<slug>` link. This opens the device's real
   native share sheet, offering whatever apps are installed (Facebook,
   Messenger, Viber, WhatsApp, SMS, Copy Link, etc.) — nothing here is
   hardcoded to a specific target app, per the build instructions. If
   file sharing specifically isn't supported but URL sharing is
   (`canShare({ url })`), falls back to a `files`-less `navigator.share`
   call instead of skipping straight to the menu below.
2. **Fallback menu — Facebook + Copy Link**: a small popover (`#share-
   fallback-menu`, styled to match the rest of the site) with two
   options, used only when neither `navigator.share` variant above is
   available, or the call fails for a reason other than the user
   cancelling:
   - **Share to Facebook**: opens `sharer.php?u=<project URL>` — no
     Facebook SDK, just the plain share-link mechanism, per the build
     instructions.
   - **Copy link**: copies the project's own URL via
     `navigator.clipboard.writeText`, with an `execCommand('copy')`
     fallback for older browsers, and a brief "Copied!" confirmation.

**Known limitation, not a bug**: the fallback's shared URL correctly
deep-links a human visitor back to the right project (see "Restoring a
shared link" above), but Facebook's own preview CARD for that link
still shows this page's one static `og:image`/description (the generic
club photo), not the specific project's own photo — Facebook's crawler
never executes this page's JS, so it can only ever see whichever OG
tags are statically in `projects/index.html`'s `<head>`. Fixing that
needs an architecture change — see section 9 below. Not implemented as
part of this change, per the build instructions' explicit instruction
to stop and present options first.

Verified (Playwright): native-share path correctly fetches the real
project photo and calls `navigator.share` with the right title/url/
filename for both the Featured project and an arbitrary carousel card;
forcing the unsupported case correctly opens the fallback menu,
Facebook link carries the correct per-project URL, and Copy Link
correctly copies it; loading `?project=<slug>` directly restores the
right lightbox. Not yet confirmed on a real device/Facebook app by the
user.

## 9. True per-project Facebook/OG previews — assessment, NOT implemented
Investigated per explicit instruction before any implementation: can
sharing a project ever show that project's own image/title/description
in Facebook's preview CARD (not just correctly link to it)?

**Short answer: not with this site's current architecture (plain
GitHub Pages, no build step, no server).** Facebook's (and virtually
every other platform's) link-unfurling crawler fetches the shared URL
and parses the raw HTML `<head>` it gets back — it does not execute
JavaScript. Since `projects/index.html` is one static file with one
fixed set of `og:title`/`og:description`/`og:image` tags, the crawler
sees exactly those tags for every `?project=` value, with no way for
client-side JS to change what it sees. This is the same limitation
already documented in docs/PROJECTS-PAGE.md §4 from the last time this
was investigated (for the pre-rework page's own Share button).

Three real options, none implemented here:

**Option A — Static per-project pages (a build step).** Generate a
real HTML file per project (e.g. `assets/service-projects/share/
<slug>.html` or similar) with that project's own OG tags baked in at
generation time, and point share links at those pages instead of
`/projects/?project=<slug>` (each page would redirect a human visitor
on to the real `/projects/?project=<slug>` for the actual UI, while the
crawler only ever reads the static tags). This is the standard way
static sites solve this ("pre-rendering"), and keeps hosting as plain
GitHub Pages. **Real cost**: introduces an actual build step to a repo
whose whole convention is "no build step, no framework" — and since
project data now lives in a live Google Sheet rather than only this
repo, something would need to re-run this generation step whenever the
Sheet changes (a GitHub Action on a schedule, or triggered by hand) —
new infrastructure, not a one-time cost.

**Option B — Dynamic OG page via the existing Apps Script backend.**
The DTC Apps Script Web App (`backend/Code.gs`) already executes real
server-side code per request, unlike GitHub Pages. It could add a new
action (e.g. `?action=projectShare&project=<slug>`) that reads the live
Sheet and returns a small HTML response with that project's correct OG
tags, plus a redirect (meta-refresh or JS) sending a human visitor on
to `https://rcnagaheights.org/projects/?project=<slug>`. No new
infrastructure needed (the backend is already live and already proven
editable via `clasp` — see docs/BACKEND-CAPABILITY-TEST.md) and no
build step. **Real cost**: the URL a visitor would need to actually
share (the one Facebook's crawler fetches) would be a
`script.google.com` address, not `rcnagaheights.org` — a real
brand/trust tradeoff for a link people see in their Facebook/Messenger
feed, even though clicking it correctly lands on the real site.

**Option C — Leave it as-is.** Keep what's built in section 8: correct
deep-linking for humans, generic preview card for crawlers. Zero new
infrastructure, zero new risk, matches how the rest of this site's
sharing already works (every other page's social preview is one static
image too). The tradeoff is purely cosmetic (a shared project's
Facebook card shows the club's general photo, not that project's own).

### Decision — 2026-10-03: Option C, for now
The user chose Option C: ship the per-project share/URL system in
section 8 as-is, accept the generic page-level OG preview, and
explicitly do NOT build Option B (the Apps Script OG workaround) — its
non-`rcnagaheights.org` share URL was judged not worth the brand/trust
tradeoff. docs/PROJECTS-PAGE.md §4 (the original platform-constraint
writeup this all traces back to) has been cross-referenced to this
decision.

**Superseded 2026-10-04 — see §10.** Option A (static per-project pages)
was built as part of `docs/OPTIMIZATION-AUDIT-2026-10.md`'s Phase B,
following the sketch below but as full real pages rather than thin
redirect stubs.

### Future enhancement — automating Option A via `clasp`
Not built now, but worth real consideration later, flagged per the
user's request: Option A's usual objection ("a build step, and
something has to re-run it whenever the Sheet changes") is weaker than
it used to be, now that `clasp` gives direct, scriptable read access to
the live "Service Projects" Sheet (confirmed working — see
docs/BACKEND-CAPABILITY-TEST.md). A concrete shape this could take:

1. A small script (Node, run in CI) calls the already-live
   `?action=projects` endpoint — no `clasp`/OAuth needed for this part,
   it's just a public GET, same as the browser does today.
2. For each project, render a minimal static HTML file (e.g.
   `projects/share/<slug>/index.html`) containing just that project's
   real `og:title`/`og:description`/`og:image` tags plus a
   meta-refresh/JS redirect on to `/projects/?project=<slug>` for human
   visitors — Facebook's crawler only ever needs to read the static
   tags, never follows the redirect.
3. Run this on a schedule (e.g. a daily GitHub Action) that diffs the
   generated output against what's committed and **opens a PR with the
   diff** rather than pushing straight to `main` — deliberately
   preserving human review for anything that changes this repo, the
   same reasoning already applied to Rurok's PDF-archival automation
   (see `Code.gs`'s own v10/v11 header comment: a scheduled trigger
   should not be able to push unreviewed content to the live site).

This would need: a new `projects/share/` (or similar) directory
convention, a tiny render script and its own GitHub Action workflow
(new CI surface for a repo that currently has none beyond GitHub Pages'
own deploy), and share links updated to point at
`/projects/share/<slug>/` instead of `/projects/?project=<slug>`
directly. None of this is implemented — this is a recommendation for a
future task, not a plan already in motion.

Verified (Playwright, stubbing `navigator.share`/`canShare` both ways):
see section 8's own verification note — covers both the Featured
section and an arbitrary carousel card via the lightbox, plus the
`?project=<slug>` restore path. Not yet confirmed on a real device/
Facebook app by the user.

## 10. Per-project static pages — BUILT (2026-10-04)
Implements Option A from §9, per `docs/OPTIMIZATION-AUDIT-2026-10.md`
§5/§14 (Phase B, scoped to B1 only — B2/B3 deferred, see CLAUDE.md's
Current Status). Real differences from the §9 sketch, decided while
building:

- **Full real pages, not thin redirect stubs.** §9's sketch described a
  tiny OG-tags-plus-redirect file. What's built instead is a complete,
  standalone page per project (own header/nav/footer, hero image, full
  description text, Share button) — so the page is useful to a human
  landing on it directly (e.g. from a search result), not just to a
  crawler passing through. This also means 13 of 14 projects' full
  descriptions are real crawlable HTML for the first time, not only
  something `og:description` summarizes.
- **Reads the committed `service-projects.json`, not the live
  `?action=projects` endpoint**, unlike §9's sketch (step 1). The live
  endpoint's `image_filename` is a raw Drive filename that
  `getServiceProjects_`'s own doc comment says does NOT reliably match
  the actual committed/resized photo — that mapping has always been a
  manual, human step (see `docs/SERVICE-PROJECTS-DESIGN.md` §7). The
  committed JSON already has the correct, human-verified `image` path
  for every project, so generating from it avoids any risk of a
  generated page showing the wrong photo. A future live-endpoint-based
  version would need a stable per-project id (like `merchant_id` for
  Partner Merchants) before it could safely merge live field updates
  with the committed `image` mapping — not built.
- **Run manually, not yet a scheduled GitHub Action.** §9's sketch's
  step 3 (daily Action + diff PR) is explicitly Phase C work
  (`docs/OPTIMIZATION-AUDIT-2026-10.md` §14), not built in this pass —
  `.github/scripts/generate-project-pages.js` exists and is written to
  follow that same pattern when Phase C wires a workflow around it, but
  for now it's `node .github/scripts/generate-project-pages.js`, run by
  hand whenever `service-projects.json` changes.

**What it does**: for each of the 14 committed projects, generates
`projects/<slug>/index.html` (slug via the same `slugify()` as
`projects/index.html`, kept byte-for-byte identical in both places) with
its own `<title>`/canonical/OG image (that project's real photo)/JSON-LD
(the same `NGO` schema every other page carries, not an `Event` schema —
see §9's own `Event`-schema data-gap reasoning in
`docs/OPTIMIZATION-AUDIT-2026-10.md` §5, which still applies and is
unaffected by this). Also regenerates `sitemap.xml`'s auto-generated
block (between `<!-- BEGIN/END auto-generated project pages -->`
markers) and removes any previously-generated page whose project was
later removed from the JSON, tracked via
`assets/service-projects/generated-pages-manifest.json` so the script
never deletes a folder it didn't itself create.

**The one real (not purely additive) change this needed**:
`projects/index.html`'s `projectUrl()` now points at
`/projects/<slug>/` instead of the old `/projects/?project=<slug>`
query-string form. Without this, every Share button (Featured section,
lightbox, fallback Facebook/Copy-Link menu) would still link to a URL
with no OG tags of its own, and sharing any project would keep showing
this index page's generic photo/description regardless of which project
was actually shared — the exact gap this whole section exists to close.
The `?project=<slug>` restore-on-load logic on `projects/index.html`
itself is untouched and still works, so an old/bookmarked link in that
form still resolves correctly.

**Not yet done**: confirmed on the live deployed site by the user (built
and verified locally — `node --check`-equivalent syntax validation on
every generated page's inline script, JSON-LD parse-validated, all 14
image paths confirmed to exist); Phase C's scheduled-Action wrapper;
`Event` JSON-LD (§9/B3, still blocked on real location/date-range data).
