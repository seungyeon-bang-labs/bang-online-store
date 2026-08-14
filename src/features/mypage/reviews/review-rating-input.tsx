'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';
import { REVIEW_RATING_MAX } from '@/domains/activity/domain';
import { cn } from '@/shared/lib/utils';

interface ReviewRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  invalid?: boolean;
  describedBy?: string;
}

export function ReviewRatingInput({
  value,
  onChange,
  invalid = false,
  describedBy,
}: ReviewRatingInputProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const previewRating = hoveredRating ?? value;

  return (
    <div
      aria-label="별점"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className="flex items-center gap-1"
      onMouseLeave={() => setHoveredRating(null)}
    >
      {Array.from({ length: REVIEW_RATING_MAX }, (_, index) => {
        const rating = index + 1;
        const selected = rating <= previewRating;

        return (
          <button
            key={rating}
            type="button"
            aria-label={`${rating}점`}
            aria-pressed={value === rating}
            onMouseEnter={() => setHoveredRating(rating)}
            onClick={() => onChange(rating)}
            className="inline-flex size-9 items-center justify-center text-zinc-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            <Star
              aria-hidden="true"
              className={cn(
                'size-6',
                selected && 'fill-amber-400 text-amber-400',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
