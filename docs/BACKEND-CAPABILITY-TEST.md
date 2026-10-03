# Claude Backend Capability Test — Results
Version: v2.1 · Last updated: 2026-10-03

Reference doc recording what Claude actually tested (not assumed) about its
ability to build the DiskwenTulong Card backend described in
docs/DTC-DESIGN.md. Re-run these checks rather than trusting this file
blindly if the available connectors change later.

## Summary

| Capability | Result |
|---|---|
| Create a Google Sheet with data | **Works** |
| Read a Google Sheet back | **Works** (two independent methods) |
| Edit/append rows on an existing Sheet | **Not possible via the Drive connector** — but Code.gs itself can do this at runtime, and see the clasp finding below for a possible direct path |
| Delete/trash a Drive file | **Works** (as of 2026-08-14 — this environment gained Drive delete access; superseded the 2026-07-24 "not possible" finding below) |
| Create/edit/deploy a Google Apps Script project via a built-in connector | **Not possible** — no Apps Script MCP tool connected |
| Clone/edit/push/deploy the REAL, LIVE Apps Script project via `clasp` (npm CLI + OAuth) | **Works** — see "clasp" section below. This is a materially different, more capable path than anything in the rest of this doc. |
| Write Apps Script (`Code.gs`) source for the user to paste in | **Works** — no longer the only option, see clasp below |

## clasp (Apps Script CLI) — confirmed 2026-10-03

`npm install -g @google/clasp`, then `clasp login --no-localhost` (the
device/manual-code OAuth flow, since this environment has no browser the
user can complete an interactive login in directly — the human completes
the Google OAuth consent in their OWN browser, then pastes the resulting
redirect URL back). Confirmed working end-to-end against the real,
existing "DTC Card Database" Apps Script project (script ID
`1_c1Mdc4i1rJ6muonXHejam7WVvlUd6I8-fR6_tBS32lWCbJ2ZwaRbCr5`):

- `clasp clone <scriptId>` — pulls the real live `Code.js`/`appsscript.json`
  directly, no manual copy-paste
- `clasp push` — pushes edited source back to the project's HEAD
- `clasp deploy -i <deploymentId> --versionNumber <n>` — points an existing
  deployment (e.g. the live `/exec` Web App URL used by `/verify/`,
  `/register/`, `/diskwentulong/`) at a new or specific version

**Caveats found the hard way, read before relying on this again:**
- **Account matters.** `clasp list` (Drive-based script discovery) returned
  nothing for either account tried — likely the `drive.file` OAuth scope
  only seeing app-created/app-opened files, not pre-existing ones. Clone by
  *known* Script ID bypasses this and works regardless. Separately, write
  access (`clasp push`) only worked under `secretariat@rcnagaheights.org`,
  not `publicimage@rcnagaheights.org` (read/clone worked under either) —
  likely the per-account "Google Apps Script API" toggle at
  `script.google.com/home/usersettings`, which must be enabled on whichever
  account clasp is logged in as.
