# QA Status & Known Risks
Version: v1.6 · Last updated: 2026-08-01

Consolidated from a full-repo QA/documentation assessment. This file
exists because "confirmed working" gets used loosely across the other
docs — some claims are backed by the user's own live screenshots, some
are only sandbox-verified (never touched the real deployed site), and
that distinction matters before trusting any of it at face value.

## 1. No automated test suite — standing risk
Confirmed: no `.github/workflows/`, no CI config, no `package.json`, no
test runner, no `*.test.*`/`*.spec.*` files anywhere in this repo. The
only defined verification steps are the manual ones in CLAUDE.md's
"Verifying changes" section (run inline `<script>` blocks through
`node --check`, grep for `canva://`/`drive.google.com`, check
trailing-slash link conventions). **Any regression — broken JS, broken
layout, broken link — is only caught by manual review or the user's own
screenshots.** There is no automated safety net before something reaches
production on GitHub Pages. Not something to fix given this site's
scale/no-build-step philosophy, just a risk worth knowing about.

## 2. Sandbox-verified vs. live-verified — read the difference carefully
This dev environment's network policy blocks `script.google.com`,
`accounts.google.com`, `cdn.jsdelivr.net`, and `images.pexels.com`
entirely. Anything tested "in-session" therefore used a local Tailwind
CSS build + Playwright screenshots against same-origin substitute
assets — never the real deployed site, never the real Google
Sign-In/Apps Script flow.

**Confirmed via the user's own live screenshots (trust these):**
- Homepage hero as a 3-photo carousel (2026-07-19).
- DTC end-to-end round trip, no-auth state: registered `DTC-TEST-00001`,
  verified `ACTIVE` with correct dates (2026-07-19).
- DTC member-auth end-to-end: registered `DTC-TEST-00002` and
  `DTC-TEST-00003` while signed in as `admin@rcnagaheights.org`,
  `registered_by` recorded correctly both times (2026-07-20).

**Sandbox-only so far — plausible but not yet user-confirmed live:**
- The two most recent hero/about-image mobile aspect-ratio fixes
  (commits `f0dc565`, `254f24a`) — landed after the last live
  screenshot confirmation, verified only via local Playwright.
- The Service Projects data-driven rework's carousel/prev-next/lightbox
  behavior with more than one project per category — verified only
  with temporary test-only entries in the sandbox (never committed,
  never seen by the user), since only one real Tracker row exists so
  far. Re-verify live once a 2nd real project with a real photo lands
  in a category.
- Any Code.gs change made in a sandboxed session can never be
  self-verified end-to-end before being handed to the user — this is a
  structural limitation (script.google.com is unreachable), not
  specific to any one change.
- Everything shipped 2026-07-21 — the DTC support banner (including the
  wide-desktop motion fix and the "Learn More" pill scrolling with the
  ticker), the real self-hosted `og:image` replacing the Pexels
  placeholder, the self-rendered DTC sample card graphic, the
  Contact-page/global-footer address+phone content fix and centered
  formatting, the mandatory T&C gate on `/diskwentulong/`, and the
  Rotarians page's Council of Presidents section — all verified only via
  local Tailwind build + Playwright screenshots in this sandbox, never
  against the real deployed site. One user report did come in
  mid-session (a screenshot showing the old Pexels image in a real
  Messenger link-share preview, which is what prompted the `og:image`
  fix) — that confirms the *problem* was real, not that the *fix* has
  been re-verified live yet.
- Code.gs v8's merchant-selection tracking (see docs/DTC-DESIGN.md's
  Open items) — the user has confirmed both manual deployment steps
  are done (Sheet column header added, v8 pasted in and redeployed),
  but nobody has yet done a real `/verify/` call with a merchant
  selected and checked that the Verifications row actually shows the
  merchant name in column D. Deployed and reported done ≠
  end-to-end verified.

