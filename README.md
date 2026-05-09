# Blazing Paddles 2026 — Command Center

Committee dashboard for the Round Rock Fire Foundation's Blazing Paddles pickleball tournament fundraiser.

**Event:** Saturday, October 10, 2026  
**Location:** Tejas Pickleball Club, Georgetown, Texas

---

## What's Included

This repository contains the complete static website for the committee command center. It includes:

- **Sponsor Playbook** — Outreach scripts (email, text, voicemail, follow-up, thank-you), sponsorship tiers, and sponsor tracker
- **Raffle Playbook** — Tournament-day raffle rules and prize procurement tracker (opens June 1)
- **Committee Goals** — Six goal areas with specific action items
- **Team List** — All 16 committee members with availability toggle
- **Contacts** — Key phone numbers and emails
- **Dashboard Briefing** — Preserved RRFF team visual brief (2 pages)

## How to Deploy on GitHub Pages

### Step 1: Create a GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click **New Repository** (green button)
3. Name it `blazing-paddles-2026`
4. Make it **Public**
5. **Do NOT** initialize with README, .gitignore, or license (this repo already has them)
6. Click **Create repository**

### Step 2: Upload These Files

**Option A — Web Upload (Easiest):**
1. On your new repo page, click **uploading an existing file**
2. Drag and drop ALL files from this folder:
   - `index.html`
   - `assets/` (folder with JS/CSS)
   - `images/` (folder with logos/images)
   - `README.md`
   - `.gitignore`
3. Click **Commit changes**

**Option B — Command Line:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/blazing-paddles-2026.git
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. In your repo, click **Settings** (top tab)
2. In the left sidebar, click **Pages**
3. Under "Source", select **Deploy from a branch**
4. Under "Branch", select `main` and folder `/ (root)`
5. Click **Save**
6. Wait 2-3 minutes
7. Your site will be live at: `https://blazing-paddles-2026.github.io/`

### Step 4: Embed in Squarespace

1. In Squarespace, add a new page (e.g., "Command Center")
2. Add a **Code Block**
3. Paste:

```html
<div style="width:100%;">
  <iframe src="https://blazing-paddles-2026.github.io/" 
    style="width:100%;height:90vh;border:none;border-radius:8px;" 
    title="Blazing Paddles Command Center">
  </iframe>
</div>
```

4. Save and publish

---

## Committee

Wylie Brownell, Diedra Brownell, Micheal Boyd, Adrienne Boyd, Jon Talley, Sarah Talley, John Collins, Rachel Collins, Cara Putnam, That Putnam, Sylvia Densmore, Andrew Densmore, Lauren Monroe, Seth Monroe, Aaron Campbell, Emily Campbell

## Contact

**Round Rock Fire Foundation**  
info@roundrockfirefoundation.org  
(512) 967-1007
