# Rurok — Design Detail
Version: v5.2 · Last updated: 2026-08-25
Mirrors Google Drive's "PROPOSAL - Digital Bulletin Publishing
Workflow.txt" (Digital Bulletin folder) — read that first for the full
publishing-cadence rationale; this file covers how it's actually built
on the site.

## Status
**BUILT and LIVE.** `rurok/index.html`, serving `/rurok/`, is now
data-driven — see "Automation" below — instead of the hardcoded
Featured iframe + single Past Issues card it was built with originally.

## Naming
The page's public-facing name is **"Rurok"** — `<title>`, `<h1>`, meta
description/OG/Twitter tags, the flipbook `<iframe>`'s `title`
attribute, and the nav link all say "Rurok," not "Digital Bulletin."

**URL history:** originally kept at `bulletin/index.html` / `/bulletin/`
as a display-name-only change (2026-08-01, earlier the same day) — the
file path and URL were deliberately NOT renamed at first, per an
explicit instruction. That decision was reversed later the same day:
the file/URL were renamed to `rurok/index.html` / `/rurok/` to match
the display name everywhere, including the address bar. **No redirect**
exists from the old `/bulletin/` path — it 404s — matching this site's
established `/foundation/`->`/diskwentulong/` precedent (CLAUDE.md:
"no redirect... deliberately a 404"), on the reasoning that there's no
meaningful existing traffic to the old URL to break. If a nav link is
ever changed, update `data-template-id="nav-rurok"` and its `href`
together across all 6 nav-bearing pages (see "Nav" below).

**The `<h1>` is visually hidden (`sr-only`), not deleted**, per an
explicit request to strip the visible on-page headings (the visible
"Rurok" title, the "Latest Issue" label above the flipbook, and the
"Past Issues" heading/description all read as redundant clutter —
Heyzine's own embedded widget already shows the issue title internally,
and the nav already says "Rurok"). Keeping the `<h1>` in the DOM but
invisible preserves the one-H1-per-page convention this site follows
everywhere else, without the visual duplication. If a real content
reason to show a heading again ever comes up, un-hide it rather than
adding a second one.

## Page structure
1. **Featured section (top, most of the page)** — the latest issue,
   embedded as a Heyzine flipbook `<iframe>`. Originally planned as ONE
   cumulative flipbook covering the whole current Rotary Year, per the
   Drive proposal doc — **superseded 2026-08-18, see "Cadence change"
   below.** There is deliberately no "Open Full Flipbook" link out to
   heyzine.com (removed 2026-08-01) — sending readers off
   rcnagaheights.org wasn't wanted, and it wasn't needed anyway: the
   embedded widget's own fullscreen icon (top-right of the widget
   itself) already lets a reader expand it without ever leaving this
   site.
2. **Past Issues section** — a card per issue still live on Heyzine but
   no longer Featured, cover thumbnail + issue label + "View issue"
   (opens the in-page modal). Capped at 4 by construction, since
   Heyzine's free tier holds at most 5 flipbooks total and 1 of those
   is always the Featured issue above — see enforceHeyzineFlipbookCap_
   in "Automation" below. Originally planned to link to a plain PDF
   download (per the proposal doc's yearly-retirement model); as of
   2026-08-18 it links to the issue's own Heyzine flip-book page
   instead — see "Cadence change" below for why.
3. **Archived Issues (PDF) section, added 2026-08-25** — a separate
   section, own small label, for any issue retired past that 5-flipbook
   cap: same card shape, but "Download PDF" linking straight to a
   Drive-hosted copy instead of opening the in-page modal, since the
   Heyzine embed no longer exists for a deleted flipbook. Hidden
   entirely until an issue is ever actually retired this way (won't
   happen until a 6th issue is uploaded) — see "Automation" below.

## Cadence change, 2026-08-18 — no longer one flipbook per Rotary Year
The original proposal's whole rationale was **one cumulative flipbook
per Rotary Year**, replaced only at year-end, specifically to stay
comfortably under Heyzine's free-tier flipbook cap. The club has
instead been uploading a **new flipbook per issue** as each one is
ready (Volume 1: June Issue, Volume 2: July Issue — a month apart, not
a year), confirmed directly by the user. This repo's design now follows
that reality rather than the superseded proposal:

- Whenever a new issue's Heyzine link is provided, swap it into the
  Featured `<iframe>` and retire the previous issue into a Past Issues
  card.
- Past Issues cards link to the retired issue's **own Heyzine flip-book
  page**, not a plain PDF — no PDF file exists for any issue so far
  (checked: the Drive "Digital Bulletin" folder holds only the original
  proposal doc, no PDFs), and there's no pressure to create one while
  Heyzine's free-tier cap (5 flipbooks) isn't actually being approached.
  If/when that cap becomes a real constraint, switch Past Issues to
  plain PDF links at that point (per the user, once past the 5th issue:
  "no need for the embed, just need a download or view pdf") and only
  then delete the superseded flipbook from Heyzine.
- **Updated 2026-08-18, later the same day**: a Past Issues card opens
  its flipbook in an **in-page modal** (`#issue-modal`, reusing the same
  iframe-embed approach as the Featured section) instead of
  `target="_blank"`-ing out to heyzine.com — the user asked for this
  explicitly, and it matches the Featured section's own long-standing
  "never send readers off this site" reasoning, just extended to Past
  Issues too. `z-[70]` clears the fixed DTC banner (`z-[60]`), same
  fix already applied to the projects page's lightbox. Closing (✕
  button, click-outside, or Escape) resets the iframe's `src` to `''`
  so the embed stops running in the background while hidden — it does
  not stay loaded, just invisible.
