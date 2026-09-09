'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RoleTemplate {
  id: string;
  template_name: string;
  description: string;
  roles: Array<{ name: string; description: string }>;
}

interface TeamMember {
  id: string;
  studentId: string;
  fullName: string;
  assignedRole: string;
  roleDescription: string;
  email: string;
}

interface TeamSetup {
  teamId: string;
  teamName: string;
  templateId: string | null;
  isCustom: boolean;
  roles: Array<{ name: string; description: string }>;
  members: TeamMember[];
}

interface TeamSetupProps {
  schoolId: string;
  teacherId: string;
  teamId: string;
  teamName: string;
  students: Array<{ id: string; email: string; name: string }>;
  onSave?: (config: TeamSetup) => void;
}

export function TeamSetup({
  schoolId,
  teacherId,
  teamId,
  teamName,
  students,
  onSave,
}: TeamSetupProps) {
  const [step, setStep] = useState<'template' | 'assign-roles' | 'assign-members'>('template');
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<RoleTemplate | null>(null);
  const [isCustomRoles, setIsCustomRoles] = useState(false);
  const [customRoles, setCustomRoles] = useState<Array<{ name: string; description: string }>>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [assignments, setAssignments] = useState<TeamMember[]>([]);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentRoles = isCustomRoles ? customRoles : selectedTemplate?.roles || [];

  // Load role templates from Supabase
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('role_templates')
          .select('*')
          .order('is_default', { ascending: false });

        if (fetchError) throw fetchError;

        const templates: RoleTemplate[] = (data || []).map((t) => ({
          id: t.id,
          template_name: t.template_name,
          description: t.description,
          roles: t.roles,
        }));

        setRoleTemplates(templates);
        if (templates.length > 0) {
          setSelectedTemplate(templates[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // Initialize assignments
  useEffect(() => {
    if (students.length > 0 && currentRoles.length > 0) {
      const newAssignments: TeamMember[] = students.slice(0, currentRoles.length).map((student, index) => ({
        id: student.id,
        studentId: student.id,
        fullName: student.name,
        assignedRole: currentRoles[index]?.name || '',
        roleDescription: currentRoles[index]?.description || '',
        email: student.email,
      }));
      setAssignments(newAssignments);
    }
  }, [currentRoles, students]);

  const addCustomRole = () => {
    if (newRoleName.trim()) {
      setCustomRoles([
        ...customRoles,
        { name: newRoleName, description: newRoleDesc },
      ]);
      setNewRoleName('');
      setNewRoleDesc('');
    }
  };

  const removeCustomRole = (index: number) => {
    setCustomRoles(customRoles.filter((_, i) => i !== index));
  };

  const updateAssignment = (memberId: string, field: keyof TeamMember, value: string) => {
    setAssignments(
      assignments.map((m) =>
        m.id === memberId ? { ...m, [field]: value } : m
      )
    );
  };

  const addMoreMembers = () => {
    const unassignedStudents = students.filter(
      (s) => !assignments.find((a) => a.studentId === s.id)
    );

    if (unassignedStudents.length > 0) {
      const nextStudent = unassignedStudents[0];
      setAssignments([
        ...assignments,
        {
          id: nextStudent.id,
          studentId: nextStudent.id,
          fullName: nextStudent.name,
          assignedRole: '',
          roleDescription: '',
          email: nextStudent.email,
        },
      ]);
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      setSaving(true);
      setError(null);

      // 1. Save team configuration
      const { error: configError } = await supabase
        .from('team_configurations')
        .upsert({
          team_id: teamId,
          template_id: selectedTemplate?.id || null,
          is_custom: isCustomRoles,
          roles_count: currentRoles.length,
          configured_by: teacherId,
        }, { onConflict: 'team_id' });

      if (configError) throw configError;

      // 2. If custom roles, save them to custom_team_roles
      if (isCustomRoles) {
        for (const role of customRoles) {
          const { error: roleError } = await supabase
            .from('custom_team_roles')
            .upsert({
              team_id: teamId,
              role_name: role.name,
              role_description: role.description,
              created_by: teacherId,
            }, { onConflict: 'team_id,role_name' });

          if (roleError) throw roleError;
        }
      }

      // 3. Save team member profiles (assignments)
      for (const member of assignments) {
        if (member.assignedRole) {
          const { error: memberError } = await supabase
            .from('team_member_profiles')
            .upsert({
              team_id: teamId,
              student_id: member.studentId,
              assigned_role: member.assignedRole,
              full_name: member.fullName,
              bio: member.roleDescription,
              assigned_by: teacherId,
            }, { onConflict: 'team_id,student_id,assigned_role' });

          if (memberError) throw memberError;
        }
      }

      // Call the onSave callback with the configuration
      const config: TeamSetup = {
        teamId,
        teamName,
        templateId: selectedTemplate?.id || null,
        isCustom: isCustomRoles,
        roles: currentRoles,
        members: assignments,
      };

      onSave?.(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg p-6 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading role templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-500 text-red-900 dark:text-red-100">Error</p>
            <p className="text-xs text-red-800 dark:text-red-200 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-600 text-zinc-900 dark:text-zinc-100">
          Configure {teamName}
        </h2>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setStep('template')}
            className={`px-3 py-1 rounded ${
              step === 'template'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            1. Choose Roles
          </button>
          <button
            onClick={() => setStep('assign-roles')}
            className={`px-3 py-1 rounded ${
              step === 'assign-roles'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            2. Review Roles
          </button>
          <button
            onClick={() => setStep('assign-members')}
            className={`px-3 py-1 rounded ${
              step === 'assign-members'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            3. Assign Members
          </button>
        </div>
      </div>

      {/* STEP 1: Choose Role Template */}
      {step === 'template' && (
        <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-600 text-zinc-900 dark:text-zinc-100">
            Choose a role template or create custom roles
          </h3>

          {/* Template Options */}
          <div className="space-y-2">
            {roleTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template);
                  setIsCustomRoles(false);
                }}
                className={`w-full p-4 border rounded-lg text-left transition ${
                  selectedTemplate?.id === template.id && !isCustomRoles
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-500 text-zinc-900 dark:text-zinc-100">
                      {template.template_name}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      {template.description}
                    </p>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {template.roles.map((role) => (
                        <span
                          key={role.name}
                          className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded"
                        >
                          {role.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectedTemplate?.id === template.id && !isCustomRoles && (
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Roles Option */}
          <button
            onClick={() => {
              setIsCustomRoles(true);
              setSelectedTemplate(null);
            }}
            className={`w-full p-4 border rounded-lg text-left transition ${
              isCustomRoles
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="font-500 text-zinc-900 dark:text-zinc-100">
                Create Custom Roles
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Define your own role names and descriptions for this team
            </p>
          </button>

          {/* Next Button */}
          <button
            onClick={() => setStep('assign-roles')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-500"
          >
            Next: Review Roles
          </button>
        </div>
      )}

      {/* STEP 2: Review/Edit Roles */}
      {step === 'assign-roles' && (
        <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-600 text-zinc-900 dark:text-zinc-100">
            {isCustomRoles ? 'Create Custom Roles' : 'Review Roles'}
          </h3>

          {isCustomRoles ? (
            <>
              {/* Add Custom Roles */}
              <div className="space-y-3">
                {customRoles.map((role, index) => (
                  <div
                    key={index}
                    className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-start justify-between"
                  >
                    <div>
                      <p className="font-500 text-zinc-900 dark:text-zinc-100">{role.name}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        {role.description}
                      </p>
                    </div>
                    <button
                      onClick={() => removeCustomRole(index)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Role */}
              <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-4 space-y-3">
                <p className="text-xs font-600 text-zinc-600 dark:text-zinc-400">Add New Role</p>
                <input
                  type="text"
                  placeholder="Role name (e.g., Design Lead)"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs"
                />
                <textarea
                  placeholder="Role description"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs"
                  rows={2}
                />
                <button
                  onClick={addCustomRole}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs font-500 flex items-center justify-center gap-2"
                >
                  <Plus className="w-3 h-3" />
                  Add Role
                </button>
              </div>
            </>
          ) : (
            /* Display Template Roles */
            <div className="space-y-2">
              {currentRoles.map((role, index) => (
                <div
                  key={index}
                  className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                >
                  <p className="font-500 text-zinc-900 dark:text-zinc-100">{role.name}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    {role.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => setStep('template')}
              className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-sm font-500"
            >
              Back
            </button>
            <button
              onClick={() => setStep('assign-members')}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-500"
            >
              Next: Assign Members
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Assign Team Members */}
      {step === 'assign-members' && (
        <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-600 text-zinc-900 dark:text-zinc-100">
            Assign students to roles
          </h3>

          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            You have {students.length} students and {currentRoles.length} roles in your template.
            Assign them here.
          </p>

          {/* Member Assignments */}
          <div className="space-y-3">
            {assignments.map((member) => (
              <div
                key={member.id}
                className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-3"
              >
                {editingMember === member.id ? (
                  <>
                    <input
                      type="text"
                      value={member.fullName}
                      onChange={(e) => updateAssignment(member.id, 'fullName', e.target.value)}
                      placeholder="Student full name"
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm"
                    />
                    <select
                      value={member.assignedRole}
                      onChange={(e) => {
                        const selectedRole = currentRoles.find((r) => r.name === e.target.value);
                        updateAssignment(member.id, 'assignedRole', e.target.value);
                        if (selectedRole) {
                          updateAssignment(member.id, 'roleDescription', selectedRole.description);
                        }
                      }}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm"
                    >
                      <option value="">Select a role...</option>
                      {currentRoles.map((role) => (
                        <option key={role.name} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingMember(null)}
                        className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-xs font-500 flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingMember(null)}
                        className="flex-1 px-3 py-1 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-500 flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-500 text-zinc-900 dark:text-zinc-100">
                          {member.fullName}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">{member.email}</p>
                      </div>
                      <button
                        onClick={() => setEditingMember(member.id)}
                        className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded">
                      <p className="text-xs font-500 text-blue-900 dark:text-blue-100">
                        {member.assignedRole || 'No role assigned yet'}
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                        {member.roleDescription}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add More Members */}
          {assignments.length < students.length && (
            <button
              onClick={addMoreMembers}
              className="w-full px-4 py-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 transition text-sm font-500 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Another Member
            </button>
          )}

          {/* Final Actions */}
          <div className="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setStep('assign-roles')}
              className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition font-500"
            >
              Back
            </button>
            <button
              onClick={handleSaveConfiguration}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-500"
            >
              {saving ? 'Saving...' : '✅ Save Team Configuration'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
