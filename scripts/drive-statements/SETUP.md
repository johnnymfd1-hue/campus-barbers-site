# Drive Statements to Spreadsheet – Setup

This script scans your Google Drive for files whose names start with
**"statement"** (case-insensitive) between **February 2019 and February 2026**,
classifies them as **Personal Visa** or **Business**, and writes everything
into a new Google Sheets spreadsheet with three tabs.

---

## Prerequisites

- Node.js 18+
- A Google account with Drive access
- Google Cloud project with Drive API and Sheets API enabled

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services > Library**
4. Enable **Google Drive API**
5. Enable **Google Sheets API**

## Step 2: Create OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. If prompted, configure the **OAuth consent screen** first:
   - Choose **External** user type
   - Fill in required fields (app name, email)
   - Add scopes: `drive.readonly` and `spreadsheets`
   - Add your email as a test user
4. Back on Credentials, select **Desktop app** as the application type
5. Download the JSON file
6. Rename it to `credentials.json`
7. Place it in `scripts/drive-statements/credentials.json`

## Step 3: Install Dependencies

```bash
npm install
```

The `googleapis` package should already be in package.json.

## Step 4: Run the Script

```bash
# Dry run – see what files would be found without creating a spreadsheet
node scripts/drive-statements/index.js --dry-run

# Live run – find files and create the Google Sheets spreadsheet
node scripts/drive-statements/index.js
```

On the first run, a URL will print to the console. Open it in your browser,
sign in with your Google account, and grant the requested permissions. The
token is saved locally in `token.json` for future runs.

---

## How Classification Works

Files are sorted into categories based on filename keywords:

| Category        | Keywords in filename                                        |
|-----------------|-------------------------------------------------------------|
| **Business**    | business, biz, corp, llc, inc, commercial, company, campus barber |
| **Personal Visa** | personal, individual, visa                                |
| **Uncategorized** | Anything else – you can re-categorize in the spreadsheet  |

### Tips for Best Results

- Name your files clearly, e.g.:
  - `Statement - Personal Visa - March 2023.pdf`
  - `Statement Business Account - Jan 2024.pdf`
- Files that don't start with "statement" will be skipped
- The date filter uses the file's **last modified date** in Google Drive

---

## Output

The script creates a Google Sheets spreadsheet with three tabs:

1. **All Statements** – Every file found, sorted by category then date
2. **Personal Visa** – Only personal visa statement files
3. **Business** – Only business statement files

Each row contains:

| Column    | Description                              |
|-----------|------------------------------------------|
| Category  | Personal Visa / Business / Uncategorized |
| File Name | Original filename from Drive             |
| File Type | MIME type (e.g., application/pdf)        |
| Size      | Human-readable file size                 |
| Created   | File creation date                       |
| Modified  | Last modified date                       |
| Folder    | Parent folder name in Drive              |
| Link      | Direct link to open the file in Drive    |

---

## Security Notes

- `credentials.json` and `token.json` are in `.gitignore` – they never get committed
- The script only requests **read-only** access to Drive
- The script requests **write** access to Sheets (to create the spreadsheet)
- Tokens are stored locally and can be revoked at
  [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
