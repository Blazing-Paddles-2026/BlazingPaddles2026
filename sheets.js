/* ============================================================
 * Blazing Paddles 2026 — Google Sheets read/write helper
 * ============================================================
 *
 * Reads use the public CSV export endpoint (no auth needed,
 * works while the sheet is set to "Anyone with the link can view").
 *
 * Writes use a Google Apps Script web app deployed by Diedra
 * with execute-as-me + anyone access. See SETUP-APPSSCRIPT.md
 * in this repo for the install steps.
 *
 * If APPS_SCRIPT_URL is left empty, writes are queued in a
 * local in-memory buffer and a friendly message tells the user
 * to set up the webhook. Reads still work either way.
 */
(function () {
  'use strict';

  // ── Configuration ─────────────────────────────────────────
  const SHEET_ID = '1wN4quNrhL-0Kp-YUG-dkjf3J0Vnpaaw2XSKGrpsjf00';
  // Apps Script web app URL — replace with your deployment URL.
  // See SETUP-APPSSCRIPT.md for the 5-minute install.
  let APPS_SCRIPT_URL = '';
  try {
    const stored = window.localStorage && localStorage.getItem('bp_apps_script_url');
    if (stored) APPS_SCRIPT_URL = stored;
  } catch (e) { /* ignore */ }

  // GIDs (sheet IDs) for each tab — used by the CSV export URL.
  // Update these if you ever delete/recreate a tab.
  const GIDS = {
    'Donation Tracker': '508954391',
    'Raffle Inventory': '154523109',
    'Sponsor Pipeline': '379467048',
    'Instructions':     '668182943',
    'Log':              '2100488589',
    'Team':             '395121617',
  };

  // ── CSV → JSON parser (RFC 4180 compliant enough) ────────
  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', i = 0, inQuotes = false;
    while (i < text.length) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
        if (c === '"') { inQuotes = false; i++; continue; }
        field += c; i++; continue;
      }
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ',') { row.push(field); field = ''; i++; continue; }
      if (c === '\r') { i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += c; i++;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function rowsToObjects(rows) {
    if (!rows.length) return [];
    const headers = rows[0].map(h => h.trim());
    return rows.slice(1)
      .filter(r => r.some(cell => cell && cell.trim()))
      .map(r => {
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = (r[idx] || '').trim(); });
        return obj;
      });
  }

  // ── Public API ────────────────────────────────────────────
  async function readSheet(sheetName) {
    const gid = GIDS[sheetName];
    if (!gid) throw new Error('Unknown sheet: ' + sheetName);
    const url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
                '/export?format=csv&gid=' + gid + '&t=' + Date.now();
    const resp = await fetch(url, { credentials: 'omit' });
    if (!resp.ok) throw new Error('Failed to load ' + sheetName + ': HTTP ' + resp.status);
    const text = await resp.text();
    return rowsToObjects(parseCSV(text));
  }

  async function appendRow(sheetName, row) {
    if (!APPS_SCRIPT_URL) {
      const msg = 'Writes are not configured yet. Open the dashboard Settings page and paste your Apps Script Web App URL. Your row was not saved.';
      throw new Error(msg);
    }
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      // Apps Script web apps that allow "Anyone" expect text/plain to avoid
      // a CORS preflight, then parse JSON server-side.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'append', sheet: sheetName, row: row }),
    });
    if (!resp.ok) throw new Error('Webhook failed: HTTP ' + resp.status);
    const j = await resp.json().catch(() => ({ ok: true }));
    if (j && j.error) throw new Error(j.error);
    return j;
  }

  async function updateRow(sheetName, matchColumn, matchValue, updates) {
    if (!APPS_SCRIPT_URL) {
      throw new Error('Writes are not configured yet — see Settings.');
    }
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'update',
        sheet: sheetName,
        matchColumn: matchColumn,
        matchValue: matchValue,
        updates: updates,
      }),
    });
    if (!resp.ok) throw new Error('Webhook failed: HTTP ' + resp.status);
    const j = await resp.json().catch(() => ({ ok: true }));
    if (j && j.error) throw new Error(j.error);
    return j;
  }

  function setWebhookUrl(url) {
    APPS_SCRIPT_URL = (url || '').trim();
    try {
      if (APPS_SCRIPT_URL) localStorage.setItem('bp_apps_script_url', APPS_SCRIPT_URL);
      else localStorage.removeItem('bp_apps_script_url');
    } catch (e) { /* ignore */ }
  }

  function getWebhookUrl() { return APPS_SCRIPT_URL; }

  function publicSheetUrl(sheetName) {
    const gid = GIDS[sheetName];
    if (!gid) return 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit';
    return 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit#gid=' + gid;
  }

  window.BPSheets = {
    read: readSheet,
    append: appendRow,
    update: updateRow,
    setWebhookUrl: setWebhookUrl,
    getWebhookUrl: getWebhookUrl,
    publicSheetUrl: publicSheetUrl,
    SHEET_ID: SHEET_ID,
  };
})();
