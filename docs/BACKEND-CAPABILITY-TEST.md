# Claude Backend Capability Test — Results
Version: v1 · Last updated: 2026-07-18

Reference doc recording what Claude actually tested (not assumed) about its
ability to build the DiskwenTulong Card backend described in
docs/DTC-DESIGN.md. Re-run these checks rather than trusting this file
blindly if the available connectors change later.

## Summary

| Capability | Result |
|---|---|
| Create a Google Sheet with data | **Works** |
| Read a Google Sheet back | **Works** (two independent methods) |
| Edit/append rows on an existing Sheet | **Not possible** — no tool for it |
| Delete/trash a Drive file | **Not possible** — no tool for it |
| Create/edit/deploy a Google Apps Script project | **Not possible** — no Apps Script tool connected at all |
| Write Apps Script (`Code.gs`) source for the user to paste in | **Works** — just can't run/deploy it |

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
