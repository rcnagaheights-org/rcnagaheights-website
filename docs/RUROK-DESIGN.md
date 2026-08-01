# Rurok — Design Detail
Version: v2 · Last updated: 2026-08-01
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
   embedded as a Heyzine flipbook `<iframe>`. Per the Drive proposal
   doc: this is ONE cumulative flipbook covering the whole current
   Rotary Year, not a separate embed per individual issue. There is
   deliberately no "Open Full Flipbook" link out to heyzine.com (removed
   2026-08-01) — sending readers off rcnagaheights.org wasn't wanted,
   and it wasn't needed anyway: the embedded widget's own fullscreen
   icon (top-right of the widget itself) already lets a reader expand
   it without ever leaving this site.
2. **Past Issues section (bottom)** — intended as a thumbnail grid of
   retired years' issues, each linking to that issue's plain PDF
   download (per the proposal doc: when a Rotary Year ends, its
   flipbook's PDF becomes a plain download entry here — same file, no
   re-export, no separate "archive" file ever needed).

## Current data state (as of 2026-08-01)
Exactly one real issue exists: **Rurok, Volume 1: June Issue (Rotary
Year 2026-27)** — the very first issue ever published, embedded via
Heyzine (`https://heyzine.com/flip-book/1f2a839135.html`). The Drive
"Digital Bulletin" folder contains no other files besides the proposal
doc itself — no past-issue PDFs, no other flipbooks.

Because of this, the Past Issues section currently renders an **honest
empty state** — just the dashed placeholder box with an archive icon,
no text (the explanatory copy was removed along with the other visible
headings, see "Naming" above) — not a fabricated placeholder. There is
nothing to put in a thumbnail grid yet — Volume 1 hasn't been retired
(it's still the live, current issue), and no prior year's issue exists
to retire in the first place.

## Adding a past issue later (once one actually exists)
Per the proposal doc's yearly workflow: when a Rotary Year ends and a
new flipbook replaces the featured one, take that retired year's same
PDF and add it as a thumbnail card in the Past Issues section (replace
the empty-state div in `rurok/index.html`) — image/cover, issue
label, and a direct link to the PDF file (not another flipbook embed;
flipbook embeds are for the current live issue only, per the proposal
doc's reasoning about keeping only one flipbook active at a time).

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
  connector, per the proposal doc) — any future issue's Heyzine embed
  link must be created manually by a club officer and handed over,
  same as this first one was.
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
