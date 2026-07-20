# Service Projects Page — Data-Driven Rework
Version: v1.3 · Last updated: 2026-07-20

## Status
Design CONFIRMED and BUILT (2026-07-20). Live at `/projects/`, rendering
from `assets/service-projects/service-projects.json`. Now running one
REAL project (BINHI NG KINABUKASAN) — see §6 for the other 5 real rows
still blocked on missing `category`/`date` in the Tracker sheet.

## 0. Why this rework
The old page (see docs/PROJECTS-PAGE.md for its now-superseded
succession/lightbox/share design) was hand-coded HTML with one manually
curated "latest project" slot and a 4-tile archive grid — flagged in
CLAUDE.md's Known Placeholders as not scaling past ~15-20 projects and
having no real data source. This rework replaces that with a real
content pipeline modeled on Rotary's own classification system, built
the same way `/diskwentulong/`'s `getPartners` pipeline works: a
generated JSON data file in the repo (like
`assets/merchants/partners.json`), with the page rendering from that
data instead of hand-coded HTML per project.

## 1. Drive structure (source of truth)
```
Service Projects/                          (Drive folder)
├── Service Projects Tracker                (Google Sheet, sheet root —
│                                             covers BOTH subfolders,
│                                             not one sheet per folder)
├── Areas of Focus/                         (subfolder — photo uploads)
└── Avenues of Service/                     (subfolder — photo uploads)
```

**Tracker sheet columns:**
| Column | Purpose |
|---|---|
| `project_name` | Project title |
| `category` | The specific Area of Focus or Avenue of Service value for this project (e.g. "Community Service," "Disease Prevention") |
| `description` | 1-2 sentence summary |
| `date` | Authoritative date for Featured/Latest sorting (see §3) — NOT Drive `createdTime` |
| `image_filename` | Must match an actual uploaded file's filename exactly, in whichever of the two subfolders the project's `category` belongs to. No fuzzy-matching — a non-matching filename is flagged, not guessed. |

Rotary's official categories, for reference:
- **Areas of Focus** (global cause areas): e.g. Disease Prevention and
  Treatment, Water/Sanitation/Hygiene, Maternal and Child Health,
  Basic Education and Literacy, Community Economic Development, Peace
  and Conflict Prevention, Environment.
- **Avenues of Service** (Rotary's 5 official avenues): Club Service,
  Vocational Service, Community Service, International Service, Youth
  Service.

A row's `category` value determines which of the two Drive subfolders
(and which of the two page carousels, see §2) it belongs to.

## 2. Page sections (in order)
1. **Featured/Latest** — one prominent project, data-driven (see §3),
   not manually curated.
2. **Areas of Focus** — carousel of thumbnails for every project in
   that category group, EXCEPT whichever one is currently Featured
   (see §4 for why).
3. **Avenues of Service** — same, for that category group.

Each carousel thumbnail is clickable, opening a lightbox with that
project's full photo (reusing the lightbox pattern already built for
the previous version of this page — see docs/PROJECTS-PAGE.md §3).

## 3. Featured/Latest logic
The Featured project is whichever Tracker row has the newest `date`
value, compared across BOTH category groups combined — a plain sort by
the sheet's own `date` column, not Drive file `createdTime` (deliberate
— the Tracker sheet's `date` field is the authoritative date for this
content type, since a photo's upload time and the event's actual date
can differ).

