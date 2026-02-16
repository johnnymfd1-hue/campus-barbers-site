#!/usr/bin/env node

/**
 * Drive Statements to Spreadsheet
 *
 * Scans Google Drive for files whose names start with "statement"
 * (case-insensitive) within the date range February 2019 – February 2026.
 * Categorizes them as Personal Visa or Business based on filename keywords,
 * then writes the results into a new Google Sheets spreadsheet.
 *
 * Usage:
 *   node scripts/drive-statements/index.js [--dry-run]
 *
 * Options:
 *   --dry-run   Print found files to console without creating a spreadsheet.
 */

const { google } = require('googleapis');
const { getAuthClient } = require('./auth');

// ── Configuration ──────────────────────────────────────────────────────
const DATE_START = new Date('2019-02-01T00:00:00Z');
const DATE_END = new Date('2026-02-28T23:59:59Z');
const SPREADSHEET_TITLE = 'Visa & Business Statements (Feb 2019 – Feb 2026)';
const DRY_RUN = process.argv.includes('--dry-run');

// Keywords used to classify files into categories
const BUSINESS_KEYWORDS = [
  'business',
  'biz',
  'corp',
  'llc',
  'inc',
  'commercial',
  'company',
  'campus barber',
];
const PERSONAL_KEYWORDS = ['personal', 'individual'];

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Classify a filename into "Personal Visa", "Business", or "Uncategorized".
 * Checks for explicit keywords first. Falls back to "Uncategorized" so the
 * user can manually tag files in the spreadsheet.
 */
function classifyFile(fileName) {
  const lower = fileName.toLowerCase();
  for (const kw of BUSINESS_KEYWORDS) {
    if (lower.includes(kw)) return 'Business';
  }
  for (const kw of PERSONAL_KEYWORDS) {
    if (lower.includes(kw)) return 'Personal Visa';
  }
  // If the name contains "visa" without other context, default to Personal Visa
  if (lower.includes('visa')) return 'Personal Visa';
  return 'Uncategorized';
}

/**
 * Format a Date object as YYYY-MM-DD.
 */
function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toISOString().split('T')[0];
}

/**
 * Return a human-readable file size string.
 */
