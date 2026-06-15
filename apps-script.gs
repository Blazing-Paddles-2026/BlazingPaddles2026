/**
 * Blazing Paddles 2026 — Dashboard Webhook
 * Deploy as a Web App, executes as me, accessible by anyone.
 *
 * Actions:
 *   GET  ?action=read&sheet=<tab>          → returns array of row objects
 *   POST { action: "read",   sheet: "<tab>" }
 *   POST { action: "append", sheet: "<tab>", row: {Header: value, ...} }
 *   POST { action: "update", sheet: "<tab>", matchColumn: "Business",
 *          matchValue: "Acme", updates: {Status: "Confirmed"} }
 *   POST { action: "send_email", to, subject, body, attachUrl, attachName, sentBy, scriptUsed }
 *
 * Returns { ok: true } or { error: "..." }.
 */

// ── CONFIG ───────────────────────────────────────────────────────────
// The "From" address every outreach email is sent from.
// MUST be a verified send-as alias on the Apps Script owner's Gmail.
var SEND_FROM_NAME  = 'Round Rock Fire Foundation';
var SEND_FROM_EMAIL = 'info@roundrockfirefoundation.org';

// Optional bcc on every send so Diedra has a copy
var BCC_EVERY_SEND  = '';   // e.g. 'diedrabrownell@gmail.com'

// Outreach Log tab name
var OUTREACH_LOG_SHEET = 'Outreach Log';
// ─────────────────────────────────────────────────────────────────────


function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _readSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Unknown sheet: ' + sheetName);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2) return [];
  var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = data.shift().map(function (h) { return String(h).trim(); });
  return data
    .filter(function (r) { return r.some(function (c) { return c !== '' && c != null; }); })
    .map(function (r) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = r[i] == null ? '' : String(r[i]); });
      return obj;
    });
}

function _logOutreach(row) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(OUTREACH_LOG_SHEET);
    if (!sheet) {
      // Create the log tab on the fly if missing
      sheet = ss.insertSheet(OUTREACH_LOG_SHEET);
      sheet.getRange(1, 1, 1, 7).setValues([['Timestamp','Sent By','To','Subject','Flyer Attached','Script Used','Status']]);
    }
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    sheet.appendRow(headers.map(function (h) { return row[h] || ''; }));
  } catch (e) {
    // Logging is best-effort; don't fail the send if logging fails
  }
}

function _sendEmail(body) {
  if (!body.to)      throw new Error('Missing recipient email (to).');
  if (!body.subject) throw new Error('Missing subject.');
  if (!body.body)    throw new Error('Missing email body.');

  var options = {
    name: SEND_FROM_NAME,
    from: SEND_FROM_EMAIL,
    replyTo: SEND_FROM_EMAIL,
    htmlBody: undefined,
  };

  // Optional bcc
  if (BCC_EVERY_SEND) options.bcc = BCC_EVERY_SEND;

  // Convert plain-text body to a light-touch HTML version so paragraph
  // breaks survive rendering in Gmail / Outlook, while keeping the
  // plain-text body as fallback.
  var htmlBody = body.body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>');
  options.htmlBody = '<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#222"><p>' + htmlBody + '</p></div>';

  // Attach the flyer if provided. attachUrl should be a publicly
  // reachable HTTPS URL — e.g. the GitHub-Pages-hosted flyer image.
  if (body.attachUrl) {
    try {
      var resp = UrlFetchApp.fetch(body.attachUrl, { muteHttpExceptions: true });
      if (resp.getResponseCode() === 200) {
        var blob = resp.getBlob();
        if (body.attachName) blob.setName(body.attachName);
        options.attachments = [blob];
      }
    } catch (e) {
      // If fetching the attachment fails, send the email anyway
      // (the recipient will still get the script + sponsor info)
    }
  }

  GmailApp.sendEmail(body.to, body.subject, body.body, options);

  // Log the send
  _logOutreach({
    'Timestamp': new Date().toISOString().slice(0, 19).replace('T', ' '),
    'Sent By':   body.sentBy   || '(unknown committee member)',
    'To':        body.to,
    'Subject':   body.subject,
    'Flyer Attached': body.attachName || (body.attachUrl ? body.attachUrl : 'none'),
    'Script Used':    body.scriptUsed || '',
    'Status':    'Sent',
  });

  return { ok: true, sent: true, from: SEND_FROM_EMAIL, to: body.to };
}

function _doAction(body) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (body.action === 'read') {
    return _json({ ok: true, rows: _readSheet(body.sheet) });
  }

  if (body.action === 'send_email') {
    return _json(_sendEmail(body));
  }

  var sheet = ss.getSheetByName(body.sheet);
  if (!sheet) throw new Error('Unknown sheet: ' + body.sheet);
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  if (body.action === 'append') {
    var row = headers.map(function (h) {
      return body.row && Object.prototype.hasOwnProperty.call(body.row, h)
        ? body.row[h] : '';
    });
    sheet.appendRow(row);
    return _json({ ok: true, appended: row });
  }

  if (body.action === 'update') {
    var matchIdx = headers.indexOf(body.matchColumn);
    if (matchIdx < 0) throw new Error('matchColumn not found: ' + body.matchColumn);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return _json({ ok: true, updated: 0 });
    var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var updated = 0;
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][matchIdx]).trim() === String(body.matchValue).trim()) {
        var rowNum = i + 2;
        Object.keys(body.updates).forEach(function (k) {
          var c = headers.indexOf(k);
          if (c >= 0) sheet.getRange(rowNum, c + 1).setValue(body.updates[k]);
        });
        updated++;
      }
    }
    return _json({ ok: true, updated: updated });
  }

  throw new Error('Unknown action: ' + body.action);
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    return _doAction(body);
  } catch (err) {
    return _json({ error: String(err && err.message || err) });
  }
}

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    if (params.action === 'read' && params.sheet) {
      return _json({ ok: true, rows: _readSheet(params.sheet) });
    }
    return ContentService.createTextOutput(
      'Blazing Paddles webhook ready. Use POST or ?action=read&sheet=<name>.'
    ).setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return _json({ error: String(err && err.message || err) });
  }
}

/**
 * Run this once manually from the Apps Script editor to authorize
 * Gmail sending. Triggers the consent prompt for GmailApp.
 */
function authorizeGmailScope() {
  GmailApp.getInboxUnreadCount();
}
