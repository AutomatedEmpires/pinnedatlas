import type { LocationCategory } from '../types';

export const categoryConfig: Record<
  LocationCategory,
  { label: string; emoji: string; bg: string; tailwind: string; text: string }
> = {
  hot_spring: {
    label: 'Hot Spring',
    emoji: '🌡️',
    bg: '#FF6B6B',
    tailwind: 'bg-red-400',
    text: 'text-white',
  },
  cave: {
    label: 'Cave',
    emoji: '🦇',
    bg: '#6B48FF',
    tailwind: 'bg-purple-600',
    text: 'text-white',
  },
  waterfall: {
    label: 'Waterfall',
    emoji: '💧',
    bg: '#0EA5E9',
    tailwind: 'bg-sky-500',
    text: 'text-white',
  },
};
