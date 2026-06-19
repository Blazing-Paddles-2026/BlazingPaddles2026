/* ============================================================
 * Blazing Paddles 2026 — Google Sheets read/write helper
 * ============================================================
 *
 * Both reads and writes go through the committee's Apps Script
 * web app, which runs as Diedra and has full access to the Sheet.
 * The Sheet itself can stay private.
 *
 * If the sheet is ever set to "Anyone with the link can view",
 * reads can also work directly via the CSV export (fallback).
 *
 * One-time install: see SETUP-APPSSCRIPT.md.
 */
(function () {
  'use strict';

  // ── Configuration ─────────────────────────────────────────
  const SHEET_ID = '1wN4quNrhL-0Kp-YUG-dkjf3J0Vnpaaw2XSKGrpsjf00';
  // Apps Script web app URL — empty until Diedra deploys + pastes.
  let APPS_SCRIPT_URL = '';
  try {
    const stored = window.localStorage && localStorage.getItem('bp_apps_script_url');
    if (stored) APPS_SCRIPT_URL = stored;
  } catch (e) { /* ignore */ }

  // GIDs for each tab — used only by the CSV public-fallback path.
  const GIDS = {
    'Donation Tracker': '508954391',
    'Raffle Inventory': '154523109',
    'Auction Inventory': '154523109',
    'Sponsor Pipeline': '379467048',
    'Instructions':     '668182943',
    'Log':              '2100488589',
    'Team':             '395121617',
  };

  const FALLBACK_TEAM = [
    { Name: 'Wylie Brownell', Role: 'Committee member' },
    { Name: 'Diedra Brownell', Role: 'Foundation lead · invoices · coordination' },
    { Name: 'Micheal Boyd', Role: 'Committee member' },
    { Name: 'Adrienne Boyd', Role: 'Committee member' },
    { Name: 'Jon Talley', Role: 'Committee member' },
    { Name: 'Sarah Talley', Role: 'Committee member' },
    { Name: 'John Collins', Role: 'Committee member' },
    { Name: 'Rachel Collins', Role: 'Committee member' },
    { Name: 'Ricky Virgne', Role: 'Committee member' },
    { Name: 'That Putnam', Role: 'Committee member' },
    { Name: 'Cara Putnam', Role: 'Committee member' },
    { Name: 'Steven Puckett', Role: 'Committee member' },
    { Name: 'Lauren Monroe', Role: 'Gameplay and Tejas coordination' },
    { Name: 'Seth Monroe', Role: 'Gameplay and Tejas coordination' },
    { Name: 'Aaron Campbell', Role: 'Committee member' },
    { Name: 'Emily Campbell', Role: 'Committee member' }
  ];

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

  // ── Read via webhook (preferred) ──────────────────────────
  async function readViaWebhook(sheetName) {
    if (!APPS_SCRIPT_URL) throw new Error('NO_WEBHOOK');
    const url = APPS_SCRIPT_URL + '?action=read&sheet=' + encodeURIComponent(sheetName) + '&t=' + Date.now();
    const resp = await fetch(url, { method: 'GET', mode: 'cors' });
    if (!resp.ok) throw new Error('Webhook read failed: HTTP ' + resp.status);
    const j = await resp.json();
    if (j.error) throw new Error(j.error);
    return j.rows || [];
  }

  // ── Read via public CSV (fallback when sheet is public) ──
  async function readViaCSV(sheetName) {
    const gid = GIDS[sheetName];
    if (!gid) throw new Error('Unknown sheet: ' + sheetName);
    const url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
                '/export?format=csv&gid=' + gid + '&t=' + Date.now();
    const resp = await fetch(url, { credentials: 'omit' });
    if (!resp.ok) throw new Error('CSV read failed: HTTP ' + resp.status);
    const text = await resp.text();
    if (text.indexOf('<!DOCTYPE') === 0) throw new Error('Sheet is private — open Settings to configure the webhook.');
    return rowsToObjects(parseCSV(text));
  }

  async function readSheet(sheetName) {
    // Try webhook first if configured
    if (APPS_SCRIPT_URL) {
      try { return await readViaWebhook(sheetName); }
      catch (e) {
        // Fall through to CSV attempt
      }
    }
    try {
      return await readViaCSV(sheetName);
    } catch (e) {
      if (sheetName === 'Team') return FALLBACK_TEAM.slice();
      throw e;
    }
  }

  // ── Writes ────────────────────────────────────────────────
  async function appendRow(sheetName, row) {
    if (!APPS_SCRIPT_URL) {
      throw new Error('Writes are not configured yet. Open Settings and paste your Apps Script Web App URL.');
    }
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      // Use text/plain so Apps Script "Anyone" web apps avoid the CORS
      // preflight; Apps Script parses the JSON body server-side.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'append', sheet: sheetName, row: row }),
    });
    if (!resp.ok) throw new Error('Webhook failed: HTTP ' + resp.status);
    const j = await resp.json().catch(() => ({ ok: true }));
    if (j && j.error) throw new Error(j.error);
    return j;
  }

  async function sendSponsorEmail(opts) {
    if (!APPS_SCRIPT_URL) {
      throw new Error('Email sending is not configured yet. Open Settings and paste your Apps Script Web App URL.');
    }
    if (!opts || !opts.to || !opts.subject || !opts.body) {
      throw new Error('to, subject, and body are required.');
    }
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'send_email',
        to: opts.to,
        subject: opts.subject,
        body: opts.body,
        attachUrl: opts.attachUrl || '',
        attachName: opts.attachName || '',
        sentBy: opts.sentBy || '',
        scriptUsed: opts.scriptUsed || '',
      }),
    });
    if (!resp.ok) throw new Error('Send failed: HTTP ' + resp.status);
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
    sendSponsorEmail: sendSponsorEmail,
    setWebhookUrl: setWebhookUrl,
    getWebhookUrl: getWebhookUrl,
    publicSheetUrl: publicSheetUrl,
    SHEET_ID: SHEET_ID,
  };
})();
