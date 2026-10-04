/**
 * DiskwenTulong Card (DTC) — Apps Script backend
 * v14 — matches docs/DTC-DESIGN.md, docs/RUROK-DESIGN.md,
 * docs/SERVICE-PROJECTS-DESIGN.md, and docs/MERCHANTS-SYNC-DESIGN.md in
 * the rcnagaheights-website repo.
 *
 * CHANGES FROM v13:
 * - Fixed a Google Sheets formula-injection gap (docs/OPTIMIZATION-AUDIT-2026-10.md
 *   §10): registerCard_'s payload.fullName, and logAction_/logVerification_'s
 *   action/detail/cardNumber/result/merchantName, were written via plain
 *   .setValue()/.appendRow() with no sanitization -- a string beginning
 *   with =, +, -, or @ is interpreted as a formula by Sheets, exactly as
 *   if a human had typed it into the UI (the classic CSV/Spreadsheet-
 *   injection class). New setSafeValue_()/appendRowSafely_() helpers
 *   force the cell to plain-text format and, for the =/+/-/@ cases,
 *   prepend a literal apostrophe before writing -- confirmed via a live
 *   test (not just reasoning) against the real Sheet: setNumberFormat('@')
 *   alone does NOT stop a leading '=' from still being evaluated as a
 *   formula, but the apostrophe-prefix does, storing the exact original
 *   string (Sheets strips the apostrophe back off, same as manual UI
 *   entry). All of registerCard_, logAction_, and logVerification_'s
 *   write sites now go through these helpers. Purely a write-path
 *   hardening -- no other endpoint/behavior touched.
 *
 * CHANGES FROM v12:
 * - getPartners_() now returns merchant_id (the Merchants sheet's own
 *   stable identity column, e.g. "M-0001") on every entry, in addition
 *   to the existing name/commitment/facebook_url/website_url/logo
 *   fields. Purely additive -- no existing field removed or renamed, no
 *   other endpoint touched. This is docs/MERCHANTS-SYNC-DESIGN.md's §2a-2
 *   prerequisite: the planned Partner Merchants sync job needs a stable
 *   per-merchant key to diff against, since business_name can itself
 *   change (see PR #108's "MiPanda Naga" correction) and would otherwise
 *   misread a rename as one merchant disappearing and a different one
 *   appearing.
 *
 * CHANGES FROM v11:
 * - Added ?action=projects (getServiceProjects_), reading the "Service
 *   Projects" Google Sheet (CONFIG.SERVICE_PROJECTS_SHEET_ID — converted
 *   2026-10-03 from the original "Service Projects.xlsx" upload, since
 *   SpreadsheetApp can't read a raw .xlsx binary) live, the same
 *   live-then-static-fallback pattern as getPartners_/getRurokIssues_.
 *   projects/index.html now fetches this first and only falls back to
 *   the committed assets/service-projects/service-projects.json if the
 *   live call fails. Returns project_name/category/category_group/
 *   description/date/image_filename — image_filename is the sheet's raw
 *   value for reference only; actual photos still need a human to
 *   download/resize/commit them under assets/service-projects/ (no
 *   reliable automatic filename-to-asset mapping exists, see that row's
 *   handling in projects/index.html), so a brand-new project row shows
 *   with a placeholder image until that one manual step is done.
 * - Accessing a second, non-bound spreadsheet by ID needs a broader
 *   Sheets scope than this script had before — see
 *   authorizeServiceProjectsAccess_ below, same manual one-time
 *   consent-screen pattern as authorizeExternalRequest_.
 *
 * CHANGES FROM v10 (superseded — this replaces the copy in Drive):
 * - Enforces Heyzine's free-tier 5-flipbook cap automatically instead
 *   of relying on a human to notice and delete old issues. Added to
 *   syncRurokIssues(), unconditionally, every run:
 *   - enforceHeyzineFlipbookCap_() — if the live List Flipbooks
 *     response has more than CONFIG.MAX_HEYZINE_FLIPBOOKS entries, the
 *     single oldest one (by upload date, never the newest/current one)
 *     is retired: its PDF is downloaded and saved to a Drive folder
 *     FIRST, and only once that save is confirmed successful does this
 *     call Heyzine's flipbook-delete API on it. If the download or the
 *     Drive save fails for any reason, this function returns without
 *     ever calling delete — an unarchived flipbook is left alone
 *     rather than risking deleting something with no backup. At most
 *     one flipbook is retired per run, even if somehow more than one
 *     is over the cap, as a deliberate safety limit against a logic
 *     bug mass-deleting real content in one run.
 *   - The RurokIssues tab gains an 8th column, pdf_url — blank until a
 *     row is retired this way, then holds a direct-download Drive URL.
 *     getRurokIssues_() now returns this field; the frontend
 *     (rurok/index.html) prefers it over the Heyzine page link once
 *     set, since the Heyzine page no longer exists after deletion.
 *   - CONFIG.HEYZINE_DELETE_URL / CONFIG.MAX_HEYZINE_FLIPBOOKS /
 *     CONFIG.RUROK_PDF_FOLDER_ID (a folder under Drive's "Digital
 *     Bulletin" folder, created 2026-08-25 for exactly this).
 * - This was a deliberate choice, not the only option: PDFs are saved
 *   to Drive, NOT committed into this git repo. Committing them here
 *   instead would need a GitHub write-scoped token stored in this
 *   script, and would let a scheduled trigger push content to the live
 *   site with no human review — unlike every other change to this
 *   repo, which goes through an explicit commit/PR/review step. Drive
 *   gives the same practical outcome (a real, downloadable PDF link)
 *   without that.
 * - No changes to any DTC verify/register/partners logic, or to
 *   anything else Rurok-related from v10 (naming, getRurokIssues_
 *   shape aside from the new field, etc).
 *
 * SETUP (Rurok automation only — DTC setup is unchanged from v9):
 * 1. Paste this whole file into Extensions > Apps Script from the
 *    "DTC Card Database" Sheet, replacing whatever version is there.
 * 2. Run setupWorkbook() once from the editor (select it in the
 *    toolbar dropdown, click Run). It only creates tabs/fills headers
 *    that don't already exist, so this is always safe to re-run.
 *    IMPORTANT: if RurokIssues was already created by a prior v10
 *    setup (7 columns, no pdf_url), setupWorkbook() will NOT
 *    retroactively add the 8th column — manually add a "pdf_url"
 *    header in that tab's next empty column first. If RurokIssues
 *    doesn't exist yet at all, this step creates it correctly with all
 *    8 columns from the start.
 * 3. Add a Script Property (Project Settings — the gear icon — >
 *    Script Properties > Add script property): key HEYZINE_API_KEY,
 *    value the API key from https://heyzine.com/account/#api. Do NOT
 *    paste the key into this file — Script Properties keeps it out of
 *    this file's (and this Drive doc's revision history's) plain text.
 * 4. Run syncRurokIssues() once manually from the editor to do the
 *    first sync (populates RurokIssues from whatever's currently live
 *    on Heyzine; with only 2 real issues right now, the 5-flipbook cap
 *    won't trigger anything yet). Check the result: Heyzine's own
 *    title/subtitle fields were blank for the most recent upload as of
 *    this writing, so its label will come back as an auto-generated
 *    placeholder ("New Issue – <Month> <Year>") with needs_review =
 *    TRUE — fix this by editing that row's "label" cell directly in
 *    the Sheet (takes effect immediately, no redeploy) if that's
 *    easier, or by filling in the title/subtitle on Heyzine's own
 *    dashboard and re-running the sync.
 * 5. Add a time-driven trigger for syncRurokIssues (Triggers icon in
 *    the left sidebar > Add Trigger > function: syncRurokIssues >
 *    event source: Time-driven > Day timer, any hour is fine given the
 *    real upload cadence is roughly monthly — see docs/RUROK-DESIGN.md).
 * 6. Redeploy the existing Web App as a NEW VERSION (Deploy > Manage
 *    deployments > edit the existing "Access: Anyone" deployment >
 *    Version: New version > Deploy) so ?action=rurokIssues goes live.
 *    Same /exec URL, no new deployment, no re-authorization needed —
 *    UrlFetchApp.fetch to heyzine.com and DriveApp both use scopes
 *    already granted (script.external_request for the tokeninfo call
 *    in verifyIdToken_; Drive access is implicit for any Apps Script
 *    bound to a Sheet), so authorizeExternalRequest_() below does not
 *    need to be re-run.
 */

