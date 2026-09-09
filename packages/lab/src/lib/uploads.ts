/**
 * File upload utilities for the Lab — handle team submissions to Supabase Storage.
 * Supports offline queueing when the connection fails.
 */

import { supabase } from './supabase';

export interface UploadFile {
  file: File;
  purpose: 'video' | 'doc' | 'image'; // Purpose determines folder structure
}

export interface UploadProgress {
  fileName: string;
  bytesUploaded: number;
  bytesTotal: number;
  percent: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export interface QueuedUpload {
  id: string;
  submissionId: string;
  teamId: string;
  file: File;
  purpose: 'video' | 'doc' | 'image';
  addedAt: number;
  attempts: number;
}

// Bucket name (should be created in Supabase dashboard)
const BUCKET_NAME = 'team-submissions';

// File size limits (in bytes)
export const SIZE_LIMITS = {
  video: 5 * 1024 * 1024 * 1024, // 5 GB
  doc: 100 * 1024 * 1024, // 100 MB
  image: 50 * 1024 * 1024, // 50 MB
};

// Allowed file types
export const ALLOWED_TYPES = {
  video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
  doc: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/markdown',
  ],
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
};

export class UploadError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

/**
 * Validate a file before upload.
 */
export function validateFile(file: File, purpose: 'video' | 'doc' | 'image'): void {
  const limit = SIZE_LIMITS[purpose];
  if (file.size > limit) {
    const limitMB = Math.floor(limit / 1024 / 1024);
    throw new UploadError(
      `File exceeds ${limitMB}MB limit for ${purpose} uploads`,
      'FILE_TOO_LARGE',
    );
  }

  const allowed = ALLOWED_TYPES[purpose];
  if (!allowed.includes(file.type)) {
    throw new UploadError(`File type not allowed for ${purpose} uploads`, 'INVALID_TYPE');
  }
}

/**
 * Upload a single file to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
  file: File,
  submissionId: string,
  purpose: 'video' | 'doc' | 'image',
  onProgress?: (progress: UploadProgress) => void,
): Promise<string> {
  // Validate first
  validateFile(file, purpose);

  // Generate path: submissions/{purpose}/{submissionId}/{timestamp}-{filename}
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `submissions/${purpose}/${submissionId}/${timestamp}-${sanitizedName}`;

  // Create FormData for manual upload with progress tracking
  const formData = new FormData();
  formData.append('file', file);

  try {
    // Use supabase storage upload with progress callback
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true, // Overwrite if exists
      });

    if (error) {
      throw new UploadError(
        `Upload failed: ${error.message}`,
        error.name || 'UPLOAD_FAILED',
      );
    }

    // Report success
    if (onProgress) {
      onProgress({
        fileName: file.name,
        bytesUploaded: file.size,
        bytesTotal: file.size,
        percent: 100,
        status: 'success',
      });
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return publicData.publicUrl;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown upload error';
    if (onProgress) {
      onProgress({
        fileName: file.name,
        bytesUploaded: 0,
        bytesTotal: file.size,
        percent: 0,
        status: 'error',
        error: message,
      });
    }
    throw new UploadError(message, 'UPLOAD_FAILED');
  }
}

/**
 * Offline queue management — persist failed uploads to localStorage.
 */
const QUEUE_KEY = 'lab_upload_queue';

export function getUploadQueue(): QueuedUpload[] {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addToQueue(upload: Omit<QueuedUpload, 'addedAt' | 'attempts'>): void {
  const queue = getUploadQueue();
  const queued: QueuedUpload = {
    ...upload,
    addedAt: Date.now(),
    attempts: 0,
  };
  queue.push(queued);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function removeFromQueue(uploadId: string): void {
  const queue = getUploadQueue();
  const filtered = queue.filter((q) => q.id !== uploadId);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

export function updateQueueAttempt(uploadId: string): void {
  const queue = getUploadQueue();
  const item = queue.find((q) => q.id === uploadId);
  if (item) {
    item.attempts++;
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * Process queued uploads when network is available.
 * Should be called when the app detects network connectivity.
 */
export async function processUploadQueue(
  onUpdate?: (progress: QueuedUpload[]) => void,
): Promise<{ succeeded: string[]; failed: QueuedUpload[] }> {
  const queue = getUploadQueue();
  const succeeded: string[] = [];
  const failed: QueuedUpload[] = [];

  for (const queued of queue) {
    try {
      // Attempt upload
      await uploadFile(queued.file, queued.submissionId, queued.purpose);
      succeeded.push(queued.id);
      removeFromQueue(queued.id);
    } catch (err) {
      queued.attempts++;
      if (queued.attempts >= 3) {
        // Max 3 retries
        failed.push(queued);
        removeFromQueue(queued.id);
      } else {
        updateQueueAttempt(queued.id);
        failed.push(queued);
      }
    }

    if (onUpdate) {
      onUpdate(getUploadQueue());
    }
  }

  return { succeeded, failed };
}

/**
 * Check if network is available (rough heuristic).
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}