function formatSize(bytes) {
  if (!bytes) return 'N/A';
  const num = parseInt(bytes, 10);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Build a Google Drive web link from a file ID.
 */
function driveLink(fileId) {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

// ── Core Logic ─────────────────────────────────────────────────────────

/**
 * Search Google Drive for files starting with "statement".
 * Uses pagination to retrieve all matching files.
 */
async function findStatementFiles(drive) {
  const allFiles = [];
  let pageToken = null;

  // Drive query: name starts with "statement" (case-insensitive via contains
  // workaround — Drive search is already case-insensitive for name contains).
  // We also filter by modifiedTime within our date range and exclude trashed.
  const query = [
    "name contains 'statement'",
    'trashed = false',
    `modifiedTime >= '${DATE_START.toISOString()}'`,
    `modifiedTime <= '${DATE_END.toISOString()}'`,
  ].join(' and ');

  console.log('Searching Google Drive...');
  console.log(`  Query: ${query}\n`);

  do {
    const res = await drive.files.list({
      q: query,
      fields:
        'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink)',
      pageSize: 100,
      pageToken: pageToken || undefined,
      orderBy: 'modifiedTime',
    });

    const files = res.data.files || [];
    // Post-filter: name must START with "statement" (Drive API "contains" is broader)
    const filtered = files.filter((f) =>
      f.name.toLowerCase().startsWith('statement')
    );
    allFiles.push(...filtered);
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  console.log(`Found ${allFiles.length} statement files.\n`);
  return allFiles;
}

/**
 * Resolve parent folder IDs to folder names for display.
 */
async function resolveFolderNames(drive, files) {
  const folderIds = new Set();
  for (const f of files) {
    if (f.parents) {
      f.parents.forEach((id) => folderIds.add(id));
    }
  }

  const folderMap = {};
  for (const folderId of folderIds) {
    try {
      const res = await drive.files.get({
        fileId: folderId,
        fields: 'name',
      });
      folderMap[folderId] = res.data.name;
    } catch {
      folderMap[folderId] = folderId; // fallback to ID
    }
  }
  return folderMap;
}

/**
 * Build the rows for the spreadsheet from Drive file metadata.
 */
function buildRows(files, folderMap) {
  return files.map((f) => {
    const category = classifyFile(f.name);
    const folder =
      f.parents && f.parents[0]
        ? folderMap[f.parents[0]] || f.parents[0]
        : 'My Drive (root)';

    return {
      category,
      fileName: f.name,
      fileType: f.mimeType || '',
      size: formatSize(f.size),
      created: formatDate(f.createdTime),
      modified: formatDate(f.modifiedTime),
      folder,
      link: f.webViewLink || driveLink(f.id),
      fileId: f.id,
    };
  });
}

/**
 * Create a Google Sheets spreadsheet with three sheets:
 * 1. All Statements – every file found
 * 2. Personal Visa – filtered
 * 3. Business – filtered
 */
async function createSpreadsheet(sheets, rows) {
  console.log('Creating Google Sheets spreadsheet...');

  const personalRows = rows.filter((r) => r.category === 'Personal Visa');
  const businessRows = rows.filter((r) => r.category === 'Business');
  const uncategorizedRows = rows.filter((r) => r.category === 'Uncategorized');

  // Create the spreadsheet with three sheets
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: SPREADSHEET_TITLE },
      sheets: [
        {
          properties: {
            title: 'All Statements',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Personal Visa',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Business',
            gridProperties: { frozenRowCount: 1 },
          },
        },
      ],
    },
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId;
  const spreadsheetUrl = spreadsheet.data.spreadsheetUrl;

  // Header row
  const headers = [
    ['Category', 'File Name', 'File Type', 'Size', 'Created', 'Modified', 'Folder', 'Link'],
  ];

  // Convert row objects to arrays
  const toArray = (r) => [
    r.category,
    r.fileName,
    r.fileType,
    r.size,
    r.created,
    r.modified,
    r.folder,
    r.link,
  ];

  // Write data to each sheet
  const allData = headers.concat(rows.map(toArray));
  const personalData = headers.concat(personalRows.map(toArray));
  const businessData = headers.concat(businessRows.map(toArray));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: 'All Statements!A1', values: allData },
        { range: 'Personal Visa!A1', values: personalData },
        { range: 'Business!A1', values: businessData },
      ],
    },
  });

  // Format header rows (bold, background color)
  const sheetIds = spreadsheet.data.sheets.map((s) => s.properties.sheetId);
  const formatRequests = sheetIds.flatMap((sheetId) => [
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.094, green: 0.271, blue: 0.231 }, // #18453B
            textFormat: {
              bold: true,
              foregroundColor: { red: 1, green: 1, blue: 1 },
            },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    },
    {
      autoResizeDimensions: {
        dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 8 },
      },
    },
  ]);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: formatRequests },
  });

  return {
    spreadsheetId,
    spreadsheetUrl,
    counts: {
      total: rows.length,
      personal: personalRows.length,
      business: businessRows.length,
      uncategorized: uncategorizedRows.length,
    },
  };
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Drive Statements to Spreadsheet ===');
  console.log(`Date range: Feb 2019 – Feb 2026`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no spreadsheet will be created)' : 'LIVE'}\n`);

  const auth = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth });
  const sheets = google.sheets({ version: 'v4', auth });

  // Step 1: Find all statement files
  const files = await findStatementFiles(drive);

  if (files.length === 0) {
    console.log('No statement files found in the specified date range.');
    console.log('Make sure your files start with the word "statement" (case-insensitive).');
    process.exit(0);
  }

  // Step 2: Resolve folder names
  console.log('Resolving folder names...');
  const folderMap = await resolveFolderNames(drive, files);

  // Step 3: Build rows and classify
  const rows = buildRows(files, folderMap);

  // Sort by category, then by modified date
  rows.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.modified.localeCompare(b.modified);
  });

  // Print summary
  const personal = rows.filter((r) => r.category === 'Personal Visa').length;
  const business = rows.filter((r) => r.category === 'Business').length;
  const uncategorized = rows.filter((r) => r.category === 'Uncategorized').length;

  console.log('Classification summary:');
  console.log(`  Personal Visa:  ${personal}`);
  console.log(`  Business:       ${business}`);
  console.log(`  Uncategorized:  ${uncategorized}`);
  console.log(`  Total:          ${rows.length}\n`);

  if (DRY_RUN) {
    console.log('--- Files Found ---');
    rows.forEach((r, i) => {
      console.log(`${i + 1}. [${r.category}] ${r.fileName}`);
      console.log(`   Modified: ${r.modified} | Folder: ${r.folder}`);
      console.log(`   Link: ${r.link}\n`);
    });
    console.log('Dry run complete. No spreadsheet was created.');
    return;
  }

  // Step 4: Create the spreadsheet
  const result = await createSpreadsheet(sheets, rows);

  console.log('=== Done! ===');
  console.log(`Spreadsheet created: "${SPREADSHEET_TITLE}"`);
  console.log(`  Total files:    ${result.counts.total}`);
  console.log(`  Personal Visa:  ${result.counts.personal}`);
  console.log(`  Business:       ${result.counts.business}`);
  console.log(`  Uncategorized:  ${result.counts.uncategorized}`);
  console.log(`\nOpen your spreadsheet:\n  ${result.spreadsheetUrl}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  if (err.message.includes('invalid_grant')) {
    console.error('\nYour token may have expired. Delete token.json and re-run.');
  }
  process.exit(1);
});
