# Rurok (Digital Bulletin) — Design Detail
Version: v1.1 · Last updated: 2026-08-01
Mirrors Google Drive's "PROPOSAL - Digital Bulletin Publishing
Workflow.txt" (Digital Bulletin folder) — read that first for the full
publishing-cadence rationale; this file covers how it's actually built
on the site.

## Status
**BUILT and LIVE.** `bulletin/index.html` (URL stays `/bulletin/` —
deliberately not renamed to match the display name, see "Naming" below)
now shows the real first issue instead of placeholder content.

## Naming
The page's public-facing name is **"Rurok"** — `<title>`, `<h1>`, meta
description/OG/Twitter tags, the flipbook `<iframe>`'s `title`
attribute, and (as of 2026-08-01) the nav link all say "Rurok," not
"Digital Bulletin." The file path (`bulletin/index.html`) and URL
(`/bulletin/`) intentionally did NOT change — this is a display-name
change only, not a URL change.

## Page structure
1. **Featured section (top, most of the page)** — the latest issue,
   embedded as a Heyzine flipbook `<iframe>`, plus an "Open Full
   Flipbook" link to the same Heyzine URL in a new tab. Per the Drive
   proposal doc: this is ONE cumulative flipbook covering the whole
   current Rotary Year, not a separate embed per individual issue.
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
empty state** ("No past issues yet — Rurok Volume 1 is the first."),
not a fabricated placeholder. There is nothing to put in a thumbnail
grid yet — Volume 1 hasn't been retired (it's still the live, current
issue), and no prior year's issue exists to retire in the first place.

## Adding a past issue later (once one actually exists)
Per the proposal doc's yearly workflow: when a Rotary Year ends and a
new flipbook replaces the featured one, take that retired year's same
PDF and add it as a thumbnail card in the Past Issues section (replace
the empty-state div in `bulletin/index.html`) — image/cover, issue
label, and a direct link to the PDF file (not another flipbook embed;
flipbook embeds are for the current live issue only, per the proposal
doc's reasoning about keeping only one flipbook active at a time).

## Nav (added 2026-08-01)
"Rurok" now links to `/bulletin/` in the desktop nav, mobile menu, and
footer Site Map on all 6 nav-bearing pages (index, rotarians, projects,
diskwentulong, bulletin itself, contact), positioned between
"DiskwenTulong Card" and "Contact Us." `/verify/` and `/register/` have
no nav chrome by design (utility pages) and were left untouched.
`sitemap.xml`'s `lastmod` was bumped across all 6 URLs to match, per
docs/SEO.md's checklist (visible copy — the nav — changed on all of
them).

## Not done / explicitly out of scope
- No Heyzine account/upload access exists in this environment (no
  connector, per the proposal doc) — any future issue's Heyzine embed
  link must be created manually by a club officer and handed over,
  same as this first one was.
