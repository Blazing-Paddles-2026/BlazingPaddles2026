# Dashboard Backend Setup — One-time, ~5 minutes

This one-time setup lets the dashboard at
`dashboard.roundrockfirefoundation.org` read AND write to your private
Google Sheet — without making the Sheet public.

Everything runs on **your own Google account**. Free.

## What you're installing

A tiny script (about 100 lines) that lives inside your Google Sheet
and gives the dashboard a private URL it can read and write through.

## Steps

1. **Open the Sheet:**
   [Blazing Paddles 2026 Donation Tracker](https://docs.google.com/spreadsheets/d/1wN4quNrhL-0Kp-YUG-dkjf3J0Vnpaaw2XSKGrpsjf00/edit)

2. **Menu:** Extensions → Apps Script. A new tab opens with a code editor.

3. **Delete everything** that's in the editor and paste in the contents of
   [`apps-script.gs`](./apps-script.gs) from this repo.

4. **Save:** Click the disk icon (or Ctrl/Cmd + S). Name it
   `Blazing Paddles Backend`.

5. **Deploy:** Click **Deploy → New deployment** (top right).
   - Click the gear icon next to "Select type" → pick **Web app**.
   - Description: `Blazing Paddles dashboard webhook`
   - **Execute as:** Me (your own account)
   - **Who has access:** Anyone
   - Click **Deploy**.

6. Google asks you to authorize. Approve. (You're authorizing your own
   script to read and write your own Sheet — perfectly safe.)

7. **Copy the Web app URL.** It looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

8. **Open the dashboard's Settings page:**
   https://dashboard.roundrockfirefoundation.org/settings.html
   - Paste the URL into the Apps Script Webhook field
   - Click Save

Done. Refresh the Sponsor or Raffle pages — live data loads.

## Sharing this with the committee

You only need to install this once. After you save the webhook URL,
the dashboard sends every committee member's writes through your
webhook. They use the dashboard without any setup or login.

If you want everyone's browser to pre-load the webhook URL (so they
never see the Settings prompt), I can wire that into the page directly —
just ask.

## If anything breaks

- **"Writes are not configured yet"** — your URL didn't save. Try Settings again.
- **"Webhook failed: HTTP 401"** — the deployment is missing "Anyone access".
  Re-deploy with Who-has-access set to Anyone.
- **"Webhook failed: HTTP 403"** — common after Google revokes auth.
  In Apps Script: Deploy → Manage deployments → edit → Re-deploy.
- **CORS errors** — you used `application/json` instead of `text/plain`.
  The dashboard uses text/plain automatically; just don't change it.

## What the script does

- `GET ?action=read&sheet=<tab>` returns all rows of a tab as JSON
- `POST {action: "append", sheet, row}` appends a row
- `POST {action: "update", sheet, matchColumn, matchValue, updates}` updates matching rows

Nothing else. It can't delete rows, can't access other Sheets, can't
send email. It only touches the Donation Tracker spreadsheet.
