# SEO — Status & Checklist
Version: v1 · Last updated: 2026-07-24

Pulled out of CLAUDE.md's "Verifying changes" section per this repo's own
convention (small checklist items stay in CLAUDE.md; anything needing more
than a few lines gets its own file). CLAUDE.md links here.

## Checklist — run this on any commit that changes visible copy
- **Title/description consistency**: `<title>`, meta `description`,
  `og:description`, and `twitter:description` should all describe the page
  the same way. If one changes, check the other three.
- **Length**: title ≤60 chars, description ≤160 chars (both truncate in
  search results past that).
- **`sitemap.xml`**: bump that URL's `<lastmod>` to today if the page's
  content actually changed.
- **Canonical**: still points at the page's own real URL, trailing slash,
  `https://rcnagaheights.org/...`.
- **JSON-LD**: still valid JSON (a broken block silently loses all
  structured-data benefit, no error shown anywhere).
- **New images**: have `alt` text.
- **One `<h1>` per page.**
- **Internal links**: trailing-slash paths (`/rotarians/`, not
  `/rotarians`), matching the folder+index.html structure GitHub Pages uses.
- **`noindex` pages** (`/verify/`, `/register/`, `/bulletin/` — see below)
  stay out of `sitemap.xml` and keep their `<meta name="robots"
  content="noindex">` tag.

## Per-page state (last full audit: 2026-07-24)
| Page | Title (chars) | Description (chars) | Indexed? |
|---|---|---|---|
| `/` | 48 | 141 | yes |
| `/rotarians/` | 43 | 117 | yes |
| `/projects/` | 46 | 125 | yes |
| `/diskwentulong/` | 48 | 147 | yes |
| `/contact/` | 40 | 90 | yes |
| `/verify/` | 57 | 107 | no (`noindex`) |
| `/register/` | 59 | 81 | no (`noindex`) |
| `/bulletin/` | 46 | 103 | no (`noindex`) |

All 8 pages: unique title/description, single `<h1>`, `lang="en"`, viewport
tag present, no missing `alt` attributes. All 6 indexable pages carry valid
`NGO`-type JSON-LD. `og:image` is declared with `og:image:width`/
`og:image:height` (1200×630) on every page that has one.

`robots.txt` + `sitemap.xml` are consistent with each other and with each
page's own `noindex` tag — the 3 `noindex` pages are correctly absent from
`sitemap.xml`.

Live redirect behavior (checked 2026-07-24, real network access): all pages
return 200; `www` → apex, `http` → `https`, and no-trailing-slash → trailing
slash all resolve in a single hop.

## Known intentional exception
`/bulletin/`'s meta description/OG/Twitter tags still promise "our archive
of past issues," which doesn't exist yet (the page is placeholder content —
see CLAUDE.md's "Known placeholders"). This is why it's `noindex`ed and
excluded from `sitemap.xml` rather than treated as a copy bug to fix here —
fix the copy once real bulletin content replaces the placeholder, not
before.

## Audit history
- **2026-07-24 (first full audit)** — found two real issues, both fixed in
  PR #72: `sitemap.xml`'s `<lastmod>` was stale for 4 of 5 URLs (didn't
  reflect each page's actual last content change), and the Contact page's
  description/OG/Twitter tags promised a phone number that had been removed
  from the site since 2026-07-21 (none on file). Everything else in the
  checklist above passed clean on this first pass.
