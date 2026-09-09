import { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadFile, validateFile, UploadError, ALLOWED_TYPES, SIZE_LIMITS } from '@/lib/uploads';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  submissionId: string;
  purpose: 'video' | 'doc' | 'image';
  label: string;
  hint?: string;
  currentUrl?: string;
  onUpload: (url: string) => void;
  disabled?: boolean;
}

/**
 * FileUpload — drag-drop file upload component with progress tracking.
 */
const FileUpload: React.FC<FileUploadProps> = ({
  submissionId,
  purpose,
  label,
  hint,
  currentUrl,
  onUpload,
  disabled,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState(currentUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function getTypeHint(): string {
    const types = ALLOWED_TYPES[purpose];
    const limit = Math.floor(SIZE_LIMITS[purpose] / 1024 / 1024 / 1024);
    return `${types.join(', ')} • Max ${limit}GB`;
  }

  async function handleFile(file: File) {
    setError(null);

    // Validate
    try {
      validateFile(file, purpose);
    } catch (err) {
      if (err instanceof UploadError) {
        setError(err.message);
      } else {
        setError('Invalid file');
      }
      return;
    }

    // Upload
    setUploading(true);
    try {
      const url = await uploadFile(file, submissionId, purpose);
      setUploadedUrl(url);
      onUpload(url);
    } catch (err) {
      if (err instanceof UploadError) {
        setError(err.message);
      } else {
        setError('Upload failed');
      }
    } finally {
      setUploading(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {label}
      </label>

      {uploadedUrl ? (
        <div className="flex items-center justify-between bg-secondary/40 border-2 border-ok/50 rounded-lg py-3 px-4 mb-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-ok flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                File uploaded
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {uploadedUrl.split('/').pop()}
              </p>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                setUploadedUrl(undefined);
                onUpload('');
              }}
              className="text-muted-foreground hover:text-foreground transition-colors ml-2 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg py-8 px-4 text-center transition-colors mb-2',
            isDragging ? 'border-primary bg-primary/5' : 'border-border',
            disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            disabled={disabled || uploading}
            className="hidden"
          />

          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Uploading…</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">
                Drag and drop or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="text-primary hover:underline disabled:opacity-60"
                >
                  click to select
                </button>
              </p>
              <p className="text-xs text-muted-foreground">{getTypeHint()}</p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-danger/10 border border-danger/30 rounded-lg py-2 px-3 mb-2">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {hint && !error && (
        <p className="text-xs text-muted-foreground/70">{hint}</p>
      )}
    </div>
  );
};

export default FileUpload;