var CONFIG = {
  SHEET_MERCHANTS: 'Merchants',
  SHEET_VERIFICATIONS: 'Verifications',
  SHEET_LOGS: 'Logs',
  SHEET_SETTINGS: 'Settings',
  SHEET_RUROK_ISSUES: 'RurokIssues',
  // Native Google Sheet (converted 2026-10-03 from "Service
  // Projects.xlsx" — see docs/SERVICE-PROJECTS-DESIGN.md), in the same
  // Drive "Service Projects" folder, NOT a tab in this script's own
  // bound spreadsheet.
  SERVICE_PROJECTS_SHEET_ID: '1AQbpoq2r6FFwjaQKeDoYGYhSeu8fw_-5_jfGgsmaq6Q',
  HEYZINE_LIST_URL: 'https://heyzine.com/api1/flipbook-list',
  HEYZINE_DELETE_URL: 'https://heyzine.com/api1/flipbook-delete',
  MAX_HEYZINE_FLIPBOOKS: 5,
  RUROK_PDF_FOLDER_ID: '1bof10ADsBiI2HSK2gC8-fSNyjhFSGvxU',
  TIMEZONE: 'Asia/Manila',
  CARD_NUMBER_PATTERN: /^DTC-([A-Za-z0-9]+)-(\d{5})$/,
  // Fixed for ALL cards, co-terminus with the shared partner MOA.
  // Do not compute this per-card — see docs/DTC-DESIGN.md section 1.
  EXPIRY_DATE: new Date(2027, 11, 31),
  // Must exactly match register/index.html's data-client_id attribute.
  GOOGLE_CLIENT_ID: '503057261558-f5bbseei4a54qokrkumjntv2p6tpl471.apps.googleusercontent.com',
  REQUIRED_EMAIL_DOMAIN: 'rcnagaheights.org'
};

