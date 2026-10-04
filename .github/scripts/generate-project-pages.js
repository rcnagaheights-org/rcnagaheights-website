#!/usr/bin/env node
/**
 * Per-project static page generator.
 *
 * Reads the committed, human-curated assets/service-projects/service-projects.json
 * (NOT the live ?action=projects endpoint -- that endpoint only returns a raw
 * Drive image_filename, which backend/Code.gs's own getServiceProjects_ doc
 * comment notes does NOT reliably match the actual resized/renamed photo
 * committed under assets/service-projects/<group>/; mapping a project to its
 * real photo has always been a manual, human step. Generating from the
 * committed JSON -- the same file projects/index.html itself falls back to --
 * means every generated page uses a photo a human has already verified).
 *
 * For each project, generates projects/<slug>/index.html: its own
 * title/canonical/OG image (that project's real photo)/JSON-LD, full
 * description text, and a Share button that (unlike the index page's
 * generic page-level OG card) now correctly shows THIS project's own photo,
 * since the URL being shared finally has its own real OG tags. Closes the
 * gap docs/SERVICE-PROJECTS-DESIGN.md section 9 flagged as unsolved.
 *
 * Also regenerates the auto-generated block in sitemap.xml (between the
 * BEGIN/END marker comments) and removes any previously-generated project
 * page folder whose project no longer exists in service-projects.json
 * (tracked via generated-pages-manifest.json so this script never deletes a
 * folder it didn't itself create).
 *
 * See docs/OPTIMIZATION-AUDIT-2026-10.md section 5 and section 14 (Phase B)
 * for the recommendation this implements. Deliberately NOT wired to a
 * scheduled GitHub Action yet -- that's Phase C ("build a new GitHub Action
 * for per-project page generation, following merchants-sync.js's pattern"),
 * not built here. Run manually (node .github/scripts/generate-project-pages.js)
 * whenever service-projects.json changes.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DATA_PATH = path.join(REPO_ROOT, 'assets/service-projects/service-projects.json');
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');
const SITEMAP_PATH = path.join(REPO_ROOT, 'sitemap.xml');
const MANIFEST_PATH = path.join(REPO_ROOT, 'assets/service-projects/generated-pages-manifest.json');

const SITE_ORIGIN = 'https://rcnagaheights.org';
const SITEMAP_BEGIN = '  <!-- BEGIN auto-generated project pages (.github/scripts/generate-project-pages.js) -->';
const SITEMAP_END = '  <!-- END auto-generated project pages -->';

// Must stay byte-for-byte identical to slugify() in projects/index.html --
// this is what makes a generated page's URL match what the index page's
// own Share button links to.
function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/`/g, '&#96;');
}

// Truncates on a word boundary, never mid-word, for a clean meta description.
function truncateDescription(desc, maxLen) {
  const text = String(desc || '').trim();
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

function formatDateHuman(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function renderPage(project, slug) {
  const canonical = `${SITE_ORIGIN}/projects/${slug}/`;
  const imageUrl = `${SITE_ORIGIN}${project.image}`;
  const title = `${project.project_name} | Service Projects | Rotary Club of Naga Heights`;
  const metaDesc = truncateDescription(project.description, 155);
  const dateHuman = formatDateHuman(project.date);

  return `<!doctype html>
<html lang="en"><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(metaDesc)}">
  <link rel="canonical" href="${canonical}">
  <meta name="theme-color" content="#0c3c7c">
  <link rel="icon" type="image/png" href="/assets/rotary-logo.png">
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Rotary Club of Naga Heights">
  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(metaDesc)}">
  <meta property="og:image" content="${escapeAttr(imageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${canonical}">
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(title)}">
  <meta name="twitter:description" content="${escapeAttr(metaDesc)}">
  <meta name="twitter:image" content="${escapeAttr(imageUrl)}">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NGO",
    "name": "Rotary Club of Naga Heights",
    "url": "${canonical}",
    "logo": "https://rcnagaheights.org/assets/rotary-logo.png",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "2nd Floor, Central Bus Station, Ninoy and Cory Ave",
      "addressLocality": "Naga City",
      "addressRegion": "Camarines Sur",
      "addressCountry": "PH"
    },
    "sameAs": [
      "https://web.facebook.com/rotarynagaheights",
      "https://www.instagram.com/rc_nagaheights/"
    ],
    "email": "info@rcnagaheights.org",
    "slogan": "Service Above Self"
  }
  </script>
  <link rel="preconnect" href="https://cdn.tailwindcss.com">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <script src="https://cdn.jsdelivr.net/npm/lucide@0.263.0/dist/umd/lucide.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;600;700;800&amp;family=Playfair+Display:wght@600;700;800&amp;display=swap" rel="stylesheet">
  <style>
:root{--blue:#17458f;--deep:#0c3c7c;--gold:#f7a81b;--mist:#f4f7fc}*{box-sizing:border-box}
body{margin:0;font-family:'Libre Franklin',sans-serif;color:#17324d}h1,h2,h3{font-family:'Playfair Display',serif}
.eyebrow{letter-spacing:.16em;text-transform:uppercase}
.nav-link.active,a.active{background:#eff6ff;color:#0c3c7c}.social-svg{width:25px;height:25px;fill:currentColor}
.dtc-banner-track{animation:dtc-banner-scroll 22s linear infinite}
@keyframes dtc-banner-scroll{from{transform:translateX(0)}to{transform:translateX(-25%)}}
@media (prefers-reduced-motion:reduce){.dtc-banner-track{animation:none}}
  </style>
 </head>
 <body>
<div class="fixed top-0 left-0 right-0 z-[60] h-9 bg-[#f7a81b] overflow-hidden">
 <a href="/diskwentulong/" class="dtc-banner-track inline-flex items-center h-9 whitespace-nowrap text-[#0c3c7c] font-bold text-sm">
  <span class="flex items-center gap-3 px-6 shrink-0">🤝 Support Rotary Club of Naga Heights — avail of a DiskwenTulong Card and help fund our community projects! <span class="inline-flex items-center gap-1 bg-[#0c3c7c] text-white text-xs font-bold px-3 py-1 rounded-full">Learn More <i data-lucide="arrow-right" class="w-3 h-3"></i></span></span>
  <span class="flex items-center gap-3 px-6 shrink-0" aria-hidden="true">🤝 Support Rotary Club of Naga Heights — avail of a DiskwenTulong Card and help fund our community projects! <span class="inline-flex items-center gap-1 bg-[#0c3c7c] text-white text-xs font-bold px-3 py-1 rounded-full">Learn More <i data-lucide="arrow-right" class="w-3 h-3"></i></span></span>
  <span class="flex items-center gap-3 px-6 shrink-0" aria-hidden="true">🤝 Support Rotary Club of Naga Heights — avail of a DiskwenTulong Card and help fund our community projects! <span class="inline-flex items-center gap-1 bg-[#0c3c7c] text-white text-xs font-bold px-3 py-1 rounded-full">Learn More <i data-lucide="arrow-right" class="w-3 h-3"></i></span></span>
  <span class="flex items-center gap-3 px-6 shrink-0" aria-hidden="true">🤝 Support Rotary Club of Naga Heights — avail of a DiskwenTulong Card and help fund our community projects! <span class="inline-flex items-center gap-1 bg-[#0c3c7c] text-white text-xs font-bold px-3 py-1 rounded-full">Learn More <i data-lucide="arrow-right" class="w-3 h-3"></i></span></span>
 </a>
</div>
<header class="fixed top-9 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b shadow-md">
   <nav class="max-w-7xl mx-auto h-[112px] px-4 sm:px-6 flex items-center justify-between"><a href="/" class="flex items-center">
<img class="h-20 lg:h-24 w-auto" src="/assets/header-logo.png" alt="Rotary Club of Naga Heights"></a>
    <div class="hidden xl:flex gap-1"><a class="nav-link px-3 py-2 rounded-full font-semibold text-sm text-[#17458f]" href="/">About Rotary</a> <a class="nav-link px-3 py-2 rounded-full font-semibold text-sm text-[#17458f]" href="/rotarians/">The Rotarians</a> <a class="nav-link px-3 py-2 rounded-full font-semibold text-sm text-[#17458f] active" href="/projects/">Service Projects</a> <a class="nav-link px-3 py-2 rounded-full font-semibold text-sm text-[#17458f]" href="/diskwentulong/">DiskwenTulong Card</a> <a class="nav-link px-3 py-2 rounded-full font-semibold text-sm text-[#17458f]" href="/rurok/">Rurok</a> <a class="nav-link px-3 py-2 rounded-full font-semibold text-sm text-[#17458f]" href="/contact/">Contact Us</a>
    </div><button id="menu-button" class="xl:hidden w-11 h-11 grid place-items-center" aria-expanded="false" aria-label="Menu"><i data-lucide="menu"></i></button>
   </nav>
   <div id="mobile-menu" class="hidden xl:hidden border-t bg-white px-5 py-3 grid"><a class="nav-link text-left py-3 border-b" href="/">About Rotary</a> <a class="nav-link text-left py-3 border-b" href="/rotarians/">The Rotarians</a> <a class="nav-link text-left py-3 border-b active" href="/projects/">Service Projects</a> <a class="nav-link text-left py-3 border-b" href="/diskwentulong/">DiskwenTulong Card</a> <a class="nav-link text-left py-3 border-b" href="/rurok/">Rurok</a> <a class="nav-link text-left py-3" href="/contact/">Contact Us</a>
   </div>
  </header>
  <main class="pt-[148px]">
   <section class="pt-12 pb-16">
    <div class="max-w-5xl mx-auto px-4 sm:px-6">
     <a href="/projects/" class="inline-flex items-center gap-2 text-sm font-semibold text-[#17458f] hover:underline mb-6"><i data-lucide="arrow-left" class="w-4 h-4"></i> All Service Projects</a>
     <div class="rounded-[2rem] overflow-hidden bg-slate-100">
      <img class="w-full aspect-video object-cover" src="${escapeAttr(project.image)}" alt="${escapeAttr(project.project_name)}">
     </div>
     <p class="text-xs font-bold uppercase tracking-wide text-[#17458f] mt-6 mb-2">${escapeHtml(project.category)}</p>
     <div class="flex items-center justify-between gap-4 flex-wrap">
      <h1 class="text-3xl sm:text-5xl font-bold text-[#0c3c7c]">${escapeHtml(project.project_name)}</h1>
      <button type="button" id="share-btn" class="shrink-0 inline-flex items-center gap-2 bg-[#17458f] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:brightness-110 transition">
       <i data-lucide="share-2" class="w-4 h-4"></i>
       Share
      </button>
     </div>
     ${dateHuman ? `<p class="text-sm text-slate-500 mt-2">${escapeHtml(dateHuman)}</p>` : ''}
     <p class="text-base sm:text-lg text-slate-600 mt-6 text-justify">${escapeHtml(project.description)}</p>
    </div>
   </section>
  </main>
<footer id="global-footer" class="bg-[#071f47] text-white py-12">
   <div class="max-w-7xl mx-auto px-4 sm:px-6">
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
     <div>
      <h3 class="text-[#f7a81b] font-bold text-xl mb-4">Meet</h3>
      <div class="flex flex-col items-center gap-1"><i data-lucide="map-pin" class="w-5 h-5 mb-1 text-[#f7a81b]"></i>
       <a href="https://www.google.com/maps?q=DyViajero+Transient+Hotel,+CBD+Terminal,+Naga+City,+Camarines+Sur,+Philippines" target="_blank" rel="noopener noreferrer" class="text-blue-200 hover:text-white underline text-sm">DyViajero Transient Hotel Conference Room, Naga City, Camarines Sur</a>
      </div>
     </div>
     <div>
      <h3 class="text-[#f7a81b] font-bold text-xl mb-4">Reach</h3>
      <div class="flex items-center justify-center gap-2"><i data-lucide="mail" class="w-5 h-5 text-[#f7a81b]"></i> <a href="mailto:info@rcnagaheights.org" class="text-blue-200 hover:text-white">info@rcnagaheights.org</a>
      </div>
     </div>
     <div>
      <h3 class="text-[#f7a81b] font-bold text-xl mb-4">Connect</h3>
      <div class="flex gap-4 justify-center"><a href="https://web.facebook.com/rotarynagaheights" target="_blank" rel="noopener noreferrer" aria-label="Facebook" class="w-11 h-11 rounded-full bg-[#1877f2] text-white grid place-items-center hover:scale-110 transition-transform">
        <svg class="social-svg" viewBox="0 0 24 24" aria-hidden="true">
         <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.025 4.388 11.016 10.125 11.927v-8.437H7.078v-3.49h3.047V9.414c0-3.025 1.792-4.696 4.533-4.696 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.956.931-1.956 1.887v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.089 24 18.098 24 12.073z"></path>
        </svg></a> <a href="https://www.instagram.com/rc_nagaheights/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="w-11 h-11 rounded-full bg-gradient-to-br from-[#f7a81b] via-[#dc2743] to-[#405de6] text-white grid place-items-center hover:scale-110 transition-transform">
        <svg class="social-svg" viewBox="0 0 24 24" aria-hidden="true">
         <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2zm-.2 2A3.6 3.6 0 004 7.6v8.8A3.6 3.6 0 007.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6A3.6 3.6 0 0016.4 4H7.6zm9.65 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z"></path>
        </svg></a> <a href="https://m.me/rotarynagaheights" target="_blank" rel="noopener noreferrer" aria-label="Messenger" class="w-11 h-11 rounded-full bg-[#0084ff] text-white grid place-items-center hover:scale-110 transition-transform">
        <svg class="social-svg" viewBox="0 0 24 24" aria-hidden="true">
         <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.973 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"></path>
        </svg></a>
      </div>
     </div>
     <div>
      <h3 class="text-[#f7a81b] font-bold text-xl mb-4">Site Map</h3>
      <nav class="grid gap-2 justify-center"><a class="text-blue-200 hover:text-white" href="/">About Rotary</a> <a class="text-blue-200 hover:text-white" href="/rotarians/">The Rotarians</a> <a class="text-blue-200 hover:text-white" href="/projects/">Service Projects</a> <a class="text-blue-200 hover:text-white" href="/diskwentulong/">DiskwenTulong Card</a> <a class="text-blue-200 hover:text-white" href="/rurok/">Rurok</a> <a class="text-blue-200 hover:text-white" href="/contact/">Contact Us</a>
      </nav>
     </div>
    </div>
    <div class="text-center border-t border-white/20 mt-10 pt-6">
     <p>© 2026 Rotary Club of Naga Heights</p>
     <p class="text-blue-200 mt-1">Service Above Self</p>
    </div>
   </div>
  </footer>
  <script>
document.getElementById('menu-button').onclick=function(){var btn=this;var hidden=document.getElementById('mobile-menu').classList.toggle('hidden');btn.setAttribute('aria-expanded', hidden?'false':'true');};
lucide.createIcons();
document.getElementById('share-btn').addEventListener('click', async function(){
  var url = window.location.href;
  var title = document.title;
  if (navigator.share) {
    try { await navigator.share({ title: title, url: url }); return; } catch (err) { if (err && err.name === 'AbortError') return; }
  }
  window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank', 'noopener,noreferrer,width=600,height=500');
});
  </script>
 </body>
</html>
`;
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return { slugs: [] };
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function writeManifest(slugs) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify({ slugs: slugs.sort() }, null, 2) + '\n');
}

function regenerateSitemap(slugs) {
  const sitemap = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const beginIdx = sitemap.indexOf(SITEMAP_BEGIN);
  const endIdx = sitemap.indexOf(SITEMAP_END);
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) {
    throw new Error('sitemap.xml is missing the BEGIN/END auto-generated-project-pages markers');
  }
  const today = new Date().toISOString().slice(0, 10);
  const entries = slugs
    .sort()
    .map(slug => `  <url>\n    <loc>${SITE_ORIGIN}/projects/${slug}/</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
    .join('\n');
  const before = sitemap.slice(0, beginIdx + SITEMAP_BEGIN.length);
  const after = sitemap.slice(endIdx);
  const middle = entries ? `\n${entries}\n` : '\n';
  fs.writeFileSync(SITEMAP_PATH, `${before}${middle}${after}`);
}

function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const projects = data.projects || [];

  const slugCounts = new Map();
  const bySlug = new Map();
  projects.forEach(p => {
    const slug = slugify(p.project_name);
    slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1);
    bySlug.set(slug, p);
  });
  const duplicates = [...slugCounts.entries()].filter(([, count]) => count > 1).map(([slug]) => slug);
  if (duplicates.length) {
    console.error('Aborting: duplicate slugs would collide: ' + duplicates.join(', '));
    process.exitCode = 1;
    return;
  }

  const newSlugs = [...bySlug.keys()];
  const manifest = loadManifest();
  const removedSlugs = manifest.slugs.filter(s => !bySlug.has(s));

  if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });

  let written = 0;
  newSlugs.forEach(slug => {
    const project = bySlug.get(slug);
    const dir = path.join(PROJECTS_DIR, slug);
    const filePath = path.join(dir, 'index.html');
    const html = renderPage(project, slug);
    const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
    if (existing !== html) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, html);
      written++;
    }
  });

  removedSlugs.forEach(slug => {
    const dir = path.join(PROJECTS_DIR, slug);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  });

  writeManifest(newSlugs);
  regenerateSitemap(newSlugs);

  console.log(`Generated/updated ${written} project page(s) out of ${newSlugs.length} total.`);
  if (removedSlugs.length) console.log(`Removed ${removedSlugs.length} stale page(s): ${removedSlugs.join(', ')}`);
}

if (require.main === module) {
  main();
}

module.exports = { slugify, truncateDescription, formatDateHuman };
