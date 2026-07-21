export interface CouponCardViewModel {
  id: number;
  title: string;
  categoryText: string;
  discountValueText: string;
  discountUnitText?: string;
  isDiscountUnitSubtle: boolean;
  minOrderAmountText: string;
  expiryText: string;
  isStackable: boolean;
}

export interface CouponSectionViewModel {
  title: string;
  description: string;
  coupons: CouponCardViewModel[];
}
