# Google Drive MCP Integration Setup

## Overview

The STEAM Foundry Lab file upload system is configured for Google Drive integration. Files are uploaded to Google Drive and tracked in the Supabase database for organizer review.

## Current Implementation Status

✅ **Complete:**
- File upload UI (drag & drop, file selection)
- File type detection (video, PDF, code, etc.)
- Thumbnail preview extraction
- Database tracking of uploads
- Organizer file browser view
- Mock Google Drive functionality (ready for production)

⏳ **Ready for Production:**
- Real Google Drive API integration (requires credentials setup)

## Production Setup: Google Drive API Credentials

To enable real Google Drive uploads in production, follow these steps:

### 1. Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing: "STEAM Foundry Lab"
3. Enable the Google Drive API:
   - Search for "Google Drive API"
   - Click "Enable"

### 2. Create Service Account

1. Go to **Service Accounts** (in the Console)
2. Click **Create Service Account**
3. Fill in:
   - Service account name: `steam-foundry-lab`
   - Service account ID: auto-generated
   - Description: "STEAM Foundry Lab file uploads"
4. Click **Create and Continue**
5. Grant role: **Editor** (for Drive API access)
6. Click **Continue** → **Done**

### 3. Create and Download Key

1. In Service Accounts, click the service account you created
2. Go to the **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON** format
5. Click **Create**
6. Save the JSON file securely

### 4. Create Google Drive Folder Structure

1. Create a folder in Google Drive named: `STEAM Foundry Lab Submissions`
2. Note the folder ID from the URL:
   ```
   https://drive.google.com/drive/folders/FOLDER_ID_HERE
   ```
3. Share the folder with your service account email:
   - Open folder properties
   - Share with: `steam-foundry-lab@PROJECT_ID.iam.gserviceaccount.com`
   - Grant **Editor** access

### 5. Add Credentials to Supabase

1. Go to Supabase Project Settings → Secrets
2. Add a new secret:
   - Name: `GOOGLE_DRIVE_CREDENTIALS`
   - Value: (paste the entire JSON key file)
3. Click Save
4. Redeploy Edge Functions:
   ```bash
   supabase functions deploy upload-submission-file
   supabase functions deploy extract-file-preview
   ```

### 6. Update Environment Variables

In your Next.js app `.env.local`:
```
VITE_GOOGLE_DRIVE_FOLDER_ID=YOUR_FOLDER_ID_HERE
```

## File Upload Flow

### Client Side (SubmissionForm.tsx)

```typescript
// 1. User selects file
// 2. File converted to base64
// 3. Sent to Edge Function

const response = await fetch(
  `${supabaseUrl}/functions/v1/upload-submission-file`,
  {
    method: 'POST',
    body: JSON.stringify({
      submission_id: '...',
      file_name: 'video.mp4',
      file_data: '...base64...', // base64-encoded file
      // ... other metadata
    }),
  }
);
```

### Edge Function (upload-submission-file)

```typescript
// 1. Receive file data
// 2. Upload to Google Drive API
// 3. Save metadata to database
// 4. Return file ID and Drive URL
// 5. Trigger preview extraction

return {
  success: true,
  file_id: '...',
  gdrive_id: '...',
  gdrive_url: 'https://drive.google.com/file/d/.../view',
};
```

### Preview Extraction (extract-file-preview)

```typescript
// 1. Download file from Google Drive
// 2. Extract thumbnail:
//    - Video: 5-second keyframe
//    - PDF: First page render
//    - Code: Syntax-highlighted snippet
//    - Image: Inline preview
// 3. Upload thumbnail to Drive
// 4. Save preview metadata
```

## Database Schema

### uploaded_submission_files table

```sql
id                    UUID (primary key)
submission_id         UUID (foreign key)
team_id              UUID
stage_id             UUID
file_name            TEXT
file_size            INTEGER
file_type            TEXT ('video'|'code'|'doc'|'image'|'other')
mime_type            TEXT
google_drive_id      TEXT (unique)
google_drive_url     TEXT
thumbnail_url        TEXT (optional)
preview_metadata     JSONB (optional)
upload_status        TEXT ('pending'|'uploading'|'completed'|'failed')
created_at           TIMESTAMP
updated_at           TIMESTAMP
error_message        TEXT (optional)
```

### submissions table (updated)

```sql
uploaded_files       JSONB array of:
  - id: file record ID
  - name: file name
  - size: file size in bytes
  - type: file type
  - gdrive_id: Google Drive file ID
  - gdrive_url: Google Drive URL
  - thumbnail_url: preview thumbnail URL
  - status: 'completed' | 'failed'
  - created_at: timestamp
```

## Testing

### Mock Testing (Without Credentials)

1. Start dev server: `npm run dev`
2. Navigate to Lab Dashboard
3. Open a submission form
4. Upload a test file
5. Verify:
   - ✅ File appears in list with "Uploading..." status
   - ✅ Status changes to "Uploaded" after 2-3 seconds
   - ✅ Thumbnail preview appears
   - ✅ File appears in organizer file browser

### Production Testing (With Credentials)

1. Set up Google Drive credentials (see setup steps above)
2. Deploy Edge Functions with credentials
3. Upload a test file
4. Verify:
   - ✅ File appears in Google Drive folder
   - ✅ File accessible via "View in Drive" button
   - ✅ Download works
   - ✅ Thumbnail extracted correctly

## Troubleshooting

### Issue: "Uploading..." status never changes

**Solution:**
1. Check browser console (F12 → Console)
2. Check Edge Function logs:
   ```bash
   supabase functions fetch-logs upload-submission-file
   ```
3. Verify GOOGLE_DRIVE_CREDENTIALS is set in Supabase secrets

### Issue: File appears in UI but not in Google Drive

**Possible causes:**
- Credentials not configured (will use mock mode)
- Service account doesn't have permission to Drive folder
- Folder ID is wrong

**Solution:**
1. Check Edge Function logs for upload errors
2. Verify service account has Editor access to Drive folder
3. Verify folder ID in VITE_GOOGLE_DRIVE_FOLDER_ID

### Issue: Thumbnail extraction fails

**Possible causes:**
- ffmpeg not available (for video thumbnails)
- ImageMagick not available (for PDF/image thumbnails)
- File corrupted

**Solution:**
1. Check extract-file-preview logs
2. Verify file uploaded successfully
3. Try with a different file format

## Architecture Decision: Why Edge Functions?

We chose to handle Google Drive uploads via Edge Functions instead of client-side because:

1. **Security:** Credentials stay on the server, not exposed to browser
2. **Simplicity:** No complex OAuth flow in the UI
3. **Reliability:** Server-to-server communication is more stable
4. **Control:** Easy to add logging, error handling, retries

## Future Enhancements

- [ ] Direct client-to-Drive upload (for large files >100MB)
- [ ] Resumable upload support
- [ ] Progress bar for uploads
- [ ] Batch upload support
- [ ] Drive file deletion when submission is deleted
- [ ] File versioning (keep upload history)
- [ ] Virus scanning before upload
- [ ] File expiration (auto-delete after 1 year)

## Support

For issues or questions, contact: adikwusamson113@gmail.com
