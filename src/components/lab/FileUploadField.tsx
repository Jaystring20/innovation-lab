import { useRef, useState } from 'react';
import { Upload, X, Check, AlertCircle, FileVideo, FileText, Code2, Image as ImageIcon } from 'lucide-react';
import type { UploadedFile } from '@/lib/lab';

interface FileUploadFieldProps {
  onFilesSelected: (files: File[]) => void;
  maxFileSize?: number; // bytes, default 1GB
  acceptedTypes?: string[];
  disabled?: boolean;
  loading?: boolean;
  uploadedFiles?: UploadedFile[];
  onRemoveFile?: (fileId: string) => void;
}

export function FileUploadField({
  onFilesSelected,
  maxFileSize = 1024 * 1024 * 1024, // 1GB
  acceptedTypes = ['video/*', '.zip', '.pdf', '.txt', 'image/*'],
  disabled = false,
  loading = false,
  uploadedFiles = [],
  onRemoveFile,
}: FileUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const getFileIcon = (fileType: UploadedFile['type']) => {
    switch (fileType) {
      case 'video':
        return <FileVideo className="w-4 h-4" />;
      case 'code':
        return <Code2 className="w-4 h-4" />;
      case 'doc':
        return <FileText className="w-4 h-4" />;
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      default:
        return <Upload className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const validFiles: File[] = [];
    const newErrors: string[] = [];

    files.forEach((file) => {
      // Check file size
      if (file.size > maxFileSize) {
        newErrors.push(`${file.name} exceeds ${formatFileSize(maxFileSize)} limit`);
        return;
      }

      // Check file type (basic validation)
      const isAccepted = acceptedTypes.some((type) => {
        if (type.includes('*')) {
          const baseType = type.split('/')[0];
          return file.type.startsWith(baseType);
        }
        return file.name.toLowerCase().endsWith(type);
      });

      if (!isAccepted) {
        newErrors.push(`${file.name} is not an accepted file type`);
        return;
      }

      validFiles.push(file);
    });

    return { valid: validFiles, errors: newErrors };
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const { valid, errors } = validateFiles(Array.from(files));

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    setErrors([]);
    onFilesSelected(valid);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !loading) {
      setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!disabled && !loading) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        } ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          disabled={disabled || loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="File upload"
        />

        <div className="pointer-events-none">
          <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Drag files here or click to select
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Max {formatFileSize(maxFileSize)} per file
          </p>
        </div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground">Uploading...</p>
            </div>
          </div>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, idx) => (
            <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20">
              <AlertCircle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
              <p className="text-xs text-danger">{error}</p>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Uploaded Files ({uploadedFiles.length})
          </p>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface/50 hover:bg-surface transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 text-muted-foreground">
                    {getFileIcon(file.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>

                      {/* Status indicator */}
                      {file.status === 'completed' && (
                        <div className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-ok" />
                          <span className="text-xs text-ok">Uploaded</span>
                        </div>
                      )}

                      {file.status === 'uploading' && (
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-primary">Uploading</span>
                        </div>
                      )}

                      {file.status === 'failed' && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-danger" />
                          <span className="text-xs text-danger">Failed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                {file.status !== 'uploading' && onRemoveFile && (
                  <button
                    onClick={() => onRemoveFile(file.id)}
                    disabled={disabled || loading}
                    className="ml-2 flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thumbnail preview for videos */}
      {uploadedFiles
        .filter((f) => f.type === 'video' && f.thumbnail_url)
        .map((file) => (
          <div key={file.id} className="rounded-lg overflow-hidden border border-border">
            <img
              src={file.thumbnail_url}
              alt={file.name}
              className="w-full h-32 object-cover bg-background"
            />
          </div>
        ))}
    </div>
  );
}
