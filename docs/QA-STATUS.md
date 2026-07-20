# QA Status & Known Risks
Version: v1 · Last updated: 2026-07-20

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

## 3. DTC — open edge cases, explicitly not yet tested
Per docs/DTC-DESIGN.md's own open items, the live round trip works, but
these specific cases have NOT been exercised:
- An already-registered card being re-submitted (does it correctly
  reject, or misbehave?).
- An invalid/non-existent card number.
- Multiple batches at once (only the `TEST` batch tab has ever been
  used; `2026` has never had a real registration).
- Concurrent registration attempts (the `LockService` lock exists in
  `Code.gs`, but its actual behavior under real concurrent requests has
  never been observed).
- A non-`@rcnagaheights.org` account attempting to sign in/register —
  only the success path has been tested; the "Internal" OAuth
  restriction is configured but its rejection behavior is unverified.
- The `/verify/` dropdown's merchant selection is sent by the frontend
  but silently dropped by the backend (no column stores it) — a known,
  accepted no-op, not a bug, but worth remembering it's not actually
  tracking anything yet.

## 4. Cross-browser / cross-device coverage gap
All testing this session used Chromium via Playwright at two fixed
viewport widths (1440px desktop, 390px mobile) only. No Safari, no
Firefox, no real device testing, no tablet-width breakpoint testing.
Tailwind's utility classes generally degrade predictably across
browsers, but "generally predictable" isn't "verified" — flagged as a
gap, not a blocker.

## 5. Link/reference integrity — checked, clean
Grepped every `href=` across all 8 HTML pages: no link points at the
removed `/foundation/` page, no `canva://` or `drive.google.com` URLs
anywhere, all internal links consistently use trailing-slash paths, and
`/bulletin/` is correctly absent from every page's nav (matches its
documented "not linked yet" status). No action needed here — this is a
clean bill of health, recorded so it doesn't need re-checking from
scratch next time.

## When to revisit this file
Update it whenever: a new page/feature ships that hasn't been
live-tested yet, a "sandbox-only" item above gets a real user
confirmation (move it up to section 2's confirmed list), or before any
real physical DTC card printing run (section 3's open cases should be
closed out first).
