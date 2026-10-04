# Whole-Repo Optimization Audit
Version: v1 · Last updated: 2026-10-04

A point-in-time, read-only audit of the entire repository (SEO, content
strategy, workflow/automation, merchant automation, QA, architecture,
performance, accessibility, analytics, security, documentation, Rotarians
data), requested by the user to compare against an independent ChatGPT/
Codex assessment before deciding what to implement. No files were edited,
no branches/PRs opened, and no Apps Script/Sheets/Drive touched as part
of producing this audit itself.

Unlike this repo's other `docs/*.md` files, this one is a dated snapshot,
not a living design doc — don't append ongoing updates to it the way
`docs/DTC-DESIGN.md` or `docs/MERCHANTS-SYNC-DESIGN.md` do. If a finding
here is acted on, record that in the relevant living doc (or `CLAUDE.md`'s
Current Status) and leave this file as the historical record of what the
audit found and when.

## 1. Executive Assessment

This is a well-run project for its scale. The last several months of work
(merchants sync, service-projects live feed, Rurok automation, the Phase 1
logo checklist, and the page-load fixes) show a consistent, disciplined
pattern: automate the data plumbing, keep a human in the loop for anything
judgment-requiring, never let a bot push to `main` unreviewed. That
pattern is the single biggest asset here — more valuable than any specific
page or feature — and the right frame for everything below is "extend this
pattern," not "replace it."

The real gaps are not where this audit expected to find the most of them.
Code quality and safety discipline are high. The gaps cluster in three
places instead:
1. **Content that exists but isn't surfaced to search engines** — 13 of 14
   service projects' full descriptions are never in crawlable HTML;
   Rurok's actual bulletin content lives entirely inside a third-party
   iframe Google can't read.
2. **Measurement** — zero analytics, not even free/passive Search Console
   verification, on a site whose own stated goal is search discoverability.
3. **One real, repeated security gap** — raw user input flows into Google
   Sheet cells via `setValue()`/`appendRow()` in four places in
   `backend/Code.gs` with no formula-injection sanitization (a classic,
   OWASP-documented Sheets/CSV-injection class). This is the one finding
   in this audit worth calling urgent.

Nothing here justifies a rewrite. The static-HTML-plus-Tailwind-CDN
approach is still the right call for this site's size, and this audit
recommends against touching it except in one narrow, additive way
(generated per-project pages, §5).

## 2. What's Already Working Well — Do Not Change

