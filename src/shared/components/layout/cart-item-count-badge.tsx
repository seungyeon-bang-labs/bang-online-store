import { cn } from '@/shared/lib/utils';

interface CartItemCountBadgeProps {
  count: number;
  className?: string;
}

export function getCartItemCountLabel(count: number): string {
  return count > 99 ? '99+' : String(count);
}

export function getCartAriaLabel(count: number): string {
  return count > 0 ? `장바구니, 상품 ${count}개` : '장바구니';
}

export function CartItemCountBadge({
  count,
  className,
}: CartItemCountBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black px-1 text-[10px] leading-none font-bold tabular-nums text-white md:h-5 md:min-w-5',
        className,
      )}
    >
      {getCartItemCountLabel(count)}
    </span>
  );
}
