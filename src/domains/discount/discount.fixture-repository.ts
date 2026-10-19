import { DISCOUNTS } from './discount.fixture';
import type { AppliedProductDiscount, DiscountCandidateDTO } from './discount.dto';

export const fixtureDiscountRepository = {
  async findByProductIds(ids: readonly number[]): Promise<readonly DiscountCandidateDTO[]> {
    const productIds = new Set(ids);
    return DISCOUNTS.flatMap(rule => rule.items.flatMap(item =>
      item.productIds.filter(id => productIds.has(id)).map(productId => ({
        product_id: productId, discount_id: rule.id, discount_rate: item.discountRate,
        discount: {
          id: rule.id, title: rule.title, priority: rule.priority, is_active: rule.isActive,
          starts_at: rule.startDate.toISOString(), ends_at: rule.endDate.toISOString(),
        },
      }))));
  },
};

// Historical demo orders retain their discounts after the fixture campaign expires.
export function selectFixtureProductDiscount(
  productId: number,
  candidates: readonly DiscountCandidateDTO[],
): AppliedProductDiscount {
  const selected = candidates.filter(candidate =>
    candidate.product_id === productId && candidate.discount.is_active)
    .sort((a, b) => b.discount.priority - a.discount.priority || a.discount_id - b.discount_id)[0];
  return selected
    ? { discountRate: selected.discount_rate, appliedDiscountId: selected.discount_id }
    : { discountRate: 0, appliedDiscountId: null };
}
