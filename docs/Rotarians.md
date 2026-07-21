# Rotarians Page — Roster & Council of Presidents
Version: v1.1 · Last updated: 2026-07-21

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

## Council of Presidents (COP) — the rule
**Any Rotarian carrying the designation Immediate Past President or
Past President goes in the COP section**, in addition to wherever they
already appear (Officers or Members) for their *current* role. COP is
a non-destructive, additive section — nobody is removed from Officers/
Members when they're added to COP. This matters because several past
presidents also currently hold an officer role (e.g. a past president
who is now the Club Learning Facilitator) — removing them from Officers
would lose that information.

**The sitting President is NOT included in COP** (updated 2026-07-21,
per explicit user request) — she already has her own full "President's
Message" section immediately above COP, so repeating her there was
redundant. COP is specifically the *past* leadership record.

**Designation rules:**
- **Immediate Past President** — whoever was President in the Rotary
  Year immediately before the current one. Exactly one person, and it
  changes every year when a new president takes over — the previous
  Immediate Past President becomes a plain Past President at that
  point.
- **Past President** — anyone who was President in any earlier Rotary
  Year, other than the immediate past one.

**Card contents:** Name, the designation label (styled the same gold
`text-[#f7a81b]` as the small tags already used elsewhere on this
page), and their presidential theme + Rotary Year on its own line
(e.g. "The Magic of Rotary (RY 2024-25)") — matching the "Past
President, {theme} (RY {year})" tag format already used on Officer/
Member cards elsewhere on the page, just broken into two lines here for
a cleaner card layout.

**Sort order:** newest first — Immediate Past President, then Past
Presidents in descending Rotary Year order.

## Current roster (as of 2026-07-21)
| Name | Current role | COP designation | Theme (RY) |
|---|---|---|---|
| Dannin Joy Labordo | Club Learning Facilitator | Immediate Past President | Unite For Good (2025-26) |
| Carlo Ricardo Sierra | Member | Past President | The Magic of Rotary (2024-25) |
| Brian Kierby Felipe | Member | Past President | Create Hope in the World (2023-24) |
| Jason Bagadiong | Member | Past President | Imagine Rotary (2022-23) |
| Ghiel Rosales | The Rotary Foundation Chair | Past President | Serve to Change Lives (2021-22) |

All other officers/members (Kathleen Felipe, Charles Oliver Dadua III,
Nelvin Charles Crescini, Jose Leo Raphaello Del Rosario, Odessa Balmes,
Raymar Bron, Kimberly Chancoco, Sherwin Francis Mendoza, Krista Carmina
Mendoza-Cabral, Melissa Ngo, Edmund John Palmes, and the 13 other plain
Members) carry no COP designation and are not in this section.

## Maintaining this each Rotary Year
When a new Rotary Year begins and a new president takes over:
1. Add the OUTGOING President's card at the top of COP as the new
   Immediate Past President, with their theme/year (this is a new
   card — she was never in COP while sitting, per the rule above).
2. Move the current Immediate Past President's card to a plain Past
   President.
3. Update the President's Message section above COP with the new
   president's photo, letter, name, and theme.
4. Update this table to match.
5. This is a manual HTML edit in `rotarians/index.html` (no data source
   for this page yet) — update the COP section, and separately update
   that person's own Officer/Member card's small designation tag if
   they have one (e.g. changing "Past President, X (RY ...)" text
   under their name in the Officers/Members grid), since the two are
   not linked.
