# QA Status & Known Risks
Version: v2.1 · Last updated: 2026-09-10

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
This dev environment's Chromium/Playwright specifically cannot reach
ANY external host at all — confirmed by testing plain navigation to
unrelated sites too, not just `script.google.com`/`accounts.google.com`/
`cdn.jsdelivr.net`/`images.pexels.com`. Anything tested "in-session"
via a rendered page therefore used a local Tailwind CSS build +
Playwright screenshots against same-origin substitute assets — never
the real deployed site, never the real Google Sign-In/Apps Script flow
through a browser. **This restriction does NOT apply to CLI/`curl`
traffic** — that goes through this environment's own audited proxy and
reaches real external hosts fine, `script.google.com` included (used
repeatedly, e.g. directly querying the live `getPartners`/
`rurokIssues` endpoints and the real Heyzine API). Don't conflate the
two: a `curl` against a live endpoint is a real live check; a Chromium
render of the same data is not.

**Confirmed via the user's own live screenshots (trust these):**
- Homepage hero as a 3-photo carousel (2026-07-19).
- DTC end-to-end round trip, no-auth state: registered `DTC-TEST-00001`,
  verified `ACTIVE` with correct dates (2026-07-19).
- DTC member-auth end-to-end: registered `DTC-TEST-00002` and
  `DTC-TEST-00003` while signed in as `admin@rcnagaheights.org`,
  `registered_by` recorded correctly both times (2026-07-20).
- The DTC category-taxonomy resilience fix (`renderCategoryGrid()`
  treating `CATEGORY_ORDER` as sort order, not a filter — see
  docs/DTC-DESIGN.md §5) working as designed on a real live break: when
  the live taxonomy changed a third time (2026-08-17), the user's own
  screenshot of the live `/diskwentulong/` page showed the affected
  tiles still rendering with a generic fallback icon instead of
  disappearing — direct proof the fix behaves correctly under a real
  live taxonomy change, not just against a simulated one in this
  sandbox.
- **The Rurok automation (`Code.gs v11`'s `syncRurokIssues()`), working
  end to end on a real unattended upload — confirmed 2026-09-10.**
  Checked directly by `curl`-ing the live `?action=rurokIssues` endpoint
  (not a screenshot this time, but an equally real live check — see the
  CLI-vs-Chromium note above): a 3rd real issue, uploaded to Heyzine on
  2026-09-09, had already been picked up and made `current`, with
  Volume 2 correctly demoted to `past` — with zero manual step on this
  repo's side between the upload and the site updating. First real
  confirmation of the whole live-upload → Sheet → site pipeline, not
  just the sandbox/logic review it shipped with. **Not yet confirmed by
  this same check: the 5-flipbook cap / auto-archive-to-Drive /
  auto-delete-from-Heyzine path** — with only 3 real issues existing,
  that logic still hasn't had a real chance to fire. Also newly found
  by this same check: the manual `needs_review` label fix flagged for
  Volume 2 back on 2026-08-24 was never actually done, and Volume 3 has
  the identical gap — both still show auto-generated placeholder labels
  live as of 2026-09-10. See docs/RUROK-DESIGN.md's "Current data
  state" for detail.

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
- **Everything shipped 2026-08-14 through 2026-08-20** — verified only
  via local Playwright + a local Tailwind/Lucide build served against a
  copy of the changed page, never the real deployed site, except where
  a distinct verification method is called out below:
  - Rotarians page: full 30-person roster, the Council of Presidents
    section, the later-found Maria Francesca Gumabao addition, and
    circular portrait photos on all three grids (Council/Officers/
    Members). No live user screenshot confirming the deployed
    `/rotarians/` page matches.
  - Service Projects: 12 more real projects plus GOVERNOR'S VISIT (all
    14 of 14 Tracker rows now built) — each photo's *download* was
    confirmed byte-for-byte against Drive, but whether the deployed
    `/projects/` page actually renders all 14 correctly has not been
    confirmed via a live screenshot.
  - Rurok: Volume 2 added as Featured, Volume 1 retired to a Past
    Issues card, an in-page modal for Past Issues (replacing a
    redirect to heyzine.com), card centering, and the preconnect/
    hover-preload/spinner loading optimization. The real Heyzine embed
    itself was never actually loaded in any sandboxed session —
    Playwright in this environment cannot reach any external host at
    all (confirmed by testing plain navigation to heyzine.com itself,
    not just CDN hosts), so all of this was verified against a local
    stand-in page, not the real widget.
  - `/verify/`'s Mercury Drug RiteMed promo image (2026-08-20) — verified
    only by calling `showResult()` directly with mocked data (Mercury
    Drug+ACTIVE, Mercury Drug+EXPIRED, other-merchant+ACTIVE) in a local
    Playwright render. The conditional has never fired against a real
    live Apps Script `action=verify` response with `merchant=Mercury
    Drug`.
  - Two name-correction fixes (reversed "Cortina Mateo" → "Mateo
    Cortina" on the Rotarians page; "Mi Panda Naga" → "MiPanda Naga" in
    partners.json) — trivial text-only edits, not independently
    screenshot-verified, low regression risk given the change size.
- **A distinct, better-verified tier: the underlying partner *data* for
  the LabCom, Mercury Drug, and Flavours by RooRoo Café syncs (2026-08-17
  and 2026-08-20)** — each was found and cross-checked by `curl`-ing the
  real live `getPartners` endpoint directly (this environment's CLI
  network access is not sandboxed the way its Chromium is, see the
  Rurok note above), so the *existence and field values* of these
  partners in the live Sheet is genuinely live-confirmed, not a sandbox
  guess. What's still sandbox-only is whether their tiles actually
  *render* correctly (right logo, right category icon) on the real
  deployed `/diskwentulong/` page — nobody has sent a live screenshot
  confirming that since these three syncs landed.

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
test setup). Not fixed as part of that pass since it's outside
`/verify/`'s scope; see docs/DTC-DESIGN.md's Open items. **Confirmed
via the user's own live screenshot 2026-08-04**, and **root cause
confirmed the same day by reading the live "DTC Card Database" Sheet
directly**: the Merchants tab's row M-0028 already stores the literal
mojibake string `White Bean CafÃ©` in its `business_name` cell — this
is a **pure Sheet data bug, not a Code.gs bug**; the corrected
description above (Code.gs/Sheet data issue) undersold it — the code
is fine, only the stored cell is wrong. This also settles a question
raised during that day's partner sync (the source "DTC Partners.xlsx"
sheet spells it "White Bean Cafe," no accent, while this repo's
partners.json has "White Bean Café," accented): the stored cell is a
mangled accented name, not an unaccented one — so the repo's accented
spelling is correct and was left unchanged at the time. **Resolved**:
the 2026-08-20 `assets/merchants/live-snapshot.json` fetch shows the
cell now reads "White Bean Cafe" — someone retyped it directly in the
Sheet between 2026-08-04 and 2026-08-20, clearing the mojibake, but
unaccented rather than restoring the accented spelling this doc argued
for. The corruption is gone either way; the accent is now a cosmetic
mismatch against this repo's `partners.json`, not a bug. See
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
