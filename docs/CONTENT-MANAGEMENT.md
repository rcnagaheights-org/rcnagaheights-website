# Content Management — Google Drive Sync
Version: v1 · Last updated: 2026-07-18

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

## Known real content already in Drive (as of 2026-07-18)
- Partner Merchants: "DTC Partners.xlsx" (26 partners: name, discount/
  commitment, Facebook link) + ~24 individual logo files
- President: a real photo + name found in the "Welcome Banner" Branding
  subfolder (not the President folder) — confirmed correct placement by
  the user, don't assume folder name always matches expectation
- Branding subfolders "RCNH Website.Recent Projects" and
  "RCNH Website.Welcome Banner" contain real event/project photos
- Officers and Members, Service Projects, Contact Info folders were
  still empty as of last full scan — check again, this changes over time
