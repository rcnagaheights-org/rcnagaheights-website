# Service Projects Page — Data-Driven Rework
Version: v2.2 · Last updated: 2026-08-15

## Status
Design CONFIRMED and BUILT (2026-07-20). Live at `/projects/`, rendering
from `assets/service-projects/service-projects.json`. As of 2026-08-15,
all 14 real projects from the xlsx are live (see §6) — up from 1.

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
**Updated 2026-08-14**: the original "Service Projects Tracker" Google
Sheet + "Areas of Focus"/"Avenues of Service" photo subfolders were
replaced by the user with a simpler structure — still the same folder,
different contents:
```
Service Projects/                          (Drive folder)
├── Service Projects.xlsx                   (replaces the Tracker Sheet)
└── Images/                                 (replaces the two photo
                                              subfolders — one flat
                                              folder for every project's
                                              photo, regardless of
                                              category)
```
("Areas of Focus Logos" also exists in this folder — 7 generic official
Rotary Area-of-Focus icon graphics, not project photos, unused by this
page.)

**Service Projects.xlsx columns:** `Service Projects` (project_name),
`Start Date:`, `End Date:`, `Avenue of Service:` (category — see format
note below), `Image_Filename:`, `Description`.

- `date` in the generated JSON uses `Start Date:` uniformly (even for
  multi-day/ongoing entries like DISKWENTULONG CARD, RCNH WEBSITE, and
  RUROK MAGAZINE, whose `End Date:` is the literal string "Present") —
  a deliberate simplification, not a guess, so Featured sorting has one
  consistent field to compare.
- `Avenue of Service:` mixes two formats: a plain avenue name for
  non-cause-specific projects (e.g. `Club Service`, `Youth Service`),
  or `Community Service: <Area of Focus name>` for cause-specific ones
  (e.g. `Community Service: Basic Education and Literacy`). Parsed as:
  a value containing `: ` → `category_group: "areas_of_focus"`,
  `category` = the part after the colon; otherwise →
  `category_group: "avenues_of_service"`, `category` = the value as-is.
- `image_filename` still must match an actual uploaded file in the
  (now singular) `Images/` folder exactly. No fuzzy-matching — a
  non-matching filename is flagged, not guessed.

Rotary's official categories, for reference:
- **Areas of Focus** (global cause areas): e.g. Disease Prevention and
  Treatment, Water/Sanitation/Hygiene, Maternal and Child Health,
  Basic Education and Literacy, Community Economic Development, Peace
  and Conflict Prevention, Environment.
- **Avenues of Service** (Rotary's 5 official avenues): Club Service,
  Vocational Service, Community Service, International Service, Youth
  Service.

A row's parsed `category_group` determines which of the two page
carousels (see §2) it belongs to — the two-subfolder split by category
no longer exists on the Drive side, only in the generated JSON/page.

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

## 6. Current data state as of 2026-08-15 — all 14 real projects live
As of 2026-07-20, the Tracker sheet had 6 real rows, only 1 fully
specified (BINHI, live since then). The Tracker Sheet was then replaced
by "Service Projects.xlsx" (see §1), which added `Start Date:`/`End
Date:` columns to every row and grew the row count to 14, and a new
"Images" Drive folder was populated with a photo for each row. 12 rows
were built first (BINHI already live + 11 new); BRIGADA ESKWELA
followed once its photo appeared in Drive later the same day; GOVERNOR'S
VISIT — the last holdout — was resolved 2026-08-15 (see below). All 14
of 14 rows are now live.

**Live now (14 total):** BINHI NG KINABUKASAN, SUMMER CLUB TURNOVER AND
STRATEGIC PLANNING, TALK ON ETHICAL LEADERSHIP FOR LAW STUDENTS,
UNLOCKING MENTAL WELL-BEING, DISKWENTULONG CARD, CHARTERING OF THE NCF
INTERACT CLUB, LEAD, LIWANAG SA DILIM: Sustainable Alternative
Lighting, GOVERNOR'S VISIT, 27TH UP HARONG ACADEMIC FESTIVAL, RCNH
WEBSITE, RUROK: THE RCNH MAGAZINE, 4 IN 1 DISTRICT LEARNING SEMINAR,
BRIGADA ESKWELA @ MAHABANG DAHILIG SHS. Photos downloaded from Drive's
"Images" folder, resized to ≤1600px wide and re-compressed as JPEG
(matching the BINHI precedent), placed under
`assets/service-projects/areas-of-focus/` or `.../avenues-of-service/`
per each row's parsed `category_group`. Featured project (newest
`Start Date:`, 2026-08-04) is 27TH UP HARONG ACADEMIC FESTIVAL — GOVERNOR'S
VISIT's `2026-08-01` date doesn't overtake it. Verified locally
(Playwright screenshot of a local static server): all render,
Featured/carousel/lightbox logic all correct — not yet confirmed
against the live deployed site by the user.

**BRIGADA ESKWELA note:** its Drive photo appeared as `BEMD.jpg`, not
the `BEMD.png` the sheet's `Image_Filename:` column literally
specifies — an extension mismatch, not a guess across multiple
candidates (it's the only file with that base name, uploaded the same
day the row's other gap — the missing photo itself — was raised). Used
it; the sheet's `Image_Filename:` value should ideally be corrected to
`BEMD.jpg` to match, though nothing depends on that being fixed.

**GOVERNOR'S VISIT — resolved 2026-08-15:** `GV.png` (also mislabeled —
actually a JPEG, same quirk as BEMD) had failed 6 straight
`download_file_content` attempts across two sessions with a
session-expired error, previously logged here as a ~5MB size ceiling
on that download path. Two things had changed by this attempt: the
Drive file itself was now only 1.4MB (down from the originally-reported
7.4MB — apparently re-exported/re-compressed at some point, though not
by anything this repo tracked), and this session discovered that
`download_file_content` isn't the only route to a Drive file — both
files share "Anyone with the link" permission, so a direct
`curl https://drive.google.com/uc?export=download&id=<fileId>` pulled
the exact byte-for-byte file straight to disk, bypassing the MCP tool
entirely. That path was actually used to unblock two other stuck
downloads this same session (partner logos for Bistro Roberto and VCH
Health Resort Club — see docs/DTC-DESIGN.md) before being applied here.
Resized locally to 1600×1067 JPEG and added to
`service-projects.json`/`assets/service-projects/avenues-of-service/`.

**Resolved 2026-08-14:** the earlier placeholder entry's leftover image
in Drive's old "Avenues of Service" subfolder (file id
`1rYEvhLBVzwoP92WX5aw0xpRZE3FlecUf`) has been trashed, now that this
environment has Drive delete access — no longer an outstanding item.
