# Dashboard Backend Setup — One-Time, ~10 Minutes Total

This setup gives the dashboard at `dashboard.roundrockfirefoundation.org`
three superpowers, all running on your own Google Workspace account:

1. **Read** the live Sponsor / Raffle / Log / Team data from your Sheet
2. **Write** new sponsors and raffle items into the Sheet from the dashboard
3. **Send sponsor emails from `info@roundrockfirefoundation.org`** with the
   flyer auto-attached, no committee member access to your inbox needed

All free. No new vendors, no API keys, no DNS records.

---

## Steps

### 1. Open the script editor

Open the live Google Sheet:
[Blazing Paddles 2026 Donation Tracker](https://docs.google.com/spreadsheets/d/1wN4quNrhL-0Kp-YUG-dkjf3J0Vnpaaw2XSKGrpsjf00/edit)

Menu: **Extensions → Apps Script**. A new tab opens with a code editor.

### 2. Paste the script

Delete everything in the editor and paste in the contents of
[`apps-script.gs`](./apps-script.gs) from this repo.

Save: disk icon or Ctrl/Cmd + S. Name it `Blazing Paddles Backend`.

### 3. Authorize Gmail send (one-time)

In the editor's function dropdown (top toolbar), pick **`authorizeGmailScope`**
and click **Run**. Google will prompt you to review permissions. Approve
**Send email as you** — this is what lets the dashboard send from
`info@roundrockfirefoundation.org`.

If you don't see the prompt: Settings (gear icon) → check
"Show 'appsscript.json' manifest file" — then Run again.

### 4. Deploy as a web app

Click **Deploy → New deployment** (top right).

- Click the gear icon next to "Select type" → pick **Web app**.
- Description: `Blazing Paddles dashboard webhook`
- **Execute as:** Me (`info@roundrockfirefoundation.org`)
- **Who has access:** Anyone
- Click **Deploy**.

Google asks you to authorize the script's permissions. Approve.

### 5. Copy the Web app URL

It looks like: `https://script.google.com/macros/s/AKfycb.../exec`

### 6. Paste it into the dashboard

Open https://dashboard.roundrockfirefoundation.org/settings.html → paste
the URL → click Save.

Refresh the dashboard. Live data loads. Try sending a test email from
the playbook page to your own address to confirm the From shows up as
`info@roundrockfirefoundation.org`.

---

## If you ever update the script

After editing `apps-script.gs` (e.g. adding a feature), **re-deploy**:

1. Apps Script editor → Deploy → **Manage deployments**
2. Click the pencil icon on the existing deployment
3. Version → **New version**
4. Click Deploy
5. The URL stays the same — no need to update the dashboard

---

## Auction package tracker

The auction page (`raffle.html`) lets each team claim a package, check off
the six build items, and note swaps — and it saves live for everyone. It does
**not** use this Google Sheet; it persists to a shared Supabase table on its
own and needs no setup here. Nothing to configure.

---

## Configuration knobs

Inside `apps-script.gs` near the top:

```javascript
var SEND_FROM_NAME  = 'Round Rock Fire Foundation';
var SEND_FROM_EMAIL = 'info@roundrockfirefoundation.org';
var BCC_EVERY_SEND  = '';   // set to your personal email to BCC every send
```

To get a copy of every outreach email in your personal inbox, set
`BCC_EVERY_SEND = 'diedrabrownell@gmail.com';` and re-deploy.

---

## What the script does

- `read` — returns all rows of a Sheet tab as JSON
- `append` — appends a row to a tab
- `update` — updates rows matching a column value
- `send_email` — sends an email from `info@roundrockfirefoundation.org`
  with optional flyer attachment, and logs the send to the **Outreach Log**
  tab automatically

Nothing else. It can't delete rows, access other Sheets, or read your
inbox. It can only touch this one Sheet and send email as you.

---

## Common problems

- **"Send failed: Service invoked too many times"** — You've hit the daily
  Gmail send quota for Workspace (1,500/day). This is way more than committee
  outreach uses; the limit resets at midnight.
- **"Send failed: Mail service not enabled"** — Workspace admin has Gmail
  send turned off for your account. Re-enable it.
- **"Send failed: Invalid from address"** — `info@roundrockfirefoundation.org`
  isn't the primary on this Apps Script's owner account. The script must be
  deployed (step 4) with "Execute as: Me" while you're signed into the
  `info@` Workspace account, OR add `info@` as a send-as alias in your Gmail
  Settings → Accounts.
