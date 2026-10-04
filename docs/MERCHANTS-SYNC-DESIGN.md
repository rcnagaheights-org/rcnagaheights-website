# Automated Partner Merchants Sync — Design Proposal
Version: v4.1 · Last updated: 2026-10-03

## Status
**Fully built and confirmed working end-to-end, including the job's
first real PR, merged.** Both prerequisites are done: §2a
(category-config extraction, PR #135) and §2a-2 (`merchant_id` exposed
from the live feed, `Code.gs` v13, deployed via `clasp`). The org-level
GitHub Actions policy (§2d) is confirmed fully resolved — not just the
`GITHUB_TOKEN` write scopes, but the separate "Allow GitHub Actions to
create and approve pull requests" setting too, since the job has now
actually reached `gh pr create` and succeeded.

**Real runs (2026-10-03), in order:**
1. Fetched the live endpoint successfully, but the snapshot-validation
   gate correctly caught a real data problem — a duplicate
   `merchant_id` — and aborted with no JSON changes and no PR, exactly
   as designed.
2. Got an HTML page back instead of JSON from the live endpoint (a
   transient hiccup, not reproduced since) — the job correctly treated
   this as a fetch failure and aborted the same way.
3. Fetched successfully again and, thanks to the diagnostic improvement
   from run 1 (PR #138), pinpointed the exact problem: **`M-0045`** was
   assigned to both "LabCom Laboratory Supplies" and "Villa Caceres
   Hotel", and **`M-0046`** to both "White Bean Cafe" and "Flavours by
   RooRoo Café" — two real `merchant_id` collisions in the live
   Merchants Sheet, not a bug in this job. User fixed these directly in
   the Sheet.
4. First real PR (**#140**), opened by the workflow itself
   (`github-actions[bot]`, confirming the PR-creation path genuinely
   works): bootstrap-matched all 49 legacy `partners.json` entries by
   name (zero unmatched — see Open Questions below), added one new
   merchant (Green Stock), and updated 9 merchants' changed fields
   (mostly `commitment` text, plus White Bean Cafe's name). Reviewed and
   merged.
5. One follow-up (**#141**) closed the one remaining manual item —
   Green Stock's logo. Codex caught that the first download was
   genuinely corrupted (confirmed independently: Pillow raised "broken
   data stream when reading image file"); traced to the Google Drive
   MCP tool's `download_file_content` reproducibly truncating this
   specific file by 279 bytes across two separate calls. Worked around
   via a direct `curl` against the Drive file (same pattern as the
   Governor's Visit photo, `docs/SERVICE-PROJECTS-DESIGN.md`) — verified
   byte-exact, clean decode, visually correct. Merged.
6. Post-merge verification (not from the sync job itself): re-ran the
   workflow once more and got "no diff detected," confirming full parity
   between the live feed and the committed file, and that none of the 49
   bootstrap matches needs a second look. Separately audited all 50
   committed logo files for the same class of corruption Codex caught on
   Green Stock — all present and decode cleanly. Checked the live site
   directly (`https://rcnagaheights.org/diskwentulong/`): all 50 partners
   render, Green Stock's logo loads, and the live `?action=partners` call
   itself (not just the static fallback) returns real JSON with
   `merchant_id` on every entry — closing out the one open question left
   from `Code.gs` v13's rollout. See `docs/BACKEND-CAPABILITY-TEST.md`
   for a related finding: this environment's own Playwright, which had
   previously been unable to reach this exact endpoint, succeeded this
   time.

This was a genuinely good outcome for the safety design: the validation
gate did exactly what it was built for on its very first live exposure,
on two different kinds of bad input, without ever touching a committed
file — and the one real defect that did reach a human review (the
corrupted logo) was caught by Codex before merge, not after.

## 1. What's already automated vs. not

Partner Merchants' **live data** (business name, category, offer details,
logo filename, Facebook/website URLs, and — as of `Code.gs` v13 —
`merchant_id`) is already fully automated — `getPartners_()` in
`Code.gs` reads straight from the live Merchants Sheet on every page
load (see `docs/DTC-DESIGN.md` §5). This is why the live category
taxonomy has changed — and broken, then self-healed — multiple times
without any backend change.

What **used to be** not automated, before this design was built (see
`CLAUDE.md`'s Current Status for the full history of these) — kept here
for context, not as current operational guidance:
- ~~`CATEGORY_ICONS`/`CATEGORY_ORDER` in `diskwentulong/index.html` — a
  hardcoded JS object~~ — **done, PR #135**: both now live in
  `assets/merchants/categories.json`, fetched/parsed by the page instead
  of declared inline (see §2a). A brand-new category still gets a
  placeholder `grid` icon from the sync job (step 3 below) and needs a
  human-reviewed real icon afterward — only *where* that edit happens
  changed, not the fact that a real icon choice is manual — and the
  2026-08-17 resilience fix still stops an unrecognized category from
  hiding its partners in the meantime (generic icon, appended last).
- ~~`assets/merchants/partners.json` — the static fallback, regenerated
  by hand whenever the live Sheet changes~~ — **done, §2b, confirmed
  working (PR #140)**: the sync job now generates this diff and opens a
  PR automatically; a human still reviews and merges it, but no one
  hand-edits the JSON to keep it in sync anymore.
- Partner logo image files — still entirely manual, always (the live
  feed only exposes a raw Drive filename, never a usable URL — see
  step 3 below).
- ~~`assets/merchants/live-snapshot.json` — a manual diff baseline from
  before this job existed~~ — **removed**: fully superseded by this job
  (never read by the live site, never auto-updated, and the sync job's
  own diff is now the authoritative baseline).

## 2. Proposal: a scheduled sync job that opens a PR, never commits directly

Mirrors the reasoning already applied to Rurok's PDF archival (see
`Code.gs`'s own v10/v11 header comment): a scheduled job should never be
able to push unreviewed content straight to the live site. Everything
below produces a **pull request**, never a direct commit to `main`.

### 2a. Prerequisite: extract the category config out of inline HTML — **DONE (PR #135)**
`CATEGORY_ICONS`/`CATEGORY_ORDER` used to live as inline JS inside
`diskwentulong/index.html`. A bot reliably parsing/editing embedded JS
inside an HTML file is fragile. As its own small, separately-reviewed PR
with no behavior change, both were extracted into
`assets/merchants/categories.json`, and `diskwentulong/index.html` now
fetches/`JSON.parse`s that file instead of declaring the object inline
(gated on a 2-second timeout race, so a stalled fetch can't block partner
rendering — the underlying fetch keeps running and still updates the
values for any later render). Gives both humans and the sync job one
clean, machine-parseable source of truth.

### 2a-2. Prerequisite: expose `merchant_id` from the live endpoint — **DONE (`Code.gs` v13)**
Found while addressing review feedback below: `getPartners_()` in
`Code.gs` used to return only `name`, `commitment`, `facebook_url`,
`website_url`, and `logo` per entry — **no `merchant_id`**. Matching
sync-job entries by `business_name` would reintroduce exactly the bug
flagged in review (a name correction like PR #108's "MiPanda Naga"
would misread as one merchant disappearing and a different one
appearing, instead of one merchant being edited). This needed a small,
additive, one-time backend change — added
`merchant_id: row[col['merchant_id']] || null` to the object
`getPartners_()` already builds — made the normal way: via `clasp`
against the real live Apps Script project (`backend/Code.gs` updated in
the same commit as its tracked mirror), a new version (17) created, and
the existing live deployment (`AKfycbyC6GIQA0BObLJ7UFUNdjt0moznACBfk-kUeWuzckl_9qyv3LONFx_WTiX42pAXirqC`)
repointed at it — confirmed via a direct Apps Script REST API read of
the deployment, not just the `clasp deployments` CLI output (which
showed a stale cached description after the redeploy — see
`docs/BACKEND-CAPABILITY-TEST.md`). Purely additive — no existing field
renamed/removed, no other endpoint touched, no new Google API scope
(unlike the `SpreadsheetApp.openById()` change that caused a real
deployment-wide outage earlier this session) — so this redeploy carried
none of that incident's risk. **Confirmed end-to-end** (2026-10-03,
later the same session): a direct check against the real live site
(`https://rcnagaheights.org/diskwentulong/`) showed `?action=partners`
returning real JSON with `merchant_id` present on every entry — not
just the static fallback. This was a one-time setup step, not something
the sync job itself ever does — see 2c, the job's own write scope stays
exactly the two JSON files.

### 2b. The sync job itself
A new GitHub Actions workflow, scheduled daily (same cadence reasoning as
Rurok's `syncRurokIssues` trigger — merchant updates land irregularly, so
daily is more than enough headroom). **This would be the first scheduled/
PR-adjacent CI this repo has ever had** — flagging that plainly, since "no
build step" has been a deliberate project trait until now. It doesn't
touch the live site's runtime at all, only this repository.

Steps the job's script performs:
1. Fetch the same public, credential-free `?action=partners` endpoint the
   live site already calls.
2. Load the currently-committed `partners.json` and `categories.json`.
   Each committed partner entry carries the Merchants sheet's own
   `merchant_id` (e.g. `M-0001`) as its stable identity — **never match
   or key on `business_name`**, since a name change is itself one of the
   edit types this job has to detect (see PR #108: a real past name
   correction, "MiPanda Naga"). All 50 committed entries now carry
   `merchant_id` as of PR #140 (bootstrap-matched the original 49 by
   name, a one-time migration — see §2b-1); any brand-new entry the job
   adds from here on gets it directly from the live feed, with no
   bootstrap step needed.
3. Diff, by `merchant_id`:
   - **New category** → appended to `categories.json` with a placeholder
     icon (reusing the existing generic-icon fallback) — never guesses a
     real one.
   - **New merchant** → added to `partners.json` with its text metadata
     (name, category, offer text, Facebook/website links) copied
     directly — safe to automate. **`logo` is always set to `null`** on
     a new entry, never the raw Drive filename: `diskwentulong/
     index.html` treats that exact field as an already-validated,
     committed local asset filename (see `docs/DTC-DESIGN.md`'s logo-
     resolution notes), and the live feed's raw filename (e.g.
     `Logo.Aran&Co.JPG`) never matches the committed, resized/renamed
     asset — copying it verbatim would render a broken image. The raw
     Drive filename is reported only in the PR body's logo checklist,
     never written into the JSON itself.
   - **Existing merchant, changed field(s)** (`business_name`,
     `category`, offer text, `facebook_url`, `website_url`) → update
     that `merchant_id`'s entry in `partners.json` to match, and list
     exactly which field(s) changed, for which merchant, in the PR body.
     `logo` is excluded from this auto-update (stays manual, same
     reasoning as above). Without this step the committed fallback
     silently goes stale on edits — this has already happened for real
     (offer/name changes), and `/verify/` serves that stale fallback
     whenever the live call is slow or fails.
   - **A `merchant_id` present before but missing from the live feed
     now** (i.e. no longer `Active`) → never silently dropped, and never
     silently left stale either. Opens a PR proposing its *removal* from
     `partners.json` as the diff — a human reviews and merges (or
     rejects) that proposal, rather than the job deciding unilaterally.
     This is the same "propose, don't apply" principle as every other
     change type here, just for a deletion instead of an addition.
     **Gated on a snapshot-validation check, run before any removal
     reconciliation**: `Code.gs`'s `doGet`/`jsonResponse_` wraps any
     caught exception into an HTTP-200 `{error: ...}` payload rather than
     a non-200 status (see `backend/Code.gs:131-149`), and
     `docs/DTC-DESIGN.md:527-534` documents that the partners response
     can legitimately come back empty or erroring — so a plain "missing
     from this fetch = gone" rule would treat a transient backend hiccup
     as *every* merchant disappearing at once, generating a single PR
     that proposes deleting the entire fallback. Before running any
     disappearance diff, the job must confirm the fetched response: (a)
     parses as the expected shape (a list of merchant objects, not an
     `{error: ...}` payload), (b) contains a plausible nonempty count of
     merchants (e.g. not fewer than some small floor, well under the
     previously-committed count), and (c) has unique, nonempty
     `merchant_id` values throughout. If any of those checks fail, the
     job aborts immediately — no JSON file changes, no PR, just a logged
     skip — rather than treating a bad fetch as a mass removal.
   - **Logos** in general: the backend only returns a raw filename
     string (`logo_file_id`), not an actual Drive file ID or downloadable
     URL — so actually fetching/committing a logo image stays entirely
     manual, always, for both new and existing merchants. The generated
     PR body lists exactly which merchants still need a logo downloaded,
     resized, and committed, as a checklist. **Updated 2026-10-03(Phase
     1, see §2b-2)**: this checklist also now flags existing merchants
     whose committed `logo` is still missing, or whose live raw filename
     no longer matches what's committed (a "potentially mismatched"
     flag) — the same failure shape as the 2026-08-14 Sheet desync
     incident — and gives the reviewer two direct Drive links per entry
     instead of a bare filename to search for by hand.
4. **A PR opens whenever ANY of the above diff types is detected** — new
   category, new merchant, changed field on an existing merchant, or a
   proposed removal — even if, in the disappearance-only case, neither
   JSON file's content actually changes as a result of that detection
   alone (the proposed-removal diff itself is the content change in that
   case). The two JSON files are the only things the job's commit
   touches; everything else (warnings, the logo checklist, which fields
   changed and why) lives in the PR description, never silently dropped
   for lack of a file to attach it to. Never merges. Never pushes to
   `main` directly.
   **Reconciles against an already-open sync PR first, rather than
   always opening a new one**: the job always commits to the same
   reserved branch name (e.g. `automated/merchants-sync`), never a
   fresh/timestamped one. Before creating a PR, it checks whether a PR
   from that branch is already open:
   - If one is open, the job pushes its newly-computed diff as a new
     commit onto that same branch (force-pushing a freshly regenerated
     version of the two JSON files, since each run recomputes the full
     diff against current `main` rather than layering onto a prior
     run's output) and updates the PR body in place, rather than opening
     a second, duplicate PR for the same drift. A human re-reviewing a
     PR that changed since they last looked is an accepted, ordinary
     part of this flow — the same way a human force-push to update an
     open PR already behaves on this repo.
   - If no PR is open from that branch (none ever existed, or the last
     one was merged/closed), the job creates a new one as described
     above.
   - If the newly-computed diff is empty relative to current `main` but
     a sync PR is still open from an earlier run, the job leaves that PR
     exactly as-is (still open, unmerged) rather than closing it out
     from under the human reviewing it — closing/merging a PR is always
     a human action here, never this job's.
5. If there is genuinely no detected change of any kind, and no sync PR
   is already open: does nothing — no empty/noise PRs.

Since Codex's automatic GitHub review is now confirmed working (see
`AGENTS.md` and this session's integration test), a PR this job opens
would get the same automatic review as any PR a human or Claude opens —
a meaningful extra safety net on auto-generated content before anyone
looks at it.

### 2b-1. Implementation notes — found while actually building this
Two real details emerged writing `.github/scripts/merchants-sync.js`
that this design didn't originally spell out:

- **One-time bootstrap matching.** Step 2 above flags that
  `partners.json`'s existing 49 entries don't carry `merchant_id` yet.
  The script's first pass pairs each such legacy entry to a live entry
  by **normalized name** (same normalization `diskwentulong/index.html`
  already uses for its own logo lookup) — the ONE place this job
  matches on name rather than `merchant_id`, and only to backfill the
  id onto an already-existing entry, never to decide a removal. Every
  pairing is listed in the PR body ("Bootstrap: merchant_id backfilled
  by name match") so a human can double-check it. A legacy entry with
  no unambiguous live match is left completely untouched — not removed,
  not guessed at — and listed separately ("Legacy entries still without
  a merchant_id") for manual investigation. Unit-tested: a merchant that
  genuinely disappeared before this job ever ran correctly surfaces as
  one of these unmatched-legacy entries (conservative: flagged, not
  deleted), never as a false "proposed removal", since there was no
  confirmed `merchant_id` for it to go missing from in the first place.
- **The plausibility floor is based on *confirmed* merchants, not the
  raw committed count.** A legacy entry that bootstrap can never match
  (no live counterpart at all) would otherwise permanently inflate the
  denominator step 3's floor check divides against, eventually making
  the floor impossible to satisfy even with zero real losses. The floor
  is instead `min(confirmedCount, max(5, ceil(confirmedCount * 0.5)))`,
  where `confirmedCount` is the number of committed entries that already
  carry a `merchant_id` from a prior run. On the very first run this is
  0 (no prior confirmed baseline exists yet), so the floor is a no-op
  until one does — the snapshot-validation gate still catches an
  `{error: ...}` payload or a non-object response regardless.

### 2b-2. Logo checklist: visibility improvements (Phase 1, done) — 2026-10-03
Prompted by investigating `logo_file_id`'s data-integrity history (see
`docs/DTC-DESIGN.md`'s logo section) at the user's request. Explicitly
scoped as lightweight/low-risk: **no new Google credential, no new Apps
Script endpoint, no automatic logo download/commit** — just making the
existing, always-manual checklist clearer and faster for a human to act
on. Two changes to `.github/scripts/merchants-sync.js`:

- **Missing/mismatched detection for existing merchants**, not just new
  ones: for every merchant already in `partners.json`, the job now also
  flags (a) `logo` still unset, and (b) a normalized-token mismatch
  between the live Sheet's raw filename and the filename already
  committed — a lightweight heuristic (strip extension/punctuation/a
  leading "logo" token, lowercase, compare) built specifically to catch
  the 2026-08-14 failure shape, where a Sheet row-insert silently
  repointed ~30/44 rows at a different merchant's logo filename. It
  cannot prove two filenames name the same merchant, only flag when they
  look unrelated to what's already committed — a swap between two
  similarly-named files could still slip past it.
- **Direct Drive links per checklist entry**: a Drive search URL
  pre-filled with the raw filename, plus a link straight to the
  "approved logos" folder (`1LZwGXNGvTltRGhnO_ye_3b2_eMbIwcXY`, confirmed
  2026-10-03 via `mcp__Google_Drive__search_files` to be the shared
  parent folder for every merchant logo checked — Mercury, AlphaBarbers,
  Aran & Co., Green Stock — regardless of upload date). This folder ID
  is only empirically confirmed, not documented anywhere on the backend
  side, so it's a reviewer shortcut, not a guarantee — it could silently
  stop being where new logos land.

These new checklist entries deliberately do **not** add to `hasChanges`
(§2b step 4) — they only ever ride along on a PR already opened for some
other real reason (a new merchant, a changed field, etc.), never trigger
a PR by themselves. Without that guard, a permanently-missing legacy
logo would re-flag on every single scheduled run forever, opening a new
PR with nothing else in it — exactly the noise this design has avoided
everywhere else (see the "no empty/noise PRs" rule in §2b step 5).

### 2c. Scope discipline
This job only ever touches `assets/merchants/partners.json` and
`assets/merchants/categories.json` — never `diskwentulong/index.html`'s
rendering logic, never `Code.gs`, never Google Sheets. Same narrow-
write-scope principle already applied to Codex's own read-only role in
`AGENTS.md`, applied here to this new automated actor too.

### 2d. One manual prerequisite before this can open its first PR — **RESOLVED**
Kept as a historical account of how this was found and fixed — see the
Status section above for the current, confirmed-working end state.

GitHub disables `GITHUB_TOKEN`-authored pull requests by default. Before
`merchants-sync.yml` can actually open or update a PR (it will otherwise
fail at the `gh pr create`/`gh pr edit` step with a permissions error),
a human needs to enable, once: **repo Settings → Actions → General →
Workflow permissions → "Allow GitHub Actions to create and approve pull
requests"**. This isn't something available through this session's
GitHub tools (it's an admin setting, not an API this session's
credentials cover).

**Confirmed 2026-10-03 (user's own screenshot): this repo's Workflow
permissions are locked to "Read repository contents and packages
permissions" (read-only), with both that checkbox AND the "Read and
write permissions" radio button above it greyed out/unselectable at the
repo level.** This is an **organization-level policy** overriding the
repo setting, not just an unchecked repo-level box — the repo-level
toggle can't even be reached until the org-wide default changes. Fix
needs an **organization owner**, at the org's own Settings → Actions →
General (not this repo's settings page) — either loosening the org-wide
default directly, or enabling a per-repository-override option if the
org's plan offers one, after which this repo's own toggle becomes
reachable. Until this is resolved, `merchants-sync.yml` is fully built
and unit-tested but **cannot open or update any PR against the real
GitHub API** — its `gh pr create`/`gh pr edit` step will fail with a
permissions error on every run.

**Updated 2026-10-03**: the user addressed this, and a real
`workflow_dispatch` run showed `GITHUB_TOKEN` declared scopes of
`Contents: write, PullRequests: write` (widened from read-only) —
confirming the *Workflow permissions* radio button was now "Read and
write permissions." At the time, that didn't yet confirm the separate
"Allow GitHub Actions to create and approve pull requests" checkbox,
since no run had reached `gh pr create` yet (three real runs aborted
earlier on real data problems in the live Sheet — see Status above).
**Confirmed resolved** once the Sheet was fixed: PR #140 was the job's
first real output, and it opened and merged successfully — both
settings genuinely work.

## 3. Resolved questions (kept for history)
- ~~Is a new scheduled GitHub Actions workflow an acceptable first piece
  of CI for this repo?~~ **Yes** — built, merged, running.
- ~~Should the very first run be manual (`workflow_dispatch`) and
  reviewed with extra care rather than waiting for the daily schedule?~~
  **Done this way** — triggered manually once the Sheet was fixed,
  reviewed, merged as PR #140. All 49 legacy entries bootstrap-matched
  successfully; zero came back as unmatched legacy.
- ~~Does the separate "Allow GitHub Actions to create and approve pull
  requests" setting actually work, not just the declared token scopes?~~
  **Confirmed working** — PR #140 was opened and merged successfully.

## 3a. Open questions still live
- Any further failure mode in the diff logic (section 2b step 3, or the
  bootstrap-matching/plausibility-floor behavior in 2b-1) that's still
  been missed? (None found in the real run, but only one real run has
  happened so far — worth re-checking after a few more scheduled runs
  accumulate.)
- The Google Drive MCP tool's `download_file_content` reproducibly
  truncated one specific logo file by 279 bytes (see the Status
  section's run 5 above). Is this worth a general warning in
  `docs/CONTENT-MANAGEMENT.md` for any future Drive-sourced binary
  download in this repo, not just merchant logos?
- **File-level staleness is only partly handled.** A disappeared
  merchant's *record* gets proposed for removal from `partners.json`
  (§2b step 3) — but nothing removes the orphaned asset that merchant
  leaves behind:
  - Its committed **logo image** (e.g. `greenstock.jpg`) stays in
    `assets/merchants/` forever unless a human deletes it by hand — the
    job's scope discipline (§2c) never touches files outside the two
    JSON files, by design.
  - A **category** that no longer has any active partner is never
    pruned from `categories.json` either — the job only ever *adds* new
    categories (step 3), never removes ones that emptied out.
  Worth deciding: leave both as accepted manual cleanup (consistent with
  logos already being manual-always), or have the job's PR body at least
  *list* orphaned logo files/empty categories as a checklist item (same
  pattern as the existing new-merchant logo checklist), without actually
  deleting anything itself. Still open as of v3.2 — distinct from the
  missing/mismatched-logo detection added in §2b-2, which flags a
  merchant that's still active but whose logo needs attention, not an
  asset left behind by one that's gone.
- Whether/how to migrate `logo_file_id` off a free-text filename onto a
  stable identifier — see §3b for a full proposal, not yet approved or
  implemented.

## 3b. Phase 2 proposal — Apps-Script-resolved logo lookup (NOT APPROVED, NOT IMPLEMENTED)
Written up per the user's explicit request to propose, but not build,
a tighter long-term fix for the `logo_file_id` data-integrity problem.
**Do not implement any part of this without separate, explicit
approval** — everything below is design only.

### 5a. The underlying problem
The Merchants Sheet's `logo_file_id` column is a human-typed **filename
string**, never a real Drive file ID — `getPartners_()` in `Code.gs`
returns it verbatim (`row[col['logo_file_id']] || null`), with zero
validation anywhere in the pipeline. This has already caused one real
incident (2026-08-14: a Sheet row-insert silently repointed ~30/44 rows
at a different merchant's logo, caught only by a human cross-checking
business names) and is architecturally capable of recurring, since
nothing stops a future Sheet edit from doing the same thing again. The
frontend (`diskwentulong/index.html`) and now this sync job both
deliberately never trust this field for anything beyond a human-facing
hint — which is the right call today, but leaves the underlying mapping
exactly as fragile as it's always been.

### 5b. Recommended data-model direction
Move the authoritative partner↔logo mapping out of a free-text Sheet
column and into something Apps Script itself maintains and can validate
— e.g. a `merchant_id`-keyed mapping to a real Drive **file ID** (not a
filename), either populated by a human picking the file once via a
script-bound UI, or resolved server-side by matching business name
against files in the one confirmed "approved logos" folder
(`1LZwGXNGvTltRGhnO_ye_3b2_eMbIwcXY`) and requiring a human to confirm
the match before it's trusted. Either way, this is a backend/process
change to `Code.gs` and the Sheet schema itself (`CLAUDE.md`'s Hard
Rules and `docs/DTC-DESIGN.md`'s schema table would both need updating)
— not something to change unilaterally.

### 5c. Scope constraints this design must honor (user-specified, hard)
- **No new GCP service account, GitHub-held Google credential, or
  long-lived Google secret** of any kind.
- **No generic/public Apps Script endpoint capable of fetching arbitrary
  Drive files by ID or name.** Any new endpoint must be tightly scoped —
  e.g. it only ever resolves the logo for one specific, already-known
  `merchant_id`, only from within the one approved folder, never an
  arbitrary file lookup.
- **No automatic commit/publish of a logo image** until this design is
  separately approved and built — Phase 1 (above) stays the only thing
  live today.

### 5d. Sketch: a tightly-scoped resolution endpoint
A new Apps Script function (not yet written), callable only as part of
the existing Web App deployment, that takes a `merchant_id` already
confirmed to exist in the Merchants Sheet and returns metadata for the
one file in `1LZwGXNGvTltRGhnO_ye_3b2_eMbIwcXY` whose name best matches
that merchant's business name — never a raw "fetch this file ID" call a
client could point anywhere else. `DriveApp` is already in active,
working use in `Code.gs` for Rurok PDF archival (`CONFIG.RUROK_PDF_FOLDER_ID`,
lines ~132/638/641), and the code's own header comment states Drive
access is implicit for any Apps Script bound to a Sheet — favorable
signal that a new read-only folder lookup likely wouldn't repeat the
new-OAuth-scope deployment outage from earlier this session, but this is
not proven for this specific operation without an actual test deploy.

### 5e. Required image-integrity validation before any future automated download becomes a commit candidate
Per the user's explicit requirement, any future automated path from
"Apps Script resolves a logo" to "a file lands in `assets/merchants/`"
must validate, in this order, before the file is ever treated as
mergeable:
1. **Successful image decode** (e.g. Pillow or equivalent opens it
   without error) — this alone would have caught the Green Stock
   corruption this session hit from the Drive MCP tool's
   `download_file_content` (reproducibly truncated by exactly 279
   bytes, confirmed via `Pillow` raising `OSError`).
2. **Expected file type/MIME** (the declared type matches what the
   bytes actually decode as — not just trusting a `.jpg` extension).
3. **Sensible file size** (a floor to catch a near-empty/placeholder
   file, a ceiling to catch something absurdly large for a web logo).
4. **Non-truncated/non-corrupt content** — not fully separable from (1)
   above, but worth stating explicitly since the Green Stock bug was a
   *partial*, cleanly-structured-looking truncation, not an obviously
   broken file.
5. **Correct association with the intended partner** — the hardest of
   the five to automate with confidence; likely needs either a strict
   filename-to-business-name match threshold with anything ambiguous
   routed to manual review, or (safer) always requiring a human to
   confirm the match in the PR before merge, same as the rest of this
   job's "propose, a human decides" philosophy.

This validation would need its own code (likely in
`.github/scripts/merchants-sync.js` or a sibling script, running in CI
where Python/Node image libraries are available — Apps Script itself has
no equivalent `Image.open()`), not inside `Code.gs`.

## 3c. Phase 2 proof-of-capability — RESULTS (2026-10-03)
Per the user's explicit request, before designing or implementing any of
§3b for real, this tested its underlying assumptions against the actual
live Apps Script project — using a temporary, non-production test
harness, cleaned up afterward. **No production data was modified, no
logo was auto-committed, and the real production Web App deployment
(`AKfycbyC6GIQA0BObLJ7UFUNdjt0moznACBfk-kUeWuzckl_9qyv3LONFx_WTiX42pAXirqC`
@17) was never touched** — confirmed by re-listing deployments
afterward and re-checking `?action=partners` still returns correctly.

### Method
- `clasp pull`ed the live script, confirmed it matched `backend/Code.gs`
  byte-for-byte, then appended a clearly-labeled, clearly-delimited
  "TEMPORARY TEST-ONLY HARNESS" block of new functions — never wired
  into the real `doGet`/`doPost` actions (`verify`/`partners`/
  `rurokIssues`/`projects`/`register`), only into new `testPhase2*`
  action names.
- Pushed this to the script's HEAD (`clasp push`, no `-i`) — this alone
  never touches any existing deployment. A **brand-new**, separate
  deployment was then created (`clasp deploy`, no `-i`, so it got its
  own fresh deployment ID, never the production one) with the
  manifest's `webapp.access` temporarily set to `MYSELF` — i.e. callable
  only by the authenticated owner account, never anonymously, unlike the
  real production deployment.
- Called that temporary deployment's own unique `/exec` URL directly
  with an `Authorization: Bearer <token>` header, using an access token
  minted from the **same clasp OAuth credential already authorized this
  session** (`/root/.clasprc.json`, read for its token value only, never
  printed) — no new Google credential, service account, or secret of any
  kind was created for this.
- After testing, the temporary deployment was deleted (`clasp undeploy`)
  and the script's HEAD was restored: `Code.js` back to exactly
  `backend/Code.gs`'s content, **and** `appsscript.json`'s `webapp.access`
  back to `ANYONE_ANONYMOUS` (it had been temporarily set to `MYSELF` for
  the test deployment above) — both diffed byte-identical against the
  repo's tracked `backend/Code.gs`/`backend/appsscript.json` afterward
  (re-confirmed via a fresh `clasp pull` after Codex's review on PR #146
  caught that the original write-up only showed the `Code.js` diff, not
  the manifest's; re-pulling live confirmed the manifest genuinely was
  restored correctly all along — the one remaining difference is a
  trailing-newline-only artifact in `backend/appsscript.json` that
  predates this session, from when that file was first tracked in #125).
- **A second round of this exact same method** (fresh `clasp pull` →
  verified clean baseline → appended a new, separately-labeled
  "ROUND 2" test block → new temporary `MYSELF` deployment → tested →
  deleted deployment and transient fixtures → restored and re-diffed
  both files byte-identical, `appsscript.json` included this time) was
  run specifically to address two further Codex findings: the
  production-shaped `merchant_id` boundary (#2/#7) and a genuine,
  not-vacuous cross-folder containment proof (#4e) — see those rows
  below for what it found.

### Results — PASS / BLOCKED per the 8 requested capabilities

| # | Capability | Result | Evidence |
|---|---|---|---|
| 1 | Apps Script can access the approved logo folder under the existing authorization model | **PASS** | `DriveApp.getFolderById(...).getFiles()` returned all 50 files (folder name "Partner Merchants") with zero new OAuth consent prompt — consistent with the existing Rurok-archival `DriveApp` usage already covering this scope. |
| 2 | Resolve one partner to exactly one logo without a generic arbitrary-file mechanism | **PASS, with a reliability caveat** | Per Codex's review, re-tested in the production-shaped order: a `merchant_id` resolves server-side to a business name (read from the real Merchants sheet, read-only) before any Drive lookup. A valid id (`M-0002`) correctly resolved to Aran & Co.'s real logo; a fabricated, unknown id (`M-9999`) was correctly rejected as `unknown_merchant_id` rather than falling through to anything. The resolver never accepts a caller-supplied file ID or raw business name in this shape — only an already-public `merchant_id`. Name-matching itself only succeeds for some merchants regardless — see #4. |
| 3 | Real Drive file ID vs. filename-based `logo_file_id`: practical? | **PASS (practical), migration recommended** | The resolver returns a real, stable `file.getId()` (e.g. `12eP6TR-WqWsFlvsZ_k4N1snXwO4sU8on` for Aran & Co.) — exactly the kind of value that should be the authoritative mapping instead of a free-text filename. But see #4: automatically *discovering* that ID by name match fails for real merchants, so populating this mapping needs a one-time human-confirmed pass, not blind automation. |
| 4a | Valid partner + valid logo | **PASS** | "Aran & Co." → exact match; "Green Stock" → exact match (both real merchants, real files). |
| 4b | Partner with no logo | **PASS** | A fabricated name ("Totally Fake Test Merchant Zzz") correctly returned `no_match`, not a false positive. |
| 4c | Duplicate/ambiguous filenames | **PASS (logic only — no real case exists today)** | Exhaustively checked all 50 real filenames pairwise offline: no real duplicate/substring collision exists in the live folder right now. Verified the `ambiguous` code path instead via a controlled synthetic pair (two files both normalizing to `greenstock`, differing only by extension) — correctly refused to guess and reported `ambiguous` rather than picking one. |
| 4d | Incorrect/unmatchable partner↔logo mapping | **PASS as a safety property, but reveals a real gap** | Found **3 real merchants (6% of 50) whose correctly-assigned live logo cannot be found by name matching at all**: Santigwar → `Logo.Sntgwr.JPG`, Mendoza Law Office → `Logo.SFOM Law.JPG` (a different legal/trade name entirely), White Bean Cafe → `Logo.WB.png`. All three correctly returned `no_match` (safe — it never guessed a wrong file) rather than a false positive, but this means full hands-off automation isn't realistic; a human-confirmed pass is required for these. |
| 4e | File outside the approved folder | **PASS — re-tested properly after Codex correctly flagged the first attempt as unproven** | The original test used a file the executing identity had *zero* access to at all, so it proved nothing about containment specifically. Re-tested with a real, genuinely-accessible file: created a transient fixture named `Logo.Aran&Co.jpg` inside the **Rurok PDF archival folder** (`CONFIG.RUROK_PDF_FOLDER_ID` — a different folder this same identity already reads/writes in production, per `backend/Code.gs:638`), deliberately colliding by name with the real "Aran & Co." logo. Confirmed the identity *can* read it (`accessibleOutsideMatch` found it) — proving Drive ACLs alone do **not** confine this identity to the approved folder — yet the folder-scoped resolver still correctly returned only the real approved-folder file (`12eP6TR-WqWsFlvsZ_k4N1snXwO4sU8on`), never the outside fixture. Containment held because the resolver structurally only ever enumerates one hardcoded folder, not because of any ACL boundary. Fixture deleted immediately after. |
| 5 | GitHub/CI retrieval without a new service account/credential/secret | **PASS (by design reuse)** | The existing production deployment is already `Access: Anyone` and already called anonymously by `merchants-sync.js` today for `?action=partners`. A future `?action=partnerLogo&merchant_id=...` action on that *same* deployment needs no new credential — merchant logos are already public-facing content on the live site, so nothing new is exposed. (The Bearer-token mechanism above was used *only* to keep this test's own harness non-public — it is not part of the recommended real design.) |
| 6 | Retrieved image validated before use (decode, MIME, size, truncation) | **PASS** | Fetched 3 real files (JPEG 86,270 B, PNG 48,427 B, JPEG 2,538,660 B) — all byte-exact vs. Drive's own reported size, all cleanly Pillow-decoded with correct format/mode/dimensions, declared MIME matched Pillow's detected format in all 3. Deliberately truncated a copy by the **same 279 bytes** as this session's real Green Stock corruption incident — Pillow correctly raised `OSError: image file is truncated`. Per Codex's review on PR #146, also implemented and tested the sensible-size floor/ceiling gate itself (not just transfer completeness) with controlled synthetic inputs: a 3-byte garbage file was rejected as below a 1 KB floor, and a 3.45 MB inflated file was rejected as above a 3 MB ceiling, while the real 86,270 B logo correctly passed both bounds. |
| 7 | Endpoint can be tightly scoped, not arbitrary-file-capable | **PASS** | Per Codex's review, re-tested against the actual production-shaped parameter: a `merchant_id`, not a raw business name or file ID (see #2) — resolution happens server-side from there. An unknown `merchant_id` is cleanly rejected, never silently falls through to any file. Also confirmed the test deployment's `MYSELF` access genuinely blocks anonymous callers (redirected to a Google sign-in page, not JSON) as an independent backstop verified during testing. |
| 8 | Apps Script Web App limitations | **Documented, no blocker found for this use case** | See below. |

### Capability #8 in detail
- **Execution time**: Google's documented quota is 6 min/execution, same
  for consumer and Workspace accounts. The largest real test (a 2.5 MB
  logo file, base64-encoded) completed in ~6 seconds end-to-end.
- **Response size**: no explicit documented cap on `doGet`/
  `ContentService` output; `UrlFetchApp` itself is capped at 50 MB/call
  (not directly relevant here since `DriveApp` blob access doesn't go
  through `UrlFetchApp`). Empirically, a 2.5 MB binary (≈3.3 MB
  base64-encoded) round-tripped with no issue.
- **Authentication/access behavior**: confirmed `MYSELF` access
  genuinely rejects anonymous requests (redirect to Google sign-in, not
  JSON); an already-authorized OAuth Bearer token can call a
  `MYSELF`-restricted deployment directly.
- **Deployment propagation/caching**: redeploying an *existing*
  deployment to a new version is **not instantaneous** — observed a
  real ~8 second window where the new version still returned `{"error":
  "Unknown action"}` before the new code took effect. Matches this
  session's earlier-documented `clasp deployments` stale-cache quirk.
  Any future deploy automation must not assume immediate consistency
  right after `clasp deploy`.
- **Binary/base64 handling**: `Utilities.base64Encode(blob.getBytes())`
  round-tripped byte-exact for all 3 real files tested — `DriveApp`'s
  blob API is a reliable binary channel here, independent of whatever
  causes the *separate* Drive MCP connector tool's documented
  truncation bug (that bug is specific to this environment's own
  tooling, not to Apps Script/Drive itself).
- **`DriveApp.getParents()` is unreliable for files it doesn't own, under
  this project's current cross-account sharing setup** (file owner
  `publicimage@rcnagaheights.org`, script execution identity
  `secretariat@rcnagaheights.org`): a file *proven* enumerable as a
  child of the approved folder via `folder.getFiles()` came back with
  **zero parents** when queried directly via
  `DriveApp.getFileById(id).getParents()` for the same executing
  identity (confirmed via a diagnostic also checking
  `file.getOwner()`/`Session.getActiveUser()`). This is a genuine,
  non-obvious platform/sharing-model behavior, not a bug in the test
  code. **Design implication: a real Phase 2 implementation must not
  rely on a `getParents()`-based containment check as its safety
  boundary** — it must stay safe structurally, by only ever resolving
  file IDs through enumerating the one approved folder in the first
  place, never by validating an arbitrary externally-supplied ID
  after the fact.

### A directly relevant side finding: Phase 1's own "potentially mismatched" flag has a high false-positive rate
Dry-running the real `computeDiff()` (already live, PR #145) against
the live partner feed (read-only, no files written) found it would flag
**17 of 50 real merchants (34%)** as "potentially mismatched" on the
very next scheduled run — e.g. `alphabarber.jpg` vs. live
`Logo.AlphaBarbers.jpg`, `mercurydrug.png` vs. live `Logo.Mercury.png`.
**None of these are actually wrong** — they're legitimately abbreviated
filenames a human already correctly resolved; the heuristic's strict
normalized-token *equality* doesn't credit a committed name that's a
shortened form of the live one. This is a real noise problem worth a
follow-up fix (e.g. loosen the comparison to substring-contains, same
as the resolver above) before the checklist is trusted at face value —
flagged here, not fixed yet, since it's outside what this proof-of-capability
task was asked to do.

### Net takeaway for Phase 2 design
The core mechanism works end-to-end (folder access → resolve → fetch →
validate), with no new credential and with real image-integrity
validation. The two things that must change from this session's
original Phase 2 sketch (§3b) before any real implementation:
1. **Drop the `getParents()`-based containment check** — it's
   unreliable here. Safety must come from only ever enumerating the one
   approved folder, never from validating an arbitrary ID after the
   fact.
2. **Name-based resolution alone cannot be the whole mechanism** — ~6%
   of real merchants need a human-confirmed mapping regardless (an
   abbreviation or legal/trade-name mismatch no heuristic will
   reliably bridge). Any Phase 2 build should treat automated
   name-resolution as a first-pass suggestion for a human to confirm,
   never as grounds to auto-commit a logo on its own.

Phase 2 itself remains **NOT APPROVED, NOT IMPLEMENTED** — this section
is proof-of-capability evidence only, per the user's explicit request.

## 4. Revision history
- **v1** (2026-10-03): initial proposal, opened as PR #134.
- **v1.1** (2026-10-03): revised per Codex's automatic review on #134 —
  all three findings were valid and are now incorporated: (1) new
  merchants get `logo: null`, never the raw Drive filename, in
  `partners.json`; (2) a disappearance-only run now still opens a PR
  (proposing removal, reviewed by a human) instead of silently
  producing no diff and no warning; (3) added proper field-diffing for
  existing merchants, keyed on the Merchants sheet's own `merchant_id`
  rather than `business_name` (which can itself change — see PR #108) —
  this in turn surfaced that `merchant_id` isn't in the live feed yet,
  now its own prerequisite (2a-2).
- **v1.2** (2026-10-03): revised per Codex's second automatic review on
  #134 — both findings were valid and are now incorporated: (1) added a
  snapshot-validation gate (expected shape, plausible nonempty merchant
  count, unique nonempty `merchant_id` values) that must pass before any
  removal-reconciliation runs, so a transient backend error/empty
  response can never be misread as every merchant disappearing at once;
  (2) added an idempotent PR lifecycle — the job always commits to the
  same reserved branch and updates an already-open sync PR in place
  instead of opening a duplicate on every scheduled run.
- **v1.3** (2026-10-03): revised per Codex's automatic review on #135 —
  both findings were valid and are now incorporated: (1) marked §2a as
  done (PR #135 merged the category-config extraction), so this doc
  stops telling a future implementer to repeat completed work; (2) noted
  that the extraction PR itself also fixed a real regression Codex
  caught on #135 — gating both the static-fallback and live render paths
  on an un-timed-out `fetch()` could have hung the page indefinitely on
  a stalled same-origin request, fixed by racing the fetch against a
  2-second timeout.
- **v1.4** (2026-10-03): §2a-2 done — `getPartners_()` now returns
  `merchant_id` on every entry (`Code.gs` v13, deployed via `clasp`,
  confirmed live via a direct Apps Script REST API read of the
  deployment). Purely additive, no new Google API scope, no other
  endpoint touched. Not yet confirmed by the user's own browser that the
  new field actually comes through `?action=partners` end-to-end.
- **v2** (2026-10-03): §2b built — `.github/workflows/merchants-sync.yml`
  (scheduled daily + `workflow_dispatch`) and
  `.github/scripts/merchants-sync.js` (the diff engine). Unit-tested
  locally against mocked live data for every diff path, including a
  full end-to-end run against the real committed `partners.json`
  (49 entries). Two real design details surfaced while writing the code
  and are documented in the new §2b-1: the one-time name-based bootstrap
  match for legacy entries without `merchant_id`, and why the
  plausibility floor is based on *confirmed* merchants rather than the
  raw committed count (a legacy entry bootstrap can never match would
  otherwise permanently inflate the denominator). New §2d documents one
  manual repository-setting prerequisite this session can't set itself.
  **Not yet triggered against the real live endpoint or confirmed
  working end-to-end** — pending §2d's manual setting and a first
  `workflow_dispatch` run.
- **v2.1** (2026-10-03): §2d updated with what the user's own screenshot
  confirmed — this isn't a simple unchecked repo-level box. Workflow
  permissions are locked to read-only at the **organization** level,
  with the repo's own "Read and write permissions" radio button itself
  greyed out/unreachable, not just the PR-creation checkbox beneath it.
  Needs an organization owner at the org's own Actions settings, not
  this repo's. Confirmed the workflow is fully blocked from opening or
  updating any real PR until that's resolved.
- **v2.2** (2026-10-03): user widened the org-level policy from v2.1 —
  confirmed via a real `workflow_dispatch` run showing `GITHUB_TOKEN`
  declared scopes of `Contents: write, PullRequests: write`. Per Codex's
  review on #139: this confirms the Workflow-permissions radio button,
  but NOT the separate "Allow GitHub Actions to create and approve pull
  requests" checkbox — no run has reached the `gh pr create` step yet to
  prove that setting either way, so §2d/§3 now say so explicitly instead
  of assuming it from the scopes alone. The job's first three real runs
  each hit genuine real-world findings before reaching that step, and
  handled every one correctly: a duplicate `merchant_id` (validation
  gate caught it, aborted cleanly); a transient HTML-instead-of-JSON
  response from the live endpoint (treated as a fetch failure, aborted
  cleanly, not reproduced since); and, after improving the validation
  error to name names (this session's other small PR), pinpointed the
  exact duplicate-id collisions: `M-0045` (LabCom Laboratory Supplies /
  Villa Caceres Hotel) and `M-0046` (White Bean Cafe / Flavours by
  RooRoo Café). User is fixing these in the live Sheet directly. No
  code or docs changes needed for this finding — the job worked exactly
  as designed on real, previously-unseen bad input, on its very first
  live exposure.
- **v3** (2026-10-03): the Sheet was fixed and the full cycle completed.
  §2d is now confirmed fully resolved (PR #140 opened and merged
  successfully, not just token-scope confirmation). PR #140 (the job's
  first real output) bootstrap-matched all 49 legacy partners cleanly,
  added Green Stock, updated 9 fields, and merged. A follow-up (PR #141)
  fixed a genuine corruption in Green Stock's downloaded logo — caught
  by Codex, root-caused to a reproducible truncation bug in the Drive
  MCP tool's `download_file_content`, worked around via direct `curl` —
  and merged. Post-merge, re-running the workflow confirmed "no diff
  detected" (full live/committed parity, zero bootstrap mismatches), a
  full audit of all 50 committed logo files found no other corruption,
  and a direct check of the live site confirmed everything renders
  correctly, including the live `?action=partners` call itself (not
  just the static fallback) returning `merchant_id` on every entry.
  Rewrote the Status section to reflect this end state and resolved the
  Open Questions that this completed (moved to §3, kept for history).
- **v3.1** (2026-10-03): added a new open question — file-level
  staleness (orphaned logo images, categories that have emptied out) is
  only partly handled. A disappeared merchant's *record* is correctly
  proposed for removal, but nothing cleans up the logo file it leaves
  behind, and nothing prunes a category once nothing in it remains
  active. Not yet decided whether to leave this as accepted manual
  cleanup or have the PR body at least list it as a checklist item.
- **v3.2** (2026-10-03): per the user's request, investigated the
  `logo_file_id` data-integrity problem (it's a free-text filename, not
  a Drive ID, with a documented history of pointing at the wrong
  merchant) and implemented the lightweight, pre-approved Phase 1
  improvements (§2b-2): the logo checklist now flags existing merchants
  with a missing or "potentially mismatched" logo, not just new ones,
  and every checklist entry gets a direct Drive search link plus a link
  to the confirmed approved-logos folder. No new credentials, no new
  endpoint, no automatic logo download/commit. Also wrote up (§3b), but
  explicitly did NOT implement, a Phase 2 proposal for an Apps-Script-
  resolved logo lookup scoped to one `merchant_id` at a time from the
  approved folder, including the required image-integrity validation
  gates (decode, MIME, size, non-truncation, partner association) any
  future automated download must pass before becoming a commit
  candidate — pending separate approval.
- **v4** (2026-10-03): ran the user-requested Phase 2 proof-of-capability
  (§3c) against the real live Apps Script project via a temporary,
  non-production test harness (cleaned up afterward; production
  deployment never touched — confirmed by re-listing deployments and
  re-checking `?action=partners`). Result: the core mechanism (folder
  access → name-based resolve → fetch bytes → validate image integrity)
  works end-to-end with no new credential, but surfaced two required
  design changes before any real Phase 2 build: drop the
  `getParents()`-based containment check (proven unreliable under this
  project's cross-account Drive sharing setup) in favor of only ever
  enumerating the one approved folder; and treat name-based resolution
  as a human-confirmed first pass only, never full automation, since
  ~6% of real merchants (3 of 50) have a correctly-assigned logo no name
  heuristic can find. Also surfaced a directly relevant side finding:
  Phase 1's "potentially mismatched" flag (already live, PR #145) has a
  34% false-positive rate on real data — flagged as a follow-up, not yet
  fixed. Phase 2 remains NOT APPROVED, NOT IMPLEMENTED.
- **v4.1** (2026-10-03): addressed 4 Codex findings on PR #146's proof
  (2 from the first automatic review, missed before this session
  subscribed to the PR's activity, surfaced only once fetched directly;
  2 from a second review after "@codex review" was re-tagged). All 4
  were valid: (1) the manifest-restoration claim only showed `Code.js`
  diffed, not `appsscript.json` — re-pulled live and confirmed the
  manifest genuinely was restored correctly all along; (2) the
  sensible-size validation gate was asserted PASS without ever testing
  its actual floor/ceiling rejection logic — implemented and tested it
  with controlled synthetic inputs (a 3-byte file below a 1 KB floor, a
  3.45 MB file above a 3 MB ceiling, both correctly rejected); (3) the
  resolver had only been tested with a raw business name, not the
  production-shaped `merchant_id` → business-name → logo path — re-ran
  with a real valid id (resolved correctly) and a fabricated unknown id
  (cleanly rejected); (4) the "file outside the approved folder" test
  used a file the executing identity had zero access to at all, proving
  nothing about containment specifically — re-ran with a real,
  genuinely-accessible fixture placed in a different folder the same
  identity already uses in production (Rurok PDF archival), deliberately
  name-colliding with a real approved-folder logo: the identity could
  read it, but the folder-scoped resolver still never returned it,
  proving containment is structural, not ACL-based. All test deployments
  and transient fixtures were deleted and the script restored (both
  files, byte-diffed) after each round. Phase 2 remains NOT APPROVED,
  NOT IMPLEMENTED.
