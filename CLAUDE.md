# Rotary Club of Naga Heights — Website

Static multi-page site for a Rotary club, hosted on GitHub Pages at
rcnagaheights.org. Plain HTML/Tailwind/vanilla JS — no build step, no
framework, no package.json. Every page is a self-contained .html file.

## Structure
```
index.html            -> / (About Rotary / homepage)
rotarians/index.html  -> /rotarians/  (Officers, members, president)
projects/index.html   -> /projects/   (Service projects)
foundation/index.html -> /foundation/ (Get involved, Partner Merchants)
bulletin/index.html   -> /bulletin/   (exists but NOT linked in nav yet)
contact/index.html    -> /contact/
assets/rotary-logo.png -> real logo file (was a Drive hotlink, now local)
CNAME                 -> custom domain config, do not remove
```

Each page: own `<title>`/meta description/canonical/OG/Twitter Card/JSON-LD,
shared header+nav+footer duplicated per file (no templating), page-specific
`<script>` only where needed (hero slider on index.html only).

## Stack
Tailwind 3.4.17 (CDN), vanilla JS, Lucide icons 0.263.0 (CDN), Google Fonts
(Libre Franklin + Playfair Display). Color tokens: --blue:#17458f
--deep:#0c3c7c --gold:#f7a81b --mist:#f4f7fc

## Current status (as of 2026-07-15)
- Site migrated from Canva hosting to GitHub Pages, DNS live, HTTPS working.
- Phase 1 (public informational site) in progress. Most content sections
  still have PLACEHOLDER data (officer names, addresses, project photos) —
  check for literal text like "Officer Name", "Address Here", "XXX" in
  phone numbers before assuming content is real.
- Phase 2 (DiskwenTulong Card program + real Digital Bulletin) is NOT built
  yet. Do not re-add: DTC register/verify UI, DTC banner on homepage, or
  the "Digital Bulletin" nav link — these were deliberately removed because
  they pointed at a backend (Google Apps Script) that doesn't exist yet.
  The bulletin page itself still exists at /bulletin/, just unlinked.

## Hard rules — do not reintroduce
- No public membership application form anywhere
- No online card sales for the (future) DiskwenTulong Card
- No random/client-generated card numbers (cards are pre-printed physical
  stock, numbers come from a Sheet, never Math.random()/Date.now())
- No duplicate footer on the Contact page (it has its own expanded layout)
- Only one Four-Way Test section on the About page
- Merchant-facing card verification must never expose cardholder
  email/phone/address — name + status + dates only

## Known placeholders / open TODOs
- `assets/rotary-logo.png` is a temporary stand-in (Rotary Wheel favicon
  reused as the logo) — swap for the real Canva-exported logo when ready
- Four-Way Test graphic and the homepage OG/social banner are stock-photo
  placeholders, not final art
- Site-wide max-width is 1280px (`max-w-7xl`) everywhere, including header/
  footer — looks fine on normal screens but leaves large empty margins on
  very wide monitors. Widening it is a pending decision, not yet actioned,
  and must be done consistently across ALL sections/pages if done at all
  (header/footer alone would look inconsistent with content below them)
- "Latest project" (homepage carousel + Projects page featured slot) is
  manually curated HTML, not date-sorted. No data source exists yet for
  real automatic sorting.

## Verifying changes
No build step and no test suite. Before considering an HTML edit done:
- Extract and run each page's inline `<script>` through `node --check`
  to catch JS syntax errors (there is no bundler to catch these otherwise)
- Grep for `canva://` and `drive.google.com` — neither should ever appear;
  both are dead references from the old Canva-hosted version
- Confirm internal links use trailing-slash paths (`/rotarians/`, not
  `/rotarians`) to match the folder+index.html structure GitHub Pages uses

## Fuller background
More detailed history (why GitHub Pages was chosen over Canva, the planned
Apps Script backend for Phase 2, full phase roadmap) lives in a Google
Drive doc the user maintains outside this repo. Ask the user directly if
you need that context — it isn't available to you automatically.
