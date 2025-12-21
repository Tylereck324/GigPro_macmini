'use client';

import clsx from 'clsx';
import { GIG_PLATFORMS } from '@/lib/constants/gigPlatforms';

interface PlatformSelectorProps {
  selected: string;
  onSelect: (platform: string) => void;
}

export function PlatformSelector({ selected, onSelect }: PlatformSelectorProps) {
  const options = [
    { value: 'all', label: 'All Platforms' },
    ...GIG_PLATFORMS
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={clsx(
            'px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border',
            selected === option.value
              ? 'bg-gradient-primary text-white border-transparent shadow-md scale-105'
              : 'bg-surface text-textSecondary border-border hover:bg-surfaceHover hover:border-primary/30'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
