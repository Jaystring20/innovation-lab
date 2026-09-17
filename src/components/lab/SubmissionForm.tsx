import { useState } from 'react';
import { Loader2, Lock, Save } from 'lucide-react';
import GlowButton from '@/components/GlowButton';
import { FileUploadField } from '@/components/lab/FileUploadField';
import {
  DELIVERABLE_LABEL,
  saveSubmission,
  type Stage,
  type Submission,
  type SubmissionPayload,
  type UploadedFile,
} from '@/lib/lab';

/**
 * Deliverable entry for one team + stage.
 *
 * Filling any URL field flips the submission to 'submitted' via a database
 * trigger — there is no separate submit action to get out of sync with. A
 * scored submission is frozen (RLS blocks the update as well as the UI).
 */
const SubmissionForm: React.FC<{
  stage: Stage;
  submission: Submission;
  onSaved: (s: Submission) => void;
}> = ({ stage, submission, onSaved }) => {
  const [payload, setPayload] = useState<SubmissionPayload>(submission.payload ?? {});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(submission.payload?.uploaded_files ?? []);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const locked = submission.status === 'scored';
  const isLive = stage.deliverable_kind === 'live';

  function set<K extends keyof SubmissionPayload>(key: K, value: string) {
    setPayload((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function getFileType(name: string, mimeType: string): UploadedFile['type'] {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf')) return 'doc';
    if (name.endsWith('.zip') || mimeType.includes('compress')) return 'code';
    if (mimeType.startsWith('text/')) return 'code';
    return 'other';
  }

  /**
   * Uploads a file straight to Google Drive: the Edge Function only opens a
   * resumable session (it needs the service account's credentials, which
   * must never reach the browser) and hands back its URL; the raw file
   * bytes go browser -> Google directly, never through Supabase. Proxying
   * a multi-hundred-MB video through an Edge Function as base64 JSON does
   * not work at any real video length or resolution.
   */
  async function handleFilesSelected(files: File[]) {
    setUploading(true);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    for (const file of files) {
      const fileType = getFileType(file.name, file.type);
      const fileId = crypto.randomUUID();
      const fileRecord: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: fileType,
        status: 'uploading',
      };
      setUploadedFiles((prev) => [...prev, fileRecord]);

      try {
        // Step 1: ask the Edge Function to open a Drive resumable upload session.
        const prepareRes = await fetch(`${supabaseUrl}/functions/v1/upload-submission-file`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            team_id: submission.team_id,
            stage_id: submission.stage_id,
            file_name: file.name,
            mime_type: file.type || 'application/octet-stream',
          }),
        });
        if (!prepareRes.ok) {
          const err = await prepareRes.json().catch(() => ({}) as { error?: string });
          throw new Error(err.error || `Could not start the upload (${prepareRes.status}).`);
        }
        const { uploadUrl } = (await prepareRes.json()) as { uploadUrl: string };

        // Step 2: PUT the raw file straight to Google. `body: file` streams
        // the File object rather than loading it into memory as a string.
        const driveRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        });
        if (!driveRes.ok) {
          throw new Error(`Upload to Drive failed (${driveRes.status}).`);
        }
        const driveFile = (await driveRes.json()) as {
          id: string;
          webViewLink?: string;
          thumbnailLink?: string;
        };

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: 'completed',
                  gdrive_id: driveFile.id,
                  gdrive_url: driveFile.webViewLink ?? `https://drive.google.com/file/d/${driveFile.id}/view`,
                  thumbnail_url: driveFile.thumbnailLink,
                }
              : f,
          ),
        );
      } catch (error) {
        console.error('Upload error:', error);
        setUploadedFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: 'failed' } : f)));
        setError((error as Error).message);
      }
    }

    setUploading(false);
  }

  function handleRemoveFile(fileId: string) {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const clean: SubmissionPayload = {};
      for (const [k, v] of Object.entries(payload)) {
        const trimmed = (v ?? '').trim();
        if (trimmed) clean[k as keyof SubmissionPayload] = trimmed;
      }

      // Include uploaded files if any
      if (uploadedFiles.length > 0) {
        clean.uploaded_files = uploadedFiles;
      }

      const updated = await saveSubmission(submission.id, clean);
      onSaved(updated);
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (isLive) {
    return (
      <div className="text-sm text-muted-foreground">
        <p className="mb-1 text-foreground font-medium">{DELIVERABLE_LABEL.live}</p>
        <p>
          Nothing to upload for the Grand Finale — finalists present in person on{' '}
          {stage.due_at ? new Date(stage.due_at).toLocaleDateString('en-NG', { dateStyle: 'long' }) : 'the finale date'}.
          Judges score the live pitch.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Deliverable: <span className="text-foreground">{DELIVERABLE_LABEL[stage.deliverable_kind]}</span>
      </p>

      {locked && (
        <p className="flex items-center gap-2 text-sm text-ok">
          <Lock className="w-4 h-4" />
          Judging is complete — this submission is locked.
        </p>
      )}

      {(stage.deliverable_kind === 'video' || stage.deliverable_kind === 'prompt_log') && (
        <Field
          label="Video URL"
          hint="YouTube, Vimeo, or Drive link — make sure it is viewable by anyone with the link."
          value={payload.video_url ?? ''}
          onChange={(v) => set('video_url', v)}
          disabled={locked}
          placeholder="https://youtu.be/…"
        />
      )}

      {stage.deliverable_kind === 'prototype' && (
        <Field
          label="Prototype demo URL"
          hint="A video or photo album showing the build working."
          value={payload.video_url ?? ''}
          onChange={(v) => set('video_url', v)}
          disabled={locked}
          placeholder="https://…"
        />
      )}

      <Field
        label={stage.deliverable_kind === 'prompt_log' ? 'AI prompt log URL' : 'Code / documentation URL'}
        hint={
          stage.deliverable_kind === 'prompt_log'
            ? 'A shared doc or repo holding your prompt log.'
            : 'GitHub repo, shared doc, or folder. Optional.'
        }
        value={payload.doc_url ?? ''}
        onChange={(v) => set('doc_url', v)}
        disabled={locked}
        placeholder="https://…"
      />

      {!locked && (
        <FileUploadField
          onFilesSelected={handleFilesSelected}
          uploadedFiles={uploadedFiles}
          onRemoveFile={handleRemoveFile}
          loading={uploading}
          disabled={locked}
        />
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Notes for the judges
        </label>
        <textarea
          rows={3}
          disabled={locked}
          value={payload.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Anything the judges should know — constraints, what you would do next."
          className="w-full bg-secondary/40 border-2 border-border rounded-lg py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all disabled:opacity-60"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && !error && <p className="text-sm text-ok">Saved.</p>}

      {!locked && (
        <GlowButton type="submit" disabled={busy} size="sm">
          <span className="flex items-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save submission
          </span>
        </GlowButton>
      )}
    </form>
  );
};

const Field: React.FC<{
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}> = ({ label, hint, value, onChange, disabled, placeholder }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
      {label}
    </label>
    <input
      type="url"
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-secondary/40 border-2 border-white/10 rounded-lg py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all disabled:opacity-60"
    />
    {hint && <p className="text-xs text-muted-foreground/70 mt-1.5">{hint}</p>}
  </div>
);

export default SubmissionForm;