- **The GitHub-Action-sync-with-PR-review pattern** (Sheet/Drive → Apps
  Script → GitHub Action → PR → Codex review → human merge) — proven
  once, for merchants, with real production incidents (a duplicate ID, a
  corrupted logo download) caught cleanly at every stage. Service
  Projects and Rurok use a *different*, simpler pattern today (a direct
  client-side live fetch with a static fallback, no GitHub Action
  involved — see §6's correction) — don't conflate the two when reading
  the rest of this audit. The GitHub-Action pattern is still the right
  template for any *new* sync (§5/§6), precisely because it's the one
  that's actually been proven under real failures.
- **SEO fundamentals are already clean** — independently re-verified
  every page's title/meta description/canonical/OG/Twitter/JSON-LD/
  alt-text/H1-count against `docs/SEO.md`'s claims; all current and
  accurate. `sitemap.xml`/`robots.txt`/`noindex` are internally consistent.
- **No analytics/tracking scripts anywhere** — genuinely a feature, not a
  gap, until a specific decision needs the data (§13).
- **`merchants-sync.yml`'s permission scoping** — only
  `contents: write, pull-requests: write`, the default `GITHUB_TOKEN`, no
  custom secret. Exactly right, don't widen it.
- **The live-then-static-fallback pattern**, now fixed on all three pages
  that use it (`/diskwentulong/`, `/projects/`, `/rurok/`).
- **`AGENTS.md`'s reviewer boundaries** — Codex is read-only, Claude
  implements, human merges. Keep this exact division as automation grows;
  don't give Codex or any bot write access as a "convenience."
- **`prefers-reduced-motion` handling on the DTC banner** — already
  correct, just inconsistently applied elsewhere (§9).
- **Google Fonts loaded with `display=swap`** already — avoids
  invisible-text-on-load.

## 3. Current Weaknesses / Technical Debt

| # | Finding | Evidence |
|---|---|---|
| 1 | Sheets formula-injection — raw user input written unsanitized via `setValue()`/`appendRow()` | `backend/Code.gs`: `registerCard_` writes `payload.fullName` directly; `logAction_`/`logVerification_` `appendRow` raw `rawCardNumber`/`merchantName`. 4+ call sites share the same root cause. |
| 2 | 13 of 14 service projects' descriptions never reach crawlable HTML | `projects/index.html:236-239` (shared lightbox) vs. `:402-403` (featured, static) |
| 3 | Rurok's actual bulletin content is invisible to search — lives inside a third-party Heyzine iframe | `rurok/index.html` — no on-page text summary of any issue's contents |
| 4 | Every page uses the identical generic `NGO` JSON-LD block — no page-specific structured data | confirmed via grep across all 6 indexable pages |
| 5 | Tailwind loaded via the Play CDN script, which Tailwind's own docs say is not meant for production | `index.html:46` and identical on all 8 pages |
| 6 | Zero `srcset`/responsive images, zero WebP/AVIF, several 250-400KB photos likely to be the LCP element | `du -h` survey across `assets/` |
| 7 | No `loading="lazy"` on any of the 31 Rotarians portrait `<img>` tags | `rotarians/index.html` |
| 8 | No focus trap, no `role="dialog"`/`aria-modal` on any modal | confirmed across `projects/`, `diskwentulong/`, `rurok/index.html` |
| 9 | Homepage hero carousel ignores `prefers-reduced-motion` while the DTC banner on the same page respects it | `index.html:204` vs `:59` |
| 10 | Mobile menu button has no `aria-expanded`/`aria-label` | `index.html:75` |
| 11 | Zero analytics or Search Console verification | repo-wide grep, zero hits |
| 12 | `docs/CONTENT-MANAGEMENT.md` is stale (2+ months) on roster count and Service Projects state, no "superseded" marker | delegated doc audit |
| 13 | `docs/QA-STATUS.md` (last updated 2026-08-24) predates nearly everything built since | cross-referenced against `CLAUDE.md`'s Current Status |
| 14 | Rotarians roster is fully hardcoded, no `Code.gs` reader function exists yet | confirmed via grep, genuinely greenfield |
| 15 | `docs/agent-teams.md` is a generic Claude Code reference with zero project content | `CLAUDE.md:91-96` self-describes it this way |

## 4. Quick Wins

Low effort, low risk, independently shippable — these don't need to wait
for anything else.

1. Sanitize Sheet writes against formula injection (P1 — see §10 for detail)
2. Add `loading="lazy"` to the 31 Rotarians portraits — one-line template
   change, zero risk
3. Add `preconnect` for `cdn.tailwindcss.com` and
   `fonts.googleapis.com`/`fonts.gstatic.com` on every page, matching what
   Rurok already does for Heyzine
4. Gate the homepage hero carousel's `setInterval` behind
   `prefers-reduced-motion` — one `matchMedia` check, matches the existing
   DTC-banner pattern exactly
5. Add `aria-expanded`/`aria-label="Menu"` to the mobile menu button,
   toggle it alongside the existing `classList.toggle`
6. Verify the site in Google Search Console — free, zero code changes,
   directly informs every SEO decision below
7. Re-date `docs/QA-STATUS.md` and `docs/CONTENT-MANAGEMENT.md`'s stale
   sections, or at minimum add the same "superseded, see X" banner
   `docs/PROJECTS-PAGE.md` already uses
8. Move `docs/agent-teams.md` out of this repo — it's a personal Claude
   Code reference with no project content

## 5. SEO and Content Opportunities

**The single highest-value recommendation in this audit: individual
crawlable project URLs solve two problems at once, not one.**

`docs/SERVICE-PROJECTS-DESIGN.md` §9 explicitly flagged "true per-project
Facebook preview cards" as unsolved, and the user deliberately accepted a
generic page-level preview rather than build a static-page-generation
step — at the time, correctly, since nothing existed yet to generate from
safely. The *mechanism* this would reuse now exists and is proven safe —
`merchants-sync.js`'s pattern of a Node script in CI diffing/generating
content and opening a PR for Codex review and human merge, confirmed
working end-to-end including its own first real production PR (see §6
below for exactly what is and isn't already built on this pattern: only
merchants currently use it, not Rurok or Service Projects). The live
`?action=projects` endpoint already exists and already serves the data a
new sync script would need. Separately, §3 (finding 2) confirmed 13 of
14 projects' full descriptions never reach crawlable HTML at all today,
regardless of sharing.

**Recommendation**: a small, additive GitHub Action (same pattern as
`merchants-sync.js`, not a new technology) that generates one static
`projects/<slug>/index.html` per project from the same data
`?action=projects` already returns, with its own title/canonical/OG
image (that project's real photo)/JSON-LD, opened as a PR for review
like every other sync job. This:

- Makes each project independently indexable and shareable with its own
  correct preview image (closes the long-deferred §9 gap)
- Surfaces the 13 currently-hidden descriptions as real page text
- Needs zero change to GitHub Pages config — it's the exact same
  folder+`index.html` pattern every existing page already uses
- Should regenerate `sitemap.xml` to include the new URLs in the same
  script
- **Requires one small change to the existing index page, not zero**:
  `projectUrl()` in `projects/index.html:271-273` currently builds share
  links as `/projects/?project=<slug>`, not `/projects/<slug>/`. Without
  updating that function to point at the new generated pages, sharing
  would still serve the generic OG card from the query-string URL,
  undermining the whole point of this recommendation. This is a
  one-function change, not a rework of the page's rendering logic — but
  it is a real change, not "purely additive," and the recommendation
  isn't complete without it.

This is not "introduce a static site generator." It's one more script in
`.github/scripts/`, templating a single page type, following the review
pipeline that already exists.

**Other concrete, non-generic SEO items:**

- Rurok: add a short real-text summary (2-3 sentences, "what's in this
  issue") per issue directly on the page, not just the iframe embed.
  Could be one new column in the `RurokIssues` Sheet tab. Solves the
  "bulletin content is invisible to search" gap without touching the
  Heyzine integration.
- Page-specific JSON-LD: `Event` schema for dated service projects is a
  real, well-supported rich-result type for past community events, but
  it's not a drop-in given the current data: `service-projects.json` has
  only one `date` field (no start/end pair) and no structured location
  field at all — several projects' real locations are not Naga City
  (e.g. `service-projects.json:33` is Lipa City, Batangas; `:65` and `:9`
  are Calabanga, Camarines Sur, both only mentioned inside free-text
  `description` prose). Hardcoding "Naga City" as every project's
  `Event` location, as an earlier draft of this recommendation did, would
  publish factually wrong structured data. This needs authoritative
  per-project location/date fields added at the data-entry level (a
  Sheet column) before the JSON-LD can be generated honestly — or the
  generator should omit `location`/date-range properties it can't
  source correctly rather than inventing them.
- Local relevance is already solid ("Naga City" appears on 6 of 8 pages,
  address/venue correct since 2026-07-21) — no action needed.

**What NOT to do**: no keyword stuffing, no fake review schema, no
generic filler copy. The club's actual activity is substantial and
genuine — expose more of it, don't pad around it.

## 6. Workflow / Automation Opportunities

**Merchant automation.** "Normal merchant changes should not require a
manual sync trigger" bundles two things at different readiness levels:

- Data sync (name/category/offer/links): already fully automatic today,
  on a daily cron, zero manual trigger needed. A human still glances at a
  removal proposal before it's final — a deliberate, correct safety gate,
  not friction worth removing.
- Logo images: still manual by design. The recent proof-of-capability
  work found the core mechanism (folder access → resolve-by-name →
  fetch → validate) works end-to-end with no new credential, but also
  found that ~6% of merchants can never be resolved by name alone
  (abbreviated/legal-name-mismatched filenames). "Exception-based" is
  achievable; "zero manual steps ever" is not, honestly, without a stable
  ID-based mapping that itself needs a one-time human-confirmed pass.
  Phase 2 (already designed, not yet approved — see
  `docs/MERCHANTS-SYNC-DESIGN.md` §3b/§3c) would take this from "flagged
  in a checklist for a human to go find" to "proposed in the PR with the
  actual image attached for a human to confirm" — still PR-reviewed,
  never auto-published. That's the realistic ceiling, and it's a
  meaningful one.

**Important correction**: Rurok and Service Projects do *not* currently
go through any GitHub-Action sync/PR pipeline — only the merchants sync
does. `rurok/index.html` and `projects/index.html` fetch their Apps
Script endpoints (`?action=rurokIssues`/`?action=projects`) directly from
the browser at page-load time, falling back to a committed static JSON
file if that call fails; `.github/workflows/` contains only
`merchants-sync.yml`. The committed static fallbacks for these two
(`assets/rurok/issues.json`, `assets/service-projects/service-projects.json`)
are updated by hand/by Claude when they change, not by any scheduled job.
So the target pipeline (Sheets/Drive → Apps Script → GitHub sync →
generated content → PR → review → merge → Pages) is proven exactly
**once so far**, for merchants. Building the per-project static pages
recommended in §5, or an equivalent sync for Rurok/Rotarians, means
writing a *new* GitHub Action script following `merchants-sync.js`'s
pattern — not reusing an existing one. The remaining manual steps are
real either way:
Service Projects photos are a manual download/resize/commit step
(deliberately, per `docs/SERVICE-PROJECTS-DESIGN.md` §7 — agreed call,
automating image selection safely is a much harder, lower-value problem
than a data sync); Rurok's one remaining manual step is a blank Heyzine
title/subtitle needing a per-issue label fix — small, infrequent, not
worth automating.

**What NOT to build**: a unified "one mega-workflow" handling
merchants/projects/rurok/rotarians all through one script. Keep them as
separate, independently-reviewable jobs — a bug in one sync can't take
down another. That's a deliberate strength, not something to consolidate
for its own sake.

## 7. QA / Reliability Improvements

Starting point is genuinely zero — no CI, no test files, no lint config.
`AGENTS.md` itself tells Codex not to flag this as a problem, correctly,
for the site's historical scale — but the site has grown real automation
surface area (a live Apps Script contract three pages depend on) that a
static site alone didn't have. Lightweight, free GitHub Actions checks,
all independently addable:

| Check | What it catches | Effort |
|---|---|---|
| `node --check` on every inline `<script>`, in CI | Exactly what `CLAUDE.md`'s manual checklist already asks a human to do by hand every time | Low |
| JSON validity on every committed `.json` under `assets/` | A malformed `partners.json`/`categories.json`/`service-projects.json` landing on `main` | Low |
| Grep for `canva://`/`drive.google.com`, in CI | Same as above — currently a manual step | Low |
| Internal link checker (trailing-slash convention, no dead links) | Regression on a rule `docs/QA-STATUS.md` already confirmed clean once by hand | Low |
| Exactly-one-`<h1>` / missing-`alt` / `noindex` consistency check | Exactly what `docs/SEO.md`'s manual checklist already does by hand | Low |
| A tiny schema check against `backend/Code.gs`'s expected response shape for `?action=partners`/`projects`/`rurokIssues` (field names only, not live-calling it) | Catches a frontend/backend contract drift before it reaches a human reviewer | Medium |
| One Playwright smoke test per page (loads, no console errors, title matches) against the committed static fallback (not the live backend, to avoid flaking on Apps Script latency) | Exactly the kind of regression caught by hand three times in one week (the page-load bugs) | Medium |

**What NOT to do**: no Jest/Vitest framework, no linter config with an
opinionated ruleset, no visual-regression/screenshot-diffing service, no
build step for the HTML itself. All of the above run as plain Node
scripts in a GitHub Action, the same shape `merchants-sync.js` already
is — nothing here contradicts "no build step, no framework."

## 8. Architecture / Maintainability

**Direct answer to the keep-vs-templating question: keep plain HTML for
the existing 8 hand-authored pages; use a narrow version of a build layer
only for generated content.**

Full templating of the existing site (shared header/nav/footer as
includes, build step on every edit) would reduce duplication but:

- The actual pain point — updating 6 nav links when adding a page —
  happens roughly once every couple of months, and is a 10-minute,
  low-risk manual edit today.
- A templating layer means every single page edit now depends on a build
  step working correctly, on a site whose explicit value proposition is
  that it doesn't.
- It would touch all 8 pages at once to retrofit, with real risk of
  subtly breaking a page that currently works, for a benefit (saved edit
  time) that's small and infrequent.

This would not be worth doing — the ROI is negative at this site's scale.

What would be worth doing is exactly what §5/§6 already propose: a small,
isolated templating script for newly generated content only (per-project
pages). That's additive, bounded, and doesn't touch anything that
currently works — categorically different risk profile from retrofitting
the existing pages.

## 9. Performance / Accessibility

Most specifics are already covered in §3/§4. Two items are worth calling
out as deliberately *not* quick wins, for honesty:

- **Switching off the Tailwind Play CDN** to a precompiled stylesheet is
  the single biggest real performance lever available (removes a
  browser-side JIT compile from every page load), but it does mean
  introducing some automation (even just a GitHub Action that runs the
  Tailwind CLI once per push and commits the compiled CSS). Classified
  P2, not a quick win, specifically because it's the one item here that
  brushes up against "no build step." Worth doing, but deliberately, with
  the tradeoff named out loud rather than snuck in.
- **Image format/responsive-image work** (WebP conversion, `srcset`) is
  real but moderate effort across roughly 110 image files — better done
  as one deliberate pass than piecemeal.

Other concrete findings (listed in §3): no focus trap or `role="dialog"`
on any modal; hero carousel ignoring `prefers-reduced-motion`; unlabeled
mobile menu button; 31 Rotarians portraits with no lazy-loading. All
real, none urgent, all bounded single-file fixes.

## 10. Security

**One real, repeated finding, worth treating as this audit's priority
item: Google Sheets formula injection.**

`backend/Code.gs` writes user-controllable strings into Sheet cells via
`Range.setValue()` and `Sheet.appendRow()` in at least four places
(`registerCard_`'s `fullName`; `logAction_`'s `detail`;
`logVerification_`'s `cardNumber`/`merchantName`). Both APIs interpret a
string beginning with `=`, `+`, `-`, or `@` as a formula, exactly as if a
human had typed it into the UI. A malicious registration name could plant
a formula that executes — including data-exfiltration formulas like
`IMPORTXML`/`IMPORTRANGE` against other cells on the same Sheet (which
include other members' names/emails) — the moment the club secretary
opens the Sheet to review registrations. This is the OWASP-documented
"CSV/Spreadsheet Injection" class, not theoretical.

**Fix is small and shared**: one sanitization helper (strip or prefix a
leading `=+-@` before any `setValue`/`appendRow` call) applied at the
handful of existing write sites — not a redesign.

Everything else checked out clean:

- No CORS misconfiguration (the existing cross-origin calls work as
  intended, nothing overly permissive found)
- `GITHUB_TOKEN` scoping is minimal and correct
- No secrets beyond the default token anywhere in CI
- Frontend-side XSS is already handled correctly — every dynamic render
  checked (`diskwentulong`, `projects`) consistently uses
  `escapeHtml()`/`textContent`, never raw `innerHTML` of untrusted data
- `AGENTS.md`'s reviewer/implementer/human-merge separation is sound and
  should stay exactly as-is as automation grows

## 11. Documentation

Covered in detail in §3 (findings 12, 13, 15) and §4. Net assessment: the
documentation is unusually good for a project this size — the
dated-append convention (rather than rewriting history) is a real
strength that should be kept, not "cleaned up" into something shorter.
The only real issues are a couple of files that fell behind after a burst
of unrelated work (`CONTENT-MANAGEMENT.md`, `QA-STATUS.md`) and one file
that doesn't belong in this repo at all (`agent-teams.md`).
`docs/DTC-DESIGN.md` and `MERCHANTS-SYNC-DESIGN.md` should not be
restructured despite their length — their size is a direct, honest
record of real incidents, and that's valuable, not bloat.

## 12. Rotarians Data — Verdict: Defer

This is genuinely greenfield (no existing `Code.gs` reader function,
unlike projects/merchants which had partial foundations before their
rework), the roster changes maybe once a year plus occasional title
edits, and the Council of Presidents pinning/rotation logic is real
porting risk on top of standard plumbing. The automation ROI that
justified merchants/projects/Rurok (frequent churn, error-prone manual
sync) doesn't hold here as strongly. Worth doing eventually for
consistency with the rest of the site, not urgent. Photos should stay a
manual step either way, matching the already-accepted Service Projects
precedent.

## 13. Longer-Term / Other Opportunities

- **Analytics**: Search Console (§4, quick win) is the right P1. Beyond
  that, if there's a specific decision such as "which partners get
  clicked" or "is Rurok actually read," Cloudflare Web Analytics is a
  genuinely free, cookie-less, no-server option compatible with GitHub
  Pages (unlike most alternatives, which are either paid or need a
  server this site doesn't have) — but only worth adding if a real
  decision depends on the numbers (e.g. whether to keep investing in
  Rurok's monthly cadence). Not worth adding speculatively.
- **Sitemap generation**: once per-project pages exist (§5), fold
  sitemap regeneration into that same script rather than hand-maintaining
  it — it's already slightly manual today (`docs/SEO.md`'s checklist asks
  a human to bump `<lastmod>` by hand).
- **Verify/Register pages**: not touched by this audit's scope beyond
  what's already in `docs/QA-STATUS.md`'s open edge-case list — that list
  remains the right place for DTC-specific risk tracking, not this audit.

## 14. Prioritized Roadmap

**PHASE A — Quick wins / low risk** (§4, all independently shippable):
Sheets-formula sanitization; lazy-load Rotarians portraits; preconnect
CDN hosts; reduced-motion on hero carousel; mobile-menu `aria-expanded`;
Search Console verification; re-date two stale docs; relocate
`agent-teams.md`.
Do NOT touch in this phase: anything requiring a new GitHub Action, any
page's visible content/copy, any Apps Script deploy.

**PHASE B — SEO + content discoverability**: generated per-project static
pages (plus their own OG images, plus sitemap regen); page-specific
JSON-LD (`Event` for projects); Rurok per-issue text summary.
Do NOT touch yet: the existing `/projects/` index page's own rendering
logic — Phase B is purely additive new files.

**PHASE C — Workflow automation**: approve and build Phase 2 logo
resolution (if chosen); build a new GitHub Action for per-project page
generation (§5/§6), following `merchants-sync.js`'s pattern.
Do NOT touch: the human-merge gate on any sync job's PRs, merchants
included — keep every merchant-sync PR (not just proposed removals)
human-reviewed before merge; an earlier draft of this audit incorrectly
suggested auto-merging "Codex-clean, non-removal" merchant PRs, which
would have contradicted both `docs/MERCHANTS-SYNC-DESIGN.md`'s own
design and §2's own instruction to keep the reviewer/implementer/
human-merge division exact. Also do NOT touch yet: Rotarians automation
(deferred, §12); consolidating future sync jobs into one script.

**PHASE D — QA + reliability**: `node --check`/JSON-validity/
link-checker/SEO-consistency GitHub Action; one Playwright smoke test per
page against the static fallback.
Do NOT add yet: a full test framework, visual regression testing,
linting with an opinionated ruleset.

**PHASE E — Architecture improvements, only if justified**: precompiled
Tailwind CSS via a small CI step (replacing the Play CDN); WebP
conversion pass.
Do NOT do: templating/build-stepping the existing 8 hand-authored pages,
any framework adoption.

**PHASE F — Optional future enhancements**: Cloudflare Web Analytics
(only if a specific decision needs it); focus-trap/`role="dialog"` pass
across all modals; Rotarians data-driven rework.
