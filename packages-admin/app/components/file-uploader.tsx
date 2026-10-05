'use client';

import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/events';

interface FileUploaderProps {
  bucketName: string;
  assetType: 'image' | 'video' | 'pdf' | 'document' | 'audio';
  onSuccess?: (url: string, assetId?: string) => void;
  maxSize?: number; // in MB
  accept?: string;
}

export function FileUploader({
  bucketName,
  assetType,
  onSuccess,
  maxSize = 50,
  accept = '*',
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        throw new Error(`File size exceeds ${maxSize}MB limit`);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const ext = file.name.split('.').pop();
      const filename = `${timestamp}-${random}.${ext}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filename);

      // Save asset record to database
      const { data: assetData, error: assetError } = await supabase
        .from('content_assets')
        .insert([
          {
            filename,
            asset_type: assetType,
            file_size: file.size,
            mime_type: file.type,
            storage_path: data.path,
            public_url: publicData.publicUrl,
          },
        ])
        .select()
        .single();

      if (assetError) throw assetError;

      return {
        url: publicData.publicUrl,
        assetId: assetData.id,
      };
    },
    onSuccess: (result) => {
      eventBus.emit('admin:asset-uploaded', {
        assetId: result.assetId,
        assetType,
      });
      onSuccess?.(result.url, result.assetId);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      handleUpload(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    await uploadMutation.mutateAsync(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getAssetIcon = () => {
    switch (assetType) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'pdf':
        return '📄';
      case 'document':
        return '📑';
      case 'audio':
        return '🎵';
      default:
        return '📁';
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`relative p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-slate-300 bg-slate-50 hover:border-primary-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleChange}
          accept={accept}
          className="hidden"
          disabled={uploadMutation.isPending}
        />

        <div className="text-center">
          <div className="text-4xl mb-2">{getAssetIcon()}</div>
          <p className="text-lg font-medium text-slate-900">
            Drop {assetType} here or click to upload
          </p>
          <p className="text-sm text-slate-600 mt-1">
            Max file size: {maxSize}MB
          </p>
        </div>
      </div>

      {/* File Info */}
      {selectedFile && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">{selectedFile.name}</p>
              <p className="text-sm text-slate-600">
                {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
              </p>
            </div>
            {uploadMutation.isPending ? (
              <div className="text-primary-600 text-sm font-medium">Uploading...</div>
            ) : uploadMutation.isSuccess ? (
              <div className="text-success text-sm font-medium">✓ Uploaded</div>
            ) : null}
          </div>
        </div>
      )}

      {/* Error Message */}
      {uploadMutation.isError && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-error">
            {uploadMutation.error instanceof Error
              ? uploadMutation.error.message
              : 'Upload failed. Please try again.'}
          </p>
        </div>
      )}

      {/* Success Message */}
      {uploadMutation.isSuccess && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-success">File uploaded successfully!</p>
        </div>
      )}
    </div>
  );
}
