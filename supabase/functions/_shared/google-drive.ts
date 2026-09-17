// supabase/functions/_shared/google-drive.ts
//
// Minimal Google Drive v3 client, authenticating as a real Google account
// (not a service account — service accounts have no Drive storage quota of
// their own and can't create files outside a Shared Drive, which needs a
// paid Workspace plan). Instead this uses a one-time-issued OAuth refresh
// token to mint short-lived access tokens on each call. Used to:
//   1. exchange the refresh token for a short-lived access token
//   2. find-or-create the Team -> Stage folder structure
//   3. open a resumable upload session and hand the URL to the browser,
//      which then PUTs the file bytes directly to Google — the file never
//      passes through Supabase.

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

/** Exchanges the refresh token for a Drive-scoped access token (valid ~1hr). */
export async function getDriveAccessToken(credentials: OAuthCredentials): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

function escapeDriveQueryValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** Finds a folder by exact name under `parentId`, creating it if it doesn't exist. */
export async function findOrCreateFolder(
  accessToken: string,
  name: string,
  parentId: string,
): Promise<string> {
  const q = `name = '${escapeDriveQueryValue(name)}' and '${parentId}' in parents ` +
    `and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!listRes.ok) {
    throw new Error(`Drive folder lookup failed (${listRes.status}): ${await listRes.text()}`);
  }
  const listData = await listRes.json();
  if (listData.files?.length > 0) return listData.files[0].id as string;

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }),
  });
  if (!createRes.ok) {
    throw new Error(`Drive folder creation failed (${createRes.status}): ${await createRes.text()}`);
  }
  const createData = await createRes.json();
  return createData.id as string;
}

/**
 * Opens a resumable upload session and returns the one-time session URL.
 * The caller (browser) PUTs the raw file bytes to this URL directly —
 * Google, not Supabase, receives the file data.
 */
export async function createResumableUploadSession(
  accessToken: string,
  fileName: string,
  mimeType: string,
  parentFolderId: string,
): Promise<string> {
  // fields= here controls what Drive includes in the response to the
  // browser's final PUT once the upload completes, so the frontend gets
  // webViewLink/thumbnailLink directly — no second authenticated call
  // (which would require exposing the access token to the browser).
  const params = 'uploadType=resumable&fields=id,name,webViewLink,thumbnailLink';
  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files?${params}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType,
    },
    body: JSON.stringify({ name: fileName, parents: [parentFolderId] }),
  });
  if (!res.ok) {
    throw new Error(`Drive resumable session failed (${res.status}): ${await res.text()}`);
  }
  const location = res.headers.get('Location');
  if (!location) throw new Error('Drive did not return a resumable session URL.');
  return location;
}
