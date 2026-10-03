# Automated Partner Merchants Sync — Design Proposal
Version: v3 · Last updated: 2026-10-03

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

What is **not** automated, and has required a manual sync each time (see
`CLAUDE.md`'s Current Status for the full history of these):
- ~~`CATEGORY_ICONS`/`CATEGORY_ORDER` in `diskwentulong/index.html` — a
  hardcoded JS object~~ — **done, PR #135**: both now live in
  `assets/merchants/categories.json`, fetched/parsed by the page instead
  of declared inline (see §2a). A brand-new category still needs a
  human-reviewed update to get a correct icon — only *where* that edit
  happens changed, not the fact that it's manual — and the 2026-08-17
  resilience fix still stops an unrecognized category from hiding its
  partners in the meantime (generic icon, appended last).
- `assets/merchants/partners.json` — the static fallback, regenerated by
  hand whenever the live Sheet changes.
- Partner logo image files — manual download/resize/commit per new
  merchant.
- `assets/merchants/live-snapshot.json` — a manual diff baseline, never
  auto-updated.

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
none of that incident's risk. Per standing practice, this environment's
own tests can't reliably confirm the live `/exec` endpoint — **not yet
confirmed by the user's own browser that `?action=partners` actually
returns the new field end-to-end.** This was a one-time setup
step, not something the sync job itself ever does — see 2c, the job's
own write scope stays exactly the two JSON files.

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
   Each committed partner entry must carry the Merchants sheet's own
   `merchant_id` (e.g. `M-0001`) as its stable identity — **never match
   or key on `business_name`**, since a name change is itself one of the
   edit types this job has to detect (see PR #108: a real past name
   correction, "MiPanda Naga"). `partners.json` doesn't currently store
   `merchant_id`; adding that field is part of this job's own
   prerequisite work alongside 2a.
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
     resized, and committed, as a checklist.
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

### 2c. Scope discipline
This job only ever touches `assets/merchants/partners.json` and
`assets/merchants/categories.json` — never `diskwentulong/index.html`'s
rendering logic, never `Code.gs`, never Google Sheets. Same narrow-
write-scope principle already applied to Codex's own read-only role in
`AGENTS.md`, applied here to this new automated actor too.

### 2d. One manual prerequisite before this can open its first PR
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

**Updated 2026-10-03**: the user reports this has been addressed, and a
real `workflow_dispatch` run now shows `GITHUB_TOKEN` declared scopes of
`Contents: write, PullRequests: write` (widened from read-only). That
confirms the *Workflow permissions* radio button is now "Read and write
permissions." **It does NOT by itself confirm the separate "Allow GitHub
Actions to create and approve pull requests" checkbox is checked** —
that's a distinct setting layered on top, and no run yet has reached the
`gh pr create` step to prove it either way (all three real runs aborted
earlier, on real data problems in the live Sheet — see Status above).
This will be confirmed the first time a run gets past a valid snapshot.

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