- **A code change that adds a new Google API scope (e.g. this session's
  `SpreadsheetApp.openById()` on a second, non-bound spreadsheet) blocks
  the ENTIRE deployment — not just the new code path — until a human
  manually clicks through Google's "Authorize access" consent prompt**
  (Deploy → Manage deployments → the "Web App requires you to authorize
  access to your data" dialog). This took down the *already-working*
  `?action=partners`/`verify`/`register` endpoints for about 15 minutes
  during this session's work until caught and fixed — a real, if brief,
  production incident. Confirmed via the user's own browser DevTools Network
  tab (HAR file) that anonymous requests were failing with HTTP 403 during
  the window the authorization was outstanding.
- **This environment's own ability to self-test the live `/exec` endpoint is
  inconsistent, not reliably broken.** Earlier in this same project, both
  plain `curl` and headless Chromium (Playwright) got blocked identically
  (`403`/`Failed to fetch`) on requests to this exact URL, even for actions
  simultaneously confirmed working for the user in their own browser —
  attributed to this environment's outbound proxy/IP being treated as
  suspicious by Google's abuse-prevention layer for Apps Script Web App
  execution. **Updated 2026-10-03**: in a later session, a plain anonymous
  `fetch('…/exec?action=partners')` run via Playwright against the real
  live site (`https://rcnagaheights.org/diskwentulong/`) succeeded cleanly
  — HTTP 200 after following Apps Script's normal 302 redirect to
  `script.googleusercontent.com`, with real JSON (confirmed `merchant_id`
  present on every entry, closing out the open question from `Code.gs`
  v13's rollout). Whatever caused the earlier block wasn't a permanent,
  structural limitation of this environment — the two sessions differ in
  more than one way (different point in time, a plain public GET with no
  auth vs. whatever was being tested before), so the exact cause of the
  earlier block, and whether it could recur, is unconfirmed. **Practical
  guidance unchanged**: still don't treat a single self-test (success or
  failure) from this environment as proof of the live endpoint's state —
  verify a one-off, consequential change via the user's own browser
  (ideally a HAR export from DevTools' Network tab) before relying on it,
  especially for anything involving auth (`/verify/`, `/register/`), which
  this particular success didn't exercise.
- **Credential handling**: `/root/.clasprc.json` holds the live OAuth
  `refresh_token`/`client_secret` in plain text. Never print this file's
  values directly — inspect keys/structure only first. (A real leak
  happened once this session from assuming the wrong top-level key name
  in a "redact known secrets" script; the user revoked it immediately at
  myaccount.google.com/permissions and a clean re-login was done.) This
  credential is also **not persistent** — this session's container is
  ephemeral, so a future session needs a fresh `clasp login`.

## Test 1 — Google Sheets: create + read

Created a throwaway Sheet (`CLAUDE_CAPABILITY_TEST_DELETE_ME`) via the Drive
connector's `create_file`, uploading CSV content with
`contentMimeType: text/csv` (auto-converts to a native
`application/vnd.google-apps.spreadsheet`):

```
card_number,cardholder_name,status
DTC-2026-0001,Test User One,ACTIVE
DTC-2026-0002,Test User Two,UNREGISTERED
DTC-2026-0003,Test User Three,EXPIRED
```

Read it back two ways — `read_file_content` (natural-language table) and
`download_file_content` with `exportMimeType: text/csv` (raw export) — both
matched the original exactly. **Header row + data rows: confirmed working.**

**Gap found**: `create_file` only creates brand-new files. There is no
update/append/insert-row tool for an *existing* Sheet. Practical implication:
Claude can do a one-shot "create this Sheet with these columns" (e.g. initial
Cards/Members/Merchants sheet setup), but cannot make ongoing edits to it
afterward through this connector — only the deployed Apps Script backend (at
runtime) or the user (via the Sheets UI) can do that.

**Cleanup note**: the test sheet could not be deleted by Claude — no
delete/trash tool exists in the Drive connector. It was left at
https://docs.google.com/spreadsheets/d/1VAWnPBc4rTt5jgcaq7C8zBozgMEXh0SI2Z7HTt_kLgo/edit
for the user to delete manually. If this file still exists when this doc is
read later, that's why.

## Test 2 — Google Apps Script: create/deploy

Searched the available toolset twice, with different terms ("deploy
execute", "clasp web app /exec endpoint") — zero Apps Script tools of any
kind are connected to this session. Confirmed: Claude cannot create a script
project, cannot edit or run one, and cannot deploy a Web App or produce a
live `/exec` URL. This is a hard capability gap (no connector exists for it),
not a permissions issue that can be worked around.

## Test 3 — What's possible instead

Claude CAN write the full `Code.gs` backend source as plain text, matching
every rule in docs/DTC-DESIGN.md (`doGet`/`doPost`/`registerCard_`/
`verifyCard_`/`setupWorkbook`/`CONFIG`, the fixed Dec 31 2027 expiry, Google
Sign-In + Members-sheet gating, the verify page's name/status-only response,
`escapeHtml` for the stored-XSS concern, etc.) — the user pastes it into the
Apps Script editor and deploys it themselves.

## Capability breakdown

**Can build end-to-end, right now, no human step needed:**
- Everything on the live static site (HTML/CSS/JS)
- One-shot Drive file/Sheet creation with content baked in at creation time
- Reading any Drive file back

**Can partially help with:**
- Sheets as the data store — initial creation only (Cards/Members/Merchants
  schema from docs/DTC-DESIGN.md §4), not ongoing edits after that
- The Apps Script backend — full code, not the project/run/deploy
- Frontend integration (`fetch()` calls, register/verify page markup) — all
  of it, but inert until pointed at a real deployed `/exec` URL

**Requires the user to do manually:**
1. Create the Apps Script project (script.google.com, or Extensions → Apps
   Script from a Sheet) and paste in the `Code.gs` Claude writes
2. Set deployment options per DTC-DESIGN.md §2: Execute as "User accessing
   the app", Access "Anyone with a Google account"
3. Deploy → New deployment → Web app, and hand the resulting `/exec` URL
   back to Claude to wire in as `APPS_SCRIPT_URL`
4. Any Sheet data edits after Claude's initial one-shot creation
5. Deleting any Drive file Claude creates, including test artifacts like the
   one from this check

## Reconfirmation — 2026-07-24
Re-checked per this doc's own instruction ("re-run these checks... if
the available connectors change"). The connector set is unchanged: still
`create_file`/`copy_file`/`download_file_content`/`get_file_metadata`/
`get_file_permissions`/`list_recent_files`/`read_file_content`/
`search_files`, no update-in-place, no delete/trash, no Apps Script tool
of any kind. All findings above still hold. (Separately, this session
also confirmed GitHub push access and outbound web access both work —
see docs/QA-STATUS.md — but that's a network-egress question, not a
connector-capability one, and doesn't change anything in this file.)
