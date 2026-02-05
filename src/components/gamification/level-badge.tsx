interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function LevelBadge({ level, size = 'sm', className }: LevelBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full
        bg-primary/10 text-primary font-medium
        ${sizeClasses[size]}
        ${className || ''}
      `}
    >
      Lvl {level}
    </span>
  );
}