/** Web app GET entry point: ?action=verify, ?action=partners, ?action=rurokIssues, or ?action=projects */
function doGet(e) {
  var action = e.parameter.action;
  try {
    if (action === 'verify') {
      return jsonResponse_(verifyCard_(e.parameter.cardNumber, e.parameter.merchant, e.parameter.cardholderName));
    }
    if (action === 'partners') {
      return jsonResponse_(getPartners_());
    }
    if (action === 'rurokIssues') {
      return jsonResponse_(getRurokIssues_());
    }
    if (action === 'projects') {
      return jsonResponse_(getServiceProjects_());
    }
    return jsonResponse_({ error: 'Unknown action' });
  } catch (err) {
    return jsonResponse_({ error: String(err) });
  }
}

/** Web app POST entry point: ?action=register */
function doPost(e) {
  var action = e.parameter.action;
  try {
    if (action === 'register') {
      var payload = JSON.parse(e.postData.contents);
      return jsonResponse_(registerCard_(payload));
    }
    return jsonResponse_({ error: 'Unknown action' });
  } catch (err) {
    return jsonResponse_({ error: String(err) });
  }
}

/**
 * Splits "DTC-2026-00001" into { batch: '2026', full: 'DTC-2026-00001' }.
 * Returns null if the string doesn't match the expected format.
 */
function parseCardNumber_(cardNumber) {
  var m = CONFIG.CARD_NUMBER_PATTERN.exec(String(cardNumber || '').trim());
  if (!m) return null;
  return { batch: m[1], full: 'DTC-' + m[1] + '-' + m[2] };
}

/**
 * Normalizes a name for comparison: trims, collapses internal
 * whitespace runs to a single space, lowercases. Deliberately simple —
 * this is matching against what a cashier types off a physical ID, not
 * doing fuzzy/typo-tolerant matching, so exact-after-normalization is
 * the right level of strictness (too lenient defeats the point of
 * requiring a name at all).
 */
