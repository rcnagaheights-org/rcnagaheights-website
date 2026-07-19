# Content Management — Google Drive Sync
Version: v1.1 · Last updated: 2026-07-19

## Availability
A Google Drive connector IS available to you. Use it to read/pull
content when asked. You have NO background/passive awareness of Drive —
you don't get notified when the user adds a file, and nothing happens
automatically between sessions. You only act when the user starts a
session and asks you to check.

The user's real-world habit: they drop new photos/files into Drive,
then separately come to you and say something like "run the content
sync" or "scan drive." When asked to do this, follow the procedure below.

## Content sync from Drive — procedure
1. Go to the Rotary Website project folder in Drive. It has one
   subfolder per site section: President, Officers and Members, Service
   Projects, Partner Merchants, Digital Bulletin, Branding (Logo, Banner,
   Favicon), Contact Info.
2. Read "PHOTO FRESHNESS CONVENTION.txt" and the latest-numbered
   "TODO - Website Content Checklist" file in the folder root first.
3. Freshness rule: no filename convention exists or is needed — sort
   files within each section folder by Drive's `createdTime` (NOT
   `modifiedTime`, which often reflects the original photo's pre-upload
   date, e.g. when it was taken on a phone, not when it landed in Drive).
4. Slot counts — how many stay "active" per section (see table below).
   For sections with a limit, take the newest N by createdTime as the
   active set. Officer/Member headshots and Merchant logos are 1:1 per
   person/business, not rotating slots — no slot limit applies to those.
5. Cross-check what's actually in each folder against what the TODO
   checklist says is still outstanding.
6. Images dropped into Drive are generally ALREADY at the correct spec
   resolution (per the Media Specifications Guide in Drive) — do not
   resize/compress unless a specific file is clearly not.
7. Download and add needed assets into this repo's assets/ folder,
   organized by section (e.g. assets/merchants/, assets/projects/,
   assets/president/).
8. Do NOT wire new assets into live HTML in the same pass unless
   explicitly asked to — first pass is pull + organize + match content
   to its real-world meaning (e.g. which logo belongs to which merchant).
9. Always show a full summary of what was found/pulled/matched, and
   flag anything ambiguous or unmatched, BEFORE committing anything.
   Wait for the user's approval before commit/push.

## Slot counts per section
| Section | Live site slot count |
|---|---|
| Banner (hero) | 3 (rotating hero backgrounds) |
| About Rotary | 1 |
| Four-Way Test | 1 |
| Recent Projects | 3 (homepage carousel) |
| Projects Archive | 4 (Service Projects grid) |
| President | 1 |
| Officer/Member headshots | 1:1 per person, no shared limit |
| Merchant logos | 1:1 per business, no shared limit |

## Retirement logic (for slot-limited sections)
When a new upload would push a section past its slot count:
1. Sort that section's files by createdTime, newest first
2. Move (never delete) the oldest file(s) beyond the limit into a
   "_Retired" subfolder within that section's Drive folder
3. This is a Drive-organization step, not a repo step — it keeps Drive
   itself tidy and unambiguous about what's current, separate from
   what's actually been pulled into the repo so far

## Known real content already in Drive (as of 2026-07-19)
- Partner Merchants: "DTC Partners.xlsx" (28 partners) + logo files for
  all 28, including Mendoza Law Office (was missing a logo — resolved
  2026-07-19, see Open items). Jamer Law's logo was replaced 2026-07-19
  with a newer upload. Pulled into repo assets/merchants/ (logos +
  partners.json), and wired live on /diskwentulong/.
- President: real photo (assets/president/president.png) plus a full
  "Presidential Message.txt" (name, credentials, and welcome message —
  pulled into assets/president/presidential-message.txt) — both now live
  directly in the President folder, and live on /rotarians/.
- Officers and Members: "Membership Roster RY 2026-27.xlsx" — 29 real
  people with distinct positions, pulled 2026-07-19 and wired live on
  /rotarians/ (13 officers/chairs + 15 members, President handled
  separately). Still plain hardcoded HTML per person, not data-driven —
  future roster changes mean re-editing rotarians/index.html by hand.
- Branding subfolder "RCNH Website.Hero Carousel" contains the 3 real
  photos for the homepage's rotating hero background — refreshed
  2026-07-19 with a new set (replacing the 2026-07-17 set), pulled into
  assets/hero-carousel/ and live on the homepage. A newer Drive
  requirement doc (2026-07-19) asks for mobile-crop exports of each
  photo via a `<picture>` element — not built, no mobile crops uploaded
  yet, tracked as an open item below.
- Branding subfolder "RCNH Website.Recent Projects" contains 3 real
  photos for the homepage "Recent Projects" carousel — pulled into
  assets/recent-projects/ as-is; no per-photo captions/titles exist or
  are needed.
- "About Rotary" homepage photo — pulled into assets/about-rotary/.
- Service Projects: "Service Projects.xlsx" lists 6 real projects, but
  only one photo exists in the folder (a generic "Banner.png", matched
  by its visible school signage to "BINHI ng Kinabukasan"). That one
  project + photo is now live on /projects/'s "Most Recent Service
  Project" slot; the other 5 projects have no photos yet and the archive
  grid below is still placeholder.
- Contact Info folder was still empty as of last full scan — check
  again, this changes over time.

## Open items
- [ ] Hero carousel mobile crops — a Drive requirement doc (added
  2026-07-19) asks for a second, portrait-ish export of each of the 3
  hero photos for a `<picture>`-element mobile layout (baked-in text
  would get cropped badly on narrow screens using the desktop crop
  as-is). No mobile crop files exist in Drive yet, and the two Drive
  docs describing this disagree on the exact target aspect ratio (4:5
  vs 1:1 square) — confirm with the user which is current before
  building anything.
- [ ] 5 of the 6 real service projects in Service Projects.xlsx still
  have no matching photo — archive grid on /projects/ is still
  placeholder pending more uploads.
- [ ] Rotarians roster (29 people) is hardcoded HTML, not data-driven —
  same scaling concern flagged in CLAUDE.md for Service Projects.
