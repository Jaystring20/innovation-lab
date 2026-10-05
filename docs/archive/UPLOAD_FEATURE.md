# Upload Functionality - Week 3 Implementation

## Overview

The upload functionality allows teams to directly upload files (videos, documents, images) to Supabase Storage as part of their Innovation Funnel submissions. It includes offline queue support for seamless operation even when the network is unstable.

## Architecture

### Core Components

#### 1. **Upload Utilities** (`src/lib/uploads.ts`)
- `uploadFile()` - Upload single file to Supabase Storage
- `validateFile()` - Validate file size and type before upload
- File size limits: Video (5GB), Documents (100MB), Images (50MB)
- Allowed types: MP4/MOV/AVI/WebM for videos, PDF/Office/text for docs, JPEG/PNG/WebP/GIF for images

#### 2. **FileUpload Component** (`src/components/lab/FileUpload.tsx`)
Interactive file upload UI with:
- Drag-and-drop support
- Click-to-select fallback
- Real-time validation feedback
- Upload success/error states
- File removal option
- Shows uploaded file status with checkmark

#### 3. **OfflineQueueManager** (`src/components/lab/OfflineQueueManager.tsx`)
Manages offline uploads:
- Persists failed uploads to localStorage
- Detects network status (online/offline)
- Auto-retries when network is available
- Shows queue status badge
- Manual retry button for users
- Max 3 retry attempts per file

#### 4. **SubmissionForm Integration** (`src/components/lab/SubmissionForm.tsx`)
Updated to include:
- FileUpload component for video deliverables
- FileUpload component for document deliverables
- Fallback URL input fields for external links (YouTube, Google Drive, etc.)
- Seamless integration with existing submission workflow

## Setup Instructions

### 1. Create Supabase Storage Bucket

In your Supabase dashboard:

```sql
-- Create bucket via Storage UI or SQL
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-submissions', 'team-submissions', true);
```

### 2. Configure RLS Policies

Set up Row-Level Security so only authenticated users can upload:

```sql
-- Allow teachers to upload to their team's submissions
CREATE POLICY "Teams can upload to their submissions"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'team-submissions'
    AND auth.uid() IS NOT NULL
  );

-- Allow public read access to uploaded files
CREATE POLICY "Public read access to submissions"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'team-submissions');
```

### 3. Update Environment Variables

No additional env vars needed - uses existing Supabase client from `@/lib/supabase`.

## Usage

### In Submission Form

Teams will see:

1. **Upload UI** - "Drag and drop" file input or click to select
2. **Validation** - File type and size checked immediately
3. **Upload** - Progress indicator while uploading
4. **Success** - Shows file name with checkmark
5. **Fallback** - Optional URL input if preferring external links

### Offline Flow

1. **Network Lost** - Upload queued automatically
2. **Queue Badge** - Shows at bottom of screen with upload count
3. **Network Restored** - Auto-retries pending uploads
4. **Manual Retry** - Users can click "Retry now" button
5. **Max Retries** - After 3 attempts, upload is discarded with notification

## Implementation Details

### File Structure

```
packages/lab/src/
├── lib/
│   └── uploads.ts                    # Upload utilities + queue
├── components/lab/
│   ├── FileUpload.tsx                # Upload UI component
│   ├── OfflineQueueManager.tsx       # Queue manager
│   └── SubmissionForm.tsx            # Updated with upload integration
└── App.tsx                           # Added OfflineQueueManager
```

### Database Schema

Submissions payload now supports:

```typescript
export interface SubmissionPayload {
  video_url?: string;      // URL from upload or external link
  repo_url?: string;       // (Existing)
  doc_url?: string;        // URL from upload or external link
  notes?: string;          // (Existing)
}
```

URLs stored are public Supabase Storage URLs like:
```
https://project.supabase.co/storage/v1/object/public/team-submissions/video/sub-123/1788124800-demo.mp4
```

### Offline Queue Schema

Queue stored in localStorage as `lab_upload_queue`:

```typescript
interface QueuedUpload {
  id: string;                    // UUID
  submissionId: string;          // FK to submissions.id
  teamId: string;                // FK to teams.id
  file: File;                    // Blob data
  purpose: 'video' | 'doc' | 'image';
  addedAt: number;               // Timestamp
  attempts: number;              // Retry counter
}
```

## API Reference

