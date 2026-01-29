import { cn } from '@/lib/utils';
import type { Role } from '@/lib/permissions';

interface RoleBadgeProps {
  role: Role | string;
  size?: 'sm' | 'md';
  className?: string;
}

const roleConfig: Record<Role, { label: string; className: string }> = {
  owner: {
    label: 'Owner',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  admin: {
    label: 'Admin',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  moderator: {
    label: 'Mod',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  member: {
    label: 'Member',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
};

/**
 * Visual badge displaying a user's role.
 * Only shows for non-member roles to reduce visual clutter.
 */
export function RoleBadge({ role, size = 'sm', className }: RoleBadgeProps) {
  // Don't show badge for regular members
  if (role === 'member') {
    return null;
  }

  const config = roleConfig[role as Role] ?? roleConfig.member;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