function normalizeName_(str) {
  return String(str || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Verifies a Google Identity Services ID token server-side via Google's
 * tokeninfo endpoint: checks signature/expiry (Google does this for us
 * by accepting the token at all), audience (must match our OAuth client
 * so a token issued for some other app can't be replayed here), email
 * verification, and the @rcnagaheights.org domain.
 *
 * Returns the verified email on success, or null on any failure. Never
 * throws — every failure path just means "not authenticated," handled
 * the same way as a missing token.
 */
function verifyIdToken_(idToken) {
  if (!idToken) {
    logAction_('verify_token_failed', 'no idToken provided');
    return null;
  }
  try {
    var resp = UrlFetchApp.fetch(
      'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
      { muteHttpExceptions: true }
    );
    if (resp.getResponseCode() !== 200) {
      logAction_('verify_token_failed', 'tokeninfo HTTP ' + resp.getResponseCode() + ': ' + resp.getContentText());
      return null;
    }
    var payload = JSON.parse(resp.getContentText());

    if (payload.aud !== CONFIG.GOOGLE_CLIENT_ID) {
      logAction_('verify_token_failed', 'aud mismatch: got "' + payload.aud + '" expected "' + CONFIG.GOOGLE_CLIENT_ID + '"');
      return null;
    }
    // email_verified can come back as a real boolean or the string
    // "true" depending on the endpoint/token -- coerce to string before
    // comparing so a genuinely verified email is never rejected on a
    // type mismatch.
    if (!payload.email || String(payload.email_verified) !== 'true') {
      logAction_('verify_token_failed', 'email/email_verified check failed: email="' + payload.email + '" email_verified="' + payload.email_verified + '"');
      return null;
    }

    var domain = String(payload.email).split('@')[1] || '';
    if (domain.toLowerCase() !== CONFIG.REQUIRED_EMAIL_DOMAIN.toLowerCase()) {
      logAction_('verify_token_failed', 'domain mismatch: got "' + domain + '" expected "' + CONFIG.REQUIRED_EMAIL_DOMAIN + '"');
      return null;
    }

    return payload.email;
  } catch (err) {
    logAction_('verify_token_failed', 'exception: ' + String(err));
    return null;
  }
}

/**
 * Registers a card. Client-provided fields: cardNumber, fullName,
 * idToken. No client email/phone/address is ever collected or stored —
 * see docs/DTC-DESIGN.md section 3.
 *
 * The REGISTERING MEMBER's identity comes from idToken (verified via
 * verifyIdToken_ -- signature, audience, @rcnagaheights.org domain). The
 * verified email is recorded in registered_by for internal audit only —
 * never returned to the client, never emailed.
 *
 * payload: { cardNumber, fullName, idToken }
 */
function registerCard_(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var memberEmail = verifyIdToken_(payload.idToken);
    if (!memberEmail) {
      return { success: false, message: 'Could not verify your Google account. Please sign in with your @' + CONFIG.REQUIRED_EMAIL_DOMAIN + ' account and try again.' };
    }

    var parsed = parseCardNumber_(payload.cardNumber);
    if (!parsed) {
      return { success: false, message: 'Card number format not recognized. Expected DTC-BATCH-##### (e.g. DTC-2026-00001).' };
    }

    var sheet = getBatchSheet_(parsed.batch);
    if (!sheet) {
      return { success: false, message: 'Unknown card batch "' + parsed.batch + '". No matching sheet tab exists.' };
    }

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var cardCol = headers.indexOf('card_number');
    var statusCol = headers.indexOf('status');
    var nameCol = headers.indexOf('cardholder_name');
    var regDateCol = headers.indexOf('registered_date');
    var expiryCol = headers.indexOf('expiry_date');
    var registeredByCol = headers.indexOf('registered_by');

    for (var i = 1; i < data.length; i++) {
      if (data[i][cardCol] === parsed.full) {
        var currentStatus = data[i][statusCol];
        if (currentStatus !== 'UNREGISTERED') {
          return { success: false, message: 'This card is already registered or is not available for registration (status: ' + currentStatus + ').' };
        }
        var rowNum = i + 1;
        sheet.getRange(rowNum, statusCol + 1).setValue('ACTIVE');
        setSafeValue_(sheet.getRange(rowNum, nameCol + 1), payload.fullName);
        sheet.getRange(rowNum, regDateCol + 1).setValue(new Date());
        sheet.getRange(rowNum, expiryCol + 1).setValue(CONFIG.EXPIRY_DATE);
        sheet.getRange(rowNum, registeredByCol + 1).setValue(memberEmail);
        logAction_('register', parsed.full + ' registered by ' + memberEmail);
        return { success: true, message: 'Card registered successfully.' };
      }
    }
    return { success: false, message: 'Card number not found in the "' + parsed.batch + '" batch. Please check the number on the physical card.' };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Returns ONLY name/card_number/status/dates for a card — never
 * email/phone/address (there is none to expose — see
 * docs/DTC-DESIGN.md section 3). escapeHtml_ guards against a
 * stored-XSS risk if a cardholder name ever contains HTML/script
 * characters.
 *
 * merchantName is the free-text business_name the /verify/ frontend's
 * "Which merchant are you at?" dropdown sent — passed straight through
 * to logVerification_ for the Verifications tab. Not used for anything
 * else (not a security check, purely usage tracking — see
 * docs/DTC-DESIGN.md section 4).
 *
 * cardholderNameInput is the name the cashier typed off the card/valid
 * ID (added in v9). A registered card only returns its real details if
 * this matches the name on file; otherwise the response is
 * indistinguishable from an invalid card number, so scripting
 * card-number guesses alone can't harvest names.
 */
function verifyCard_(rawCardNumber, merchantName, cardholderNameInput) {
  var parsed = parseCardNumber_(rawCardNumber);
  logAction_('verify_attempt', rawCardNumber);

  if (!parsed) {
    logVerification_(rawCardNumber, 'INVALID CARD', merchantName);
    return { card_number: rawCardNumber, status: 'INVALID CARD' };
  }

  var sheet = getBatchSheet_(parsed.batch);
  if (!sheet) {
    logVerification_(parsed.full, 'INVALID CARD', merchantName);
    return { card_number: parsed.full, status: 'INVALID CARD' };
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var cardCol = headers.indexOf('card_number');
  var statusCol = headers.indexOf('status');
  var nameCol = headers.indexOf('cardholder_name');
  var regDateCol = headers.indexOf('registered_date');
  var expiryCol = headers.indexOf('expiry_date');

  for (var i = 1; i < data.length; i++) {
    if (data[i][cardCol] === parsed.full) {
      var status = data[i][statusCol];
      var onFileName = data[i][nameCol];

      // A card with a real name on file only reveals anything if the
      // entered name matches it. UNREGISTERED cards have no name to
      // protect, so they're exempt from this check (nothing to leak).
      if (status !== 'UNREGISTERED') {
        if (normalizeName_(cardholderNameInput) !== normalizeName_(onFileName)) {
          logVerification_(parsed.full, 'NAME_MISMATCH', merchantName);
          return { card_number: parsed.full, status: 'INVALID CARD' };
        }
      }

      var expiry = data[i][expiryCol];
      if (status === 'ACTIVE' && expiry && new Date(expiry) < new Date()) {
        status = 'EXPIRED';
      }
      logVerification_(parsed.full, status, merchantName);
      return {
        card_number: parsed.full,
        cardholder_name: escapeHtml_(onFileName || ''),
        status: status,
        registered_date: data[i][regDateCol] ? Utilities.formatDate(new Date(data[i][regDateCol]), CONFIG.TIMEZONE, 'yyyy-MM-dd') : '',
        expiry_date: data[i][expiryCol] ? Utilities.formatDate(new Date(data[i][expiryCol]), CONFIG.TIMEZONE, 'yyyy-MM-dd') : ''
      };
    }
  }
  logVerification_(parsed.full, 'INVALID CARD', merchantName);
  return { card_number: parsed.full, status: 'INVALID CARD' };
}

/**
 * Returns Active-status merchants grouped by category, as JSON.
 * This is what /diskwentulong/ fetches from, replacing the static
 * assets/merchants/partners.json file the frontend used before.
 */
function getPartners_() {
  var sheet = getSheet_(CONFIG.SHEET_MERCHANTS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var col = {};
  headers.forEach(function (h, idx) { col[h] = idx; });

  var result = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[col['status']] !== 'Active') continue;
    var category = row[col['category']] || 'Other';
    if (!result[category]) result[category] = [];
    result[category].push({
      merchant_id: row[col['merchant_id']] || null,
      name: row[col['business_name']],
      commitment: row[col['offer_details']],
      facebook_url: row[col['facebook_url']],
      website_url: row[col['website_url']],
      logo: row[col['logo_file_id']] || null
    });
  }
  return result;
}

/**
 * Returns Service Projects rows as JSON, live from the "Service
 * Projects" Sheet (CONFIG.SERVICE_PROJECTS_SHEET_ID) — a separate
 * spreadsheet from this script's own bound "DTC Card Database", in the
 * same Drive "Service Projects" folder. This is what projects/index.html
 * fetches first (see docs/SERVICE-PROJECTS-DESIGN.md), falling back to
 * the committed assets/service-projects/service-projects.json only if
 * this call fails.
 *
 * Column layout (row 1 headers): Service Projects (project_name),
 * Start Date:, End Date:, Avenue of Service:, Image_Filename:,
 * Description. `date` uses Start Date: uniformly, formatted
 * yyyy-MM-dd. category_group/category parsing matches
 * docs/SERVICE-PROJECTS-DESIGN.md section 1 exactly: a value containing
 * ": " -> category_group "areas_of_focus", category = the part after
 * the colon; otherwise -> category_group "avenues_of_service", category
 * = the value as-is.
 *
 * image_filename is passed through as-is for reference only -- it's the
 * raw Drive filename from the Sheet, which does NOT reliably match the
 * final resized/renamed asset committed under
 * assets/service-projects/<group>/ (that mapping has always been a
 * manual, human step; see projects/index.html's own image lookup for
 * how a project without a matching committed photo falls back to a
 * placeholder instead of a broken image).
 */
function getServiceProjects_() {
  var ss = SpreadsheetApp.openById(CONFIG.SERVICE_PROJECTS_SHEET_ID);
  var sheet = ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var col = {};
  headers.forEach(function (h, idx) { col[String(h).trim()] = idx; });

  var projects = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var projectName = row[col['Service Projects']];
    if (!projectName) continue;

    var avenue = String(row[col['Avenue of Service:']] || '').trim();
    var colonIdx = avenue.indexOf(': ');
    var categoryGroup, category;
    if (colonIdx !== -1) {
      categoryGroup = 'areas_of_focus';
      category = avenue.slice(colonIdx + 2).trim();
    } else {
      categoryGroup = 'avenues_of_service';
      category = avenue;
    }

    projects.push({
      project_name: String(projectName).trim(),
      category: category,
      category_group: categoryGroup,
      description: row[col['Description']] || '',
      date: formatProjectDate_(row[col['Start Date:']]),
      image_filename: row[col['Image_Filename:']] || ''
    });
  }
  return { projects: projects };
}

/**
 * Service Projects' Start Date:/End Date: columns came from the
 * original xlsx as either real Date objects (Sheets auto-detected a
 * date-formatted cell) or plain "MM/DD/YY" strings -- handles both,
 * returns 'yyyy-MM-dd' or '' if unparseable.
 */
function formatProjectDate_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, CONFIG.TIMEZONE, 'yyyy-MM-dd');
  }
  var str = String(value || '').trim();
  var m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(str);
  if (!m) return '';
  var year = m[3].length === 2 ? '20' + m[3] : m[3];
  var mm = ('0' + m[1]).slice(-2);
  var dd = ('0' + m[2]).slice(-2);
  return year + '-' + mm + '-' + dd;
}

