# DiskwenTulong Card (DTC) — Design Detail
Version: v7.4 · Last updated: 2026-07-21
Mirrors: Google Drive "PROPOSAL - DTC Phase 2 Workflow v2.txt" and
"PROPOSAL - DTC Cardholder Brochure Page v1.txt" — if those Drive docs
and this file ever disagree, ask the user which is current before
proceeding; this file may lag behind Drive updates.

## Status
**BUILT and LIVE.** The "not yet built" status this section carried
through earlier versions is stale and contradicted by the rest of this
document — see the "Status update" sections below for what's actually
deployed and confirmed working, and the Open items list for what's
still outstanding. Kept as a heading only for historical continuity;
do not read this line in isolation.

## 0. Email addresses — CONFIRMED, scope reduced as of v2
- **dtc@rcnagaheights.org** — was originally meant to also send client
  registration-confirmation emails; that's no longer happening (see §3
  below — no client email is ever collected, so there's nothing to send
  to). This address's remaining actual use, if any, is an open item.
- **info@rcnagaheights.org** — general site contact email, replacing
  rotary.nagaheights@gmail.com everywhere on the live site (footer,
  contact page, JSON-LD schema). Already applied to all 6 live pages as
  of 2026-07-18.

## 1. Card expiration
Fixed date for ALL cards: **December 31, 2027**, co-terminus with one
shared MOA covering all partners (not staggered per-partner dates).
Replaces the earlier "registration date + 1 year" design. `expiry_date`
is a single config value every card reads from, not computed per-card.
Renewal is a yearly/per-MOA batch event, not individual rolling renewal.

## 2. Card numbering — one Sheet tab per batch
Format: `DTC-{BATCH}-{NNNNN}` — e.g. `DTC-2026-00001`. Five-digit,
zero-padded sequence number.

`{BATCH}` is literally the name of the Sheet tab holding that batch's
card records (e.g. a tab named `2026` holds all `DTC-2026-#####`
cards). A `TEST` tab (cards like `DTC-TEST-00001`) is used for testing
without touching real batches. Adding a new print run later just means
adding a new tab named for that batch (e.g. `2027`) — no code change
needed, the backend parses `{BATCH}` out of the card number string and
looks up the matching tab by name.

Each batch tab has the same columns:
| Column | Purpose |
|---|---|
| `card_number` | Full string, e.g. `DTC-2026-00001` — pre-printed, never generated client-side |
| `cardholder_name` | Set at registration |
| `status` | UNREGISTERED / ACTIVE / SUSPENDED / EXPIRED |
| `registered_date` | Set at registration |
| `expiry_date` | Always the single fixed date from §1 |
| `registered_by` | Email of the @rcnagaheights.org Google account that performed the registration — see §3. Internal audit only, never shown on the verify page. |

There is intentionally no `cardholder_email` or `cardholder_phone`
column — see §3.

## 3. Registration — minimal client data, no DPO trigger, domain-restricted sign-in
Only the **client/cardholder** provides `/register/`'s two form fields:
**Full Name** and the **Card Number** printed on their physical card. No
client email, phone, or address is collected anywhere in this flow —
deliberate, to stay under the data-collection threshold that would
otherwise trigger a Data Protection Officer (DPO) registration
requirement. **No confirmation email is sent to the client after
registration** — there is no client email on file to send it to.

**Member-accountability mechanism — history of 3 attempts, current state
CONFIRMED WORKING as of 2026-07-19:**
1. `Session.getActiveUser()` on a domain-restricted deployment — live-
   tested and confirmed broken. A background `fetch()` POST can't
   trigger the interactive Google sign-in a domain-restricted deployment
   requires, so the request was rejected before Code.gs ever ran.
2. An explicit Google Identity Services Sign-In button + server-side ID
   token verification, checked against a **Members** sheet allowlist —
   built and documented, but the user judged the Google Cloud Console
   setup (OAuth Client ID, linking a GCP project to the Apps Script
   project) too much ongoing complexity at the time, and dropped member
   identity capture entirely instead (this was v4 — `/register/` briefly
   had NO authentication of any kind).
