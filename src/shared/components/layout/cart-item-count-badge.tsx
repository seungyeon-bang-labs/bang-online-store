import { cn } from '@/shared/lib/utils';

interface CartItemCountBadgeProps {
  count: number | null;
  needsCheck?: boolean;
  className?: string;
}

export function getCartItemCountLabel(count: number): string {
  return count > 99 ? '99+' : String(count);
}

export function getCartAriaLabel(count: number | null, needsCheck = false): string {
  if (needsCheck) return count === null ? '장바구니, 확인 필요' : `장바구니, 상품 ${count}개, 확인 필요`;
  if (count === null) return '장바구니, 확인 중';
  return count > 0 ? `장바구니, 상품 ${count}개` : '장바구니';
}

export function CartItemCountBadge({
  count,
  needsCheck = false,
  className,
}: CartItemCountBadgeProps) {
  if (!needsCheck && (count === null || count <= 0)) return null;

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black px-1 text-[10px] leading-none font-bold tabular-nums text-white md:h-5 md:min-w-5',
        className,
        // The wider label grows leftward from the icon's edge instead of past the screen edge.
        needsCheck && 'whitespace-nowrap bg-amber-600 px-1.5 right-0',
      )}
    >
      {needsCheck
        ? count === null ? '확인 필요' : `${getCartItemCountLabel(count)} 확인 필요`
        : getCartItemCountLabel(count!)}
    </span>
  );
}
