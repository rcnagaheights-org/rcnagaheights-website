# DiskwenTulong Card (DTC) — Design Detail
Version: v5 · Last updated: 2026-07-19
Mirrors: Google Drive "PROPOSAL - DTC Phase 2 Workflow v2.txt" and
"PROPOSAL - DTC Cardholder Brochure Page v1.txt" — if those Drive docs
and this file ever disagree, ask the user which is current before
proceeding; this file may lag behind Drive updates.

## Status
All decisions below are CONFIRMED (design-approved), not yet built.

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
| `registered_by` | **No longer populated as of 2026-07-19 (v4) — see §3.** Column stays in the schema but is always left blank. |

There is intentionally no `cardholder_email` or `cardholder_phone`
column — see §3.

## 3. Registration — minimal client data, no DPO trigger, no member identity check
Only the **client/cardholder** provides anything, directly on
`/register/`: **Full Name** and the **Card Number** printed on their
physical card. No client email, phone, or address is collected
anywhere in this flow — deliberate, to stay under the data-collection
threshold that would otherwise trigger a Data Protection Officer (DPO)
registration requirement. **No confirmation email is sent to the
client after registration** — there is no client email on file to send
it to.

**Member-accountability mechanism REMOVED, 2026-07-19 (accepted
tradeoff, not an oversight).** The original design (and v2/v3 of this
doc) required the registering member to sign in with Google — first via
`Session.getActiveUser()` on a domain-restricted deployment, then via an
explicit Google Identity Services Sign-In button with server-side ID
token verification — checked against a **Members** sheet before
allowing registration, with the member's email recorded in
`registered_by` for internal audit. Both approaches were built and
documented (see prior versions of this file), but the user judged the
Google Cloud Console setup (OAuth Client ID, linking a GCP project to
the Apps Script project) too much ongoing complexity to maintain, and
explicitly chose to drop member identity capture entirely rather than
pursue either mechanism further.

**What this means in practice:** `/register/` has NO authentication of
any kind. Anyone with the page's URL and an `UNREGISTERED` card number
can register a card. The `Members` sheet and its allowlist check are
gone from Code.gs entirely (v4). The only practical protections left
are: (1) card numbers are pre-printed physical stock, not guessable or
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
| `facebook_url`, `website_url` | Shown publicly |
| `logo_file_id` | Reference to logo in Drive/repo |
| `address` | Shown publicly |
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
1. "What is DTC" — informational section (copy not yet written)
2. Partner Merchants as **category thumbnails**
3. Clicking a category opens a popup showing merchant thumbnails
   (logo + name) for that category only

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
  comes back empty (the Merchants tab has no data rows yet as of this
  writing, so the static file is still what's actually showing).
- `/verify/` built: card number + required merchant dropdown (per §4),
  calls `?action=verify`, shows name/card_number/status/dates only.
- `/register/` built: full name + card number only, POSTs to
  `?action=register`.

**None of this has been tested against the live endpoint** — this
environment's network policy blocks `script.google.com` entirely, so
Claude could not verify a single request/response end-to-end. See open
items below for specific untested risks.

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
      status update above. Untested against the live backend (see below).
- [x] **Public read access gated behind Google login** — resolved
      2026-07-19: user redeployed the Web App as "Access: Anyone" (was
      "Anyone with a Google account"), so `/diskwentulong/` and
      `/verify/` no longer force a Google sign-in wall on ordinary
      visitors/cashiers. Still untested against the live endpoint
      (network blocked, see above).
- [x] **Member auth on /register/ — tried twice, then dropped entirely
      (2026-07-19).** Full history moved to §3 (this item was getting
      long enough to duplicate it here). Short version: `Session.
      getActiveUser()` was confirmed broken for a cross-origin `fetch()`
      call (live-tested, no sign-in prompt ever appeared); the follow-up
      fix (Google Identity Services Sign-In button + server-side ID
      token verification, Code.gs v3) was built and documented, but the
      user then judged the Google Cloud Console setup (OAuth Client ID,
      linking a GCP project) too much complexity to maintain, and chose
      to drop member identity capture entirely instead (Code.gs v4). See
      §3 for what this means in practice and the accepted tradeoff.
      **Consolidation:** only ONE Web App deployment is needed now
      ("Access: Anyone"), shared by all three actions — the separate
      domain-restricted registration deployment from the v3 attempt is
      no longer used by anything.
      `register/index.html`'s `APPS_SCRIPT_URL` now points at the same
      public deployment as `/diskwentulong/` and `/verify/`. Still
      untested against the live endpoint (network blocked in this
      environment) — confirm a real registration works before trusting
      this for any real card batch.
- [ ] **Merchant-selection tracking, documented but not implemented.**
      §4 says the `/verify/` dropdown ("Which merchant are you at?") is
      "for usage tracking" — but Code.gs v2's `verifyCard_`/
      `logVerification_` never receives or stores the selected merchant
      (the Verifications tab schema is just `timestamp, card_number,
      result` — the `merchant_name_selected` column from the original
      v1 design was dropped when v2 simplified the schema). `/verify/`'s
      frontend still collects and sends `merchant` as a query param
      (forward-compatible, harmless), but nothing on the backend uses it
      today. Decide whether to add it back to Code.gs + the
      Verifications tab, or drop the requirement from §4.
- [ ] **Merchants tab needs the prepared CSV pasted in** — Claude
      prepared a 28-row import (merchant_id/business_name/category/
      offer_details/facebook_url/logo_file_id filled in;
      contact_person/contact_number/website_url/address intentionally
      blank per user decision; moa_start_date/date_added 2026-07-01,
      status Active for all) — sent to the user 2026-07-19, not yet
      confirmed pasted in.
- [ ] **"What is DTC" section copy is a first draft** — written by
      Claude to get the page functional, not reviewed/approved wording
- [ ] Nav label is currently "DiskwenTulong Card" (Claude's choice,
      live now) — confirm this wording or change it
- [ ] User is creating a `TEST` batch tab for testing before any real
      batch goes live (per §2) — header row confirmed, no card rows yet
- [ ] Confirm the physical-card-+-ID check is written into partner
      onboarding/MOA materials as a required procedure — not yet formally
      confirmed as of this writing
- [ ] Test /diskwentulong/, /verify/, and /register/ fully against the
      live backend before any physical card printing run — nothing has
      been end-to-end tested yet (see status update above)
- [ ] dtc@rcnagaheights.org's remaining purpose, if any, now that client
      registration-confirmation emails are no longer part of the design
      (see §0)