3. **Current, as of 2026-07-20: the user went through the Cloud Console
   setup after all** (OAuth consent screen configured as "Internal" —
   restricts to `@rcnagaheights.org` Workspace accounts only — plus a
   Web application OAuth Client ID with Authorized JavaScript origin
   `https://rcnagaheights.org`). `/register/` has the Sign In With
   Google button again; `Code.gs` (v7, live) verifies the resulting ID
   token's audience and `@rcnagaheights.org` domain via
   `verifyIdToken_()`. NO
   separate Members-sheet allowlist this time — the "Internal" consent
   screen setting itself is the domain restriction, so any
   `@rcnagaheights.org` Workspace account can register a card, not just
   a specific vetted subset. Add a Members-sheet check back later if
   that finer restriction is ever wanted.
   **CONFIRMED WORKING END-TO-END LIVE 2026-07-20** (see the status
   update below for the full diagnosis — two separate bugs had to be
   fixed after the initial deploy before this actually worked: a
   `email_verified` type mismatch in the code, and a missing Apps
   Script authorization scope that had nothing to do with the code).

**Deployment note, important if this ever breaks again:** unlike
attempt 2, this does NOT need a separate domain-restricted deployment.
Real auth now happens INSIDE the script via `verifyIdToken_`, so the one
existing "Access: Anyone" deployment (shared with `/diskwentulong/` and
`/verify/`) works for `/register/` too — a domain-restricted deployment
would reject the unauthenticated `fetch()` at Google's access layer
before this code ever runs, which is exactly what broke attempt 1.

**Harmless leftover, in case it's confusing later:** the Sheet still has
a `Members` tab (from attempt 2's `setupWorkbook()` run, with rows like
`admin@rcnagaheights.org`). `Code.gs` v7 never reads it — the "Internal"
consent screen setting alone is the domain restriction now. Safe to
delete the tab, or leave it; not wired to anything.

**Historical note on the accepted-tradeoff window:** for a period on
2026-07-19, between attempts 2 and 3, `/register/` had no authentication
of any kind — anyone with the page's URL and an `UNREGISTERED` card
number could register a card. That window is now closed. The only
practical protections when un-authenticated were: (1) card numbers are
pre-printed physical stock, not guessable or
enumerable in bulk without an actual card in hand, and (2) `/register/`
is not linked from site navigation (`noindex`, not in the nav — reached
by whoever is told the URL). This is meaningfully weaker than the
original design's fraud-prevention goal — if that matters more than the
setup savings, revisit this decision before printing/distributing a
real batch of cards.

## 4. Partner verification — two separate QR codes, do not confuse them
1. **Printed on the physical card** -> `/diskwentulong/` — browsing/
   discovery only, no card number entry, no verification.
2. **Printed at partner counters** -> `/verify/` — the real verification
   flow:
   - A one-time Terms & Conditions modal blocks the page until accepted
     (content copied verbatim from `/diskwentulong/`'s T&C — see
     docs/PROJECTS-PAGE.md §4 note; keep both in sync if this text is
     ever revised)
   - Customer scans, types their card number
   - **Required** dropdown: "Which merchant are you at?" (populated from
     Merchants sheet `business_name`) — for usage tracking, NOT security
   - Page shows cardholder name, card number, status ONLY — never email/
     phone/address
   - Cashier manually compares the name against the physical card AND a
     valid government ID — **this manual step is the real fraud control,
     not enforced by software in any way**

The verify link/QR is deliberately public and non-secret (no per-partner
tokens) — the manual ID check does the security work, so link secrecy
isn't needed. Simpler to build and maintain than per-partner tokens.

**The card-printed QR's URL is effectively permanent** once cards are
printed and distributed. Do not restructure `/diskwentulong/` without
explicit user confirmation.

