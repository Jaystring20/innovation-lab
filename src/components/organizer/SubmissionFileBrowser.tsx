import { useState } from 'react';
import {
  Download,
  ExternalLink,
  FileVideo,
  FileText,
  Code2,
  Image as ImageIcon,
  Link2,
  Loader,
} from 'lucide-react';
import type { UploadedFile, SubmissionPayload } from '@/lib/lab';

interface SubmissionFileBrowserProps {
  payload: SubmissionPayload;
  uploadedFiles?: UploadedFile[];
  teamName: string;
  stageName: string;
  isLoading?: boolean;
}

export function SubmissionFileBrowser({
  payload,
  uploadedFiles = [],
  teamName,
  stageName,
  isLoading = false,
}: SubmissionFileBrowserProps) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  const getFileIcon = (fileType: UploadedFile['type']) => {
    const iconClass = 'w-5 h-5';
    switch (fileType) {
      case 'video':
        return <FileVideo className={iconClass} />;
      case 'code':
        return <Code2 className={iconClass} />;
      case 'doc':
        return <FileText className={iconClass} />;
      case 'image':
        return <ImageIcon className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-ok';
      case 'uploading':
        return 'text-primary';
      case 'failed':
        return 'text-danger';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓ Uploaded';
      case 'uploading':
        return '↻ Uploading...';
      case 'failed':
        return '✕ Failed';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {teamName} — {stageName}
        </h3>
        <p className="text-sm text-muted-foreground">
          Submitted files and links
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-5 h-5 animate-spin text-primary mr-2" />
          <p className="text-sm text-muted-foreground">Loading files...</p>
        </div>
      )}

      {!isLoading && uploadedFiles.length === 0 && !payload.video_url && (
        <div className="rounded-lg border border-border bg-surface/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No files or links submitted yet
          </p>
        </div>
      )}

      {/* Uploaded Files Section */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">
              Uploaded Files
            </h4>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              {uploadedFiles.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="rounded-lg border border-border bg-surface hover:border-primary/50 transition-colors overflow-hidden"
              >
                {/* Thumbnail Preview for Videos */}
                {file.type === 'video' && file.thumbnail_url && (
                  <div className="aspect-video bg-background overflow-hidden">
                    <img
                      src={file.thumbnail_url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Thumbnail Preview for Images */}
                {file.type === 'image' && file.thumbnail_url && (
                  <div className="aspect-video bg-background overflow-hidden">
                    <img
                      src={file.thumbnail_url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* File Info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="text-muted-foreground flex-shrink-0">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${getStatusColor(file.status)}`}>
                      {getStatusLabel(file.status)}
                    </span>
                  </div>

                  {/* Preview Metadata */}
                  {file.preview_metadata && (
                    <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
                      {file.preview_metadata.duration && (
                        <p>Duration: {Math.round(file.preview_metadata.duration / 60)}m</p>
                      )}
                      {file.preview_metadata.pageCount && (
                        <p>Pages: {file.preview_metadata.pageCount}</p>
                      )}
                      {file.preview_metadata.language && (
                        <p>Language: {file.preview_metadata.language}</p>
                      )}
                      {file.preview_metadata.width && file.preview_metadata.height && (
                        <p>
                          Resolution: {file.preview_metadata.width}x
                          {file.preview_metadata.height}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {file.status === 'completed' && file.gdrive_url && (
                    <div className="flex gap-2 pt-3 border-t border-border">
                      <a
                        href={file.gdrive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View in Drive
                      </a>
                      <button
                        onClick={() => window.open(file.gdrive_url, '_blank')}
                        className="px-3 py-2 rounded text-xs font-medium bg-border hover:bg-border/80 transition-colors"
                        title="Download file"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Links Section */}
      {(payload.video_url || payload.repo_url || payload.doc_url) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">
              Optional Links
            </h4>
          </div>

          <div className="space-y-2">
            {payload.video_url && (
              <LinkItem
                label="Video"
                url={payload.video_url}
                icon={<FileVideo className="w-4 h-4" />}
              />
            )}
            {payload.repo_url && (
              <LinkItem
                label="Repository"
                url={payload.repo_url}
                icon={<Code2 className="w-4 h-4" />}
              />
            )}
            {payload.doc_url && (
              <LinkItem
                label="Documentation"
                url={payload.doc_url}
                icon={<FileText className="w-4 h-4" />}
              />
            )}
          </div>
        </div>
      )}

      {/* Notes Section */}
      {payload.notes && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Notes</h4>
          <div className="p-4 rounded-lg border border-border bg-surface/50">
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {payload.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface LinkItemProps {
  label: string;
  url: string;
  icon: React.ReactNode;
}

function LinkItem({ label, url, icon }: LinkItemProps) {
  const getDomain = (urlString: string) => {
    try {
      const u = new URL(urlString);
      return u.hostname.replace('www.', '');
    } catch {
      return urlString;
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface/50 hover:bg-surface hover:border-primary/50 transition-colors group"
    >
      <div className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground truncate">
          {getDomain(url)}
        </p>
      </div>
      <Link2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    </a>
  );
}