- **Perceived-slowness fix, 2026-08-18, later still.** The user reported
  the Past Issues modal feeling slow to open. Root cause: the iframe's
  `src` was only ever set at the moment of click, so the entire Heyzine
  load pipeline (DNS, TLS, their JS bundle, PDF rendering — none of it
  controllable from this repo) started with zero head start, and
  nothing indicated it was loading at all — just a blank white modal
  until content appeared. Three fixes, none of which touch Heyzine
  itself: (1) `<link rel="preconnect">` for `heyzine.com` and
  `cdnm.heyzine.com` in `<head>`, warming the connection before it's
  needed by either the Featured embed or the modal; (2) hovering,
  focusing, or touching a Past Issues card now calls `preloadIssue()`,
  which sets the (currently-hidden) modal iframe's `src` ahead of the
  actual click, so loading has a head start by the time the user clicks;
  (3) a spinner (`#issue-modal-loading`, Lucide's `loader-2` + Tailwind
  `animate-spin`, confirmed to actually exist in the pinned Lucide
  0.263.0 bundle before using it) covers the iframe until it fires a
  real `load` event, tracked via `issueLoadedUrl` so the spinner does
  NOT reappear if a hover/focus preload already finished before the
  click — verified in a local render: hover-then-click shows no
  spinner at all (preload already completed), while a fresh click with
  no prior hover (e.g. a keyboard/touch user tapping directly) correctly
  shows it. This doesn't make Heyzine itself faster — that's out of this
  repo's control — it removes the wasted head start and the "is this
  broken" uncertainty around a wait that was already happening.
- A real automation to detect new Heyzine uploads and update this page
  without a manual step was discussed 2026-08-18 and deferred at the
  time — **built 2026-08-24, see "Automation" below.**

## Automation, added 2026-08-24
The manual step this whole page used to need — swap the Featured
`<iframe>`'s `src`, add a Past Issues card, every time the club uploads
a new issue to Heyzine — is now gone. Same overall shape as
`/diskwentulong/`'s live-partner-data pattern:

- **Backend (`Code.gs v10`, Drive-only, not in this repo)** adds a
  `syncRurokIssues()` function that polls Heyzine's own **List
  Flipbooks API** (`GET https://heyzine.com/api1/flipbook-list`,
  confirmed directly against the real endpoint 2026-08-24 — returns
  each flipbook's `id`, `date`, `title`, `subtitle`, and a `links`
  object with `custom`/`base` (the flip-book page URL) and `thumbnail`
  (a ready-made cover image URL — no more manual `og:image`-scraping
  needed for future issues, see "Publishing Workflow" below). It's
  meant to run on a daily time-driven trigger (set up manually in the
  Apps Script editor, since Apps Script triggers can't be created via
  the Drive API — see the file's own header for exact steps): each run
  diffs the API's flipbook list against a new `RurokIssues` Sheet tab
  by `flipbook_id`, appends any row that's new, and recomputes which
  row is `current` (the newest by upload date) vs. `past` (everything
  else). The shared Web App's `doGet` gained a fourth action,
  `?action=rurokIssues`, returning `{ current: {...}, past: [...] }`
  read live from that tab — unrelated to DTC, but shipped in the same
  script/deployment since one already exists. **Naming gotcha, found
  2026-08-25 while walking the user through the manual setup steps**:
  this function is deliberately named `syncRurokIssues` with NO
  trailing underscore, unlike this file's other internal helpers —
  Apps Script's Run/Trigger function-picker dropdowns silently omit any
  top-level function whose name ends in `_`, confirmed by the user's
  own screenshot of the Run dropdown showing only `doGet`/`doPost`/
  `setupWorkbook`/`createBatchTabExample` and no underscored functions
  at all. A first version of this file used `syncRurokIssues_` and it
  was genuinely unselectable in either dropdown — this also means the
  pre-existing `authorizeExternalRequest_()` helper has had this same
  problem since v7, despite its own header comment implying otherwise;
  left alone here since it's unrelated to Rurok and already a one-time
  step marked done for the live project.
- **Frontend (`rurok/index.html`)** fetches `?action=rurokIssues` on
  load (falling back to `assets/rurok/issues.json` — a static mirror in
  this repo, same shape, same live-then-static-fallback pattern
  `/diskwentulong/` and `/verify/` already use) and builds the Featured
  iframe's `src`/`title` from that response via `renderIssues()`, which
  also splits `data.past` into two separate sections — see "Page
  structure" above for what each looks like. Both card types share
  `buildIssueCardShell_()` (built with DOM APIs, not an HTML template
  string, specifically so a label or URL containing a quote can't break
  the markup), with `buildViewableIssueCard()` wiring up the existing
  `openIssueModal`/`preloadIssue` behavior (see "Cadence change" above,
  unchanged) and `buildArchivedIssueCard()` just setting a plain
  download `href`. Each section (`#past-issues-wrap`,
  `#archived-issues-wrap`) hides itself independently if it has nothing
  to show — right now that means Archived Issues stays hidden, since no
  issue has ever actually been retired past the cap yet.
- **A real, found-the-hard-way gap: Heyzine's own title/subtitle fields
  can be blank.** Confirmed empirically 2026-08-24 by calling the real
  List Flipbooks endpoint: Volume 1 has `title: "RUROK"` / `subtitle:
  "Volume 1: June Issue"` filled in, but Volume 2 — already live as the
  Featured issue — has both blank. `syncRurokIssues()` never shows a
  blank label on the live page: if both fields are empty it falls back
  to an auto-generated placeholder (`formatRurokFallbackLabel_()`,
  e.g. "New Issue – August 2026") and flags that row's `needs_review`
  column `TRUE`. Fixing the real label needs one of two manual touches
  — editing the `label` cell directly in the `RurokIssues` Sheet tab
  (takes effect immediately, no redeploy, matches how a `partners.json`
  typo gets fixed), or filling in the title/subtitle on Heyzine's own
  dashboard and letting the next sync pick it up. **As of this
  writing, Volume 2's row needs exactly this fix** — it will read
  "New Issue – August 2026" (or similar) live until someone sets its
  real label by one of those two routes.
- **Heyzine's free-tier 5-flipbook cap is also enforced automatically,
  added 2026-08-25 (`Code.gs v11`).** Every `syncRurokIssues()` run also
  calls `enforceHeyzineFlipbookCap_()`: once the live List Flipbooks
  response has more than 5 entries (i.e. on the 6th upload), it retires
  the single oldest one — never the newest/current issue — by (1)
  downloading its PDF via the `links.pdf` URL already in that run's API
  response, (2) saving it into a Drive folder ("Rurok Past Issue PDFs,"
  under the "Digital Bulletin" folder) and sharing it "anyone with the
  link can view," (3) only once that save is confirmed, writing the
  resulting Drive URL into that row's new `pdf_url` column, and (4)
  only then calling Heyzine's `flipbook-delete` API on it. Any failure
  in steps 1-2 aborts before ever reaching step 4 — an un-archived
  flipbook is left alone on Heyzine rather than risking a delete with
  no backup — and at most one flipbook is retired per run regardless of
  how far over the cap the count is, as a deliberate limit against a
  counting bug deleting real content in bulk. `getRurokIssues_()` now
  returns `pdf_url` per issue; the frontend puts any issue with
  `pdf_url` set into the separate Archived Issues section as a plain
  download link (`<a href="{pdf_url}">`, "Download PDF") instead of a
  modal-opening button, since the Heyzine page it used to link to no
  longer exists. **Deliberately chose Drive over committing PDFs
  into this git repo** — the latter would need a GitHub write-scoped
  token stored in Apps Script, letting a scheduled trigger push content
  to the live site with no human review, unlike every other change to
  this repo. **Not verified end-to-end yet** — with only 2 real issues
  live, the 6th-upload trigger condition hasn't actually fired; this is
  sandbox/logic-reviewed, not live-confirmed. Also unconfirmed: whether
  Heyzine's thumbnail CDN URL keeps resolving after a flipbook is
  deleted — the frontend doesn't assume either way, falling back to the
  site logo via the `<img>`'s `onerror` handler if it doesn't.
- **Still not automated**: the `assets/rurok/rurok-og.jpg` social-share
  crop (see "Social-share image" below — still a manual regenerate-and-
  commit step each time Featured changes) and `sitemap.xml`'s `lastmod`
  bump. Both are cheap, low-risk manual steps deliberately left as-is
  rather than building more automation than the actual need justifies.

## Current data state (as of 2026-08-24)
Two real issues exist, both now tracked in the live `RurokIssues` Sheet
tab once `Code.gs v10` is deployed and its first `syncRurokIssues()`
run completes (see "Automation" above) — the values below also match
this repo's `assets/rurok/issues.json` fallback:
- **Rurok, Volume 2: July Issue (Rotary Year 2026-27)** —
  `https://heyzine.com/flip-book/a40e3e33de.html`, Featured. Live on
  Heyzine with blank title/subtitle (see "Automation" above) — this
  repo's fallback JSON has the real label hardcoded, but the live Sheet
  row needs the same manual fix once synced.
- **Rurok, Volume 1: June Issue (Rotary Year 2026-27)** —
  `https://heyzine.com/flip-book/1f2a839135.html`, a Past Issues card
  linking to that same Heyzine page.

**Cover images sourced without a headless-browser screenshot this
time** — a better method than the one used for Volume 1's og:image
(see "Social-share image" below) was found: Heyzine's own flip-book
page exposes a real `og:image` meta tag pointing at a static,
`curl`-able cover thumbnail (`https://cdnm.heyzine.com/files/uploaded/
<id>.pdf-thumb.jpg`) — no screenshot needed at all, just fetch that URL
directly. Used for both: `assets/rurok/rurok-v1-cover.jpg` (Volume 1's
Past Issues thumbnail, resized to 500px wide) and the new
`assets/rurok/rurok-og.jpg` (Volume 2's cover, cropped the same way as
before — see below).

## Publishing Workflow
The end-to-end process, from a new issue existing as a PDF to it being
fully live and clean on the site. Split into what happens once ever
(setup) vs. what repeats every time the club publishes a new issue.

### One-time setup (already done if `Code.gs v11` is deployed)
Not repeated per issue — see `Code.gs`'s own header comment (or
docs/DTC-DESIGN.md's Open items) for the exact steps: paste the script
in, run `setupWorkbook()`, add the `HEYZINE_API_KEY` Script Property,
run `syncRurokIssues()` once, add its daily time-driven trigger,
redeploy the Web App. Confirmed done by reading the live `RurokIssues`
Sheet tab directly on 2026-08-25 (see the session's own record) — the
8-column schema and both real issues were present and correctly
`current`/`past`.

### Every time a new issue is ready (recurring)
1. **A club officer uploads the PDF to Heyzine** — this step has no
   automation and never will unless a Heyzine connector exists. While
   uploading, filling in Heyzine's own **Title** ("RUROK") and
   **Subtitle** ("Volume N: `<Month>` Issue") fields avoids step 3
   below entirely — this is the one upload-time habit that saves a
   manual fix later.
2. **Wait for the next daily `syncRurokIssues()` trigger run** (or open
   the Apps Script editor and run it manually right away if you don't
   want to wait up to 24 hours). This one function does everything
   else automatically:
   - Adds the new upload as a row in `RurokIssues`.
   - Marks it `current` and demotes whatever was `current` before to
     `past` — the live page's Featured section and Past Issues section
     update themselves from this with zero HTML/code change.
   - If Heyzine now holds more than 5 flipbooks (i.e. this was the 6th
     upload), automatically retires the single oldest one: downloads
     its PDF, archives it to Drive, records the Drive link, and only
     then deletes it from Heyzine — see "Automation" above. This part
     needs no attention unless it fails (check the `Logs` tab for
     `rurok_retire_failed` rows if the Archived Issues section on the
     live page doesn't show something you expected).
3. **Check the new row's `needs_review` column.** If `TRUE` (Heyzine's
   title/subtitle were blank), fix the `label` cell directly in the
   Sheet — takes effect immediately, no redeploy. Skip this if step 1's
   habit was followed and it came back `FALSE`.
4. **Update `assets/rurok/issues.json` in this repo** to match the new
   live state, so the static fallback doesn't go stale if the live
   endpoint is ever down (same reasoning as `/diskwentulong/`'s
   `partners.json`) — commit via the usual flow.
5. **Regenerate `assets/rurok/rurok-og.jpg`** from the new Featured
   issue's cover — the API's `thumbnail` field gives a direct URL now,
   no more scraping needed — see "Social-share image" below. Commit.
6. **Bump `sitemap.xml`'s `lastmod` for `/rurok/`** per docs/SEO.md's
   checklist, since visible copy changes every time. Commit.

Steps 4-6 are the only ones that touch this git repo and need a commit;
steps 1-3 happen entirely in Heyzine/the Sheet/Apps Script and never
touch this repo at all.

## Social-share image (added 2026-08-01, sourcing method changed 2026-08-18)
`og:image`/`twitter:image` use a dedicated image
(`assets/rurok/rurok-og.jpg`, 1200x630, self-hosted) instead of the
site-wide generic `assets/social/og-share.jpg` — always a real crop of
the current Featured issue's own cover (top portion — title, Rotary
wordmark, mountain scene — landscape-framed for the 1200x630 spec
rather than shrinking the full portrait cover with big empty margins).
**This is a static file, not automatically "the latest issue"** — every
time the Featured issue changes, someone (Claude) needs to regenerate
this file from the new issue's cover, or the share preview keeps
showing a stale issue's cover after it's no longer current.

Volume 1's version was captured via a headless-browser screenshot of
the live Heyzine embed, since no separate source file for the cover
art existed anywhere. **A much simpler method was found for Volume 2,
2026-08-18**: any Heyzine flip-book page's HTML `<head>` has a real
`og:image` meta tag pointing at a plain, directly downloadable cover
thumbnail (`https://cdnm.heyzine.com/files/uploaded/<id>.pdf-thumb.jpg`)
— just `curl` that URL, no screenshot needed. Use this method going
forward: fetch `https://heyzine.com/flip-book/<id>.html`, grep its
`og:image` tag, download that thumbnail, then scale-to-1200-wide and
crop-top-630 exactly as before.

## Nav (added 2026-08-01, updated same day for the URL rename)
"Rurok" links to `/rurok/` in the desktop nav, mobile menu, and footer
Site Map on all 6 nav-bearing pages (index, rotarians, projects,
diskwentulong, rurok itself, contact), positioned between "DiskwenTulong
Card" and "Contact Us." `/verify/` and `/register/` have no nav chrome
by design (utility pages) and were left untouched. `sitemap.xml`'s
`lastmod` was bumped across all 6 URLs to match, per docs/SEO.md's
checklist (visible copy — the nav — changed on all of them), and its
`<loc>` for this page updated from `/bulletin/` to `/rurok/` when the
URL was renamed.

## Not done / explicitly out of scope
- No Heyzine account/upload access exists in this environment (no
  connector) — a club officer must still actually upload the PDF to
  Heyzine themselves; nothing in this repo can do that step. Everything
  *after* upload (detecting it, updating the live page) is now
  automated — see "Automation" above. The free tier's 5-flipbook cap is
  still not a real constraint, since only the current issue needs to
  stay live on Heyzine — once a Past Issues card exists, the retired
  flipbook can be deleted from Heyzine without breaking anything (Past
  Issues links to the flip-book page today, but the design already
  anticipates switching that to a plain PDF link instead, once the
  flipbook itself needs to go).
- The social-share crop (`assets/rurok/rurok-og.jpg`) and `sitemap.xml`
  bump are still manual — see "Automation" above for why these two were
  deliberately left alone rather than automated too.
- A blank Heyzine title/subtitle still needs a one-time manual label
  fix per issue (Sheet cell edit or filling in Heyzine's own dashboard)
  — see "Automation" above. Not eliminated by this build; the real
  underlying limitation is that Heyzine's API only ever returns
  whatever metadata the club actually entered on their end.
- **Heyzine's own iframe chrome (toolbar, title/subtitle panel, corner
  "Heyzine Flipbooks" branding) cannot be stripped from this embed —
  checked, not assumed (2026-08-01).** Heyzine's developer docs list
  `st`/`sh`/`fs`/`pn` query parameters for this, but empirically
  appending them to the actual `/flip-book/...` embed URL and rendering
  before/after had zero visual effect — those parameters apply to a
  different Heyzine feature, not this embed type. Per Heyzine's FAQ,
  removing the corner logo specifically requires a paid plan or
  flipbook pack, which conflicts with the proposal doc's explicit
  reason for choosing Heyzine (free tier, no forced watermark). A CSS
  crop trick (an `overflow:hidden` wrapper that visually cuts off part
  of the iframe) is technically possible but was deliberately not
  built — it hard-codes assumptions about Heyzine's internal layout and
  would clip the actual book unpredictably on any Heyzine update or
  differently-sized viewport.