## 5. Merchants sheet schema
| Column | Purpose |
|---|---|
| `merchant_id` | e.g. M-0001 — stable, never reused |
| `business_name` | Display name; populates the verify page's required dropdown |
| `category` | Fixed dropdown, not free text — see list below |
| `offer_details` | Discount/deal text, shown publicly |
| `contact_person`, `contact_number` | Internal only, not shown publicly |
| `facebook_url` | Shown publicly |
| `website_url` | Captured in the schema/JSON but not currently rendered anywhere on `/diskwentulong/` — wire it in if/when merchants actually have a value here (all blank as of this writing, so the gap is invisible for now) |
| `logo_file_id` | Reference to logo in Drive/repo |
| `address` | Same as `website_url` — captured but not currently rendered on the page |
| `moa_start_date` | Per-partner record-keeping only |
| `status` | Active / Inactive / Pending — inactive auto-hides without deleting history |
| `date_added` | Record-keeping |

No `moa_end_date` per row and no `verification_access_code` column —
both were in earlier drafts and are no longer needed (one shared MOA
date; no per-partner tokens, see Section 4).

**Category list — still open, confirm with user before locking in:**
Health & Wellness · Hospitality · Food & Dining · Retail · Services ·
Education · Other

## 6. The /diskwentulong/ page (replaces the old Foundation page)
Structure:
1. "What is DTC" — informational section (real copy written and live,
   but still a first draft — see Open items; not reviewed/approved yet).
   As of 2026-07-21, a sample card graphic sits beside this text —
   self-rendered (HTML/CSS composited to a transparent PNG, not a
   photo), showing the real `DTC-{BATCH}-{NNNNN}` number format
   (`DTC-2026-00001`) rather than an earlier photographed mockup's
   placeholder number, and with no "Valid Until" line (removed —
   showing a fixed date on a generic sample card was misleading).
2. Partner Merchants as **category thumbnails**
3. Clicking a category opens a popup showing merchant thumbnails
   (logo + name) for that category only
4. A Terms & Conditions modal (the same content described in §4's
   `/verify/` note) auto-opens on page load — **updated: now a
   mandatory gate, matching `/verify/`.** Originally informational
   (closable via an X button, clicking the scrim, or Escape) — changed
   per explicit user request since a closable T&C defeats the point of
   having one. The only way to dismiss it now is the "I Understand"
   button; the X button and the scrim-click/Escape handlers were
   removed from the page's JS.

**Must be data-driven, not hardcoded HTML per merchant** — same
reasoning as the Projects-page scaling problem (see main CLAUDE.md).
Build a `getPartners` Apps Script GET endpoint returning Active-status
merchants grouped by category; the page fetches once on load and
renders/populates popups from that data. Adding/editing/deactivating a
merchant becomes a Sheet edit, not a code push.

"Get Involved" content (the old Foundation page's volunteer/sponsor/
partner cards) moved to the Contact page instead, as a new section
below existing contact details.

## Status update — 2026-07-18: /diskwentulong/ frontend built and LIVE

Built at /diskwentulong/. Category thumbnails + popup UI are done,
fetching assets/merchants/partners.json client-side (no backend/Apps
Script exists yet, so this is a static JSON file for now, not a live
getPartners endpoint — swapping the fetch URL to a real endpoint later
is a small change, same data shape).

**Cutover completed 2026-07-18, per explicit user confirmation**:
`/foundation/` has been removed entirely (deleted, no redirect — a
visit now 404s) and every page's nav/footer now links
"DiskwenTulong Card" -> /diskwentulong/ instead of "The Foundation" ->
/foundation/. This IS the physical-card QR destination going forward
(see §4) — do not restructure this page's URL/structure again without
explicit confirmation, per the QR-permanence note.

## Status update — 2026-07-19: backend deployed, all 3 frontend pieces wired

The Apps Script Web App is deployed and its `/exec` URL has been wired into
the site:
- `/diskwentulong/` now fetches `getPartners_()` live, falling back to the
  static `assets/merchants/partners.json` if the live response errors OR
  comes back empty. **Update:** the Merchants tab was empty when this was
  first written; it now has all 28 real rows pasted in (confirmed live —
  see Open items), so the live endpoint is what's actually showing, not
  the static fallback.
- `/verify/` built: card number + required merchant dropdown (per §4),
  calls `?action=verify`, shows name/card_number/status/dates only.
- `/register/` built: full name + card number only, POSTs to
  `?action=register`.