**A third tier, distinct from both of the above (2026-07-24):** a
session with real network access (unlike the sandboxed session that
built the `/verify/` redesign in PRs #68-71, entirely blind) confirmed
that redesign renders and functions correctly — but not via a real
device, via a local Playwright/Chromium render of the actual deployed
`rcnagaheights.org/verify/` HTML. Chromium in that session's own sandbox
still couldn't make outbound HTTPS connections directly (same class of
restriction as before, confirmed by testing plain `https://example.com`
too, not just the site), so external requests (`cdn.tailwindcss.com`,
Google Fonts, and the Apps Script backend) were routed through Node's
`fetch`, which does reach the real internet, and the responses handed
back into the page. Net effect: real Tailwind CSS, real fonts, and a
real live Apps Script round trip, but not literally "opened Chrome on a
phone and looked at it" — treat it as stronger than sandbox-only,
weaker than the user's own device confirmation. Confirmed this way:
card proportions read as landscape, logo sized correctly top-right, no
digit-field clipping on `2026`/`00001`, typing `TEST` in the batch field
works, the serial field still strips symbols, the merchant dropdown
loads live data with the chevron aligned correctly, the T&C modal's
corners are rounded on all four corners and only "I Accept" dismisses
it, and a live `action=verify` call for `DTC-TEST-00001` returned
`ACTIVE` with the correct name/dates — same for an invalid card number
correctly returning `INVALID CARD` styled with the red stamp.

**New finding from that same pass:** the live `getPartners` response
has a real double-encoding bug on at least one merchant name — "White
Bean Café" comes back as `White Bean CafÃ©` (confirmed via a direct
`curl` of the Apps Script endpoint, not a rendering artifact of the
test setup). This is a Code.gs/Sheet data issue, not a `/verify/` page
bug — the frontend just displays whatever string it's given. Not fixed
as part of this pass since it's outside `/verify/`'s scope; see
docs/DTC-DESIGN.md's Open items.

**Resolved data bug, found and fixed 2026-07-29:** the `2026` batch tab
had a completely blank `status` column on every row (unlike `TEST`,
where every row is explicitly `UNREGISTERED` until registered). This
made every card in the `2026` batch simultaneously un-registerable
(`/register/` refused it with the misleading "already registered or is
not available for registration (status: )." — blank ≠ `UNREGISTERED`)
and un-verifiable as a real status (`/verify/` showed `UNKNOWN`, since
blank isn't a key in the frontend's status-badge map). Neither
`Code.gs` nor the frontend had a bug — both behaved exactly as designed
given the data they read. Confirmed fixed the same day: every row
`DTC-2026-00001`-`00414` now reads `status = UNREGISTERED`. See
docs/DTC-DESIGN.md's Open items for full detail. Not yet re-verified
with an actual `/register/` + `/verify/` round trip on a `2026` card
now that the data's corrected.

## 3. DTC — open edge cases, explicitly not yet tested
The live round trip works, but several specific edge cases (duplicate/
concurrent registration attempts, non-domain sign-in rejection, and a
couple of others) have not been exercised end-to-end yet. **Full list
intentionally kept out of this public repo as of 2026-07-30** — it
doubled as a punch list of exactly which paths are least hardened,
which isn't useful to publish. The complete, current list is
maintained in the Drive-only "QA Status & Known Risks" doc (Project
Architecture folder) — check there before any real physical card
printing run, and update it there (not here) as each case gets
exercised.

The `/verify/` dropdown's merchant selection (added in Code.gs v8) is
confirmed working end-to-end — real merchant names now appear in the
Verifications sheet's `merchant_name_selected` column on live requests.

## 4. Cross-browser / cross-device coverage gap
All testing this session used Chromium via Playwright at two fixed
viewport widths (1440px desktop, 390px mobile) only. No Safari, no
Firefox, no real device testing, no tablet-width breakpoint testing.
Tailwind's utility classes generally degrade predictably across
browsers, but "generally predictable" isn't "verified" — flagged as a
gap, not a blocker.

## 5. Link/reference integrity — checked, clean
Grepped every `href=` across all 8 HTML pages: no link points at the
removed `/foundation/` page, no link points at the retired `/bulletin/`
path (renamed to `/rurok/` 2026-08-01, see docs/RUROK-DESIGN.md — the
old path 404s on purpose, no redirect), no `canva://` or
`drive.google.com` URLs anywhere, and all internal links consistently
use trailing-slash paths. No action needed here — this is a clean bill
of health, recorded so it doesn't need re-checking from scratch next
time.

## When to revisit this file
Update it whenever: a new page/feature ships that hasn't been
live-tested yet, a "sandbox-only" item above gets a real user
confirmation (move it up to section 2's confirmed list), or before any
real physical DTC card printing run (section 3's open cases should be
closed out first).
