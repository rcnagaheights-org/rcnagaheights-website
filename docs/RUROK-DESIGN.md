# Rurok — Design Detail
Version: v3.1 · Last updated: 2026-08-18
Mirrors Google Drive's "PROPOSAL - Digital Bulletin Publishing
Workflow.txt" (Digital Bulletin folder) — read that first for the full
publishing-cadence rationale; this file covers how it's actually built
on the site.

## Status
**BUILT and LIVE.** `rurok/index.html`, serving `/rurok/`, now shows the
real first issue instead of placeholder content.

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
2. **Past Issues section (bottom)** — a card per retired issue, cover
   thumbnail + issue label + a link. Originally planned to link to a
   plain PDF download (per the proposal doc's yearly-retirement model);
   as of 2026-08-18 it links to the issue's own Heyzine flip-book page
   instead — see "Cadence change" below for why.

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
- A real automation to detect new Heyzine uploads and update this page
  without a manual step was discussed and **deferred** — see the
  session notes for the design sketch (poll Heyzine's List Flipbooks
  API on a schedule via a new Apps Script trigger, write new issues to
  a Sheet, make this page data-driven like `/diskwentulong/` and
  `/projects/` instead of hardcoded HTML). Heyzine's free tier does
  include real API access, confirmed via their docs.

## Current data state (as of 2026-08-18)
Two real issues exist:
- **Rurok, Volume 2: July Issue (Rotary Year 2026-27)** —
  `https://heyzine.com/flip-book/a40e3e33de.html`, now Featured.
- **Rurok, Volume 1: June Issue (Rotary Year 2026-27)** —
  `https://heyzine.com/flip-book/1f2a839135.html`, now a Past Issues
  card linking to that same Heyzine page.

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

## Adding a past issue later (repeat this each time)
When the next issue's Heyzine link arrives: swap the Featured `<iframe>`
to the new link, add a Past Issues card for whichever issue it replaced
(cover thumbnail via Heyzine's `og:image` trick above + issue label +
link to that issue's own Heyzine page), and update the social-share
image to the new Featured issue's cover — see "Social-share image"
below. Also bump `sitemap.xml`'s `lastmod` for `/rurok/` per
docs/SEO.md's checklist, since visible copy changes each time.

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
  connector) — any future issue's Heyzine embed link must be created
  manually by a club officer and handed over, same as the first two
  were. **Automating this end-to-end was discussed 2026-08-18 and
  deferred, not built**: Heyzine's free tier does include real API
  access (confirmed via their own docs — list/create/delete flipbooks,
  get embed codes), so a scheduled Apps Script trigger could poll it
  and make this page fully data-driven with no manual step at all. The
  free tier's 5-flipbook cap is not a real constraint for this, since
  only the current issue needs to stay live on Heyzine — once a
  Past Issues card exists, the retired flipbook can be deleted from
  Heyzine without breaking anything (Past Issues links to the flip-book
  page today, but the design already anticipates switching that to a
  plain PDF link instead, once the flipbook itself needs to go).
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
