export interface DiscountItemDTO {
  discountRate: number;
  productIds: number[];
}

export interface DiscountRuleDTO {
  id: number;
  title: string;
  items: DiscountItemDTO[];
  startDate: Date;
  endDate: Date;
  priority: number;
  isActive: boolean;
}

export type DiscountRule = DiscountRuleDTO;

