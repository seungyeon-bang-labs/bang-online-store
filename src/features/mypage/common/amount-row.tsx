import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface MypageAmountRowProps {
  label: ReactNode;
  value: ReactNode;
  tone?: 'default' | 'discount' | 'payment' | 'refund' | 'positive' | 'total';
  className?: string;
}

const toneClassName = {
  default: 'text-black',
  discount: 'text-red-700',
  payment: 'text-blue-700',
  refund: 'text-red-700',
  positive: 'text-emerald-700',
  total: 'text-base leading-6 text-black',
};

export function MypageAmountRow({
  label,
  value,
  tone = 'default',
  className,
}: MypageAmountRowProps) {
  return (
    <div className={cn('flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm leading-5', className)}>
      <p className="font-bold text-zinc-500">{label}</p>
      <p className={cn('ml-auto max-w-full wrap-break-word text-right font-black tabular-nums', toneClassName[tone])}>
        {value}
      </p>
    </div>
  );
}
