// Admin Dashboard Hooks
// Reusable data fetching and mutation hooks

import { useCallback, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type {
  Level,
  Lesson,
  Assessment,
  LabMission,
  ContentAsset,
  Tier,
} from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// ============================================================================
// LEVELS HOOKS
// ============================================================================

export function useLevels(tierId: string) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLevels = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('levels')
        .select('*')
        .eq('tier_id', tierId)
        .order('order_index', { ascending: true });

      if (err) throw err;
      setLevels(data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tierId]);

  return { levels, loading, error, fetchLevels };
}

export function useCreateLevel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLevel = useCallback(
    async (levelData: Partial<Level>) => {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from('levels')
          .insert([
            {
              document_id: crypto.randomUUID(),
              status: 'draft',
              version: 1,
              ...levelData,
            },
          ])
          .select()
          .single();

        if (err) throw err;
        return data;
      } catch (err) {
        const message = (err as Error).message;
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createLevel, loading, error };
}

export function useUpdateLevel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLevel = useCallback(async (id: string, updates: Partial<Level>) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('levels')
        .update({
          ...updates,
          last_edited_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;
      return data;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateLevel, loading, error };
}

// ============================================================================
// LESSONS HOOKS
// ============================================================================

export function useLessons(levelId: string) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('lessons')
        .select('*')
        .eq('level_id', levelId)
        .order('order_index', { ascending: true });

      if (err) throw err;
      setLessons(data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [levelId]);

  return { lessons, loading, error, fetchLessons };
}

export function useCreateLesson() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLesson = useCallback(async (lessonData: Partial<Lesson>) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('lessons')
        .insert([
          {
            document_id: crypto.randomUUID(),
            status: 'draft',
            version: 1,
            order_index: 1,
            ...lessonData,
          },
        ])
        .select()
        .single();

      if (err) throw err;
      return data;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createLesson, loading, error };
}

export function useUpdateLesson() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLesson = useCallback(async (id: string, updates: Partial<Lesson>) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('lessons')
        .update({
          ...updates,
          last_edited_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;
      return data;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateLesson, loading, error };
}

// ============================================================================
// ASSESSMENTS HOOKS
// ============================================================================

export function useAssessment(assessmentId: string) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessment = useCallback(async () => {
    setLoading(true);
    try {
      const { data: assessmentData, error: err1 } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (err1) throw err1;

      const { data: questionsData, error: err2 } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('order_index', { ascending: true });

      if (err2) throw err2;

      setAssessment({
        ...assessmentData,
        questions: questionsData || [],
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  return { assessment, loading, error, fetchAssessment };
}

export function useUpdateAssessment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAssessment = useCallback(
    async (id: string, updates: Partial<Assessment>) => {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from('assessments')
          .update({
            ...updates,
            last_edited_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (err) throw err;
        return data;
      } catch (err) {
        setError((err as Error).message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { updateAssessment, loading, error };
}

// ============================================================================
// MISSIONS HOOKS
// ============================================================================

export function useMissions(levelId: string) {
  const [missions, setMissions] = useState<LabMission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('lab_missions')
        .select('*')
        .eq('level_id', levelId)
        .order('created_at', { ascending: true });

      if (err) throw err;
      setMissions(data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [levelId]);

  return { missions, loading, error, fetchMissions };
}

export function useCreateMission() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMission = useCallback(async (missionData: Partial<LabMission>) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('lab_missions')
        .insert([
          {
            document_id: crypto.randomUUID(),
            status: 'draft',
            version: 1,
            ...missionData,
          },
        ])
        .select()
        .single();

      if (err) throw err;
      return data;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createMission, loading, error };
}

export function useUpdateMission() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMission = useCallback(
    async (id: string, updates: Partial<LabMission>) => {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from('lab_missions')
          .update({
            ...updates,
            last_edited_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (err) throw err;
        return data;
      } catch (err) {
        setError((err as Error).message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { updateMission, loading, error };
}

// ============================================================================
// ASSETS HOOKS
// ============================================================================

export function useUploadAsset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAsset = useCallback(
    async (
      documentId: string,
      file: File,
      assetData: Partial<ContentAsset>
    ) => {
      setLoading(true);
      try {
        const fileName = `${documentId}/${Date.now()}-${file.name}`;

        const { error: uploadErr } = await supabase.storage
          .from('lab-assets')
          .upload(fileName, file);

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from('lab-assets')
          .getPublicUrl(fileName);

        const { data, error: dbErr } = await supabase
          .from('content_assets')
          .insert([
            {
              document_id: documentId,
              file_url: urlData.publicUrl,
              storage_path: fileName,
              file_size: file.size,
              is_external: false,
              ...assetData,
            },
          ])
          .select()
          .single();

        if (dbErr) throw dbErr;
        return data;
      } catch (err) {
        setError((err as Error).message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { uploadAsset, loading, error };
}

export function useCreateAssetFromUrl() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAssetFromUrl = useCallback(
    async (documentId: string, assetData: Partial<ContentAsset>) => {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from('content_assets')
          .insert([
            {
              document_id: documentId,
              is_external: true,
              ...assetData,
            },
          ])
          .select()
          .single();

        if (err) throw err;
        return data;
      } catch (err) {
        setError((err as Error).message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createAssetFromUrl, loading, error };
}

// ============================================================================
// PUBLISHING HOOKS
// ============================================================================

export function usePublishContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publishLevel = useCallback(async (levelId: string) => {
    setLoading(true);
    try {
      const { data: draftLevel } = await supabase
        .from('levels')
        .select('*')
        .eq('id', levelId)
        .eq('status', 'draft')
        .single();

      if (!draftLevel) throw new Error('Draft level not found');

      // Create published row from draft
      const { data, error: err } = await supabase
        .from('levels')
        .insert([
          {
            ...draftLevel,
            id: crypto.randomUUID(),
            status: 'published',
          },
        ])
        .select()
        .single();

      if (err) throw err;
      return data;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { publishLevel, loading, error };
}
