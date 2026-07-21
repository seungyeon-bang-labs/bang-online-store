import type { DiscountRuleDTO } from './discount.dto';

export const DISCOUNTS: DiscountRuleDTO[] = [
  {
    id: 1,
    title: '겨울 시즌 마지막 세일',
    items: [
      { discountRate: 20, productIds: [1, 2, 3] },
      { discountRate: 10, productIds: [4, 5] },
    ],
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-04-30'),
    priority: 1,
    isActive: true,
  },
  {
    id: 2,
    title: '봄 시즌 세일',
    items: [
      { discountRate: 15, productIds: [6, 7, 8] },
      { discountRate: 5, productIds: [9, 10] },
    ],
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-04-30'),
    priority: 2,
    isActive: true,
  },
  {
    id: 3,
    title: '여름 시즌 세일',
    items: [
      { discountRate: 25, productIds: [11, 12, 13] },
      { discountRate: 10, productIds: [14, 15] },
    ],
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-04-30'),
    priority: 1,
    isActive: true,
  },
];