### uploadFile(file, submissionId, purpose, onProgress?)
Upload a single file to Supabase Storage.

**Parameters:**
- `file: File` - File object
- `submissionId: string` - Submission ID for path structure
- `purpose: 'video' | 'doc' | 'image'` - Determines bucket folder
- `onProgress?: (progress: UploadProgress) => void` - Progress callback

**Returns:** `Promise<string>` - Public URL of uploaded file

**Throws:** `UploadError` with codes:
- `FILE_TOO_LARGE`
- `INVALID_TYPE`
- `UPLOAD_FAILED`

### getUploadQueue()
Get current queued uploads from localStorage.

**Returns:** `QueuedUpload[]`

### addToQueue(upload)
Add a failed upload to the offline queue.

**Parameters:**
- `upload: Omit<QueuedUpload, 'addedAt' | 'attempts'>`

### processUploadQueue(onUpdate?)
Process all queued uploads (called automatically when online).

**Parameters:**
- `onUpdate?: (queue: QueuedUpload[]) => void` - Called after each upload attempt

**Returns:** `Promise<{ succeeded: string[]; failed: QueuedUpload[] }>`

## Error Handling

### Validation Errors
Shown inline in FileUpload component:
- "File exceeds 5GB limit for video uploads"
- "File type not allowed for doc uploads"

### Upload Errors
Shown with retry option:
- Network timeout → Added to queue
- Storage permission denied → Shows error, can retry
- Invalid file → Shows error, cannot retry

### Queue Processing
- Max 3 attempts per file
- After 3 failures, file is dropped with notification
- Users can manually clear queue if needed

## Testing

### Manual Testing Checklist

- [ ] **Upload single file** - Drag/drop an MP4 video
- [ ] **See progress** - Watch upload percentage
- [ ] **Upload success** - File shows with checkmark
- [ ] **File removal** - Click X to remove uploaded file
- [ ] **Invalid file** - Try uploading a .exe file → error shown
- [ ] **File too large** - Try uploading 6GB video → error shown
- [ ] **External URL fallback** - Paste YouTube link when no upload
- [ ] **Offline queue** - Disable network, start upload, see queue badge
- [ ] **Auto-retry** - Enable network, watch queue clear
- [ ] **Manual retry** - Click "Retry now" button
- [ ] **Multiple uploads** - Upload 3 files, disable network after 1 succeeds
- [ ] **Persistent queue** - Refresh page, queue still shows

### Browser DevTools

Check localStorage:
```javascript
JSON.parse(localStorage.getItem('lab_upload_queue'))
```

Watch network status:
```javascript
navigator.onLine  // true/false
```

## Known Limitations

1. **Bucket creation required** - Bucket must be created manually in Supabase dashboard
2. **File type by MIME** - Validation uses file MIME type, not extension (more secure)
3. **No resume** - If upload interrupted, must restart
4. **localStorage limit** - Browser localStorage has ~5MB limit, shouldn't be an issue for File objects in practice
5. **RLS required** - Storage must have proper RLS policies for auth users

## Future Enhancements

- [ ] Resume interrupted uploads
- [ ] Progress bar percentage display
- [ ] Batch upload multiple files at once
- [ ] Video preview thumbnail generation
- [ ] Virus scanning via external service
- [ ] File compression before upload
- [ ] Upload analytics dashboard
- [ ] Cloud CDN caching for faster downloads

## Troubleshooting

### Uploads showing "Failed to upload"
1. Check Supabase bucket exists: `team-submissions`
2. Verify bucket is public or has correct RLS policies
3. Check user is authenticated
4. Check browser console for detailed error

### Queue never processes
1. Verify network is online: `navigator.onLine`
2. Check localStorage for queue: `localStorage.getItem('lab_upload_queue')`
3. Open DevTools → check OfflineQueueManager component

### File too large error
1. Video limit is 5GB - confirm file size
2. Doc limit is 100MB
3. Image limit is 50MB

### Stale queue from old session
Clear localStorage manually:
```javascript
localStorage.removeItem('lab_upload_queue')
```

## Related Documentation

- Supabase Storage: https://supabase.com/docs/guides/storage
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Week 1: Visual Redesign (see STEAM_FOUNDRY_REDESIGN.md)
- Week 2: Navigation & Dashboard (see PHASE_2_DASHBOARD.md)