## 4. Retirement / no-duplication rule
Every non-Featured row "retires" into whichever carousel matches its
`category`'s subfolder — never hidden, just moved out of the Featured
slot. If the Featured project's own category would otherwise place it
in one of the two carousels too, it's excluded from that carousel's
list (it's already shown above, in the Featured slot).

**Flagging this assumption per the build instructions:** this means a
category group can show as few as its total row count minus one (if
the Featured project happens to belong to that group) — i.e. a
category with only 1 project ever, once it becomes Featured, would
render that carousel empty until a 2nd project in that category
exists. An alternative would be to always show the Featured project in
its own carousel too (accept the duplication) — not implemented,
flagged here in case that's preferred instead.

## 5. Generated data file
Following the `assets/merchants/partners.json` pattern: a JSON file
generated from the Tracker sheet + the two Drive subfolders, checked
into the repo, with the page fetching/rendering from it client-side —
no live Sheet/Drive API calls from the browser (unlike DTC's live
`getPartners`, since there's no backend deployment for this feature and
none is needed — this is public read-only content, refreshed by
regenerating the file whenever the Tracker sheet changes, the same way
partners.json is currently regenerated by hand when merchant data
changes).

Shape (per row):
```json
{
  "project_name": "...",
  "category": "...",
  "category_group": "areas_of_focus" | "avenues_of_service",
  "description": "...",
  "date": "YYYY-MM-DD",
  "image": "/assets/service-projects/<group>/<filename>"
}
```

## 6. Current data state as of 2026-07-20 — one real project live, 5 more blocked on missing category/date
The Tracker sheet initially had zero real rows. The user then added 6
real project rows (real names + real descriptions), but only ONE of
the 6 had both `category` and `date` filled in — the other 5 are
missing one or both fields. Per the "flag rather than guess" build
instruction, only the one fully-specified row was built into the live
site; the other 5 were deliberately NOT built (see the punch list
below).

**Live now:**
- **BINHI NG KINABUKASAN** — the only Tracker row with both `category`
  (`Area of Focus - Basic Education and Literacy`) and `date`
  (`2026-06-01`) filled in. It already had a real photo in the repo
  from before this rework existed
  (`assets/service-projects/binhi-ng-kinabukasan.png`, 3.7MB) — resized
  to 1600px wide and re-compressed as JPEG (274KB) per the §2 sizing
  guidance, moved to
  `assets/service-projects/areas-of-focus/binhi-ng-kinabukasan.jpg`,
  and mirrored to the same-named file in Drive's "Areas of Focus"
  subfolder. `assets/service-projects/service-projects.json` now
  contains this one real entry (`category_group: "areas_of_focus"`,
  parsed from the sheet's `"Area of Focus - X"` / `"Avenue of Service -
  Y"` string format — split on `" - "`, first part maps to the group,
  second part is the display category).
- Because it's the only row, it's automatically Featured (newest/only
  date) and, per the no-duplication rule in §4, excluded from its own
  carousel — both "Areas of Focus" and "Avenues of Service" correctly
  show their empty state right now, not a bug.
- Verified with temporary test-only entries (never committed) that
  carousels, prev/next scrolling, and the lightbox all work correctly
  once more than one row exists per category. **Caveat:** this is
  sandbox-only verification (Playwright + a local Tailwind build,
  network-blocked from the real deployed site) — unlike the BINHI
  Featured display, no real multi-project carousel has been confirmed
  live via a user screenshot yet, since only one real row exists so
  far. Re-verify live once a 2nd real project with a real photo lands.

**Not yet built — blocked on missing sheet fields, not photos:**
| Project | Missing |
|---|---|
| SUMMER CLUB TURNOVER AND STRATEGIC PLANNING | `date` (has category: Avenue of Service - Club Service) |
| TALK ON ETHICAL LEADERSHIP FOR LAW STUDENTS | `category` and `date` |
| UNLOCKING MENTAL WELL-BEING | `category` (its own description text states the date: May 31, 2026 — usable directly, not a guess, once category is filled in) |
| DISKWENTULONG CARD | `category` and `date` |
| CHARTERING OF THE NCF INTERACT CLUB | `category` and `date` (description explicitly calls it a "flagship Youth Service project," a strong hint for category but not filled into the sheet itself) |

None of these 5 have a photo yet either, matching the general
Drive-subfolder-empty state — but that's a secondary blocker behind the
missing category/date, which affect sort order and carousel placement
directly and were not guessed.

**Also outstanding:** the earlier placeholder entry (and its image,
both in the repo and in Drive's "Avenues of Service" subfolder, file id
`1rYEvhLBVzwoP92WX5aw0xpRZE3FlecUf`) has been removed from the repo now
that real content exists, but the Drive copy can't be deleted by any
tool available in this environment (create/read/copy/search only, no
delete) — remove it from Drive by hand when convenient, it's harmless
to leave for now since nothing references it anymore.
