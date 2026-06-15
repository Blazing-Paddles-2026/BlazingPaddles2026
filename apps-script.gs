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
 *
 * The dashboard's sheets.js uses POST for reads too, so the sheet
 * can stay private and writes are gated by your own Apps Script
 * deployment (you control who has access).
 */

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

function _doAction(body) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (body.action === 'read') {
    return _json({ ok: true, rows: _readSheet(body.sheet) });
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
