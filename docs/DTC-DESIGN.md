# DiskwenTulong Card (DTC) — Design Detail
Version: v2 · Last updated: 2026-07-18
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
| `registered_by` | Email of the Rotary member who performed the registration (internal audit only — see §3; never shown on the verify page) |

There is intentionally no `cardholder_email` or `cardholder_phone`
column — see §3.

## 3. Member-assisted registration — minimal client data, no DPO trigger
Registration is performed BY a Rotary member on behalf of the
cardholder/client, not self-service by the client. This keeps the
member-accountability mechanism from the original design while
minimizing what's collected about the client:

- The **registering member** signs in with Google. Deploy the
  registration Web App as "Execute as: User accessing the app" +
  "Access: Anyone with a Google account" so Apps Script can read the
  signed-in member's real email natively, and check it against a
  **Members** sheet (email, name, active status) before allowing the
  registration to proceed. This is unchanged from the original design
  and is still the actual fraud-prevention/accountability mechanism —
  the member's email is recorded in `registered_by` for audit, but is
  never shown publicly and never emailed anywhere.
- The **client/cardholder** only ever provides two things: **Full Name**
  and the **Card Number** printed on their physical card. No client
  email, phone, or address is collected anywhere in this flow — this is
  deliberate, to stay under the data-collection threshold that would
  otherwise trigger a Data Protection Officer (DPO) registration
  requirement.
- **No confirmation email is sent to the client after registration** —
  there is no client email on file to send it to. (This replaces the
  original design's `sendRegistrationEmail_` step entirely.)

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

## Open items
- [ ] **Category assignments need confirmation** — added a `category`
      field to every entry in assets/merchants/partners.json (required
      for the category-thumbnail UI to work at all), but these are
      Claude's best-guess mapping from business name/type, not
      user-confirmed. Aran & Co. confirmed as Food & Dining (was
      guessed Retail — Retail now has 0 partners, so that tile no
      longer renders). Still unconfirmed: Bicol Cladding (Services),
      Lift (Health & Wellness), Naga Slides Inflatables (Services),
      Patron CamSur (Food & Dining)
- [ ] **`Logo.SFOM Law.JPG`** (assets/merchants/_unmatched/) still
      doesn't match any partner name — find out what this is
- [ ] **Mendoza Law Office has no logo** — currently shows an
      initial-letter fallback avatar on /diskwentulong/ instead of a
      real logo
- [ ] **"What is DTC" section copy is a first draft** — written by
      Claude to get the page functional, not reviewed/approved wording
- [ ] Nav label is currently "DiskwenTulong Card" (Claude's choice,
      live now) — confirm this wording or change it
- [ ] Build: Cards batch tabs + Members sheet, getPartners endpoint,
      /verify/ page (real backend — see docs/BACKEND-CAPABILITY-TEST.md
      and the "DTC Backend — Guide & Requirements" doc + Code.gs in the
      Drive "Backend (DiskwenTulong Card)" folder; Claude cannot deploy
      Apps Script itself)
- [ ] User is creating a `TEST` batch tab for testing before any real
      batch goes live (per §2)
- [ ] Confirm the physical-card-+-ID check is written into partner
      onboarding/MOA materials as a required procedure — not yet formally
      confirmed as of this writing
- [ ] Test /diskwentulong/ fully before any physical card printing run
- [ ] dtc@rcnagaheights.org's remaining purpose, if any, now that client
      registration-confirmation emails are no longer part of the design
      (see §0)
