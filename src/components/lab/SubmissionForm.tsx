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

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
    });
  }

  async function handleFilesSelected(files: File[]) {
    setUploading(true);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    for (const file of files) {
      const fileType = getFileType(file.name, file.type);

      // Add to uploaded files list (pending)
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
        const fileData = await fileToBase64(file);

        // OPTION A: Client-Side Google Drive Upload (Recommended)
        // When Google Drive MCP is properly configured, this will upload directly to Drive
        // For now, this is handled by the Edge Function which acts as a proxy

        // Step 1: Upload file via Edge Function
        console.log(`Uploading ${file.name} to Edge Function...`);
        const uploadResponse = await fetch(
          `${supabaseUrl}/functions/v1/upload-submission-file`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
              submission_id: submission.id,
              team_id: submission.team_id,
              stage_id: submission.stage_id,
              file_name: file.name,
              file_size: file.size,
              file_type: fileType,
              mime_type: file.type,
              file_data: fileData,
            }),
          }
        );

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        console.log(`File uploaded: ${uploadResult.gdrive_id}`);

        // Step 2: Extract thumbnail preview (async, don't wait)
        fetch(
          `${supabaseUrl}/functions/v1/extract-file-preview`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
              file_id: uploadResult.file_id,
              submission_id: submission.id,
              file_type: fileType,
              file_name: file.name,
              gdrive_id: uploadResult.gdrive_id,
            }),
          }
        ).catch((e) => console.error('Preview extraction failed:', e));

        // Step 3: Update UI with successful upload
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: 'completed',
                  gdrive_id: uploadResult.gdrive_id,
                  gdrive_url: uploadResult.gdrive_url,
                }
              : f
          )
        );
      } catch (error) {
        console.error('Upload error:', error);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: 'failed' } : f
          )
        );
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