/**
 * Polls Heyzine's List Flipbooks API and syncs any new upload into the
 * RurokIssues tab, so /rurok/ (via ?action=rurokIssues below) stays
 * data-driven instead of needing a manual HTML edit every time the club
 * uploads a new issue. Also enforces Heyzine's free-tier flipbook cap
 * every run (see enforceHeyzineFlipbookCap_ below). Meant to run on a
 * time-driven trigger (set up manually in the Apps Script editor —
 * Triggers icon > Add Trigger > this function > Time-driven > Day
 * timer; daily is plenty given the real upload cadence is roughly
 * monthly, see docs/RUROK-DESIGN.md).
 *
 * Requires a Script Property named HEYZINE_API_KEY (Project Settings >
 * Script Properties in the editor — never typed into this file, so the
 * key never ends up in this Drive doc's plain text or revision history).
 *
 * IMPORTANT, found empirically 2026-08-24: Heyzine's API returns
 * whatever title/subtitle were set in ITS OWN dashboard for that
 * flipbook — both can be blank if the uploader never filled them in
 * (confirmed live: the Volume 2 upload has blank title/subtitle even
 * though Volume 1 has "RUROK" / "Volume 1: June Issue" filled in). A
 * blank label is never shown as-is on the live page — see
 * formatRurokFallbackLabel_ below — but it IS flagged via the
 * needs_review column so a human notices and fixes the real label,
 * either by editing this Sheet's label cell directly (takes effect
 * immediately, no redeploy) or by filling in the title/subtitle on
 * Heyzine's own dashboard and re-running this sync.
 */
