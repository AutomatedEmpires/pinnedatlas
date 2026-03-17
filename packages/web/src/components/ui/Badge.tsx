import clsx from 'clsx';
import { categoryConfig } from '../../utils/categoryColors';
import type { Difficulty, ListingStatus, LocationCategory } from '../../types';

interface BadgeProps {
  variant: 'category' | 'difficulty' | 'status';
  value: string;
  className?: string;
}

const difficultyStyles: Record<Difficulty, string> = {
  easy: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-orange-100 text-orange-800',
  expert: 'bg-red-100 text-red-800',
};

const statusStyles: Record<ListingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function Badge({ variant, value, className }: BadgeProps) {
  let content = value;
  let style = '';
  let inlineStyle: React.CSSProperties | undefined;

  if (variant === 'category') {
    const cat = categoryConfig[value as LocationCategory];
    if (cat) {
      content = `${cat.emoji} ${cat.label}`;
      inlineStyle = { backgroundColor: cat.bg };
      style = 'text-white';
    }
  } else if (variant === 'difficulty') {
    style = difficultyStyles[value as Difficulty] || 'bg-gray-100 text-gray-800';
    const formatted = value.charAt(0).toUpperCase() + value.slice(1);
    content = formatted;
  } else if (variant === 'status') {
    style = statusStyles[value as ListingStatus] || 'bg-gray-100 text-gray-800';
    content = value.charAt(0).toUpperCase() + value.slice(1);
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        style,
        className
      )}
      style={inlineStyle}
    >
      {content}
    </span>
  );
}
