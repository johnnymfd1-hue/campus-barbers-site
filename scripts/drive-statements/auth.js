/**
 * Google Drive OAuth2 Authentication Module
 *
 * Handles OAuth2 flow for accessing Google Drive and Google Sheets.
 * On first run, opens a browser for consent. Stores token locally
 * in token.json for subsequent runs.
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const http = require('http');
const url = require('url');

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
];

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

/**
 * Load OAuth2 credentials from credentials.json and return an
 * authenticated client. Triggers browser-based consent flow on first use.
 */
async function getAuthClient() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      'Missing credentials.json in scripts/drive-statements/.\n' +
      'Download it from Google Cloud Console > APIs & Services > Credentials.\n' +
      'See SETUP.md for full instructions.'
    );
  }

  const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
  const keys = JSON.parse(content);
  const { client_id, client_secret, redirect_uris } =
    keys.installed || keys.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris ? redirect_uris[0] : 'http://localhost:3001/oauth2callback'
  );

  // Return existing token if available
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    oAuth2Client.setCredentials(token);

    // Auto-refresh if expired
    oAuth2Client.on('tokens', (tokens) => {
      const current = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
      const updated = { ...current, ...tokens };
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(updated, null, 2));
    });

    return oAuth2Client;
  }

  // First-time: run consent flow
  const token = await getNewToken(oAuth2Client);
  oAuth2Client.setCredentials(token);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
  console.log('Token saved to', TOKEN_PATH);
  return oAuth2Client;
}

/**
 * Starts a temporary local server to handle the OAuth2 callback,
 * then opens the consent URL in the user's browser.
 */
function getNewToken(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    });

    const server = http.createServer(async (req, res) => {
      const parsed = url.parse(req.url, true);
      if (parsed.pathname === '/oauth2callback') {
        const code = parsed.query.code;
        if (!code) {
          res.end('Error: No authorization code received.');
          server.close();
          return reject(new Error('No authorization code'));
        }

        try {
          const { tokens } = await oAuth2Client.getToken(code);
          res.end('Authorization successful! You can close this tab.');
          server.close();
          resolve(tokens);
        } catch (err) {
          res.end('Error exchanging code for token.');
          server.close();
          reject(err);
        }
      }
    });

    server.listen(3001, () => {
      console.log('\n=== Google Authorization Required ===');
      console.log('Open this URL in your browser:\n');
      console.log(authUrl);
      console.log('\nWaiting for authorization...\n');
    });
  });
}

module.exports = { getAuthClient };