function syncRurokIssues() {
  var apiKey = PropertiesService.getScriptProperties().getProperty('HEYZINE_API_KEY');
  if (!apiKey) {
    logAction_('rurok_sync_failed', 'HEYZINE_API_KEY Script Property not set');
    return;
  }

  var resp = UrlFetchApp.fetch(CONFIG.HEYZINE_LIST_URL, {
    headers: { Authorization: 'Bearer ' + apiKey },
    muteHttpExceptions: true
  });
  if (resp.getResponseCode() !== 200) {
    logAction_('rurok_sync_failed', 'Heyzine API HTTP ' + resp.getResponseCode() + ': ' + resp.getContentText());
    return;
  }

  var flipbooks;
  try {
    flipbooks = JSON.parse(resp.getContentText());
  } catch (err) {
    logAction_('rurok_sync_failed', 'Could not parse Heyzine response: ' + String(err));
    return;
  }
  if (!flipbooks || !flipbooks.length) {
    logAction_('rurok_sync_failed', 'Heyzine returned an empty flipbook list');
    return;
  }

  var sheet = getSheet_(CONFIG.SHEET_RUROK_ISSUES);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var col = {};
  headers.forEach(function (h, idx) { col[h] = idx; });

  var knownIds = {};
  for (var i = 1; i < data.length; i++) {
    knownIds[data[i][col['flipbook_id']]] = true;
  }

  var addedCount = 0;
  flipbooks.forEach(function (fb) {
    if (knownIds[fb.id]) return;
    var rawLabel = [fb.title, fb.subtitle].filter(Boolean).join(': ');
    var label = rawLabel || formatRurokFallbackLabel_(fb.date);
    sheet.appendRow([
      fb.id,
      new Date(fb.date),
      label,
      (fb.links && (fb.links.custom || fb.links.base)) || '',
      (fb.links && fb.links.thumbnail) || '',
      'past',
      !rawLabel,
      ''
    ]);
    addedCount++;
    logAction_('rurok_issue_added', fb.id + ' — ' + label + (rawLabel ? '' : ' (needs_review: Heyzine title/subtitle were blank)'));
  });

  if (addedCount > 0) {
    recomputeCurrentRurokIssue_(sheet);
    logAction_('rurok_sync', addedCount + ' new issue(s) added');
  }

  enforceHeyzineFlipbookCap_(sheet, flipbooks, apiKey);
}

/**
 * Keeps Heyzine's free-tier flipbook count at or under
 * CONFIG.MAX_HEYZINE_FLIPBOOKS. If over, retires exactly ONE flipbook
 * per run — the oldest by upload date, never the single newest one
 * (that's always the current Featured issue) — by: (1) downloading its
 * PDF via the links.pdf URL already in this run's fresh API response,
 * (2) saving it into the Drive folder at CONFIG.RUROK_PDF_FOLDER_ID and
 * sharing it "anyone with the link can view", (3) ONLY once that save
 * is confirmed, recording the resulting Drive URL in that row's
 * pdf_url column, and (4) ONLY THEN calling Heyzine's flipbook-delete
 * API on it. Any failure in steps 1-2 aborts before ever reaching step
 * 4 — an un-archived flipbook is left alone on Heyzine rather than
 * risking a delete with nothing backing it up. Deliberately retires at
 * most one per run, even if the list is more than one over the cap, as
 * a safety limit against a counting bug deleting real content in bulk;
 * a backlog just clears one run at a time.
 */
function enforceHeyzineFlipbookCap_(sheet, flipbooks, apiKey) {
  if (flipbooks.length <= CONFIG.MAX_HEYZINE_FLIPBOOKS) return;

  var sorted = flipbooks.slice().sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
  var candidate = sorted[0];
  var newest = sorted[sorted.length - 1];
  if (candidate.id === newest.id) {
    logAction_('rurok_retire_failed', 'Over cap but oldest === newest flipbook -- refusing to guess, skipping this run');
    return;
  }

  var pdfSourceUrl = candidate.links && candidate.links.pdf;
  if (!pdfSourceUrl) {
    logAction_('rurok_retire_failed', candidate.id + ' has no links.pdf in the Heyzine response -- cannot archive, NOT deleting');
    return;
  }

  var pdfResp = UrlFetchApp.fetch(pdfSourceUrl, { muteHttpExceptions: true });
  if (pdfResp.getResponseCode() !== 200) {
    logAction_('rurok_retire_failed', candidate.id + ' PDF download HTTP ' + pdfResp.getResponseCode() + ' -- NOT deleting from Heyzine');
    return;
  }

  var driveUrl;
  try {
    var folder = DriveApp.getFolderById(CONFIG.RUROK_PDF_FOLDER_ID);
    var safeName = 'rurok-' + String(candidate.id).replace(/[^A-Za-z0-9.-]/g, '_') + '.pdf';
    var file = folder.createFile(pdfResp.getBlob().setName(safeName));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    driveUrl = 'https://drive.google.com/uc?export=download&id=' + file.getId();
  } catch (err) {
    logAction_('rurok_retire_failed', candidate.id + ' Drive save failed: ' + String(err) + ' -- NOT deleting from Heyzine');
    return;
  }

  // The PDF is safely archived in Drive before this point touches the
  // Sheet or calls Heyzine's delete endpoint at all.
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var col = {};
  headers.forEach(function (h, idx) { col[h] = idx; });
  for (var i = 1; i < data.length; i++) {
    if (data[i][col['flipbook_id']] === candidate.id) {
      sheet.getRange(i + 1, col['pdf_url'] + 1).setValue(driveUrl);
      break;
    }
  }
  logAction_('rurok_retire', candidate.id + ' archived to Drive: ' + driveUrl);

  var delResp = UrlFetchApp.fetch(CONFIG.HEYZINE_DELETE_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + apiKey },
    payload: JSON.stringify({ id: candidate.id }),
    muteHttpExceptions: true
  });
  if (delResp.getResponseCode() === 200) {
    logAction_('rurok_retire', candidate.id + ' deleted from Heyzine successfully');
  } else {
    logAction_('rurok_retire_failed', candidate.id + ' PDF archived OK but Heyzine delete failed, HTTP ' + delResp.getResponseCode() + ': ' + delResp.getContentText() + ' -- delete it manually from the Heyzine dashboard, the Drive backup is already safe');
  }
}

