import type { AppliedProductDiscount, DiscountCandidateDTO } from './discount.dto';

// Date has millisecond precision. Round a finer DB boundary up so comparisons
// against integer-millisecond app clocks preserve the original instant ordering.
export function getDiscountBoundaryMilliseconds(iso: string): number {
  const milliseconds = Date.parse(iso);
  if (!Number.isFinite(milliseconds)) {
    throw new Error('할인 기간 정보를 확인하지 못했습니다.');
  }
  const fraction = iso.match(/\.(\d+)(?:Z|[+-]\d{2}(?::?\d{2})?)$/i)?.[1] ?? '';
  return milliseconds + (/[1-9]/.test(fraction.slice(3)) ? 1 : 0);
}

export function selectProductDiscount(
  productId: number,
  candidates: readonly DiscountCandidateDTO[],
  now: Date,
): AppliedProductDiscount {
  const time = now.getTime();
  const selected = candidates
    .filter(candidate => candidate.product_id === productId
      && candidate.discount.is_active
      && getDiscountBoundaryMilliseconds(candidate.discount.starts_at) <= time
      && time < getDiscountBoundaryMilliseconds(candidate.discount.ends_at))
    .sort((a, b) => b.discount.priority - a.discount.priority || a.discount_id - b.discount_id)[0];

  return selected
    ? { discountRate: selected.discount_rate, appliedDiscountId: selected.discount_id }
    : { discountRate: 0, appliedDiscountId: null };
}
