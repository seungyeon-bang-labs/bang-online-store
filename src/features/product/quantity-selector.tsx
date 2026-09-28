'use client';

import { Minus, Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface QuantitySelectorProps {
  count: number;
  stock: number;
  onIncrease: () => void;
  onDecrease: () => void;
  className?: string;
}

export function QuantitySelector({
  count,
  stock,
  onIncrease,
  onDecrease,
  className,
}: QuantitySelectorProps) {
  const isMin = count <= 1;
  const isMax = count >= stock;

  return (
    <div
      className={cn(
        'flex items-center border border-gray-200 bg-white rounded-md overflow-hidden',
        className,
      )}
    >
      <Button
        onClick={onDecrease}
        size="icon-xs"
        variant="ghost"
        className="p-1.5 hover:bg-gray-50 text-gray-500 disabled:opacity-30 rounded-none"
        disabled={isMin}
      >
        <Minus strokeWidth={3} />
      </Button>
      <span className="w-8 text-center text-xs font-bold">{count}</span>
      <Button
        onClick={onIncrease}
        size="icon-xs"
        variant="ghost"
        className="p-1.5 hover:bg-gray-50 text-gray-500 disabled:opacity-30 rounded-none"
        disabled={isMax}
      >
        <Plus strokeWidth={3}/>
      </Button>
    </div>
  );
}