/** "New Issue – August 2026", used only when Heyzine's own title/subtitle are blank. */
function formatRurokFallbackLabel_(isoDate) {
  var d = isoDate ? new Date(isoDate) : new Date();
  return 'New Issue – ' + Utilities.formatDate(d, CONFIG.TIMEZONE, 'MMMM yyyy');
}

/**
 * Whichever row has the newest date_added becomes 'current'; every
 * other row becomes 'past'. Re-run after any insert so the Featured
 * slot always tracks the actual newest upload, not just the most
 * recently-synced one (matters if Heyzine ever returns flipbooks out
 * of upload order).
 */
function recomputeCurrentRurokIssue_(sheet) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var col = {};
  headers.forEach(function (h, idx) { col[h] = idx; });

  var newestRow = -1;
  var newestDate = null;
  for (var i = 1; i < data.length; i++) {
    var d = new Date(data[i][col['date_added']]);
    if (!newestDate || d > newestDate) {
      newestDate = d;
      newestRow = i;
    }
  }
  if (newestRow === -1) return;

  for (var j = 1; j < data.length; j++) {
    sheet.getRange(j + 1, col['status'] + 1).setValue(j === newestRow ? 'current' : 'past');
  }
}

/**
 * Returns the RurokIssues tab as { current: {...}|null, past: [...] },
 * newest-first within past. This is what /rurok/ fetches from (see
 * ?action=rurokIssues in doGet above), replacing the old hardcoded
 * Featured iframe src + single Past Issues card in the HTML — a new
 * Heyzine upload now needs zero code/HTML changes once
 * syncRurokIssues picks it up (see that function's own header for the
 * one thing that still sometimes needs a manual touch: a blank label).
 * pdf_url is blank for any issue still live on Heyzine, and holds a
 * direct-download Drive link once enforceHeyzineFlipbookCap_ has
 * retired that issue off Heyzine.
 */
function getRurokIssues_() {
  var sheet = getSheet_(CONFIG.SHEET_RUROK_ISSUES);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var col = {};
  headers.forEach(function (h, idx) { col[h] = idx; });

  var issues = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rawDate = row[col['date_added']];
    issues.push({
      id: row[col['flipbook_id']],
      date: rawDate instanceof Date ? Utilities.formatDate(rawDate, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss'Z'") : rawDate,
      label: row[col['label']],
      url: row[col['heyzine_url']],
      pdf_url: row[col['pdf_url']] || '',
      thumbnail: row[col['thumbnail_url']],
      status: row[col['status']],
      needs_review: !!row[col['needs_review']]
    });
  }
  issues.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

  var current = null;
  var past = [];
  issues.forEach(function (issue) {
    if (issue.status === 'current' && !current) {
      current = issue;
    } else {
      past.push(issue);
    }
  });
  return { current: current, past: past };
}

function logAction_(action, detail) {
  var sheet = getSheet_(CONFIG.SHEET_LOGS);
  appendRowSafely_(sheet, [new Date(), action, detail]);
}

/**
 * Appends a row to the Verifications tab: timestamp, card number,
 * result, and the merchant name the customer said they were at,
 * straight from /verify/'s dropdown. merchantName is whatever string
 * the frontend sent -- could be '' if the field was somehow skipped,
 * never validated against the Merchants sheet here.
 *
 * result can be NAME_MISMATCH in addition to the usual
 * ACTIVE/EXPIRED/SUSPENDED/UNREGISTERED/INVALID CARD -- this
 * distinction is for the club's own internal abuse monitoring only; the
 * JSON returned to the caller never reveals which of these two
 * "rejected" cases actually happened.
 */
function logVerification_(cardNumber, result, merchantName) {
  var sheet = getSheet_(CONFIG.SHEET_VERIFICATIONS);
  appendRowSafely_(sheet, [new Date(), cardNumber, result, merchantName || '']);
}

/**
 * Writes `value` into `range` as a literal value. If it's a string,
 * forces the cell to plain-text number format ('@') before writing --
 * Range.setValue() otherwise interprets a string beginning with
 * =, +, -, or @ as a formula, exactly as if a human had typed it into
 * the Sheets UI (the classic CSV/Spreadsheet-injection class). This is
 * the reliable fix: it changes how the CELL parses any value, unlike a
 * leading-apostrophe workaround, which only neutralizes manual UI entry,
 * not an API-written value.
 */
function setSafeValue_(range, value) {
  if (typeof value === 'string') {
    range.setNumberFormat('@');
    // A leading =, +, -, or @ is Google Sheets' set of formula-trigger
    // characters -- setNumberFormat('@') alone stops Sheets auto-typing
    // a value as a number/date, but does NOT stop a leading '=' from
    // still being parsed as a formula (confirmed empirically: a plain-
    // text-formatted cell still evaluated "=1+1" to 2). Prepending a
    // literal apostrophe is the one thing that reliably blocks formula
    // parsing for all four trigger characters -- Sheets strips the
    // apostrophe back off on write, storing the exact original string
    // (confirmed empirically, matches the classic OWASP CSV/Spreadsheet-
    // injection mitigation).
    if (/^[=+\-@]/.test(value)) value = "'" + value;
  }
  range.setValue(value);
}

