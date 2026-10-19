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

export type DiscountCampaignDTO = {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string;
  priority: number;
  is_active: boolean;
};

export type DiscountCandidateDTO = {
  discount_id: number;
  product_id: number;
  discount_rate: number;
  discount: DiscountCampaignDTO;
};

export type AppliedProductDiscount = {
  discountRate: number;
  appliedDiscountId: number | null;
};
