import { google } from 'googleapis';
import { query } from '../config/database.js';
import { uploadToSpaces } from '../config/spaces.js';
import fetch from 'node-fetch';

// Google Drive OAuth
const googleOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Get Google Drive OAuth URL
 */
export function getGoogleAuthUrl(req, res) {
  const authUrl = googleOAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.readonly'],
    state: req.user.id, // Pass user ID in state
  });

  res.json({ success: true, data: { authUrl } });
}

/**
 * Handle Google OAuth callback
 */
export async function googleCallback(req, res) {
  try {
    const { code, state } = req.query;
    const userId = state;

    // Exchange code for tokens
    const { tokens } = await googleOAuth2Client.getToken(code);
    googleOAuth2Client.setCredentials(tokens);

    // Store tokens in database
    await query(
      `INSERT INTO oauth_tokens (user_id, provider, access_token, refresh_token, expires_at)
       VALUES ($1, 'google', $2, $3, $4)
       ON CONFLICT (user_id, provider)
       DO UPDATE SET access_token = $2, refresh_token = $3, expires_at = $4`,
      [
        userId,
        tokens.access_token,
        tokens.refresh_token,
        new Date(tokens.expiry_date),
      ]
    );

    // Redirect back to frontend
    res.redirect(`${process.env.CLIENT_URL}/import?provider=google&status=success`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/import?provider=google&status=error`);
  }
}

/**
 * Import files from Google Drive
 */
export async function importFromGoogleDrive(req, res) {
  try {
    const { fileIds } = req.body; // Array of Google Drive file IDs
    const userId = req.user.id;

    // Get stored OAuth tokens
    const tokenResult = await query(
      `SELECT access_token, refresh_token FROM oauth_tokens
       WHERE user_id = $1 AND provider = 'google'`,
      [userId]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Google Drive not connected. Please authenticate first.',
      });
    }

    const { access_token, refresh_token } = tokenResult.rows[0];
    googleOAuth2Client.setCredentials({
      access_token,
      refresh_token,
    });

    const drive = google.drive({ version: 'v3', auth: googleOAuth2Client });
    const importedFiles = [];

    for (const fileId of fileIds) {
      try {
        // Get file metadata
        const metadata = await drive.files.get({
          fileId,
          fields: 'id, name, mimeType, size',
        });

        // Download file
        const response = await drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'arraybuffer' }
        );

        const buffer = Buffer.from(response.data);

        // Upload to Spaces
        const { key, url } = await uploadToSpaces(
          buffer,
          metadata.data.name,
          metadata.data.mimeType,
          userId
        );

        // Save to database
        const result = await query(
          `INSERT INTO files (user_id, name, original_name, file_type, mime_type, size, spaces_key, spaces_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [
            userId,
            metadata.data.name,
            metadata.data.name,
            getFileType(metadata.data.mimeType),
            metadata.data.mimeType,
            metadata.data.size,
            key,
            url,
          ]
        );

        importedFiles.push(result.rows[0]);

        // Update storage usage
        await query(
          'UPDATE users SET storage_used = storage_used + $1 WHERE id = $2',
          [metadata.data.size, userId]
        );
      } catch (error) {
        console.error(`Error importing file ${fileId}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Imported ${importedFiles.length} files from Google Drive`,
      data: importedFiles,
    });
  } catch (error) {
    console.error('Import from Google Drive error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import from Google Drive',
    });
  }
}

/**
 * Get Microsoft OneDrive OAuth URL
 */
export function getMicrosoftAuthUrl(req, res) {
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.MICROSOFT_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.MICROSOFT_REDIRECT_URI)}&scope=Files.Read.All offline_access&state=${req.user.id}`;

  res.json({ success: true, data: { authUrl } });
}

/**
 * Handle Microsoft OAuth callback
 */
export async function microsoftCallback(req, res) {
  try {
    const { code, state } = req.query;
    const userId = state;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        code,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    // Store tokens
    await query(
      `INSERT INTO oauth_tokens (user_id, provider, access_token, refresh_token, expires_at)
       VALUES ($1, 'microsoft', $2, $3, $4)
       ON CONFLICT (user_id, provider)
       DO UPDATE SET access_token = $2, refresh_token = $3, expires_at = $4`,
      [
        userId,
        tokens.access_token,
        tokens.refresh_token,
        new Date(Date.now() + tokens.expires_in * 1000),
      ]
    );

    res.redirect(`${process.env.CLIENT_URL}/import?provider=microsoft&status=success`);
  } catch (error) {
    console.error('Microsoft OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/import?provider=microsoft&status=error`);
  }
}

/**
 * Get Dropbox OAuth URL
 */
export function getDropboxAuthUrl(req, res) {
  const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${process.env.DROPBOX_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.DROPBOX_REDIRECT_URI)}&state=${req.user.id}`;

  res.json({ success: true, data: { authUrl } });
}

/**
 * Handle Dropbox OAuth callback
 */
export async function dropboxCallback(req, res) {
  try {
    const { code, state } = req.query;
    const userId = state;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: process.env.DROPBOX_CLIENT_ID,
        client_secret: process.env.DROPBOX_CLIENT_SECRET,
        redirect_uri: process.env.DROPBOX_REDIRECT_URI,
      }),
    });

    const tokens = await tokenResponse.json();

    // Store tokens
    await query(
      `INSERT INTO oauth_tokens (user_id, provider, access_token, refresh_token)
       VALUES ($1, 'dropbox', $2, $3)
       ON CONFLICT (user_id, provider)
       DO UPDATE SET access_token = $2, refresh_token = $3`,
      [userId, tokens.access_token, tokens.refresh_token]
    );

    res.redirect(`${process.env.CLIENT_URL}/import?provider=dropbox&status=success`);
  } catch (error) {
    console.error('Dropbox OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/import?provider=dropbox&status=error`);
  }
}

function getFileType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'word';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'excel';
  if (mimeType.startsWith('text/')) return 'text';
  return 'other';
}