/**
 * appendRow() doesn't allow pre-formatting the row it's about to create,
 * so this computes the target row directly and writes each value through
 * setSafeValue_ instead, keeping every string value safe from formula
 * injection while leaving non-string values (Date, number) with their
 * normal format.
 */
function appendRowSafely_(sheet, values) {
  var rowNum = sheet.getLastRow() + 1;
  for (var i = 0; i < values.length; i++) {
    setSafeValue_(sheet.getRange(rowNum, i + 1), values[i]);
  }
}

function escapeHtml_(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Fixed-name tabs (Merchants, Logs, etc.) -- throws if missing. */
function getSheet_(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name + '. Run setupWorkbook() first.');
  return sheet;
}

/** Card batch tabs (e.g. "2026", "TEST") -- returns null if missing, doesn't throw. */
function getBatchSheet_(batchName) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(batchName);
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ONE-TIME SETUP. Run this manually from the Apps Script editor
 * (select this function in the toolbar dropdown, click Run) before
 * anything else on a BRAND NEW workbook — or, on the existing live
 * workbook, just to pick up a newly-added tab schema: it only fills in
 * headers for a tab it creates fresh, so re-running it is always safe
 * and never touches an existing tab's data. Creates the fixed tabs
 * (Merchants, Verifications, Logs, Settings, RurokIssues) with correct
 * headers if they don't already exist. Note it will NOT retroactively
 * add a new column to an existing tab that already has rows (e.g. the
 * merchant_name_selected column added to Verifications by hand, or
 * RurokIssues' pdf_url column added in v11 — see the SETUP notes at
 * the top of this file for that one).
 *
 * Does NOT create any card batch tab -- those are per-batch (e.g.
 * "2026", "TEST") and must be added manually, see the SETUP notes at
 * the top of this file.
 */
function setupWorkbook() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var schemas = {
    Merchants: ['merchant_id', 'business_name', 'category', 'offer_details', 'contact_person', 'contact_number', 'facebook_url', 'website_url', 'logo_file_id', 'address', 'moa_start_date', 'status', 'date_added'],
    Verifications: ['timestamp', 'card_number', 'result', 'merchant_name_selected'],
    Logs: ['timestamp', 'action', 'detail'],
    Settings: ['key', 'value'],
    RurokIssues: ['flipbook_id', 'date_added', 'label', 'heyzine_url', 'thumbnail_url', 'status', 'needs_review', 'pdf_url']
  };
  Object.keys(schemas).forEach(function (sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(schemas[sheetName]);
      sheet.setFrozenRows(1);
    }
  });
  Logger.log('setupWorkbook complete. Sheets: ' + Object.keys(schemas).join(', '));
  Logger.log('Next: manually add a card batch tab (e.g. "TEST") - see the SETUP notes at the top of this file.');
}

/**
 * Convenience helper for creating a new card batch tab with the
 * correct header row. Edit the batchName variable below and run this
 * function manually (select createBatchTabExample in the toolbar
 * dropdown, click Run) - or just create the tab by hand in the Sheets
 * UI, which is equally fine.
 */
function createBatchTabExample() {
  var batchName = 'TEST'; // change this, e.g. to '2026', then run
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(batchName);
  if (!sheet) {
    sheet = ss.insertSheet(batchName);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['card_number', 'cardholder_name', 'status', 'registered_date', 'expiry_date', 'registered_by']);
    sheet.setFrozenRows(1);
  }
  Logger.log('Batch tab "' + batchName + '" ready. Now add one UNREGISTERED row per pre-printed card number.');
}

/**
 * ONE-TIME AUTHORIZATION HELPER. Run this manually from the editor
 * (select authorizeExternalRequest_ in the toolbar dropdown, click Run)
 * exactly once, ever, per Apps Script project. It does nothing useful on
 * its own -- it just forces Google to show the interactive OAuth consent
 * screen for the script.external_request scope, which verifyIdToken_
 * (and, as of v10, syncRurokIssues) needs at request time but a
 * background Web App call can't prompt for itself. Already done for the
 * live project as of v7 -- kept here unchanged in case this script is
 * ever redeployed from scratch. Safe to run again; a no-op after the
 * first successful run.
 */
function authorizeExternalRequest_() {
  var resp = UrlFetchApp.fetch('https://www.googleapis.com/oauth2/v1/certs', { muteHttpExceptions: true });
  Logger.log('Authorization OK. HTTP ' + resp.getResponseCode());
}

/**
 * ONE-TIME AUTHORIZATION HELPER (v12). Run this manually from the editor
 * exactly once, the same way as authorizeExternalRequest_ above:
 * opening a second, non-bound spreadsheet by ID (getServiceProjects_)
 * needs a broader Sheets scope than this script had under v11, which a
 * background Web App call can't self-grant. Safe to re-run; a no-op
 * after the first successful run.
 */
function authorizeServiceProjectsAccess_() {
  var name = SpreadsheetApp.openById(CONFIG.SERVICE_PROJECTS_SHEET_ID).getName();
  Logger.log('Authorization OK. Opened spreadsheet: ' + name);
}
