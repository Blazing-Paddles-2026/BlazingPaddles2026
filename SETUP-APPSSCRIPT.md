# Dashboard Backend Setup — 5 minutes, one time

The dashboard reads from your Google Sheet automatically.
To **write** new sponsors, raffle items, and log entries from the dashboard
back into the Sheet, you need to install a tiny Google Apps Script on the
Sheet itself.

This is free, runs on your own Google account, and gives you a private
webhook URL that the dashboard uses.

## Steps

1. Open the dashboard's live Google Sheet:
   [Blazing Paddles 2026 Donation Tracker](https://docs.google.com/spreadsheets/d/1wN4quNrhL-0Kp-YUG-dkjf3J0Vnpaaw2XSKGrpsjf00/edit)

2. From the menu, click **Extensions → Apps Script**. A new tab opens.

3. Delete anything that's in the editor and paste in the contents of
   `apps-script.gs` from this repo. (It's a single file, about 50 lines.)

4. Click the **Save** disk icon (or Ctrl/Cmd + S). Name the project
   "Blazing Paddles Backend".

5. Click **Deploy → New deployment**.
   - Click the gear icon next to "Select type" and pick **Web app**.
   - Description: `Blazing Paddles dashboard writer`
   - Execute as: **Me** (your own account)
   - Who has access: **Anyone**
   - Click **Deploy**.

6. Google will ask you to authorize. Approve. (It's your own script
   accessing your own Sheet — you're giving it permission to write rows.)

7. Copy the **Web app URL** that appears. It looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

8. Open the dashboard's **Settings** page
   (https://dashboard.roundrockfirefoundation.org/settings.html).
   Paste the URL into the Apps Script Webhook field and click Save.

Done. The dashboard now writes to your Sheet in real time.

## What this means for the committee

- Anyone on the committee uses the dashboard normally — no logins.
- All writes flow through your Apps Script, which runs as you, which
  writes to your Sheet.
- If you ever want to turn writes off, just delete the deployment in
  Apps Script. The dashboard reads (sponsor table, raffle table) will
  keep working.
