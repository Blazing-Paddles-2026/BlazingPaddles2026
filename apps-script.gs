/**
 * Blazing Paddles 2026 — Dashboard Webhook
 * Deploy as a Web App, executes as me, accessible by anyone.
 *
 * Accepts JSON via POST. Supported actions:
 *   { action: "append", sheet: "<tab>", row: { Header: value, ... } }
 *   { action: "update", sheet: "<tab>", matchColumn: "Business",
 *     matchValue: "Acme Inc", updates: { Status: "Confirmed", ... } }
 *
 * Returns { ok: true } or { error: "..." }.
 */

function doPost(e) {
  var out = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(body.sheet);
    if (!sheet) throw new Error('Unknown sheet: ' + body.sheet);

    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    if (body.action === 'append') {
      var row = headers.map(function (h) {
        var v = body.row && Object.prototype.hasOwnProperty.call(body.row, h)
                ? body.row[h] : '';
        return v == null ? '' : v;
      });
      sheet.appendRow(row);
      return out.setContent(JSON.stringify({ ok: true, appended: row }));
    }

    if (body.action === 'update') {
      var matchIdx = headers.indexOf(body.matchColumn);
      if (matchIdx < 0) throw new Error('matchColumn not found: ' + body.matchColumn);
      var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
      var updated = 0;
      for (var i = 0; i < data.length; i++) {
        if (String(data[i][matchIdx]).trim() === String(body.matchValue).trim()) {
          var rowNum = i + 2;
          Object.keys(body.updates).forEach(function (k) {
            var colIdx = headers.indexOf(k);
            if (colIdx >= 0) sheet.getRange(rowNum, colIdx + 1).setValue(body.updates[k]);
          });
          updated++;
        }
      }
      return out.setContent(JSON.stringify({ ok: true, updated: updated }));
    }

    throw new Error('Unknown action: ' + body.action);
  } catch (err) {
    return out.setContent(JSON.stringify({ error: String(err && err.message || err) }));
  }
}

function doGet() {
  return ContentService.createTextOutput(
    'Blazing Paddles webhook — POST JSON to this URL.'
  ).setMimeType(ContentService.MimeType.TEXT);
}
