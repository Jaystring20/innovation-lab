'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/events';

const memberSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  role: z.enum(['leader', 'developer', 'designer', 'researcher']),
});

const teamSchema = z.object({
  name: z.string().min(3, 'Team name required'),
  description: z.string().optional(),
  school_or_org: z.string().min(2, 'School/Organization required'),
  stage_id: z.string().uuid('Must select a stage'),
  members: z.array(memberSchema).min(1, 'At least one member required'),
  mentor_name: z.string().optional(),
  mentor_email: z.string().email().optional().or(z.literal('')),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface TeamRegistrationManagerProps {
  teamId?: string;
  onSuccess?: () => void;
}

export function TeamRegistrationManager({
  teamId,
  onSuccess,
}: TeamRegistrationManagerProps) {
  const isEditing = !!teamId;

  // Fetch existing team
  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      if (!teamId) return null;
      const { data } = await supabase
        .from('teams')
        .select('*, team_members(*)')
        .eq('id', teamId)
        .single();
      return data;
    },
    enabled: !!isEditing,
  });

  // Fetch stages
  const { data: stages } = useQuery({
    queryKey: ['competition-stages'],
    queryFn: async () => {
      const { data } = await supabase
        .from('competition_stages')
        .select('id, name')
        .eq('status', 'active')
        .order('order_index');
      return data || [];
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: team || {
      name: '',
      description: '',
      school_or_org: '',
      stage_id: '',
      members: [
        {
          name: '',
          email: '',
          role: 'leader',
        },
      ],
      mentor_name: '',
      mentor_email: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'members',
  });

  // Save team mutation
  const saveMutation = useMutation({
    mutationFn: async (data: TeamFormData) => {
      const teamData = {
        name: data.name,
        description: data.description,
        school_or_org: data.school_or_org,
        stage_id: data.stage_id,
        mentor_name: data.mentor_name,
        mentor_email: data.mentor_email || null,
        status: 'active' as const,
      };

      let finalTeamId = teamId;

      if (isEditing) {
        const { error } = await supabase
          .from('teams')
          .update(teamData)
          .eq('id', teamId);
        if (error) throw error;
      } else {
        const { data: newTeam, error } = await supabase
          .from('teams')
          .insert([teamData])
          .select()
          .single();
        if (error) throw error;
        finalTeamId = newTeam.id;
      }

      // Save team members
      if (data.members.length > 0) {
        const { error: memberError } = await supabase
          .from('team_members')
          .insert(
            data.members.map((member) => ({
              ...member,
              team_id: finalTeamId,
            }))
          );
        if (memberError) throw memberError;
      }
    },
    onSuccess: () => {
      eventBus.emit('admin:content-saved', {
        module: 'competition',
        contentType: 'team',
        contentId: teamId || 'new',
      });
      onSuccess?.();
      reset();
    },
  });

  const onSubmit = async (data: TeamFormData) => {
    await saveMutation.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
      {/* Team Information */}
      <div className="space-y-4 border-b border-slate-200 pb-6">
        <h3 className="text-lg font-semibold text-slate-900">Team Information</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Team Name
          </label>
          <input
            {...register('name')}
            type="text"
            placeholder="e.g., Innovation Builders"
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-error">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            School/Organization
          </label>
          <input
            {...register('school_or_org')}
            type="text"
            placeholder="e.g., Tech Academy High School"
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
          {errors.school_or_org && (
            <p className="mt-1 text-sm text-error">
              {errors.school_or_org.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Competition Stage
          </label>
          <select
            {...register('stage_id')}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          >
            <option value="">Select a stage</option>
            {stages?.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
          {errors.stage_id && (
            <p className="mt-1 text-sm text-error">{errors.stage_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Team Description
          </label>
          <textarea
            {...register('description')}
            placeholder="Brief description of the team's focus or background..."
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
        </div>
      </div>

      {/* Mentor Information */}
      <div className="space-y-4 border-b border-slate-200 pb-6">
        <h3 className="text-lg font-semibold text-slate-900">Mentor (Optional)</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mentor Name
            </label>
            <input
              {...register('mentor_name')}
              type="text"
              placeholder="Mentor's full name"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mentor Email
            </label>
            <input
              {...register('mentor_email')}
              type="email"
              placeholder="mentor@example.com"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
            />
            {errors.mentor_email && (
              <p className="mt-1 text-sm text-error">
                {errors.mentor_email.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Team Members</h3>
          <span className="text-sm text-slate-600">{fields.length} member(s)</span>
        </div>

        {fields.map((field, idx) => (
          <div key={field.id} className="p-6 border border-slate-200 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900">Member {idx + 1}</h4>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="text-error hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Name
                </label>
                <input
                  {...register(`members.${idx}.name`)}
                  type="text"
                  placeholder="Full name"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                />
                {errors.members?.[idx]?.name && (
                  <p className="mt-1 text-sm text-error">
                    {errors.members[idx]?.name?.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  {...register(`members.${idx}.email`)}
                  type="email"
                  placeholder="member@example.com"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                />
                {errors.members?.[idx]?.email && (
                  <p className="mt-1 text-sm text-error">
                    {errors.members[idx]?.email?.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role
              </label>
              <select
                {...register(`members.${idx}.role`)}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                <option value="leader">Team Leader</option>
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="researcher">Researcher</option>
              </select>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            append({
              name: '',
              email: '',
              role: 'developer',
            })
          }
          className="w-full rounded-lg border-2 border-dashed border-secondary-300 py-3 font-medium text-secondary-600 hover:bg-secondary-50 transition-colors"
        >
          + Add Team Member
        </button>

        {errors.members && (
          <p className="text-sm text-error">{errors.members.message}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="rounded-lg bg-secondary-600 px-6 py-2 font-medium text-white hover:bg-secondary-700 disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Saving...' : 'Register Team'}
        </button>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg border border-slate-300 px-6 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          Reset
        </button>
      </div>

      {saveMutation.isSuccess && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-success">
          ✓ Team registered successfully with {fields.length} member(s)
        </div>
      )}
      {saveMutation.isError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-error">
          ✗ Failed to register team
        </div>
      )}
    </form>
  );
}
