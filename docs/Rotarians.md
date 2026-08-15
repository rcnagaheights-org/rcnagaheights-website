# Rotarians Page — Roster & Council of Presidents
Version: v1.5 · Last updated: 2026-08-15

## Status
Live at `/rotarians/`. Still plain hardcoded HTML per person, not
data-driven (see CLAUDE.md) — this doc exists because the page has
enough structure now (President's Message, Council of Presidents,
Officers & Committee Chairs, Members) that it's worth writing down the
rules once, rather than re-deriving them by reading the HTML every time
a roster change comes in.

## Page sections, in order
1. **President's Message** — full-width feature: photo, welcome letter,
   name/credentials, "Club President, Rotary Year YYYY–YYYY" title.
2. **Council of Presidents** (this doc's main subject — added
   2026-07-21, see below).
3. **Club Officers & Committee Chairs** — grid of cards, one per
   officer/chair, each showing name + current role(s).
4. **Members** — grid of cards for members without an officer role.
   Cards here show only the name — no "Member" label, since the
   section heading already says so (redundant text removed 2026-07-21).

## Council of Presidents (COP) — the rule
**Any Rotarian carrying the designation Immediate Past President or
Past President goes in the COP section ONLY** — updated 2026-07-21,
reversing the original additive design. Their card in COP includes
their current officer/member role as a line at the bottom, and their
separate card is removed from Officers & Committee Chairs or Members
so nobody appears twice on the page. If that person's current role
ever changes (e.g. they take on a new committee chair), update the
role line on their COP card directly — there is no longer a second
card anywhere else on the page to keep in sync.

**The sitting President is NOT included in COP** — she already has her
own full "President's Message" section immediately above COP, so
repeating her there was redundant. COP is specifically the *past*
leadership record.

**Designation rules:**
- **Charter President** — the club's founding president (RY 2021-22).
  Permanent, never changes, and NOT part of the chronological sort —
  always pinned first in COP regardless of Rotary Year. Currently
  Ghiel Rosales.
- **Immediate Past President** — whoever was President in the Rotary
  Year immediately before the current one. Exactly one person, and it
  changes every year when a new president takes over — the previous
  Immediate Past President becomes a plain Past President at that
  point.
- **Past President** — anyone who was President in any earlier Rotary
  Year, other than the immediate past one and the Charter President.

**Card contents:** Name, the designation label (styled the same gold
`text-[#f7a81b]` as the small tags already used elsewhere on this
page), their presidential theme + Rotary Year on its own line (e.g.
"The Magic of Rotary (RY 2024-25)"), and — ONLY if they currently hold
an actual officer/chair title — that title as a fourth, bolded line at
the bottom (e.g. "Club Learning Facilitator"). If their current role is
just plain membership, no fourth line is added at all (updated
2026-07-21 — "Member" was removed as redundant/self-evident, matching
the same cleanup in the Members grid).

**Sort order:** Charter President always first (pinned, not part of the
chronological sort), then Immediate Past President, then Past
Presidents in descending Rotary Year order.

## Current roster (as of 2026-07-21)
| Name | Current role (shown on card?) | COP designation | Theme (RY) |
|---|---|---|---|
| Ghiel Rosales | The Rotary Foundation Chair (yes) | Charter President | Serve to Change Lives (2021-22) |
| Dannin Joy Labordo | Club Learning Facilitator (yes) | Immediate Past President | Unite For Good (2025-26) |
| Carlo Ricardo Sierra | Member (not shown) | Past President | The Magic of Rotary (2024-25) |
| Brian Kierby Felipe | Member (not shown) | Past President | Create Hope in the World (2023-24) |
| Jason Bagadiong | Member (not shown) | Past President | Imagine Rotary (2022-23) |

All other officers/members (Kathleen Felipe, Charles Oliver Dadua III,
Nelvin Charles Crescini, Jose Leo Raphaello Del Rosario, Odessa Balmes,
Raymar Bron, Kimberly Chancoco, Sherwin Francis Mendoza, Krista Carmina
Mendoza-Cabral, Melissa Ngo, Edmund John Palmes, and the 13 other plain
Members) carry no COP designation and appear only once, in Officers or
Members as before.

## Update 2026-08-15 — added a missed Member, cross-check clean
Checked the live `Membership Roster RY 2026-27.xlsx` in Drive against
the page row by row. Found one real gap: **Maria Francesca Gumabao**
(a plain Member, sheet row 19) was in the source sheet but had never
made it onto the page — missed during the original 2026-07-21 build,
not a new addition to the sheet. Added her to the Members grid, in the
same row-order position as the sheet (between Dannin Joy Labordo and
Joseph Lemuel Lomibao). Total roster is now 30, up from 29.

Every other name, officer title, COP designation, and presidential
theme/year was cross-checked against the sheet and matched exactly —
including the `President-Elect` (Kathleen Felipe) and `President-Nominee`
(Charles Oliver Dadua III) tags, which already existed correctly on
the page. One data-entry quirk in the sheet itself, not the page: row
24 has "Crescini" duplicated into both the Last Name and First Name
columns, with "Nelvin Charles" landing in the Council of Presidents
column instead — the page already has this person correctly as
"Nelvin Charles Crescini, Deputy Secretary" with no COP tag, so no fix
was needed on this end.

**Portraits folder:** the same Drive update also added a new
"Portraits" subfolder with one photo per roster member — not wired to
the page yet, since every Officer/Member/COP card is still text-only
(only the sitting President has a photo, in the separate President's
Message section). Two discrepancies found there: Gumabao's portrait
was missing (consistent with her being missed everywhere else), and
two extra photos — `JEREMIAS.PNG` and `LAVADIA.PNG` — didn't match
anyone in the roster sheet. Resolved same day: the user renamed
`LAVADIA.PNG` to `GUMABAO.PNG` (it was actually her photo), and asked
to leave `JEREMIAS.PNG` alone — still an unexplained extra file, not a
roster gap, no action needed on it.

## Maintaining this each Rotary Year
When a new Rotary Year begins and a new president takes over:
1. Add the OUTGOING President's card right after the Charter President
   (i.e. as the 2nd card) as the new Immediate Past President, with
   their theme/year and their current officer/member role. Remove
   their card from Officers/Members if they have one there (they move
   into COP exclusively, per the rule above).
2. Move the current Immediate Past President's card down to a plain
   Past President (their card stays in COP; only the label changes;
   the Charter President's card never moves).
3. Update the President's Message section above COP with the new
   president's photo, letter, name, and theme.
4. Update this table to match.
5. This is a manual HTML edit in `rotarians/index.html` (no data source
   for this page yet).
