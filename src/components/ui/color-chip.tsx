'use client';

import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const isLightColor = (hex: string) => {
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150;
};

interface ColorChipProps {
  label: string;
  hex: string;
  isSelected: boolean;
  onClick: () => void;
}

export function ColorChip({ label, hex, isSelected, onClick }: ColorChipProps) {
  const isLight = isLightColor(hex);

  return (
    <button
      type="button"
      className="flex flex-col items-center gap-2 group outline-none cursor-pointer"
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-transparent">
        <div
          className={cn(
            'w-10 h-10 rounded-full transition-all duration-150 group-hover:scale-105 flex items-center justify-center relative',
            isLight && 'border border-gray-300'
          )}
          style={{ backgroundColor: hex }}
        >
          {isSelected && (
            <Check
              className={cn(
                'w-5 h-5 animate-in zoom-in-50 duration-200',
                isLight ? 'text-black' : 'text-white'
              )}
              strokeWidth={4}
            />
          )}
        </div>
      </div>
      <span
        className={cn(
          'text-xs font-bold tracking-tight transition-colors leading-tight text-center',
          isSelected ? 'text-black' : 'text-gray-400 group-hover:text-black'
        )}
      >
        {label}
      </span>
    </button>
  );
}