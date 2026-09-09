'use client';

import { useState, useEffect } from 'react';
import { Upload, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FileUploadField } from '../FileUploadField';

interface SupplementaryMaterial {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedDate: string;
  syncStatus: 'synced' | 'syncing' | 'failed';
  studentsSynced: number;
  totalStudents: number;
}

interface TeacherSupplementaryUploadProps {
  schoolId: string;
  teacherId: string;
  stageId: string;
  onUploaded?: () => void;
}

export function TeacherSupplementaryUpload({
  schoolId,
  teacherId,
  stageId,
  onUploaded,
}: TeacherSupplementaryUploadProps) {
  const [materials, setMaterials] = useState<SupplementaryMaterial[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Load existing materials from Supabase
  useEffect(() => {
    const loadMaterials = async () => {
      const { data } = await supabase
        .from('teacher_supplementary_materials')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('stage_id', stageId)
        .order('uploaded_date', { ascending: false });

      if (data) {
        setMaterials(
          data.map((m) => ({
            id: m.id,
            name: m.file_name,
            size: m.file_size || 'Unknown',
            type: m.file_type || 'file',
            uploadedDate: new Date(m.uploaded_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
            syncStatus: (m.sync_status || 'synced') as 'synced' | 'syncing' | 'failed',
            studentsSynced: m.students_synced || 0,
            totalStudents: m.total_students || 0,
          }))
        );
      }
    };
    loadMaterials();
  }, [teacherId, stageId]);

  const handleFilesSelected = async (files: File[]) => {
    setIsUploading(true);
    try {
      // Upload files and save to Supabase
      const uploadedMaterials: SupplementaryMaterial[] = [];

      for (const file of files) {
        // Simulate file upload (in real implementation, upload to Google Drive)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const newMaterial: SupplementaryMaterial = {
          id: `mat-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          type: file.type.split('/')[1] || 'file',
          uploadedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          syncStatus: 'syncing',
          studentsSynced: 0,
          totalStudents: 0,
        };

        // Save to Supabase
        const { data } = await supabase
          .from('teacher_supplementary_materials')
          .insert({
            school_id: schoolId,
            teacher_id: teacherId,
            stage_id: stageId,
            file_name: file.name,
            file_size: newMaterial.size,
            file_type: newMaterial.type,
            sync_status: 'pending',
          })
          .select()
          .single();

        if (data) {
          newMaterial.id = data.id;
          uploadedMaterials.push(newMaterial);
        }
      }

      setMaterials((prev) => [...uploadedMaterials, ...prev]);
      onUploaded?.();

      // Simulate sync completion
      setTimeout(() => {
        setMaterials((prev) =>
          prev.map((m) =>
            uploadedMaterials.some((nm) => nm.id === m.id)
              ? { ...m, syncStatus: 'synced' as const, studentsSynced: 28 }
              : m
          )
        );
      }, 3000);

      onUploaded?.();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <section className="border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-500 text-zinc-900 dark:text-zinc-100">
            Your Supplementary Materials
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            Add your own resources to help your students learn better
          </p>
        </div>
        <span className="text-xs font-500 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
          ✅ Auto-syncs
        </span>
      </div>

      {/* Upload Field */}
      <div className="mb-4">
        <FileUploadField
          onFilesSelected={handleFilesSelected}
          isDisabled={isUploading}
          maxFiles={5}
          acceptedTypes={[
            'video/*',
            'application/pdf',
            '.doc',
            '.docx',
            '.xls',
            '.xlsx',
            '.ppt',
            '.pptx',
            'image/*',
            '.fig',
            'application/zip',
          ]}
        />
      </div>

      {/* Uploaded Materials List */}
      {materials.length > 0 && (
        <div className="space-y-2">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex gap-3 p-3 bg-white dark:bg-zinc-900/50 border border-blue-200 dark:border-blue-800 rounded-lg"
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center text-lg">
                {material.type === 'Figma file' && '🎨'}
                {material.type === 'PDF' && '📄'}
                {material.type === 'video' && '📹'}
                {material.type === 'presentation' && '📊'}
                {!['Figma file', 'PDF', 'video', 'presentation'].includes(material.type) && '📋'}
              </div>

              {/* Info */}
              <div className="flex-grow min-w-0">
                <h4 className="text-xs font-500 text-zinc-900 dark:text-zinc-100 truncate">
                  {material.name}
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  {material.size} · {material.type} · {material.uploadedDate}
                </p>

                {/* Sync Status */}
                {material.syncStatus === 'synced' && (
                  <p className="text-xs font-500 text-green-600 dark:text-green-400 mt-1">
                    ✅ Synced to {material.studentsSynced}/{material.totalStudents} students
                  </p>
                )}
                {material.syncStatus === 'syncing' && (
                  <p className="text-xs font-500 text-amber-600 dark:text-amber-400 mt-1">
                    ⏳ Syncing to {material.studentsSynced}/{material.totalStudents} students...
                  </p>
                )}
                {material.syncStatus === 'failed' && (
                  <p className="text-xs font-500 text-red-600 dark:text-red-400 mt-1">
                    ⚠️ Sync failed · {material.studentsSynced}/{material.totalStudents} students
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex gap-1">
                <button
                  className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition"
                  title="View how students see this"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteMaterial(material.id)}
                  className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded transition"
                  title="Delete material"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-3 p-3 bg-white dark:bg-zinc-900/50 rounded border border-zinc-200 dark:border-zinc-700">
        💡 <strong>What to upload:</strong> Videos, PDFs, templates, examples,
        slides, code snippets, worksheets, case studies, or any resource that
        helps your students understand the material better.
      </p>
    </section>
  );
}