**None of this has been tested against the live endpoint** — this
environment's network policy blocks `script.google.com` entirely, so
Claude could not verify a single request/response end-to-end. See open
items below for specific untested risks.

## Status update — 2026-07-20: /register/ member auth confirmed working live

Code.gs v7 uploaded to Drive (adds a one-time `authorizeExternalRequest()`
helper on top of v6 — no logic changes to `verifyIdToken_`). See §3 and
the corresponding open item above for the full two-bug diagnosis
(`email_verified` type mismatch, then a missing
`script.external_request` Apps Script authorization scope). Live-tested:
sign in as an `@rcnagaheights.org` account, register a card, verified
`registered_by` is recorded correctly in the batch sheet. This closes out
the 3-attempt member-auth saga described in §3 — the mechanism is now
considered stable, not experimental.

## Open items
- [x] **Category assignments** — all 28 entries in
      assets/merchants/partners.json now user-confirmed (2026-07-19):
      Aran & Co. -> Food & Dining, Bicol Cladding -> Services,
      Lift -> Health & Wellness, Naga Slides Inflatables -> Services,
      Patron CamSur -> Food & Dining. No longer guesses.
- [x] **`Logo.SFOM Law.JPG`** — resolved 2026-07-19: confirmed by the
      user to be Mendoza Law Office's logo. Moved to
      assets/merchants/mendozalaw.jpg and wired into partners.json.
- [x] **Mendoza Law Office has no logo** — resolved 2026-07-19, see above.
- [x] **Cards batch tab headers** — confirmed 2026-07-19: both `TEST` and
      `2026` tabs have the correct 6-column header row.
- [x] **getPartners endpoint + /verify/ page** — built 2026-07-19, see
      status update above.
- [x] **Public read access gated behind Google login** — resolved
      2026-07-19: user redeployed the Web App as "Access: Anyone" (was
      "Anyone with a Google account"), so `/diskwentulong/` and
      `/verify/` no longer force a Google sign-in wall on ordinary
      visitors/cashiers.
