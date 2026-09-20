'use client';

import React, { useState } from 'react';
import { useUploadAsset, useCreateAssetFromUrl } from '../hooks';
import type { ContentAsset } from '../types';

interface AssetUploaderProps {
  documentId: string;
  onAssetAdded?: (asset: ContentAsset) => void;
}

export const AssetUploader: React.FC<AssetUploaderProps> = ({
  documentId,
  onAssetAdded,
}) => {
  const { uploadAsset, loading: uploading, error: uploadError } = useUploadAsset();
  const { createAssetFromUrl, loading: creating, error: createError } =
    useCreateAssetFromUrl();

  const [tab, setTab] = useState<'file' | 'url'>('file');
  const [dragActive, setDragActive] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [fileDescription, setFileDescription] = useState('');
  const [fileType, setFileType] = useState<ContentAsset['asset_type']>('pdf');

  // URL state
  const [urlValue, setUrlValue] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [urlDescription, setUrlDescription] = useState('');
  const [urlAssetType, setUrlAssetType] = useState<ContentAsset['asset_type']>('video');

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

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !fileTitle) {
      alert('Please select a file and enter a title');
      return;
    }

    try {
      const asset = await uploadAsset(documentId, selectedFile, {
        asset_type: fileType,
        title: fileTitle,
        description: fileDescription,
        file_name: selectedFile.name,
      });

      onAssetAdded?.(asset);

      // Reset form
      setSelectedFile(null);
      setFileTitle('');
      setFileDescription('');
      setFileType('pdf');
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleUrlCreate = async () => {
    if (!urlValue || !urlTitle) {
      alert('Please enter a URL and title');
      return;
    }

    try {
      const asset = await createAssetFromUrl(documentId, {
        asset_type: urlAssetType,
        title: urlTitle,
        description: urlDescription,
        file_url: urlValue,
      });

      onAssetAdded?.(asset);

      // Reset form
      setUrlValue('');
      setUrlTitle('');
      setUrlDescription('');
      setUrlAssetType('video');
    } catch (err) {
      console.error('URL asset creation failed:', err);
    }
  };

  const error = uploadError || createError;
  const loading = uploading || creating;

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Add Learning Resources</h3>
        <p className="text-sm text-gray-500 mt-1">Upload files or add external URLs</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('file')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            tab === 'file'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📤 Upload File
        </button>
        <button
          onClick={() => setTab('url')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            tab === 'url'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          🔗 Add URL
        </button>
      </div>

      {/* File Upload */}
      {tab === 'file' && (
        <div className="space-y-4">
          {/* Drag Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}
          >
            <div className="text-4xl mb-2">📁</div>
            <p className="font-medium text-gray-900">
              {selectedFile ? selectedFile.name : 'Drag file here or click to select'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Supports PDF, images, documents (up to 10MB)
            </p>
            <input
              type="file"
              onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="inline-block mt-4">
              <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                Browse Files
              </button>
            </label>
          </div>

          {/* File Details */}
          {selectedFile && (
            <div className="space-y-3 bg-gray-50 p-4 rounded">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={fileTitle}
                  onChange={(e) => setFileTitle(e.target.value)}
                  placeholder="e.g., Robot Assembly Guide"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  placeholder="What is this resource for?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Type
                </label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as ContentAsset['asset_type'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="image">Image</option>
                  <option value="document">Document</option>
                  <option value="video">Video File</option>
                </select>
              </div>

              <button
                onClick={handleFileUpload}
                disabled={loading || !fileTitle}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* URL Input */}
      {tab === 'url' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resource URL
            </label>
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://youtube.com/... or https://docs.google.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supports: YouTube, Google Docs, Google Drive, Google Slides, etc.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={urlTitle}
              onChange={(e) => setUrlTitle(e.target.value)}
              placeholder="e.g., Motor Basics Tutorial"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={urlDescription}
              onChange={(e) => setUrlDescription(e.target.value)}
              placeholder="What does this resource teach?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset Type
            </label>
            <select
              value={urlAssetType}
              onChange={(e) => setUrlAssetType(e.target.value as ContentAsset['asset_type'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="video">Video</option>
              <option value="document">Google Docs</option>
              <option value="slide">Google Slides</option>
              <option value="link">Link</option>
            </select>
          </div>

          <button
            onClick={handleUrlCreate}
            disabled={loading || !urlValue || !urlTitle}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Adding...' : 'Add Resource'}
          </button>
        </div>
      )}
    </div>
  );
};
