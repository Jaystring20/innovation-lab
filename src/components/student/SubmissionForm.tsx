import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Loader2, CheckCircle, AlertCircle, Link as LinkIcon } from 'lucide-react';
import Panel from '@/components/Panel';
import GlowButton from '@/components/GlowButton';
import { saveSubmission } from '@/lib/lab';
import type { Submission } from '@/lib/lab';

interface SubmissionFormProps {
  submission: Submission;
  stageName: string;
  onSubmit?: (submission: Submission) => void;
  readOnly?: boolean;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({
  submission,
  stageName,
  onSubmit,
  readOnly = false,
}) => {
  const [videoUrl, setVideoUrl] = useState(submission.payload?.video_url || '');
  const [repoUrl, setRepoUrl] = useState(submission.payload?.repo_url || '');
  const [docUrl, setDocUrl] = useState(submission.payload?.doc_url || '');
  const [notes, setNotes] = useState(submission.payload?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updated = await saveSubmission(submission.id, {
        video_url: videoUrl || undefined,
        repo_url: repoUrl || undefined,
        doc_url: docUrl || undefined,
        notes: notes || undefined,
      });
      setSuccess(true);
      onSubmit?.(updated);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (readOnly) {
    return (
      <Panel className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-ok" />
          <p className="font-medium text-foreground">Submission Complete</p>
        </div>
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
          >
            <LinkIcon className="w-4 h-4" />
            View video
          </a>
        )}
        {docUrl && (
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
          >
            <LinkIcon className="w-4 h-4" />
            View documentation
          </a>
        )}
        {notes && (
          <div className="bg-surface rounded p-2 mt-2">
            <p className="text-sm text-muted-foreground">{notes}</p>
          </div>
        )}
      </Panel>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Panel className="space-y-4">
        <h3 className="font-semibold text-foreground">{stageName} Submission</h3>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 bg-ok/10 border border-ok/30 rounded-lg"
          >
            <CheckCircle className="w-4 h-4 text-ok flex-shrink-0" />
            <p className="text-sm text-ok">Submission saved successfully!</p>
          </motion.div>
        )}

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Video URL (3-min pitch)
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtu.be/..."
            className="w-full bg-secondary/50 border border-border rounded-lg py-2.5 px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Upload to YouTube and paste the link
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Repository URL
          </label>
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/..."
            className="w-full bg-secondary/50 border border-border rounded-lg py-2.5 px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Link to your code repository
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Documentation URL
          </label>
          <input
            type="url"
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
            placeholder="https://docs.google.com/..."
            className="w-full bg-secondary/50 border border-border rounded-lg py-2.5 px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Link to project documentation or design doc
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Notes & Reflections
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tell us about your process, challenges, and learnings..."
            rows={4}
            className="w-full bg-secondary/50 border border-border rounded-lg py-2.5 px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Share your journey and what you learned
          </p>
        </div>

        <GlowButton
          type="submit"
          disabled={saving}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Save Submission
            </>
          )}
        </GlowButton>
      </Panel>
    </form>
  );
};

export default SubmissionForm;
