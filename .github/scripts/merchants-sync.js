#!/usr/bin/env node
/**
 * Partner Merchants Sync — diff script.
 *
 * Fetches the live, public, credential-free `?action=partners` Apps
 * Script endpoint and diffs it against the committed
 * assets/merchants/partners.json + categories.json. Writes the two JSON
 * files in place if (and only if) a real diff is found; the calling
 * workflow is responsible for committing/pushing/opening or updating a
 * PR with whatever this script changed -- this script never touches
 * git or GitHub itself. See docs/MERCHANTS-SYNC-DESIGN.md §2b for the
 * full design this implements.
 *
 * Never auto-removes a merchant from partners.json without a confirmed
 * merchant_id match to the live feed (see the bootstrap step below),
 * and never writes anything if the live response fails a plausibility
 * check (see validateSnapshot) -- a bad fetch must never look like a
 * mass merchant removal.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PARTNERS_PATH = path.join(REPO_ROOT, 'assets/merchants/partners.json');
const CATEGORIES_PATH = path.join(REPO_ROOT, 'assets/merchants/categories.json');
const PR_BODY_PATH = path.join(__dirname, 'pr-body.md');

// Same public, credential-free Web App URL diskwentulong/index.html itself
// calls. "Access: Anyone" -- see CLAUDE.md's Current Status.
const APPS_SCRIPT_URL =
  'https://script.google.com/a/macros/rcnagaheights.org/s/AKfycbyC6GIQA0BObLJ7UFUNdjt0moznACBfk-kUeWuzckl_9qyv3LONFx_WTiX42pAXirqC/exec';

// Same normalization diskwentulong/index.html already uses for its own
// name-keyed logo lookup -- kept identical so "does this name match"
// means the same thing in both places.
function normalizeName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// Empirically confirmed (2026-10-03, via Drive search) as the folder every
// checked merchant logo lives in regardless of upload date -- not
// documented anywhere authoritative on the backend side, so treat this as
// a best-effort reviewer shortcut, not a guarantee it never changes.
const APPROVED_LOGOS_FOLDER_ID = '1LZwGXNGvTltRGhnO_ye_3b2_eMbIwcXY';

function driveFolderUrl() {
  return `https://drive.google.com/drive/folders/${APPROVED_LOGOS_FOLDER_ID}`;
}

function driveSearchUrl(filename) {
  return `https://drive.google.com/drive/search?q=${encodeURIComponent(filename)}`;
}

// `logo_file_id` on the live Sheet is a human-typed filename, never a
// Drive file ID (see docs/DTC-DESIGN.md's logo history) -- this strips
// extension/punctuation/a leading "logo" token so a committed asset name
// like "aranco.jpg" and a raw Sheet value like "Logo.Aran&Co.JPG" compare
// equal, without ever claiming to resolve either into a real file.
function normalizeLogoToken(filename) {
  return String(filename || '')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]/g, '')
    .replace(/^logo/, '');
}

function warn(msg) {
  console.log(`::warning::${msg}`);
}

function setOutput(name, value) {
  const outPath = process.env.GITHUB_OUTPUT;
  if (!outPath) return;
  fs.appendFileSync(outPath, `${name}=${value}\n`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

async function fetchLivePartners(fetchUrl) {
  const res = await fetch(`${fetchUrl}?action=partners`);
  return res.json();
}

// The live response is grouped by category: { [category]: [partner, ...] }.
// Flatten it into one list, keeping each partner's own category alongside it.
function flattenLive(grouped) {
  const flat = [];
  Object.keys(grouped).forEach(category => {
    const items = grouped[category];
    if (!Array.isArray(items)) return;
    items.forEach(p => {
      flat.push({
        merchant_id: p.merchant_id || null,
        name: p.name,
        category,
        commitment: p.commitment,
        facebook_url: p.facebook_url || '',
        website_url: p.website_url || '',
        logo_live_filename: p.logo || null
      });
    });
  });
  return flat;
}

// Gate run before Code.gs's own doGet/jsonResponse_ wraps ANY caught
// exception into an HTTP-200 {error: ...} payload (backend/Code.gs), and
// docs/DTC-DESIGN.md documents the partners response can legitimately
// come back empty or erroring -- so "missing from this fetch = gone"
// must never apply to a response that doesn't even look real.
function validateSnapshot(response, committedPartners) {
  const problems = [];
  const totalCommittedCount = committedPartners.length;
  // The floor is based on entries already confirmed active via a prior
  // live fetch (i.e. already carrying merchant_id), not the raw committed
  // count: a legacy entry bootstrap could never match (no live
  // counterpart at all) would otherwise permanently inflate the
  // baseline and make the floor impossible to satisfy even with zero
  // real losses. On the very first run, before any id has ever been
  // backfilled, this is 0 -- the floor is a no-op until a baseline exists.
  const confirmedCount = committedPartners.filter(p => p.merchant_id).length;

  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    problems.push('response is not a plain object (expected {category: [...]} shape)');
    return { ok: false, problems, flat: [] };
  }
  if ('error' in response) {
    problems.push(`response is an {error: ...} payload: ${JSON.stringify(response.error)}`);
    return { ok: false, problems, flat: [] };
  }

  const flat = flattenLive(response);

  if (flat.length === 0 && totalCommittedCount > 0) {
    problems.push(`response parsed but contained zero merchants, while ${totalCommittedCount} are currently committed`);
  }

  // Never set a floor higher than confirmedCount itself -- otherwise a
  // small confirmed baseline (or a test fixture) could never pass even
  // with zero real losses. The absolute minimum of 5 only matters once
  // the confirmed baseline is already that large.
  const floor = Math.min(confirmedCount, Math.max(5, Math.ceil(confirmedCount * 0.5)));
  if (confirmedCount > 0 && flat.length < floor) {
    problems.push(
      `response has only ${flat.length} merchant(s), below the plausibility floor of ${floor} (half of the previously-confirmed ${confirmedCount}, minimum 5)`
    );
  }

  const idsPresent = flat.filter(p => p.merchant_id);
  if (idsPresent.length !== flat.length) {
    const nameless = flat.filter(p => !p.merchant_id).map(p => p.name);
    problems.push(`${flat.length - idsPresent.length} merchant(s) in the live response have a missing/empty merchant_id: ${nameless.join(', ')}`);
  }
  const countsById = new Map();
  idsPresent.forEach(p => countsById.set(p.merchant_id, (countsById.get(p.merchant_id) || []).concat(p.name)));
  const duplicates = [...countsById.entries()].filter(([, names]) => names.length > 1);
  if (duplicates.length) {
    const detail = duplicates.map(([id, names]) => `${id} used by [${names.join(', ')}]`).join('; ');
    problems.push(`live response contains duplicate merchant_id values (${idsPresent.length} entries, ${countsById.size} unique): ${detail}`);
  }

  return { ok: problems.length === 0, problems, flat };
}

function computeDiff(committedPartners, committedCategories, liveFlat) {
  const changeLog = {
    newCategories: [],
    bootstrapped: [],
    newMerchants: [],
    changedMerchants: [],
    proposedRemovals: [],
    logoChecklist: [],
    unmatchedLegacy: []
  };

  const liveById = new Map();
  liveFlat.forEach(p => liveById.set(p.merchant_id, p));

  const committedById = new Map();
  const committedWithoutId = [];
  committedPartners.forEach(p => {
    if (p.merchant_id) committedById.set(p.merchant_id, p);
    else committedWithoutId.push(p);
  });

  // One-time bootstrap: committed entries that predate merchant_id are
  // paired to a live entry by normalized name -- the ONE place this job
  // matches on name rather than merchant_id, and only to backfill the id
  // (never to decide a removal). Every pairing is called out in the PR
  // body for a human to double-check.
  const liveByNormalizedName = new Map();
  liveFlat.forEach(p => {
    const key = normalizeName(p.name);
    if (!liveByNormalizedName.has(key)) liveByNormalizedName.set(key, []);
    liveByNormalizedName.get(key).push(p);
  });

  const consumedLiveIds = new Set();
  committedWithoutId.forEach(entry => {
    const key = normalizeName(entry.name);
    const candidates = (liveByNormalizedName.get(key) || []).filter(
      p => !committedById.has(p.merchant_id) && !consumedLiveIds.has(p.merchant_id)
    );
    if (candidates.length === 1) {
      const match = candidates[0];
      entry.merchant_id = match.merchant_id;
      committedById.set(match.merchant_id, entry);
      consumedLiveIds.add(match.merchant_id);
      changeLog.bootstrapped.push({ name: entry.name, merchant_id: match.merchant_id });
    } else {
      changeLog.unmatchedLegacy.push(entry.name);
    }
  });

  // New categories -- placeholder "grid" icon, reusing the existing
  // client-side generic-icon fallback, never a guessed real one.
  committedCategories.order = committedCategories.order || [];
  committedCategories.icons = committedCategories.icons || {};
  const knownCategories = new Set(committedCategories.order);
  const liveCategories = new Set(liveFlat.map(p => p.category));
  liveCategories.forEach(cat => {
    if (!knownCategories.has(cat)) {
      committedCategories.order.push(cat);
      committedCategories.icons[cat] = 'grid';
      changeLog.newCategories.push(cat);
    }
  });

  // New merchants + changed fields on existing ones (bootstrap-matched
  // entries flow through here too, now that committedById has them).
  liveFlat.forEach(live => {
    const existing = committedById.get(live.merchant_id);
    if (!existing) {
      const newEntry = { merchant_id: live.merchant_id, name: live.name, category: live.category, commitment: live.commitment };
      if (live.facebook_url) newEntry.facebook_url = live.facebook_url;
      if (live.website_url) newEntry.website_url = live.website_url;
      newEntry.logo = null; // never the raw Drive filename -- see header comment
      committedPartners.push(newEntry);
      committedById.set(live.merchant_id, newEntry);
      changeLog.newMerchants.push(live.name);
      // Every new merchant is committed with logo: null, so every new
      // merchant needs this checklist entry -- not just the ones whose
      // live logo_file_id happens to be set. A missing raw filename is
      // still surfaced explicitly rather than silently dropping the
      // merchant from the list a human reviews before merging.
      changeLog.logoChecklist.push({ name: live.name, reason: 'new merchant', raw_filename: live.logo_live_filename || '(none on file)' });
      return;
    }

    const fieldMap = [
      ['name', live.name],
      ['category', live.category],
      ['commitment', live.commitment],
      ['facebook_url', live.facebook_url],
      ['website_url', live.website_url]
    ];
    const changedFields = [];
    fieldMap.forEach(([field, liveValue]) => {
      const currentValue = existing[field] || '';
      const normalizedLive = liveValue || '';
      if (currentValue !== normalizedLive) {
        if (normalizedLive) existing[field] = normalizedLive;
        else delete existing[field];
        changedFields.push(field);
      }
    });
    if (changedFields.length) {
      changeLog.changedMerchants.push({ name: existing.name, merchant_id: live.merchant_id, fields: changedFields });
    }

    // Never auto-resolved and never written into `existing.logo` -- just
    // surfaced for a human reviewer. These don't factor into `hasChanges`
    // below, so they only ever ride along on a PR already opened for some
    // other real reason, not trigger one on their own every single day.
    if (!existing.logo) {
      changeLog.logoChecklist.push({
        name: existing.name,
        reason: 'missing',
        raw_filename: live.logo_live_filename || '(none on file)'
      });
    } else if (live.logo_live_filename) {
      const liveToken = normalizeLogoToken(live.logo_live_filename);
      const committedToken = normalizeLogoToken(existing.logo);
      if (liveToken && committedToken && liveToken !== committedToken) {
        changeLog.logoChecklist.push({
          name: existing.name,
          reason: 'potentially mismatched',
          raw_filename: live.logo_live_filename,
          committed_filename: existing.logo
        });
      }
    }
  });

  // Proposed removals: a committed entry WITH a merchant_id that no
  // longer appears live. An entry bootstrap couldn't match stays
  // untouched (see unmatchedLegacy) -- it is never auto-removed just for
  // lacking an id.
  const remainingPartners = committedPartners.filter(p => {
    if (!p.merchant_id) return true;
    if (liveById.has(p.merchant_id)) return true;
    changeLog.proposedRemovals.push(p.name);
    return false;
  });

  const hasChanges =
    changeLog.newCategories.length > 0 ||
    changeLog.bootstrapped.length > 0 ||
    changeLog.newMerchants.length > 0 ||
    changeLog.changedMerchants.length > 0 ||
    changeLog.proposedRemovals.length > 0;

  return { hasChanges, changeLog, partners: remainingPartners, categories: committedCategories };
}

function renderPrBody(changeLog, liveCount, previousCount) {
  const lines = [];
  lines.push('Automated diff between the live `?action=partners` feed and the committed static fallback.');
  lines.push('');
  lines.push(`Live merchant count: ${liveCount} · previously committed: ${previousCount}`);
  lines.push('');
  lines.push('**This job never merges or pushes to `main` on its own — every change here needs a human review.**');
  lines.push('');

  if (changeLog.newCategories.length) {
    lines.push('### New categories');
    changeLog.newCategories.forEach(cat => lines.push(`- \`${cat}\` — added with a placeholder (\`grid\`) icon in \`categories.json\`; needs a real icon.`));
    lines.push('');
  }

  if (changeLog.bootstrapped.length) {
    lines.push('### Bootstrap: merchant_id backfilled by name match');
    lines.push('These committed entries predate `merchant_id` and were paired to a live entry by normalized name — the one case this job matches on name instead of `merchant_id`. Please double-check each pairing.');
    changeLog.bootstrapped.forEach(b => lines.push(`- "${b.name}" → \`${b.merchant_id}\``));
    lines.push('');
  }

  if (changeLog.newMerchants.length) {
    lines.push('### New merchants');
    changeLog.newMerchants.forEach(name => lines.push(`- ${name}`));
    lines.push('');
  }

  if (changeLog.changedMerchants.length) {
    lines.push('### Changed fields on existing merchants');
    changeLog.changedMerchants.forEach(c => lines.push(`- **${c.name}** (\`${c.merchant_id}\`): ${c.fields.join(', ')}`));
    lines.push('');
  }

  if (changeLog.proposedRemovals.length) {
    lines.push('### Proposed removals (no longer in the live feed)');
    lines.push('Review before merging — if a merchant should stay, remove this hunk from the diff rather than merging it.');
    changeLog.proposedRemovals.forEach(name => lines.push(`- ${name}`));
    lines.push('');
  }

  if (changeLog.logoChecklist.length) {
    lines.push('### Logo checklist (always manual)');
    lines.push(
      "Never auto-resolved or auto-committed -- the live Sheet's `logo_file_id` column is a free-text filename, not a stable Drive ID, and has previously pointed at the wrong merchant's file (see docs/DTC-DESIGN.md). Use the links below to find the right file, then download/resize/commit it under `assets/merchants/` and set its `logo` field by hand."
    );
    lines.push('');
    changeLog.logoChecklist.forEach(l => {
      const hasRawFilename = l.raw_filename && l.raw_filename !== '(none on file)';
      const links = hasRawFilename
        ? `[search Drive](${driveSearchUrl(l.raw_filename)}) · [approved logos folder](${driveFolderUrl()})`
        : `[approved logos folder](${driveFolderUrl()})`;
      let line = `- [ ] **${l.name}** (\`${l.reason}\`) — live raw filename: \`${l.raw_filename}\``;
      if (l.committed_filename) line += `, currently committed as \`${l.committed_filename}\``;
      line += ` — ${links}`;
      lines.push(line);
    });
    lines.push('');
  }

  if (changeLog.unmatchedLegacy.length) {
    lines.push('### Legacy entries still without a merchant_id');
    lines.push("No live entry matched these by name, so they're untouched — never auto-removed without a confirmed match. Needs manual investigation.");
    changeLog.unmatchedLegacy.forEach(name => lines.push(`- ${name}`));
    lines.push('');
  }

  lines.push('---');
  lines.push('_Opened automatically by the Partner Merchants Sync workflow — see `docs/MERCHANTS-SYNC-DESIGN.md`._');

  return lines.join('\n') + '\n';
}

async function main() {
  const committedPartners = readJson(PARTNERS_PATH);
  const committedCategories = readJson(CATEGORIES_PATH);
  const previousCount = committedPartners.length;

  let liveResponse;
  try {
    liveResponse = await fetchLivePartners(APPS_SCRIPT_URL);
  } catch (err) {
    warn(`Merchants sync aborted: failed to fetch live endpoint (${err.message})`);
    setOutput('has_changes', 'false');
    return;
  }

  const { ok, problems, flat: liveFlat } = validateSnapshot(liveResponse, committedPartners);
  if (!ok) {
    warn('Merchants sync aborted: snapshot validation failed:\n' + problems.map(p => ` - ${p}`).join('\n'));
    setOutput('has_changes', 'false');
    return;
  }

  const { hasChanges, changeLog, partners, categories } = computeDiff(committedPartners, committedCategories, liveFlat);

  if (!hasChanges) {
    console.log('No partner/category diff detected. Nothing to do.');
    setOutput('has_changes', 'false');
    return;
  }

  writeJson(CATEGORIES_PATH, categories);
  writeJson(PARTNERS_PATH, partners);

  const body = renderPrBody(changeLog, liveFlat.length, previousCount);
  fs.writeFileSync(PR_BODY_PATH, body);

  setOutput('has_changes', 'true');
  console.log('Partner/category diff written. Summary:\n' + body);
}

if (require.main === module) {
  main().catch(err => {
    warn(`Merchants sync aborted due to an unexpected error: ${err.stack || err.message}`);
    setOutput('has_changes', 'false');
    process.exitCode = 0; // a logged skip, not a hard CI failure -- see docs/MERCHANTS-SYNC-DESIGN.md §2b
  });
}

module.exports = { validateSnapshot, computeDiff, flattenLive, normalizeName };