- [x] **End-to-end tested live, 2026-07-19 — CONFIRMED WORKING.** Full
      round trip on the real deployment with Code.gs v4: registered
      `DTC-TEST-00001` via `/register/` ("Card registered
      successfully"), then verified it on `/verify/` — showed `ACTIVE`,
      correct cardholder name, `registered_date` 2026-07-19,
      `expiry_date` 2027-12-31, and the merchant dropdown populated from
      the live `getPartners` data (not the static fallback). This is the
      first real confirmation any of the DTC backend actually works —
      previously only structurally verified, never live-tested (this
      environment's network policy blocks `script.google.com` entirely).
- [x] **Member auth on /register/ — 3rd attempt, CONFIRMED WORKING LIVE
      2026-07-20.** Full history in §3 (this item was getting long
      enough to duplicate it here). Short version: attempt 1
      (`Session.getActiveUser()`) confirmed broken live; attempt 2
      (Sign-In button + Members-sheet allowlist) was built but the
      Cloud Console setup got dropped as too much complexity at the
      time (Code.gs v4 had NO auth for a while, since confirmed working
      live in that no-auth state); attempt 3 — user completed the Cloud
      Console setup after all, OAuth consent screen set to "Internal"
      (restricts to `@rcnagaheights.org`), Sign-In button back on
      `/register/`. Two separate bugs had to be found and fixed before
      this actually worked, neither obvious from the first symptom
      alone:
      1. **Code.gs v5 -> v6:** Google's `tokeninfo` endpoint can return
         `email_verified` as a real boolean `true` rather than the
         string `"true"`, and v5's strict `!== 'true'` comparison
         rejected a genuinely verified token purely on that type
         mismatch. Fixed by coercing with `String(...)` before
         comparing. Also added `logAction_` calls at every rejection
         branch inside `verifyIdToken_` so a failure can be diagnosed
         from the Logs tab instead of guessing blind — this diagnostic
         is what found bug 2 below.
      2. **Not a code bug at all:** after pasting v6 in and redeploying,
         registration still failed with the exact same user-facing
         error. The Logs tab showed the real cause: `Exception: Wala
         kang pahintulot na tumawag kay UrlFetchApp.fetch. Mga
         kinakailangang pahintulot:
         https://www.googleapis.com/auth/script.external_request` — the
         script had never been granted the `script.external_request`
         OAuth scope, because no version before v5 ever called
         `UrlFetchApp.fetch()` against an external host. A background
         Web App request has no interactive session, so it can't show
         the one-time consent screen itself — it just throws. Fixed by
         adding a throwaway `authorizeExternalRequest()` function (no
         trailing underscore — Apps Script hides `_`-suffixed functions
         from the Run dropdown, which briefly made this hard to trigger)
         and running it manually once from the editor to grant the
         scope interactively. No redeploy was needed for the scope grant
         itself, since it's tied to the script owner's authorization,
         not to a deployment version. Uploaded as Code.gs v7 in Drive
         (adds the helper function + this history to the file header;
         no change to `verifyIdToken_`'s actual logic from v6).
      **Only ONE Web App deployment needed** ("Access: Anyone"), shared
      by all three actions. Live-tested 2026-07-20: `DTC-TEST-00002`
      registered successfully with `registered_by: admin@rcnagaheights.org`
      recorded correctly in the Sheet.
- [x] **Merchant-selection tracking — implemented in Code.gs v8 and
      DEPLOYED (2026-07-21).** This was tracked separately for a
      nonprofit partner-analytics strategy discussion: the plan is an
      internal-only Looker Studio/Sheet view for the club (never shared
      directly with partners), feeding a periodic one-pager report per
      partner. That report needs a real data source, which is what this
      closes out. `doGet`/`verifyCard_`/`logVerification_` thread the
      `/verify/` frontend's already-sent `merchant` query param through
      to a 4th Verifications column, `merchant_name_selected`. The two
      manual steps (adding the column header to the live Sheet, pasting
      Code.gs v8 into Apps Script and redeploying) are both done per
      the user, 2026-07-21. **Not yet independently verified end-to-end**
      — nobody has done a real `/verify/` call with a merchant selected
      and checked that the row in the Sheet actually shows the merchant
      name in column D; see docs/QA-STATUS.md.
- [x] **Merchants tab needs the prepared CSV pasted in** — confirmed
      live: all 28 rows are in the Sheet exactly as Claude prepared them
      (merchant_id/business_name/category/offer_details/facebook_url/
      logo_file_id filled in; contact_person/contact_number/website_url/
      address blank per user decision; moa_start_date/date_added
      2026-07-01, status Active for all).
- [ ] **"What is DTC" section copy is a first draft** — written by
      Claude to get the page functional, not reviewed/approved wording
- [ ] Nav label is currently "DiskwenTulong Card" (Claude's choice,
      live now) — confirm this wording or change it
- [x] **`TEST` batch tab** — confirmed live: 100 pre-populated
      `UNREGISTERED` rows (`DTC-TEST-00001`-`00100`). Three are now
      `ACTIVE` from live testing: `DTC-TEST-00001` (registered before
      member auth existed, no `registered_by`), `DTC-TEST-00002` and
      `DTC-TEST-00003` (both `registered_by: admin@rcnagaheights.org`).
- [ ] Confirm the physical-card-+-ID check is written into partner
      onboarding/MOA materials as a required procedure — not yet formally
      confirmed as of this writing
- [x] **Test /register/ and /verify/ against the live backend** —
      confirmed working 2026-07-19 and again 2026-07-20 (3 successful
      registrations total, see the `TEST` batch tab item above), and
      `/diskwentulong/` is now live against the real Merchants data (see
      the 2026-07-19 status update above). Still worth a fuller pass
      before any real physical card printing run — see
      docs/QA-STATUS.md for the specific untested cases (duplicate/
      already-registered card, invalid card number, multiple batches,
      concurrent registrations, a non-`@rcnagaheights.org` account
      attempting to sign in).
- [ ] dtc@rcnagaheights.org's remaining purpose, if any, now that client
      registration-confirmation emails are no longer part of the design
      (see §0)
