/**
 * Role Management Utilities
 * Handles role assignment, validation, and formatting
 */

export type RoleType = 'Designer' | 'Builder' | 'AI Engineer' | 'Presenter' | 'Custom'

export interface Role {
  id: string
  name: RoleType
  description: string
  iconColor: string
  emoji: string
}

export const PRESET_ROLES: Role[] = [
  {
    id: 'designer',
    name: 'Designer',
    description: 'Leads design thinking, research, and prototyping',
    iconColor: '#E0A944',
    emoji: '🎨',
  },
  {
    id: 'builder',
    name: 'Builder',
    description: 'Leads hardware construction and assembly',
    iconColor: '#E85D3A',
    emoji: '🔨',
  },
  {
    id: 'ai-engineer',
    name: 'AI Engineer',
    description: 'Leads AI/ML integration and prompt engineering',
    iconColor: '#6B7DFF',
    emoji: '🤖',
  },
  {
    id: 'presenter',
    name: 'Presenter',
    description: 'Leads communication and presentation',
    iconColor: '#8B5CF6',
    emoji: '🎤',
  },
]

export function getRoleColor(roleName: string): string {
  const role = PRESET_ROLES.find(r => r.name === roleName)
  return role?.iconColor || '#6B7DFF'
}

export function getRoleEmoji(roleName: string): string {
  const role = PRESET_ROLES.find(r => r.name === roleName)
  return role?.emoji || '👤'
}

export function formatRoleName(role: RoleType): string {
  return role
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function isValidRole(roleName: string): boolean {
  return PRESET_ROLES.some(r => r.name === roleName)
}
